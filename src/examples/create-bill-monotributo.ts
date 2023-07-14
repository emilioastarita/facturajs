import 'source-map-support/register';
import { AfipServices } from '../AfipServices';
import { IConfigService } from '../IConfigService';
import moment from 'moment';

const config: IConfigService = {
    certPath: './private/dev/cert.pem',
    privateKeyPath: './private/dev/private_key.key',
    // or use directly content keys if you need
    // certContents: fs.readFileSync('./private/dev/cert.pem').toString('utf8'),
    // privateKeyContents: fs.readFileSync('./private/dev/private_key.key').toString('utf8'),
    cacheTokensPath: './.lastTokens',
    homo: true,
    tokensExpireInHours: 12,
};

const afip = new AfipServices(config);
const cuit = 27310090854;

async function monotributoExample() {
    const res = await afip.getLastBillNumber({
        Auth: { Cuit: cuit },
        params: {
            CbteTipo: 11,
            PtoVta: 2,
        },
    });
    console.log('Last bill number: ', res.CbteNro);
    const num = res.CbteNro;
    const next = num + 1;
    console.log('Next bill number to create: ', next);
    const resBill = await afip.createBill({
        Auth: { Cuit: cuit },
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
                        ImpIVA: 0,
                        ImpTrib: 0,
                        MonId: 'PES',
                        MonCotiz: 1,
                    },
                },
            },
        },
    });
    console.log('Created bill', JSON.stringify(resBill, null, 4));
}

monotributoExample().catch((err) => {
    console.error('Something was wrong!');
    console.error(err);
});
