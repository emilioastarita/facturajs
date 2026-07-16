import { Errors } from './Errors';
import { Events } from './Events';

/**
 * FECAEASinMovimientoInformarResult
 * @targetNSAlias `tns`
 * @targetNamespace `http://ar.gov.afip.dif.FEV1/`
 */
export interface FecaeaSinMovimientoInformarResult {
    /** s:string */
    CAEA?: string;
    /** s:string */
    FchProceso?: string;
    /** s:int */
    PtoVta?: number;
    /** s:string */
    Resultado?: string;
    /** Errors */
    Errors?: Errors;
    /** Events */
    Events?: Events;
}
