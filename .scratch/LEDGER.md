# Project Ledger

The durable record for this repo. **Shipped** is append-only — what was built and why, so it never has to be rediscovered. **Open** is the live backlog.

Feature-sized work gets its own directory under `.scratch/<feature-slug>/` per `docs/agents/issue-tracker.md`. This file is the index over all of it.

This file is committed. Keep it accurate; it is the only durable record — `docs/` is gitignored except `docs/agents/`.

---

## Open

Known issues, not yet actioned. Oldest first.

### Season 2 rollover: creating the row and re-enabling the Sync

Tickets `09`–`11` of `.scratch/season-rollover/spec.md`.

- **`09` — create the Season 2 row. DONE in production 2026-08-25.** See the Shipped entry below for what was deployed and verified.
- **`10` — re-enable the Sync. DONE 2026-08-25.** Schedule restored (`c63ebbf`), `SYNC_DISABLED` cleared by the operator, first Sync ran clean. See the Shipped entry.
- **`11` — remove the `progression` global. DONE 2026-08-25.** See the Shipped entry. The rollover spec is now fully delivered.

### Season 2 theming: what is left after the v2 layout

`.scratch/season-2-theming/spec.md`, tickets `01`–`07`. ADR `0007`. Specced 2026-08-11. **Tickets `01`–`03` shipped, and the v2 editorial layout shipped on top of them (see Shipped). What follows is only what genuinely remains.**

**The sequencing question is closed, and the losing half has been deleted from this file.** The spec gated rollover ticket `09` on the full venom theme; the operator reversed that on 2026-08-25 in favour of **palette-first** — ship colours and type, create the Season 2 row, re-enable the Sync, *then* build the layout. That is what happened. `09` no longer waits on `07`. Both paragraphs stood here side by side for several commits, each contradicting the other; a `/code-review` found it.

Resolved, recorded so nobody re-opens them:

- **`04` backdrop and `05` motifs — shipped, inside the layout** rather than as standalone theme-package elements. The venom backdrop, gem corners, notched cards and section dividers are all in `globals.css` and the `venom/` tree.
- **`06` key art — deliberately not built**, and the generic slot with it. `hasKeyArt` is deleted from the manifest: the design bakes its serpent-eye crest into the venom hero, so nothing generic was ever needed. A theme wanting key art draws it in its own component tree, which ADR `0007`'s amendment now permits.
- **Ticket `03`'s light-mode criterion is reversed** — venom is dark-only, and ADR `0007` carries the amendment (2026-08-25) rather than a code comment claiming to supersede it.

Still open:

- **~~The dungeon rotation is derived at request time, not stored.~~ CLOSED 2026-08-26** — runs are now fetched by the hourly Sync and stored on the Season row; the page does no I/O. Render went 7.1s cold to 0.23s with zero upstream requests. See the Shipped entry. The archived-Season gap it also named is *unchanged and deliberate*: a section headed Recent Keys showing a past season's final week answers nothing anyone asked.
- **Ticket files `03`–`07` still read `Status: ready-for-agent` with unchecked boxes.** The work is done or superseded; the paper was never reconciled. The operator deferred this explicitly on 2026-08-25 ("we'll reconcile the specs later") — it is bookkeeping, not risk, but a future session reading the tickets alone would draw the wrong conclusion.
- **`07` — the gate.** Narrowed to a QA matrix now that `09` does not wait on it. Not formally run end to end.
- **12 sites across 6 components hardcode light-mode colours** in `isVoid ? dark : light` literals no CSS token can reach. Not blocking — it is precisely why venom hides the light toggle — but it is the reason a future theme cannot ship a light variant without touching frozen files.

## Shipped

Append-only. Newest first.

### 2026-08-26 — Three mobile defects, and hover becomes a gated affordance

Reported from an iPhone 17 in Safari, and reproduced in Brave and every other browser on the device — which was the first clue, because all iOS browsers are WebKit underneath. Commits `d8d9949` and `1da2436`.

**The raid "4/8" and the marquee Pause button both fell to the bottom of their section, for one shared reason.** `SectionHeader` gave its title block `minWidth: min(100%, 300px)`. The 300px floor existed to stop a wide meta crushing the heading, but on a phone that expression resolves to **100%** — the title claimed the whole row and flex-wrap pushed the meta onto a line of its own. It becomes `minWidth: 0`, so the heading wraps internally instead of the row wrapping. Only `RaidTimeline` and `DungeonMarquee` pass `meta`, so the behaviour change lands exactly on the two reported sections; the metaless headers simply fill the row.

**Tapping the marquee paused it with nothing able to resume it — and the existing Pause button was not the fix, it was the proof.** iOS Safari leaves a tapped element in `:hover` until something else is tapped, so a tap paused the strip through the *desktop* hover rule while React state still read `paused: false`. Pressing Pause and then Resume round-tripped the state and landed back on the same stuck hover. The button was working correctly; it was operating a different mechanism from the one holding the strip.

**Touch gets hold-to-pause instead**, which is what the operator asked for. `held` is separate state from `paused` rather than folded into it, because they are different intents with different lifetimes: `paused` is a decision that persists until undone, `held` lasts exactly as long as a finger is down. `data-paused` is `paused || held`, so releasing a hold can never clear a deliberate press of the button. `held` clears on `pointerup`, `pointercancel` **and** `pointerleave` — `pointercancel` matters most, because iOS fires it rather than `pointerup` when a scroll takes over from a touch that began in the strip, and missing it would strand the strip paused with the button still reading "Pause". That is the reported bug rebuilt from the other side.

**The button stays.** Hold-to-pause requires a finger over the tile you were trying to read; the button is how you stop the strip and actually read it.

**The guild crest now leads the About section when it stacks.** Below 899px the two-column grid collapses, and the crest sat under a full block of prose — far enough down that it read as a footer to the section rather than its portrait. Fixed with `order: -1` rather than by reordering the markup, so the DOM keeps heading → prose → image: that is what a screen reader announces and how focus moves, and neither should change because the window got narrow.

**`/code-review` then found the codebase already had an idiom for the sticky-hover problem, and it was the weaker one.** An `@media (hover: none)` block undid three lift-and-brighten effects after the fact. Undoing has to name every property the original rule set and silently misses any it forgets — that block cancelled `.venom-lift-2`'s transform but left its box-shadow glow stuck on after a tap. All six venom hover effects are now gated on `@media (hover: hover)` instead, which cannot drift that way because the declaration never applies at all. The two `.venom-btn` hovers are deliberately left ungated for now: they were out of scope for the review finding, and are recorded here as a known gap rather than swept in silently.

**Known limit, recorded because it cannot be closed from this machine.** The fix was verified in Playwright at 390×664 with touch, where `(hover: hover)` is false — but that is Chromium, which does not reproduce iOS sticky hover. Those tests prove the new code paths work; they cannot prove the original bug is gone. The reasoning rests on the platform fact that iOS reports `hover: none`, which is also why every browser on the phone behaved identically. **On-device iPhone Safari confirmation is outstanding** and is the operator's check after deploy.

### 2026-08-26 — Venom repalettes to jungle green and gold

An operator colour decision: the lime/teal accent pair becomes emerald `#22c55e`, gold `#facc15` and light green `#4ade80`, with gold taking the slot teal held. Recorded because two knock-on changes were judgement calls, not transcription, and should not be re-litigated later as accidents.

**`--warn` moved from amber `#e8b64c` to burnt orange `#f97316`.** The token exists to sit *outside* the accent pair so the dungeon marquee can say "close" as an outcome rather than as emphasis. Amber sits roughly 20 degrees from gold, so once gold was an accent, LATEST RUN and CLOSEST CALL tiles read as one colour and the token lost the only property it is for.

**BEST KEY stopped borrowing `--glow` and got its own `--best: #a7f3d0`.** The four marquee categories were four colours on paper and three in practice: `--glow` and `--accent` are one hue at two lightnesses, so BEST KEY and GUILD GROUP read as one colour twice. **This flaw predates the repalette** — the old `#a3e635`/`#84cc16` pair had it too; gold pulling attention is what made it visible.

`--glow` is the token that could not move. It is the site's emphasis colour in roughly fifty places across *both* themes — text-shadow halos, box-shadow glows, active nav states, the hero title bloom — and its job everywhere is to be luminous, which requires a bright light green. Rehueing it to separate one badge would have repainted every section. The badge moved instead.

**This makes the venom palette 14 tokens, not 13.** ADR `0007` calls the 13-token palette "required; the only mandatory element" — a floor, and `--warn`/`--miss` already sat above it since the marquee shipped. `--best` follows their pattern exactly: declared only by `.theme-venom`, with a literal fallback (`var(--best, #a7f3d0)`) so a palette-only theme degrades to a readable badge rather than an unstyled one.

Derived values moved with their source rather than being left as lime residue on an emerald page: the border rgba pair, `--shadow-accent`, the scrollbar block, the `SerpentEye` crest (entirely hardcoded, being SVG), the Low-priority recruitment pill, and the atmospheric rgba washes in the hero and sections. The deep olive darks (`#1f4a0e`, `rgba(20,50,10,…)`) were lime-derived and read muddy against emerald, so they shift to the same hue family at matched lightness.

