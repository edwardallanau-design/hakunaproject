import { getPayload } from "payload";
import config from "@/payload.config";
import type { GuildDetailsData } from "@/lib/raiderio";

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

    if (!details || !details.raidProgress?.length) {
      return Response.json(
        { error: "No guild details data found — sync Guild Details first" },
        { status: 400 },
      );
    }

    const existingBosses = (progression.bosses ?? []) as {
      name: string;
      killed: boolean;
      pulls?: number | null;
      bestPull?: number | null;
    }[];

    if (existingBosses.length === 0) {
      return Response.json(
        { error: "No bosses in progression — add them manually or run the full Raider.IO sync first" },
        { status: 400 },
      );
    }

    // Use the first (current) raid
    const raidProgress = details.raidProgress[0];
    const raidAttempt = details.raidAttempt?.find((a) => a.raid === raidProgress.raid);
    const raidRanking = details.raidRankings?.find((r) => r.raid === raidProgress.raid);

    // Mythic killed slugs + first defeated dates
    const mythicDefeated = new Map(
      (raidProgress.encountersDefeated["mythic"] ?? []).map((e) => [
        e.slug,
        e.firstDefeated,
      ]),
    );

    // Mythic pull data keyed by slug
    const mythicPullData = new Map(
      (raidAttempt?.encounters["mythic"] ?? []).map((enc) => [
        enc.slug,
        { pullCount: enc.pullCount, bestPercent: enc.bestPercent },
      ]),
    );

    // Build slug lookup from all difficulties so we can match boss names → slugs
    const nameToSlug = new Map<string, string>();
    for (const encounters of Object.values(raidAttempt?.encounters ?? {})) {
      for (const enc of encounters) {
        nameToSlug.set(enc.name.toLowerCase(), enc.slug);
      }
    }
    // Also include slugs from encountersDefeated
    for (const defeated of Object.values(raidProgress.encountersDefeated ?? {})) {
      for (const enc of defeated) {
        // encountersDefeated only has slug, no name — derive name from slug for reverse lookup
        if (![...nameToSlug.values()].includes(enc.slug)) {
          nameToSlug.set(enc.slug, enc.slug);
        }
      }
    }

    // Update existing boss list — never add or remove, only update details
    const bosses = existingBosses.map((boss) => {
      const slug = nameToSlug.get(boss.name.toLowerCase()) ?? boss.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
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

    const kills = bosses.filter((b) => b.killed).length;
    const totalBosses = bosses.length;
    const summary = `${kills}/${totalBosses} M`;
    const rankings = raidRanking?.ranks["mythic"] ?? null;
    const syncedAt = new Date().toISOString();

    await payload.updateGlobal({
      slug: "progression",
      data: {
        difficulty: "Mythic",
        summary,
        kills,
        totalBosses,
        bosses,
        rankings: rankings
          ? { ...rankings, members: details.members?.length ?? 0 }
          : { world: 0, region: 0, realm: 0, members: details.members?.length ?? 0 },
        lastSyncedAt: syncedAt,
      },
    });

    return Response.json({
      message: `Synced mythic boss progression: ${summary}`,
      summary,
      syncedAt,
    });
  } catch (err) {
    console.error("Boss progression sync failed:", err);
    return Response.json(
      { error: "Sync failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
