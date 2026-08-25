import { z } from "zod";
import type { DungeonRun, RunMember } from "@/components/venom/DungeonGrid";

/**
 * The guild's best key per dungeon, for the Season 2 dungeon-rotation grid.
 *
 * Two upstream sources, both validated at the boundary per ADR 0002:
 *
 * 1. `mythic-plus/rankings/characters?season=…` — every guild member's ranked
 *    runs for a *named* season. This is the endpoint that also proved an
 *    archived Season's M+ standings are retrievable; the roster endpoint
 *    exposes only an aggregate current-season score.
 * 2. `mythic-plus/static-data?expansion_id=…` — the zoneId → dungeon-name map.
 *    Runs carry only `zoneId`, so this is what makes them nameable, and
 *    membership of the *current* expansion's list is what sorts a dungeon into
 *    the midnight or legacy pool.
 *
 * **The `page` parameter is ignored by the rankings endpoint** — every page
 * returns the same full list. Requesting page 0 once is correct; looping pages
 * silently multiplies the result set.
 */

const RunSchema = z.object({
  zoneId: z.number(),
  // Identifies one keystone run, so members of the same party share it. This is
  // what makes the per-run roster on a dungeon card possible.
  keystoneRunId: z.number(),
  mythicLevel: z.number(),
  clearTimeMs: z.number(),
  parTimeMs: z.number(),
  numChests: z.number(),
});

const RankedCharacterSchema = z.object({
  character: z.object({
    name: z.string(),
    class: z.object({ name: z.string() }).optional(),
    // `role` is what orders a party tank → healer → dps, the way a group is
    // read in game.
    spec: z.object({ name: z.string(), role: z.string().optional() }).optional(),
  }),
  runs: z.array(RunSchema).optional(),
});

/** Party order: tank first, then healer, then dps. */
const ROLE_ORDER: Record<string, number> = { tank: 0, healer: 1, dps: 2 };

const RankingsSchema = z.object({
  rankings: z.object({
    rankedCharacters: z.array(RankedCharacterSchema),
  }),
});

const StaticDataSchema = z.object({
  dungeons: z.array(z.object({ id: z.number(), name: z.string() })),
});

/** Expansions to resolve names from. Legacy dungeons come from older ones. */
const EXPANSIONS = [6, 7, 8, 9, 10, 11] as const;
/** The current expansion, whose dungeons are the "midnight" pool. */
const CURRENT_EXPANSION = 11;

const RANKINGS_URL = "https://raider.io/api/mythic-plus/rankings/characters";
const STATIC_URL = "https://raider.io/api/v1/mythic-plus/static-data";

function formatClearTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export type DungeonFetchArgs = {
  region: string;
  realm: string;
  guild: string;
  /** The Season's own M+ slug, e.g. "season-mn-2". */
  seasonSlug: string;
};

/**
 * Best key per dungeon, ordered hardest first.
 *
 * "Best" is the highest key level, breaking ties by the faster clear — the same
 * ordering a player would read as better.
 */
export async function fetchDungeonRotation(args: DungeonFetchArgs): Promise<DungeonRun[]> {
  const [names, currentIds] = await fetchDungeonNames();

  const url =
    `${RANKINGS_URL}?region=${args.region}&realm=${encodeURIComponent(args.realm)}` +
    `&guild=${encodeURIComponent(args.guild)}&season=${args.seasonSlug}&class=all&role=all&page=0`;

  const res = await fetch(url, { next: { revalidate: 900 } });
  if (!res.ok) throw new Error(`M+ rankings ${res.status} ${res.statusText}`);
  const parsed = RankingsSchema.parse(await res.json());

  const best = new Map<number, z.infer<typeof RunSchema>>();
  // Who ran each key together. Built across *every* character's runs before any
  // best-run selection, because a party is only visible by collecting the same
  // keystoneRunId from each member's own list.
  //
  // Only guild members appear: the endpoint is scoped to the guild, so a key
  // run with pugs shows just the members who were there. That is usually one
  // person, which is why the card lists names plainly and claims nothing about
  // party size.
  const parties = new Map<number, RunMember[]>();

  for (const character of parsed.rankings.rankedCharacters) {
    for (const run of character.runs ?? []) {
      const roster = parties.get(run.keystoneRunId) ?? [];
      roster.push({
        name: character.character.name,
        class: character.character.class?.name ?? "",
        spec: character.character.spec?.name ?? "",
        role: character.character.spec?.role ?? "dps",
      });
      parties.set(run.keystoneRunId, roster);

      const current = best.get(run.zoneId);
      const better =
        !current ||
        run.mythicLevel > current.mythicLevel ||
        (run.mythicLevel === current.mythicLevel && run.clearTimeMs < current.clearTimeMs);
      if (better) best.set(run.zoneId, run);
    }
  }

  const unnamed: number[] = [];
  const rotation = [...best.entries()]
    .map(([zoneId, run]): DungeonRun | null => {
      const name = names.get(zoneId);
      // A zone we cannot name would render as a blank card, which is worse than
      // omitting it. Skipping keeps the grid honest if upstream adds a dungeon
      // the static data has not caught up with — but a silently shorter grid
      // looks identical to a guild that simply ran fewer dungeons, so the drop
      // is recorded below.
      if (!name) {
        unnamed.push(zoneId);
        return null;
      }
      return {
        name,
        pool: currentIds.has(zoneId) ? "midnight" : "legacy",
        bestKey: run.mythicLevel,
        // numChests is the number of keystone upgrades; zero means over time.
        timed: run.numChests > 0,
        bestTime: formatClearTime(run.clearTimeMs),
        // Party order, not alphabetical: tank, healer, then dps.
        members: (parties.get(run.keystoneRunId) ?? [])
          .slice()
          .sort(
            (a, b) =>
              (ROLE_ORDER[a.role] ?? 2) - (ROLE_ORDER[b.role] ?? 2) || a.name.localeCompare(b.name),
          ),
      };
    })
    .filter((d): d is DungeonRun => d !== null)
    .sort((a, b) => b.bestKey - a.bestKey || a.bestTime.localeCompare(b.bestTime));

  if (unnamed.length > 0) {
    console.error(`M+ rotation: dropped ${unnamed.length} unnamed zone(s): ${unnamed.join(", ")}`);
  }

  return rotation;
}

/** zoneId → name across every expansion, plus the current expansion's ids. */
async function fetchDungeonNames(): Promise<[Map<number, string>, Set<number>]> {
  const names = new Map<number, string>();
  const currentIds = new Set<number>();

  await Promise.all(
    EXPANSIONS.map(async (expansion) => {
      const res = await fetch(`${STATIC_URL}?expansion_id=${expansion}`, {
        // Static data changes once a patch; an hour is generous and keeps the
        // page from making six upstream requests per render.
        next: { revalidate: 3600 },
      });
      // Degrade rather than throw — one expansion's static data missing costs
      // some dungeon *names*, not the section. But say so: ADR 0002 wants a
      // boundary failure to be loud, and a silent `return` here was
      // indistinguishable from an expansion that legitimately has no dungeons.
      if (!res.ok) {
        console.error(`M+ static data for expansion ${expansion}: ${res.status} ${res.statusText}`);
        return;
      }
      const parsed = StaticDataSchema.safeParse(await res.json());
      if (!parsed.success) {
        console.error(`M+ static data for expansion ${expansion} did not validate`, parsed.error.issues);
        return;
      }
      for (const d of parsed.data.dungeons) {
        names.set(d.id, d.name);
        if (expansion === CURRENT_EXPANSION) currentIds.add(d.id);
      }
    }),
  );

  return [names, currentIds];
}
