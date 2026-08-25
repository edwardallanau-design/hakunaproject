# Handoff: Season 2 — The Curse of Ula'tek theme + frontpage redesign

## Overview
A full Season 2 redesign of the Potato Corner guild site (Next.js + Payload CMS, `guild-website` repo). Season 1 ("void", pixel-art light/void theme) stays frozen; Season 2 introduces the **venom** theme — poisons, serpents, jungle-dark — plus a rethought frontpage layout: editorial numbered sections, a raid "descent" timeline, a new M+ dungeon rotation grid, and a champion-spotlight leaderboard.

## About the Design Files
The files in this bundle are **design references created in HTML** (Design Component prototypes) — they show intended look and behavior, not production code to copy directly. The task is to **recreate these designs inside the existing codebase** (Next.js App Router + Payload, `src/components/*.tsx`, theme system in `src/app/(app)/globals.css` + `src/lib/themes.ts`), following its established patterns:

- `Season 2 v2 - Curse of Ulatek.html` — **the chosen design.** Implement this.
- `Season 2 - Curse of Ulatek.html` — earlier iteration (S1 layout, venom skin). Reference only.
- `Season 1 - Void.html` — recreation of the current live site, for side-by-side comparison. Do not change the live void theme (ADR 0007: void stays pixel-for-pixel frozen).

## How this maps onto the existing codebase

