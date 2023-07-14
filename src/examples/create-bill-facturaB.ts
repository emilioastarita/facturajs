import moment from 'moment';
import 'source-map-support/register';
import { AfipServices } from '../AfipServices';
import { IConfigService } from '../IConfigService';

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

async function facturaBExample() {
    const res = await afip.getLastBillNumber({
        Auth: { Cuit: cuit },
        params: {
            CbteTipo: 6,
            PtoVta: 7,
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
                    PtoVta: 7,
                    // Factura B
                    CbteTipo: 6,
                },
                FeDetReq: {
                    FECAEDetRequest: {
                        DocTipo: 99,
                        DocNro: 0,
                        Concepto: 1,
                        CbteDesde: next,
                        CbteHasta: next,
                        CbteFch: moment().format('YYYYMMDD'),
                        ImpTotal: 121.0,
                        ImpTotConc: 0,
                        ImpNeto: 100,
                        ImpOpEx: 0,
                        ImpIVA: 21,
                        ImpTrib: 0,
                        MonId: 'PES',
                        MonCotiz: 1,
                        Iva: [
                            {
                                AlicIva: {
                                    Id: 5, // Id del tipo de IVA (5 es 21%)
                                    BaseImp: 100, // Base imponible
                                    Importe: 21, // Importe
                                },
                            },
                        ],
                    },
                },
            },
        },
    });
    console.log('Created bill', JSON.stringify(resBill, null, 4));
}

facturaBExample().catch((err) => {
    console.error('Something was wrong!');
    console.error(err);
});
