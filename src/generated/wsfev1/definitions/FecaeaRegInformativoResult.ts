import { FeCabResp1 } from './FeCabResp1';
import { FeDetResp1 } from './FeDetResp1';
import { Events } from './Events';
import { Errors } from './Errors';

/**
 * FECAEARegInformativoResult
 * @targetNSAlias `tns`
 * @targetNamespace `http://ar.gov.afip.dif.FEV1/`
 */
export interface FecaeaRegInformativoResult {
    /** FeCabResp */
    FeCabResp?: FeCabResp1;
    /** FeDetResp */
    FeDetResp?: FeDetResp1;
    /** Events */
    Events?: Events;
    /** Errors */
    Errors?: Errors;
}
