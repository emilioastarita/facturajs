import { FecaeDetRequest } from './FecaeDetRequest';

/**
 * FeDetReq
 * @targetNSAlias `tns`
 * @targetNamespace `http://ar.gov.afip.dif.FEV1/`
 */
export interface FeDetReq {
    /** FECAEDetRequest[] */
    FECAEDetRequest?: Array<FecaeDetRequest>;
}
