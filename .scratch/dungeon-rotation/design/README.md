# Dungeon Rotation — the operator's design, 2026-08-25

Delivered as a bundled single-page HTML (fonts inlined, ~1&nbsp;MB). Only the
parts that carry design intent are reproduced here: the tile markup and the
data shape behind it. The bundle itself was not committed — it is a build
artefact of the design tool, and its 20 embedded woff2 files are the same faces
`src/lib/fonts.ts` already self-hosts.

## What the design is

**The section becomes one continuous marquee. There is no static grid.** Every
tile is a *category* view of one dungeon, so eight dungeons produce up to 32
tiles, and the strip scrolls them past at a readable pace.

```
BEST KEY   ·  LATEST RUN  ·  CLOSEST CALL  ·  GUILD GROUP
```

Each tile carries **exactly one** category badge, coloured to it:

| category | design | shipped |
|---|---|---|
| BEST KEY | `var(--glow)` lime | `var(--best)` ice-green |
| LATEST RUN | `var(--accent2)` teal | `var(--accent2)` gold |
| CLOSEST CALL | `#fbbf24` amber | `var(--warn)` orange |
| GUILD GROUP | `#a3e635` lime-bright | `var(--accent)` emerald |

Three reconciliations. The `shipped` column reflects the 2026-08-26 repalette,
which retired the lime/teal pair the design was drawn against; the design column
is left as drawn.

- **`#a3e635` *is* `--glow`.** The design gives BEST KEY and GUILD GROUP literally
  the same colour under two names — the kind of collision that survives a
  prototype because the two tiles are never adjacent in a mock. On a marquee
  they are adjacent constantly.

  **The first fix was insufficient and is worth recording.** GUILD GROUP moved to
  `--accent`, "the next lime down", which kept the design's family — but one hue
  at two lightnesses is still one colour twice: the pair measured **1.31:1**
  badge-against-badge, and the notch never got anything to say. Naming the
  collision was right; treating it as a lightness problem was not. BEST KEY now
  has its own hue in `--best`, at **1.78:1**. The lesson generalises: on this
  marquee a category needs a different *hue*, not a different shade.
- **The amber becomes a token.** `--warn` and `--miss` join the venom palette as
  *status* colours, deliberately outside the accent pair — a tile has to say
  "close" and "missed", and saying either in an accent colour reads as emphasis
  rather than as outcome. `--warn` is now `#f97316` orange rather than the
  original `#e8b64c` amber: the repalette made gold an accent, and amber sat too
  close to it to keep the property the token exists for.
- **`--best` puts the palette at 14 tokens.** ADR `0007`'s "required 13-token
  palette" is a floor, not an exact set — `--warn` and `--miss` already sat above
  it. `--best` follows their pattern: declared only by `.theme-venom`, consumed
  with a literal fallback so a palette-only theme degrades to a readable badge.

## Tile anatomy, from the design's own markup

```
┌───────────────────────────────◣  clip-path notch, filled with the category colour
│ [ BEST KEY ]                     badge: category only
│ Temple of Sethraliss             dungeon name, --bd-sm
│ +17   29:22        TIMED         key (--fd, glowing) · clear time · outcome
│ ─────────────────────────────
│ Buratski                         party, class-coloured, min-height reserved
└──────────────────────────────────
```

- `width: clamp(238px, 22vw, 284px)`, `margin-right: 14px`
- `clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)`
- roster row has `min-height: 38px` so a one-name tile is the same height as a
  five-name tile — the same lesson the stacked roster took three tries to learn
- track is duplicated and the copy is `aria-hidden`, giving a seamless loop
- `mask-image` fades both edges
- hover pauses the animation

## Deliberate removals, recorded so they are not "restored" as a regression

**MIDNIGHT / LEGACY badges are gone, by operator decision (2026-08-25): "these
doesn't really have any value".** The design's own `renderVals` still computes
`tag`/`tagColor` but no markup consumes them — that is the removal in progress,
not an oversight. The pool legend at the foot of the old grid goes with them.

**The static grid is gone.** The marquee replaces it entirely.

## Everything in the prototype's data is placeholder

`dungeonData` and `rosterPool` are invented — Isami, Xorakk, Libat, Avengers,
Bonechewer, Miriel, Thornvex, Kaelis, Drustan, Vexa, Ozrik, Fenwick, Serapha,
Grombash appear nowhere in the guild. Real names are Buratski, Warkeb,
Chocomann, Zoya, Kuyakulata, Enolikkin. `design/NOTES.md` from the Season 2
bundle already forbids a prototype name reaching a real Season row, and that
rule is what caught "Vaults of Atal'Utek" before it shipped.

## Three defects in the prototype, fixed in the build

1. **`CLOSEST CALL` always renders "SPARE", in teal.** The expression is
   `j === 2 ? "0:0X SPARE" : …`, with `timedColor: j === 2 || isTimed ? …`. On
   real data **three of eight closest calls are over-time**, so the design would
   paint a heartbreak as a clutch save.

   **A second defect hid underneath that one and shipped before it was caught.**
   The design puts the margin in the same slot, in the same `mm:ss` format, that
   every other tile uses for the clear time. In a static mock the two never
   appear together; on a marquee they are neighbours constantly, and a genuine
   29:56 clear rendered as `0:04` reads as a four-second dungeon. The operator
   spotted it on the live board — *"it has runs that didnt even last 10 mins"* —
   and the data was clean: every closest call is a real 27–34 minute run, and
   the whole pool at +12 and above spans 20:26 to 51:41.

   Shipped instead: the stat slot **always** holds the clear time, and the
   margin moves into the outcome, which was already the category-specific field.
   `+15  29:56  SPARE BY 0:04`. Same layout, one meaning per slot.
2. **No `prefers-reduced-motion`.** `@keyframes marquee` runs unconditionally.
   This would be the only animation on the page ignoring the setting, and it is
   the largest moving thing on it. Touch has no hover either, so the pause
   affordance does not exist on mobile.
3. **The section numeral is hardcoded `02`.** It is **03** — the Tidebound
   Grotto took 02 when it became its own Lair Boss section. Production computes
   `numeralAfter(groups.length)`.

## Member slots the prototype reserves, against what the data supplies

The prototype reserves `[2, 1, 3, 5]` names for the four categories. Measured
against the shipped source — the whole roster, floored at +12:

| category | reserves | supplies |
|---|---|---|
| BEST KEY | 2 | **1**, in all eight |
| LATEST RUN | 1 | 1 ✓ |
| CLOSEST CALL | 3 | 1–3 |
| GUILD GROUP | 5 | 3–5 — two dungeons field a full team |

That is the pug problem: of the 235 runs at or above the floor, **179 show a
single guild member** and only 5 show all five, because a key run with outsiders
exposes only the members who were there. The build renders whatever the run
actually has and reserves the height regardless — so the rare full team does not
make its tile taller than its neighbours.

The reserve is what makes the five-man tiles readable rather than disruptive,
and those tiles only exist at all because the poll covers the whole roster:
Redwithwings / Kookeeya / Flashbangg / Mootilate / Slapsoil are nowhere near the
top twenty by score.
