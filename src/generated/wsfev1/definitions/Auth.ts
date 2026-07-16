/**
 * Auth
 * @targetNSAlias `tns`
 * @targetNamespace `http://ar.gov.afip.dif.FEV1/`
 */
export interface Auth {
    /** s:string */
    Token?: string;
    /** s:string */
    Sign?: string;
    /** s:long */
    Cuit?: number;
}
