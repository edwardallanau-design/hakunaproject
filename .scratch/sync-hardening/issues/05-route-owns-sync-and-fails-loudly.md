# 05 — The route owns the Sync and reports failure honestly

Status: Ready
Blocked by: 03
Spec: `.scratch/sync-hardening/spec.md` (R1, R3, R4) · ADR 0001

## Why this is the payoff

Tickets 01–04 build the seam. This one closes the lie: today a failed Derivation returns `200`, the schedule prints "Sync completed successfully", and the admin button goes green while the site serves stale data.

## Scope

**Remove** the `afterChange` hook from `src/globals/GuildDetails.ts` entirely.

**Restructure the route** (`src/app/(app)/api/sync-guild-details/route.ts`) to own the whole operation, in this order:

```
1. Fetch + validate            → on throw: stage "fetch"
2. Read current CMS state
3. Derive progression + officers IN MEMORY   → on throw: stage "derivation"
4. Write guild-details, progression, officers-section
```

Nothing is written until both derivations have succeeded.

**On failure**: write `lastSyncError` to `guild-details`, return **non-200** with `{ error, stage, message }`.

**On success**: clear `lastSyncError`.

**Add the `lastSyncError` field** to the `GuildDetails` global — `textarea`, `readOnly`, positioned next to `lastSyncedAt` with a description making clear that a value here means the displayed data is stale.

## Non-negotiable

Never return a 2xx for a failed Sync. The workflow's check is `if [ "$response" != "200" ]` — any 2xx (including a 207) restores exactly the silent-green blindness this feature removes.

## Note on the exception

Writing `lastSyncError` on the failure path is a deliberate exception to "nothing is written on failure". It is metadata about the Sync attempt, not derived site data. Write only that field; do not write derived state.

## Verification (manual, against a real Sync)

- Force a Derivation failure → the GitHub Actions run goes **red**, `lastSyncError` is populated, and Progression is **unchanged**.
- Force a Fetch failure → `stage: "fetch"` in the response.
- A successful Sync clears `lastSyncError` and updates all three globals.
- The admin button shows red with a useful message on failure.

## Done when

- The `afterChange` hook is gone.
- A failed Derivation returns non-200 and writes nothing but `lastSyncError`.
- Both unattended and operator-triggered Syncs report failure truthfully.
