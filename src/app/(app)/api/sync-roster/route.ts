import { getPayload } from "payload";
import config from "@/payload.config";
import { fetchAndTransformRoster } from "@/lib/raiderio";

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
    const members = await fetchAndTransformRoster();

    await payload.updateGlobal({
      slug: 'roster',
      data: {
        members,
        lastSyncedAt: syncedAt,
      },
    });

    return Response.json({
      message: "Roster synced successfully",
      membersCount: members.length,
      syncedAt,
    });
  } catch (err) {
    console.error("Roster sync failed:", err);
    return Response.json(
      { error: "Sync failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
