import { Observaciones } from './Observaciones';

/**
 * FECAEADetResponse
 * @targetNSAlias `tns`
 * @targetNamespace `http://ar.gov.afip.dif.FEV1/`
 */
export interface FecaeaDetResponse {
    /** s:int */
    Concepto?: number;
    /** s:int */
    DocTipo?: number;
    /** s:long */
    DocNro?: number;
    /** s:long */
    CbteDesde?: number;
    /** s:long */
    CbteHasta?: number;
    /** s:string */
    CbteFch?: string;
    /** s:string */
    Resultado?: string;
    /** Observaciones */
    Observaciones?: Observaciones;
    /** s:string */
    CAEA?: string;
}
