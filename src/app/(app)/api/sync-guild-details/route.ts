import { getPayload } from "payload";
import config from "@/payload.config";
import { fetchAndTransformGuildDetails } from "@/lib/raiderio";
import { deriveProgression, type ProgressionState } from "@/lib/syncProgression";
import { deriveOfficers, type Officer } from "@/lib/syncOfficers";
import { fetchGuildRuns } from "@/lib/mythicPlusDungeons";
import { mergeStoredRuns, type GuildRun } from "@/lib/dungeonRotation";
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
    // The Season pointer is resolved before any upstream call, because the
    // Mythic+ poll below needs this Season's own M+ slug to filter runs by.
    // A missing pointer is our own state being wrong, not upstream's, so it
    // keeps the "derivation" stage it has always reported.
    let season: Season;
    let officersGlobal;
    try {
      const [guildSettings, officers] = await Promise.all([
        payload.findGlobal({ slug: "guild-settings" }),
        payload.findGlobal({ slug: "officers-section" }),
      ]);
      officersGlobal = officers;

      // An empty pointer must be announced, never silently write nothing (ADR 0001).
      const currentSeason = guildSettings.currentSeason;
      if (!currentSeason || typeof currentSeason !== "object") {
        throw new Error("guild-settings.currentSeason is not set — no Season to sync to.");
      }
      season = currentSeason as Season;
    } catch (err) {
      throw new SyncStageError("derivation", err instanceof Error ? err.message : String(err));
    }
    const currentSeasonId = season.id;

    const details = await fetchAndTransformGuildDetails().catch((err) => {
      throw new SyncStageError("fetch", err instanceof Error ? err.message : String(err));
    });

    // The Recent Keys poll — ~166 upstream requests, which is precisely why it
    // belongs here and not in a page render. Part of the fetch stage, so a
    // failure stops the Sync before anything is written and the stored runs
    // survive untouched (ADR 0001).
    const freshRuns = await fetchGuildRuns({
      region: process.env.GUILD_REGION ?? "us",
      realm: process.env.GUILD_REALM ?? "Barthilas",
      guild: process.env.GUILD_NAME ?? "Potato Corner",
      seasonSlug: season.mythicPlusSeasonSlug,
    }).catch((err) => {
      throw new SyncStageError("fetch", `Mythic+ keys: ${err instanceof Error ? err.message : String(err)}`);
    });

    let derivedProgression, derivedOfficers, mergedRuns;
    try {
      // A current Season with no bosses yet is a normal mid-rollover state, not a
      // failure — rankings and M+ still derive below, bosses simply stay empty.
      const currentProgression: ProgressionState = {
        bosses: (season.bosses ?? []) as ProgressionState["bosses"],
        kills: season.kills ?? 0,
        totalBosses: season.totalBosses ?? 0,
        rankings: season.rankings as ProgressionState["rankings"],
        // Read back so the preserve-on-no-data rule can see what is already
        // stored per difficulty, exactly as it does for mythic above.
        rankingsByDifficulty: {
          normal: season.rankingsNormal as ProgressionState["rankings"] ?? undefined,
          heroic: season.rankingsHeroic as ProgressionState["rankings"] ?? undefined,
        },
        mythicPlusRunners: (season.mythicPlusRunners as MythicPlusRunner[] | null) ?? [],
        mythicPlusParticipants: (season.mythicPlusParticipants as ProgressionState["mythicPlusParticipants"] | null) ?? [],
        raidSlugs: (season.raidSlugs ?? []).map((r) => r.slug),
        rankSourceRaidSlug: season.rankSourceRaidSlug,
        // This route syncs the *current* Season by definition — it reads the
        // pointer above — so it is never deriving an archive. Stated rather
        // than left to the default, because the flag is what stops a Season
        // from being degraded by a live response, and a future caller that
        // derives some other Season must decide this deliberately.
        isArchived: false,
      };
      derivedProgression = deriveProgression(details, currentProgression);

      const currentOfficers = (officersGlobal.officers ?? []) as Officer[];
      derivedOfficers = deriveOfficers(details, currentOfficers);

      // Accumulated, not replaced. Each character exposes only their ten most
      // recent runs, so a single poll can never reach further back than that —
      // folding hourly keeps a run after it scrolls out of everyone's ten.
      mergedRuns = mergeStoredRuns(
        (season.mythicPlusRuns as GuildRun[] | null) ?? [],
        freshRuns,
      );
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
          rankingsNormal: derivedProgression.rankingsByDifficulty.normal,
          rankingsHeroic: derivedProgression.rankingsByDifficulty.heroic,
          mythicPlusRunners: derivedProgression.mythicPlusRunners,
          mythicPlusParticipants: derivedProgression.mythicPlusParticipants,
          mythicPlusRuns: mergedRuns,
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
