import { ResultGet4 } from './ResultGet4';
import { Errors } from './Errors';
import { Events } from './Events';

/**
 * FEParamGetTiposTributosResult
 * @targetNSAlias `tns`
 * @targetNamespace `http://ar.gov.afip.dif.FEV1/`
 */
export interface FeParamGetTiposTributosResult {
    /** ResultGet */
    ResultGet?: ResultGet4;
    /** Errors */
    Errors?: Errors;
    /** Events */
    Events?: Events;
}
