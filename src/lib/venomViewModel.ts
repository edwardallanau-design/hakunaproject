import type { Season } from "@/payload-types";
import { DIFFICULTIES, defaultDifficulty, type Difficulty } from "@/lib/syncProgression";
import type { KillsByDifficulty } from "@/lib/syncProgression";

/**
 * The view model for the editorial (Season 2) layout.
 *
 * Its job is to pay the cost of the asymmetric storage exactly once. A boss row
 * keeps mythic in its flat fields and normal/heroic in groups — good for the
 * archive, awkward for rendering — so everything below normalises to a single
 * `BossAtDifficulty` shape and the components never learn about the split.
 */

/** How a boss row should render, decided here rather than in JSX. */
export type BossState = "dead" | "prog" | "sealed";

export type BossAtDifficulty = {
  name: string;
  state: BossState;
  firstDefeated: string | null;
  pulls: number | null;
  /** Only meaningful when state is "prog" and upstream reported a real percent. */
  bestPull: number | null;
};

export type VenomProgression = {
  /** Every boss, at the difficulty being displayed. */
  bosses: BossAtDifficulty[];
  kills: number;
  totalBosses: number;
  /** Percentage cleared, for the timeline spine. */
  pct: number;
  /** Ranks for the displayed difficulty — not always mythic's. */
  rankings: { world: number; region: number; realm: number };
};

type StoredProgress = {
  killed?: boolean | null;
  firstDefeated?: string | null;
  pulls?: number | null;
  bestPull?: number | null;
};

/** One row of the Season's `bosses` array. Nullable on the generated type. */
type StoredBoss = NonNullable<Season["bosses"]>[number];

/**
 * Reads one boss at one difficulty out of the stored shape. Mythic lives in the
 * flat fields; normal and heroic live in groups of the same name.
 */
function progressAt(boss: StoredBoss, difficulty: Difficulty): StoredProgress {
  if (difficulty === "mythic") return boss;
  return boss[difficulty] ?? {};
}

/**
 * Which of the three render states a boss is in.
 *
 * `bestPull` is deliberately not trusted just because it exists: every live
 * `bestPercent` from upstream is currently `0.0000%`, and a chip reading
 * "BEST 0.0%" looks like a bug rather than data. A boss with pulls but no
 * meaningful percentage is still PROG — the pull count is shown instead.
 */
function stateOf(p: StoredProgress): BossState {
  if (p.killed) return "dead";
  if ((p.pulls ?? 0) > 0) return "prog";
  return "sealed";
}

/** Kill counts across all three difficulties, from the stored bosses. */
export function killsByDifficulty(season: Season): KillsByDifficulty {
  const bosses = season.bosses ?? [];
  return Object.fromEntries(
    DIFFICULTIES.map((d) => [d, bosses.filter((b) => progressAt(b, d).killed).length]),
  ) as KillsByDifficulty;
}

/**
 * The difficulty the page should open on: the hardest with an actual kill.
 * Server-computed so the client toggle initialises without a hydration
 * mismatch.
 */
export function initialDifficulty(season: Season): Difficulty {
  return defaultDifficulty(killsByDifficulty(season));
}

/** Which difficulties are worth offering in the toggle. */
export function availableDifficulties(season: Season): Difficulty[] {
  const kills = killsByDifficulty(season);
  const withKills = DIFFICULTIES.filter((d) => kills[d] > 0);
  // Always offer at least the default, so a Season that has just started still
  // renders a (single-item) toggle rather than an empty control.
  return withKills.length > 0 ? withKills : [defaultDifficulty(kills)];
}

/**
 * Ranks for a given difficulty. Mythic is the flat `rankings` group; the others
 * have their own. Returns zeros rather than null so callers need no fallback.
 */
export function rankingsAt(season: Season, difficulty: Difficulty) {
  const g =
    difficulty === "mythic"
      ? season.rankings
      : difficulty === "heroic"
        ? season.rankingsHeroic
        : season.rankingsNormal;
  return {
    world: g?.world ?? 0,
    region: g?.region ?? 0,
    realm: g?.realm ?? 0,
  };
}

/** The whole progression view for one difficulty. */
export function toVenomProgression(season: Season, difficulty: Difficulty): VenomProgression {
  const bosses = (season.bosses ?? []).map((b): BossAtDifficulty => {
    const p = progressAt(b, difficulty);
    const state = stateOf(p);
    return {
      name: b.name,
      state,
      firstDefeated: p.firstDefeated ?? null,
      pulls: p.pulls ?? null,
      // Only a percentage worth showing survives.
      bestPull: state === "prog" && (p.bestPull ?? 0) > 0 ? p.bestPull! : null,
    };
  });

  const kills = bosses.filter((b) => b.state === "dead").length;
  const totalBosses = bosses.length;

  return {
    bosses,
    kills,
    totalBosses,
    pct: totalBosses > 0 ? Math.round((kills / totalBosses) * 100) : 0,
    rankings: rankingsAt(season, difficulty),
  };
}

