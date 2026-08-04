import type { GuildDetailsData, RosterMember, MythicPlusRunner } from "@/lib/raiderio";

// Guild rankings are reported per-raid and can't be merged, so one raid has to be
// the source for the world/region/realm numbers shown in the StatsBar. Kills are
// aggregated across every raid, but the rank comes from the main tier only —
// a one-boss side raid (e.g. sporefall) has its own rank that isn't guild-wide.
// Update this each season. If the slug is absent from the API response, rankings
// are left at their last known values rather than silently switching raids.
export const PRIMARY_RAID_SLUG = "tier-mn-1";

type Boss = {
  name: string;
  killed: boolean;
  firstDefeated?: string | null;
  pulls?: number | null;
  bestPull?: number | null;
};

type Rankings = { world: number; region: number; realm: number; members: number };

export type ProgressionState = {
  bosses: Boss[];
  kills: number;
  totalBosses: number;
  rankings: Rankings | null;
  mythicPlusRunners: MythicPlusRunner[];
};

export type DerivedProgression = {
  kills: number;
  totalBosses: number;
  bosses: Boss[];
  rankings: Rankings;
  mythicPlusRunners: MythicPlusRunner[];
};

export function deriveProgression(details: GuildDetailsData, current: ProgressionState): DerivedProgression {
  // ── Bosses ─────────────────────────────────────────────────────────────────
  const existingBosses = current.bosses ?? [];

  let bosses = existingBosses;
  let kills = current.kills ?? 0;
  let totalBosses = current.totalBosses ?? existingBosses.length;

  if (existingBosses.length > 0 && details.raidProgress?.length) {
    // The boss list in the CMS spans every raid in the current season, so kill and
    // pull data is collected across all raids the API returns — not just the first.
    const mythicDefeated = new Map<string, string>();
    const mythicPullData = new Map<string, { pullCount: number; bestPercent: number }>();
    const nameToSlug = new Map<string, string>();

    for (const raidProgress of details.raidProgress) {
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
  // Absence of the pinned raid is a Derivation failure, NOT the same as no data at
  // all — an empty raidRankings is the guild-rename case and still preserves below.
  if (details.raidRankings.length > 0 && !details.raidRankings.some((r) => r.raid === PRIMARY_RAID_SLUG)) {
    const available = details.raidRankings.map((r) => r.raid).join(", ");
    throw new Error(`Rank source raid "${PRIMARY_RAID_SLUG}" not found in response. Available: ${available}`);
  }

  const raidRanking = details.raidRankings?.find((r) => r.raid === PRIMARY_RAID_SLUG);
  const mythicRanks = raidRanking?.ranks["mythic"] ?? null;

  const existingRankings = current.rankings;

  // ── M+ Runners ─────────────────────────────────────────────────────────────
  const members: RosterMember[] = details.members ?? [];
  const activeCount = members.filter(
    (m) =>
      m.keystoneScores?.allScore > 0 ||
      m.raidProgress?.progress?.normal > 0 ||
      m.raidProgress?.progress?.heroic > 0 ||
      m.raidProgress?.progress?.mythic > 0,
  ).length;
  const freshRunners: MythicPlusRunner[] = members
    .filter((m) => m.keystoneScores?.allScore > 0)
    .sort((a, b) => b.keystoneScores.allScore - a.keystoneScores.allScore)
    .slice(0, 10)
    .map((m) => ({
      name: m.character.name,
      class: m.character.class.name,
      spec: m.character.spec.name,
      score: m.keystoneScores.allScore,
    }));

  // Preserve existing rankings/runners if the new profile has no data yet (e.g. after a guild rename)
  const rankings = mythicRanks
    ? { ...mythicRanks, members: activeCount }
    : existingRankings
      ? { ...existingRankings, members: activeCount }
      : { world: 0, region: 0, realm: 0, members: activeCount };

  const mythicPlusRunners = freshRunners.length > 0 ? freshRunners : current.mythicPlusRunners ?? [];

  return { kills, totalBosses, bosses, rankings, mythicPlusRunners };
}
