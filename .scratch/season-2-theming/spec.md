# Season 2 theming — the venom theme and the widened seam

Status: `ready-for-agent`
Date: 2026-08-11

## Problem Statement

Season 2 — *The Curse of Ula'tek*, patch 12.1 — begins 2026-08-12; its raid (Venomous Abyss, in the new Coiled Isle zone) and Mythic+ open around **2026-08-17**. It is a venom/poison season centred on the Amani trolls, and the operator wants the site to wear that identity fully.

Per-Season theming shipped in the rollover (ticket `08`) as exactly **13 colour tokens** selected by a `theme-<slug>` class. The operator has decided that is not enough for Season 2: its theme should also carry **typography (all three font roles), a page/hero backdrop, card and UI motifs, and key art**. The current seam cannot express any of that — fonts are a global `@import`, and the site has no per-season imagery mechanism at all (or indeed any imagery beyond the logo).

Two further constraints shape the work:

- **`themeSlug` is free text.** A typo in the Season row produces a silently unstyled page. The operator's expectation — "pick a season's styling from a dropdown" — is the correct model, and the field should enforce it.
- **Sequencing is an operator decision, made eyes-open on 2026-08-11:** the **full venom theme gates the Season 2 row** (`season-rollover` ticket `09`). Ticket `09` cannot happen before ~2026-08-17 anyway (the boss list must be typed from a live response), so the gate costs nothing if the theme lands in time — but if it slips past raid opening, in-progress **pull counts and best-pull percentages go unrecorded** until it lands (kill dates backfill from the API; the Sync writes only to the current Season, and the Sync is currently frozen). This risk was stated and accepted; do not re-litigate it against the palette-first alternative that was offered and declined. If the deadline arrives with the theme incomplete, the fallback is a **new operator decision**, not a default.

## Solution

**A Theme becomes a named, code-defined package** — the whole outfit, not just the palette:

- **Palette** — the existing 13 colour tokens (required; the only mandatory element).
- **Typography** — three font tokens (`--font-display`, `--font-body`, `--font-ui`); a theme may override any subset. Defaults are today's VT323 / VT323 / Press Start 2P.
- **Backdrop** — an optional page/hero environmental treatment under the theme class.
- **Motifs** — optional card/UI decorations: gem corners, border treatments, section dividers.
- **Key art** — an optional hero illustration; its exact placement is a design-phase call, but absence renders nothing.

Every element beyond the palette is **optional with today's look as the fallback**, which yields the refactor's verification gate: **`void` is pixel-for-pixel unchanged** by the seam widening, and stays frozen — retrofitting Season 1 was considered and declined.

**Theme assets live slug-keyed in the repo**, paired with the theme's CSS (`public/themes/<slug>/` for file assets — woff2, replacement art — when they exist; venom's first cut may be entirely inline SVG/CSS). No CMS uploads: the Media collection has no storage adapter and the site deploys serverless to Vercel, but the deeper reason is that every asset kind chosen is inert without per-season CSS to place it, so art changes are PRs regardless. See ADR `0007`.

**The CMS interface stays one field and becomes a dropdown**: `themeSlug` upgrades from free text to a select over the themes that exist in code (`void`, `venom`). Picking a Season's look is the dropdown; building a new look is a PR.

**Light mode stays season-neutral** — the shipped decision from ticket `08`, reaffirmed. A theme defines its dark look only.

**Assets are code-drawn** — SVG/CSS pixel art in the site's existing 8-bit HD-2D language, fonts from Google Fonts' licensed catalogue — so the ~Aug 17 deadline stays under our control. The slug-keyed convention is the upgrade path: better art can replace any piece later without touching the seam.

## User Stories

### The widened seam

1. As the operator, I want a Season's theme to carry typography, backdrop, motifs and key art — not just colours — so that a Season's identity is more than a palette swap.
2. As the operator, I want every theme element beyond the palette to be optional with today's look as its fallback, so that widening the seam changes nothing for any Season that doesn't use it.
3. As a visitor, I want Season 1 to look exactly as it does today after the seam widens, so that the archive stays faithful to how the site looked then.
4. As the operator, I want to pick a Season's theme from a dropdown of the themes that exist, so that a typo cannot produce an unstyled page.
5. As the operator, I want each theme's assets committed in the repo, keyed by its slug and paired with its CSS, so that a theme is a self-contained named thing a PR adds and review catches.
6. As a visitor, I want theme assets served by the site itself, so that pages do not depend on external hosts at request time.
7. As a visitor, I want only the Season I'm viewing to cost me its fonts, so that every past Season doesn't make every future page heavier.
8. As a visitor, I want my light/dark preference to keep working, with light mode remaining season-neutral, so that switching Seasons never removes a setting I rely on.

### The venom theme

9. As a visitor, I want Season 2 to wear a venom/poison identity — palette, type, backdrop, motifs, key art — so that the Curse of Ula'tek season is unmistakable the moment the page loads.
10. As a visitor, I want every venom page readable — contrast holding across all sections, badges and body text, in both light and dark — so that atmosphere never costs legibility.
11. As the operator, I want a theme with no key art to render nothing in its place, so that `void` (and any minimal future theme) needs no placeholder.
12. As the operator, I want the complete venom theme in place before the Season 2 row is created, so that Season 2 debuts fully dressed — accepting, eyes open, the data risk if art slips past raid opening.
13. As the operator, I want any code-drawn asset replaceable by a better version later without seam changes, so that launch quality is a floor, not a ceiling.

## Tickets

Blockers-first; `04`/`05`/`06` are parallel once `03` lands.

| # | Ticket | Blocked by |
|---|--------|------------|
| `01` | Widen the seam: font tokens and the theme package convention | — |
| `02` | `themeSlug` becomes a dropdown | `01` |
| `03` | The venom theme: palette and typography (design session) | `01` |
| `04` | Venom backdrop | `03` |
| `05` | Venom motifs | `03` |
| `06` | Venom key art | `03` |
| `07` | Venom complete — the gate for the Season 2 row | `02`, `04`, `05`, `06` |

`season-rollover` ticket `09` gains the cross-feature edge `Blocked by: .scratch/season-2-theming/issues/07`.

## Deliberately out of scope

- **Retrofitting Season 1** with any new element — declined; `void` frozen is the verification gate.
- **A venom light variant** — light mode stays season-neutral.
- **CMS-composed themes** (colour pickers, upload fields, storage adapters) — extends ticket `08`'s rationale: contrast is doing real work and a picker can't guarantee a readable page; a theme is a reviewed, built whole.
- **The Season 2 row itself** — that is `season-rollover` `09`, unchanged except for its new blocking edge.
