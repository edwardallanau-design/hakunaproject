import { getPayload } from "payload";
import config from "@/payload.config";
import type { GuildDetailsData, RosterMember, MythicPlusRunner } from "@/lib/raiderio";

export async function POST(request: Request) {
  const payload = await getPayload({ config: await config });

  try {
    const { user } = await payload.auth({ headers: request.headers });
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [guildDetailsGlobal, progression] = await Promise.all([
      payload.findGlobal({ slug: "guild-details" }),
      payload.findGlobal({ slug: "progression" }),
    ]);

    const details = guildDetailsGlobal.details as GuildDetailsData | null;

    if (!details) {
      return Response.json(
        { error: "No guild details data found — sync Guild Details first" },
        { status: 400 },
      );
    }

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

      // Mythic killed slugs + first defeated dates
      const mythicDefeated = new Map(
        (raidProgress.encountersDefeated["mythic"] ?? []).map((e) => [e.slug, e.firstDefeated]),
      );

      // Mythic pull data keyed by slug
      const mythicPullData = new Map(
        (raidAttempt?.encounters["mythic"] ?? []).map((enc) => [
          enc.slug,
          { pullCount: enc.pullCount, bestPercent: enc.bestPercent },
        ]),
      );

      // Build slug lookup from all difficulties
      const nameToSlug = new Map<string, string>();
      for (const encounters of Object.values(raidAttempt?.encounters ?? {})) {
        for (const enc of encounters) {
          nameToSlug.set(enc.name.toLowerCase(), enc.slug);
        }
      }

      bosses = existingBosses.map((boss) => {
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
    const memberCount = details.members?.length ?? 0;

    // ── M+ Runners ─────────────────────────────────────────────────────────────
    const members: RosterMember[] = details.members ?? [];
    const topRunners: MythicPlusRunner[] = members
      .filter((m) => m.keystoneScores?.allScore > 0)
      .sort((a, b) => b.keystoneScores.allScore - a.keystoneScores.allScore)
      .slice(0, 10)
      .map((m) => ({
        name: m.character.name,
        class: m.character.class.name,
        spec: m.character.spec.name,
        score: m.keystoneScores.allScore,
      }));

    // ── Update ─────────────────────────────────────────────────────────────────
    const syncedAt = new Date().toISOString();

    await payload.updateGlobal({
      slug: "progression",
      data: {
        kills,
        totalBosses,
        bosses,
        rankings: mythicRanks
          ? { ...mythicRanks, members: memberCount }
          : { world: 0, region: 0, realm: 0, members: memberCount },
        mythicPlusRunners: topRunners,
        mythicPlusSyncedAt: syncedAt,
        lastSyncedAt: syncedAt,
      },
    });

    return Response.json({
      message: `Synced: ${kills}/${totalBosses} bosses · ${topRunners.length} M+ runners · ${memberCount} members`,
      runnersCount: topRunners.length,
      syncedAt,
    });
  } catch (err) {
    console.error("Progression sync failed:", err);
    return Response.json(
      { error: "Sync failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
