# 4. Schema changes go through committed migrations, never dev-mode auto-push

Date: 2026-08-05

## Status

Accepted

## Context

The database schema was never described anywhere in the repo. It existed only as a consequence of running `npm run dev`: Payload's Postgres adapter introspects the config on boot and pushes the difference into the database. There was no `migrations/` directory and no `push` setting.

This works right up until the schema meets a database that already has data. Adding `lastSyncError` to the `guild-details` global worked locally — auto-push created the column — and broke production, where the column was never created. Payload selects every configured column by name, so a missing one fails the *entire* document read, not just that field. The admin page rendered its Sync button (UI config, no database) but showed "nothing found", and every hourly Sync failed at `stage: "write"`. Nothing in the code diff suggested a database cause. It was fixed by hand with `ALTER TABLE guild_details ADD COLUMN IF NOT EXISTS last_sync_error varchar` — the exact statement a generated migration would have contained.

Auto-push disengages only when `NODE_ENV === 'production'`. Local development sets `NODE_ENV=development`, and the local `.env` points `DATABASE_URL` at the production Neon database. Dev sessions were therefore pushing schema *into production* — the schema was being mutated by whoever last ran `npm run dev`, which is why production had most columns but not the newest one.

Adoption was previously believed to be blocked. The ledger recorded the Payload CLI as failing under "Node 24 + `tsx` ESM/CJS interop errors inside Payload's own `bin.js`", with a Node 20/22 downgrade as the likely prerequisite. That diagnosis was wrong. The failure was `Cannot find module src/collections/Users` — `payload.config.ts` used extensionless imports, which resolve under Next.js because `tsconfig.json` sets `moduleResolution: "bundler"`, but not under the CLI, which runs outside the bundler. The Node version was never the cause.

## Decision

**Set `push: false` explicitly.** Dev stops diverging from production silently. The schema changes only when a migration says so.

**Commit migrations to the repo and run them in the build.** `build` is `payload migrate && next build`, so a deploy cannot ship code whose schema has not been applied.

**Transpile the CLI with `@swc-node/register` (`--use-swc`) and declare `"type": "module"`.** Payload's default `tsx` path fails on this project under Node 24, and `--disable-transpile` cannot handle the type-only imports that `migrate:create` generates. swc runs generated migrations unmodified, which is the whole point — a workflow requiring a hand-edit after every generate is a workflow someone eventually forgets. `"type": "module"` is what makes swc emit ESM; every config file in the repo was already ESM, so this declares what was true rather than changing it.

**Adopt the existing schema as a baseline recorded as already-applied.** The baseline migration was generated, applied to an empty database, and diffed against production: 135 columns, identical in both directions, including the hand-patched `last_sync_error`. `scripts/adopt-migrations-baseline.mjs` records it as applied without executing it, and re-verifies before writing.

**Delete the synthetic `dev` row.** Auto-push leaves a `{name: 'dev', batch: -1}` row in `payload_migrations`. `payload migrate` reads it as "you have been dev-pushing" and *interactively prompts* before running anything. In CI there is no TTY, so the prompt takes its default — abort — and exits 0 having run no migrations. A green build that silently skipped its migrations is the precise failure this ADR exists to prevent, so the row has to go.

## Consequences

A schema change is now two commands (`migrate:create`, then commit) and the column exists in production because the build applied it. The class of bug where a field works locally and 500s in production is closed.

Migrations are ordinary code review artifacts. The `ALTER TABLE` is visible in the diff, which is where a reviewer can object to it.

`generate:types` works again, so `payload-types.ts` no longer needs hand-editing. Regenerating it immediately surfaced two real drifts the hand-edited file had masked: a stale `roster` global that no longer exists, and an unguarded `officers.name` that was the only field in its block missing the `!` its neighbours all had.

The baseline is recorded as applied rather than executed, so production's migration history begins mid-story. `scripts/adopt-migrations-baseline.mjs` is kept as the record of why.

Anyone whose `DATABASE_URL` points at production no longer mutates its schema by running `npm run dev`. They also no longer get schema changes automatically — they must run `npm run migrate`. That is the intended trade.

`"type": "module"` is repo-wide. Verified against build, the 26-test suite, and typecheck before adopting.

## Alternatives considered

**Write the baseline with `IF NOT EXISTS` guards and actually run it.** Rejected. It sounds safer than marking-as-applied but is worse: hand-written guards drift from what Payload generates, and that divergence would have to be maintained forever. Marking-as-applied also forces the schemas to be diffed before writing, which is exactly the check whose absence caused the incident.

**Drop and rebuild production from migrations.** Rejected — destroys live data for a bookkeeping problem.

**Pin Node 20/22 for CLI tasks.** This was the ledger's proposed prerequisite. Rejected once the real cause turned out to be extensionless imports: it would have added a second Node version to keep in sync with Vercel's runtime while fixing nothing. No version manager is installed on the development machine, so this was also the most expensive option.

**Keep `--disable-transpile` and hand-fix generated files.** Rejected. It needs two edits after every `migrate:create` — `.ts` import extensions, and splitting the combined type import. Trading a recurring manual step for one devDependency is a bad trade when the failure mode of forgetting is a broken deploy.
