import 'source-map-support/register';
import { AfipServices } from '../AfipServices';
import { IConfigService } from '../IConfigService';

const config: IConfigService = {
    certPath: './private/dev/cert.pem',
    privateKeyPath: './private/dev/private_key.key',
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
}

facturaBExample().catch((err) => {
    console.error('Something was wrong!');
    console.error(err);
});
