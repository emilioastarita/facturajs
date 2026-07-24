# Changelog

## 0.4.3

### Fixed

- **No more `unhandledRejection` events when AFIP resets a connection.**

    AFIP's front-ends intermittently reset TLS connections. When that happened
    mid-invoice, applications saw bursts of process-level `unhandledRejection`
    events carrying a raw `AxiosError: read ECONNRESET`, with no application
    frames in the stack — even though the invoice itself went through, because
    the very same error had already been delivered normally and retried.

    The duplicate came from `soap`. Its `HttpClient.request()` reports a
    transport failure twice: through the `callback` it was given, and through
    the promise it returns. In `soap` releases up to 1.4.x, `Client._invoke` is
    an `async` method whose last statement is
    `return this.httpClient.request(...)`; the `async` wrapper creates a fresh
    promise that adopts that rejection, and `Client._defineMethod` throws that
    promise away without ever attaching a handler. The already-handled error
    then resurfaced as an unhandled rejection.

    facturajs' own `soap` HttpClient subclass now returns a promise that never
    rejects — the error still travels through the callback, which is the channel
    `soap` actually reads, so `getLastBillNumber`, `createBill` and friends keep
    rejecting with the original `AxiosError` exactly as before. The subclass is
    also installed unconditionally now; previously it was only used when TLS
    request options were configured, so the fix would not have covered every
    setup.

    Streaming requests (`requestStream`) are deliberately left untouched: there
    the returned promise is `soap`'s only error channel, and it does attach a
    rejection handler to it.

### Changed

- Raised the `soap` floor from `^1.1.11` to `^1.4.2`. Upstream dropped the
  `async` from `Client._invoke` in 1.4.2, which removes the leak at the source;
  the range previously allowed 1.4.1 and earlier, so consumers with an old
  lockfile could still resolve an affected release. The resolved version is
  unchanged (1.8.0) — only the floor moved.

### Added

- Regression test suite (`pnpm test`) covering socket-level failures of both the
  WSDL fetch and the SOAP call, with and without `tlsRequestOptions`. The tests
  assert the invariant directly against facturajs' own HttpClient, so they hold
  whichever `soap` release ends up installed.
