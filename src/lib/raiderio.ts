const GUILD_NAME = "Hakuna Muh Nagga";
const REALM = "barthilas";
const REGION = "us";
// Midnight = expansion_id 11
const EXPANSION_ID = 11;

type RaiderIOBoss = { name: string; slug: string };
type RaiderIOEncounter = { slug: string; firstDefeated: string; lastDefeated: string };
type RaiderIOPull = { slug: string; numPulls: number; bestPercent: number; isDefeated: boolean };

type RaidProgression = {
  summary: string;
  total_bosses: number;
  normal_bosses_killed: number;
  heroic_bosses_killed: number;
  mythic_bosses_killed: number;
};

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

function determineDifficulty(prog: RaidProgression): { difficulty: string; kills: number } {
  if (prog.mythic_bosses_killed > 0) return { difficulty: "mythic", kills: prog.mythic_bosses_killed };
  if (prog.heroic_bosses_killed > 0) return { difficulty: "heroic", kills: prog.heroic_bosses_killed };
  return { difficulty: "normal", kills: prog.normal_bosses_killed };
}

function prettifyDifficulty(d: string): string {
  return d.charAt(0).toUpperCase() + d.slice(1);
}

type RaiderIOGuildMember = {
  rank: number;
  character: { name: string; realm: string };
};


export type GuildMember = { name: string; realm: string };

export async function fetchGuildMembers(): Promise<GuildMember[]> {
  const res = await fetch(
    `https://raider.io/api/v1/guilds/profile?region=${REGION}&realm=${REALM}&name=${encodeURIComponent(GUILD_NAME)}&fields=members`,
  );
  if (!res.ok) throw new Error(`Roster fetch failed: ${res.status}`);
  const data = await res.json();
  return (data.members ?? []).map((m: RaiderIOGuildMember) => ({
    name: m.character.name,
    realm: m.character.realm,
  }));
}

export type CharacterMatch = {
  name: string;
  realm: string;
  class: string;
  spec: string;
  role: 'Tank' | 'Healer' | 'DPS';
  ilvl: number;
};

// No Next.js caching — this is called from sync endpoints, not page renders
const fetchOptions: RequestInit = {};

export async function fetchGuildProgression(): Promise<ProgressionData> {
  // 1. Fetch guild profile + static raid data in parallel
  const [profileRes, staticRes] = await Promise.all([
    fetch(
      `https://raider.io/api/v1/guilds/profile?region=${REGION}&realm=${REALM}&name=${encodeURIComponent(GUILD_NAME)}&fields=raid_progression,raid_rankings`,
      fetchOptions,
    ),
    fetch(
      `https://raider.io/api/v1/raiding/static-data?expansion_id=${EXPANSION_ID}`,
      fetchOptions,
    ),
  ]);

  if (!profileRes.ok) throw new Error(`Raider.IO profile request failed: ${profileRes.status}`);
  if (!staticRes.ok) throw new Error(`Raider.IO static data request failed: ${staticRes.status}`);

  const profile = await profileRes.json();
  const staticData = await staticRes.json();

  // 2. Get the current (latest) raid tier
  const tierSlugs = Object.keys(profile.raid_progression);
  if (tierSlugs.length === 0) throw new Error("No raid progression found");
  const currentTierSlug = tierSlugs[0];

  const raidProg: RaidProgression = profile.raid_progression[currentTierSlug];
  const raidRank = profile.raid_rankings?.[currentTierSlug];

  // 3. Determine highest difficulty with kills
  const { difficulty, kills } = determineDifficulty(raidProg);

  // 4. Get boss names from static data
  const raidInfo = staticData.raids?.find((r: { slug: string }) => r.slug === currentTierSlug);
  if (!raidInfo) throw new Error(`Raid ${currentTierSlug} not found in static data`);
  const allBosses: RaiderIOBoss[] = raidInfo.encounters;

  // 5. Fetch raid-rankings for boss-level kill detail
  const rankingsRes = await fetch(
    `https://raider.io/api/v1/raiding/raid-rankings?raid=${currentTierSlug}&difficulty=${difficulty}&region=${REGION}&realm=${REALM}`,
    fetchOptions,
  );

  let killedSlugs = new Set<string>();
  let pullData = new Map<string, { pulls: number; bestPercent: number }>();

  if (rankingsRes.ok) {
    const rankings = await rankingsRes.json();
    const guildEntry = rankings.raidRankings?.find(
      (r: { guild: { name: string } }) => r.guild.name === GUILD_NAME,
    );

    if (guildEntry) {
      for (const enc of (guildEntry.encountersDefeated ?? []) as RaiderIOEncounter[]) {
        killedSlugs.add(enc.slug);
      }
      for (const pull of (guildEntry.encountersPulled ?? []) as RaiderIOPull[]) {
        pullData.set(pull.slug, { pulls: pull.numPulls, bestPercent: pull.bestPercent });
      }
    }
  }

  // 6. Build boss list — use specific kill data if available, otherwise fall back to count
  const hasSpecificData = killedSlugs.size > 0;
  const bosses = allBosses.map((boss, i) => {
    const killed = hasSpecificData ? killedSlugs.has(boss.slug) : i < kills;
    const pull = pullData.get(boss.slug);
    return {
      name: boss.name,
      killed,
      ...(pull && !killed ? { pulls: pull.pulls, bestPull: pull.bestPercent } : {}),
    };
  });

  return {
    tier: raidInfo.name,
    difficulty: prettifyDifficulty(difficulty),
    kills,
    totalBosses: raidProg.total_bosses,
    summary: raidProg.summary,
    bosses,
    rankings: raidRank?.[difficulty] ?? null,
    profileUrl: profile.profile_url ?? "",
    mythicPlusRunners: [],
  };
}

