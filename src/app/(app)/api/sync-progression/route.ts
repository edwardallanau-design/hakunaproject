import { getPayload } from "payload";
import config from "@/payload.config";
import { fetchGuildProgression, fetchTopMythicPlusRunners } from "@/lib/raiderio";
import type { MythicPlusRunner } from "@/lib/raiderio";

export async function POST(request: Request) {
  const payload = await getPayload({ config: await config });

  try {
    const { user } = await payload.auth({ headers: request.headers });
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const syncedAt = new Date().toISOString();

    // Fetch raid progression and M+ runners in parallel.
    // Use allSettled so a M+ failure doesn't block saving raid data.
    const [progressionResult, runnersResult] = await Promise.allSettled([
      fetchGuildProgression(),
      fetchTopMythicPlusRunners(),
    ]);

    if (progressionResult.status === "rejected") {
      console.error("Progression sync failed:", progressionResult.reason);
      return Response.json(
        { error: "Sync failed", details: String(progressionResult.reason) },
        { status: 500 },
      );
    }

    const progression = progressionResult.value;
    const runners: MythicPlusRunner[] =
      runnersResult.status === "fulfilled" ? runnersResult.value : [];
    const runnersWarning =
      runnersResult.status === "rejected"
        ? String(runnersResult.reason)
        : undefined;

    if (runnersWarning) {
      console.error("M+ runners sync failed (raid data still saved):", runnersWarning);
    }

    await payload.updateGlobal({
      slug: "progression",
      data: {
        tier:         progression.tier,
        difficulty:   progression.difficulty as "Normal" | "Heroic" | "Mythic",
        summary:      progression.summary,
        kills:        progression.kills,
        totalBosses:  progression.totalBosses,
        profileUrl:   progression.profileUrl,
        rankings:     progression.rankings ?? { world: 0, region: 0, realm: 0 },
        bosses:       progression.bosses.map((b) => ({
          name:     b.name,
          killed:   b.killed,
          pulls:    b.pulls ?? null,
          bestPull: b.bestPull ?? null,
        })),
        lastSyncedAt:      syncedAt,
        mythicPlusRunners: runners.map((r) => ({
          name:  r.name,
          class: r.class,
          spec:  r.spec,
          score: r.score,
        })),
        mythicPlusSyncedAt: runnersResult.status === "fulfilled" ? syncedAt : undefined,
      },
    });

    return Response.json({
      message:      "Progression synced successfully",
      summary:      progression.summary,
      runnersCount: runners.length,
      syncedAt,
      ...(runnersWarning ? { warning: `M+ sync failed: ${runnersWarning}` } : {}),
    });
  } catch (err) {
    console.error("Sync failed:", err);
    return Response.json(
      { error: "Sync failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
