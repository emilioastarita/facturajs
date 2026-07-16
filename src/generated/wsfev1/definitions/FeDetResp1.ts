import { FecaeaDetResponse } from './FecaeaDetResponse';

/**
 * FeDetResp
 * @targetNSAlias `tns`
 * @targetNamespace `http://ar.gov.afip.dif.FEV1/`
 */
export interface FeDetResp1 {
    /** FECAEADetResponse[] */
    FECAEADetResponse?: Array<FecaeaDetResponse>;
}
