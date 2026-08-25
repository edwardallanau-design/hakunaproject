import type { GuildDetailsData, RosterMember, MythicPlusRunner } from "@/lib/raiderio";

/**
 * The three raid difficulties, easiest first. Order is load-bearing:
 * `defaultDifficulty` walks it backwards to find the hardest one with a kill.
 */
export const DIFFICULTIES = ["normal", "heroic", "mythic"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/** Per-difficulty progress for one boss. */
type BossProgress = {
  killed: boolean;
  firstDefeated?: string | null;
  pulls?: number | null;
  bestPull?: number | null;
};

/**
 * A boss's stored shape is deliberately asymmetric: the flat fields are
 * canonical **mythic**, and normal/heroic hang off their own groups.
 *
 * Symmetry would have been prettier — `{normal, heroic, mythic}` and nothing
 * flat. It was rejected because restructuring means a backfill migration over
 * Season 1's rows, and Season 1 is a frozen archive that must stay
 * byte-identical (ADR 0005, reaffirmed by operator decision 2026-08-25). Adding
 * two groups touches no existing column, so the archive is untouched by
 * construction rather than by careful migration.
 */
type Boss = BossProgress & {
  name: string;
  // Optional but never explicitly null: Payload's generated type for a group
  // field admits `undefined` only, and an absent group is how "no data at this
  // difficulty" is represented.
  normal?: BossProgress;
  heroic?: BossProgress;
};

type Rankings = { world: number; region: number; realm: number; members: number };

/** Kill counts keyed by difficulty. */
export type KillsByDifficulty = Record<Difficulty, number>;

/**
 * Which difficulty the site should show by default: the hardest one the guild
 * has **actually killed something on**.
 *
 * Attempts deliberately do not count. A single exploratory mythic pull would
 * otherwise flip the page to "0/9 Mythic" and hide real heroic progress —
 * precisely the under-reporting the difficulty toggle exists to fix.
 *
 * With nothing killed anywhere the answer is `normal`, which reads as "this
 * Season has not started" rather than "we are 0/9 on Mythic".
 */
export function defaultDifficulty(kills: KillsByDifficulty): Difficulty {
  for (let i = DIFFICULTIES.length - 1; i >= 0; i--) {
    const d = DIFFICULTIES[i];
    if ((kills[d] ?? 0) > 0) return d;
  }
  return "normal";
}

export type MythicPlusParticipant = {
  name: string;
  class: string;
  spec: string;
  score: number;
};

export type ProgressionState = {
  bosses: Boss[];
  kills: number;
  totalBosses: number;
  rankings: Rankings | null;
  /** Ranks for the non-mythic difficulties. Mythic lives in `rankings`. */
  rankingsByDifficulty?: Partial<Record<Difficulty, Rankings>> | null;
  mythicPlusRunners: MythicPlusRunner[];
  mythicPlusParticipants: MythicPlusParticipant[];
  // A Season's own upstream identity, per ADR 0006. Not a code constant, because
  // an archived Season and the current Season must be able to name different
  // values at the same time.
  raidSlugs: string[];
  rankSourceRaidSlug: string;
  /**
   * True when the Season being derived is an archive rather than the live one.
   *
   * An archived Season is a frozen snapshot (ADR 0005): its bosses, ranks and
   * M+ roster are the record of a season that has ended, and upstream can no
   * longer describe it. Raider.IO reports only the *current* M+ season's
   * scores, and it rewrites raid history — four of Season 1's rows changed
   * after the fact, one losing its pull count entirely — so deriving an
   * archived Season from a live response degrades it.
   *
   * The Sync writes only to the current Season, so this is normally false. It
   * exists because "unreachable" is a property of the caller, and one field
   * edit in the admin panel — re-pointing `currentSeason`, the documented
   * rollback path — makes an archive reachable again.
   */
  isArchived?: boolean;
};

export type DerivedProgression = {
  kills: number;
  totalBosses: number;
  bosses: Boss[];
  rankings: Rankings;
  killsByDifficulty: KillsByDifficulty;
  rankingsByDifficulty: Record<Difficulty, Rankings>;
  mythicPlusRunners: MythicPlusRunner[];
  mythicPlusParticipants: MythicPlusParticipant[];
};

export function deriveProgression(details: GuildDetailsData, current: ProgressionState): DerivedProgression {
  // ── Bosses ─────────────────────────────────────────────────────────────────
  const existingBosses = current.bosses ?? [];
  const seasonRaidSlugs = new Set(current.raidSlugs ?? []);

  // A Season with bosses typed in but no Raids claimed can never resolve a
  // single kill — every raidProgress entry gets skipped by the scoping below,
  // silently freezing bosses/kills forever with no signal. That is the exact
  // silent-decay shape ADR 0001/0006 exist to prevent, so it fails loudly
  // instead. An empty boss list with empty raidSlugs is NOT this case — it is
  // the normal mid-rollover state ticket 05 protects, so it must not throw.
  if (existingBosses.length > 0 && seasonRaidSlugs.size === 0) {
    throw new Error(
      "Season has bosses but no raidSlugs — kills can never be resolved. Set the Season's contributing Raid slugs.",
    );
  }

  let bosses = existingBosses;
  let kills = current.kills ?? 0;
  let totalBosses = current.totalBosses ?? existingBosses.length;

  const killsByDifficulty: KillsByDifficulty = { normal: 0, heroic: 0, mythic: 0 };

  if (existingBosses.length > 0 && details.raidProgress?.length) {
    // Kill and pull data is collected only across the Season's own Raids
    // (current.raidSlugs), not every Raid the API returns — an encounter from a
    // Raid outside this Season must not enter this Season's boss list.
    //
    // Every difficulty is collected. The payload has always carried all three
    // (the Zod boundary validates `encountersDefeated` and `encounters` as
    // records), and derivation used to discard everything but mythic.
    const defeated: Record<Difficulty, Map<string, string>> = {
      normal: new Map(),
      heroic: new Map(),
      mythic: new Map(),
    };
    const pullData: Record<Difficulty, Map<string, { pullCount: number; bestPercent: number }>> = {
      normal: new Map(),
      heroic: new Map(),
      mythic: new Map(),
    };
    const nameToSlug = new Map<string, string>();

    for (const raidProgress of details.raidProgress) {
      if (!seasonRaidSlugs.has(raidProgress.raid)) continue;

      const raidAttempt = details.raidAttempt?.find((a) => a.raid === raidProgress.raid);

      for (const difficulty of DIFFICULTIES) {
        for (const encounter of raidProgress.encountersDefeated[difficulty] ?? []) {
          defeated[difficulty].set(encounter.slug, encounter.firstDefeated);
        }
        for (const enc of raidAttempt?.encounters[difficulty] ?? []) {
          pullData[difficulty].set(enc.slug, {
            pullCount: enc.pullCount,
            bestPercent: enc.bestPercent,
          });
        }
      }

      for (const encounters of Object.values(raidAttempt?.encounters ?? {})) {
        for (const enc of encounters) {
          nameToSlug.set(enc.name.toLowerCase(), enc.slug);
        }
      }
    }

    // The kill lock is per difficulty per boss: a heroic kill freezes heroic
    // while mythic keeps progressing. Upstream rewrites its own history — four
    // of Season 1's rows changed after the fact, one losing its pull count
    // entirely — so a recorded kill is never re-derived.
    // Whether a stored group actually says anything. Presence is not enough:
    // the migration adds `killed` as `DEFAULT false`, so Payload hydrates a
    // full `{killed: false, firstDefeated: null, pulls: null, bestPull: null}`
    // group for every boss that has never been touched at that difficulty —
    // including all of Season 1's. Testing `if (stored)` therefore matches
    // everything and protects nothing, which is exactly the bug this replaced.
    const hasContent = (p: BossProgress | null | undefined): boolean =>
      Boolean(p && (p.killed || p.firstDefeated != null || p.pulls != null || p.bestPull != null));

    const deriveOne = (
      difficulty: Difficulty,
      slug: string,
      stored: BossProgress | null | undefined,
    ): BossProgress => {
      if (stored?.killed) return stored;
      const killed = defeated[difficulty].has(slug);
      const pull = pullData[difficulty].get(slug);
      return {
        killed,
        firstDefeated: defeated[difficulty].get(slug) ?? null,
        pulls: pull && pull.pullCount > 0 ? pull.pullCount : null,
        bestPull: pull && pull.pullCount > 0 && !killed ? pull.bestPercent : null,
      };
    };

    bosses = existingBosses.map((boss) => {
      const slug =
        nameToSlug.get(boss.name.toLowerCase()) ??
        boss.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      // Flat fields are canonical mythic, so the existing lock applies to them.
      const mythic = deriveOne("mythic", slug, boss);
      const next: Boss = { name: boss.name, ...mythic };

      // An archived Season is returned exactly as stored — every boss, every
      // group, byte for byte.
      //
      // This has to be an explicit caller-supplied flag rather than something
      // inferred from the row. Two earlier attempts inferred it and both were
      // wrong: "the raids report nothing new" is false (upstream still reports
      // 8 normal and 9 heroic kills for tier-mn-1), and "the boss has no
      // difficulty groups" is false too (the migration's DEFAULT false makes
      // Payload hydrate an empty group on every row). The shape of an archived
      // row is genuinely indistinguishable from a live Season's boss that has
      // been killed on mythic first — so only the caller knows.
      if (current.isArchived) {
        if (boss.normal) next.normal = boss.normal;
        if (boss.heroic) next.heroic = boss.heroic;
        return next;
      }

      // A difficulty group is attached when there is something to say about
      // it: meaningful data stored already, or data in this response.
      for (const difficulty of ["normal", "heroic"] as const) {
        const stored = boss[difficulty];
        const hasUpstream =
          defeated[difficulty].has(slug) || pullData[difficulty].has(slug);
        if (hasContent(stored) || hasUpstream) {
          next[difficulty] = deriveOne(difficulty, slug, stored);
        } else if (stored) {
          next[difficulty] = stored;
        }
      }

      return next;
    });

    killsByDifficulty.mythic = bosses.filter((b) => b.killed).length;
    killsByDifficulty.heroic = bosses.filter((b) => b.heroic?.killed).length;
    killsByDifficulty.normal = bosses.filter((b) => b.normal?.killed).length;

    kills = killsByDifficulty.mythic;
    totalBosses = bosses.length;
  }

  // ── Rankings ───────────────────────────────────────────────────────────────
  // Absence of the Season's Rank Source raid is a Derivation failure, NOT the
  // same as no data at all — an empty raidRankings is the guild-rename case and
  // still preserves below. Per ADR 0006 the slug is read from the Season row
  // rather than a code constant, but the throw itself is unchanged.
  const rankSourceRaidSlug = current.rankSourceRaidSlug;
  if (details.raidRankings.length > 0 && !details.raidRankings.some((r) => r.raid === rankSourceRaidSlug)) {
    const available = details.raidRankings.map((r) => r.raid).join(", ");
    throw new Error(`Rank source raid "${rankSourceRaidSlug}" not found in response. Available: ${available}`);
  }

  const raidRanking = details.raidRankings?.find((r) => r.raid === rankSourceRaidSlug);
  const mythicRanks = raidRanking?.ranks["mythic"] ?? null;

  const existingRankings = current.rankings;

  // ── M+ Runners & Participants ─────────────────────────────────────────────
  const members: RosterMember[] = details.members ?? [];
  const activeCount = members.filter(
    (m) =>
      m.keystoneScores?.allScore > 0 ||
      m.raidProgress?.progress?.normal > 0 ||
      m.raidProgress?.progress?.heroic > 0 ||
      m.raidProgress?.progress?.mythic > 0,
  ).length;
  const scoredMembers = members
    .filter((m) => m.keystoneScores?.allScore > 0)
    .sort((a, b) => b.keystoneScores.allScore - a.keystoneScores.allScore)
    .map((m) => ({
      name: m.character.name,
      class: m.character.class.name,
      spec: m.character.spec.name,
      score: m.keystoneScores.allScore,
    }));
  const freshRunners: MythicPlusRunner[] = scoredMembers.slice(0, 10);

  // An archived Season's ranks belong to its frozen snapshot exactly as its
  // bosses do (ADR 0005). Upstream still answers about a finished raid, but
  // that answer is a live opinion about history, not the record of it.
  //
  // `members` is the more dangerous half, and the reason this cannot be left to
  // the preserve-on-no-data rule below: it is never read from the response at
  // all. It is recounted from today's roster on every Sync, so an archive's
  // figure would silently follow the guild's present size — Season 1's 595
  // becoming the current season's ~160 with nothing upstream having changed.
  //
  // Preserve existing rankings/runners if the new profile has no data yet (e.g. after a guild rename)
  const rankings = current.isArchived
    ? existingRankings ?? { world: 0, region: 0, realm: 0, members: 0 }
    : mythicRanks
      ? { ...mythicRanks, members: activeCount }
      : existingRankings
        ? { ...existingRankings, members: activeCount }
        : { world: 0, region: 0, realm: 0, members: activeCount };

  // The same preserve-on-no-data rule, applied per difficulty. A rank source
  // that reports nothing for a difficulty must never wipe what is stored for
  // it — the guild-rename case, one level down. An archive keeps what it has,
  // for the reason above.
  const rankingsByDifficulty = Object.fromEntries(
    DIFFICULTIES.map((difficulty) => {
      const stored = current.rankingsByDifficulty?.[difficulty] ?? null;
      if (current.isArchived) {
        return [difficulty, stored ?? { world: 0, region: 0, realm: 0, members: rankings.members }];
      }
      const fresh = raidRanking?.ranks[difficulty] ?? null;
      const chosen = fresh ?? stored ?? { world: 0, region: 0, realm: 0 };
      return [difficulty, { ...chosen, members: activeCount }];
    }),
  ) as Record<Difficulty, Rankings>;

  const mythicPlusRunners = current.isArchived
    ? current.mythicPlusRunners ?? []
    : freshRunners.length > 0
      ? freshRunners
      : current.mythicPlusRunners ?? [];

  // Every Character with a score, not just the displayed top ten — this is what
  // an archived Season's Snapshot preserves. Costs no extra upstream request:
  // it is derived from the same roster fetch the top ten comes from. Preserved
  // on the same no-data condition as mythicPlusRunners (e.g. a guild rename)
  // rather than wiped — a Sync must never be the thing that destroys the
  // roster history ADR 0005 exists to protect.
  // ...and never at all for an archived Season, whose roster is the record of
  // a finished season. The live roster carries only the CURRENT M+ season's
  // scores, so deriving an archive from it does not refresh the snapshot, it
  // replaces it with different data wearing the same label: Season 1's 595
  // participants would become the current season's ~160, and its champion
  // would change from Heyems to whoever leads today.
  const mythicPlusParticipants: MythicPlusParticipant[] = current.isArchived
    ? current.mythicPlusParticipants ?? []
    : scoredMembers.length > 0
      ? scoredMembers
      : current.mythicPlusParticipants ?? [];

  return {
    kills,
    totalBosses,
    bosses,
    rankings,
    killsByDifficulty,
    rankingsByDifficulty,
    mythicPlusRunners,
    mythicPlusParticipants,
  };
}
