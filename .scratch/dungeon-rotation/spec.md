# Recent Keys: four categories on a scrolling marquee

> Named "Dungeon Rotation" until 2026-08-26. A *rotation* is the season's
> dungeon pool — static, and identical for every guild. Once the section became
> a rolling 48-hour window of this guild's own keys, the heading was describing
> the wrong thing.


Status: `ready-for-agent`
Date: 2026-08-25

## Problem Statement

The dungeon grid shows each dungeon's **best run ever**, tie-broken by the
fastest clear. Both halves maximise staleness: a record only moves when it is
beaten, and the tie-break actively prefers the *older* run. The operator's
words: *"i'm just trying to find some variation with it so it wont be static."*

The section also discards almost everything it fetches — 834 runs come back, 8
cards render.

## Solution

**One dungeon, four stories.** Each of the eight dungeons produces up to four
tiles, and the section becomes a single continuous marquee of them.

```
BEST KEY   ·  LATEST RUN  ·  CLOSEST CALL  ·  GUILD GROUP
```

Measured across five days, this is what makes the board move: **22 distinct
people appear across the 32 tiles**, against 2 for a best-key-only board. The
variety comes from the categories, not from cleverness in one ranking rule.

See `design/README.md` for the operator's design and the three prototype
defects the build fixes.

## The data source, and why it changed

