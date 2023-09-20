import moment from 'moment';
import { NTPClient } from 'ntpclient';
import * as soap from 'soap';
import { IConfigService } from './IConfigService';
import { WsServicesNames } from './SoapMethods';
import { debug, LOG, parseXml, readFile, signMessage, writeFile } from './util';
import request from "request";

type SoapServiceAlias = {
    [K in WsServicesNames]?: WsServicesNames;
};

interface ICredential {
    tokens: {
        token: string;
        sign: string;
    };
    created: string;
    service: WsServicesNames;
}

type ICredentialsCache = {
    [K in WsServicesNames]?: ICredential;
};

export class AfipHelper {
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

    constructor(private config: IConfigService) { }

    public execMethod(service: WsServicesNames, method: string, params: any) {
        debug(LOG.INFO, 'execMethod name', method);
        debug(LOG.INFO, 'execMethod params', params);
        return this.getTokens(service)
            .then((tokens) => {
                params.Auth = {
                    ...params.Auth,
                    ...{ Token: tokens.tokens.token, Sign: tokens.tokens.sign },
                };
                params = { ...params, ...params.params };
                return Promise.all([
                    this.getSoapClient(service),
                    Promise.resolve(params),
                ]);
            })
            .then(([client, p]) => {
                const call = client[method + 'Async'];
                return call(p).then(([result, rawResponse]: [any, any]) => {
                    debug(LOG.DEBUG, 'execMethod rawResponse', rawResponse);
                    const methodResponse = result[method + 'Result'];
                    this.throwResponseError(methodResponse);
                    return methodResponse;
                });
            });
    }

    public getTokens(service: WsServicesNames) {
        return this.retrieveTokens(
            this.tokensAliasServices[service] ?? service
        );
    }

    private getAfipEnvironment(): 'homo' | 'prod' {
        return this.config.homo ? 'homo' : 'prod';
    }

    private getSoapClient(serviceName: WsServicesNames) {
        const urls = this.urls[this.getAfipEnvironment()];
        const type = serviceName === 'login' ? 'login' : 'service';
        const url = urls[type].replace(
            '{name}',
            encodeURIComponent(serviceName)
        );

        return soap.createClientAsync(url, {
            namespaceArrayElements: false,
            // request: request.defaults({ timeout: 15000 }),
        });
    }

    private retrieveTokens(service: WsServicesNames) {
        return this.getTokensFromCache(service).then((val) => {
            if (val) {
                debug(LOG.INFO, 'Read config from cache');
                return val;
            }
            return this.getTokensFromNetwork(service).then((tokens) => {
                debug(LOG.DEBUG, 'Tokens from network:', tokens);
                if (tokens) {
                    this.saveCredentialsCache(service, tokens);
                }
                return tokens;
            });
        });
    }

    private getTokensFromNetwork(service: WsServicesNames) {
        return Promise.all([
            this.signService(service),
            this.getSoapClient('login'),
        ]).then(([signedData, client]) => {
            debug(LOG.INFO, 'Asking tokens from network');
            return client
                .loginCmsAsync({ in0: signedData })
                .then((result: [any]) => {
                    return result[0].loginCmsReturn;
                })
                .then((loginCmsReturn: string) => {
                    return parseXml(loginCmsReturn).then((res: any) => ({
                        created: moment().format(),
                        service,
                        tokens: res.loginTicketResponse.credentials,
                    }));
                });
        });
    }

    private saveCredentialsCache(
        service: WsServicesNames,
        credential: ICredential
    ) {
        this.getCredentialsCacheAll(this.config.cacheTokensPath)
            .then((cache: ICredentialsCache) => {
                cache[service] = credential;
                return cache;
            })
            .then((cache: ICredentialsCache) => {
                debug(LOG.INFO, 'Write config to cache');
                return writeFile(
                    this.config.cacheTokensPath,
                    JSON.stringify(cache)
                );
            });
    }

    private getCredentialsCacheAll(path: string) {
        return new Promise<ICredentialsCache>((resolve) => {
            readFile(path)
                .then((raw) => {
                    const r: ICredentialsCache = JSON.parse(raw.toString());
                    return resolve(r);
                })
                .catch((reason) => {
                    if (reason.code === 'ENOENT') {
                        debug(LOG.WARN, 'Cache file does not exists.');
                    } else {
                        debug(LOG.ERROR, 'Fail to read cache file: ', reason);
                    }
                    resolve({});
                });
        });
    }

    private getTokensFromCache(service: WsServicesNames) {
        return this.getCredentialsCacheAll(this.config.cacheTokensPath).then(
            (cache) => {
                if (
                    cache[service] &&
                    !this.isExpired(cache[service]!.created)
                ) {
                    return cache[service];
                }
            }
        );
    }

    private isExpired(expireStr: string) {
        const now = moment(new Date());
        const expire = moment(expireStr);
        const duration = moment.duration(now.diff(expire));
        return duration.asHours() > this.config.tokensExpireInHours;
    }

    private throwResponseError(response: any) {
        if (!response.Errors) {
            return;
        }
        if (!response.Errors.Err) {
            return;
        }
        const resErr = response.Errors.Err[0];
        const err: any = new Error(resErr.Msg);
        err.name = 'AfipResponseError';
        err.code = resErr.Code;
        throw err;
    }

    private async signService(service: string) {
        const date = await this.getNetworkHour();
        const [cert, privateKey] = await this.getKeys();
        return signMessage(this.getLoginXml(service, date), cert, privateKey);
    }

    private getNetworkHour() {
        return new NTPClient('time.afip.gov.ar', 123).getNetworkTime();
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

    private async getCert(): Promise<string> {
        if (this.config.certContents) {
            return this.config.certContents;
        }
        if (this.config.certPath) {
            return await this.readFile(this.config.certPath);
        }
        throw new Error('Not cert');
    }

    private async getPrivateKey(): Promise<string> {
        if (this.config.privateKeyContents) {
            return this.config.privateKeyContents;
        }
        if (this.config.privateKeyPath) {
            return await this.readFile(this.config.privateKeyPath);
        }
        throw new Error('Not private key');
    }

    private async getKeys() {
        return [await this.getCert(), await this.getPrivateKey()];
    }

    private async readFile(path: string): Promise<string> {
        return (await readFile(path)).toString('utf8');
    }
}
