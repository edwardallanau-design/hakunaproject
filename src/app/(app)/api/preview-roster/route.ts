import { getPayload } from "payload";
import config from "@/payload.config";
import { fetchAndTransformRoster } from "@/lib/raiderio";

export async function GET(request: Request) {
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
    const members = await fetchAndTransformRoster();
    const syncedAt = new Date().toISOString();

    await payload.updateGlobal({
      slug: 'roster',
      data: {
        members,
        lastSyncedAt: syncedAt,
      },
    });

    return Response.json({
      count: members.length,
      message: `Saved ${members.length} members to database`,
      syncedAt,
    });
  } catch (err) {
    console.error("Roster preview failed:", err);
    return Response.json(
      { error: "Fetch failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
