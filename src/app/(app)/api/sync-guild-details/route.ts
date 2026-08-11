import { getPayload } from "payload";
import config from "@/payload.config";
import { fetchAndTransformGuildDetails } from "@/lib/raiderio";
import { deriveProgression, type ProgressionState } from "@/lib/syncProgression";
import { deriveOfficers, type Officer } from "@/lib/syncOfficers";
import type { MythicPlusRunner } from "@/lib/raiderio";
import type { Season } from "@/payload-types";

type SyncStage = "fetch" | "derivation" | "write" | "disabled";

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

  if (process.env.SYNC_DISABLED) {
    const stage: SyncStage = "disabled";
    const message = "Sync is disabled via SYNC_DISABLED — Season rollover is in progress. No data was read or written.";

    console.error(`Guild details sync refused at stage "${stage}":`, message);

    return Response.json({ error: "Sync disabled", stage, message }, { status: 503 });
  }

  try {
    const details = await fetchAndTransformGuildDetails().catch((err) => {
      throw new SyncStageError("fetch", err instanceof Error ? err.message : String(err));
    });

    let currentSeasonId: number;
    let derivedProgression, derivedOfficers;
    try {
      const [guildSettings, officersGlobal] = await Promise.all([
        payload.findGlobal({ slug: "guild-settings" }),
        payload.findGlobal({ slug: "officers-section" }),
      ]);

      // An empty pointer must be announced, never silently write nothing (ADR 0001).
      const currentSeason = guildSettings.currentSeason;
      if (!currentSeason || typeof currentSeason !== "object") {
        throw new Error("guild-settings.currentSeason is not set — no Season to sync to.");
      }
      const season = currentSeason as Season;
      currentSeasonId = season.id;

      // A current Season with no bosses yet is a normal mid-rollover state, not a
      // failure — rankings and M+ still derive below, bosses simply stay empty.
      const currentProgression: ProgressionState = {
        bosses: (season.bosses ?? []) as ProgressionState["bosses"],
        kills: season.kills ?? 0,
        totalBosses: season.totalBosses ?? 0,
        rankings: season.rankings as ProgressionState["rankings"],
        mythicPlusRunners: (season.mythicPlusRunners as MythicPlusRunner[] | null) ?? [],
        mythicPlusParticipants: (season.mythicPlusParticipants as ProgressionState["mythicPlusParticipants"] | null) ?? [],
        raidSlugs: (season.raidSlugs ?? []).map((r) => r.slug),
        rankSourceRaidSlug: season.rankSourceRaidSlug,
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
      await payload.update({
        collection: "seasons",
        id: currentSeasonId,
        data: {
          kills: derivedProgression.kills,
          totalBosses: derivedProgression.totalBosses,
          bosses: derivedProgression.bosses,
          rankings: derivedProgression.rankings,
          mythicPlusRunners: derivedProgression.mythicPlusRunners,
          mythicPlusParticipants: derivedProgression.mythicPlusParticipants,
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
