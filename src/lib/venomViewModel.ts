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
