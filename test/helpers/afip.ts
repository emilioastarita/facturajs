import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import type { AgentOptions } from 'https';
import type * as soap from 'soap';

import { AfipServices } from '../../dist/AfipServices.js';
import type { AfipSoap } from '../../dist/lib/AfipSoap.js';
import type { IConfigService } from '../../dist/IConfigService.js';
import type { FakeAfip } from './server.ts';

/**
 * `AfipSoap` hardcodes AFIP's hostnames and keeps its soap plumbing private.
 * Tests need to point it at a throwaway server and get hold of the soap client
 * it builds, so these describe the shape we deliberately reach into.
 */
interface AfipSoapInternals {
    urls: {
        homo: { login: string; service: string };
        prod: { login: string; service: string };
    };
    getSoapClient(serviceName: string): Promise<soap.Client>;
}

interface AfipServicesInternals {
    afipSoap: AfipSoap;
}

export interface TestClientOptions {
    /** Mirrors the two ways a consumer can end up with or without a custom agent. */
    tlsRequestOptions?: AgentOptions;
    useLegacyTls?: boolean;
}

/**
 * soap keeps a process-wide WSDL cache keyed by URL, so every test client gets
 * its own URL — otherwise a test that wants the WSDL fetch to fail would be
 * served from the cache of an earlier test.
 */
let clientSeq = 0;

export interface TestClient {
    services: AfipServices;
    soapInternals: AfipSoapInternals;
    serviceUrl: string;
}

/**
 * Builds an `AfipServices` wired to `server`, with WSAA credentials already in
 * the token cache so no login (and therefore no NTP round-trip or CMS signing)
 * happens during the test.
 */
export function createTestClient(
    server: FakeAfip,
    options: TestClientOptions = {}
): TestClient {
    const cacheTokensPath = join(
        mkdtempSync(join(tmpdir(), 'facturajs-test-')),
        'tokens.json'
    );
    writeFileSync(
        cacheTokensPath,
        JSON.stringify({
            wsfe: {
                tokens: { token: 'test-token', sign: 'test-sign' },
                created: new Date().toISOString(),
                expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                service: 'wsfe',
            },
        })
    );

    const config = {
        homo: true,
        cacheTokensPath,
        tokensExpireInHours: 12,
        // Never used: the token cache above short-circuits the WSAA login.
        certContents: server.tls.cert,
        privateKeyContents: server.tls.key,
        ...(options.useLegacyTls === undefined
            ? {}
            : { useLegacyTls: options.useLegacyTls }),
        ...(options.tlsRequestOptions === undefined
            ? {}
            : { tlsRequestOptions: options.tlsRequestOptions }),
    } as IConfigService;

    const services = new AfipServices(config);
    const soapInternals = (services as unknown as AfipServicesInternals)
        .afipSoap as unknown as AfipSoapInternals;

    const serviceUrl = `${server.baseUrl}/{name}/service.asmx?wsdl&client=${++clientSeq}`;
    soapInternals.urls = {
        homo: {
            login: `${server.baseUrl}/ws/services/LoginCms?wsdl`,
            service: serviceUrl,
        },
        prod: { login: '', service: '' },
    };

    return {
        services,
        soapInternals,
        serviceUrl: serviceUrl.replace('{name}', 'wsfev1'),
    };
}
