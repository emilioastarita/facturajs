import { ResultGet13 } from './ResultGet13';
import { Errors } from './Errors';
import { Events } from './Events';

/**
 * FEParamGetTiposPaisesResult
 * @targetNSAlias `tns`
 * @targetNamespace `http://ar.gov.afip.dif.FEV1/`
 */
export interface FeParamGetTiposPaisesResult {
    /** ResultGet */
    ResultGet?: ResultGet13;
    /** Errors */
    Errors?: Errors;
    /** Events */
    Events?: Events;
}
