import {IConfigService} from "./AfipServices";
import {debug, parseXml, LOG, writeFile, readFile, signMessage} from "./util";
import moment = require("moment");
import * as soap from "soap";
import {WsServicesNames} from "./SoapMethods";
import NTPClient from "ntpclient";

interface IPromiseReadFile {
    [path: string]: Promise<string>;
}

type SoapServiceAlias = {
    [K in WsServicesNames]?: WsServicesNames;
}

export interface ICredential {
    tokens: {
        token: string;
        sign: string;
    }
    created: string;
    service: WsServicesNames;
}

type ICredentialsCache = {
    [K in WsServicesNames]?: ICredential
}


export class AfipHelper {
    private promiseFiles: IPromiseReadFile = {};
    private tokensAliasServices: SoapServiceAlias = {
        'wsfev1': 'wsfe'
    };

    private urls = {
        homo: {
            service: 'https://wswhomo.afip.gov.ar/{name}/service.asmx?wsdl',
            login: 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms?wsdl'
        },
        prod: {
            service: 'https://servicios1.afip.gov.ar/{name}/service.asmx?WSDL',
            login: 'https://wsaa.afip.gov.ar/ws/services/LoginCms?wsdl'
        },
    };

    constructor(private config: IConfigService) {

    }

    execMethod(service: WsServicesNames, method: string, params: any) {
        debug(LOG.INFO, 'execMethod name', method);
        debug(LOG.INFO, 'execMethod params', params);
        return this.getTokens(service).then(tokens => {
            params['Auth'] = {...params['Auth'], ...{Token: tokens.tokens.token, Sign: tokens.tokens.sign}};
            params = {...params, ...params['params']};
            return Promise.all([this.getSoapClient(service), Promise.resolve(params)]);
        }).then(([client, params]) => {
            const call = client[method + 'Async'];
            return call(params).then(([result, rawResponse]: [any, any]) => {
                debug(LOG.DEBUG, 'execMethod rawResponse', rawResponse);
                const methodResponse = result[method + 'Result'];
                this.throwResponseError(methodResponse);
                return methodResponse;
            });
        })
    }

    getTokens(service: WsServicesNames) {
        return this.retrieveTokens(this.tokensAliasServices[service] || service);
    }


    private getAfipEnvironment(): 'homo' | 'prod' {
        return this.config.homo ? 'homo' : 'prod';
    }

    private getSoapClient(serviceName: WsServicesNames): any {
        const urls = this.urls[this.getAfipEnvironment()];
        const type = serviceName === 'login' ? 'login' : 'service';
        const url = urls[type].replace('{name}', encodeURIComponent(serviceName))
        return soap.createClientAsync(url, {
            namespaceArrayElements: false
        });
    }

    private retrieveTokens(service: WsServicesNames) {
        return this.getTokensFromCache(service).then((val) => {
            if (val) {
                debug(LOG.INFO, 'Read config from cache');
                return val;
            }
            return this.getTokensFromNetwork(service).then(tokens => {
                debug(LOG.DEBUG, 'Tokens from network:', tokens);
                if (tokens) {
                    this.saveCredentialsCache(service, tokens);
                }
                return tokens;
            })
        })
    }


    private getTokensFromNetwork(service: WsServicesNames) {
        return Promise.all([
            this.signService(service),
            this.getSoapClient('login')
        ]).then(([signedData, client]) => {
            debug(LOG.INFO, 'Asking tokens from network');
            return client.loginCmsAsync({in0: signedData}).then((result: [any]) => {
                return result[0].loginCmsReturn;
            }).then((loginCmsReturn: string) => {
                return parseXml(loginCmsReturn).then((res: any) => ({
                    created: moment().format(),
                    tokens: res.loginTicketResponse.credentials,
                    service: service
                }))
            })
        })
    }

    private saveCredentialsCache(service: WsServicesNames, credential: ICredential) {
        this.getCredentialsCacheAll(this.config.cacheTokensPath).then((cache: ICredentialsCache) => {
            cache[service] = credential;
            return cache;
        }).then((cache: ICredentialsCache) => {
            debug(LOG.INFO, 'Write config to cache');
            return writeFile(this.config.cacheTokensPath, JSON.stringify(cache))
        })
    }

    private getCredentialsCacheAll(path: string) {
        return new Promise<ICredentialsCache>((resolve) => {
            readFile(path).then(raw => {
                const r: ICredentialsCache = JSON.parse(raw.toString());
                return resolve(r);
            }).catch((reason) => {
                if (reason.code === 'ENOENT') {
                    debug(LOG.WARN, 'Cache file does not exists.');
                } else {
                    debug(LOG.ERROR, 'Fail to read cache file: ', reason);
                }
                resolve({});
            })
        })
    }

    private getTokensFromCache(service: WsServicesNames) {
        return this.getCredentialsCacheAll(this.config.cacheTokensPath).then(cache => {
            if (cache[service] && !this.isExpired(cache[service]!.created)) {
                return cache[service];
            }
        })
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
        const [cert, privateKey] = await this.readKeys();
        return signMessage(this.getLoginXml(service, date), cert, privateKey);
    }


    private getNetworkHour() {
        return new NTPClient("time.afip.gov.ar", 123)
            .getNetworkTime();
    }

    private getLoginXml(service: string, networkTime: Date): string {
        const expire = moment(networkTime).add(this.config.tokensExpireInHours, 'hours');
        const formatDate = (date: Date | moment.Moment) => moment(date).format().replace('-03:00', '');
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

    private async readKeys() {
        if (!this.config.certContents || !this.config.privateKeyContents) {
            this.config.certContents = await this.readFile(
                this.config.certPath as string
            );
            this.config.privateKeyContents = await this.readFile(
                this.config.privateKeyPath as string
            );
        }
        return [
            this.config.certContents as string,
            this.config.privateKeyContents as string
        ];
    }

    private readFile(path: string) {
        if (this.promiseFiles[path]) {
            return this.promiseFiles[path];
        }
        return readFile(path).then(buffer => buffer.toString('utf8'));
    }
}
