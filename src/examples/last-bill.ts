import { IConfigService } from '../IConfigService';

import { AfipServices } from '../AfipServices';

const config: IConfigService = {
    // use path or content keys:
    
    certPath: './private/dev/dev.pem',
    privateKeyPath: './private/dev/privada.key',
    cacheTokensPath: './.lastTokens',
    homo: true,
    
    // certPath: './private/prod/cope/certificado-2021_32da385b5187cd7f.crt',
    // privateKeyPath: './private/prod/cope/privada.key',
    // cacheTokensPath: './.lastTokensProd',
    // homo: false,

    tokensExpireInHours: 12,
};

const afip = new AfipServices(config);
const cuit = 30680647328;

afip.getLastBillNumber({
    Auth: { Cuit: cuit },
    params: {
        CbteTipo: 11,   // factura C
        PtoVta: 3,      // punto de venta webservices
    },
}).then((res) => {
    console.log('Último comprobante: ', res.CbteNro);
    console.dir(res, { depth: null });
});

// afip.execRemote('wsfev1', 'FEParamGetPtosVenta', {
//     Auth: { Cuit: cuit }
// }).then(res => console.dir(res, { depth: null }))

// afip.execRemote('wsfev1', 'FEParamGetTiposCbte', {
//     Auth: { Cuit: cuit }
// }).then(res => console.dir(res, { depth: null }))

afip.execRemote('wsfev1', 'FECompConsultar', {
    Auth: { Cuit: cuit },
    params: {
        FeCompConsReq: {
            CbteTipo: 11,
            PtoVta: 3,
            CbteNro: 8,
        }
    },
}).then(res => console.dir(res, { depth: null }))

// yb && nodejs --tls-cipher-list='ECDHE-RSA-AES128-GCM-SHA256' dist/examples/last-bill.js