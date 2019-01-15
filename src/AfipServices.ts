import {AfipHelper} from "./AfipHelper";
import {IConfigService} from "./IConfigService";
import {IParamsFECAESolicitar, IParamsFECompUltimoAutorizado, WsServicesNames} from "./SoapMethods";

export class AfipServices {

    private afipHelper: AfipHelper;

    constructor(private config: IConfigService) {
        this.afipHelper = new AfipHelper(config);
    }

    public createBill(params: IParamsFECAESolicitar) {
        const service = `wsfev1`;
        const method = `FECAESolicitar`;
        return this.afipHelper.execMethod(service, method, params)
    }

    public getLastBillNumber(params: IParamsFECompUltimoAutorizado) {
        const service = `wsfev1`;
        const method = `FECompUltimoAutorizado`;
        return this.afipHelper.execMethod(service, method, params)
    }

    private execRemote(service: string, method: string, params: any) {
        return this.afipHelper.execMethod(service as WsServicesNames, method, params);
    }

}
