# Project Ledger

The durable record for this repo. **Shipped** is append-only — what was built and why, so it never has to be rediscovered. **Open** is the live backlog.

Feature-sized work gets its own directory under `.scratch/<feature-slug>/` per `docs/agents/issue-tracker.md`. This file is the index over all of it.

This file is committed. Keep it accurate; it is the only durable record — `docs/` is gitignored except `docs/agents/`.

---

## Open

Known issues, not yet actioned. Oldest first.

### ⚠️ Season 1 data is destroyed by the Season 2 rollover

There is one `progression` global: one `bosses` array, one `rankings` group, one `tier`. The site renders that single record. Editing it for Season 2 **overwrites Season 1 permanently** — kill dates, Rotmire, final world/region/realm ranks.

The kill lock at `syncProgression.ts:66` does **not** protect against this. It stops a *sync* from un-killing a boss; it does nothing to stop the row being *replaced* by hand.

**Decided (2026-08-04):** Seasons become a collection — one row per Season, `isCurrent` flag, `theme` field for per-Season styling. Same shape every Season; only data and styling differ. Sync writes to the current row. Scoped as **separate work**, not part of the sync fixes.

**Deliberately not snapshotting now.** Plan is to re-fetch Season 1 from Raider.IO and snapshot near season end, when the data is final.

**The obligation this creates:** the snapshot must be taken **before the first edit made for Season 2**, not before Season 2 launches. The destructive act is the edit, not the patch.

**Residual risk accepted:** a re-fetch recovers kills and rankings, but `raidAttempt` telemetry — pull counts and best-pull % on bosses left un-killed — may not be retained upstream once the tier is no longer current. If Season 1 ends with a boss at 0.4%, that number may exist only in this database.

## Shipped

Append-only. Newest first.

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
