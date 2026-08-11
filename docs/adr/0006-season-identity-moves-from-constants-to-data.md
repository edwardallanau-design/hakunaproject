# 6. A Season's upstream identity lives on the Season, not in constants

Date: 2026-08-10

Amends ADR 0003.

## Status

Accepted

## Context

ADR 0003 kept the Rank Source as `PRIMARY_RAID_SLUG` in `syncProgression.ts` and made its absence a Derivation failure. That decision assumed one Season exists at a time, which was true when the site rendered a single `progression` global.

Once Seasons are rows, the assumption breaks. `PRIMARY_RAID_SLUG = "tier-mn-1"` is a fact *about Season 1*, sitting in a file that Season 2 also reads. With an archived Season 1 row and a current Season 2 row coexisting, a single constant is necessarily wrong for one of them. This is not a preference between data and code — the constant becomes unable to express the model.

The same applies to the Raids that contribute kills. `deriveProgression` iterates every Raid in the response with no notion of which belong to the Season being written; only Boss name-matching prevents cross-Season contamination, which is a coincidence rather than a design.

ADR 0003 anticipated this: it rejected a CMS field *as a fix for the silent-decay defect*, while recording that it was "not unreasonable as an addition" and "acceptable only in addition to failing loudly, never instead of it."

## Decision

**Each Season carries its own upstream identity**: the Raid slugs that contribute kills, the Rank Source Raid slug, and the M+ season slug its scores came from.

**The loud failure moves with the slug and is otherwise unchanged.** If a Season's Rank Source Raid is absent from a non-empty `raidRankings`, Derivation throws, naming the missing slug and listing what was returned. ADR 0003's distinction is preserved intact: an *empty* `raidRankings` remains the genuine no-data case and still preserves existing ranks.

The M+ season slug is recorded as provenance for the Snapshot. It is deliberately **not** used to pin the live fetch — see ADR 0005.

## Consequences

A Season rollover becomes a data edit rather than a deploy. ADR 0003 accepted a manual one-line code change once a Season; that cost disappears, but its safety property does not, because the throw is what makes a wrong value loud and the throw is unchanged.

A mistyped slug is now a data error rather than something visible in a diff. This is the trade ADR 0003 examined and answered: noticing was always the whole problem, and the throw is what solves noticing.

Archived Seasons become self-describing — a Season 1 row records that it comprised `tier-mn-1` and `sporefall`. Note this is documentation, not a recovery mechanism; ADR 0005 forbids re-fetching regardless.

Kill aggregation can now be scoped to the Season's own Raids instead of relying on name-matching to reject foreign encounters.
