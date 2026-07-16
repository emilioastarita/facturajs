import { ResultGet3 } from './ResultGet3';
import { Errors } from './Errors';
import { Events } from './Events';

/**
 * FEParamGetCotizacionResult
 * @targetNSAlias `tns`
 * @targetNamespace `http://ar.gov.afip.dif.FEV1/`
 */
export interface FeParamGetCotizacionResult {
    /** ResultGet */
    ResultGet?: ResultGet3;
    /** Errors */
    Errors?: Errors;
    /** Events */
    Events?: Events;
}