The repo already has the machinery (ADR 0007 — a season's look is a committed theme package):

1. `src/lib/themes.ts` — the `venom` slug already exists (`hasKeyArt: true`).
2. `src/app/(app)/globals.css` — declare `.theme-venom` with all 13 tokens (values below).
3. `src/lib/fonts.ts` — add the three new families via `next/font` with `preload: false`, expose as `--font-*` variables; point `--font-display/-body/-ui` at them under `.theme-venom`.
4. The layout changes (numbered sections, descent timeline, dungeon grid, leaderboard) go further than a theme package — they are new/reworked components under `src/components/`. Decide with the team whether these render for all seasons or only when `themeSlug === "venom"`; the S1 page must keep rendering exactly as today either way.
5. New data: the dungeon rotation table and per-dungeon guild best keys have no existing field on the Seasons collection — add fields (e.g. `mythicPlusDungeons: [{ name, pool: midnight|legacy, bestKey, timed, bestTime }]`) via a committed migration (ADR 0004, no auto-push) and derive from Raider.IO in the sync where possible.
6. Season switching stays URL-driven (`?season=` + `resolveRequestedSeason`); the design moves the switcher `<select>` into the navbar.
7. **Light mode: the venom season is dark-only.** The design drops the light/void toggle for Season 2. Keep the toggle behavior for Season 1 pages if desired, but hide it when the venom theme is active.

## Fidelity
**High-fidelity.** Colors, typography, spacing, copy and interactions are final intent. Recreate pixel-perfectly using the codebase's existing conventions (Tailwind utilities + CSS variables + framer-motion, as the current components do). All numbers shown (5/8, key levels, scores, ranks, officer names) are **placeholder data** — wire to the Seasons collection / Raider.IO sync.

## Design Tokens — `.theme-venom`

The 13 required palette tokens:

| Token | Value |
|---|---|
| `--bg` | `#050f08` |
| `--surface` | `#081810` |
| `--surface2` | `#0c2114` |
| `--accent` | `#84cc16` |
| `--accent2` | `#2dd4bf` |
| `--glow` | `#a3e635` |
| `--text` | `#e3f0da` |
| `--muted` | `#7d9a80` |
| `--border` | `rgba(132,204,22,0.45)` |
| `--border-dim` | `rgba(132,204,22,0.22)` |
| `--card-bg` | `rgba(8,24,16,0.85)` |
| `--corner` | `#2dd4bf` |
| `--shadow-accent` | `#14320a` |

Typography (Google Fonts, self-host via `next/font`):
- `--font-display`: **Almendra Display** (400) — headings, giant numerals, stat values
- `--font-body`: **Grenze** (400/500/600) — body copy, boss/dungeon names
- `--font-ui`: **Cormorant SC** (500/600/700) — labels, badges, nav, buttons

Type scale (CSS clamp, used throughout):
- UI sizes: `--ui-xs: clamp(11px,0.7vw,14px)`, `--ui-sm: clamp(12px,0.78vw,16px)`, `--ui-md: clamp(13px,0.88vw,18px)`, `--ui-lg: clamp(15px,1vw,20px)`
- Body: `--bd-sm: clamp(19px,1.35vw,28px)`, `--bd-md: clamp(23px,1.65vw,34px)`
- Hero title: `clamp(58px,9.5vw,170px)`; section h2: `clamp(34px,3.6vw,64px)`; outlined section numerals: `clamp(46px,5vw,92px)`
- Base body: `clamp(17px,1.15vw,21px)`, line-height 1.6

Other recurring values: borders 1px `--border-dim` (cards) / 2px `--border` (emphasis); no border radius anywhere (sharp edges + clipped corners); letter-spacing 0.14–0.34em on Cormorant SC labels; buttons `4px 4px 0 #14320a` hard shadow, hover `translate(-1px,-1px)`.

WoW class colors (unchanged from `src/lib/wow-constants.ts` CLASS_COLORS): used for officer/runner class accents.

## Screens / Views (single page, in order)

### 1. Navbar (fixed)
- Height `clamp(54px,4.5vw,74px)`, max-width 88rem. Transparent at top; after 40px scroll: `rgba(5,15,8,0.92)` + `blur(16px)` + 1px `--border-dim` bottom border.
- Left: small glowing potato mark (15×11px blob, tan radial gradient, irregular border-radius `52% 60% 55% 62%`, rotated -16°, lime glow shadow) + "Potato Corner" in Almendra Display `clamp(19px,1.7vw,32px)` (hidden <520px).
- Center links (hidden <640px): Home / Raid / Dungeons / Leaderboard / Join — Cormorant SC 600, `--ui-md`, 0.16em tracking; inactive `rgba(227,240,218,0.6)`, active `--glow` with 2px lime→teal gradient underline. Active section derived from scroll position (trigger at scrollY + 38% viewport height).
- Right: season `<select>` (Season 2 · Ula'tek / Season 1 · Midnight) — routes via `?season=` param in production.

### 2. Hero (min-height 100vh)
- Background: `radial-gradient(ellipse at 70% 20%, rgba(20,50,10,0.7), transparent 55%)`, `radial-gradient(ellipse at 10% 90%, rgba(45,212,191,0.09), transparent 50%)` on `#050f08`; plus a 24px-tile scale-texture overlay (two offset radial gradients at ~10%/7% alpha, opacity 0.45).
- Ambient FX (respect `prefers-reduced-motion`): 3 venom drips at left 8%/44%/91% — a static gradient streak + a 4×10px rounded drop falling ~44vh over 5.5–7.5s, staggered delays; 3 floating elements (5.5–7s ease-in-out float loops): one teal spore circle and two tiny potato blobs (tan radial gradient, irregular border-radius, lime/venom glow).
- Vertical side label (≥900px only): "BARTHILAS · OCE · HORDE · EST. LEGION", writing-mode vertical-rl, Cormorant SC `--ui-xs`, 0.5em tracking, `--muted` at 0.7 opacity, fixed at left `clamp(10px,1.6vw,30px)`, vertically centered. **Hero content has extra left padding `clamp(72px,7vw,110px)` on desktop so text clears this label.**
- Two-column grid 1.25fr/1fr (stacks + centers <900px):
  - Left: eyebrow "SEASON 2 · THE CURSE OF ULA'TEK" (Cormorant SC, `--accent2`, 0.34em tracking, uppercase) → stacked title: "Potato" filled `--text` with lime glow text-shadow, "Corner" transparent fill with 2px `--accent` text-stroke, both `clamp(58px,9.5vw,170px)`, line-height 0.92 → one-line intro paragraph "Semi-hardcore Mythic progression. Two nights a week. Small potatoes, big pulls — don't worry, be raiding." (Grenze, `--muted`, max 34ch) → two buttons: "View Progression" (lime gradient `#84cc16→#3f6212`, dark text `#0a1505`, 2px `--glow` border, hard shadow) and "Apply Now" (outline).
  - Right: **venom-potato crest** SVG `clamp(220px,24vw,380px)` — concentric dashed rings (lime/teal), fang triangles at compass points; center is a potato (rotated ellipse, radial tan gradient `#e3bc7f → #b9854a → #6e4a24`, four darker "eye" spots, two glowing venom sprouts on top) holding a serpent eye: dark ellipse sclera, radial lime iris, vertical slit pupil. Behaviors: 7s float loop, periodic blink (scaleY squash at ~92% of a 7s cycle), and **pupil tracks the cursor** (offset toward pointer, max ~9px horizontal / 5.4px vertical, mousemove listener).
- Load animation: staggered rise-in (opacity 0 + translateY(34px) → visible), 0.9s cubic-bezier(.22,1,.36,1), delays 0.1/0.25/0.4/0.45/0.55/0.7s (eyebrow → title lines → eye → paragraph → buttons).
- Bottom of hero — **rankings bar** (replaces old StatsBar): `rgba(8,24,16,0.7)` + blur, top border `--border-dim`; 4 columns (auto-fit, min 130px): Active Members 92 / World 1,204 / Region 213 / Realm 4. Values in Almendra Display `clamp(1.8rem,3.4vw,2.6rem)` with glow shadow, labels Cormorant SC uppercase `--ui-xs` 0.18em `--muted`. Values **count up from 0 over 1.6s** starting ~0.9s after load. Wire to `season.rankings`.

### 3. Section 01 — The Raid (descent timeline)
- Section header pattern (used by sections 01–05): outlined numeral ("01", transparent fill, 1.5px `--border` text-stroke) + eyebrow (Cormorant SC `--accent2` 0.3em uppercase) + h2 in Almendra Display; thin `--border-dim` rule under the whole header; right-aligned meta — here the kill fraction "5/8" in `--glow` `clamp(40px,4.2vw,76px)` + "HEROIC · 63%" below.
- Timeline: content padded left `clamp(30px,3.4vw,54px)`; vertical 2px spine — dim track full height + a lime→teal gradient fill covering the cleared % (63%) with glow.
- Boss rows (8, from `season.bosses`): flex rows, 1px border, with a 12px diamond node sitting on the spine. Three states:
  - **DEAD** (killed): teal node with glow, `rgba(45,212,191,0.04)` row bg, teal-tinted border, two-digit number in teal, name full `--text`; "DEAD" chip (teal, 0.16em tracking).
  - **PROG** (best pull exists): amber `#fbbf24` node/number, faint amber row bg/border; chip "BEST 18.7%" with a pulsing 6px amber dot (1.5s scale/opacity loop).
  - **SEALED** (not pulled): dim node, muted name at 0.5 opacity, ghost "SEALED" chip.
- Boss order/data (placeholder): Nek'zali the Soulcoiler ✓, Entombed Sentinels ✓, The Lost Explorers ✓, Vashnik the Malignant ✓, Sszorak ✓, The Twin Fangs (18.7%), The Coiled Altar (71.5%), Ula'tek (sealed).

### 4. Section 02 — Dungeon Rotation (new section, new data)
- Header numeral "02", eyebrow "MYTHIC+ SEASON 2", h2 "Dungeon Rotation", right meta "GUILD BEST KEYS".
- Grid: 4 columns ≥900px, 2 below. Card: `--card-bg`, 1px `--border-dim`, **clipped top-right corner** — `clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)` — with a 16px triangle in the pool color filling the notch. Contents: pool tag (MIDNIGHT `--glow` / LEGACY `--accent2`, 0.2em) + TIMED (teal chip) / OVER (muted chip) → dungeon name (Grenze `--bd-sm`) → giant key level "+14" (Almendra Display `clamp(36px,3vw,56px)`, `--glow` with glow shadow) + best time. Hover: `translateY(-4px)`, lime border, soft glow shadow.
- Dungeons (Season 2 rotation): Altar of Fangs +14 TIMED 28:41, Murder Row +13 TIMED 31:02, Den of Nalorakk +15 TIMED 26:19, The Blinding Vale +12 OVER 34:55, Voidscar Arena +14 TIMED 29:47 (Midnight); Kings' Rest +13 TIMED 33:28, Ruby Life Pools +14 TIMED 27:36, Temple of Sethraliss +15 OVER 36:12 (Legacy).
- Below grid: centered legend — glowing lime diamond "MIDNIGHT DUNGEONS", teal diamond "LEGACY DUNGEONS".

### 5. Section 03 — Leaderboard
- Header numeral "03", h2 "Top Mythic+ Runners".
- **Champion spotlight** (rank 1): full-width card, lime-tinted gradient bg, 2px `--border`; top edge is a 2px lime→teal gradient strip **animating** (background-position loop, 3s linear infinite). Left: class-colored initial medallion (border/radial bg/glow in class color). Middle: "◆ SEASON CHAMPION" label, name in Almendra Display `clamp(28px,2.6vw,46px)`, spec+class in class color. Right: score in teal `clamp(38px,3.6vw,66px)` + "M+ RATING".
- Ranks 2–5: simple rows — two-digit rank numeral (Almendra Display, muted), name (Grenze), spec+class chip in class colors (hidden <520px), teal score; `--border-dim` row separators. Data from `season.mythicPlusRunners`.

### 6. Section 04 — Who We Are
- Two-column (1.1fr/0.9fr, stacks <900px). Left: header numeral "04" + h2 "Semi-hardcore. Fully committed." + two paragraphs (existing CMS copy from guild-settings description). Right: guild logo (`public/guild-logo.png`) in a 4:3 bordered frame on `#081810`, bottom fade, and four 22px corner brackets in `--accent` offset -6px outside the frame.

### 7. Section 05 — The Officers
- Header numeral "05", h2 "The Officers". Grid 4/2/1 columns (900px/520px breakpoints).
- Card: `--card-bg`, 1px `--border-dim`, 2px class-color gradient top strip; initial medallion (class-colored border/radial/glow) + name (Almendra Display `--bd-md`) + "Spec Class" in class color; footer row split by `--border-dim` rule: rank label left, ilvl right in teal Almendra Display. Hover: lift 4px, class-color border. Data from officers-section global.

### 8. Recruitment — "The Vault Needs You"
- Diagonal venom gradient bg `linear-gradient(135deg, rgba(20,50,10,0.45), rgba(5,15,8,0.95) 55%, rgba(132,204,22,0.10))`, 1px `--border` top.
- Centered: "◆ JOIN US ◆" eyebrow in `--accent` → h2 "The Vault Needs More Potatoes" `clamp(38px,4.4vw,80px)` → schedule line. Three role cards (3-col ≥900px, stacked below): role name + priority chip (High red `#f87171` w/ pulsing dot, Medium amber `#fbbf24`, Low teal) + spec tag chips. CTA: "Join Our Discord" lime gradient button (links to guild Discord) + footnote. Data from recruitment-section global.

### 9. Footer
- Centered column: guild name (Almendra Display), external links (Raider.IO / Warcraft Logs / Discord with ↗, muted → glow on hover), a ◆ divider between fading rules, two copyright lines at 0.5/0.3 opacity.

### Back-to-top button
- Fixed bottom-right 44px square, appears after 500px scroll, `--card-bg` + 2px `--border`, ▲ glyph, lifts 2px on hover; smooth-scrolls to top.

## Interactions & Behavior (summary)
- **Scroll reveals**: every section header/card animates in on scroll (fade + 36px rise, or slide-from-left for headers, or scale 0.94→1 for cards). The prototype uses CSS scroll-driven animations (`animation-timeline: view()`, range `entry 5% → entry 45%`) inside `@supports`; in the codebase use framer-motion `whileInView` (already a dependency) — durations ~0.6–0.7s, once: true.
- **Nav**: scroll-spy active link, bg/blur transition after 40px.
- **Pupil tracking**: mousemove → pupil translate toward cursor (clamped ~9px). Skip on touch devices.
- **Count-ups**: rankings bar, 1.6s.
- **Season switcher**: `<select>` in nav → `?season=<urlSlug>` routing (existing `SeasonSwitcher` logic). When viewing an archived season, keep the existing "viewing archived season" notice behavior.
- **Reduced motion**: gate drips/spores/marquee-style loops and reveals behind `prefers-reduced-motion`.

## State Management
- `scrolled` (bool, >40px), `activeSection` (scroll-spy), `showTop` (>500px), stats count-up progress. All client-side; page data itself is server-rendered from Payload as today.

## Assets
- `guild-logo.png` — existing `public/guild-logo.png` from the repo (included in this bundle).
- Serpent-eye crest — inline SVG, self-contained in the design file; port as a React component.
- Fonts — Google Fonts (Almendra Display, Grenze, Cormorant SC) via `next/font`.

## Files
- `Season 2 v2 - Curse of Ulatek.html` — implement this one
- `Season 2 - Curse of Ulatek.html` — earlier venom iteration (reference)
- `Season 1 - Void.html` — current-site recreation (reference)
- `assets/guild-logo.png`
