import { IConfigService } from './IConfigService';
import {
    IParamsFECAESolicitar,
    IParamsFECompUltimoAutorizado,
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

    public getLastBillNumber(params: IParamsFECompUltimoAutorizado) {
        const service = `wsfev1`;
        const method = `FECompUltimoAutorizado`;
        return this.afipSoap.execMethod(service, method, params);
    }

    public execRemote(service: string, method: string, params: any) {
        return this.afipSoap.execMethod(
            service as WsServicesNames,
            method,
            params
        );
    }
}
