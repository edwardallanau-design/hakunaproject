function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const GUILD_NAME = requireEnv("GUILD_NAME");
const REALM = requireEnv("GUILD_REALM");
const REGION = requireEnv("GUILD_REGION");

export type MythicPlusRunner = {
  name: string;
  class: string;
  spec: string;
  score: number;
};

export type ProgressionData = {
  tier: string;
  difficulty: string;
  kills: number;
  totalBosses: number;
  summary: string;
  bosses: { name: string; killed: boolean; pulls?: number; bestPull?: number }[];
  rankings: { world: number; region: number; realm: number } | null;
  profileUrl: string;
  mythicPlusRunners: MythicPlusRunner[];
};

export type GuildDetailsData = {
  guild: {
    id: number;
    name: string;
    faction: string;
    realm: { id: number; name: string; slug: string };
    region: { name: string; slug: string; short_name: string };
    path: string;
    logo: string;
  };
  raidRankings: {
    raid: string;
    ranks: Record<string, { world: number; region: number; realm: number }>;
  }[];
  raidProgress: {
    raid: string;
    aotc: string | null;
    cuttingEdge: string | null;
    encountersDefeated: Record<
      string,
      { slug: string; firstDefeated: string }[]
    >;
  }[];
  raidAttempt: {
    raid: string;
    encounters: Record<
      string,
      {
        slug: string;
        name: string;
        bestPercent: number;
        pullCount: number;
        pullStartedAt: string;
        lastPullAt: string;
      }[]
    >;
  }[];
  members: RosterMember[];
  meta: {
    lastCrawledAt: string | null;
  };
};

async function fetchWithRetry(url: string): Promise<Response> {
  const MAX_ATTEMPTS = 3;
  let lastError = "Unknown error";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let res: Response;
    try {
      res = await fetch(url);
    } catch (err) {
      lastError = `Network error: ${err instanceof Error ? err.message : String(err)}`;
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, attempt * 2000));
        continue;
      }
      break;
    }
    if (res.status === 504 || res.status === 502 || res.status === 503) {
      lastError = `Fetch failed: ${res.status}`;
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, attempt * 2000));
        continue;
      }
    } else {
      return res;
    }
  }
  throw new Error(lastError);
}

export async function fetchAndTransformGuildDetails(): Promise<GuildDetailsData> {
  const guildName = encodeURIComponent(GUILD_NAME);
  const [detailsRes, rosterRes] = await Promise.all([
    fetchWithRetry(`https://raider.io/api/guilds/details?region=${REGION}&realm=${REALM}&guild=${guildName}`),
    fetchWithRetry(`https://raider.io/api/guilds/roster?region=${REGION}&realm=${REALM}&guild=${guildName}`),
  ]);
  if (!detailsRes.ok) throw new Error(`Guild details fetch failed: ${detailsRes.status}`);
  if (!rosterRes.ok) throw new Error(`Guild roster fetch failed: ${rosterRes.status}`);

  const [detailsJson, rosterJson] = await Promise.all([
    detailsRes.json(),
    rosterRes.json(),
  ]);

  if (!detailsJson?.guildDetails?.guild) {
    throw new Error("Guild details API returned no guild data — guild may not exist or was renamed");
  }

  const members = ((rosterJson.guildRoster?.roster ?? rosterJson.roster) ?? [])
    .filter((entry: RawRosterEntry) => entry.character?.level === 90)
    .map((entry: RawRosterEntry): RosterMember => {
      const { character, raidProgress, keystoneScores } = entry;
      const { expansionData: _expansion, talentsDetails: _talentsDetails, items: _items, talents: _talents, patronLevel: _patronLevel, ...characterRest } = character;
      return { character: characterRest, raidProgress, keystoneScores };
    });

  if (members.length === 0) {
    throw new Error("Guild roster returned no members — guild name or realm may be wrong");
  }

  const { guild: rawGuild, raidRankings, raidProgress, raidAttempt, meta } = detailsJson.guildDetails;
  const { isConnected: _isConnected, realmType: _realmType, ...realm } = rawGuild.realm;

  const guild: GuildDetailsData["guild"] = {
    id: rawGuild.id,
    name: rawGuild.name,
    faction: rawGuild.faction,
    realm,
    region: rawGuild.region,
    path: rawGuild.path,
    logo: rawGuild.logo,
  };

  const mappedRaidRankings: GuildDetailsData["raidRankings"] = (raidRankings ?? []).map(({ raid, ranks }: {
    raid: string;
    ranks: Record<string, {
      world: number;
      region: number;
      realm: number
    }>
  }) => ({
    raid,
    ranks
  }));

  const mappedRaidProgress: GuildDetailsData["raidProgress"] = (raidProgress ?? []).map(({ raid, aotc, cuttingEdge, encountersDefeated }: { raid: string; aotc: string | null; cuttingEdge: string | null; encountersDefeated: Record<string, { slug: string; firstDefeated: string; itemLevelAvg: number; artifactPowerAvg: number }[]> }) => ({
    raid, aotc, cuttingEdge,
    encountersDefeated: Object.fromEntries(
      Object.entries(encountersDefeated).map(([diff, bosses]) => [
        diff,
        (bosses as { slug: string; firstDefeated: string }[]).map(({ slug, firstDefeated }) => ({ slug, firstDefeated })),
      ]),
    ),
  }));

  const mappedRaidAttempt: GuildDetailsData["raidAttempt"] = (raidAttempt ?? []).map(({ raid, encounters }: { raid: string; encounters: Record<string, { slug: string; name: string; bestPercent: number; pullCount: number; pullStartedAt: string; lastPullAt: string; isAttempt: boolean }[]> }) => ({
    raid,
    encounters: Object.fromEntries(
      Object.entries(encounters).map(([diff, bosses]) => [
        diff,
        (bosses as { slug: string; name: string; bestPercent: number; pullCount: number; pullStartedAt: string; lastPullAt: string }[]).map(({ slug, name, bestPercent, pullCount, pullStartedAt, lastPullAt }) => ({ slug, name, bestPercent, pullCount, pullStartedAt, lastPullAt })),
      ]),
    ),
  }));

  return {
    members,
    guild,
    raidRankings: mappedRaidRankings,
    raidProgress: mappedRaidProgress,
    raidAttempt: mappedRaidAttempt,
    meta: { lastCrawledAt: meta?.lastCrawledAt ?? null },
  };
}

export type RosterMember = {
  character: {
    name: string;
    level: number;
    race: { id: number; name: string; slug: string; faction: string };
    class: { id: number; name: string; slug: string };
    spec: { id: number; name: string; slug: string; role: string; is_melee: boolean };
    gender: string;
    thumbnail: string;
    itemLevelEquipped: number;
    realm: { id: number; name: string; slug: string; isConnected: boolean; realmType: string };
    region: { name: string; slug: string; short_name: string };
  };
  raidProgress: {
    raid: {
      type: string;
      id: number;
      difficulty: string;
      name: string;
      slug: string;
      expansion_id: number;
    };
    totalBosses: number;
    progress: { normal: number; heroic: number; mythic: number };
  };
  keystoneScores: { allScore: number; allScoreColor: string };
};

// Extends the clean output type so the spread in the transform is type-safe
type RawRosterCharacter = RosterMember['character'] & {
  items?: unknown;
  expansionData?: unknown;
  talentsDetails?: unknown[];
  talents?: unknown;
  patronLevel?: unknown;
};

type RawRosterEntry = {
  character: RawRosterCharacter;
  raidProgress: RosterMember['raidProgress'];
  keystoneScores: RosterMember['keystoneScores'];
  stream?: unknown;
};
