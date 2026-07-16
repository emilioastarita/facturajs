import { ResultGet8 } from './ResultGet8';
import { Errors } from './Errors';
import { Events } from './Events';

/**
 * FEParamGetTiposConceptoResult
 * @targetNSAlias `tns`
 * @targetNamespace `http://ar.gov.afip.dif.FEV1/`
 */
export interface FeParamGetTiposConceptoResult {
    /** ResultGet */
    ResultGet?: ResultGet8;
    /** Errors */
    Errors?: Errors;
    /** Events */
    Events?: Events;
}
