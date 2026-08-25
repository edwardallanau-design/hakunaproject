# Project Ledger

The durable record for this repo. **Shipped** is append-only — what was built and why, so it never has to be rediscovered. **Open** is the live backlog.

Feature-sized work gets its own directory under `.scratch/<feature-slug>/` per `docs/agents/issue-tracker.md`. This file is the index over all of it.

This file is committed. Keep it accurate; it is the only durable record — `docs/` is gitignored except `docs/agents/`.

---

## Open

Known issues, not yet actioned. Oldest first.

### Season 2 rollover: creating the row and re-enabling the Sync

Tickets `09`–`11` of `.scratch/season-rollover/spec.md`.

- **`09` — create the Season 2 row.** **Script written and rehearsed locally, not yet run against production** — `scripts/create-season-2.mjs`, a verify-first/`--commit` one-shot. The upstream identity is no longer a guess (captured live 2026-08-25): the raid is **`the-venomous-abyss`**, not the placeholder `tier-mn-2`, which does not exist upstream at all; a fourth raid **`the-tidebound-grotto`** (one boss, Nymrissa Wavecaller) also belongs to Season 2, ordered after the Abyss per operator decision; Rank Source is `the-venomous-abyss`. Nine bosses typed by hand.

  **The production sequence is order-dependent, because `npm run build` runs `payload migrate` before `next build`.** Production is still on the pre-rollover schema — `theme_slug` is `varchar`, the enum type does not exist, and the difficulty columns do not exist. So: **push first** (the deploy applies both migrations), *then* run the script, *then* clear `SYNC_DISABLED`. Running the script before the deploy would write `'venom'` as text into a column about to become an enum, and create bosses the difficulty migration then has to accommodate. Nothing is pushed yet — the operator holds that call, since pushing to `main` deploys.

  **All of this work lives on `feature/season-2-theming`, not `main`.** It had been accumulating on the local trunk while `origin/main` stayed at `31549f8`; moved to a branch on 2026-08-25 at the operator's request, and local `main` reset to match the remote. Nothing was lost — the branch holds every commit.
- **`10` — re-enable the Sync.** `SYNC_DISABLED` cleared and the schedule trigger restored, deliberately as its own reviewed change once `09` has proven the Season 2 row correct in production.
- **`11` — remove the `progression` global.** Held back until production has run at least one full scheduled Sync cycle against the Seasons collection with no incident.

**Note on urgency, correcting an earlier claim in this file's history:** the in-progress pull counts that gating `09` was said to put at risk are on *heroic and normal* difficulty. The site records **mythic** only, and Season 2's mythic progress is genuinely empty upstream as of 2026-08-25 (0 encounters, ranks all zero). No recordable data has been lost by the delay.

### Season 2 theming: what is left after the v2 layout

`.scratch/season-2-theming/spec.md`, tickets `01`–`07`. ADR `0007`. Specced 2026-08-11. **Tickets `01`–`03` shipped, and the v2 editorial layout shipped on top of them (see Shipped). What follows is only what genuinely remains.**

**The sequencing question is closed, and the losing half has been deleted from this file.** The spec gated rollover ticket `09` on the full venom theme; the operator reversed that on 2026-08-25 in favour of **palette-first** — ship colours and type, create the Season 2 row, re-enable the Sync, *then* build the layout. That is what happened. `09` no longer waits on `07`. Both paragraphs stood here side by side for several commits, each contradicting the other; a `/code-review` found it.

Resolved, recorded so nobody re-opens them:

- **`04` backdrop and `05` motifs — shipped, inside the layout** rather than as standalone theme-package elements. The venom backdrop, gem corners, notched cards and section dividers are all in `globals.css` and the `venom/` tree.
- **`06` key art — deliberately not built**, and the generic slot with it. `hasKeyArt` is deleted from the manifest: the design bakes its serpent-eye crest into the venom hero, so nothing generic was ever needed. A theme wanting key art draws it in its own component tree, which ADR `0007`'s amendment now permits.
- **Ticket `03`'s light-mode criterion is reversed** — venom is dark-only, and ADR `0007` carries the amendment (2026-08-25) rather than a code comment claiming to supersede it.

Still open:

