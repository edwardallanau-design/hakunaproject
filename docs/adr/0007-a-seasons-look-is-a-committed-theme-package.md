# 7. A Season's look is a committed theme package selected by slug

Date: 2026-08-11

Extends the theming decision shipped with the Season rollover (ticket `08`).

## Status

Accepted

## Context

Per-Season theming shipped as 13 colour tokens in a `theme-<slug>` class, selected by a free-text `themeSlug` on the Season row. Ticket `08` deliberately rejected operator-chosen colour values: contrast is doing real work in this design, and a colour picker cannot guarantee a readable page.

For Season 2 the operator widened the scope of a theme to typography (all three font roles), a page backdrop, card/UI motifs, and key art. That raised the question this ADR answers: where does a theme's substance live — in the CMS as uploads and fields, or in the repo as code?

Two facts constrained the answer. The `media` collection has no storage adapter, and the site deploys serverless to Vercel, where disk uploads do not survive a deploy — so CMS-hosted assets would require new infrastructure before the first image. More fundamentally, every asset kind chosen is inert without per-season CSS to position, fade, tile or `@font-face` it: an uploaded backdrop still needs a deploy to land, so admin-panel freedom over assets is illusory.

## Decision

**A theme is a named, code-defined package**: a required 13-token palette; three overridable font tokens (`--font-display`, `--font-body`, `--font-ui`); and optional backdrop, motifs, and key art. Every element beyond the palette is optional, and **its absence falls back to today's look** — a theme that defines only a palette is complete.

**Theme assets live slug-keyed in the repo, paired with the theme's CSS.** File assets (fonts, replacement art) land under `public/themes/<slug>/` when they exist; a theme authored entirely as inline SVG/CSS is equally valid — the convention is *slug-keyed and committed*, not *a directory must exist*.

**The CMS carries exactly one theming field**: `themeSlug`, a select over the themes the code's manifest declares. Picking a Season's look is a dropdown; building a new look is a pull request. This extends ticket `08`'s rationale rather than reversing it — the dropdown is the same "operators choose among reviewed wholes, never compose values" principle, applied to the wider package.

**Light mode stays season-neutral.** A theme defines its dark look only.

## Consequences

A new Season's look is a PR with review, screenshots, and the existing verification discipline — not an admin action. The operator gives up composing looks in the panel; that is the point, and it is the same trade ticket `08` already made for colour.

**Every future theme costs one enum-value migration**, because Payload's postgres adapter stores a select as a pg enum. This is consistent with ADR `0004` (schema changes go through committed migrations) and is the known price of making the dropdown typo-proof. A session adding a theme should expect it here, not discover it in a failed deploy.

The fallback contract gives every seam refactor a verification gate: `void` uses no optional element, so "`void` is pixel-for-pixel unchanged" proves new machinery touched nothing it shouldn't. Season 1 stays frozen deliberately.

Code-drawn launch assets are a floor, not a ceiling: the slug-keyed convention means any piece can be replaced by better art later without touching the seam, the schema, or any other theme.
