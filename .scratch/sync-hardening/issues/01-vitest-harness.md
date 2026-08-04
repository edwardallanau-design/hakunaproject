# 01 — Vitest harness

Status: Ready
Blocked by: —
Spec: `.scratch/sync-hardening/spec.md` (R7)

## Why first

Every other ticket in this feature changes data-transform logic. Without a runner they are verifiable only by running a live Sync and looking at the site — which is exactly the condition that let the Rotmire bug survive. This ticket blocks everything else.

## Scope

Set up the runner and prove it works. **No production code changes.**

- Add `vitest` (4.x) and `vite-tsconfig-paths` as devDependencies.
- `vitest.config.ts` at the repo root, with the `tsconfig-paths` plugin so `@/*` resolves.
- `test` and `test:watch` scripts in `package.json`.
- One trivial passing test importing something real via `@/` — e.g. a `wow-constants.ts` export — to prove the alias and TS resolution work end to end.

## Notes

Node environment, not jsdom. Nothing in scope renders React.

## Done when

- `npm test` runs and passes.
- The trivial test imports via the `@/` alias successfully.
- `npm run build` is unaffected.
