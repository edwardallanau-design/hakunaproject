import { getPayload } from "payload";
import config from "@/payload.config";
import type { RosterMember, MythicPlusRunner } from "@/lib/raiderio";

export async function POST(request: Request) {
  const payload = await getPayload({ config: await config });

  try {
    const { user } = await payload.auth({ headers: request.headers });
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const guildDetails = await payload.findGlobal({ slug: "guild-details" });
    const details = guildDetails.details as { members?: RosterMember[] } | null;
    const members: RosterMember[] = details?.members ?? [];

    if (members.length === 0) {
      return Response.json(
        { error: "No roster data found — sync Guild Details first" },
        { status: 400 },
      );
    }

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

    const syncedAt = new Date().toISOString();

    await payload.updateGlobal({
      slug: "progression",
      data: {
        mythicPlusRunners: topRunners,
        mythicPlusSyncedAt: syncedAt,
      },
    });

    return Response.json({
      message: `Saved top ${topRunners.length} M+ runners from guild details`,
      count: topRunners.length,
      syncedAt,
    });
  } catch (err) {
    console.error("Mythic+ runners sync failed:", err);
    return Response.json(
      { error: "Sync failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
