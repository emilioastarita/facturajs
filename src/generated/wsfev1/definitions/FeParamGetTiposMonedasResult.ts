import { ResultGet5 } from './ResultGet5';
import { Errors } from './Errors';
import { Events } from './Events';

/**
 * FEParamGetTiposMonedasResult
 * @targetNSAlias `tns`
 * @targetNamespace `http://ar.gov.afip.dif.FEV1/`
 */
export interface FeParamGetTiposMonedasResult {
    /** ResultGet */
    ResultGet?: ResultGet5;
    /** Errors */
    Errors?: Errors;
    /** Events */
    Events?: Events;
}
