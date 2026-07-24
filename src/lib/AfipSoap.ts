import { Agent, AgentOptions } from 'https';
import moment from 'moment';
import * as soap from 'soap';
import { IConfigService } from '../IConfigService';
import { WsServicesNames } from '../SoapMethods';
import {
    debug,
    LOG,
    parseXml,
    readStringFromFile,
    signMessage,
    writeFile,
} from '../util';
import { NtpTimeSync } from 'ntp-time-sync';

type SoapServiceAlias = {
    [K in WsServicesNames]?: WsServicesNames;
};

interface ICredential {
    tokens: {
        token: string;
        sign: string;
    };
    created: string;
    expires?: string;
    service: WsServicesNames;
}

const DEFAULT_TOKENS_EXPIRE_MARGIN_SECONDS = 600;

type ICredentialsCache = {
    [K in WsServicesNames]?: ICredential;
};

type SoapRequestArgs = Parameters<soap.HttpClient['request']>;
type SoapRequestResult = ReturnType<soap.HttpClient['request']>;
type SoapRequestStreamArgs = Parameters<
    NonNullable<soap.HttpClient['requestStream']>
>;

interface IRemoteMethodParams {
    Auth?: Record<string, unknown>;
    params?: Record<string, unknown>;
}

interface ILoginCmsResponse {
    loginCmsReturn: string;
}

interface IAfipErrorItem {
    Code: string | number;
    Msg: string;
}

interface IAfipErrorResponse {
    Errors?: {
        Err?: IAfipErrorItem[];
    };
}

interface IAfipResponseError extends Error {
    code: string | number;
}

/**
 * `soap`'s HttpClient reports a transport failure twice: once through the
 * `callback` it was handed, and once through the promise it returns. Its own
 * callers only read the callback and discard the promise — but in soap <=1.4.x
 * `Client._invoke` is an `async` method whose last statement is
 * `return this.httpClient.request(...)`. The `async` wrapper makes a fresh
 * promise adopt that rejection, and `Client._defineMethod` throws it away, so
 * the already-handled error resurfaces as a process-level `unhandledRejection`.
 * AFIP resets connections often enough for this to be a daily occurrence in
 * production.
 *
 * The callback is the channel soap actually reads, so the returned promise can
 * safely be neutralised: keep the fulfilled response, drop the rejection.
 */
function withoutFloatingRejection(
    pending: SoapRequestResult
): SoapRequestResult {
    return pending.then(
        (response) => response,
        () => undefined
    ) as SoapRequestResult;
}

class ConfiguredHttpClient extends soap.HttpClient {
    constructor(
        private readonly defaultRequestOptions: Record<string, unknown>,
        options?: soap.IOptions
    ) {
        super(options);
    }

    request(
        rurl: SoapRequestArgs[0],
        data: SoapRequestArgs[1],
        callback: SoapRequestArgs[2],
        exheaders?: SoapRequestArgs[3],
        exoptions?: SoapRequestArgs[4],
        _caller?: unknown
    ): SoapRequestResult {
        return withoutFloatingRejection(
            super.request(rurl, data, callback, exheaders, {
                ...this.defaultRequestOptions,
                ...exoptions,
            })
        );
    }

    // Not neutralised on purpose: in streaming mode the returned promise is the
    // only channel soap has for reporting errors, and `Client._invoke` does
    // attach a rejection handler to it.
    requestStream(
        rurl: SoapRequestStreamArgs[0],
        data: SoapRequestStreamArgs[1],
        exheaders?: SoapRequestStreamArgs[2],
        exoptions?: SoapRequestStreamArgs[3],
        _caller?: unknown
    ) {
        return super.requestStream(rurl, data, exheaders, {
            ...this.defaultRequestOptions,
            ...exoptions,
        });
    }
}

export class AfipSoap {
    private tokensAliasServices: SoapServiceAlias = {
        wsfev1: 'wsfe',
    };
    private urls = {
        homo: {
            login: 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms?wsdl',
            service: 'https://wswhomo.afip.gov.ar/{name}/service.asmx?wsdl',
        },
        prod: {
            login: 'https://wsaa.afip.gov.ar/ws/services/LoginCms?wsdl',
            service: 'https://servicios1.afip.gov.ar/{name}/service.asmx?WSDL',
        },
    };

    constructor(private config: IConfigService) {}