Season 1 is untouched: `:root`, `.theme-void` and `.light` keep their original values, and no pixel-layout component was edited.

**Two more collisions the repalette caused, found by `/code-review` and fixed in the same branch.** Both were the marquee defect in a different room: gold arrived as an accent and landed next to amber literals written when `--accent2` was teal.

- **The raid timeline's DEAD and IN PROGRESS badges.** These are one badge slot in two states, on adjacent rows. DEAD paints in `--accent2`; `PROG` was the amber literal `#fbbf24`. Gold sits **4.6 degrees** from that amber at the same saturation and lightness — a badge-against-badge contrast of **1.09:1**, which is not a distinction at all. `PROG` moves to `#f97316`, matching `--warn` for the same reason: 23.4 degrees and 1.83:1.
- **The recruitment severity ramp.** `Low` had been teal and became gold, sitting beside `Medium` amber — the same 4.6-degree pair. It moves to `#4ade80`, which fixes a second problem the repalette exposed: gold is now the site's accent, so the *lowest* priority was wearing the most attention-grabbing colour. Green is the quiet end a severity ramp needs.

For the record, the BEST KEY separation is real and not just a hue change: badge-against-badge contrast goes from **1.31:1** to **1.78:1**. The old lime pair measured the same 1.31:1, which is why the flaw predates this work.

### 2026-08-26 — The hero intro becomes CMS copy, and archived Seasons lock in the admin

**`heroIntro` on Guild Settings.** The sentence under the guild name was hardcoded in `VenomPage`, on the ADR `0007` reasoning that one-off strings the design invented do not earn CMS fields. The operator moved it across that line, and the distinction that survives is a better one: the recruitment headline describes the *design* and changes when the theme does, while this sentence describes the *guild* and changes when the guild does. Migration `20260825_155820_add_hero_intro` adds one column to `guild_settings` with the existing copy as its default, so no deploy can blank it. Blank at render falls back to the built-in string rather than leaving a hole under the guild's name. Verified end to end: text set through the CMS appears on the page, then restored.

**Archived Seasons are now read-only in the admin.** ADR `0005` has frozen them since Seasons shipped, and the Sync enforced it — but the admin panel never did, so Season 1 sat fully editable with nothing but care between it and a typo. Its 595 M+ participants are the least recoverable data in the project: two of those members no longer exist upstream, so a bad write cannot be repaired by re-syncing.

"Archived" is not a stored flag but *not being the Season `guild-settings.currentSeason` points at* — the same definition the page and the Sync already use. The access function returns a `Where` rather than a boolean, so Payload applies it per document. Verified in the admin UI: **Season 2 has editable fields and a Save button; Midnight Season 1 has neither.** `delete` is locked with `update` — a Season that cannot be corrected but can be destroyed is the worst of both. An unset `currentSeason` returns `true` rather than locking everything, which would otherwise leave nobody able to set the pointer.

**The Sync is unaffected** — it writes through the Local API, which defaults to `overrideAccess: true`, and `syncArchiveSafety` remains what protects archived rows there. To edit an archived Season deliberately: point `currentSeason` at it and back, or write a script as `correct-season-1-started-at.mjs` did. Both awkward on purpose.

A warning now sits on the Seasons list view saying the collection is Sync-written, that archived Seasons are locked, and that a hand edit is overwritten within the hour "or worse, is not".

**Three fields were proposed for removal and all three are still load-bearing — recorded so they are not re-proposed.** `rankings.members` feeds `toStatsData` → `StatsBar` ("Active Members") in Season 1's frozen pixel layout, *and* is the fallback behind the venom hero's new activity count for archived Seasons and failed fetches — removing it would blank the hero on exactly the path the fallback exists to cover. `difficulty` and `summary` both render in `Progression.tsx` (lines 128 and 70), also frozen. All three retire when the pixel layout does, not before.

**Per-user hiding of the Seasons collection was declined, not deferred.** The Users collection has no roles — only email and auth — so the only discriminator is the row id, and **ids are not portable between environments**: `dev@example.com` is id 1 locally and production's operator is whatever id it happens to be. Gating on `id === 1` would either lock the real operator out or protect nobody, depending on the environment, and it would fail silently in both directions. A real fix is a `role` field plus a migration, which is a login system for a single-user CMS. The archived-Season lock already protects the irreplaceable data; the warning covers the rest.

### 2026-08-26 — Recent Keys moves into the hourly Sync

The Open item this file has carried since the section shipped. Runs are now fetched by the Sync and stored on the Season row; the page derives tiles and the activity count from what is there and performs **no I/O at all**.

**Measured: a page render went from 7.1s cold to 0.23s, with zero Raider.IO requests from the render path.** The old arrangement polled ~166 upstream endpoints inside the render on a 900s revalidate, against an upstream edge that expires at 300s — so the render that refilled the cache was essentially always the cold one, and Next dedupes fetches *within* a render but not across concurrent ones, meaning several visitors arriving on an expired cache each started their own poll. All three problems are gone at once. The Sync itself now takes 14.9s, which is what a cron is for.

**Runs are stored, not tiles, and that is the decision worth keeping.** Storing finished tiles would have frozen the presentation into the database — changing a category or a threshold would need a re-sync before it showed. Storing runs keeps every selection rule in code where it can be tested, and buys something a request-time fetch can never have: **each character exposes only their ten most recent runs, so a single poll cannot see further back than that window reaches.** Folding hourly keeps a run after it scrolls out of everyone's ten. First sync stored **1,034 runs (264 KB), spanning 0h to 6.9d** — already three times the reach of any single poll.

`mergeStoredRuns` unions parties rather than replacing them: a run can first appear when only one member's window still holds it and gain the rest on a later poll, so taking the fresh copy wholesale would sometimes *shrink* a party already seen in full. `RUN_RETENTION_MS` is seven days against a 48-hour display window — deliberately longer, so the window can be retuned without waiting days for the store to refill.

**The keys poll joins the fetch stage, so a failure fails the whole Sync before anything is written (ADR 0001).** The alternative — tolerate a keys failure so raid progression still writes — was considered and rejected: it needs a second, weaker notion of failure, and a `lastSyncError` whose description ("the data below is stale") would then be false. Only the bulk roster call can throw at all; individual profiles are already skipped one by one. A total failure therefore means Raider.IO's M+ API is down while its guild API is up, which the next hourly run heals.

Two consequences worth noting. The fetches are now explicitly `cache: "no-store"` — the Data Cache was load-bearing when a visitor's render paid for the poll, and is actively wrong when the Sync's entire job is to go and look. And the Season pointer is resolved *before* the upstream calls, because the keys poll needs that Season's own M+ slug to filter by; a missing pointer keeps the "derivation" stage it has always reported, since that is our state being wrong rather than upstream's.

**Archived Seasons still render nothing**, unchanged. Their stored runs are frozen at whatever the last Sync saw, and a section headed "Recent Keys" showing a season's final week would answer a question nobody asked. Verified: Season 1 holds 0 runs and its `lastSyncedAt` is still 2026-08-11.

**A measurement trap, twice now.** The hero read `54 ACTIVE MEMBERS` on first check against 109 in the store — not a bug. The hero stats count up from zero, and the read landed mid-animation; it settles at 109 by ~2.5s. The same artefact already has an entry below, from a `curl` that reported `0 Active Members`. Any assertion about these numbers needs the animation to finish first.

### 2026-08-26 — Recent Keys: a 48-hour window, and a real activity number

Refinement of the section below, driven by the operator reading the live board. Four changes, each measured before and after.

**Only `mythic_plus_recent_runs` is fetched now.** The other two fields contributed **zero unique runs** — everything they returned was already in `recent_runs` or in each other. They were also a slow leak: `highest_level_runs` is *season*-scoped, and only looked fresh because the season was two weeks old. By month three a standout run from month one would still have been headlining BEST KEY on a board built to move.

**A rolling 48-hour window, and tightening it made the board *more* varied, not less.** Measured on the `recent_runs` pool: 1d gives 29/32 tiles and 24 people, **2d gives 32/32 and 32 people**, 5d and 7d give 30. In a large pool every category keeps converging on the same standout runs; in a small one each has to pick from what just happened, so the names spread. A **reset-aligned** window was modelled and rejected — it leaves the section empty for the first 9 hours of every lockout, GUILD GROUP empty for four days, and the board only complete in the hours before it wipes.

**`MIN_CHARACTER_SCORE` disarmed to 0.** Under a 48-hour cap a low-scoring character only enters the pool by running *recently*, which changes the arithmetic entirely: polling all 165 takes the board from 32 distinct people to 40, leaves BEST KEY (+15..+17) and CLOSEST CALL (+7..+16) untouched, and costs only LATEST RUN, which widens from +9..+11 to +2..+11. The operator predicted the BEST KEY part exactly.

