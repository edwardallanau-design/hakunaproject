# 03 — Extract Derivation into pure functions

Status: Ready
Blocked by: 01, 02
Spec: `.scratch/sync-hardening/spec.md` (R2) · ADR 0001

## Scope

The refactor the rest of the feature hangs off. **Behaviour-preserving** — no functional change, no route change yet.

Both `syncProgressionFromDetails` and `syncOfficersFromDetails` currently read `guild-details` back out of the database, compute, and write their own global. Split each into two:

- **Pure**: `deriveProgression(details, currentProgression)` → new progression state. `deriveOfficers(details, currentOfficers)` → new officers state. No `Payload` import, no I/O.
- **Caller**: reads the globals, calls the pure function, writes the result. Keeps the existing exported name and signature so `GuildDetails.ts` still works unchanged for now.

Derivation needs current CMS state as well as upstream data: the API supplies only the update, the CMS supplies the list of things to update (the Season boss list, the officer roster).

## Tests — boss resolution

This is the highest-value test in the feature. Cover:

- **Rotmire regression** — a two-raid fixture where the kill is in the *second* raid. Must fail against `raidProgress[0]` logic and pass against current. This is the whole reason the feature exists.
- Kill aggregation across all raids in the response.
- The **kill lock**: a boss already `killed: true` is returned untouched, even if absent from the response.
- Name→slug reconciliation, including the fallback that slugifies the CMS name when no API slug matches.
- `pulls` / `bestPull` rules: `bestPull` is set only while `pullCount > 0` **and** the boss is not killed.

## Watch out

The kill lock protects a boss row from *sync*, not from being *replaced*. Do not describe it in comments or tests as protecting history in general — it does not, and that misreading is what makes the Season 2 rollover dangerous.

## Done when

- `deriveProgression` and `deriveOfficers` are pure and importable without a database.
- The Rotmire regression test exists and passes.
- Live Sync behaviour is unchanged from before this ticket.
