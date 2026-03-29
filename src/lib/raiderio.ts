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

type RaiderIOCharacter = {
  class: string;
  active_spec_name: string;
  active_spec_role: 'TANK' | 'HEALING' | 'DPS';
  gear: { item_level_equipped: number };
};

type RaiderIOGuildMember = {
  rank: number;
  character: { name: string; realm: string };
};

type RawMember = {
  character: {
    name: string;
    class: string;
    active_spec_name: string;
    mythic_plus_scores_by_current_season?: { all: number };
  };
};

const ROLE_MAP: Record<string, 'Tank' | 'Healer' | 'DPS'> = {
  TANK: 'Tank',
  HEALING: 'Healer',
  DPS: 'DPS',
};

export type CharacterMatch = {
  name: string;
  realm: string;
  class: string;
  spec: string;
  role: 'Tank' | 'Healer' | 'DPS';
  ilvl: number;
};

export async function fetchGuildCharacterMatches(name: string): Promise<CharacterMatch[]> {
  // Fetch guild roster to find all members matching the name across all realms
  const rosterRes = await fetch(
    `https://raider.io/api/v1/guilds/profile?region=${REGION}&realm=${REALM}&name=${encodeURIComponent(GUILD_NAME)}&fields=members`,
  );
  if (!rosterRes.ok) return [];

  const roster = await rosterRes.json();
  const members: RaiderIOGuildMember[] = (roster.members ?? []).filter(
    (m: RaiderIOGuildMember) => m.character.name.toLowerCase() === name.toLowerCase(),
  );
  if (members.length === 0) return [];

  // Fetch full profile for each match in parallel
  const results = await Promise.all(
    members.map(async (member) => {
      const realmSlug = member.character.realm.toLowerCase().replace(/\s+/g, '-');
      const charRes = await fetch(
        `https://raider.io/api/v1/characters/profile?region=${REGION}&realm=${realmSlug}&name=${encodeURIComponent(member.character.name)}&fields=gear,spec`,
      );
      if (!charRes.ok) return null;
      const data: RaiderIOCharacter = await charRes.json();
      if (!data.class || !data.active_spec_name) return null;
      return {
        name: member.character.name,
        realm: member.character.realm,
        class: data.class,
        spec: data.active_spec_name,
        role: ROLE_MAP[data.active_spec_role] ?? 'DPS',
        ilvl: data.gear?.item_level_equipped ?? 0,
      } satisfies CharacterMatch;
    }),
  );

  return results.filter((r): r is CharacterMatch => r !== null);
}

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

export async function fetchTopMythicPlusRunners(): Promise<MythicPlusRunner[]> {
  // Single guild call — avoids per-member rate limits.
  // The `members:mythic_plus_scores_by_current_season` sub-field requests score
  // data inline with the roster. Verify this field is supported by the Raider.IO
  // API before relying on it (inspect network requests on:
  // raider.io/guilds/us/barthilas/Hakuna%20Muh%20Nagga/roster#mode=mythic_plus).
  //
  // FALLBACK: If the guild endpoint doesn't return scores, see the fallback
  // implementation at the bottom of this file comment block.
  const res = await fetch(
    `https://raider.io/api/v1/guilds/profile?region=${REGION}&realm=${REALM}&name=${encodeURIComponent(GUILD_NAME)}&fields=members%3Amythic_plus_scores_by_current_season`,
    fetchOptions,
  );
  if (!res.ok) throw new Error(`Raider.IO M+ fetch failed: ${res.status}`);

  const data = await res.json();
  const members: unknown[] = data.members ?? [];

  return (members as RawMember[])
    .filter((m) => (m.character?.mythic_plus_scores_by_current_season?.all ?? 0) > 0)
    .map((m) => ({
      name: m.character.name,
      class: m.character.class,
      spec: m.character.active_spec_name,
      score: m.character.mythic_plus_scores_by_current_season?.all ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

/*
 * FALLBACK if guild endpoint does not include scores in members:
 *
 * 1. Fetch roster with fields=members (returns name + realm only).
 * 2. Batch-fetch character profiles 5 at a time with a 300ms delay between batches:
 *
 * async function batchFetch(members: RaiderIOGuildMember[]): Promise<MythicPlusRunner[]> {
 *   const results: MythicPlusRunner[] = [];
 *   for (let i = 0; i < members.length; i += 5) {
 *     const batch = members.slice(i, i + 5);
 *     const fetched = await Promise.all(batch.map(async (m) => {
 *       const realm = m.character.realm.toLowerCase().replace(/\s+/g, '-');
 *       const r = await fetch(
 *         `https://raider.io/api/v1/characters/profile?region=${REGION}&realm=${realm}` +
 *         `&name=${encodeURIComponent(m.character.name)}&fields=mythic_plus_scores_by_current_season,spec`,
 *         fetchOptions,
 *       );
 *       if (!r.ok) return null;
 *       const d = await r.json();
 *       const score = d.mythic_plus_scores_by_current_season?.all ?? 0;
 *       if (score <= 0) return null;
 *       return { name: d.name, class: d.class, spec: d.active_spec_name, score } as MythicPlusRunner;
 *     }));
 *     results.push(...fetched.filter((x): x is MythicPlusRunner => x !== null));
 *     if (i + 5 < members.length) await new Promise((r) => setTimeout(r, 300));
 *   }
 *   return results.sort((a, b) => b.score - a.score).slice(0, 10);
 * }
 */
