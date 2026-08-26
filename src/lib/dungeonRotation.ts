/**
 * Four stories per dungeon, ordered for a marquee.
 *
 * This half is pure: runs in, tiles out. Everything that talks to Raider.IO
 * lives in `mythicPlusDungeons.ts`, which hands its merged runs here. The view
 * types are declared in this file rather than in the component, because this is
 * where they are produced — the component only renders what it is given.
 *
 * See `.scratch/dungeon-rotation/spec.md` for why the section stopped showing
 * one best key per dungeon: a record only moves when it is beaten, so the old
 * grid was static by construction.
 */

/** A guild member on a run, specced as they were for *that* run. */
export type RunMember = { name: string; class: string; spec: string; role: string };

/** One keystone run, already merged across every member who reported it. */
export type GuildRun = {
  keystoneRunId: number;
  dungeon: string;
  mythicLevel: number;
  clearTimeMs: number;
  parTimeMs: number;
  timed: boolean;
  /** ISO 8601, from upstream. Used for ordering only — never displayed. */
  completedAt: string;
  members: RunMember[];
};

export const CATEGORIES = ["best-key", "latest-run", "closest-call", "guild-group"] as const;
export type TileCategory = (typeof CATEGORIES)[number];

/**
 * Badge text, and the token each category is painted in.
 *
 * `--warn` and `--best` carry literal fallbacks because neither is part of the
 * accent pair: both are declared only by `.theme-venom`. ADR 0007 lets a theme
 * be palette-only, and such a theme would define the accent pair but have no
 * reason to know this section exists — leaving those badges unstyled. Each
 * fallback is venom's own value, so nothing changes today and a future theme
 * degrades to readable colours rather than to nothing.
 *
 * The four are deliberately four *hues*, not four shades. BEST KEY does not
 * borrow `--glow`: that sits beside `--accent` on GUILD GROUP tiles as one hue
 * at two lightnesses, and the pair stopped reading as two categories.
 */
export const CATEGORY_STYLE: Record<TileCategory, { label: string; color: string }> = {
  "best-key": { label: "BEST KEY", color: "var(--best, #a7f3d0)" },
  "latest-run": { label: "LATEST RUN", color: "var(--accent2)" },
  "closest-call": { label: "CLOSEST CALL", color: "var(--warn, #f97316)" },
  "guild-group": { label: "GUILD GROUP", color: "var(--accent)" },
};

/**
 * How many guild members a run needs before it counts as a *group*.
 *
 * Four is the honest read of the word. Three was chosen because a key run with
 * pugs exposes only the members who were there — the large majority of runs
 * show exactly one — and at four, Voidscar Arena had no qualifying run at all.
 *
 * **That justification no longer holds and the constant has not been changed to
 * match.** With {@link MIN_KEY_LEVEL} disarmed the pool is four times larger,
 * and every one of the eight dungeons now fields a run of four or more:
 * measured party sizes on the current picks are 5, 4, 4, 4, 4, 5, 5, 5. Raising
 * this to 4 would cost no dungeon a tile and would make the badge mean what it
 * says. It is left at 3 because it changes what the tiles show, which is the
 * operator's call rather than a maintenance detail. Five would cover 4 of 8.
 */
export const GUILD_GROUP_MIN = 3;

/**
 * The lowest key a run needs before it can headline a tile. **Disarmed for the
 * early season** (operator, 2026-08-26: *"no restriction on key levels for now
 * … since it's too early for the season"*).
 *
 * This floor and `MIN_CHARACTER_SCORE` measure the same thing from opposite
 * ends, and once the score floor was in place this one mostly stopped earning
 * its keep. Measured over the 963 runs the 2000-io roster returns:
 *
 * | floor | runs | tiles | people | LATEST RUN keys | oldest LATEST |
 * |-------|------|-------|--------|-----------------|---------------|
 * | +0    |  963 | 32    | 29     | +9..+11         | 4h            |
 * | +10   |  737 | 32    | 30     | +10..+14        | 7h            |
 * | +12   |  235 | 32    | 25     | +12..+16        | 10h           |
 *
 * The "+2 parade of alts" this floor was raised to stop came from *sub-2000
 * characters*, not from the missing floor — with the score floor holding, no
 * floor at all still yields +9..+11 and a board six hours fresher. GUILD GROUP
 * survives it too: only two dungeons drop to +11, and both gain a member doing
 * so, which is that category working correctly rather than degrading.
 *
 * Raise it as the season matures and the keys climb — 10 or 12 on the evidence
 * above — and re-measure rather than assuming the shape held.
 */
