import { ResultGet10 } from './ResultGet10';
import { Errors } from './Errors';
import { Events } from './Events';

/**
 * FEParamGetTiposCbteResult
 * @targetNSAlias `tns`
 * @targetNamespace `http://ar.gov.afip.dif.FEV1/`
 */
export interface FeParamGetTiposCbteResult {
    /** ResultGet */
    ResultGet?: ResultGet10;
    /** Errors */
    Errors?: Errors;
    /** Events */
    Events?: Events;
}
