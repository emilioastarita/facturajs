import { createServer, Server } from 'https';
import type { IncomingMessage, ServerResponse } from 'http';
import type { Socket } from 'net';
import { createSelfSignedPair } from './tls.ts';
import type { SelfSignedPair } from './tls.ts';
import { buildWsdl, LAST_BILL_RESPONSE } from './wsdl.ts';

export type ResponseMode = 'ok' | 'reset';

export interface FakeAfip {
    readonly baseUrl: string;
    readonly tls: SelfSignedPair;
    /** How the next SOAP POST (not the WSDL fetch) is answered. */
    mode: ResponseMode;
    /** How the WSDL fetch is answered. */
    wsdlMode: ResponseMode;
    close(): Promise<void>;
}

/**
 * Sends a TCP RST rather than a clean FIN, so the peer sees `ECONNRESET` — the
 * exact shape of failure AFIP's front-ends produce when they drop a connection.
 * On a TLS server the writable side is the TLSSocket; the raw socket underneath
 * is the one that can be reset.
 */
function hardReset(socket: Socket): void {
    const raw = (socket as Socket & { _parent?: Socket })._parent ?? socket;
    if (typeof raw.resetAndDestroy === 'function') {
        raw.resetAndDestroy();
        return;
    }
    socket.destroy();
}

export async function startFakeAfip(): Promise<FakeAfip> {
    const tls = createSelfSignedPair();
    const state: { mode: ResponseMode; wsdlMode: ResponseMode } = {
        mode: 'ok',
        wsdlMode: 'ok',
    };

    const server: Server = createServer(
        { cert: tls.cert, key: tls.key },
        (req: IncomingMessage, res: ServerResponse) => {
            const isWsdl = (req.url ?? '').toLowerCase().includes('wsdl');
            const mode = isWsdl ? state.wsdlMode : state.mode;

            req.resume();
            req.on('end', () => {
                if (mode === 'reset') {
                    if (res.socket) {
                        hardReset(res.socket);
                    }
                    return;
                }
                res.writeHead(200, {
                    'content-type': 'text/xml; charset=utf-8',
                });
                res.end(isWsdl ? buildWsdl(baseUrl()) : LAST_BILL_RESPONSE);
            });
        }
    );

    const address = () => {
        const addr = server.address();
        if (addr === null || typeof addr === 'string') {
            throw new Error('server is not listening on a TCP port');
        }
        return addr;
    };
    const baseUrl = () => `https://127.0.0.1:${address().port}`;

    await new Promise<void>((resolve) => {
        server.listen(0, '127.0.0.1', resolve);
    });

    return {
        get baseUrl() {
            return baseUrl();
        },
        tls,
        get mode() {
            return state.mode;
        },
        set mode(value: ResponseMode) {
            state.mode = value;
        },
        get wsdlMode() {
            return state.wsdlMode;
        },
        set wsdlMode(value: ResponseMode) {
            state.wsdlMode = value;
        },
        close() {
            return new Promise<void>((resolve, reject) => {
                server.closeAllConnections();
                server.close((err) => (err ? reject(err) : resolve()));
            });
        },
    };
}
