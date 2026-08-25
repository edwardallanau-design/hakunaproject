/**
 * The theme manifest — the single source of truth for which Season themes
 * exist. The `themeSlug` dropdown on a Season row is generated from this list,
 * so a theme that is not here cannot be selected, and a typo cannot produce an
 * unstyled page.
 *
 * ## What a theme is
 *
 * A theme is a named, code-defined *package* (ADR 0007), not a colour scheme.
 * It has one required element and four optional ones:
 *
 * - **Palette** (required) — the 13 colour tokens declared by `.theme-<slug>`
 *   in globals.css: --bg, --surface, --surface2, --accent, --accent2, --glow,
 *   --text, --muted, --border, --border-dim, --card-bg, --corner,
 *   --shadow-accent.
 * - **Typography** (optional) — override any subset of --font-display,
 *   --font-body, --font-ui under the theme class. The font itself is declared
 *   in src/lib/fonts.ts, and a theme-specific font must be declared there with
 *   `preload: false` so only the viewed Season's font is downloaded.
 * - **Backdrop** (optional) — a page/hero environmental treatment, applied
 *   purely in theme CSS.
 * - **Motifs** (optional) — card and UI decorations: gem corners, border
 *   treatments, section dividers.
 * - **Key art** (optional) — a hero illustration, declared by `hasKeyArt`
 *   below. A theme without it renders nothing in its place — no placeholder,
 *   no reserved space.
 *
 * **Every optional element falls back to today's look when a theme omits it.**
 * That fallback contract is what lets `void` stay pixel-for-pixel frozen while
 * the seam widens around it, which in turn is the verification gate for any
 * change to this machinery.
 *
 * ## Where a theme's substance lives
 *
 * In the repo, keyed by slug, paired with the theme's CSS. File assets (woff2,
 * replacement art) go under `public/themes/<slug>/` when they exist; a theme
 * authored entirely as inline SVG/CSS is equally valid — the convention is
 * *slug-keyed and committed*, not *a directory must exist*.
 *
 * ## Adding a theme
 *
 * 1. Add an entry here.
 * 2. Declare `.theme-<slug>` in globals.css with all 13 colour tokens, plus
 *    whichever optional elements it uses.
 * 3. **Generate a migration.** Payload's postgres adapter stores the
 *    `themeSlug` select as a pg enum, so every new theme costs one
 *    enum-value migration (ADR 0007, ADR 0004 — no auto-push, ever).
 * 4. Run `npm run generate:types`.
 */

export type Theme = {
  /** Matches the `.theme-<slug>` class in globals.css and the stored value. */
  slug: string;
  /** Shown in the admin dropdown. */
  label: string;
  /**
   * Whether this theme supplies hero key art. False means the key-art slot
   * renders nothing at all for this theme.
   */
  hasKeyArt: boolean;
};

export const THEMES = [
  {
    // Season 1, frozen. Uses no optional element — void is the theme that
    // proves the fallback contract, so it is deliberately never retrofitted.
    slug: "void",
    label: "Void — Midnight Season 1",
    hasKeyArt: false,
  },
  {
    // Season 2. Palette and all three font roles are live; the page structure
    // the design calls for (numbered sections, descent timeline, dungeon grid,
    // champion spotlight) lands with the layout work.
    //
    // **venom is dark-only** — an operator decision from the Season 2 design
    // that supersedes ADR 0007's "light stays season-neutral" for this theme.
    // The light/dark toggle is hidden while venom shows. See the specificity
    // note on `.theme-venom` in globals.css: the light override has to be
    // beaten deliberately, it does not just lose.
    slug: "venom",
    label: "Venom — The Curse of Ula'tek",
    // The design bakes its serpent-eye crest into the hero rather than filling
    // a generic slot, so there is no key art in the manifest sense.
    hasKeyArt: false,
  },
] as const satisfies readonly Theme[];

export type ThemeSlug = (typeof THEMES)[number]["slug"];

/** Options for the `themeSlug` select field on the Seasons collection. */
export const THEME_OPTIONS = THEMES.map((t) => ({ label: t.label, value: t.slug }));