/** Label for a difficulty, as the design writes it. */
export function difficultyLabel(d: Difficulty): string {
  return d.toUpperCase();
}

/**
 * A Season's bosses split into the raids they belong to.
 *
 * Bosses are stored as one flat, hand-typed list per Season, in encounter order
 * across every contributing raid — Season 2 is the Abyss's eight followed by
 * the Grotto's one. Nothing in the row records where one raid ends, because
 * the Sync resolves kills by boss *name* and never needed to know.
 *
 * So the split lives here, keyed by the Season's urlSlug. That is honest about
 * what it is: a piece of per-Season editorial knowledge, not something derived.
 * A Season with no entry renders as a single raid, which is what every Season
 * before this one was.
 */
export type RaidGroup = {
  /** Section heading. */
  title: string;
  /** Eyebrow above it. */
  eyebrow: string;
  /** Index into the Season's boss list where this raid starts. */
  start: number;
  /** How many bosses belong to it. */
  count: number;
};

const RAID_GROUPS: Record<string, RaidGroup[]> = {
  "season-2": [
    // The real raid, per `guilds/details`: `the-venomous-abyss`. The design
    // prototype called it "Vaults of Atal'Utek", which was invented for the
    // mockup — design/NOTES.md is explicit that no prototype name may reach a
    // real Season row.
    { title: "The Venomous Abyss", eyebrow: "The Raid", start: 0, count: 8 },
    { title: "The Tidebound Grotto", eyebrow: "Lair Boss", start: 8, count: 1 },
  ],
};

/**
 * The raids to render for a Season. Falls back to one group covering every
 * boss, so a Season without an entry behaves exactly as before.
 */
export function raidGroups(season: Season): RaidGroup[] {
  const configured = RAID_GROUPS[season.urlSlug];
  const total = (season.bosses ?? []).length;
  if (!configured) {
    return [{ title: season.name, eyebrow: "The Raid", start: 0, count: total }];
  }
  // Guard against a boss list that has grown or shrunk since the split was
  // written: never slice past the end, and never silently drop a boss off it.
  //
  // Copied, not just filtered: `filter` returns a new array of the *same*
  // objects, so widening `count` below would write straight through to the
  // module-level RAID_GROUPS and persist for the life of the process.
  const groups = configured.filter((g) => g.start < total).map((g) => ({ ...g }));
  const covered = groups.reduce((n, g) => Math.max(n, g.start + g.count), 0);
  if (covered < total) {
    const last = groups[groups.length - 1];
    if (last) last.count = total - last.start;
  }
  return groups;
}

/** The progression view for one raid group at one difficulty. */
export function toRaidProgression(
  season: Season,
  group: RaidGroup,
  difficulty: Difficulty,
): VenomProgression {
  const all = toVenomProgression(season, difficulty);
  const bosses = all.bosses.slice(group.start, group.start + group.count);
  const kills = bosses.filter((b) => b.state === "dead").length;
  return {
    bosses,
    kills,
    totalBosses: bosses.length,
    pct: bosses.length > 0 ? Math.round((kills / bosses.length) * 100) : 0,
    rankings: all.rankings,
  };
}

/**
 * Kill counts for one raid group, so a raid's own toggle reflects its own
 * progression. The Grotto and the Abyss advance independently — the Grotto is
 * heroic-cleared while the Abyss is not — so a Season-wide default would
 * misrepresent whichever raid is behind.
 */
export function killsByDifficultyForGroup(season: Season, group: RaidGroup): KillsByDifficulty {
  const bosses = (season.bosses ?? []).slice(group.start, group.start + group.count);
  return Object.fromEntries(
    DIFFICULTIES.map((d) => [d, bosses.filter((b) => progressAt(b, d).killed).length]),
  ) as KillsByDifficulty;
}

/** The difficulty a raid group should open on, and which it can offer. */
export function groupDifficulties(
  season: Season,
  group: RaidGroup,
): { initial: Difficulty; available: Difficulty[] } {
  const kills = killsByDifficultyForGroup(season, group);
  const available = DIFFICULTIES.filter((d) => kills[d] > 0);
  const initial = defaultDifficulty(kills);
  return { initial, available: available.length > 0 ? available : [initial] };
}
