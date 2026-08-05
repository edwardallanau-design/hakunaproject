# 3. The Rank Source stays a constant, and its absence fails loudly

Date: 2026-08-04

## Status

Accepted

## Context

Guild rankings are reported per-Raid and cannot be merged, so exactly one Raid is nominated as the **Rank Source** for the world/region/realm numbers the site displays. Kills, by contrast, are aggregated across every Raid.

The Rank Source is the constant `PRIMARY_RAID_SLUG = "tier-mn-1"` in `syncProgression.ts`. It must be changed by hand when a new Season pins a different Raid.

The ledger recorded this as needing a manual bump each Season, and proposed either moving it to a CMS field or deriving the current tier from the API.

The actual defect is neither. When the pinned slug is absent from the response, `mythicRanks` is null and the preserve-on-null path falls back to the existing rankings rather than failing. That fallback was added for the guild rename, where the new profile had no data yet and zeros would have wiped real ranks. The consequence is that "the pinned Raid is not in this response" and "the guild temporarily has no data" are handled identically, despite being entirely different situations. Rankings freeze at their last known values indefinitely, with no signal.

## Decision

**Keep the Rank Source as a constant in code.**

**Treat its absence as a Derivation failure.** If `PRIMARY_RAID_SLUG` is not present in `raidRankings`, throw — naming the missing slug and listing the slugs that were returned:

> Rank source raid "tier-mn-1" not found in response. Available: tier-mn-2, sporefall

Under ADR 0001 this means nothing is written, the schedule goes red, and `lastSyncError` carries that message.

**Keep the preserve-on-null fallback only for the genuine no-data case** — an empty `raidRankings` — which is distinguishable from "the pinned Raid is absent but others are present."

## Consequences

The Season rollover stops being a silent decay and becomes a one-line change the system tells you to make, quoting the value to change it to.

The bump remains manual and still requires a deploy. Accepted: it is one line, once a Season, and it is now announced rather than discovered.

The rename scenario that motivated the fallback is still handled, because it presents as no data at all rather than as a missing Raid.

This is the tripwire for the Season 2 rollover, so it is directly covered by the rank-source tests.

## Alternatives considered

**Move the slug to a CMS field.** Rejected as a fix, though not unreasonable as an addition. It leaves the defect entirely unchanged — a wrong value would still silently preserve stale ranks. It converts a deploy into a form edit, but noticing is the whole problem, and it does not convert silence into a signal. Acceptable only *in addition to* failing loudly, never instead of it.

**Derive the current tier from the API.** Rejected. No field in the response identifies the main tier, so it would have to be inferred from ordering or recency. That is precisely the implicit-contract mistake the Rotmire fix corrected — the ledger's own conclusion was that index order was never a contract. Re-deriving the Rank Source heuristically walks back into it.
