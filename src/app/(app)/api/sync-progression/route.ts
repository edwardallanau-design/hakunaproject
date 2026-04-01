import { getPayload } from "payload";
import config from "@/payload.config";
import { syncProgressionFromDetails } from "@/lib/syncProgression";

export async function POST(request: Request) {
  const payload = await getPayload({ config: await config });

  try {
    const { user } = await payload.auth({ headers: request.headers });
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncProgressionFromDetails(payload);

    return Response.json({
      message: `Synced: ${result.kills}/${result.totalBosses} bosses · ${result.runnersCount} M+ runners · ${result.activeCount} active members`,
      ...result,
    });
  } catch (err) {
    console.error("Progression sync failed:", err);
    return Response.json(
      { error: "Sync failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
