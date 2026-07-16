import { FeCabReq1 } from './FeCabReq1';
import { FeDetReq1 } from './FeDetReq1';

/**
 * FeCAEARegInfReq
 * @targetNSAlias `tns`
 * @targetNamespace `http://ar.gov.afip.dif.FEV1/`
 */
export interface FeCaeaRegInfReq {
    /** FeCabReq */
    FeCabReq?: FeCabReq1;
    /** FeDetReq */
    FeDetReq?: FeDetReq1;
}
