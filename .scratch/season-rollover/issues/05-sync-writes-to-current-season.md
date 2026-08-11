# 05 — The Sync writes to the current Season

**What to build:** A Sync run resolves the current Season from the pointer and writes only there. Archived Seasons are not addressable by any Sync — not guarded against, structurally unreachable. The Season's own Raid slugs and Rank Source now drive Derivation, per ADR `0006`.

This is the logic-heavy ticket. It is where the loud-failure guarantees from ADR `0001` and ADR `0003` have to survive being moved from constants onto data.

**Blocked by:** 04 — The site renders the current Season from the collection

**Status:** ready-for-agent

- [ ] The Sync route resolves the current Season via the pointer and writes to that row
- [ ] `deriveProgression` keeps its existing shape — `(fetched data, current Season state) → new state`. The Season's identity fields arrive through the **existing** current-state parameter, since they live on the same row. No new parameter and no new seam
- [ ] Kill aggregation is scoped to the Season's own contributing Raid slugs, rather than iterating every Raid in the response
- [ ] The Rank Source Raid slug is read from the Season row
- [ ] The loud failure is unchanged in behaviour: absence of the Rank Source from a **non-empty** rankings list throws, naming the missing slug and listing what was returned
- [ ] An **empty** rankings list remains the genuine no-data case and still preserves existing ranks — the ADR 0003 distinction survives intact
- [ ] An empty `currentSeason` pointer is a Derivation failure that throws, per ADR `0001` — a missing pointer must be announced, never silently write nothing
- [ ] A current Season with an empty boss list is **not** a failure: rankings and M+ still derive, bosses stay empty. This is a normal mid-rollover state and must not spam alarms
- [ ] The kill lock still freezes killed Bosses
- [ ] The existing failure contract — stage, message, and the last-sync-error field — is preserved
- [ ] Tests extend the existing derivation suite, using real captured upstream responses trimmed to consumed fields, and cover: Season-scoped kill aggregation, Rank Source read from data, the throw, the empty-rankings preserve path, the empty-boss-list path, and the kill lock
- [ ] The Rotmire regression test — a kill in a Raid other than the first — still passes
