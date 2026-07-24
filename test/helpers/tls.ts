import { generateKeyPairSync } from 'crypto';
import forge from 'node-forge';

export interface SelfSignedPair {
    cert: string;
    key: string;
}

/**
 * Self-signed certificate for the throwaway HTTPS servers the tests spin up.
 * The key pair comes from node's crypto (much faster than forge's pure-JS RSA);
 * forge only assembles the X.509 wrapper around it.
 */
export function createSelfSignedPair(): SelfSignedPair {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    const cert = forge.pki.createCertificate();
    cert.publicKey = forge.pki.publicKeyFromPem(publicKey);
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date(Date.now() - 24 * 60 * 60 * 1000);
    cert.validity.notAfter = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const attrs = [{ name: 'commonName', value: 'localhost' }];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.setExtensions([
        { name: 'basicConstraints', cA: true },
        {
            name: 'subjectAltName',
            altNames: [
                { type: 2, value: 'localhost' },
                { type: 7, ip: '127.0.0.1' },
            ],
        },
    ]);
    cert.sign(
        forge.pki.privateKeyFromPem(privateKey),
        forge.md.sha256.create()
    );

    return { cert: forge.pki.certificateToPem(cert), key: privateKey };
}
