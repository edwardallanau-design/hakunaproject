import { VT323, Press_Start_2P, Almendra_Display, Grenze, Cormorant_SC } from "next/font/google";

// Every font any theme uses, self-hosted by next/font at build time. This
// replaces the `@import url(fonts.googleapis.com/...)` that used to sit at the
// top of globals.css: the woff2 files are served from our own origin, so a page
// load makes no request to an external font host.
//
// Each font is exposed as a CSS custom property rather than a class name, so
// the `--font-display` / `--font-body` / `--font-ui` theme tokens in globals.css
// can point at any of them and a theme class can repoint them without a
// component ever naming a family.
//
// Both fonts below are site defaults — every page uses them whichever Season is
// being viewed — so both preload, which is next/font's default. Nothing here
// sets `preload: false` yet, because there is no theme-specific font yet.
//
// That changes when a theme adds its own font (ticket 03). Such a font must be
// declared with `preload: false`: its @font-face rule still ships in the
// stylesheet for every page (harmless, a few hundred bytes), but the browser
// only downloads the file when a rendered element actually resolves to that
// family — so a visitor reading Season 1 does not pay for Season 2's font.
// Preloading it instead would fetch it for everyone and defeat the point.
//
// Adding a font for a new theme means adding it here with `preload: false` and
// pointing the theme's `--font-*` tokens at its variable in globals.css — see
// the theme package convention documented in src/lib/themes.ts.

export const vt323 = VT323({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-vt323",
  display: "swap",
});

export const pressStart2P = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-press-start-2p",
  display: "swap",
});

// ── venom (Season 2) ────────────────────────────────────────────────────────
// All three carry `preload: false`, which is the rule stated above doing real
// work for the first time: their @font-face rules ship on every page, but the
// files only download when an element actually resolves to the family — i.e.
// only under `.theme-venom`. A visitor reading Season 1 pays nothing for them.

export const almendraDisplay = Almendra_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-almendra-display",
  display: "swap",
  preload: false,
});

export const grenze = Grenze({
  subsets: ["latin"],
  // The design uses 400 for body copy, 500 for boss and dungeon names, and 600
  // where it wants weight without jumping to the display face.
  weight: ["400", "500", "600"],
  variable: "--font-grenze",
  display: "swap",
  preload: false,
});

export const cormorantSC = Cormorant_SC({
  subsets: ["latin"],
  // Labels and nav sit at 600; buttons, chips and section meta go to 700. 500
  // is the lightest the design uses, on the hero tagline.
  weight: ["500", "600", "700"],
  variable: "--font-cormorant-sc",
  display: "swap",
  preload: false,
});

// Applied to <html> so every font variable is in scope for the whole document,
// including the theme classes further down the tree.
export const fontVariables = [
  vt323.variable,
  pressStart2P.variable,
  almendraDisplay.variable,
  grenze.variable,
  cormorantSC.variable,
].join(" ");
