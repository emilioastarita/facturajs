import { ResultGet9 } from './ResultGet9';
import { Errors } from './Errors';
import { Events } from './Events';

/**
 * FEParamGetPtosVentaResult
 * @targetNSAlias `tns`
 * @targetNamespace `http://ar.gov.afip.dif.FEV1/`
 */
export interface FeParamGetPtosVentaResult {
    /** ResultGet */
    ResultGet?: ResultGet9;
    /** Errors */
    Errors?: Errors;
    /** Events */
    Events?: Events;
}
