import { getPayload } from "payload";
import config from "@/payload.config";
import { fetchAndTransformGuildDetails } from "@/lib/raiderio";
import { deriveProgression, type ProgressionState } from "@/lib/syncProgression";
import { deriveOfficers, type Officer } from "@/lib/syncOfficers";
import type { MythicPlusRunner } from "@/lib/raiderio";

type SyncStage = "fetch" | "derivation" | "write";

class SyncStageError extends Error {
  stage: SyncStage;
  constructor(stage: SyncStage, message: string) {
    super(message);
    this.stage = stage;
  }
}

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
    const details = await fetchAndTransformGuildDetails().catch((err) => {
      throw new SyncStageError("fetch", err instanceof Error ? err.message : String(err));
    });

    let derivedProgression, derivedOfficers;
    try {
      const [progressionGlobal, officersGlobal] = await Promise.all([
        payload.findGlobal({ slug: "progression" }),
        payload.findGlobal({ slug: "officers-section" }),
      ]);

      const currentProgression: ProgressionState = {
        bosses: (progressionGlobal.bosses ?? []) as ProgressionState["bosses"],
        kills: (progressionGlobal.kills as number) ?? 0,
        totalBosses: (progressionGlobal.totalBosses as number) ?? 0,
        rankings: progressionGlobal.rankings as ProgressionState["rankings"],
        mythicPlusRunners: (progressionGlobal.mythicPlusRunners as MythicPlusRunner[] | null) ?? [],
      };
      derivedProgression = deriveProgression(details, currentProgression);

      const currentOfficers = (officersGlobal.officers ?? []) as Officer[];
      derivedOfficers = deriveOfficers(details, currentOfficers);
    } catch (err) {
      throw new SyncStageError("derivation", err instanceof Error ? err.message : String(err));
    }

    const syncedAt = new Date().toISOString();

    try {
      // Sequential, not Promise.all: if one write fails partway, the others must not
      // race ahead and land independently — see ADR 0001's accepted partial-write risk.
      await payload.updateGlobal({
        slug: "guild-details",
        data: { details, lastSyncedAt: syncedAt, lastSyncError: null },
      });
      await payload.updateGlobal({
        slug: "progression",
        data: {
          kills: derivedProgression.kills,
          totalBosses: derivedProgression.totalBosses,
          bosses: derivedProgression.bosses,
          rankings: derivedProgression.rankings,
          mythicPlusRunners: derivedProgression.mythicPlusRunners,
          lastSyncedAt: syncedAt,
        },
      });
      await payload.updateGlobal({
        slug: "officers-section",
        data: { officers: derivedOfficers, lastSyncedAt: syncedAt },
      });
    } catch (err) {
      throw new SyncStageError("write", err instanceof Error ? err.message : String(err));
    }

    return Response.json({
      message: `Synced guild details for ${details.guild.name} (${details.members.length} members)`,
      syncedAt,
    });
  } catch (err) {
    const stage: SyncStage = err instanceof SyncStageError ? err.stage : "write";
    const message = err instanceof Error ? err.message : String(err);

    console.error(`Guild details sync failed at stage "${stage}":`, message);

    await payload
      .updateGlobal({
        slug: "guild-details",
        data: { lastSyncError: `[${stage}] ${message}` },
      })
      .catch((writeErr) => {
        console.error("Failed to record lastSyncError:", writeErr);
      });

    return Response.json(
      { error: "Sync failed", stage, message },
      { status: 500 },
    );
  }
}
