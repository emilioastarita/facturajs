export type WsServicesNames = 'wsfe' | 'wsfev1' | 'login';

export interface ParamsAuth {
    Auth?: {
        token?: string;
        sign?: string;
        Cuit: number;
    };
}

export interface ParamsFECompUltimoAutorizado extends ParamsAuth {
    params: {
        PtoVta: number;
        CbteTipo: number;
    };
}

export interface ParamsFECAESolicitar extends ParamsAuth {
    params: {
        FeCAEReq: {
            FeCabReq: {
                CantReg: number;
                PtoVta: number;
                CbteTipo: number;
            };
            FeDetReq: {
                FECAEDetRequest: {
                    DocTipo: number;
                    DocNro: number;
                    Concepto: number;
                    CbteDesde: number;
                    CbteHasta: number;
                    CbteFch: string;
                    ImpTotal: number;
                    ImpTotConc: number;
                    ImpNeto: number;
                    ImpOpEx: number;
                    ImpIVA: number;
                    ImpTrib: number;
                    MonId: 'PES';
                    MonCotiz: number;
                    Iva?: {
                        AlicIva: {
                            Id: number;
                            BaseImp: number;
                            Importe: number;
                        };
                    }[];
                };
            };
        };
    };
};

export interface FeCabResp {
    Cuit: string;
    PtoVta: number;
    CbteTipo: number;
    FchProceso: string;
    CantReg: number;
    Resultado: string;
    Reproceso?: string;
};

export interface FECAEDetResponse {
    Concepto: number;
    DocTipo: number;
    DocNro: string;
    CbteDesde: string;
    CbteHasta: string;
    CbteFch?: string;
    Resultado: string;
    CAE?: string;
    CAEFchVto?: string;
    Observaciones?: Array<{ Code: number; Msg: string; }>;
};

export interface FeDetResp {
    FECAEDetResponse: Array<FECAEDetResponse>;
};

export interface FECAESolicitarResult {
    FeCabResp: FeCabResp,
    FeDetResp: FeDetResp,
    // Events
    // Errors
};

export interface FECompUltimoAutorizadoResult {
    PtoVta: number;
    CbteTipo: number;
    CbteNro?: number;
}