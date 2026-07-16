import { ResultGet1 } from './ResultGet1';
import { Errors } from './Errors';
import { Events } from './Events';

/**
 * FECAEASolicitarResult
 * @targetNSAlias `tns`
 * @targetNamespace `http://ar.gov.afip.dif.FEV1/`
 */
export interface FecaeaSolicitarResult {
    /** ResultGet */
    ResultGet?: ResultGet1;
    /** Errors */
    Errors?: Errors;
    /** Events */
    Events?: Events;
}
