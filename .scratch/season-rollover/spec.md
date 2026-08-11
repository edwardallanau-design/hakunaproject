# Season rollover

Status: `ready-for-agent`
Date: 2026-08-10

## Problem Statement

The site renders one `progression` global: one boss list, one rankings group, one M+ leaderboard. There is no way to represent more than one Season, so Season 2 cannot be recorded without destroying Season 1.

Season 2 begins **2026-08-12**; its raid and Mythic+ open around **2026-08-17**.

The destructive act is not a human editing the CMS — it is the **hourly Sync at `:17`**. Specifically:

- **The M+ Leaderboard is overwritten by the first Season 2 key anyone runs.** `syncProgression.ts:132` replaces the stored list whenever the freshly-derived one is non-empty. One member finishing one dungeon produces a one-entry list, and ten rows of Season 1 history become one row of Season 2.
- **The ADR 0003 tripwire does not reliably catch this.** That throw requires the Rank Source Raid to *vanish* from `raidRankings`. If Raider.IO retains `tier-mn-1` and merely adds `tier-mn-2`, no throw fires and the Sync proceeds normally.
- **The loss is permanent.** Per ADR `0005`, Raider.IO stores M+ scores per Character and rebuilds any guild-scoped historical query from *present* membership. A Participant who leaves the Guild disappears from their own Season's record, and a Guild rename breaks the lookup entirely — this Guild has already been renamed once.

Boss kill data is **not** at risk. The Guild is 10/10 Mythic (9 × `tier-mn-1` plus Rotmire, finishing Midnight Falls 2026-07-17), so every Boss hits the kill lock at `syncProgression.ts:72`.

## Solution

Seasons become rows. Each Season owns its data, its upstream identity, and its visual identity. Exactly one Season is current — named by a pointer — and the Sync writes only there. Every other Season is archived: a frozen Snapshot, never re-synced and structurally unreachable by any Sync.

Visitors can switch to an archived Season and see the site as it looked then, with a notice making clear which parts of the page are historical.

Delivery is in two parts. A **stopgap** removes the deadline within hours by freezing all writes and capturing Season 1. The **build** then proceeds unhurried.

## User Stories

### Preserving Season 1

1. As the operator, I want the scheduled Sync stopped before Season 2 begins, so that no automated write can touch Season 1 while the collection is still being built.
2. As the operator, I want the Sync route to refuse to run even when triggered manually, so that pressing the admin button out of habit mid-build cannot overwrite Season 1.
3. As the operator, I want the disabled Sync to report its state explicitly rather than appear to succeed, so that I am never misled into thinking data refreshed.
4. As the operator, I want Season 1's data exported to a reviewable file, so that I can read every kill date, rank and score with my own eyes before anything migrates.
5. As the operator, I want a whole-database snapshot alongside the export, so that a mistake in any part of the migration is recoverable, not just the part I anticipated.
6. As the operator, I want the export shaped like the Season row it will become, so that the migration inserts reviewed data rather than transforming live data.

### Recording Seasons

7. As the operator, I want each Season stored as its own row, so that recording Season 2 cannot destroy Season 1.
8. As the operator, I want exactly one Season to be current at any time, so that the Sync can never be ambiguous about where it writes.
9. As the operator, I want switching the current Season to be a single edit, so that there is no window in which the site is in an undefined state.
10. As the operator, I want each Season to record which Raids contributed its kills, so that an archived Season describes itself without reference to code.
11. As the operator, I want each Season to name its own Rank Source Raid, so that rolling over is a data edit rather than a code deploy.
12. As the operator, I want a wrong Rank Source to fail loudly exactly as it does today, so that moving the value to data does not reintroduce silent decay.
13. As the operator, I want each Season to record which M+ season its scores came from, so that an archived Leaderboard is not an unlabelled set of numbers.
14. As the operator, I want to create the next Season's row before making it current, so that I can prepare it fully and switch when ready.
15. As the operator, I want to type the new Season's boss list by hand, because the upstream API omits un-pulled encounters and cannot be relied on to supply one.

### Capturing participation

16. As a guild member, I want every Participant with an M+ score recorded for the Season, so that my participation is preserved even if I am not in the top ten.
17. As a guild member, I want my Season's record to survive my leaving the Guild, so that history reflects who was there at the time.
18. As a visitor, I want the site to keep showing a top-ten Leaderboard, so that the card stays readable and does not become a wall of hundreds of names.
19. As the operator, I want participation captured from data the Sync already fetches, so that completeness costs no extra upstream request.

### Sync behaviour

