import { ResultGet2 } from './ResultGet2';
import { Errors } from './Errors';
import { Events } from './Events';

/**
 * FECAEASinMovimientoConsultarResult
 * @targetNSAlias `tns`
 * @targetNamespace `http://ar.gov.afip.dif.FEV1/`
 */
export interface FecaeaSinMovimientoConsultarResult {
    /** ResultGet */
    ResultGet?: ResultGet2;
    /** Errors */
    Errors?: Errors;
    /** Events */
    Events?: Events;
}