- **The dungeon rotation is derived at request time, not stored.** `design/README.md` asked for `mythicPlusDungeons` fields "via a committed migration … and derive from Raider.IO in the sync"; it shipped as seven request-time fetches instead. It works and it degrades safely, but it makes the section depend on a live host at render, and it is **why an archived Season now renders no dungeon grid at all** — Raider.IO answers only about the current M+ season, so refetching an archive would show today's dungeons under a past season's heading (ADR `0005` names that as the rejected alternative). Persisting the rotation at sync time is the real fix, and it needs a migration whose `pool` select becomes another pg enum.
- **Ticket files `03`–`07` still read `Status: ready-for-agent` with unchecked boxes.** The work is done or superseded; the paper was never reconciled. The operator deferred this explicitly on 2026-08-25 ("we'll reconcile the specs later") — it is bookkeeping, not risk, but a future session reading the tickets alone would draw the wrong conclusion.
- **`07` — the gate.** Narrowed to a QA matrix now that `09` does not wait on it. Not formally run end to end.
- **12 sites across 6 components hardcode light-mode colours** in `isVoid ? dark : light` literals no CSS token can reach. Not blocking — it is precisely why venom hides the light toggle — but it is the reason a future theme cannot ship a light variant without touching frozen files.

## Shipped

Append-only. Newest first.

### 2026-08-25 — What `/code-review` found in the layout, fixed

Two-axis review of 26 commits against `31549f8`. The commits were moved off `main` onto `feature/season-2-theming` first — `origin/main` was still `31549f8`, so they had been accumulating on the local trunk.

**An archived Season's ranks were never frozen.** Bosses and the M+ roster were guarded by `isArchived`; ranks were not, so a Sync over an archive would take live `raidRankings` — and `members` is worse, because it is never read from the response at all. It is recounted from today's roster, so Season 1's 595 would have silently become the current season's count with nothing upstream having changed. This is the same ADR `0005` hole as the boss guard, one field over, and the existing safety tests covered bosses and M+ while asserting nothing about ranks.

**Section 01 rendered a raid that does not exist.** The title was "Vaults of Atal'Utek" — invented for the design prototype, which `design/NOTES.md` explicitly forbids reaching a real Season row. The real raid is `the-venomous-abyss`. It survived review because the Grotto beside it was already correct, so half the row looked right.

**`raidGroups` wrote back to its own module-level config.** `filter` returns a new array of the *same objects*, so widening the last group's count mutated `RAID_GROUPS` for the life of the process — the next request would have seen a two-boss Grotto. Latent today (8+1 exactly covers 9) and it fires the first time a boss is added. **Both review axes found it independently**, which is the strongest signal the two-axis split has produced so far. The regression test was checked against the old code before being kept.

**The frozen-look gate had lost its reference.** `PixelHeaderSwitcher` claimed the committed baselines "were updated to match" the operator-approved header change. They had been committed once and never touched again, three commits earlier — so the gate was being measured against a picture of a page that no longer existed. Baselines recaptured; the claim is now true. **Lesson: a doc comment asserting that an artefact was updated is worth nothing unless the artefact moves in the same commit.**

**Ranks lost their difficulty word** (operator decision). The hero read "Heroic World"; it reads "World". The values still follow the difficulty on display, and that distinction was worth stopping for: Season 2 has no mythic kills, so the mythic-sourced group is `0/0/0` while heroic holds the real 2452/804/13. Reading the instruction literally would have replaced live numbers with zeros on the page being delivered. Labels changed, data did not, no migration.

Also: dead options deleted (`hasKeyArt`, the never-selected `row` roster layout); ADR `0007` given a real Status amendment in ADR `0003`'s style, covering both the light-mode reversal and themes declaring their own component tree; the static-data fetch now logs `!ok` and parse failures instead of returning bare, and dropped unnamed zones are counted (ADR `0002` — deliberately *not* converted to throws, since it runs at page render).

**Judged and skipped, so they are not re-found as new:** the archived-Season banner exists in three places, `{seasons, selectedUrlSlug, currentUrlSlug}` is a data clump threaded through four components, kill-counting from the flat/group asymmetry is duplicated between `syncProgression` and `venomViewModel`, `numeralAfter(groups.length + N)` keeps hand-maintained offsets, and `SeasonSwitcher.tsx` is now dead but frozen. All judgement calls, some inside frozen files.

**One finding has no code fix and is documented as by-design:** the Sync route hardcodes `isArchived: false`. There is no data signal for "archived" beyond "not the current Season", and the route syncs the current Season by definition. Re-pointing `currentSeason` in the admin makes an archive current — at which point it is, correctly, the current Season. The guard exists for a caller that derives some *other* Season, and no such caller exists yet.

85 tests, typecheck clean.

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

**Season 1's M+ data was checked for a final refresh and deliberately left alone.** Raider.IO's roster returns only the *current* M+ season's scores, with no season parameter available. A refresh would have replaced Season 1's 595-participant archive with Season 2's 164 partial scores; of the stored 595, **476 have no live score at all**. Only 1 of the stored top ten still appears in the live top ten. The 2026-08-11 capture landed before the Season 2 reset and is the best record that exists — better than the live API's own, which has separately rewritten four Season 1 boss rows (Salhadaar's pull count fell from 41 to 6; Chimaerus's vanished).

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
