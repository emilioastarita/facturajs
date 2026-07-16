import { Observaciones } from './Observaciones';

/**
 * FECAEDetResponse
 * @targetNSAlias `tns`
 * @targetNamespace `http://ar.gov.afip.dif.FEV1/`
 */
export interface FecaeDetResponse {
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
    CAE?: string;
    /** s:string */
    CAEFchVto?: string;
}
