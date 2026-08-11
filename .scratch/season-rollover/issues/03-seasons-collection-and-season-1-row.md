# 03 — Seasons collection and the Season 1 row

**What to build:** Season 1 exists as a row in a new Seasons collection, with a pointer naming it as the current Season. The operator can open the admin panel and see Season 1's bosses, kills, rankings and Leaderboard in their new home.

This ticket is **purely additive**. The `progression` global is left completely intact and the site still renders from it, so nothing user-facing changes and nothing can break. That is deliberate: it means the cutover in ticket 04 has exactly one possible cause if it goes wrong.

**Blocked by:** 02 — Snapshot Season 1

**Status:** ready-for-agent

- [ ] A Seasons collection exists with the fields agreed in the spec — display name, URL slug, theme slug, started-at, contributing Raid slugs, Rank Source Raid slug, M+ season slug, the progression data moved across unchanged, and the M+ Participants field
- [ ] The Participants field is JSON, not an array — roughly 585 rows would make the admin edit screen unusable, and this is archival data that should not be hand-edited
- [ ] `tier` does not appear on the Season; its role is taken by the display name, per the domain glossary
- [ ] The three kinds of slug on the row are named so they cannot be confused — Raid slugs and the M+ season slug identify things upstream, the URL slug identifies a page on this site
- [ ] A `currentSeason` relationship field on the guild settings global names the current Season. **Not** an `isCurrent` boolean per row — exactly-one must be true by construction
- [ ] A committed migration copies the `progression` global into a Season 1 row, per ADR `0004`
- [ ] The migration **copies**; the global is left intact and unread so the step stays reversible
- [ ] Season 1's row records contributing Raids `tier-mn-1` and `sporefall`, Rank Source `tier-mn-1`, and M+ season `season-mn-1`
- [ ] **Season 1's Participants are populated from the snapshot JSON**, not left empty. This is the only chance: the Sync writes only to the current Season, so once Season 2 is current no code path can ever fill them in
- [ ] The pointer is set to Season 1
- [ ] Verified: the migrated row matches the snapshot JSON from ticket 02 field for field, and the live site is unchanged
