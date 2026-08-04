# 04 — Rank Source absence throws

Status: Ready
Blocked by: 03
Spec: `.scratch/sync-hardening/spec.md` (R6) · ADR 0003

## Why this matters

This is the Season 2 tripwire. `PRIMARY_RAID_SLUG` must be bumped when a new Season pins a different Raid; today its absence silently preserves stale rankings forever. The point of this ticket is to convert a silent decay into an announcement.

## Scope

Inside `deriveProgression` (pure, from ticket 03):

- If `raidRankings` is **non-empty but does not contain** `PRIMARY_RAID_SLUG`, throw. The message names the missing slug and lists what was returned:

  > Rank source raid "tier-mn-1" not found in response. Available: tier-mn-2, sporefall

- If `raidRankings` is **empty**, keep the existing preserve-on-null fallback. That is the guild-rename case — no data at all — and it is distinguishable from "the pinned Raid is absent but others are present."

The constant stays a constant. Do **not** move it to a CMS field and do **not** derive it from the API — see ADR 0003 for why both were rejected.

## Tests

- Picks the pinned raid's mythic ranks when present.
- Throws when `raidRankings` is non-empty and lacks the pinned slug, with the available slugs in the message.
- Preserves existing rankings when `raidRankings` is empty.

## Done when

- A fixture with `tier-mn-1` removed produces the message above.
- The rename scenario (empty rankings) still preserves, and is covered by a test.