export type RunnerMatch = {
  name: string;
  realm: string;
  class: string;
  spec: string;
  score: number;
};

// ─── Guild Details ────────────────────────────────────────────────────────────

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
  leaders: {
    character: {
      id: number;
      name: string;
      class: { id: number; name: string; slug: string };
      race: { id: number; name: string; slug: string; faction: string };
      path: string;
      realm: { id: number; name: string; slug: string };
    };
    rank: number;
  }[];
  customizations: {
    biography: string | null;
    biography_updated_at: string | null;
    profile_banner: string | null;
    facebook_profile: string;
    twitch_profile: string;
    youtube_profile: string;
    twitter_profile: string;
  };
  meta: {
    lastCrawledAt: string | null;
  };
};

export async function fetchAndTransformGuildDetails(): Promise<GuildDetailsData> {
  const url = `https://raider.io/api/guilds/details?region=${REGION}&realm=${REALM}&guild=${encodeURIComponent(GUILD_NAME)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Guild details fetch failed: ${res.status}`);
  const data = await res.json();

  const d = data.guildDetails;

  return {
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
    leaders: (d.leaders ?? []).map((l: { character: { id: number; name: string; class: { id: number; name: string; slug: string }; race: { id: number; name: string; slug: string; faction: string }; path: string; realm: { id: number; name: string; slug: string } }; rank: number }) => ({
      character: {
        id: l.character.id,
        name: l.character.name,
        class: l.character.class,
        race: l.character.race,
        path: l.character.path,
        realm: { id: l.character.realm.id, name: l.character.realm.name, slug: l.character.realm.slug },
      },
      rank: l.rank,
    })),
    customizations: {
      biography: d.guildCustomizations?.biography ?? null,
      biography_updated_at: d.guildCustomizations?.biography_updated_at ?? null,
      profile_banner: d.guildCustomizations?.profile_banner ?? null,
      facebook_profile: d.guildCustomizations?.facebook_profile ?? "",
      twitch_profile: d.guildCustomizations?.twitch_profile ?? "",
      youtube_profile: d.guildCustomizations?.youtube_profile ?? "",
      twitter_profile: d.guildCustomizations?.twitter_profile ?? "",
    },
    meta: {
      lastCrawledAt: d.meta?.lastCrawledAt ?? null,
    },
  };
}

// ─── Guild Roster ─────────────────────────────────────────────────────────────

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
  rank: number;
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
  rank: number;
  stream?: unknown;
};

async function fetchRosterWithRetry(): Promise<Response> {
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

export async function fetchAndTransformRoster(): Promise<RosterMember[]> {
  const res = await fetchRosterWithRetry();
  if (!res.ok) throw new Error(`Roster fetch failed: ${res.status}`);
  const data = await res.json();

  return ((data.guildRoster?.roster ?? data.roster) ?? [])
    .filter((entry: RawRosterEntry) => entry.character?.level === 90)
    .map((entry: RawRosterEntry): RosterMember => {
    const { character, raidProgress, keystoneScores, rank } = entry;
    const { expansionData: _expansion, talentsDetails: _talentsDetails, items: _items, talents: _talents, patronLevel: _patronLevel, ...characterRest } = character;

    return {
      character: characterRest,
      raidProgress,
      keystoneScores,
      rank,
    };
  });
}

