import {IConfigService} from "../IConfigService";

require('source-map-support').install();
import moment = require("moment");
import {AfipServices} from "../AfipServices";


const config: IConfigService = {
    certPath: './private/cert.pem',
    privateKeyPath: './private/private_key.key',
    cacheTokensPath: './.lastTokens',
    homo: true,
    tokensExpireInHours: 12
};

const afip = new AfipServices(config);

afip.getLastBillNumber({
    Auth: {Cuit: 27000000000},
    params: {
        CbteTipo: 11,
        PtoVta: 2
    }

}).then(res => {
    console.log('Last bill number: ', res.CbteNro);
    return res.CbteNro;
}).then(num => {
    const next = num + 1;
    console.log('Next bill number to create: ', next);
    return afip.createBill({
        Auth: {Cuit: 27000000000},
        params: {
            FeCAEReq: {
                FeCabReq: {
                    CantReg: 1,
                    PtoVta: 2,
                    // monotributo
                    CbteTipo: 11,
                },
                FeDetReq: {
                    FECAEDetRequest: {
                        DocTipo: 99,
                        DocNro: 0,
                        Concepto: 1,
                        CbteDesde: next,
                        CbteHasta: next,
                        CbteFch: moment().format('YYYYMMDD'),
                        ImpTotal: 75.0,
                        ImpTotConc: 0,
                        ImpNeto: 75.0,
                        ImpOpEx: 0,
                        ImpIva: 0,
                        ImpTrib: 0,
                        MonId: 'PES',
                        MonCotiz: 1,
                    }
                }
            },
        }
    })
}).then(res => {
    console.log('Created bill', JSON.stringify(res, null, 4));
}).catch(err => {
    console.error('Something was wrong!');
    console.error(err)
});


