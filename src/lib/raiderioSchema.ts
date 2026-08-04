import { z } from "zod";

const RaidRanksSchema = z.object({
  world: z.number(),
  region: z.number(),
  realm: z.number(),
});

const GuildSchema = z.object({
  id: z.number(),
  name: z.string(),
  faction: z.string(),
  realm: z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
  }),
  region: z.object({
    name: z.string(),
    slug: z.string(),
    short_name: z.string(),
  }),
  path: z.string(),
  logo: z.string(),
});

const RaidRankingSchema = z.object({
  raid: z.string(),
  ranks: z.record(z.string(), RaidRanksSchema),
});

const EncounterDefeatedSchema = z.object({
  slug: z.string(),
  firstDefeated: z.string(),
});

const RaidProgressSchema = z.object({
  raid: z.string(),
  aotc: z.string().nullable(),
  cuttingEdge: z.string().nullable(),
  encountersDefeated: z.record(z.string(), z.array(EncounterDefeatedSchema)),
});

const AttemptEncounterSchema = z.object({
  slug: z.string(),
  name: z.string(),
  bestPercent: z.number(),
  pullCount: z.number(),
  pullStartedAt: z.string(),
  lastPullAt: z.string(),
});

const RaidAttemptSchema = z.object({
  raid: z.string(),
  encounters: z.record(z.string(), z.array(AttemptEncounterSchema)),
});

const GuildDetailsSchema = z.object({
  guild: GuildSchema,
  raidRankings: z.array(RaidRankingSchema).default([]),
  raidProgress: z.array(RaidProgressSchema).default([]),
  raidAttempt: z.array(RaidAttemptSchema).optional(),
  meta: z
    .object({
      lastCrawledAt: z.string().nullable(),
    })
    .optional(),
});

export const GuildDetailsResponseSchema = z.object({
  guildDetails: GuildDetailsSchema,
});

const RaceSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  faction: z.string(),
});

const ClassSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
});

const SpecSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  role: z.string(),
  is_melee: z.boolean(),
});

const CharacterRealmSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  isConnected: z.boolean(),
  realmType: z.string(),
});

const RosterCharacterSchema = z.object({
  name: z.string(),
  level: z.number(),
  race: RaceSchema,
  class: ClassSchema,
  spec: SpecSchema,
  gender: z.string(),
  thumbnail: z.string(),
  itemLevelEquipped: z.number(),
  realm: CharacterRealmSchema,
  region: z.object({
    name: z.string(),
    slug: z.string(),
    short_name: z.string(),
  }),
});

const RosterRaidProgressSchema = z.object({
  raid: z.object({
    type: z.string(),
    id: z.number(),
    difficulty: z.string(),
    name: z.string(),
    slug: z.string(),
    expansion_id: z.number(),
  }),
  totalBosses: z.number(),
  progress: z.object({
    normal: z.number(),
    heroic: z.number(),
    mythic: z.number(),
  }),
});

const KeystoneScoresSchema = z.object({
  allScore: z.number(),
  allScoreColor: z.string(),
});

const RosterEntrySchema = z.object({
  character: RosterCharacterSchema,
  raidProgress: RosterRaidProgressSchema,
  keystoneScores: KeystoneScoresSchema,
});

export const GuildRosterResponseSchema = z
  .object({
    guildRoster: z
      .object({
        roster: z.array(RosterEntrySchema),
      })
      .optional(),
    roster: z.array(RosterEntrySchema).optional(),
  })
  .transform((data, ctx) => {
    const roster = data.guildRoster?.roster ?? data.roster;
    if (!roster) {
      ctx.addIssue({ code: "custom", message: "Guild roster API returned no roster data" });
      return z.NEVER;
    }
    return { guildRoster: { roster } };
  });

export type ValidatedGuildDetailsResponse = z.infer<typeof GuildDetailsResponseSchema>;
export type ValidatedGuildRosterResponse = z.infer<typeof GuildRosterResponseSchema>;
export type GuildDetailsData = z.infer<typeof GuildDetailsSchema>;
export type RosterMember = z.infer<typeof RosterEntrySchema>;