    private getTlsRequestOptions(): Record<string, unknown> {
        const tlsRequestOptions: AgentOptions = {
            ...(this.config.tlsRequestOptions || {}),
        };

        if (
            this.config.useLegacyTls !== false &&
            typeof tlsRequestOptions.ciphers === 'undefined'
        ) {
            tlsRequestOptions.ciphers = 'DEFAULT@SECLEVEL=1';
        }

        if (Object.keys(tlsRequestOptions).length === 0) {
            return {};
        }

        return {
            httpsAgent: new Agent(tlsRequestOptions),
        };
    }

    private async getTokens(service: WsServicesNames): Promise<ICredential> {
        const aliasedService = this.tokensAliasServices[service] || service;
        return this.retrieveTokens(aliasedService);
    }

    private async retrieveTokens(
        service: WsServicesNames
    ): Promise<ICredential> {
        const cacheTokens = await this.getTokensFromCache(service);
        if (cacheTokens) {
            debug(LOG.INFO, 'Read config from cache');
            return cacheTokens;
        }
        const fromNetwork = await this.getTokensFromNetwork(service);
        debug(LOG.DEBUG, 'Tokens from network:', fromNetwork);
        if (fromNetwork) {
            await this.saveCredentialsCache(service, fromNetwork);
        }
        return fromNetwork;
    }

    private async saveCredentialsCache(
        service: WsServicesNames,
        credential: ICredential
    ) {
        const cache: ICredentialsCache = await AfipSoap.getCredentialsCacheAll(
            this.config.cacheTokensPath
        );
        cache[service] = credential;
        debug(LOG.INFO, 'Write config to cache');
        await writeFile(this.config.cacheTokensPath, JSON.stringify(cache));
    }

    private static async getCredentialsCacheAll(
        path: string
    ): Promise<ICredentialsCache> {
        try {
            const raw = await readStringFromFile(path);
            return JSON.parse(raw) as ICredentialsCache;
        } catch (e: unknown) {
            if (this.isErrnoException(e) && e.code === 'ENOENT') {
                debug(LOG.WARN, 'Cache file does not exists.');
            } else {
                debug(LOG.ERROR, 'Fail to read cache file: ', e);
            }
            return {};
        }
    }

    private static isErrnoException(e: unknown): e is NodeJS.ErrnoException {
        return typeof e === 'object' && e !== null && 'code' in e;
    }

    private getLoginXml(service: string, networkTime: Date): string {
        const expire = moment(networkTime).add(
            this.config.tokensExpireInHours,
            'hours'
        );
        const formatDate = (date: Date | moment.Moment) =>
            moment(date).format().replace('-03:00', '');
        const xml = `
            <?xml version="1.0" encoding="UTF-8" ?>
            <loginTicketRequest version="1.0">
            <header>
            <uniqueId>${moment().format('X')}</uniqueId>
            <generationTime>${formatDate(networkTime)}</generationTime>
            <expirationTime>${formatDate(expire)}</expirationTime>
            </header>
            <service>${service}</service>
            </loginTicketRequest>
            `;
        return xml.trim();
    }

    private async signService(service: string): Promise<string> {
        const date = await AfipSoap.getNetworkHour();
        const [cert, privateKey] = await this.getKeys();
        return signMessage(this.getLoginXml(service, date), cert, privateKey);
    }

    private static async getNetworkHour(): Promise<Date> {
        const timeSync = NtpTimeSync.getInstance({
            servers: ['time.afip.gov.ar'],
        });
        const res = await timeSync.getTime();
        return res.now;
    }

    private async getKeys() {
        return [await this.getCert(), await this.getPrivateKey()];
    }

    private async getCert(): Promise<string> {
        if (this.config.certContents) {
            return this.config.certContents;
        }
        if (this.config.certPath) {
            return await readStringFromFile(this.config.certPath);
        }
        throw new Error('Not cert');
    }

    private async getPrivateKey(): Promise<string> {
        if (this.config.privateKeyContents) {
            return this.config.privateKeyContents;
        }
        if (this.config.privateKeyPath) {
            return await readStringFromFile(this.config.privateKeyPath);
        }
        throw new Error('Not private key');
    }

