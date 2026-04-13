import { IConfigService } from './IConfigService';
import {
    IParamsFECAESolicitar,
    IParamsFECompUltimoAutorizado,
    IParamsFEParamGetCondicionIvaReceptor,
    IResponseFECompUltimoAutorizado,
    WsServicesNames,
} from './SoapMethods';
import { AfipSoap } from './lib/AfipSoap';

export class AfipServices {
    private afipSoap: AfipSoap;

    constructor(private config: IConfigService) {
        this.afipSoap = new AfipSoap(config);
    }

    public createBill(params: IParamsFECAESolicitar) {
        const service = `wsfev1`;
        const method = `FECAESolicitar`;
        return this.afipSoap.execMethod(service, method, params);
    }

    public getLastBillNumber(
        params: IParamsFECompUltimoAutorizado
    ): Promise<IResponseFECompUltimoAutorizado> {
        const service = `wsfev1`;
        const method = `FECompUltimoAutorizado`;
        return this.afipSoap.execMethod(
            service,
            method,
            params
        ) as Promise<IResponseFECompUltimoAutorizado>;
    }

    public getVatReceiverConditions(
        params: IParamsFEParamGetCondicionIvaReceptor = {}
    ) {
        const service = `wsfev1`;
        const method = `FEParamGetCondicionIvaReceptor`;
        return this.afipSoap.execMethod(service, method, params);
    }

    public execRemote<TResponse = unknown>(
        service: string,
        method: string,
        params: {
            Auth?: Record<string, unknown>;
            params?: Record<string, unknown>;
        }
    ): Promise<TResponse> {
        return this.afipSoap.execMethod(
            service as WsServicesNames,
            method,
            params
        ) as Promise<TResponse>;
    }
}
