# Repository release hardening

Follow-up to the completed frontend handoff (`a763d16`). This work makes local/GitHub verification repeatable and improves development-toolchain safety; it does **not** deploy an official campus backend or certify device/accessibility/security integrations.

## Dependency improvement

- Update development-only `drizzle-kit` from **0.31.10 → 0.31.11**.
- Scope an **esbuild 0.25.12** override to `@esbuild-kit/core-utils`, removing its vulnerable 0.18.20 copy. The modern `tsx` esbuild remains 0.28.2; Next/React and all runtime dependency versions are unchanged. No runtime library is added.
- Fresh `npm ci`, strict lint/typecheck, all native suites, offline Drizzle TypeScript configuration/enum/schema generation and the optimized build pass with this tree. The smoke uses an ignored test-only table and **never connects to a database**. It is compatibility evidence for the exercised loader/generation path, not proof of every future DB workflow.
- Production audit remains **0**. Full audit improves **9 → 5**: the four moderate esbuild-related toolchain reports are removed; five high reports remain from one development-only `braces` chain.

At verification, npm's latest `braces` is 3.0.3 and [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) lists no patched release. Upstream status is checked with npm/GitHub, not assumed fixed. A risky forced Next downgrade, a hidden advisory suppression or an untested vendored upstream patch is not applied. Avoid untrusted user-provided glob patterns in lint/config tooling; this does not eliminate the upstream risk.

## Explicit audit policy

`npm run audit:dependencies` obtains fresh runtime **and full** reports. Production vulnerabilities, registry/tooling failures, new affected packages/advisory URLs/severity changes, malformed results and expired review fail verification. Only the exact known development chain is currently reported as a **visible high-risk warning**; it is **not** represented as a zero/clean full audit.

The bounded policy is in `config/dependency-audit-policy.json`, requires review by **2026-11-11**, and is covered by native negative tests. A clean upstream audit needs no exception. `npm audit` still exits nonzero for the remaining five reports; the scoped policy is not a deployment security certificate.

## Safe database configuration

The starter's checked-in local-credential JSON config is replaced by standard `drizzle.config.ts`. Connected CLI operations require an environment-provided `DATABASE_URL`; there is no local DSN/credential fallback. Offline generation does not require a DB. Actual `src/db/schema.ts` remains the existing empty schema entrypoint; no production tables or destructive DB commands are added/executed. The existing application health contract remains 503 without a configured DB.

## Repeatable verification and CI

- `npm test` runs **14 suites / 221 tests** in separate Node processes, preserving environment/store/mock isolation. `node scripts/run-native-tests.mjs home release` selects specific validated suite names; unknown/duplicate names cannot silently skip work.
- Node **22.15+** is documented/enforced for the native loader.
- `.github/workflows/verify.yml` runs on PRs, `main`/`arena/**` pushes and manual dispatch: fresh install, lint, typecheck, all contracts, source/artifact audit, offline toolchain smoke, explicit dependency policy and production build.
- Official checkout/setup-node actions are pinned to verified commit SHAs; workflow permissions are read-only and superseded runs are cancelled.
- GitHub workflow execution is verified after publishing the workflow; local fresh-install rehearsal is not a claim that remote Actions has already passed.

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run audit:source
npm run audit:toolchain
npm run audit:dependencies # Reports the known HIGH lint-chain risk explicitly
npm run build
npm audit --omit=dev      # Zero at verification
npm audit                 # Five known high development-chain reports; nonzero
```

Compact follow-up evidence: [release-hardening.json](audits/release-hardening.json). The prior [final-summary.json](audits/final-summary.json) intentionally retains the earlier 210-test/nine-advisory snapshot; current results supersede those counts without erasing history. The unchanged frontend's 732-route, 1,439-workflow-capture and Lighthouse evidence remains in the [final handoff](FINAL_HANDOFF.md).

Real backend/auth/CSRF/authorization/uploads/durability/email/transport, authorized SRC artwork, physical devices/Safari/Firefox/IME/full screen readers and the unpatched upstream advisory remain release gates. No CI badge or fixture is a substitute for those proofs.
