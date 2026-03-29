import { getPayload } from "payload";
import config from "@/payload.config";
import { fetchGuildProgression, fetchGuildMembers } from "@/lib/raiderio";

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

    const [progression, members] = await Promise.all([
      fetchGuildProgression(),
      fetchGuildMembers(),
    ]);

    await payload.updateGlobal({
      slug: "progression",
      data: {
        tier:        progression.tier,
        difficulty:  progression.difficulty as "Normal" | "Heroic" | "Mythic",
        summary:     progression.summary,
        kills:       progression.kills,
        totalBosses: progression.totalBosses,
        profileUrl:  progression.profileUrl,
        rankings:    progression.rankings ?? { world: 0, region: 0, realm: 0 },
        bosses:      progression.bosses.map((b) => ({
          name:     b.name,
          killed:   b.killed,
          pulls:    b.pulls ?? null,
          bestPull: b.bestPull ?? null,
        })),
        lastSyncedAt: syncedAt,
        guildMembers: members,
      },
    });

    return Response.json({
      message:      "Synced successfully",
      summary:      progression.summary,
      syncedAt,
      membersCount: members.length,
    });
  } catch (err) {
    console.error("Sync failed:", err);
    return Response.json(
      { error: "Sync failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
