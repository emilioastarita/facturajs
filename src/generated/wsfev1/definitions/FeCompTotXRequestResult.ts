import { Errors } from './Errors';
import { Events } from './Events';

/**
 * FECompTotXRequestResult
 * @targetNSAlias `tns`
 * @targetNamespace `http://ar.gov.afip.dif.FEV1/`
 */
export interface FeCompTotXRequestResult {
    /** s:int */
    RegXReq?: number;
    /** Errors */
    Errors?: Errors;
    /** Events */
    Events?: Events;
}
