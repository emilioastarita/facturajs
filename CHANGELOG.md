# Changelog

## Unreleased

Repository tooling only — no change to the published package.

- Added GitHub Actions CI: format check, test matrix on Node 22 and 24, a build
  on the Node 20.19 engines floor, and a dependency audit. Third-party actions
  are pinned to commit SHAs, kept current by Dependabot.
- Added pnpm supply-chain policy in `pnpm-workspace.yaml`: a 24h
  `minimumReleaseAge` cooldown, an explicitly empty `onlyBuiltDependencies`
  allowlist, store integrity verification and a pinned package manager. CI
  enforces the policy against the committed lockfile, so a pull request that
  bumps a dependency to a freshly published version fails before it merges.
- Moved the build from `prepare` to `prepack`. It used to run on every
  `pnpm install`, which rebuilt `dist/` and — because `prepare` also ran
  `prettier --write` — reformatted the working tree as a side effect of
  installing. The build now runs only when a tarball is produced: `pnpm pack`,
  `pnpm publish`, and installs straight from git (verified all three). Formatting
  is checked in CI instead of being silently applied.
- Refreshed transitive dependencies within their existing ranges, clearing all
  33 known advisories (`axios` 1.15.0 → 1.18.1, `@xmldom/xmldom` 0.8.12 →
  0.8.13, `form-data` 4.0.5 → 4.0.6). Only the lockfile moved; no declared range
  changed.

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

- Corrected `engines.node` from `>=6.0.0` to `>=20.19.0`. The old value had been
  stale for a long time and was never achievable: `soap` 1.8.0 requires Node
  20.19+, `ntp-time-sync` requires 18+, and the published code targets ES2022.
  This only makes the existing requirement visible — no runtime behaviour
  changes, and nothing that worked before stops working.
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
