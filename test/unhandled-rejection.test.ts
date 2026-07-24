import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { globalAgent } from 'https';
import type { SecureContextOptions } from 'tls';
import type * as soap from 'soap';

import { createTestClient } from './helpers/afip.ts';
import type { TestClientOptions } from './helpers/afip.ts';
import { startFakeAfip } from './helpers/server.ts';
import type { FakeAfip } from './helpers/server.ts';

interface NodeErrorLike {
    code?: string;
    message?: string;
}

function errorCode(error: unknown): string | undefined {
    return (error as NodeErrorLike | null)?.code;
}

/**
 * V8 only reports a rejection as unhandled once the microtask queue has been
 * drained, so give the loop a couple of turns before looking.
 */
async function settleEventLoop(): Promise<void> {
    for (let i = 0; i < 3; i++) {
        await new Promise((resolve) => setTimeout(resolve, 30));
    }
}

async function collectUnhandledRejections(
    body: () => Promise<void>
): Promise<unknown[]> {
    const seen: unknown[] = [];
    const listener = (reason: unknown) => {
        seen.push(reason);
    };
    process.on('unhandledRejection', listener);
    try {
        await body();
        await settleEventLoop();
    } finally {
        process.off('unhandledRejection', listener);
    }
    return seen;
}

function describeRejections(reasons: unknown[]): string {
    return reasons
        .map((reason) => {
            const err = reason as NodeErrorLike | null;
            return `${err?.code ?? 'no-code'}: ${err?.message ?? String(reason)}`;
        })
        .join(', ');
}

describe('soap transport failures', () => {
    let server: FakeAfip;
    let restoreCa: SecureContextOptions['ca'];

    before(async () => {
        server = await startFakeAfip();
        // Trust the throwaway certificate for the requests that go out through
        // node's default agent (the "no tlsRequestOptions" configuration).
        restoreCa = globalAgent.options.ca;
        globalAgent.options.ca = server.tls.cert;
    });

    after(async () => {
        globalAgent.options.ca = restoreCa;
        await server.close();
    });

    const configurations: Array<[string, TestClientOptions]> = [
        ['with tlsRequestOptions', { tlsRequestOptions: {} }],
        ['without tlsRequestOptions', { useLegacyTls: false }],
    ];

    for (const [label, options] of configurations) {
        describe(label, () => {
            it('rejects with the transport error and leaks nothing when the SOAP call is reset', async () => {
                const { services } = createTestClient(server, {
                    ...options,
                    tlsRequestOptions: options.tlsRequestOptions && {
                        ...options.tlsRequestOptions,
                        ca: server.tls.cert,
                    },
                });

                let caught: unknown;
                const leaked = await collectUnhandledRejections(async () => {
                    server.wsdlMode = 'ok';
                    server.mode = 'reset';
                    try {
                        await services.getLastBillNumber({
                            Auth: { Cuit: 20111111112 },
                            params: { PtoVta: 1, CbteTipo: 6 },
                        });
                    } catch (error) {
                        caught = error;
                    }
                });

                assert.ok(caught, 'the caller must still see the failure');
                assert.equal(errorCode(caught), 'ECONNRESET');
                assert.deepEqual(
                    leaked,
                    [],
                    `unexpected unhandled rejections: ${describeRejections(leaked)}`
                );
            });

            it('rejects with the transport error and leaks nothing when the WSDL fetch is reset', async () => {
                const { services } = createTestClient(server, {
                    ...options,
                    tlsRequestOptions: options.tlsRequestOptions && {
                        ...options.tlsRequestOptions,
                        ca: server.tls.cert,
                    },
                });

                let caught: unknown;
                const leaked = await collectUnhandledRejections(async () => {
                    server.wsdlMode = 'reset';
                    server.mode = 'ok';
                    try {
                        await services.getLastBillNumber({
                            Auth: { Cuit: 20111111112 },
                            params: { PtoVta: 1, CbteTipo: 6 },
                        });
                    } catch (error) {
                        caught = error;
                    }
                });

                assert.ok(caught, 'the caller must still see the failure');
                assert.equal(errorCode(caught), 'ECONNRESET');
                assert.deepEqual(
                    leaked,
                    [],
                    `unexpected unhandled rejections: ${describeRejections(leaked)}`
                );
            });

            it('still resolves normally when nothing fails', async () => {
                const { services } = createTestClient(server, {
                    ...options,
                    tlsRequestOptions: options.tlsRequestOptions && {
                        ...options.tlsRequestOptions,
                        ca: server.tls.cert,
                    },
                });

                server.wsdlMode = 'ok';
                server.mode = 'ok';
                const result = await services.getLastBillNumber({
                    Auth: { Cuit: 20111111112 },
                    params: { PtoVta: 1, CbteTipo: 6 },
                });

                assert.equal(result.CbteNro, 42);
            });

            /**
             * The actual regression. soap <= 1.4.x declares `Client._invoke` as
             * an `async` method ending in `return this.httpClient.request(...)`,
             * and `Client._defineMethod` discards what `_invoke` returns. The
             * `async` wrapper adopts the rejection of the http client's promise,
             * so a transport error that was already delivered through the
             * callback resurfaces as a process-level `unhandledRejection`.
             *
             * Reproduced here directly against the http client facturajs
             * installs, so the guarantee holds no matter which soap release is
             * resolved: the promise we hand back must never reject.
             */
            it('survives a soap caller that discards the promise from an async wrapper', async () => {
                const { soapInternals } = createTestClient(server, {
                    ...options,
                    tlsRequestOptions: options.tlsRequestOptions && {
                        ...options.tlsRequestOptions,
                        ca: server.tls.cert,
                    },
                });

                server.wsdlMode = 'ok';
                server.mode = 'ok';
                const client = await soapInternals.getSoapClient('wsfev1');
                const httpClient = (
                    client as unknown as { httpClient: soap.HttpClient }
                ).httpClient;
                const endpoint = `${server.baseUrl}/wsfev1/service.asmx`;

                let callbackError: unknown;
                const leaked = await collectUnhandledRejections(async () => {
                    server.mode = 'reset';
                    await new Promise<void>((resolve) => {
                        // Exactly soap <= 1.4.x's shape: an async function that
                        // returns the http client's promise, called for its side
                        // effects only.
                        void (async () =>
                            httpClient.request(
                                endpoint,
                                '<soap:Envelope/>',
                                (error: unknown) => {
                                    callbackError = error;
                                    resolve();
                                },
                                {},
                                {}
                            ))();
                    });
                });

                assert.ok(
                    callbackError,
                    'soap must still be told about the failure through the callback'
                );
                assert.equal(errorCode(callbackError), 'ECONNRESET');
                assert.deepEqual(
                    leaked,
                    [],
                    `unexpected unhandled rejections: ${describeRejections(leaked)}`
                );
            });

            it('never rejects the promise it returns to soap', async () => {
                const { soapInternals } = createTestClient(server, {
                    ...options,
                    tlsRequestOptions: options.tlsRequestOptions && {
                        ...options.tlsRequestOptions,
                        ca: server.tls.cert,
                    },
                });

                server.wsdlMode = 'ok';
                server.mode = 'ok';
                const client = await soapInternals.getSoapClient('wsfev1');
                const httpClient = (
                    client as unknown as { httpClient: soap.HttpClient }
                ).httpClient;

                server.mode = 'reset';
                await assert.doesNotReject(() =>
                    httpClient.request(
                        `${server.baseUrl}/wsfev1/service.asmx`,
                        '<soap:Envelope/>',
                        () => undefined,
                        {},
                        {}
                    )
                );
            });
        });
    }
});
