const GUILD_NAME = "Hakuna Muh Nagga";
const REALM = "barthilas";
const REGION = "us";

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

async function fetchGuildDetails(): Promise<Response> {
  const url = `https://raider.io/api/guilds/details?region=${REGION}&realm=${REALM}&guild=${encodeURIComponent(GUILD_NAME)}`;
  const MAX_ATTEMPTS = 3;
  let lastError = "Unknown error";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await fetch(url);
    if (res.status === 504 || res.status === 502 || res.status === 503) {
      lastError = `Guild details fetch failed: ${res.status}`;
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
  const [detailsRes, rosterRes] = await Promise.all([
    fetchGuildDetails(),
    fetchRosterDetails(),
  ]);
  if (!detailsRes.ok) throw new Error(`Guild details fetch failed: ${detailsRes.status}`);
  if (!rosterRes.ok) throw new Error(`Guild roster fetch failed: ${rosterRes.status}`);

  const [detailsJson, rosterJson] = await Promise.all([
    detailsRes.json(),
    rosterRes.json(),
  ]);

  const d = detailsJson.guildDetails;

  const members = ((rosterJson.guildRoster?.roster ?? rosterJson.roster) ?? [])
    .filter((entry: RawRosterEntry) => entry.character?.level === 90)
    .map((entry: RawRosterEntry): RosterMember => {
      const { character, raidProgress, keystoneScores } = entry;
      const { expansionData: _expansion, talentsDetails: _talentsDetails, items: _items, talents: _talents, patronLevel: _patronLevel, ...characterRest } = character;
      return { character: characterRest, raidProgress, keystoneScores };
    });

  return {
    members,
    guild: {
      id: d.guild.id,
      name: d.guild.name,
      faction: d.guild.faction,
      realm: { id: d.guild.realm.id, name: d.guild.realm.name, slug: d.guild.realm.slug },
      region: d.guild.region,
      path: d.guild.path,
      logo: d.guild.logo,
    },
    raidRankings: (d.raidRankings ?? []).map((r: { raid: string; ranks: Record<string, { world: number; region: number; realm: number }> }) => ({
      raid: r.raid,
      ranks: r.ranks,
    })),
    raidProgress: (d.raidProgress ?? []).map((p: { raid: string; aotc: string | null; cuttingEdge: string | null; encountersDefeated: Record<string, { slug: string; firstDefeated: string; itemLevelAvg: number; artifactPowerAvg: number }[]> }) => ({
      raid: p.raid,
      aotc: p.aotc,
      cuttingEdge: p.cuttingEdge,
      encountersDefeated: Object.fromEntries(
        Object.entries(p.encountersDefeated).map(([diff, bosses]) => [
          diff,
          bosses.map((b) => ({ slug: b.slug, firstDefeated: b.firstDefeated })),
        ]),
      ),
    })),
    raidAttempt: (d.raidAttempt ?? []).map((a: { raid: string; encounters: Record<string, { slug: string; name: string; bestPercent: number; pullCount: number; pullStartedAt: string; lastPullAt: string; isAttempt: boolean }[]> }) => ({
      raid: a.raid,
      encounters: Object.fromEntries(
        Object.entries(a.encounters).map(([diff, bosses]) => [
          diff,
          bosses.map((b) => ({
            slug: b.slug,
            name: b.name,
            bestPercent: b.bestPercent,
            pullCount: b.pullCount,
            pullStartedAt: b.pullStartedAt,
            lastPullAt: b.lastPullAt,
          })),
        ]),
      ),
    })),
    meta: {
      lastCrawledAt: d.meta?.lastCrawledAt ?? null,
    },
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
  talents?: string;
  patronLevel?: unknown;
};

type RawRosterEntry = {
  character: RawRosterCharacter;
  raidProgress: RosterMember['raidProgress'];
  keystoneScores: RosterMember['keystoneScores'];
  stream?: unknown;
};

async function fetchRosterDetails(): Promise<Response> {
  const url = `https://raider.io/api/guilds/roster?region=${REGION}&realm=${REALM}&guild=${encodeURIComponent(GUILD_NAME)}`;
  const MAX_ATTEMPTS = 3;
  let lastError = "Unknown error";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await fetch(url);
    if (res.status === 504 || res.status === 502 || res.status === 503) {
      lastError = `Roster fetch failed: ${res.status}`;
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