**"Active Members" finally means it.** The hero read `season.rankings.members` — the roster size, a membership number wearing an activity label since long before this work. It now reads **distinct characters with a key in the last 48 hours: 112 of 165**, from the same poll and the same clock as the tiles. Falls back to the roster count at zero, which is what an archived Season (fetch skipped) or a failed fetch produces — so the degraded case is exactly the old behaviour, not a bare `0` under a headline.

**Characters, not people, and the payload cannot do better.** `persona_id` looked like an account link and is not: 165 characters, 163 distinct values, and the only collision is the placeholder `0` on three of them. Heavy alting is near-certain on a 165-character roster for a two-night guild, so the real headcount is unknowable. Adopted with that understood — *"that would be a good baseline for active members. alt or not"* — which is why the count is of characters and the run total (censored at ten per character) is never shown.

**Degradation was measured rather than assumed.** As activity falls the board thins in a fixed order: GUILD GROUP first (8 → 6 → 2, since a 3-member run is the rarest thing on it), then whole dungeons. `best`/`latest`/`closest` always move together — each needs exactly one run. Verified down to 2 dungeons with **zero adjacent same-dungeon or same-category tiles**, so a quiet week reads as "the guild ran five dungeons" rather than as broken cards. No placeholders and no retained stale data: retaining would break the one guarantee the window exists to make.

**Two things removed for saying nothing.** The raid header read `HEROIC · 100%` beside its `4/8` — the same fact twice, and the weaker half, since a percentage drops how big the raid is. The difficulty label stayed, because it is what the count is measured against and the toggle that would otherwise say so only appears on raids with more than one difficulty; `pct` still fills the progress rail. And the officer cards dropped **item level**, which sat opposite the rank in teal display type carrying more visual weight than any number that changes every raid night deserves.

**`ilvl` stays in the CMS and in the Sync**, because Season 1's frozen `Officers.tsx` renders it — dropping the column would edit a frozen layout to tidy a different one. Only `OfficerCard` stopped asking for it. Verified after: Season 1 still shows ilvl, venom officer cards are a uniform 134px, and no raid header contains a `%`.

**The marquee loop was fixed for thin boards.** It shifted a hard `-50%`, which assumes two copies and only looks seamless while one copy is at least as wide as the viewport — 5 tiles at 1440px, 9 at 2560px, 12 at 3440px. The degradation curve put 3-dungeon boards well inside that. The track now repeats to at least 26 tiles and shifts by `calc(-100% / var(--venom-mq-copies))`; at a full 32-tile board nothing changes.

### 2026-08-25 — The dungeon grid becomes a four-category marquee

`.scratch/dungeon-rotation/spec.md`. The section showed each dungeon's best key ever, ties broken by the *faster* clear — a rule that maximises staleness twice over, since a record only moves when it is beaten and the tie-break actively prefers the older run. Two people appeared on the whole board. It now carries four stories per dungeon — **BEST KEY / LATEST RUN / CLOSEST CALL / GUILD GROUP** — on one scrolling strip, and 14 distinct people appear across the 32 tiles.

**The bulk endpoint stopped being a run source, and that is the whole architectural change.** `mythic-plus/rankings/characters` returns **one best run per character, per dungeon** — measured: 0 of 164 characters have two runs in the same dungeon. So its "latest" is *whoever most recently set a personal best*, which surfaced a `+6` farm run as the newest thing that happened, and it drops depleted keys entirely because a blown +16 scores below a timed +14. Runs now come from `characters/profile`, unioning `mythic_plus_recent_runs`, `mythic_plus_highest_level_runs` and `mythic_plus_weekly_highest_level_runs` for the top 20 by score.

**The bulk call still happens, for exactly one reason: it is the only score-ordered source carrying each character's realm slug.** Realms vary across this guild — Heyems is on Frostmourne, not Barthilas — and a wrong realm is a 400. `mythicPlusRunners` in the Season row cannot substitute; it has no realm column. The bulk response is an address book now, never a run source.

**The roster is polled by score, not by rank — everyone at 2000 io and above, 88 characters, not the top 20** (operator: *"expand it to the whole mythic+ roster … so we will have more variety of the tiles"*, then *"safest would be let's only fetch 2k + io people"*). Twenty names fills all 32 tiles but features only **14** people, because the top of a score board is the same handful over and over. Breadth takes that to **25**, and it is where the five-man guild groups come from: Redwithwings / Kookeeya / Flashbangg / Mootilate / Slapsoil appear in no top-20 poll at all.

**The 2000 floor is free, and that is a finding rather than a compromise.** Simulated across one poll of the full 165, the board at 2000 io is *identical* to the board at no floor — same 235 runs, same 32 tiles, same 25 people, same three five-man tiles — for half the requests. `MIN_KEY_LEVEL` already discards everything a sub-2000 character contributes, because clearing +12s is roughly what earns that score in the first place; the two floors measure the same thing from opposite ends, and the score one is the cheap end, applied before the request instead of after it. Verified against the shipped code, not just the simulation.

**3000 io is the intended destination and is not reachable yet.** Guild mean **1840**, median **2153**, and only **13 of 165** are at 3000 — the board collapses to 11 people, which is the narrow board this whole change set out to fix. The constant carries the table so the next person raises it on evidence.

**`MIN_KEY_LEVEL` was raised to 12, then disarmed to 0** for the early season (operator: *"no restriction on key levels for now … since it's too early for the season"*). The reversal is evidence-led rather than a change of mind: the "+2 parade of alts" the floor was raised to stop came from the *sub-2000 characters*, not from the missing floor. Re-measured over the 963 runs the 2000-io roster returns — no floor gives **29 people** and a LATEST RUN reading +9..+11 that is **six hours fresher** (4h against 10h); +12 gives 25 people and +12..+16 at 10h. GUILD GROUP survives the removal too: only two dungeons drop to +11, and both *gain* a member doing it, which is that category working rather than degrading. The constant stays in place carrying the table, so raising it as the keys climb is a one-number edit.

**A knock-on the constant now records rather than hides:** `GUILD_GROUP_MIN = 3` was justified by Voidscar Arena having no four-person run. With the key floor off, every one of the eight dungeons fields a run of four or more (party sizes 5, 4, 4, 4, 4, 5, 5, 5), so that justification is measurably dead. It is left at 3 because raising it changes what the tiles show, which is the operator's call — but the comment says so instead of pointing at a fact that stopped being true.

**Request budget moved 7 → 89** (1 bulk + 88 profiles; it was briefly 165 before the score floor halved it) and the six `mythic-plus/static-data` calls went away: per-character runs carry `dungeon` by name, so nothing needs the zoneId→name map any more. Concurrency was sized by measurement — the full roster took **13.2s at 6 in flight and 7.1s at 16**, both timed cold. Widening helps sub-linearly, so 16 is where it stopped.

**The measurement trap here cost two attempts, and is worth knowing before anyone re-times it.** Upstream sends `cache-control: max-age=300`, so the same poll repeated inside five minutes returns in **0.2s** off Cloudflare's edge — 35× faster than cold, and indistinguishable from a genuinely fast poll. The first "cold" run in this session read 1.5s and was wrong: two other full-roster measurements ran while it slept and re-warmed the cache underneath it. The 7.1s figure comes from a clean seven-minute quiet window with a warm poll immediately after for contrast. Raider.IO publishes no rate-limit headers, so there is no documented budget to claim to be inside of — only the observation that repeated polls at this width have not been refused.

**Three defects in the delivered design were fixed rather than reproduced.** Its CLOSEST CALL always rendered "SPARE" in teal — on live data **three of eight closest calls are over-time**, so it would have painted heartbreaks as clutch saves. A **second** defect hid under that one and did ship before the operator caught it on the live board: the design puts the margin in the same slot and the same `mm:ss` format every other tile uses for the clear time, so a real **29:56 clear rendered as `0:04`** and read as a four-second dungeon. In a static mock the two never sit together; on a marquee they are neighbours constantly. The data was clean — every closest call is a genuine 27–34 minute run, and the pool at +12 and above spans 20:26 to 51:41. The stat slot now always holds the clear time and the margin moved into the outcome, which was already the category-specific field: `+15 29:56 SPARE BY 0:04`. Its marquee ignored `prefers-reduced-motion` and offered pause on hover only, which does not exist on touch. Its section numeral was hardcoded `02`; it is `03`. The MIDNIGHT/LEGACY badges and their pool legend are gone by operator decision — "these doesn't really have any value" — which is also what retired `EXPANSIONS`/`CURRENT_EXPANSION`.

**Verified in a browser, not by reading the CSS.** 64 tiles render (32 plus the seamless-loop copy, `aria-hidden`); tile heights are a single distinct value at every viewport from 375 to 1920, so the strip cannot jitter as it scrolls; the body never scrolls sideways; the strip moves ~83px/s and the pause control stops and restarts it, including by tap. Under `prefers-reduced-motion` the animation is `none`, the copy and the pause control are gone, and what remains is a strip the reader scrolls — reachable by Tab with a visible focus ring, and scrollable by arrow key. Season 1 still renders the pixel layout with no marquee.

