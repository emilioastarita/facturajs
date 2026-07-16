import { FecaeDetResponse } from './FecaeDetResponse';

/**
 * FeDetResp
 * @targetNSAlias `tns`
 * @targetNamespace `http://ar.gov.afip.dif.FEV1/`
 */
export interface FeDetResp {
    /** FECAEDetResponse[] */
    FECAEDetResponse?: Array<FecaeDetResponse>;
}
