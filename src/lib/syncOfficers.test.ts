import { describe, expect, it } from "vitest";
import { deriveOfficers } from "@/lib/syncOfficers";
import type { GuildDetailsData, RosterMember } from "@/lib/raiderio";

function makeMember(overrides: Partial<RosterMember["character"]> = {}, extra: Partial<RosterMember> = {}): RosterMember {
  return {
    character: {
      name: "Belphegor",
      level: 90,
      race: { id: 8, name: "Troll", slug: "troll", faction: "horde" },
      class: { id: 3, name: "Hunter", slug: "hunter" },
      spec: { id: 253, name: "Beast Mastery", slug: "beast-mastery", role: "dps", is_melee: false },
      gender: "male",
      thumbnail: "thumb.jpg",
      itemLevelEquipped: 283,
      realm: { id: 1, name: "Barthilas", slug: "barthilas", isConnected: false, realmType: "live" },
      region: { name: "US", slug: "us", short_name: "US" },
      ...overrides,
    },
    raidProgress: {
      raid: { type: "raid", id: 1, difficulty: "mythic", name: "Midnight", slug: "tier-mn-1", expansion_id: 10 },
      totalBosses: 9,
      progress: { normal: 9, heroic: 9, mythic: 5 },
    },
    keystoneScores: { allScore: 2500, allScoreColor: "#fff" },
    ...extra,
  };
}

function makeDetails(members: RosterMember[]): GuildDetailsData {
  return {
    guild: {
      id: 1,
      name: "Potato Corner",
      faction: "horde",
      realm: { id: 1, name: "Barthilas", slug: "barthilas" },
      region: { name: "US", slug: "us", short_name: "US" },
      path: "/guilds/us/barthilas/Potato%20Corner",
      logo: "logo.png",
    },
    raidRankings: [],
    raidProgress: [],
    raidAttempt: [],
    members,
  };
}

describe("deriveOfficers", () => {
  it("returns officers unchanged when there are none configured", () => {
    const details = makeDetails([makeMember()]);
    const result = deriveOfficers(details, []);
    expect(result).toEqual([]);
  });

  it("updates class/spec/role/ilvl for an officer matched by name", () => {
    const details = makeDetails([makeMember({ name: "Belphegor" })]);
    const officers = [{ name: "Belphegor", class: "Warrior" as const, spec: "Arms", role: "DPS" as const, ilvl: 200, rank: "Guild Master", id: "1" }];

    const result = deriveOfficers(details, officers);

    expect(result[0]).toMatchObject({
      name: "Belphegor",
      class: "Hunter",
      spec: "Beast Mastery",
      role: "DPS",
      ilvl: 283,
    });
  });

  it("matches officer names case-insensitively", () => {
    const details = makeDetails([makeMember({ name: "Belphegor" })]);
    const officers = [{ name: "belphegor", class: "Warrior" as const, spec: "Arms", role: "DPS" as const, ilvl: 200 }];

    const result = deriveOfficers(details, officers);

    expect(result[0].ilvl).toBe(283);
  });

  it("leaves an officer untouched when no matching roster member exists", () => {
    const details = makeDetails([makeMember({ name: "SomeoneElse" })]);
    const officer = { name: "Belphegor", class: "Warrior" as const, spec: "Arms", role: "DPS" as const, ilvl: 200 };

    const result = deriveOfficers(details, [officer]);

    expect(result[0]).toEqual(officer);
  });

  it("maps melee/ranged roles to DPS", () => {
    const details = makeDetails([
      makeMember({ name: "Belphegor", spec: { id: 253, name: "Beast Mastery", slug: "beast-mastery", role: "ranged", is_melee: false } }),
    ]);
    const officers = [{ name: "Belphegor", class: "Warrior" as const, spec: "Arms", role: "DPS" as const, ilvl: 200 }];

    const result = deriveOfficers(details, officers);

    expect(result[0].role).toBe("DPS");
  });
});