export const MIN_KEY_LEVEL = 0;

/**
 * How far back a run can be and still headline a tile.
 *
 * **Tightening this window makes the board *more* varied, not less** — which is
 * the opposite of what it looks like. In a large pool every category keeps
 * converging on the same few standout runs; in a small one each has to pick
 * from what actually just happened, so the names spread out. Measured on the
 * `recent_runs` pool:
 *
 * | window | runs | tiles | people | oldest tile |
 * |--------|------|-------|--------|-------------|
 * | 1d     |  152 | 29/32 | 24     | 1.0d        |
 * | **2d** |  351 | 32/32 | **32** | 2.0d        |
 * | 3d     |  497 | 32/32 | 31     | 2.8d        |
 * | 5d     |  674 | 32/32 | 30     | 4.1d        |
 * | 7d     |  729 | 32/32 | 30     | 4.1d        |
 *
 * Two days fills every tile with the widest cast and nothing older than 48
 * hours. One day starts starving GUILD GROUP, which needs time to accumulate a
 * run with three members in it.
 *
 * **Rolling, deliberately, rather than aligned to the weekly reset.** A
 * reset-aligned window was modelled and is far worse: the section is empty for
 * the first 9 hours of every lockout, GUILD GROUP stays empty for four days,
 * and the board only reaches full quality in the hours before it wipes again —
 * worst when the week is new, best right before it is thrown away.
 */
export const RECENCY_WINDOW_MS = 2 * 24 * 60 * 60 * 1000;

/**
 * How long a run is kept in the stored set.
 *
 * Longer than {@link RECENCY_WINDOW_MS} on purpose. The window decides what the
 * board *shows*; this decides what survives to be shown, and keeping a few days
 * of slack means the display window can be retuned without waiting days for the
 * store to refill. At current volume this holds roughly 1,500 runs — a JSON blob
 * a few hundred kilobytes wide, rewritten hourly, which is the same order as
 * `mythicPlusParticipants` already on this row.
 */
export const RUN_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Add a member to a run's party if they are not already on it.
 *
 * Shared because a party is assembled in two places for two different reasons —
 * across characters within one poll (mergeProfileRuns) and across polls over
 * time (mergeStoredRuns) — and both are the same domain rule: a party
 * accumulates by name, and seeing the same run twice must never duplicate
 * anyone. Keeping one copy means the rule cannot drift between them.
 */
/**
 * Read a stored run set back out of the Season row.
 *
 * The column is Payload `json`, which is not schema-checked on the way out, so
 * this is the same trust-the-shape boundary ADR 0002 closed at the *fetch*
 * edge — reopened at the *storage* edge. A malformed row would otherwise
 * surface as `Date.parse(undefined)` several layers inside `buildRotation`,
 * which is precisely the failure that ADR names.
 *
 * Deliberately lenient rather than throwing: this data is decoration, and a
 * page that 500s because one stored run lost a field is worse than a board
 * missing that run. Bad entries are dropped and counted in one log line, so a
 * silently thinner board is still traceable.
 */
export function parseStoredRuns(value: unknown, label = "stored runs"): GuildRun[] {
  if (!Array.isArray(value)) return [];
  const kept: GuildRun[] = [];
  let dropped = 0;
  for (const r of value) {
    const ok =
      r !== null &&
      typeof r === "object" &&
      typeof (r as GuildRun).keystoneRunId === "number" &&
      typeof (r as GuildRun).dungeon === "string" &&
      typeof (r as GuildRun).mythicLevel === "number" &&
      typeof (r as GuildRun).clearTimeMs === "number" &&
      typeof (r as GuildRun).parTimeMs === "number" &&
      typeof (r as GuildRun).completedAt === "string" &&
      !Number.isNaN(Date.parse((r as GuildRun).completedAt)) &&
      Array.isArray((r as GuildRun).members);
    if (ok) kept.push(r as GuildRun);
    else dropped++;
  }
  if (dropped > 0) console.error(`${label}: dropped ${dropped} malformed run(s) of ${value.length}.`);
  return kept;
}

export function unionMember(members: RunMember[], member: RunMember): void {
  if (!members.some((m) => m.name === member.name)) members.push(member);
}

/**
 * Newest first, with the keystone id as the tie-break.
 *
 * `completedAt` has second resolution, so two runs by the same party can share
 * a timestamp. Falling through to the id keeps the order total — without it the
 * server and a re-render could disagree on which run a tile shows.
 */
