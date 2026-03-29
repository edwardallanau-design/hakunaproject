import { getPayload } from "payload";
import config from "@/payload.config";
import { fetchGuildProgression } from "@/lib/raiderio";

export async function POST(request: Request) {
  const payload = await getPayload({ config: await config });

  // Auth: Payload admin session (CMS button)
  try {
    const { user } = await payload.auth({ headers: request.headers });
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const progression = await fetchGuildProgression();

    await payload.updateGlobal({
      slug: "progression",
      data: {
        tier: progression.tier,
        difficulty: progression.difficulty as "Normal" | "Heroic" | "Mythic",
        summary: progression.summary,
        kills: progression.kills,
        totalBosses: progression.totalBosses,
        profileUrl: progression.profileUrl,
        rankings: progression.rankings ?? { world: 0, region: 0, realm: 0 },
        bosses: progression.bosses.map((b) => ({
          name: b.name,
          killed: b.killed,
          pulls: b.pulls ?? null,
          bestPull: b.bestPull ?? null,
        })),
        lastSyncedAt: new Date().toISOString(),
      },
    });

    return Response.json({
      message: "Progression synced successfully",
      summary: progression.summary,
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Progression sync failed:", err);
    return Response.json(
      { error: "Sync failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