20. As the operator, I want the Sync to write only to the current Season, so that archived Seasons are unreachable by design rather than by a guard that could be bypassed.
21. As the operator, I want the Sync to fail loudly when no Season is current, so that a missing pointer is announced rather than silently writing nothing.
22. As the operator, I want the Sync to proceed normally when the current Season has no bosses yet, so that a normal mid-rollover state does not spam failures and train me to ignore the alarm.
23. As the operator, I want rankings and M+ data to keep syncing while a boss list is still being filled in, so that a partially configured Season is still useful.
24. As the operator, I want kill aggregation scoped to the Season's own Raids, so that encounters from another Season cannot contaminate the boss list.
25. As the operator, I want the existing failure contract (`stage`, `message`, `lastSyncError`) preserved, so that the admin button and the scheduled workflow keep reporting failures the way they do now.

### Viewing archived Seasons

26. As a visitor, I want to switch between Seasons from the home page, so that I can see past progression without leaving the site.
27. As a visitor, I want an archived Season's URL to be shareable, so that I can link a specific Season in Discord.
28. As a visitor, I want the site to adopt the Season's own colours when I switch, so that viewing Season 1 shows the site as it looked then.
29. As a visitor, I want a clear notice that I am viewing an archived Season, so that I do not mistake historical progression for current standing.
30. As a visitor, I want the officers, recruitment and about sections to stay current while viewing an archived Season, so that I am not misled about who to contact today.
31. As a visitor, I want an unrecognised Season link to show the current Season rather than an error, so that a stale link still works.
32. As a visitor, I want my light/dark preference to keep working, so that switching Seasons does not remove a setting I rely on.

### Migration safety

33. As the operator, I want the migration to copy rather than move, so that the original data remains available if the copy is wrong.
34. As the operator, I want the old global left intact until production is verified, so that the riskiest step stays reversible.
35. As the operator, I want the old global removed in a separate later change, so that cleanup is a deliberate decision made with evidence.
36. As the operator, I want the Sync re-enabled only after the collection is verified, so that writes resume against a model known to be correct.

## Implementation Decisions

### Stopgap — ships first, independently

- Remove the `schedule:` trigger from the Sync workflow. Keep `workflow_dispatch` as a deliberate manual escape hatch.
- Gate the Sync route on a `SYNC_DISABLED` environment flag. When set, return a non-200 using the existing failure contract with its own `stage`, so the admin button reports the state honestly rather than silently no-op'ing.
- Add a snapshot script following the established pattern in the existing `scripts/` directory: explicit `@next/env` loading, then a dynamic import of the Payload config after the environment is populated. Unlike the seeding script, this one deliberately targets production, so it must **not** carry the refuse-if-not-localhost guard — it needs the inverse posture.
- The script writes the `progression` global to a committed JSON file, shaped as the Season row it will become.
- Cut a Neon branch for whole-database insurance.

### Seasons collection

Fields:

| Field | Notes |
|---|---|
| `name` | Display label, e.g. "Midnight Season 1". Replaces `tier`, which retires from the domain language |
| `urlSlug` | Identifies the Season in the switcher. Distinct from Raid slugs and the M+ season slug |
| `themeSlug` | Selects the Season's palette |
| `startedAt` | Orders the switcher explicitly rather than by row order |
| `raidSlugs[]` | Raids contributing kills, e.g. `tier-mn-1`, `sporefall` |
| `rankSourceRaidSlug` | Per ADR 0006 |
| `mythicPlusSeasonSlug` | Provenance for the Snapshot, e.g. `season-mn-1`. Deliberately **not** used to pin the live fetch — see ADR 0005 |
| `difficulty`, `summary`, `profileUrl`, `lastSyncedAt` | Moved unchanged from the global |
| `kills`, `totalBosses`, `rankings`, `bosses[]`, `mythicPlusRunners[]` | Moved unchanged from the global |
| `mythicPlusParticipants` | New. JSON, every Participant with a score |

Three distinct kinds of slug now coexist on one row — Raid slugs identify Raids upstream, the M+ season slug identifies a season upstream, and `urlSlug` identifies a page on this site. Field naming must keep them unmistakable.

`mythicPlusParticipants` is a JSON field rather than an array field deliberately: roughly 585 rows would make the admin edit screen unusable, and this is archival data that should not be hand-edited. The trade-off accepted is that correcting it requires a script.

### Current Season pointer

- A `currentSeason` relationship field on the existing guild settings global names the current Season.
- Chosen over an `isCurrent` checkbox so that exactly-one is true by construction. A boolean per row can represent two currents or zero, and preventing that needs a hook that a migration or seed script can bypass.
- An empty pointer is a Derivation failure, per ADR 0001.

### Derivation changes

- `deriveProgression` keeps its shape: `(fetched data, current Season state) → new state`. The Season's identity fields arrive through the **existing** current-state parameter, since they live on the same row. No new parameter, no new seam.
- Kill aggregation is scoped to the Season's `raidSlugs` instead of iterating every Raid in the response.
- The Rank Source is read from the Season row. The throw is unchanged in behaviour: absence from a **non-empty** `raidRankings` throws naming the missing slug and listing what was returned; an **empty** `raidRankings` remains the genuine no-data case and still preserves existing ranks.
- Participants are derived from the roster already fetched — every member with a score — alongside the existing top-ten Leaderboard. No new upstream request.
- The empty-boss-list path is preserved and made deliberate rather than incidental: rankings and M+ still derive, bosses stay empty.