export const newestFirst = (a: GuildRun, b: GuildRun) =>
  Date.parse(b.completedAt) - Date.parse(a.completedAt) || b.keystoneRunId - a.keystoneRunId;

/**
 * Fold a fresh poll into the stored set, dropping anything past retention.
 *
 * **This is the reason storing runs beats storing tiles.** Each character
 * exposes only their ten most recent runs, so a request-time fetch can never
 * see further back than that window reaches — on an active roster, about two
 * days. Accumulating hourly means a run stays after it scrolls out of everyone's
 * ten, and the board keeps a history upstream does not actually offer.
 *
 * Parties are unioned rather than replaced. A run can first appear when only one
 * member's window still holds it and gain the rest on a later poll, so taking
 * the fresh copy wholesale would sometimes *shrink* a party that had already
 * been seen in full.
 */
export function mergeStoredRuns(
  stored: GuildRun[],
  fresh: GuildRun[],
  now: number = Date.now(),
): GuildRun[] {
  const cutoff = now - RUN_RETENTION_MS;
  const byId = new Map<number, GuildRun>();

  for (const run of [...stored, ...fresh]) {
    if (Date.parse(run.completedAt) < cutoff) continue;
    const existing = byId.get(run.keystoneRunId);
    if (!existing) {
      byId.set(run.keystoneRunId, { ...run, members: [...run.members] });
      continue;
    }
    for (const member of run.members) unionMember(existing.members, member);
  }

  // Newest first. Stored order is otherwise arbitrary, and a stable one keeps
  // the hourly write from churning the whole blob on every sync.
  return [...byId.values()].sort(newestFirst);
}

/** Party order: tank first, then healer, then dps. */
const ROLE_ORDER: Record<string, number> = { tank: 0, healer: 1, dps: 2 };

export type DungeonTile = {
  category: TileCategory;
  dungeon: string;
  mythicLevel: number;
  timed: boolean;
  /**
   * mm:ss. **Always the clear time**, on every category.
   *
   * It used to hold the margin on a closest call, which is where the number
   * belongs logically and exactly the wrong place for it on a strip: the same
   * slot in the same format meant "half an hour" on 24 tiles and "four seconds"
   * on 8, so a real 29:56 clear rendered as `0:04` and read as a four-second
   * dungeon. The margin moved to {@link outcome}, which was already the
   * category-specific field.
   */
  stat: string;
  /** TIMED, OVER, or on a closest call the margin too: "SPARE BY 0:04". */
  outcome: string;
  members: RunMember[];
};

/** Signed gap against par: negative is time to spare, positive is over. */
const margin = (r: GuildRun) => r.clearTimeMs - r.parTimeMs;

const newest = newestFirst;

const SELECT: Record<TileCategory, (runs: GuildRun[]) => GuildRun | undefined> = {
  // Ties break on recency, not on the faster clear. The old grid broke them the
  // other way, which is exactly why it never moved: among equal keys it
  // actively preferred the older run.
  //
  // Depleted runs are eligible. Colloquially "best key" means timed, so this
  // says otherwise out loud: the highest key the guild has *put itself in*, and
  // the tile carries OVER when they did not make it.
  "best-key": (runs) => [...runs].sort((a, b) => b.mythicLevel - a.mythicLevel || newest(a, b))[0],

  "latest-run": (runs) => [...runs].sort(newest)[0],

  // Closest to the timer in either direction — a three-second save and a
  // three-second heartbreak are equally the story.
  "closest-call": (runs) =>
    [...runs].sort((a, b) => Math.abs(margin(a)) - Math.abs(margin(b)) || newest(a, b))[0],

  "guild-group": (runs) =>
    runs
      .filter((r) => r.members.length >= GUILD_GROUP_MIN)
      .sort((a, b) => b.members.length - a.members.length || b.mythicLevel - a.mythicLevel || newest(a, b))[0],
};

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function toTile(category: TileCategory, run: GuildRun): DungeonTile {
  const isClosest = category === "closest-call";
  return {
    category,
    dungeon: run.dungeon,
    mythicLevel: run.mythicLevel,
    timed: run.timed,
    stat: formatDuration(run.clearTimeMs),
    // "SPARE BY 0:03" and "OVER BY 0:03" are the same measurement pointing
    // opposite ways, and both say out loud that the number is a gap rather than
    // a duration. The design's prototype hardcoded SPARE here, which would have
    // painted three of eight real heartbreaks as clutch saves.
    outcome: isClosest
      ? `${run.timed ? "SPARE" : "OVER"} BY ${formatDuration(Math.abs(margin(run)))}`
      : run.timed
        ? "TIMED"
        : "OVER",
    members: [...run.members].sort(
      (a, b) => (ROLE_ORDER[a.role] ?? 2) - (ROLE_ORDER[b.role] ?? 2) || a.name.localeCompare(b.name),
    ),
  };
}

