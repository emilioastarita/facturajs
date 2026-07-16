import { CbtesAsoc } from './CbtesAsoc';
import { Tributos } from './Tributos';
import { Iva } from './Iva';
import { Opcionales } from './Opcionales';
import { Compradores } from './Compradores';
import { PeriodoAsoc } from './PeriodoAsoc';
import { Actividades } from './Actividades';
import { Observaciones } from './Observaciones';

/**
 * ResultGet
 * @targetNSAlias `tns`
 * @targetNamespace `http://ar.gov.afip.dif.FEV1/`
 */
export interface ResultGet {
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
    /** s:double */
    ImpTotal?: number;
    /** s:double */
    ImpTotConc?: number;
    /** s:double */
    ImpNeto?: number;
    /** s:double */
    ImpOpEx?: number;
    /** s:double */
    ImpTrib?: number;
    /** s:double */
    ImpIVA?: number;
    /** s:string */
    FchServDesde?: string;
    /** s:string */
    FchServHasta?: string;
    /** s:string */
    FchVtoPago?: string;
    /** s:string */
    MonId?: string;
    /** s:double */
    MonCotiz?: number;
    /** s:string */
    CanMisMonExt?: string;
    /** s:int */
    CondicionIVAReceptorId?: number;
    /** CbtesAsoc */
    CbtesAsoc?: CbtesAsoc;
    /** Tributos */
    Tributos?: Tributos;
    /** Iva */
    Iva?: Iva;
    /** Opcionales */
    Opcionales?: Opcionales;
    /** Compradores */
    Compradores?: Compradores;
    /** PeriodoAsoc */
    PeriodoAsoc?: PeriodoAsoc;
    /** Actividades */
    Actividades?: Actividades;
    /** s:string */
    Resultado?: string;
    /** s:string */
    CodAutorizacion?: string;
    /** s:string */
    EmisionTipo?: string;
    /** s:string */
    FchVto?: string;
    /** s:string */
    FchProceso?: string;
    /** Observaciones */
    Observaciones?: Observaciones;
    /** s:int */
    PtoVta?: number;
    /** s:int */
    CbteTipo?: number;
}
