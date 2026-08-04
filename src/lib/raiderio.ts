import { GuildDetailsResponseSchema, GuildRosterResponseSchema } from "@/lib/raiderioSchema";
import type { GuildDetailsData as ValidatedGuildDetailsData, RosterMember } from "@/lib/raiderioSchema";

export type { RosterMember };

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

export type GuildDetailsData = ValidatedGuildDetailsData & {
  raidAttempt: NonNullable<ValidatedGuildDetailsData["raidAttempt"]>;
  members: RosterMember[];
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

  let validatedDetails;
  try {
    validatedDetails = GuildDetailsResponseSchema.parse(detailsJson).guildDetails;
  } catch {
    throw new Error("Guild details API returned no guild data — guild may not exist or was renamed");
  }

  let rosterList;
  try {
    rosterList = GuildRosterResponseSchema.parse(rosterJson).guildRoster.roster;
  } catch {
    throw new Error("Guild roster API returned no roster data — guild may not exist or was renamed");
  }

  const members = rosterList.filter((entry) => entry.character.level === 90);

  if (members.length === 0) {
    throw new Error("Guild roster returned no members — guild name or realm may be wrong");
  }

  return {
    ...validatedDetails,
    raidAttempt: validatedDetails.raidAttempt ?? [],
    members,
  };
}