/**
 * Distinct characters who ran a key inside {@link RECENCY_WINDOW_MS}.
 *
 * **Characters, not people.** Raider.IO exposes no account link — `persona_id`
 * looked like one and is not: across 165 ranked characters it yields 163
 * distinct values, and the only collision is the placeholder `0` sitting on
 * three of them. Alts are therefore undetectable, and a 165-character roster
 * for a two-night guild implies a lot of them. Adopted anyway as the activity
 * baseline (operator, 2026-08-26: *"that would be a good baseline for active
 * members. alt or not"*), so the label must say characters and never imply
 * humans.
 *
 * The count is *exact* within the window, which the run total is not: a
 * character who ran eleven keys in 48 hours loses the oldest to the ten-run
 * cap, but still appears via the newer ones. Counting runs would undercount;
 * counting characters does not.
 *
 * **It is nonetheless labelled "Active Members" in the hero**, which is the
 * operator's informed call rather than an oversight: they were shown that alts
 * are undetectable and chose the friendlier word anyway. CONTEXT.md's glossary
 * would say Character. Recorded here so the gap between the value and the label
 * is a decision on the record, not a bug someone re-finds.
 *
 * Only meaningful while `MIN_CHARACTER_SCORE` is 0. Raise that floor and this
 * silently becomes "active among the ones we bothered to poll".
 */
export function countActiveCharacters(runs: GuildRun[], now: number = Date.now()): number {
  const cutoff = now - RECENCY_WINDOW_MS;
  const seen = new Set<string>();
  for (const run of runs) {
    if (Date.parse(run.completedAt) < cutoff) continue;
    for (const member of run.members) seen.add(member.name);
  }
  return seen.size;
}

/**
 * Every dungeon's four tiles, interleaved.
 *
 * Tile *i* takes category `i % 4` and dungeon `(⌊i/4⌋ + i % 4) % D`, which
 * visits each (category, dungeon) pair exactly once and leaves no two
 * neighbours sharing either. Grouping by dungeon instead would park a
 * double-badged run's identical numbers on two adjacent tiles, which reads as a
 * rendering bug rather than as two true statements about one run.
 *
 * A category with no qualifying run contributes no tile. The marquee has no
 * fixed length, so a short strip is a fine answer and an empty one hides the
 * section.
 */
export function buildRotation(runs: GuildRun[], now: number = Date.now()): DungeonTile[] {
  const byDungeon = new Map<string, GuildRun[]>();
  const cutoff = now - RECENCY_WINDOW_MS;

  for (const run of runs) {
    // The clock is a parameter rather than a call inside the loop, so the
    // selection stays pure and a test can pin "two days ago" instead of racing
    // the wall clock. Safe to read at render: tiles are built on the server and
    // handed to the client as data, so there is nothing here to re-derive and
    // disagree about during hydration.
    if (Date.parse(run.completedAt) < cutoff) continue;
    // The floor lives with the categories it exists to protect, not at the
    // fetch — it is a selection rule, and it is the one number most likely to
    // be argued about later.
    if (run.mythicLevel < MIN_KEY_LEVEL) continue;
    const bucket = byDungeon.get(run.dungeon);
    if (bucket) bucket.push(run);
    else byDungeon.set(run.dungeon, [run]);
  }

  // Hardest first, so the strip opens on the guild's best. Name breaks ties to
  // keep the order stable across renders.
  const dungeons = [...byDungeon.entries()]
    .map(([name, list]) => ({ name, best: Math.max(...list.map((r) => r.mythicLevel)) }))
    .sort((a, b) => b.best - a.best || a.name.localeCompare(b.name))
    .map((d) => d.name);

  if (dungeons.length === 0) return [];

  const tiles: DungeonTile[] = [];
  for (let i = 0; i < CATEGORIES.length * dungeons.length; i++) {
    const category = CATEGORIES[i % CATEGORIES.length];
    const dungeon = dungeons[(Math.floor(i / CATEGORIES.length) + (i % CATEGORIES.length)) % dungeons.length];
    const run = SELECT[category](byDungeon.get(dungeon)!);
    if (run) tiles.push(toTile(category, run));
  }
  return tiles;
}
