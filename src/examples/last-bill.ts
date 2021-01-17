import { IConfigService } from '../IConfigService';

import * as fs from 'fs';
import 'source-map-support/register';
import { AfipServices } from '../AfipServices';

const config: IConfigService = {
    // use path or content keys:
    // certPath: './private/dev/cert.pem',
    // privateKeyPath: './private/dev/private_key.key',
    certContents: fs.readFileSync('./private/dev/cert.pem').toString('utf8'),
    privateKeyContents: fs
        .readFileSync('./private/dev/private_key.key')
        .toString('utf8'),
    cacheTokensPath: './.lastTokens',
    homo: true,
    tokensExpireInHours: 12,
};

const afip = new AfipServices(config);

const cuit = 27310090854;

afip.getLastBillNumber({
    Auth: { Cuit: cuit },
    params: {
        CbteTipo: 11,
        PtoVta: 2,
    },
}).then((res) => {
    console.log('Last bill number: ', res.CbteNro);
    return res.CbteNro;
});
