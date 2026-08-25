import { VT323, Press_Start_2P } from "next/font/google";

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
// `preload: false` on everything except the site defaults is what makes
// per-Season fonts affordable: the @font-face rule ships in the stylesheet for
// every page (harmless, a few hundred bytes), but the browser only downloads
// the font file when a rendered element actually resolves to that family. A
// visitor reading Season 1 therefore pays for VT323 and Press Start 2P and
// nothing else, even though venom's faces are declared.
//
// Adding a font for a new theme means adding it here and pointing the theme's
// `--font-*` tokens at its variable in globals.css — see the theme package
// convention documented in src/lib/themes.ts.

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

// Applied to <html> so every font variable is in scope for the whole document,
// including the theme classes further down the tree.
export const fontVariables = [vt323.variable, pressStart2P.variable].join(" ");
