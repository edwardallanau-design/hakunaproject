import { getPayload } from "payload";
import config from "@/payload.config";
import { fetchAndTransformGuildDetails } from "@/lib/raiderio";

export async function GET(request: Request) {
  const payload = await getPayload({ config: await config });

  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const isCronRequest = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isCronRequest) {
    try {
      const { user } = await payload.auth({ headers: request.headers });
      if (!user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
    } catch {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const details = await fetchAndTransformGuildDetails();
    const syncedAt = new Date().toISOString();

    await payload.updateGlobal({
      slug: 'guild-details',
      data: {
        details,
        lastSyncedAt: syncedAt,
      },
    });

    return Response.json({
      message: `Synced guild details for ${details.guild.name} (${details.members.length} members)`,
      syncedAt,
    });
  } catch (err) {
    console.error("Guild details sync failed:", err);
    return Response.json(
      { error: "Sync failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
