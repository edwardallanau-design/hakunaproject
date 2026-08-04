import { describe, expect, it } from "vitest";
import detailsFixture from "@/lib/__fixtures__/raiderio-details.json";
import rosterFixture from "@/lib/__fixtures__/raiderio-roster.json";
import { GuildDetailsResponseSchema, GuildRosterResponseSchema } from "@/lib/raiderioSchema";

describe("GuildDetailsResponseSchema", () => {
  it("parses a known-good response", () => {
    const result = GuildDetailsResponseSchema.parse(detailsFixture);
    expect(result.guildDetails.guild.name).toBe("Potato Corner");
    expect(result.guildDetails.raidRankings.map((r) => r.raid)).toEqual(["tier-mn-1", "sporefall"]);
  });

  it("strips fields the app does not consume, e.g. subregion", () => {
    const result = GuildDetailsResponseSchema.parse(detailsFixture);
    const tierRanks = result.guildDetails.raidRankings[0].ranks.mythic;
    expect(tierRanks).toEqual({ world: 1375, region: 450, realm: 6 });
    expect(tierRanks).not.toHaveProperty("subregion");
  });

  it("fails at the boundary when a required field is missing, naming the path", () => {
    const broken = structuredClone(detailsFixture) as any;
    delete broken.guildDetails.raidProgress[0].encountersDefeated;

    let thrown: unknown;
    try {
      GuildDetailsResponseSchema.parse(broken);
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeDefined();
    const message = String(thrown);
    expect(message).toMatch(/encountersDefeated/);
  });

  it("treats raidAttempt as optional, matching how it is consumed", () => {
    const withoutAttempt = structuredClone(detailsFixture) as any;
    delete withoutAttempt.guildDetails.raidAttempt;

    expect(() => GuildDetailsResponseSchema.parse(withoutAttempt)).not.toThrow();
  });

  it("rejects a response missing guild data entirely", () => {
    const broken = { guildDetails: { raidRankings: [], raidProgress: [] } };
    expect(() => GuildDetailsResponseSchema.parse(broken)).toThrow();
  });
});

describe("GuildRosterResponseSchema", () => {
  it("parses a known-good roster response", () => {
    const result = GuildRosterResponseSchema.parse(rosterFixture);
    expect(result.guildRoster.roster.length).toBeGreaterThan(0);
  });

  it("strips large fields the transform does not need, e.g. items/expansionData", () => {
    const result = GuildRosterResponseSchema.parse(rosterFixture);
    const member = result.guildRoster.roster[0];
    expect(member.character).not.toHaveProperty("items");
    expect(member.character).not.toHaveProperty("expansionData");
  });

  it("fails at the boundary when character data is missing", () => {
    const broken = structuredClone(rosterFixture) as any;
    delete broken.guildRoster.roster[0].character.class;

    expect(() => GuildRosterResponseSchema.parse(broken)).toThrow(/class/);
  });
});
