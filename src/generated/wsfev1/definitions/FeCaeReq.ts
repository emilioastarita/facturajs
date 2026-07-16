import { FeCabReq } from './FeCabReq';
import { FeDetReq } from './FeDetReq';

/**
 * FeCAEReq
 * @targetNSAlias `tns`
 * @targetNamespace `http://ar.gov.afip.dif.FEV1/`
 */
export interface FeCaeReq {
    /** FeCabReq */
    FeCabReq?: FeCabReq;
    /** FeDetReq */
    FeDetReq?: FeDetReq;
}
