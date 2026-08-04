# 02 — Zod schema at the fetch boundary

Status: Ready
Blocked by: 01
Spec: `.scratch/sync-hardening/spec.md` (R5) · ADR 0002

## Scope

Validate the Raider.IO response before any transform runs, and make `GuildDetailsData` an inferred type rather than a hand-written assertion.

- Add `zod` (4.x) as a dependency. Server-only; no client bundle impact.
- Define schemas for the **consumed fields only** of both the details and roster responses. Do not model the full upstream shape.
- `parse()` in `fetchAndTransformGuildDetails` immediately after `res.json()`, before any mapping.
- Replace the hand-written `GuildDetailsData` / `RosterMember` types with `z.infer` equivalents. Keep the exported names — `syncProgression.ts`, `syncOfficers.ts` and `page.tsx` import them.
- Match optionality to actual usage: `raidAttempt` is consumed as `raidAttempt?.encounters ?? {}`, so it is `.optional()`. Do not make the schema stricter than the code requires.

The three existing "guild may not exist or was renamed" guards can largely be subsumed by the schema, but keep their *message quality* — "guild may not exist or was renamed" is more useful to an operator than a raw Zod path.

## Capture a fixture

While writing the schema you need a real response in front of you. Save a trimmed copy as a test fixture — ticket 03 and 04 both need it, and it must contain **two raids** (`tier-mn-1` and `sporefall`) for the Rotmire case.

## Tests

- A known-good fixture parses.
- A malformed response (missing `encountersDefeated`) fails at the boundary with a path naming it.
- Unknown keys (e.g. `subregion`) are stripped without error.

## Watch out

Validation is now stricter than before, so Syncs can fail on responses the old code tolerated. That is the point, but combined with the loud failures from ticket 05 it could mean noise before safety. Keep the schema scoped to consumed fields and optionality aligned with usage.

## Done when

- Upstream shape violations throw at the boundary, naming the path.
- `GuildDetailsData` is inferred from the schema, not declared alongside it.
- A two-raid fixture exists for later tickets.
