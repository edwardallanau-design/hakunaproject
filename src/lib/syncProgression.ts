import type { Payload } from "payload";
import type { GuildDetailsData, RosterMember, MythicPlusRunner } from "@/lib/raiderio";

export async function syncProgressionFromDetails(payload: Payload): Promise<{
  kills: number;
  totalBosses: number;
  runnersCount: number;
  activeCount: number;
}> {
  const [guildDetailsGlobal, progression] = await Promise.all([
    payload.findGlobal({ slug: "guild-details" }),
    payload.findGlobal({ slug: "progression" }),
  ]);

  const details = guildDetailsGlobal.details as GuildDetailsData | null;
  if (!details) throw new Error("No guild details data found");

  // ── Bosses ─────────────────────────────────────────────────────────────────
  const existingBosses = (progression.bosses ?? []) as {
    name: string;
    killed: boolean;
    firstDefeated?: string | null;
    pulls?: number | null;
    bestPull?: number | null;
  }[];

  let bosses = existingBosses;
  let kills = (progression.kills as number) ?? 0;
  let totalBosses = (progression.totalBosses as number) ?? existingBosses.length;

  if (existingBosses.length > 0 && details.raidProgress?.length) {
    const raidProgress = details.raidProgress[0];
    const raidAttempt = details.raidAttempt?.find((a) => a.raid === raidProgress.raid);

    const mythicDefeated = new Map(
      (raidProgress.encountersDefeated["mythic"] ?? []).map((e) => [e.slug, e.firstDefeated]),
    );

    const mythicPullData = new Map(
      (raidAttempt?.encounters["mythic"] ?? []).map((enc) => [
        enc.slug,
        { pullCount: enc.pullCount, bestPercent: enc.bestPercent },
      ]),
    );

    const nameToSlug = new Map<string, string>();
    for (const encounters of Object.values(raidAttempt?.encounters ?? {})) {
      for (const enc of encounters) {
        nameToSlug.set(enc.name.toLowerCase(), enc.slug);
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
        pulls: pull && pull.pullCount > 0 && !killed ? pull.pullCount : null,
        bestPull: pull && pull.pullCount > 0 && !killed ? pull.bestPercent : null,
      };
    });

    kills = bosses.filter((b) => b.killed).length;
    totalBosses = bosses.length;
  }

  // ── Rankings (Mythic) ──────────────────────────────────────────────────────
  const raidRanking = details.raidRankings?.find(
    (r) => r.raid === details.raidProgress?.[0]?.raid,
  );
  const mythicRanks = raidRanking?.ranks["mythic"] ?? null;

  const existingRankings = progression.rankings as { world: number; region: number; realm: number; members: number } | null;

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

  const mythicPlusRunners = freshRunners.length > 0
    ? freshRunners
    : (progression.mythicPlusRunners as MythicPlusRunner[] | null) ?? [];

  // ── Update ─────────────────────────────────────────────────────────────────
  const syncedAt = new Date().toISOString();

  await payload.updateGlobal({
    slug: "progression",
    data: {
      kills,
      totalBosses,
      bosses,
      rankings,
      mythicPlusRunners,
      lastSyncedAt: syncedAt,
    },
  });

  return { kills, totalBosses, runnersCount: mythicPlusRunners.length, activeCount };
}
