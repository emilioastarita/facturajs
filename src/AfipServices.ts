import { AfipHelper } from './AfipHelper';
import { IConfigService } from './IConfigService';
import {
    FECAESolicitarResult,
    FECompUltimoAutorizadoResult,
    ParamsFECAESolicitar,
    ParamsFECompUltimoAutorizado,
    WsServicesNames,
} from './SoapMethods';

export class AfipServices {
    private afipHelper: AfipHelper;

    constructor(private config: IConfigService) {
        this.afipHelper = new AfipHelper(config);
    }

    public createBill(params: ParamsFECAESolicitar): Promise<FECAESolicitarResult> {
        const service = "wsfev1";
        const method = "FECAESolicitar";
        return this.afipHelper.execMethod(service, method, params);
    }

    public getLastBillNumber(params: ParamsFECompUltimoAutorizado): Promise<FECompUltimoAutorizadoResult> {
        const service = "wsfev1";
        const method = "FECompUltimoAutorizado";
        return this.afipHelper.execMethod(service, method, params);
    }

    public execRemote(service: WsServicesNames, method: string, params: any): Promise<any> {
        return this.afipHelper.execMethod(
            service,
            method,
            params
        );
    }
}
