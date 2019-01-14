import * as forge from "node-forge";
import xml2js = require('xml2js');
import util = require('util');
import * as fs from "fs";
const LOG_RUNTIME_LEVEL: LOG = parseProcessLevel();
const LOG_NAMESPACE = 'facturajs';
const _debug = require('debug')(LOG_NAMESPACE);

export const readFile = util.promisify(fs.readFile);
export const writeFile = util.promisify(fs.writeFile);

export enum LOG {
    NONE = 1,
    ERROR,
    WARN,
    INFO,
    DEBUG,
}

function parseProcessLevel(): LOG {
    if (typeof (process.env['LOG_LEVEL']) !== "undefined") {
        return parseInt(<string>process.env.LOG_LEVEL, 10);
    }
    return LOG.INFO;
}

export function debug(level: number, ...rest: any[]) {
    if (LOG_RUNTIME_LEVEL < level) {
        return;
    }
    return _debug(...rest);
}

export function parseXml(xml: string) {
    const options = {
        explicitArray: false,
    };
    return new Promise((resolve, reject) => {
        xml2js.parseString(xml, options, (err, parsed) => {
            if (err) {
                reject(err);
            } else {
                resolve(parsed);
            }
        })
    })
}

export function signMessage(message: string, cert: string, privateKey: string): string {
    const p7 = (<any>forge).pkcs7.createSignedData();
    p7.content = forge.util.createBuffer(message, 'utf8');
    p7.addCertificate(cert);
    p7.addSigner({
        key: privateKey,
        certificate: cert,
        digestAlgorithm: forge.pki.oids.sha256,
        authenticatedAttributes: [{
            type: forge.pki.oids.contentType,
            value: forge.pki.oids.data
        }, {
            type: forge.pki.oids.messageDigest
        }, {
            type: forge.pki.oids.signingTime,
            value: new Date()
        }]
    });
    p7.sign();
    const bytes = forge.asn1.toDer(p7.toAsn1()).getBytes();
    return Buffer.from(bytes, 'binary').toString('base64');
}
