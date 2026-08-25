# Project Ledger

The durable record for this repo. **Shipped** is append-only — what was built and why, so it never has to be rediscovered. **Open** is the live backlog.

Feature-sized work gets its own directory under `.scratch/<feature-slug>/` per `docs/agents/issue-tracker.md`. This file is the index over all of it.

This file is committed. Keep it accurate; it is the only durable record — `docs/` is gitignored except `docs/agents/`.

---

## Open

Known issues, not yet actioned. Oldest first.

### Season 2 rollover: creating the row and re-enabling the Sync

Tickets `09`–`11` of `.scratch/season-rollover/spec.md` remain. All three are gated on the outside world, not on more engineering:

- **`09` — create the Season 2 row.** Blocked until Season 2's raid opens (~2026-08-17) so its boss list, contributing Raid slugs, and real Rank Source slug (`tier-mn-2` is a guess) can be typed in from a live response — the API omits un-pulled and even some killed encounters, so nothing upstream can be trusted to generate this automatically. **Additionally gated on the venom theme** (below) by operator decision.
- **`10` — re-enable the Sync.** `SYNC_DISABLED` cleared and the schedule trigger restored, deliberately as its own reviewed change once `09` has proven the Season 2 row correct.
- **`11` — remove the `progression` global.** Held back until production has run at least one full scheduled Sync cycle against the Seasons collection with no incident.

### Season 2 theming: the venom theme and the widened seam

`.scratch/season-2-theming/spec.md`, tickets `01`–`07`. ADR `0007`. Grilled and specced 2026-08-11. **Tickets `01`–`02` shipped 2026-08-25 (see Shipped); `03`–`07` remain, all waiting on the operator's design.**

The theming seam widens from 13 colour tokens to a full theme package — font tokens (all three roles), optional backdrop, motifs, and key art, all committed slug-keyed and picked per Season from a `themeSlug` **dropdown** (free text → select, one enum migration covering `void` and `venom`). Season 1 stays pixel-for-pixel frozen — that's the seam refactor's verification gate. Light mode stays season-neutral.

**The mechanism is built and the venom theme is not.** `venom` is selectable in the dropdown today and legally renders the default look, because no `.theme-venom` block exists yet — the fallback contract doing its job. What remains:

- **`03` — venom palette and typography.** Waiting on the operator's design, which supersedes the spec's "code-drawn in the site's 8-bit language" assumption. Two things to reconcile when it lands: the spec says a theme defines its **dark look only** (light stays season-neutral, ADR `0007`), and it assumed inline SVG/CSS rather than image assets — real assets are fine and land under `public/themes/venom/`, but that is worth confirming rather than inferring.
- **`04`/`05`/`06` — backdrop, motifs, key art.** `06` also carries the one piece of *mechanism* not yet built: the generic manifest-driven key-art slot (`hasKeyArt` is already declared per theme in `src/lib/themes.ts`, but nothing reads it yet).
- **`07` — the gate.** Full QA matrix, then clearing rollover ticket `09` in writing.

**Sequencing, by operator decision made eyes-open:** the **full venom theme gates rollover ticket `09`** (gate ticket: `07`). This costs nothing if the theme lands before the raid opens (~2026-08-17), since `09` can't run earlier anyway — but **if `07` is not cleared by then, that is a fresh operator decision** (launch palette-only vs. hold `09` while in-progress pull counts go unrecorded), not a silent wait. A session hitting that date with the theme incomplete must put the choice back to the operator.

## Shipped

Append-only. Newest first.

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
