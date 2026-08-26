# Recent Keys: four categories on a scrolling marquee

> Named "Dungeon Rotation" until 2026-08-26. A *rotation* is the season's
> dungeon pool — static, and identical for every guild. Once the section became
> a rolling 48-hour window of this guild's own keys, the heading was describing
> the wrong thing.


Status: `shipped`
Date: 2026-08-25, reconciled against the code 2026-08-26

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

**Runs come from `characters/profile` instead** — one field,
`mythic_plus_recent_runs`. The other two run lists
(`mythic_plus_highest_level_runs`, `mythic_plus_weekly_highest_level_runs`) were
fetched at first and dropped: measured against live data **neither contributed a
single unique run**, everything they returned already being in `recent_runs` or
in each other. They were also a slow leak — `highest_level_runs` is
*season*-scoped, and only looked fresh because the season was two weeks old. By
month three a standout run from month one would still have been headlining BEST
KEY on a board built to move.

**The bulk call still happens, for one reason: it is the only score-ordered
source that carries each character's realm.** Realms vary across this guild —
Heyems is on Frostmourne, not Barthilas — and a wrong realm is a 400. The stored
`mythicPlusRunners` cannot substitute; it has no realm column. So the bulk
response is an address book, never a run source. The roster it returns is
rebuilt every poll: nothing is hardcoded, so a member who joins and scores
appears next hour and one who leaves disappears.

## Where the fetching happens

**The Sync fetches; the page derives.** This was the other way round when the
section first shipped, and the reversal is the single largest change to it.

| | before | after |
|---|---|---|
| requests per page render | ~166 | **0** |
| cold render | **7.1s** | **0.23s** |
| Sync duration | ~1s | 14.9s |

Request-time polling failed three ways at once. The poll sat inside the render
on a 900s revalidate against an upstream edge that expires at 300s, so the
render that refilled the cache was essentially *always* the cold one. Next
dedupes fetches *within* a render but not *across* concurrent ones, so several
visitors arriving on an expired cache each started their own poll. And nothing
could ever be seen beyond a character's ten-run window.

**Runs are stored, not tiles** (operator, 2026-08-26: *"yes store it"*). Storing
finished tiles would freeze the presentation into the database — changing a
category, a threshold or the window would need a re-sync before it showed.
Storing runs keeps every selection rule in code where it is tested, and buys
reach: each character exposes only their ten most recent runs, so a single poll
can never see further back than that window goes. Folding hourly keeps a run
after it scrolls out of everyone's ten. First sync stored **1,034 runs (264 KB)
spanning 0h to 6.9d** — roughly three times the reach of any one poll.

`mergeStoredRuns` unions parties rather than replacing them: a run can first
appear when only one member's window still holds it and gain the rest later, so
taking the fresh copy wholesale would sometimes *shrink* a party already seen in
full. `RUN_RETENTION_MS` is **7 days** against a 48-hour display window,
deliberately longer so the window can be retuned without waiting days for the
store to refill.

The fetches are `cache: "no-store"`. The Data Cache was load-bearing when a
visitor's render paid for the poll; it is actively wrong when the Sync's whole
job is to go and look.

