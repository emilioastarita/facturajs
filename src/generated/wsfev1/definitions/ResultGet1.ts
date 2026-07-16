import { Observaciones } from './Observaciones';

/**
 * ResultGet
 * @targetNSAlias `tns`
 * @targetNamespace `http://ar.gov.afip.dif.FEV1/`
 */
export interface ResultGet1 {
    /** s:string */
    CAEA?: string;
    /** s:int */
    Periodo?: number;
    /** s:short */
    Orden?: number;
    /** s:string */
    FchVigDesde?: string;
    /** s:string */
    FchVigHasta?: string;
    /** s:string */
    FchTopeInf?: string;
    /** s:string */
    FchProceso?: string;
    /** Observaciones */
    Observaciones?: Observaciones;
}
