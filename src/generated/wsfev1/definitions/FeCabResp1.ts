/**
 * FeCabResp
 * @targetNSAlias `tns`
 * @targetNamespace `http://ar.gov.afip.dif.FEV1/`
 */
export interface FeCabResp1 {
    /** s:long */
    Cuit?: number;
    /** s:int */
    PtoVta?: number;
    /** s:int */
    CbteTipo?: number;
    /** s:string */
    FchProceso?: string;
    /** s:int */
    CantReg?: number;
    /** s:string */
    Resultado?: string;
    /** s:string */
    Reproceso?: string;
}