**Three fixes from the operator reading the live board**, all measured before and after:

- **The stat slot meant two different things.** Covered above — a 29:56 clear rendered as `0:04`.
- **`SPARE BY 0:06` wrapped onto a second line on 5 of 32 tiles at 2560px.** The cause is that the tile stops widening at 284px while the type inside kept scaling with the viewport, so past ~2000px the row ran out of room. The stat and outcome moved from `--ui-sm` (16px ceiling) to `--ui-xs` (14px) and gained `white-space: nowrap`: 0 of 32 wrap out to 3440px, tile heights stay a single value at every width from 375 to 3440, and the body never scrolls sideways.
- **The Leaderboard's numeral sat 80px right of every other section**, because its container was `66rem` where the raid, dungeon, about and officer sections all use `76rem` — so the column of 01/02/03 down the page had one step in it. Now measured identical at 112px (1440) and 352px (1920). Recruitment still differs and should: it is a centred section with no numeral.

**A dev-server trap worth knowing before trusting any CSS measurement.** Turbopack served a **stale `globals.css` while hot-reloading TSX perfectly** — the font-size fix was on disk, typechecked, and never reached the browser, while JSX edits in the same session applied instantly. The tell is computed style disagreeing with the file; the check is to fetch the `.css` the page actually loads and grep it. Restarting cleared it, and the entire visual suite was re-run afterwards rather than trusting passes taken while it was stale.

**Decisions worth not re-litigating**, all recorded in the spec: best key *includes* depleted runs and breaks ties on recency; `GUILD_GROUP_MIN = 3` because at four, Voidscar Arena has no qualifying run at all; `MAX_CHARACTERS = 250` is a ceiling rather than a target, so a roster that outgrows a page render degrades to a shorter poll instead of a timeout — and logs that it did; tiles interleave by `(i % 4, (⌊i/4⌋ + i % 4) % D)` so no two neighbours share a dungeon or a badge; a run that wins two categories keeps both tiles, because one run wearing two badges is two true statements; runs are filtered to the selected season by their own `url`, and a URL that will not parse keeps its run.

This *raises* the request-time cost by more than twenty times, so the Open item about persisting the rotation at sync time is strengthened rather than closed — hard enough that it is now the next thing this section should get.

### 2026-08-25 — The `progression` global retired, and the admin tidied

Rollover ticket `11`, the last of the spec. `progression` was the single-Season predecessor of the Seasons collection. Once Seasons shipped, nothing read it — the page renders `toProgressionData(selectedSeason)` from the Season row and the Sync writes Seasons only — yet it kept sitting in the admin panel looking authoritative. That is worse than clutter: someone edits it, sees the site not change, and reasonably concludes the site is broken.

Dropped by migration (`20260825_083737_drop_progression_global`), which the generated SQL confirms touches only `progression`, `progression_bosses`, `progression_mythic_plus_runners` and `enum_progression_difficulty`. `scripts/snapshot-season-1.mjs` went with it — it read that global and cannot run without it; its output, the committed `season-1-snapshot.json`, is the artefact and remains.

**Three copies existed; two remain.** Season 1 lives in its Seasons row (the live one) and in `.scratch/season-rollover/season-1-snapshot.json` (595 participants, 10 bosses, 10 runners, world 1375). The global was the third and most stale, last written 2026-08-11.

**`mythicPlusParticipants` is hidden from the admin panel, and deliberately stays JSON.** The operator's instinct was that the JSON blob looked untidy next to relational bosses and runners. It does — but the asymmetry tracks a real distinction rather than laziness: bosses (19 rows) and runners (20 rows) are *rendered and hand-edited*, while participants are **758 rows across two Seasons, rendered nowhere and edited never**. Moving them relational would have spent migration risk on Season 1's 595 archived entries — the least recoverable data in the project, two of whose members (Exyie, Brunogarzz) Raider.IO has already dropped — and turned one JSON field write into ~163 row writes every hour. So the fix was presentation, not storage: `admin: { hidden: true }`, which the generated migration confirms costs **no schema change at all**. The column, the Sync and the archive guard are untouched.

### 2026-08-25 — The first production Sync against the Seasons collection

Rollover ticket `10` complete: the operator cleared `SYNC_DISABLED` and ran the Sync. It wrote at 18:19:46, and this is the first time the Seasons path has executed in production.

**Season 2 filled exactly as the local rehearsal predicted** — 9/9 normal, 5/9 heroic, 0/9 mythic, with per-difficulty first-kill dates (Aug 21–25) and heroic pull counts (Entombed Sentinels 14, The Lost Explorers 14, Nymrissa 6), heroic ranks 2460/806/13, and ten M+ runners. The per-raid split works on real data: the Abyss reads 4/8 heroic and the Grotto 1/1, which is the 5/9 total the season-wide figure would have flattened.

**The archive guard held under live fire, and there is a clean proof of it.** Season 1's `lastSyncedAt` still reads **2026-08-11 12:25:04** — the Sync never wrote to it at all. Its 10/10, world 1375, 595 members, 595 M+ participants, and Salhadaar's 41 pulls against Midnight Falls' 608 are all unchanged. `lastSyncedAt` is the useful assertion here: comparing *values* only proves nothing was corrupted, while an unmoved sync timestamp proves the write never happened.

**Verified in a real browser, not from the HTML.** A raw `curl` of the page reports `0 Active Members / 0 World / 0 Region / 0 Realm`, which looks like a total failure and is not — the hero stats count up from zero, so the server-rendered markup holds the pre-animation state. Rendered with JS, production reads **167 active members, 2,460 world, 806 region, 13 realm**. Anyone checking this site's numbers with `curl` will misdiagnose it.

With this, ticket `11`'s condition is satisfied: production has run a full Sync cycle against the Seasons collection with no incident, so the `progression` global's job as the fallback copy of Season 1 is over.

### 2026-08-25 — Deployed: Season 2 is live in production

The whole rollover, executed in the order the Open entry had been insisting on. 31 commits merged to `main` (`31549f8..b719a56`), then the cron restore (`c63ebbf`).

1. **Push.** Vercel's build runs `payload migrate && next build`, so the deploy applied both migrations itself — no manual step. Production went from 2 migrations to 4; `add_theme_slug_enum` and `add_difficulty_progress` both landed as batch 3.
2. **`create-season-2.mjs --commit`.** Season 2 created as id 2 with nine bosses, all unkilled, then `guild-settings.currentSeason` moved to it — created first, pointer last, so there is never a half-built current Season.
3. **Cron restored.** `SYNC_DISABLED` remains set; see Open `10`.

**A trap worth remembering: the script silently targeted the wrong database.** Its header says it "deliberately targets production", and it did when written — but `@next/env`'s `loadEnvConfig(cwd, true)` loads `.env.local` at higher precedence than `.env`, and a local Postgres container had since been added. The first verify run reported *"Season 2 already exists (id 2)"* — true of the local database, meaningless about production. **Verify-first is what caught it.** Had the script been run straight with `--commit`, it would have succeeded against localhost and reported success, and the deploy would have been declared done with production untouched. Every production command in this session pins `DATABASE_URL` explicitly rather than trusting file precedence; do the same.

**Verified against the production database after the cutover, not assumed:**

- Season 1: **10/10, world 1375, 595 members, 595 M+ participants** — untouched. Salhadaar still reads **41** pulls and Midnight Falls **608**, where upstream now reports 6 and 12. The archive is intact *and* better than its own source.
- Season 2: id 2, `venom`, 0/9, current.
- `currentSeason = 2`, so Season 1 is archived and is no longer a Sync target.
- The live site serves the venom theme, with The Venomous Abyss and The Tidebound Grotto as separate sections and Season 1 reachable from the switcher.

### 2026-08-25 — What `/code-review` found in the layout, fixed

Two-axis review of 26 commits against `31549f8`. The commits were moved off `main` onto `feature/season-2-theming` first — `origin/main` was still `31549f8`, so they had been accumulating on the local trunk.

**An archived Season's ranks were never frozen.** Bosses and the M+ roster were guarded by `isArchived`; ranks were not, so a Sync over an archive would take live `raidRankings` — and `members` is worse, because it is never read from the response at all. It is recounted from today's roster, so Season 1's 595 would have silently become the current season's count with nothing upstream having changed. This is the same ADR `0005` hole as the boss guard, one field over, and the existing safety tests covered bosses and M+ while asserting nothing about ranks.

**Section 01 rendered a raid that does not exist.** The title was "Vaults of Atal'Utek" — invented for the design prototype, which `design/NOTES.md` explicitly forbids reaching a real Season row. The real raid is `the-venomous-abyss`. It survived review because the Grotto beside it was already correct, so half the row looked right.

**`raidGroups` wrote back to its own module-level config.** `filter` returns a new array of the *same objects*, so widening the last group's count mutated `RAID_GROUPS` for the life of the process — the next request would have seen a two-boss Grotto. Latent today (8+1 exactly covers 9) and it fires the first time a boss is added. **Both review axes found it independently**, which is the strongest signal the two-axis split has produced so far. The regression test was checked against the old code before being kept.

