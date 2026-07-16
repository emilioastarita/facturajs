import { ResultGet7 } from './ResultGet7';
import { Errors } from './Errors';
import { Events } from './Events';

/**
 * FEParamGetTiposOpcionalResult
 * @targetNSAlias `tns`
 * @targetNamespace `http://ar.gov.afip.dif.FEV1/`
 */
export interface FeParamGetTiposOpcionalResult {
    /** ResultGet */
    ResultGet?: ResultGet7;
    /** Errors */
    Errors?: Errors;
    /** Events */
    Events?: Events;
}
