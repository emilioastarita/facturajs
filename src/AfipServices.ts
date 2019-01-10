import {IParamsFECAESolicitar, IParamsFECompUltimoAutorizado, WsServicesNames} from "./SoapMethods";
import {AfipHelper, IConfigService} from "./AfipHelper";
export {IConfigService} from "./AfipHelper";

export class AfipServices {
    private afipHelper: AfipHelper;

    constructor(private config: IConfigService) {
        this.afipHelper = new AfipHelper(config);
    }

    createBill(params: IParamsFECAESolicitar) {
        const service = `wsfev1`;
        const method = `FECAESolicitar`;
        return this.afipHelper.execMethod(service, method, params)
    }

    getLastBillNumber(params: IParamsFECompUltimoAutorizado) {
        const service = `wsfev1`;
        const method = `FECompUltimoAutorizado`;
        return this.afipHelper.execMethod(service, method, params)
    }

    execRemote(service : string, method : string, params : any) {
        return this.afipHelper.execMethod(<WsServicesNames>service, method, params);
    }

}