**The frozen-look gate had lost its reference.** `PixelHeaderSwitcher` claimed the committed baselines "were updated to match" the operator-approved header change. They had been committed once and never touched again, three commits earlier — so the gate was being measured against a picture of a page that no longer existed. Baselines recaptured; the claim is now true. **Lesson: a doc comment asserting that an artefact was updated is worth nothing unless the artefact moves in the same commit.**

**Ranks lost their difficulty word** (operator decision). The hero read "Heroic World"; it reads "World". The values still follow the difficulty on display, and that distinction was worth stopping for: Season 2 has no mythic kills, so the mythic-sourced group is `0/0/0` while heroic holds the real 2452/804/13. Reading the instruction literally would have replaced live numbers with zeros on the page being delivered. Labels changed, data did not, no migration.

Also: dead options deleted (`hasKeyArt`, the never-selected `row` roster layout); ADR `0007` given a real Status amendment in ADR `0003`'s style, covering both the light-mode reversal and themes declaring their own component tree; the static-data fetch now logs `!ok` and parse failures instead of returning bare, and dropped unnamed zones are counted (ADR `0002` — deliberately *not* converted to throws, since it runs at page render).

**Judged and skipped, so they are not re-found as new:** the archived-Season banner exists in three places, `{seasons, selectedUrlSlug, currentUrlSlug}` is a data clump threaded through four components, kill-counting from the flat/group asymmetry is duplicated between `syncProgression` and `venomViewModel`, `numeralAfter(groups.length + N)` keeps hand-maintained offsets, and `SeasonSwitcher.tsx` is now dead but frozen. All judgement calls, some inside frozen files.

Three more, dispositioned rather than fixed:

- **The `#progression` anchor was dropped.** The old mid-page `SeasonSwitcher` scrolled to `#progression` on change; the header one does not. Intended — a control in the navbar landing at the top of the page is ordinary, and it matches what the venom navbar does, which was the whole point of moving it.
- **`killsByDifficulty` is returned but never persisted.** It is used internally to derive the canonical `kills`, and `venomViewModel` recomputes its own from stored bosses. Not dead, just not stored.
- **`rankingsByDifficulty.mythic` is computed and never written.** By design: mythic ranks live in the flat `rankings` group, so writing them twice would create two sources for one number.

**One finding has no code fix and is documented as by-design:** the Sync route hardcodes `isArchived: false`. There is no data signal for "archived" beyond "not the current Season", and the route syncs the current Season by definition. Re-pointing `currentSeason` in the admin makes an archive current — at which point it is, correctly, the current Season. The guard exists for a caller that derives some *other* Season, and no such caller exists yet.

85 tests, typecheck clean.

**Decision, 2026-08-25: Season 1 stays mythic-only, and its difficulty columns stay empty.** The difficulty migration adds `normal_*`/`heroic_*` to every boss row as `DEFAULT false`, so Season 1's ten bosses now carry hydrated-empty groups. Upstream **can** still fill them — `raid_progression` reports `tier-mn-1` as 8 normal / 9 heroic / 9 mythic, and `sporefall` as 0/1/1, checked live on the day. The operator was offered the backfill against that closing window and **declined**: Season 1 was always a mythic-only record, the site never displayed its other difficulties, and the pixel layout has no difficulty toggle to show them in — so a backfill would have been invisible preservation bought by amending a frozen archive. If a future session finds those empty columns and reads them as an oversight: they are not. Do not fill them without a fresh operator decision.

Worth keeping alongside it: local Season 1 still holds Salhadaar at **41** pulls and Midnight Falls at **608**, where upstream now reports 6 and 12. The frozen archive is measurably better than the live API's own record of the same season.

### 2026-08-25 — The Season 2 editorial layout

The v2 design built: a parallel component tree under `src/components/venom/`, picked by the theme manifest's `layout` discriminator rather than a slug check. `void` renders the same eight components it always has — Season 1 is frozen **by construction**, not by careful editing, and the nine original components were verified byte-identical since `3da38d5`.

Sections: hero with a pointer-tracking serpent eye, the Venomous Abyss descent timeline, the Tidebound Grotto as its own **Lair Boss** section, the M+ dungeon rotation grid, the champion-spotlight leaderboard, about, officers, recruitment, footer.

**The raid difficulty toggle is per-raid, not per-page**, because the Grotto and the Abyss have independent progress. Highest-with-a-kill is the default (operator), and a visitor can switch.

**The dungeon rotation turned out to be fully derivable** — no new CMS fields. All 8 dungeons resolve by `zoneId` against `mythic-plus/static-data`, and the midnight/legacy pool split falls out of expansion membership. Run rosters come from grouping runs by `keystoneRunId` across every ranked character, sorted tank → healer → dps. **The `page` param on that endpoint is ignored by upstream** — paginating it counted 6972 runs instead of 581.

**Three attempts to make the stacked roster grow upward**, each failing differently and each caught by measuring rather than looking: reversing the flex direction fixed the baseline but left the grid ragged (155px against 172px); absolute positioning fixed the heights but let a 4-name stack rise 4px through the dungeon name and a 5-name stack 19px; in-flow bottom-alignment plus a reserved `min-height` gives 13px constant clearance at any party size.

**Hover states were specified by the design and silently not applying.** Inline styles beat classes, and framer-motion writes `transform` inline — so CSS `:hover` rules on those elements were dead. Moved to `whileHover`; footer links go through a custom property instead. Then the lift *felt* sluggish: the element-level `transition` was being inherited by the hover, carrying a 0.5s reveal duration plus the stagger delay. Hover now has its own timing — measured 30ms to start, 160ms to settle.

**Season 1's header changed, deliberately and with operator approval**, so both layouts place the season switcher the same way: it moves from mid-page into the navbar. Done by *addition* — a new `PixelHeaderSwitcher.tsx` — so the frozen components stay untouched and reverting is deleting one file and one line. **Three attempts to place it without overlap**, the first two caught by the operator, not by me: a fixed clamp offset ran under the theme toggle at 1440px, then measuring only the right-hand side let it run over RECRUITMENT everywhere from 640–880px. It now measures **both** edges and drops below the navbar when the gap is too small. **My own verification was faulty twice** — the first sweep sampled three widths and compared the wrong elements; the second compared horizontal extents only, giving false passes. Both axes, every width, or it proves nothing.

Motion is gated on `prefers-reduced-motion` throughout, including one pre-existing gap: `.animate-pulse-dot` was the only animation still running under reduced motion, and it is shared with the pixel layout.

### 2026-08-25 — Raid progress at all three difficulties

Operator decision: a visitor-facing difficulty toggle defaulting to the highest difficulty with progress, with first-kill dates per difficulty. This is the **data half** — derivation, schema, route. No UI yet.

The upstream payload always carried normal, heroic and mythic; the Zod boundary already validated them as records. Derivation was discarding two thirds of what arrived, which is why Season 2 read `0/9` while the guild was 9/9 normal, 5/9 heroic. It now derives all three, and `defaultDifficulty` returns the hardest one with an **actual kill** — attempts deliberately don't count, since one exploratory mythic pull would flip the page to "0/9 Mythic" and hide real heroic progress.

**The stored shape is asymmetric on purpose:** flat `killed`/`firstDefeated`/`pulls`/`bestPull` stay canonical mythic; normal and heroic are their own groups. Symmetry would have meant a backfill migration over Season 1's frozen rows. The migration is 14 pure `ADD COLUMN`s — no `UPDATE`, no data movement — so the archive is safe by construction.

**Three attempts were needed to actually protect the archive, and the first two both looked right.**

1. *"Season 1's raids report nothing new."* False — upstream still reports 8 normal and 9 heroic kills for `tier-mn-1`. What really prevented groups being attached was that Season 1's boss names happen not to resolve to those slugs: a coincidence in the data, not a guarantee. A fixture test with a resolvable name caught it.
2. *"An archived row has no difficulty groups."* Also false, and this one was inert **in production only**. The migration's `DEFAULT false` makes Payload hydrate a full `{killed:false, …}` group onto every untouched boss, so `!boss.normal` is never true against a real row. **A local probe against the real database passed and gave false confidence — it read a database that predated the migration.** `/code-review` found it.
3. **`ProgressionState.isArchived`, set by the caller.** A hydrated archive row and a live Season's mythic-first kill are the same shape, so the two guarantees collided as a failing test the moment both were pinned. Only the caller knows which Season it is deriving.

**Lesson worth keeping: a guard inferred from data shape is a guess.** Twice the inference was defensible and twice it was wrong, and the failure mode differed between tests (bare objects) and production (hydrated ones).

The flag also closes a hazard that predates this work: `mythicPlusRunners`/`mythicPlusParticipants` preserved only when the *fetch* returned nothing, with no notion of the Season being archived. Since Raider.IO's roster exposes only the **current** M+ season's scores, deriving Season 1 from a live response would replace its 595-participant snapshot with ~160 and change its champion from Heyems. Nothing reaches that today — the Sync writes only to the current Season — but re-pointing `currentSeason` is one admin field edit, and that is the documented rollback path.

