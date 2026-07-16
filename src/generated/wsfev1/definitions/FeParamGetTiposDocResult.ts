import { ResultGet12 } from './ResultGet12';
import { Errors } from './Errors';
import { Events } from './Events';

/**
 * FEParamGetTiposDocResult
 * @targetNSAlias `tns`
 * @targetNamespace `http://ar.gov.afip.dif.FEV1/`
 */
export interface FeParamGetTiposDocResult {
    /** ResultGet */
    ResultGet?: ResultGet12;
    /** Errors */
    Errors?: Errors;
    /** Events */
    Events?: Events;
}