**The bulk `mythic-plus/rankings/characters` payload cannot supply these
categories, and must not be used as a run source** (operator, 2026-08-25: *"dont
use best run per character"*). Its `runs[]` is **one best run per character, per
dungeon** — confirmed: 0 of 164 characters have two runs in the same dungeon. So
its notion of "latest" is *whoever most recently set a personal best*, which
surfaces a `+6` farm run as the newest thing that happened:

```
Altar of Fangs  LATEST +6      Den of Nalorakk  LATEST +7, over by 8:41
Murder Row      LATEST +8      Kings' Rest      CLOSEST +2
```

**Runs come from `characters/profile` instead**, unioning three fields —
`mythic_plus_recent_runs`, `mythic_plus_highest_level_runs`,
`mythic_plus_weekly_highest_level_runs`. One request yields ~15 distinct runs
per character with real `completed_at`, `par_time_ms`, affix names and dungeon
names, and — unlike the bulk payload — **depleted runs**, which the bulk drops
because a blown +16 scores below a timed +14.

**The bulk call still happens, for one reason: it is the only score-ordered
source that carries each character's realm.** Realms vary across the guild —
Heyems is on Frostmourne, not Barthilas, and a wrong realm 400s. The stored
`mythicPlusRunners` cannot substitute; it has no realm column. So the bulk
response is an address book, never a run source.

**The whole ranked roster is polled, not its top scorers** (operator,
2026-08-25: *"expand it to the whole mythic+ roster … so we will have more
variety of the tiles"*). Twenty names fills all 32 tiles but features only 14
people, because the top of a score board is the same handful on every tile. The
full 164 takes that to **25**, and it is where the five-man guild groups come
from — Redwithwings / Kookeeya / Flashbangg / Mootilate / Slapsoil never appear
in a top-20 poll at all.

**Breadth needs a floor, or it drags the board down.** Measured over 1,286 live
runs:

| floor | runs | tiles | people | LATEST RUN keys |
|---|---|---|---|---|
| +0 | 1286 | 32 | 32 | +2..+10 |
| +10 | 782 | 32 | 34 | +10..+14 |
| **+12** | **235** | **32** | **25** | **+12..+16** |
| +15 | 33 | 31 | 8 | +15..+16 |

Without one, LATEST RUN becomes a parade of alts clearing +2s — true, and not
worth a tile. At +15 the pool collapses, a category starts coming back empty,
and the newest thing on the board is 22 hours old. `MIN_KEY_LEVEL = 12`.

**Breadth is bought by score, not by polling everybody.**
`MIN_CHARACTER_SCORE = 2000` — the roster entry already carries `score`, so this
costs no extra request. Simulated across one poll of the full 165:

| floor | polled | cold | runs | tiles | people | biggest party |
|---|---|---|---|---|---|---|
| 0 | 165 | 7.1s | 235 | 32 | 25 | 5 |
| 1500 | 105 | 4.5s | 235 | 32 | 25 | 5 |
| **2000** | **88** | **3.8s** | **235** | **32** | **25** | **5** |
| 2500 | 66 | 2.9s | 232 | 32 | 24 | 5 |
| 3000 | 13 | 0.6s | 109 | 32 | 11 | 5 |

At 2000 the board is identical to the full roster's for half the requests, and
that is not luck: `MIN_KEY_LEVEL` already discards everything a sub-2000
character contributes, because clearing +12s is roughly what earns that score.
The two floors measure the same thing from opposite ends, and the score one is
the cheap end — applied *before* the request rather than after it.

**3000 is the intended destination and is not reachable yet** (operator: *"i
should just aim for 3k io people but i don't think everyone is past that now …
then we increase that to 3k later on"*). Guild mean is **1840**, median
**2153**, and only **13 of 165** are at 3000 — the board collapses back to 11
people, the narrow one this change set out to fix. Raise it when the median
does, and re-run the simulation rather than assuming the shape held.

**Request budget: 89** — 1 bulk + 88 profiles, at concurrency 16. The six
`mythic-plus/static-data` calls are **dropped**: the per-character runs carry
`dungeon` and `zone_id` directly, so nothing needs the zoneId→name map any more.

**Re-timing this needs a quiet window.** Upstream sends
`cache-control: max-age=300`; the same poll inside five minutes returns in 0.2s
off Cloudflare's edge, which reads as a fast poll and is not one.

`MAX_CHARACTERS = 250` is a hard ceiling expected never to bind — the score
floor does the real bounding. It exists because an unbounded fan-out to a third
party inside a page render is what takes a site down when an assumption changes.

## Requirements

- [ ] Four categories per dungeon: best key, latest run, closest call, guild group
- [ ] Runs sourced from `characters/profile`, never from the bulk payload's `runs[]`
- [ ] Everyone at or above `MIN_CHARACTER_SCORE` is polled, not just top scorers
- [ ] A roster where nobody clears the score floor logs why the section is empty
- [ ] Runs below `MIN_KEY_LEVEL` cannot headline a tile
- [ ] The bulk call is used only to enumerate name + realm
- [ ] `static-data` fetches removed
- [ ] Closest call shows the **real** sign — over-time renders as over, not "SPARE"
- [ ] One meaning per slot: the `mm:ss` stat is the clear time on *every*
      category, and a closest call's margin lives in the outcome ("SPARE BY
      0:04"). Putting the margin in the stat slot made a 29:56 clear read as a
      four-second run.
- [ ] Marquee halts under `prefers-reduced-motion`, with a readable static fallback
- [ ] A pause control exists, because touch has no hover
- [ ] Section numeral computed, not hardcoded
- [ ] No MIDNIGHT / LEGACY badges, and no pool legend
- [ ] A category with no qualifying run omits its tile; the marquee length is free
- [ ] Duplicate runs across categories are kept — one run wearing two badges is
      two true statements, and deduping would silently blank a tile
- [ ] Every fetch inside the existing catch-to-empty envelope; one character
      failing must not cost the section, and the section must never cost the page

## Decisions worth not re-litigating

**Best key includes depleted runs.** The design itself shows a `+12 OVER`
best-key tile. Colloquially "best key" means timed, so the code says otherwise
explicitly.

**Guild group means three or more members.** Four is the honest read of "group",
but at four Voidscar Arena has no qualifying run at all. Three keeps every
dungeon represented while still meaning *several members ran this together*.

**Best key breaks ties by the most recent run, not the fastest.** The old grid
broke them by clear time, which is why it never moved: among equal keys it
actively prefers the older one. Recency is the whole point of the change.

**Tiles interleave; they are not grouped by dungeon.** Tile *i* takes category
`i % 4` and dungeon `(⌊i/4⌋ + i % 4) % D`, which visits every (category,
dungeon) pair exactly once and leaves no two neighbours sharing either. Grouping
by dungeon would park a double-badged run's identical numbers on two adjacent
tiles, which reads as a rendering bug.

**Runs are filtered to the selected season by their own `url`.** Each run
carries `…/mythic-plus-runs/season-mn-2/…`; a run naming a *different* season is
dropped. A run whose URL does not parse is kept — a format change upstream
should cost the guard, not the section.

**No relative timestamps on tiles.** The data has `completed_at` and it is
tempting; a server-rendered "4h ago" drifts against the client clock and is the
kind of hydration mismatch that is invisible until it isn't.

## A trap that cost real verification time

**Turbopack's dev server can go on serving a stale `globals.css` while hot-
reloading TSX perfectly.** A font-size change sat on disk, typechecked, and
simply never reached the browser — computed style still reported the old value
and the fix "didn't work". JS changes in the same session applied fine, which is
what made it convincing.

Check the served stylesheet, not the file, before concluding a CSS change is
wrong: fetch the `.css` the page actually loads and grep it. Restarting the dev
server clears it. Every CSS-dependent measurement taken while it was stale has
to be re-run, because none of them were testing what they claimed to.

## The activity count

The same poll answers a question the page was previously guessing at: **how many
characters actually played this week.** 112–115 of the 165 ranked characters run
a key in any 48-hour window, at a median of 4 keys each.

It replaces the hero's `Active Members`, which read `season.rankings.members` —
the guild's *roster size*, a membership number wearing an activity label since
before this work. The fallback at zero is that same roster count, so an archived
Season (fetch skipped, ADR 0005) or a failed fetch returns to exactly the old
behaviour rather than putting a bare `0` under a headline.

**Characters, not people, and the label must never imply otherwise.** Raider.IO
exposes no account link — `persona_id` looked like one and is not: 165 ranked
characters yield 163 distinct values, and the only collision is the placeholder
`0` sitting on three of them. A 165-character roster for a two-night guild
implies heavy alting, so the true headcount is likely a fraction of this and is
not derivable. Adopted with that understood (operator: *"that would be a good
baseline for active members. alt or not"*).

The count is **exact** within the window; a run count would not be. A character
who ran eleven keys in 48 hours loses the oldest to the ten-run cap but still
appears via the newer ones — which is why the headline counts characters and the
425-ish run total is never shown.

It is only guild-wide while `MIN_CHARACTER_SCORE` is 0. Raise that floor and the
number silently becomes "active among the ones we bothered to poll".

## Known edge

**Below about six tiles the loop shows a gap on a wide screen.** The strip
scrolls by `translateX(-50%)`, which is seamless only while one copy is at least
as wide as the viewport — two copies of a four-tile strip are ~1200px against a
1440px frame, so the tail of each cycle exposes blank track. Only reachable on
day one of a season, before the guild has run more than one dungeon. Left
unguarded deliberately: a third copy for a case that lasts hours costs markup
every other day of the season.

## Out of scope

**Persisting the rotation at sync time.** This ship *raises* the request-time
cost from 7 to 165, which strengthens rather than closes the ledger's Open item
— hard enough that it is now the next thing this section should get.
Storing hourly would also compound: runs captured while inside a character's
10-run window would be kept after they scroll out, building a guild run log
Raider.IO itself does not expose. Not required to ship the categories.
