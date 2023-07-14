import * as fs from 'fs';
import * as forge from 'node-forge';
import xml2js from 'xml2js';
import debugInit from 'debug';
const LOG_RUNTIME_LEVEL: LOG = parseProcessLevel();
const LOG_NAMESPACE = 'facturajs';
const debugLib = debugInit(LOG_NAMESPACE);

export const readFile = fs.promises.readFile;
export const writeFile = fs.promises.writeFile;

export const enum LOG {
    NONE = 1,
    ERROR,
    WARN,
    INFO,
    DEBUG,
}

function parseProcessLevel(): LOG {
    if (typeof process.env.LOG_LEVEL !== 'undefined') {
        return parseInt(process.env.LOG_LEVEL as string, 10);
    }
    return LOG.INFO;
}

export function debug(level: number, ...rest: any[]) {
    if (LOG_RUNTIME_LEVEL < level) {
        return;
    }
    //@ts-expect-error not typed
    return debugLib(...rest);
}

export function parseXml<T>(xml: string) {
    const options = {
        explicitArray: false,
    };
    return new Promise<T>((resolve, reject) => {
        xml2js.parseString(xml, options, (err, parsed) => {
            if (err) {
                reject(err);
            } else {
                resolve(parsed);
            }
        });
    });
}

export async function readStringFromFile(
    path: string,
    encoding = 'utf8'
): Promise<string> {
    return (await readFile(path)).toString(encoding);
}

export function signMessage(
    message: string,
    cert: string,
    privateKey: string
): string {
    const p7 = (forge as any).pkcs7.createSignedData();
    p7.content = forge.util.createBuffer(message, 'utf8');
    p7.addCertificate(cert);
    p7.addSigner({
        authenticatedAttributes: [
            {
                type: forge.pki.oids.contentType,
                value: forge.pki.oids.data,
            },
            {
                type: forge.pki.oids.messageDigest,
            },
            {
                type: forge.pki.oids.signingTime,
                value: new Date(),
            },
        ],
        certificate: cert,
        digestAlgorithm: forge.pki.oids.sha256,
        key: privateKey,
    });
    p7.sign();
    const bytes = forge.asn1.toDer(p7.toAsn1()).getBytes();
    return Buffer.from(bytes, 'binary').toString('base64');
}
