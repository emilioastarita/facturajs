import { ResultGet } from './ResultGet';
import { Errors } from './Errors';
import { Events } from './Events';

/**
 * FECompConsultarResult
 * @targetNSAlias `tns`
 * @targetNamespace `http://ar.gov.afip.dif.FEV1/`
 */
export interface FeCompConsultarResult {
    /** ResultGet */
    ResultGet?: ResultGet;
    /** Errors */
    Errors?: Errors;
    /** Events */
    Events?: Events;
}
