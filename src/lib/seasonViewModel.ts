import type { Season } from "@/payload-types";
import type { ProgressionData, MythicPlusRunner } from "@/lib/raiderio";

export type StatsData = { members: number; world: number; region: number; realm: number };

export function toStatsData(season: Season): StatsData {
  return {
    members: season.rankings?.members ?? 0,
    world: season.rankings?.world ?? 0,
    region: season.rankings?.region ?? 0,
    realm: season.rankings?.realm ?? 0,
  };
}

export function toProgressionData(season: Season): ProgressionData {
  return {
    tier: season.name,
    difficulty: season.difficulty ?? "Heroic",
    kills: season.kills ?? 0,
    totalBosses: season.totalBosses ?? 0,
    summary: season.summary ?? "",
    profileUrl: season.profileUrl ?? "",
    bosses: (season.bosses ?? []).map((b) => ({
      name: b.name,
      killed: b.killed ?? false,
      pulls: b.pulls ?? undefined,
      bestPull: b.bestPull ?? undefined,
    })),
    rankings: season.rankings
      ? {
          world: season.rankings.world ?? 0,
          region: season.rankings.region ?? 0,
          realm: season.rankings.realm ?? 0,
        }
      : null,
    mythicPlusRunners: (season.mythicPlusRunners ?? []).map(
      (r): MythicPlusRunner => ({
        name: r.name,
        class: r.class,
        spec: r.spec,
        score: r.score,
      }),
    ),
  };
}