### Migration

- Copies the `progression` global into a Season 1 row. The global is left intact and unread.
- **Season 1's Participants come from the snapshot, not from a Sync.** The `progression` global holds only the displayed top ten; the full roster with scores lives in the stored `guild-details` payload, which the snapshot script reads directly. Because the Sync only ever writes to the current Season, the migration is the **last** point at which Season 1's Participants can be recorded — once Season 2 is current, no code path can reach them.
- A separate, later change removes the global once production is verified rendering from the collection.
- Season 1's row is populated with `raidSlugs` of `tier-mn-1` and `sporefall`, `rankSourceRaidSlug` of `tier-mn-1`, and `mythicPlusSeasonSlug` of `season-mn-1`.
- Per ADR 0004, this goes through a committed migration.

### Frontend

- A Season switcher on the home page, driven by a query parameter. The home page continues to render the current Season by default.
- Switching re-themes the site and swaps the stats bar and progression card. About, officers and recruitment remain current.
- A visible notice states that an archived Season is being viewed.
- Each Season's theme is a full 13-token palette applied by class. The existing light palette is left as-is and season-neutral; the light/dark toggle keeps working unchanged.
- An unrecognised `urlSlug` falls back to the current Season rather than erroring.

## Testing Decisions

Good tests here assert **external behaviour** — given this upstream response and this stored Season, what is written — not the internal steps taken to get there. The existing suite is the model: fixtures come from real captured Raider.IO responses, trimmed to what is consumed.

Two seams, both pure functions:

**`deriveProgression`** — existing seam, existing test file, existing prior art. New cases:

- Kills aggregate only across the Season's own `raidSlugs`; an encounter from a Raid outside the Season does not enter the boss list.
- The Rank Source is read from Season data; absence from a non-empty `raidRankings` throws naming the slug; an empty `raidRankings` still preserves ranks.
- Every Participant with a score is captured while the displayed Leaderboard stays capped at ten.
- A Season with an empty boss list still derives rankings and Participants.
- The kill lock still freezes killed Bosses.
- Regression: the Rotmire case (a kill in a Raid other than the first) must keep passing.

**`resolveRequestedSeason`** — new seam. `(all Seasons, current Season id, requested slug) → Season`. Cases: no slug requested; an unrecognised slug; a slug naming the current Season; a slug naming an archived Season; an empty pointer.

Deliberately not tested, consistent with the sync-hardening spec's scope: Payload configuration, React components, and the page's field mapping. The migration mapping is verified by inspection against the snapshot JSON and the live site rather than by test — accepted because copying rather than moving keeps that step reversible.

## Out of Scope

- **Per-Season officers, recruitment and about copy.** The archive covers progression only; a notice makes that explicit.
- **Per-Season light palettes.** Seasons define the dark palette; the light palette stays season-neutral. Additive later.
- **Removing the light/dark toggle.** Not required by this work and not on a clock.
- **Pinning the M+ fetch by season slug.** Rejected in ADR 0005 — it addresses season drift but not roster drift, and capturing the Snapshot promptly addresses both.
- **Auto-generating boss lists.** The API omits un-pulled encounters and even some killed ones; verified live, `raidAttempt` returned 8 encounters for a 9-boss Raid with a Boss killed 2026-04-09 absent entirely.
- **Deleting the `progression` global.** Deliberately deferred to a separate change after verification.
- **Backfilling Seasons earlier than Season 1.** Per ADR 0005 they cannot be faithfully reconstructed.

## Further Notes

**Ordering matters.** The stopgap must land before Season 2 begins on 2026-08-12. Everything else can follow at any pace, because once writes are frozen and the Snapshot is taken there is no longer a deadline.

**Re-enabling the Sync is the last step**, after the collection is verified in production. Clearing `SYNC_DISABLED` and restoring the `schedule:` trigger should be a deliberate, separately reviewed change.

**Values captured live on 2026-08-10**, useful for verifying the migration landed correctly:

- `tier-mn-1` mythic ranks — world 1375, region 450, realm 6
- `sporefall` mythic ranks — world 732, region 706, realm 17
- 10/10 Mythic; last kill Midnight Falls 2026-07-17; Rotmire 2026-06-17
- `season-mn-1` returned 585 ranked Characters
- `season-mn-2` already exists upstream and returns zero Characters; an invalid season slug returns HTTP 500

**Related decisions:** ADR 0001 (derive before write, fail loudly), ADR 0003 as amended (Rank Source fails loudly), ADR 0004 (committed migrations), ADR 0005 (archived Seasons are frozen Snapshots), ADR 0006 (Season identity is data).
