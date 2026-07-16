import { Errors } from './Errors';
import { Events } from './Events';

/**
 * FECompUltimoAutorizadoResult
 * @targetNSAlias `tns`
 * @targetNamespace `http://ar.gov.afip.dif.FEV1/`
 */
export interface FeCompUltimoAutorizadoResult {
    /** s:int */
    PtoVta?: number;
    /** s:int */
    CbteTipo?: number;
    /** s:int */
    CbteNro?: number;
    /** Errors */
    Errors?: Errors;
    /** Events */
    Events?: Events;
}