    private getSoapClient(serviceName: WsServicesNames): Promise<soap.Client> {
        const urls = this.urls[this.getAfipEnvironment()];
        const type = serviceName === 'login' ? 'login' : 'service';
        const url = urls[type].replace(
            '{name}',
            encodeURIComponent(serviceName)
        );
        const tlsRequestOptions = this.getTlsRequestOptions();
        const options: soap.IOptions = {
            namespaceArrayElements: false,
        };

        if (Object.keys(tlsRequestOptions).length > 0) {
            options.wsdl_options = tlsRequestOptions;
        }

        // Always installed, even without TLS overrides: this client is also what
        // keeps soap from leaking unhandled rejections.
        options.httpClient = new ConfiguredHttpClient(
            tlsRequestOptions,
            options
        );

        return soap.createClientAsync(url, options);
    }

    private getAfipEnvironment(): 'homo' | 'prod' {
        return this.config.homo ? 'homo' : 'prod';
    }

    private async getTokensFromNetwork(
        service: WsServicesNames
    ): Promise<ICredential> {
        const [signedData, client] = await Promise.all([
            this.signService(service),
            this.getSoapClient('login'),
        ]);
        debug(LOG.INFO, 'Asking tokens from network');
        const [result]: [ILoginCmsResponse] = await client.loginCmsAsync({
            in0: signedData,
        });
        const loginCmsReturn = result.loginCmsReturn;
        const res = await parseXml<{
            loginTicketResponse: {
                header?: {
                    generationTime?: string;
                    expirationTime?: string;
                };
                credentials: {
                    token: string;
                    sign: string;
                };
            };
        }>(loginCmsReturn);
        return {
            created: moment().format(),
            expires: res.loginTicketResponse.header?.expirationTime,
            service,
            tokens: res.loginTicketResponse.credentials,
        };
    }

    private isExpired(credential: ICredential): boolean {
        const marginSeconds =
            this.config.tokensExpireMarginSeconds ??
            DEFAULT_TOKENS_EXPIRE_MARGIN_SECONDS;
        // Prefer the real expiration granted by WSAA. Credentials cached by
        // older versions only have `created`, so fall back to estimating from
        // the configured lifetime.
        const expire = credential.expires
            ? moment(credential.expires)
            : moment(credential.created).add(
                  this.config.tokensExpireInHours,
                  'hours'
              );
        if (!expire.isValid()) {
            return true;
        }
        // Refresh ahead of the actual expiration: the token must survive
        // request latency and any clock drift against AFIP servers.
        return moment().isSameOrAfter(
            expire.subtract(marginSeconds, 'seconds')
        );
    }

    private async getTokensFromCache(
        service: WsServicesNames
    ): Promise<ICredential | null> {
        const cache = await AfipSoap.getCredentialsCacheAll(
            this.config.cacheTokensPath
        );
        const cacheService =
            typeof cache[service] === 'undefined' ? null : cache[service];

        if (cacheService && !this.isExpired(cacheService)) {
            return cacheService;
        }
        return null;
    }

    public async execMethod(
        service: WsServicesNames,
        method: string,
        params: IRemoteMethodParams
    ): Promise<unknown> {
        debug(LOG.INFO, 'execMethod name', method);
        debug(LOG.INFO, 'execMethod params', params);
        const cred = await this.getTokens(service);
        debug(LOG.INFO, 'TOKENS', cred.tokens);

        const paramsWithAuth = {
            Auth: {
                ...params.Auth,
                Token: cred.tokens.token,
                Sign: cred.tokens.sign,
            },
            ...params.params,
        };
        debug(LOG.INFO, 'execMethod params with AUTH', params);
        const client = await this.getSoapClient(service);
        const call = client[method + 'Async'] as
            | ((
                  args: Record<string, unknown>
              ) => Promise<[Record<string, unknown>, unknown]>)
            | undefined;

        if (!call) {
            throw new Error(`SOAP method not found: ${method}Async`);
        }

        const [result, rawResponse] = await call(paramsWithAuth);
        debug(LOG.DEBUG, 'execMethod rawResponse', rawResponse);
        const methodResponse = result[method + 'Result'];
        AfipSoap.throwOnError(methodResponse);
        return methodResponse;
    }

    private static throwOnError(response: unknown): void {
        const errorResponse = response as IAfipErrorResponse;

        if (!errorResponse.Errors) {
            return;
        }
        if (!errorResponse.Errors.Err) {
            return;
        }
        const resErr = errorResponse.Errors.Err[0];
        const err = new Error(resErr.Msg) as IAfipResponseError;
        err.name = 'AfipResponseError';
        err.code = resErr.Code;
        throw err;
    }
}