**The keys poll joins the fetch stage, so its failure fails the whole Sync
before anything is written** (ADR 0001). Tolerating a keys failure so raid
progression still wrote was considered and rejected: it needs a second, weaker
notion of failure, and a `lastSyncError` whose description ("the data below is
stale") would then be false. Only the bulk roster call can throw — individual
profiles are already skipped one by one — so a total failure means Raider.IO's
M+ API is down while its guild API is up, which the next hourly run heals.

## Who gets polled

**The whole ranked roster.** `MIN_CHARACTER_SCORE = 0` and `MAX_CHARACTERS =
250`, so today all 165 ranked characters are polled and neither limit binds.

An io floor of 2000 was tried and then disarmed. Under a 48-hour window a
low-scoring character only enters the pool by running *recently*, which changes
the arithmetic entirely — measured, dropping the floor takes the board from 32
distinct people to **40**, leaves BEST KEY (+15..+17) and CLOSEST CALL (+7..+16)
untouched, and costs only LATEST RUN, which widens from +9..+11 to +2..+11. The
operator accepted that trade (*"im good with showing +2"*).

It also decides whether the activity count can speak for the guild: at 2000 the
honest phrasing is "73 of the 88 we polled", which is not a statement about the
guild. At 0 it is roughly 110 of 165 — the exact figure moves hour to hour, so
treat it as a scale rather than a constant.

`MAX_CHARACTERS` is a backstop against unbounded fan-out, expected never to
bind. If it ever fires it logs that the board is thinner than the guild's
activity, rather than truncating silently.

**`MIN_KEY_LEVEL = 0` — the key floor is disarmed too** (operator, 2026-08-26:
*"no restriction on key levels for now … since it's too early for the season"*).
It was 12 briefly. The "+2 parade of alts" it was raised against came from the
*sub-2000 characters*, not from the missing floor; with the poll widened,
measured over the 963 runs the roster returns:

| floor | runs | tiles | people | LATEST RUN keys | oldest LATEST |
|---|---|---|---|---|---|
| **+0** | **963** | **32** | **29** | **+9..+11** | **4h** |
| +10 | 737 | 32 | 30 | +10..+14 | 7h |
| +12 | 235 | 32 | 25 | +12..+16 | 10h |

No floor is six hours fresher. GUILD GROUP survives it: only two dungeons drop
to +11, and both *gain* a member doing so. The constant stays in place carrying
this table, so raising it as the keys climb is a one-number edit.


## Requirements

All shipped. Checked because this spec was written alongside the build and
revised as it changed; an unticked box here would mean the spec is stale, not
that work remains.

- [x] Four categories per dungeon: best key, latest run, closest call, guild group
- [x] Runs sourced from `characters/profile`, never from the bulk payload's `runs[]`
- [x] Only `mythic_plus_recent_runs` is requested — the other two run lists
      contributed no unique runs and only added age
- [x] Everyone at or above `MIN_CHARACTER_SCORE` is polled, not just top scorers
- [x] A roster where nobody clears the score floor logs why nothing was polled
- [x] Runs below `MIN_KEY_LEVEL` cannot headline a tile (mechanism live; the
      constant is currently 0, so it passes everything)
- [x] Runs older than `RECENCY_WINDOW_MS` cannot headline a tile
- [x] The bulk call is used only to enumerate name + realm
- [x] `static-data` fetches removed
- [x] The Sync fetches and stores runs; the page does no I/O
- [x] Stored runs accumulate and are pruned at `RUN_RETENTION_MS`, and parties
      are unioned rather than replaced
- [x] A keys-poll failure fails the Sync before anything is written (ADR 0001)
- [x] Closest call shows the **real** sign — over-time renders as over, not "SPARE"
- [x] One meaning per slot: the `mm:ss` stat is the clear time on *every*
      category, and a closest call's margin lives in the outcome ("SPARE BY
      0:04"). Putting the margin in the stat slot made a 29:56 clear read as a
      four-second run.
- [x] Marquee halts under `prefers-reduced-motion`, with a readable static fallback
- [x] A pause control exists, because touch has no hover
- [x] Each page load enters the loop at a different point
- [x] Section numeral computed, not hardcoded
- [x] No MIDNIGHT / LEGACY badges, and no pool legend
- [x] A category with no qualifying run omits its tile; the marquee length is free
- [x] Duplicate runs across categories are kept — one run wearing two badges is
      two true statements, and deduping would silently blank a tile
- [x] One character failing must not cost the section: profiles are skipped
      individually inside the poll

**The page's catch-to-empty envelope is gone, and its absence is the
requirement now.** It existed because the render performed I/O. The render reads
a stored array and calls two pure functions; there is nothing left to fail, and
a `try/catch` around it would be theatre.


## Decisions worth not re-litigating

**Best key includes depleted runs.** The design itself shows a `+12 OVER`
best-key tile. Colloquially "best key" means timed, so the code says otherwise
explicitly.

**Guild group means three or more members — and the reason it does is now
stale.** Four is the honest read of "group". Three was chosen because at four,
Voidscar Arena had no qualifying run at all. With `MIN_KEY_LEVEL` disarmed the
pool is four times larger and **every one of the eight dungeons now fields a run
of four or more** — measured party sizes on the current picks are 5, 4, 4, 4, 4,
5, 5, 5. Raising it to 4 would cost no dungeon a tile and make the badge mean
what it says. Left at 3 because it changes what the tiles show, which is the
operator's call rather than a maintenance detail. Five would cover 4 of 8.

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
characters actually played this week.** Roughly 110 of the 165 ranked characters run
a key in any 48-hour window, at a median of 4 keys each.

It replaces the hero's `Active Members`, which read `season.rankings.members` —
the guild's *roster size*, a membership number wearing an activity label since
before this work. The fallback triggers on **null, not zero** — null meaning the count was never
taken, which is an archived Season (fetch skipped, ADR 0005) or a failed poll.
Only then does it fall back to the roster count, which is exactly what the stat
showed before. **A measured `0` renders as `0`**: a guild that ran nothing for
48 hours should say so rather than quietly showing its roster size under an
activity label. An earlier draft collapsed the three cases into a falsy zero and
that is the bug this distinction exists to prevent.

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

**A thin board needs more than two copies of the track.** The strip loops by
shifting exactly one copy, which only reads as seamless while a copy is at least
as wide as the viewport — roughly 5 tiles at 1440px, 9 at 2560px, 12 at 3440px.
A quiet week that thins the board to three dungeons is well inside that.

Guarded: the track repeats the tile list to at least `MIN_TRACK_TILES` (26) and
the keyframe shifts by `calc(-100% / var(--venom-mq-copies))` rather than a
hard-coded `-50%`. At a full 32-tile board nothing changes. This was originally
left unguarded on the reasoning that it only occurred on day one of a season;
the degradation curve showed it is reachable in any lull, and the reasoning was
wrong rather than merely optimistic.

## Out of scope

**Suspense-streaming the section.** It was the cheap alternative to persisting —
the page would render immediately and the strip stream in behind a boundary.
Moot now: with the poll in the Sync there is nothing to wait for. Had it been
built first it would have been a few hours of restructuring the
`page.tsx` → `VenomPage` seam that persisting then undid.

**A frozen view for archived Seasons.** Their stored runs survive whatever the
last Sync saw, so a "final week of the season" board is technically available.
Not built: a section headed *Recent Keys* showing a two-year-old week answers a
question nobody asked. Archived Seasons render nothing, as they always have
(ADR 0005).

**Alt detection.** Raider.IO exposes no account link — `persona_id` looked like
one and is not — so the activity count is of characters and cannot be of people.
See *The activity count*.
