import { ResultGet11 } from './ResultGet11';
import { Errors } from './Errors';
import { Events } from './Events';

/**
 * FEParamGetCondicionIvaReceptorResult
 * @targetNSAlias `tns`
 * @targetNamespace `http://ar.gov.afip.dif.FEV1/`
 */
export interface FeParamGetCondicionIvaReceptorResult {
    /** ResultGet */
    ResultGet?: ResultGet11;
    /** Errors */
    Errors?: Errors;
    /** Events */
    Events?: Events;
}