Verified through the real authenticated route, not just the pure functions: Season 2 derives 9/5/0 with per-difficulty dates and pull counts (14 pulls on Entombed Sentinels heroic against 2 on normal) and ranks (heroic world 2450), while Season 1's ten boss rows stay byte-identical and its 595 participants intact. 62 tests.

### 2026-08-25 — The venom theme: palette, typography, and the Season 2 row

`.scratch/season-2-theming/design/` — the operator's design bundle, committed as the durable reference. Ticket `03`, plus rollover `09`'s script.

**Palette-first, by operator decision.** Venom's colours and type ship now so the Season 2 row can exist and the Sync can resume, with the design's new page structure to follow.

`.theme-venom` carries all 13 colour tokens, all three font roles, and the design's own `--ui-*`/`--bd-*` scale — kept separate from Season 1's `--px-*`/`--vt-*` pixel ramp, which stays frozen. Three fonts via `next/font`, all `preload: false`: Almendra Display, Grenze 400/500/600, Cormorant SC 500/600/700.

**The conditional-loading proof ticket `01` deferred, now real:** viewing Season 1 downloads **2** woff2 files, viewing Season 2 downloads **5**. Verified with both Seasons coexisting, not simulated.

**`.theme-venom` alone is not enough, and this is the trap worth remembering.** `.light [class*="theme-"]` matches every theme class and outweighs a bare `.theme-venom` (0-2-0 against 0-1-0), so a visitor with a stored light preference would have got the cream palette under the venom look. The selector is `.theme-venom, .light .theme-venom` — the second half ties the specificity and wins on source order. **venom is dark-only**, amending ADR `0007` for this theme.

Verifying that surfaced why the design hides the toggle rather than shipping a light variant: **12 sites across 6 components hardcode light-mode colours** in `isVoid ? dark : light` literals that no CSS token can reach. Light mode under venom paints cream and silver bands behind venom content. Fixing that means editing every existing component — exactly what the `void` gate forbids.

**The Season 2 row: the ticket was right that its identity could not be guessed, and the guess was wrong.** `tier-mn-2` does not exist upstream. Captured live 2026-08-25:

- The raid is **`the-venomous-abyss`**; Rank Source is the same, per ADR `0003` (ranks cannot merge across raids).
- A **fourth raid** nobody anticipated — **`the-tidebound-grotto`**, one boss (Nymrissa Wavecaller), AOTC 2026-08-24 — also belongs to Season 2, ordered after the Abyss. Same shape as Season 1's `tier-mn-1` + `sporefall`.
- Nine bosses typed by hand, all created **unkilled**: the site tracks mythic, and mythic is genuinely empty upstream. The first Sync derives the rest rather than having history typed for it.

`scripts/create-season-2.mjs` is a verify-first/`--commit` one-shot, inert after first use. Rehearsed locally: created the row, moved the pointer last (never a half-built current Season), and a real Sync against the live API ran clean — 165 active members, 162 M+ participants. **Season 1 was untouched by that Sync**, still 10/10 with its 595 archived members: the archived-Season freeze observed rather than assumed.

**Season 1's M+ data was checked for a final refresh and deliberately left alone.** The *roster* endpoint returns only the current M+ season's scores, which is what this entry originally recorded — but it also claimed "no season parameter available", and **that was wrong**. Corrected 2026-08-25: `mythic-plus/rankings/characters?season=season-mn-1` works and returns Season 1's real scores. The operator knew this and said so; the claim here was mine, from testing one endpoint and generalising to the API.

