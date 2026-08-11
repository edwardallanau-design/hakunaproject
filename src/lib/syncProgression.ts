import type { GuildDetailsData, RosterMember, MythicPlusRunner } from "@/lib/raiderio";

type Boss = {
  name: string;
  killed: boolean;
  firstDefeated?: string | null;
  pulls?: number | null;
  bestPull?: number | null;
};

type Rankings = { world: number; region: number; realm: number; members: number };

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
  mythicPlusRunners: MythicPlusRunner[];
  mythicPlusParticipants: MythicPlusParticipant[];
  // A Season's own upstream identity, per ADR 0006. Not a code constant, because
  // an archived Season and the current Season must be able to name different
  // values at the same time.
  raidSlugs: string[];
  rankSourceRaidSlug: string;
};

export type DerivedProgression = {
  kills: number;
  totalBosses: number;
  bosses: Boss[];
  rankings: Rankings;
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

  if (existingBosses.length > 0 && details.raidProgress?.length) {
    // Kill and pull data is collected only across the Season's own Raids
    // (current.raidSlugs), not every Raid the API returns — an encounter from a
    // Raid outside this Season must not enter this Season's boss list.
    const mythicDefeated = new Map<string, string>();
    const mythicPullData = new Map<string, { pullCount: number; bestPercent: number }>();
    const nameToSlug = new Map<string, string>();

    for (const raidProgress of details.raidProgress) {
      if (!seasonRaidSlugs.has(raidProgress.raid)) continue;

      const raidAttempt = details.raidAttempt?.find((a) => a.raid === raidProgress.raid);

      for (const encounter of raidProgress.encountersDefeated["mythic"] ?? []) {
        mythicDefeated.set(encounter.slug, encounter.firstDefeated);
      }

      for (const enc of raidAttempt?.encounters["mythic"] ?? []) {
        mythicPullData.set(enc.slug, { pullCount: enc.pullCount, bestPercent: enc.bestPercent });
      }

      for (const encounters of Object.values(raidAttempt?.encounters ?? {})) {
        for (const enc of encounters) {
          nameToSlug.set(enc.name.toLowerCase(), enc.slug);
        }
      }
    }

    bosses = existingBosses.map((boss) => {
      // Kill data is final — once a boss is killed, its date and pull count are never overwritten
      if (boss.killed) return boss;

      const slug =
        nameToSlug.get(boss.name.toLowerCase()) ??
        boss.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const killed = mythicDefeated.has(slug);
      const pull = mythicPullData.get(slug);
      return {
        name: boss.name,
        killed,
        firstDefeated: mythicDefeated.get(slug) ?? null,
        pulls: pull && pull.pullCount > 0 ? pull.pullCount : null,
        bestPull: pull && pull.pullCount > 0 && !killed ? pull.bestPercent : null,
      };
    });

    kills = bosses.filter((b) => b.killed).length;
    totalBosses = bosses.length;
  }

  // ── Rankings (Mythic) ──────────────────────────────────────────────────────
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

  // Preserve existing rankings/runners if the new profile has no data yet (e.g. after a guild rename)
  const rankings = mythicRanks
    ? { ...mythicRanks, members: activeCount }
    : existingRankings
      ? { ...existingRankings, members: activeCount }
      : { world: 0, region: 0, realm: 0, members: activeCount };

  const mythicPlusRunners = freshRunners.length > 0 ? freshRunners : current.mythicPlusRunners ?? [];

  // Every Character with a score, not just the displayed top ten — this is what
  // an archived Season's Snapshot preserves. Costs no extra upstream request:
  // it is derived from the same roster fetch the top ten comes from. Preserved
  // on the same no-data condition as mythicPlusRunners (e.g. a guild rename)
  // rather than wiped — a Sync must never be the thing that destroys the
  // roster history ADR 0005 exists to protect.
  const mythicPlusParticipants: MythicPlusParticipant[] =
    scoredMembers.length > 0 ? scoredMembers : current.mythicPlusParticipants ?? [];

  return { kills, totalBosses, bosses, rankings, mythicPlusRunners, mythicPlusParticipants };
}
