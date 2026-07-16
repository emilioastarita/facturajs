import { ResultGet6 } from './ResultGet6';
import { Errors } from './Errors';
import { Events } from './Events';

/**
 * FEParamGetTiposIvaResult
 * @targetNSAlias `tns`
 * @targetNamespace `http://ar.gov.afip.dif.FEV1/`
 */
export interface FeParamGetTiposIvaResult {
    /** ResultGet */
    ResultGet?: ResultGet6;
    /** Errors */
    Errors?: Errors;
    /** Events */
    Events?: Events;
}