**The conclusion survives the correction, for a better reason.** Queried live on 2026-08-25, the season-scoped endpoint returns **581** ranked characters against the stored **595**, and every score still present matches what is stored to two decimals — Heyems 4234.04 against 4234, Freakyski 4210.49 against 4210.5. Nothing has updated. What has changed is who is *visible*: **Exyie (#3, 4208.9) and Brunogarzz (#9, 4077.8) are gone from the response entirely**, because a guild-scoped query recomputes from present membership and a Participant who leaves vanishes from their own Season's record. Re-syncing would drop 14 participants and promote Graoul and Dawnxo into a top ten they were never in.

So a refresh is not a no-op with no upside — it is strictly destructive, and the stored snapshot is the better record. **Do not re-sync Season 1's M+ data.** If a future session rediscovers the season parameter and reads the old "no season parameter" line as the only obstacle, this paragraph is the answer. The 2026-08-11 capture landed before the Season 2 reset and is the best record that exists — better than the live API's own, which has separately rewritten four Season 1 boss rows (Salhadaar's pull count fell from 41 to 6; Chimaerus's vanished).

**Correcting a claim made earlier in this work:** the in-progress pull counts described as bleeding away are heroic/normal. The site records mythic only, and Season 2 has no mythic progress yet, so nothing recordable was lost by the delay.

### 2026-08-25 — Season 2 theming, tickets 01–02: the widened seam and the dropdown

`.scratch/season-2-theming/spec.md`, ADR `0007`. The theming *mechanism*, with no theme built on it yet — `venom` is selectable and renders the default look, which is the fallback contract working as designed.

**A theme is now a package, not 13 colours.** Three font tokens (`--font-display`, `--font-body`, `--font-ui`) at `:root` are consumed by every `font-family` site — five in `globals.css` and, less obviously, **48 inline `fontFamily` styles across the components**, which would have made per-Season fonts dead on arrival if missed. VT323 split by role: headings, wordmarks and display numerals are display; running text and list rows are body. `src/lib/themes.ts` is the manifest and the place the package convention is documented.

**Fonts are self-hosted.** The Google Fonts `@import` is gone, replaced by `next/font`. A page load now makes **zero requests to `fonts.googleapis.com`/`gstatic`** — verified in the network tab, not assumed. `preload: false` on non-default faces is the mechanism that will keep a future theme's font from downloading for visitors not viewing that Season; its real proof needs a second font and belongs to ticket `03`.

**`themeSlug` is a dropdown over the manifest**, stored as a pg enum. Both values ship in one migration; every *future* theme costs an enum-value migration, per ADR `0007`.

**Verification notes worth keeping:**

- **The pixel gate needed a better instrument.** `next/font` leaves a residual ~0.4% pixel delta from sub-pixel glyph antialiasing — `adjustFontFallback: false` does not remove it (tested), and zero offset is already the best alignment, so nothing moved. The gate was settled on *layout* instead: **all 270 non-animated elements match exactly** on position, size, font-size, colour, background and text, both modes. Hero crystals, crest rings and the pulse dot are excluded as animated — a same-build re-run churns those on its own, which is the control that makes the exclusion honest. **A pixel-diff gate on this site will always be noisy; compare geometry.**
- **The `USING` cast is safe, not lossy.** Postgres aborts the migration if any row is outside the enum — verified by rehearsing a typo'd `'voidd'`, which failed naming the value rather than nulling the row. `down` round-trips (enum → varchar, *then* drop the type).
- **The admin panel has to be opened, not inferred.** The first check reported a plain text input with the old description — a stale `.next` cache, not a config error. A config-only assertion would have passed while the panel was still wrong.
- Type regeneration narrows `themeSlug` to `'void' | 'venom'`; the only fallout was the Seasons migration, whose snapshot type honestly describes untrusted JSON as `string`. Asserted at the call site, matching the neighbouring `difficulty`.

**Also added:** `npm run typecheck`, scoped to `src/` via `tsconfig.check.json` so it is not defeated by a stale generated `.next/dev/types/validator.ts`.

**Found, deliberately not fixed:** `About.tsx` names `'Rajdhani'` and `'Bebas Neue'`, which nothing has loaded since the 8-bit redesign — so its eyebrow and heading render in the browser's default sans-serif and have since. Fixing it would change Season 1's look, which ticket `01`'s gate forbids. Commented in place; it needs its own change against a fresh baseline.

**Four `/code-review` findings fixed before this landed** (`2497a93`), all documentation-or-dead-code rather than behaviour:

- **Comments asserted `preload: false` was set; it is not.** Both fonts are site defaults and correctly preload. The rule still matters and now reads as a rule rather than a description: the theme-specific font ticket `03` adds **must** be declared `preload: false`, or it downloads for every visitor and the per-Season saving evaporates.
- **`hasKeyArt: true` for venom claimed art that does not exist.** Now `false` until ticket `06` ships it — otherwise the first code to read the flag reserves space for nothing.
- **`findTheme` deleted** — no callers, speculative. `ThemeSlug`/`hasKeyArt` kept deliberately.
- **The package convention lived in three places** (ADR, manifest, CSS comment) and would have drifted; the CSS comment now points at the manifest. **`tsconfig.check.json`'s `scripts/**/*.mjs` glob was inert** — `allowJs` without `checkJs` means tsc loads those files and reports nothing.

**Also verified:** `npx next build` succeeds, so `next/font`'s build-time Google fetch works in a production build; and selecting venom end-to-end through Payload's own write path renders the default look rather than an unstyled page — the fallback contract observed, not assumed.

### 2026-08-11 — Season 1's real start date: 2026-03-17

Closes the `startedAt`-placeholder issue that was open above, clearing the data prerequisite for ticket `09` — switcher ordering is now correct before a second Season can exist. The operator confirmed Season 1 began **2026-03-17**; the `2026-01-01` placeholder was corrected everywhere it lived: the committed snapshot, `seed-local.mjs`, `snapshot-season-1.mjs` (constant renamed `SEASON_1_STARTED_AT` — it is no longer a placeholder, and a re-run can't resurrect one), and both database rows via `scripts/correct-season-1-started-at.mjs`.

That script is a verify-first/`--commit` one-shot in the `adopt-migrations-baseline.mjs` mould, kept as the record of the correction. It writes only when the current value is exactly the known placeholder — already-corrected exits 0 as a no-op, any *other* value means someone set it deliberately and it refuses — so it is inert after first use. Rehearsed against the local Docker database first, then run against production: placeholder confirmed before, target re-verified after, on both.

Test fixtures in `resolveRequestedSeason.test.ts` / `syncProgression.test.ts` still use `2026-01-01` as an arbitrary date — deliberate, they never referenced the placeholder.

### 2026-08-11 — Season rollover, tickets 01–08

`.scratch/season-rollover/spec.md`. ADRs `0005`, `0006`; ADR `0003` amended. Seasons become rows: a `Seasons` collection, one row per Season, named current by a `currentSeason` pointer on `guild-settings`. Season 1 migrated in from a snapshot of the live `progression` global and `guild-details`' stored roster payload — 10/10 Mythic, 595 M+ Participants, matching the values captured live on 2026-08-10 exactly (world 1375 / region 450 / realm 6, last kill Midnight Falls 2026-07-17, Rotmire 2026-06-17).

**Stopgap shipped first, separately reviewable:** the hourly cron trigger is gone from the Sync workflow (`workflow_dispatch` stays, as a deliberate manual escape hatch), and the Sync route now refuses to run when `SYNC_DISABLED` is set, reporting a `stage: "disabled"` failure through the existing contract rather than silently no-op'ing.

**The home page and Sync now read/write the Seasons collection, not the `progression` global** — which is left completely intact and unread, so the cutover stays reversible. `deriveProgression` kept its exact existing shape, `(fetched data, current Season state) → new state`; a Season's upstream identity (contributing Raid slugs, Rank Source, M+ season slug) arrives through the existing current-state parameter rather than a new one, per ADR `0006`. The loud-failure guarantees carry over unchanged: an empty `currentSeason` pointer throws, the Rank Source being absent from a non-empty rankings response throws naming the slug, an empty rankings response still preserves existing ranks.

**Every M+ Participant with a score is now captured**, not just the displayed top ten (~575 previously discarded at Derivation time) — the point of the whole feature per ADR `0005`. Costs no extra upstream request, since it's derived from the same roster fetch the top ten already comes from.

**A visitor can switch to an archived Season** via a query parameter (`resolveRequestedSeason`, a new pure seam: `(all Seasons, current Season id, requested slug) → Season`), which re-themes the whole page via a CSS class per `themeSlug` and shows a visible archived notice. An unrecognised slug falls back to the current Season. About, officers and recruitment stay current regardless of which Season is selected. Season 1's theme (`void`) is the site's existing dark palette, unchanged; the light palette stays season-neutral and the toggle keeps working — verified with real screenshots in both modes.

**Three bugs found and fixed during `/code-review` before this landed, all caught by parallel Standards/Spec sub-agent review, not by the original implementation:**

- `mythicPlusParticipants` had no preserve-on-no-data fallback, unlike `rankings` and `mythicPlusRunners` — a guild-rename response (the exact case the preserve path exists for) would have silently wiped the current Season's whole stored roster to `[]`. Now preserves on empty, with a regression test.
- The home page's "is this the current Season" check fell back to whichever Season the visitor had *requested* whenever the relationship came back unpopulated, mislabelling an archived Season as current in the switcher. Fixed to look the true current Season up by id against the full list.
- A Season with bosses typed in but an empty `raidSlugs` list would silently freeze kills forever, since Season-scoping causes every raid in the response to be skipped with no signal — exactly the decay ADR `0001`/`0006` exist to prevent. Now a Derivation failure; the genuine empty-boss-**and**-empty-`raidSlugs` mid-rollover state is unaffected and does not throw.

**Insurance taken before any production data was touched:** a `pg_dump` whole-database backup (Neon branching wasn't available from this session; the ticket's fallback path), copied to durable storage outside the repo.

**Deliberately deferred, gated on the outside world:** tickets `09`–`11` — see Open, above.

### 2026-08-05 — Local development database

`docker-compose.yml`, `scripts/seed-local.mjs`, `.env.example`. Development no longer runs against production.

`push: false` stopped `npm run dev` mutating production's *schema*, but the app still read and wrote production *data* — the local `.env` `DATABASE_URL` pointed at Neon. This closes that.

**Decisions:**

- **Persistent local Postgres, disposable on demand** — named volume, so data survives restarts; `npm run db:reset` wipes and rebuilds. A truly ephemeral per-session container was rejected: Payload needs an admin user and `Progression.tier` before the site is usable, and paying that cost every session makes pointing back at production the path of least resistance. Port **55432**, not 5432, so it cannot collide with another project's container.
- **`.env.local` is what redirects development.** It takes precedence over `.env` for both Next.js and the Payload CLI, so nothing in `.env` had to change. `.env.example` is the committed template — it required an `!.env.example` exception, since `.env*` ignores everything.
- **The seed script refuses any non-localhost host.** It creates an admin user with a known password, so it must never reach a deployed database. Verified by pointing it at the real production URL and watching it refuse by hostname.
- **`@next/env` loaded explicitly in the seed script.** A plain `node` script gets no env-file loading, so `DATABASE_URL` was simply unset. It is CommonJS, so it needs a default import, and `payload.config.ts` must be imported *dynamically* after the env is loaded — a static import would hoist above it and read an empty `DATABASE_URL`.

**Verified end-to-end:** `db:reset` from an empty volume → migrate → seed → `npm run dev` serving `/` and `/admin` at 200 with real seeded content. A database built purely from migrations matches production exactly (135 columns), which re-proves the baseline independently.

**`--sync` reports `0 officers` on a fresh database, and that is correct.** `deriveOfficers` returns early when the current officer list is empty (`syncOfficers.ts:26`) — it *enriches* an operator-curated list, it does not create one. Likewise `0/9 bosses`: kill data is locked once set, and a new database has no kill history.

**README rewritten.** It was still create-next-app boilerplate telling a new contributor to run `npm run dev` — which, before this, pointed them at production.

---

### 2026-08-05 — Migrations adopted

ADR `0004`. Closes the "no migrations" issue that was open above. `push: false`, a committed baseline, and `payload migrate` in the build.

**The recorded blocker was a misdiagnosis.** The ledger said the Payload CLI failed on "Node 24 + `tsx` ESM/CJS interop errors inside Payload's own `bin.js`" and that a Node 20/22 runtime was likely a prerequisite. The actual error was `Cannot find module src/collections/Users`: `payload.config.ts` used extensionless imports, which Next.js resolves because `tsconfig.json` sets `moduleResolution: "bundler"`, but the CLI does not because it runs outside the bundler. The Node version was never involved. Worth remembering as a pattern — three different invocations produced three different-looking stack traces, and the common line at the bottom of all of them was the real cause.

**Decisions:**

- **`push: false` on the Postgres adapter.** Auto-push only disengages when `NODE_ENV === 'production'`, and the local `.env` `DATABASE_URL` points at the production Neon database — so `npm run dev` had been mutating production's schema. That is why prod had every column except the newest one.
- **`--use-swc` (`@swc-node/register`) plus `"type": "module"`.** The default `tsx` path fails under Node 24; `--disable-transpile` works for the config but chokes on the type-only imports `migrate:create` generates. swc runs generated migrations **unmodified** — verified by adding a throwaway field, generating, and running it untouched. Any approach needing a hand-edit after every generate would eventually be forgotten.
- **Baseline recorded as already-applied, not executed.** Generated, applied to an empty Docker Postgres, then diffed against production: **135 columns, identical both directions**, including the hand-patched `last_sync_error`. That diff is the safety argument for the whole approach.
- **The synthetic `dev` row must be deleted.** Auto-push leaves `{name: 'dev', batch: -1}` in `payload_migrations`. `payload migrate` reads it and *interactively prompts* ("data loss will occur") before running anything. No TTY in CI means the prompt takes its default — abort — and exits **0** having run nothing. A green build that silently skipped its migrations is exactly the failure being fixed.
- **`.swcrc` was created during diagnosis and then deleted** once `"type": "module"` proved sufficient. It was tested as unnecessary rather than left in place.

**`generate:types` works again** — the third thing listed as broken. Regenerating `payload-types.ts` (previously hand-edited) surfaced two real drifts it had masked: a stale `roster` global no longer in the config, and `officers.name` being the one field in its block missing the `!` assertion its neighbours all had, which was a genuine type error in `page.tsx`.

**Baseline reconciled against production on 2026-08-05.** `scripts/adopt-migrations-baseline.mjs --commit` ran against Neon: the `dev` row was deleted and `20260804_235225_baseline` recorded at batch 1, in one transaction. Verified independently afterwards — **135 columns before and after, unchanged**, `guild_details` intact with `lastSyncError` still null, and a re-run reports "already recorded". `migrate:status` against production now lists the baseline as applied, so `payload migrate` runs unattended without the prompt-and-skip.

The script is kept rather than deleted: it is the record of why production's migration history starts at a baseline it never executed.

---

### 2026-08-04 — Sync hardening

`.scratch/sync-hardening/spec.md`, tickets `01`–`05`. ADRs `0001`–`0003`. Resolves the four Sync issues that were open above: invisible failures, the silent `PRIMARY_RAID_SLUG` rollover, unvalidated API fields, and no test framework.

**Decisions:**

- **Derive before write, not write-then-derive.** The route now: fetch + validate → read current CMS state → derive Progression and Officers in memory → only then write all three globals, sequentially (not `Promise.all` — a parallel write was tried during review and rejected, since ADR 0001 only accepted *sequential* partial-failure risk, not concurrent). A Derivation failure now writes nothing.
- **The `afterChange` hook on `guild-details` is gone.** The route is the sole caller of Derivation; `syncProgressionFromDetails`/`syncOfficersFromDetails` (the old hook-driven wrappers) were deleted rather than left dead once nothing called them.
- **`deriveProgression`/`deriveOfficers` are pure functions**, `(fetched data, current CMS state) → new state`, no `Payload` import. This is the seam the test suite hangs off.
- **Failures report `{ error, stage: "fetch" | "derivation" | "write", message }` with a non-200 status.** The write stage was added after a smoke test against a real Postgres instance caught the sequential-writes path (see below) mislabeling a write failure as `"fetch"`. The GitHub Actions schedule already checked for exactly this (`if [ "$response" != "200" ]`) — it was the route lying that made it useless, not the workflow.
- **`lastSyncError` on `guild-details`**, written on failure and cleared on success. Deliberate exception to "write nothing on failure": it's the one thing that *is* written when everything else isn't.
- **Zod validates the upstream response at the fetch boundary**, scoped to consumed fields only; `GuildDetailsData`/`RosterMember` are now `z.infer`'d rather than hand-declared. Fixtures for the boss-resolution tests came from a real captured Raider.IO response, trimmed.
- **`PRIMARY_RAID_SLUG` stays a constant.** Its absence from a non-empty `raidRankings` now throws, naming the missing slug and what was returned. An empty `raidRankings` (the guild-rename case) still preserves existing ranks — that fallback was kept, not removed.
- **Vitest, scoped to three areas**: boss resolution (including a Rotmire regression test — kill in the *second* raid of the response), rank-source selection, and the Zod schema. Deliberately not covering Payload config, React components, or `page.tsx`'s field mapping.

**Note for future syncs:** the `SyncGuildDetailsButton` admin UI now surfaces `stage` and `message` on failure, not just `error` — worth keeping in mind if that response shape changes again.

**Smoke-tested against a throwaway local Postgres** (Docker, torn down after): both auth paths (cron secret and logged-in operator) confirmed live against the real Raider.IO API. Found and fixed one bug in the process — write-phase failures (e.g. a fresh database with `Progression.tier` unset) were mislabeled `stage: "fetch"` instead of a new `stage: "write"`, because the outer catch defaulted any non-`SyncStageError` to `"fetch"`. A forced failure confirmed `progression`/`officers-section` are untouched (Payload hadn't even auto-created rows for them) while `guild-details` alone updated — the accepted sequential partial-write risk from ADR 0001, observed for real rather than just reasoned about. A subsequent full sync (675 members, ranks matching the live API) wrote all three globals atomically and cleared `lastSyncError`. `Progression.tier` is operator-set, not sync-derived — it's populated once by hand on a real deployment, which is why a brand-new database hits this and production doesn't.

---

### 2026-08-04 — Rotmire / multi-raid progression sync

`eb43dec`, merged to main in `2834fb9`.

Progression sync read `details.raidProgress[0]` only, so any raid after the first never resolved. Rotmire — the single boss of the `sporefall` raid — sat permanently unkilled on the site despite Cutting Edge on 2026-06-17.

**Decisions:**

- **Kills aggregate across all raids, rankings do not.** The CMS boss list spans a whole season (10 bosses = 9 from `tier-mn-1` + Rotmire from `sporefall`), so kill data is collected from every raid in the response. Guild rankings are reported per-raid and can't be meaningfully merged, so one raid is the rank source.
- **Rank source pinned by slug, not array position.** `PRIMARY_RAID_SLUG = "tier-mn-1"`. Index order was never a contract — a Raider.IO reordering would have silently swapped which raid's rank the site displayed.
- **No schema change.** The merged season boss list was already the right model; only the sync was wrong. An earlier read of this as "two raids need two schemas" was incorrect — `sporefall` is a one-boss raid, not a parallel tier.
- **The kill lock is untouched.** `syncProgression.ts:66` (`if (boss.killed) return boss;`) still freezes kill dates and pull counts once set. Note it only protects bosses already marked killed; it is not a general "history is immutable" guarantee.

**Raid slugs, for reference:** `tier-mn-1` = Midnight Season 1, 9 mythic bosses. `sporefall` = one boss, Rotmire.

---

### 2026-08-04 — Engineering skills + agent config

`aee00d7`. Vendored the mattpocock skill set under `.agents/`, added `CLAUDE.md` and `docs/agents/` config. Issue tracker is local markdown under `.scratch/`; triage uses the five default label strings; domain docs single-context. Replaced the retired `docs/superpowers/` workflow.

---

### 2026-08-04 — Guild rename

`93e932f` (PR #18). Guild realigned from **Hakuna Muh Nagga** to **Potato Corner** (Barthilas, US). Relevant because pre-rename specs and any cached Raider.IO URLs reference the old name.

---

### 2026-04-01 — Guild roster sync

Raider.IO's roster endpoint returns ~25MB and takes ~4s. `character.items.items` (16 gear-slot objects) and `character.expansionData` (covenant/soulbind trees) are the bulk of it and are stripped server-side before storage — see `raiderio.ts:125-131`.

**Kept deliberately:** `raidProgress` and `keystoneScores` (frontend filtering), `itemLevelEquipped`, `race`/`class`/`spec`, `realm`/`region`.

**Note:** the original design specified a separate `roster` global and a `POST /api/sync-roster` route. Current code instead folds the roster into the `guild-details` global, fetched in parallel with details in `fetchAndTransformGuildDetails`. The design doc no longer matched the code.

---

### 2026-03-30 — Top M+ runners leaderboard

Second `px-card` below the raid progression card. Top 10 members by `keystoneScores.allScore`, from the same guild API call as progression — no extra endpoint.

**Decisions:** stacked layout, not side-by-side. Row shape is Rank · Name · Spec+Class badge (class-coloured) · Score. Full spec and class names, no abbreviations. Extended the existing sync rather than adding a second button. Class colours were extracted to `src/lib/wow-constants.ts` and shared with `Officers.tsx`.

---

### 2026-03-29 — Officers & Recruitment moved to globals

Officer and recruitment-role card data moved out of standalone Payload collections into two globals, `officers-section` and `recruitment-section`, each holding both the section headings and an array of card data. `page.tsx` fetches two globals instead of two collections.

**Why:** section copy and card data were edited together but lived apart.

---

### 2026-03-29 — Raid schedule & founded date removed

Removed the raid-schedule/founded block from the About section, and dropped both fields from `GuildSettings`. The original spec intended to keep the fields for future use; the implementation removed them.

---

### 2026-03-29 — About section configurable text

`eyebrow` and `heading` added to `GuildSettings` so About copy is CMS-editable. Fallbacks to `"About Us"` / `"The Guild"`. Slug kept as `guild-settings` — no migration.

---

### 2026-03-20 — 8-bit HD-2D redesign

Full visual reskin from glassmorphism to an HD-2D pixel RPG style (Octopath Traveler-inspired). **Approach A — restyle only:** layout, data structures, and the Void/Light theme toggle all preserved; only the visual layer changed.

**Design system, all in `globals.css`:**

- Fonts: **VT323** (headings, body) and **Press Start 2P** (UI labels, badges, buttons), replacing Bebas Neue / Rajdhani / EB Garamond
- Responsive scale via `clamp()` custom properties — `--px-xs/sm/md/lg` for pixel-font UI, `--vt-sm/md/lg/xl` for VT323 display text
- `glass-card` → `px-card` with `px-gem` corner accents

An alternative **Approach B (RPG World Zones)** was considered and deliberately deferred — a larger structural redesign, not a reskin.
