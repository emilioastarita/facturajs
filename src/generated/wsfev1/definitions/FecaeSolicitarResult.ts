import { FeCabResp } from './FeCabResp';
import { FeDetResp } from './FeDetResp';
import { Events } from './Events';
import { Errors } from './Errors';

/**
 * FECAESolicitarResult
 * @targetNSAlias `tns`
 * @targetNamespace `http://ar.gov.afip.dif.FEV1/`
 */
export interface FecaeSolicitarResult {
    /** FeCabResp */
    FeCabResp?: FeCabResp;
    /** FeDetResp */
    FeDetResp?: FeDetResp;
    /** Events */
    Events?: Events;
    /** Errors */
    Errors?: Errors;
}
