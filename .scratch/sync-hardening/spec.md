# Spec: Sync hardening

Status: implemented (see .scratch/LEDGER.md Shipped)
Date: 2026-08-04

Resolves the four Open issues in `.scratch/LEDGER.md` that concern the Raider.IO Sync. Decisions are recorded in `docs/adr/0001`–`0003`; vocabulary in `CONTEXT.md`. This spec says what to build.

## Problem

A **Sync** has two stages: **Fetch** (retrieve and reshape upstream data) and **Derivation** (compute Progression and Officers from it). Derivation produces everything the site displays.

Derivation runs inside an `afterChange` hook on the `guild-details` global, wrapped in a `try/catch` that logs and swallows. The route therefore returns `200` whenever Fetch succeeded, whether or not Derivation did. Every failure signal reports success:

- The hourly GitHub Actions schedule checks only the HTTP status, so it prints "Sync completed successfully" and stays green.
- The admin Sync button renders its green success message.
- The site serves stale Progression indefinitely.

This is the failure mode that let the Rotmire bug survive: killed 2026-06-17, shown unkilled for weeks, no signal.

Three further weaknesses compound it. The upstream response is never validated, so a shape change throws from inside a transform rather than at the boundary. The Rank Source raid is pinned by a constant whose absence silently preserves stale rankings. And no test framework exists, so the data-transform logic where the Rotmire bug lived is only verifiable by running a live Sync and looking at the site.

## Target design

The route owns the whole operation. The `afterChange` hook is removed.

```
GET /api/sync-guild-details
  1. Fetch from Raider.IO
  2. Validate with Zod at the boundary
  3. Read current CMS state (progression, officers-section)
  4. Derive progression + officers IN MEMORY   ← pure functions
       └─ throw if the Rank Source raid is absent
  5. Only now: write guild-details, progression, officers-section

  on failure → write lastSyncError, return 500 { error, stage, message }
  on success → clear lastSyncError
```

## Requirements

### R1 — Derivation moves into the route

The `afterChange` hook on `guild-details` is removed. The route calls Fetch, then Derivation, then writes, in that order.

A hand-edit of the hidden `guild-details` JSON in the admin no longer re-derives Progression. Accepted (ADR 0001).

### R2 — Derivation is pure and happens before any write

`syncProgressionFromDetails` and `syncOfficersFromDetails` currently read `guild-details` back out of the database and write their own globals. Split each into:

- a **pure function** taking `(validated upstream data, current CMS state)` and returning the new state, with no `Payload` dependency;
- a thin caller in the route that reads state, calls the pure function, and writes the result.

Both derivations must complete before any global is written. A Derivation failure means nothing is written.

Derivation needs current CMS state as well as upstream data, because the API supplies only the update — the CMS supplies the list of things to update (the Season boss list, the officer roster).

### R3 — Failures are reported honestly, with the stage

A failed Sync returns non-200 with `{ error, stage: "fetch" | "derivation", message }`.

Never return a 2xx for a failed Sync. The workflow's check is `if [ "$response" != "200" ]`, so any 2xx restores the silent-green blindness this work removes.

### R4 — `lastSyncError` on `guild-details`

A `lastSyncError` field, written on the failure path and cleared on success, readable in the admin next to `lastSyncedAt`.

This is a deliberate exception to R2's write-nothing-on-failure rule: it is metadata about the Sync attempt, not derived site data.

### R5 — Zod validation at the fetch boundary

Validate the upstream response before any transform runs.

- Scope the schema to **consumed fields only**. Unknown keys are stripped — `subregion` is discarded deliberately rather than by accident downstream.
- **Infer the TypeScript types from the schema.** `GuildDetailsData` stops being a hand-written assertion.
- Match optionality to actual usage. `raidAttempt` is consumed as `raidAttempt?.encounters ?? {}`, so it is optional.

Zod 4.x. New dependency; server-only.

### R6 — Rank Source absence throws

`PRIMARY_RAID_SLUG` stays a constant. If it is absent from `raidRankings`, throw, naming the missing slug and listing what was returned:

> Rank source raid "tier-mn-1" not found in response. Available: tier-mn-2, sporefall

Keep the preserve-on-null fallback **only** for the genuine no-data case (empty `raidRankings`), which is the guild-rename scenario and is distinguishable from "the pinned Raid is absent but others are present."

### R7 — Vitest, scoped

Vitest 4.x + `vite-tsconfig-paths` (for the `@/*` alias). Add `test` and `test:watch` scripts.

Covers exactly three areas:

1. **Boss resolution** — name→slug reconciliation, aggregation across all raids, the kill lock, pull/bestPull rules. Must include a **Rotmire regression test**: a fixture with two raids where the kill is in the *second*. This is the test that would have caught `raidProgress[0]`.
2. **Rank Source selection** — picks the pinned raid; throws with the available slugs named when absent; preserves on genuinely empty rankings.
3. **The Zod schema** — a known-good response parses; a malformed one fails at the boundary with a path.

Explicitly **not** covered: Payload globals config, React components, the page's field mapping, `fetchWithRetry` network behaviour.

Fixtures are a real captured Raider.IO response trimmed to consumed fields, obtained while writing the Zod schema.

## Out of scope

**Seasons as a collection.** One row per Season, `isCurrent`, `theme` field for per-Season styling. Same shape every Season; only data and styling differ. Separate work — see the ledger.

Nothing in this spec protects Season 1 from being overwritten by a hand-edit. That protection arrives only with the Seasons collection.

**Cron tuning.** Alarm noise (24 red runs on a bad upstream night) is a live risk but unproven. If it materialises: lengthen the schedule interval, or fail only on `stage: "derivation"`. Not pre-solved.

**Full atomicity.** Three sequential `updateGlobal` calls could still fail partway on a database error. Payload offers no cross-global transaction here. Not addressed.

## Verification

- A forced Derivation failure turns the GitHub Actions run red and leaves `lastSyncError` populated.
- A forced Derivation failure leaves Progression **unchanged** — no partial write.
- A successful Sync clears `lastSyncError`.
- The Rotmire regression test fails against the old `raidProgress[0]` logic and passes against current.
- Removing `tier-mn-1` from a fixture produces the R6 message listing the remaining slugs.
