import { ResultGet14 } from './ResultGet14';
import { Errors } from './Errors';
import { Events } from './Events';

/**
 * FEParamGetActividadesResult
 * @targetNSAlias `tns`
 * @targetNamespace `http://ar.gov.afip.dif.FEV1/`
 */
export interface FeParamGetActividadesResult {
    /** ResultGet */
    ResultGet?: ResultGet14;
    /** Errors */
    Errors?: Errors;
    /** Events */
    Events?: Events;
}
