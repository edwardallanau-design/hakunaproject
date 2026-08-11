import { describe, expect, it } from "vitest";
import { deriveProgression } from "@/lib/syncProgression";
import type { GuildDetailsData } from "@/lib/raiderio";

// Season 1's real slugs, used as the fixture's Rank Source and Raids. Seasons
// now carry their own upstream identity (ADR 0006) rather than a code
// constant, so these are just fixture data, not shared with production code.
const PRIMARY_RAID_SLUG = "tier-mn-1";

function makeDetails(overrides: Partial<GuildDetailsData> = {}): GuildDetailsData {
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
    raidRankings: [
      { raid: PRIMARY_RAID_SLUG, ranks: { mythic: { world: 1375, region: 450, realm: 6 } } },
      { raid: "sporefall", ranks: { mythic: { world: 900, region: 300, realm: 3 } } },
    ],
    raidProgress: [
      {
        raid: PRIMARY_RAID_SLUG,
        aotc: null,
        cuttingEdge: null,
        encountersDefeated: {
          mythic: [
            { slug: "imperator-averzian", firstDefeated: "2026-04-11T13:47:49.000Z" },
          ],
        },
      },
      {
        raid: "sporefall",
        aotc: "2026-06-17T12:51:45.000Z",
        cuttingEdge: "2026-06-17T12:24:30.000Z",
        encountersDefeated: {
          mythic: [{ slug: "rotmire", firstDefeated: "2026-06-17T12:24:30.000Z" }],
        },
      },
    ],
    raidAttempt: [
      {
        raid: PRIMARY_RAID_SLUG,
        encounters: {
          mythic: [
            {
              slug: "imperator-averzian",
              name: "Imperator Averzian",
              bestPercent: 0,
              pullCount: 12,
              pullStartedAt: "2026-04-10T00:00:00.000Z",
              lastPullAt: "2026-04-11T00:00:00.000Z",
            },
            {
              slug: "vorasius",
              name: "Vorasius",
              bestPercent: 4.2,
              pullCount: 30,
              pullStartedAt: "2026-04-12T00:00:00.000Z",
              lastPullAt: "2026-04-20T00:00:00.000Z",
            },
          ],
        },
      },
      {
        raid: "sporefall",
        encounters: {
          mythic: [
            {
              slug: "rotmire",
              name: "Rotmire",
              bestPercent: 0,
              pullCount: 40,
              pullStartedAt: "2026-06-01T00:00:00.000Z",
              lastPullAt: "2026-06-17T00:00:00.000Z",
            },
          ],
        },
      },
    ],
    members: [],
    ...overrides,
  };
}

function boss(name: string, extra: Partial<{ killed: boolean; firstDefeated: string | null; pulls: number | null; bestPull: number | null }> = {}) {
  return { name, killed: false, firstDefeated: null, pulls: null, bestPull: null, ...extra };
}

const emptyProgression = {
  bosses: [] as ReturnType<typeof boss>[],
  kills: 0,
  totalBosses: 0,
  rankings: null as { world: number; region: number; realm: number; members: number } | null,
  mythicPlusRunners: [] as { name: string; class: string; spec: string; score: number }[],
  mythicPlusParticipants: [] as { name: string; class: string; spec: string; score: number }[],
  raidSlugs: [PRIMARY_RAID_SLUG, "sporefall"],
  rankSourceRaidSlug: PRIMARY_RAID_SLUG,
};

function member(
  name: string,
  overrides: Partial<{ class: string; spec: string; score: number }> = {},
) {
  const { class: klass = "Warrior", spec = "Fury", score = 0 } = overrides;
  return {
    character: { name, class: { name: klass }, spec: { name: spec } },
    keystoneScores: { allScore: score },
    raidProgress: { progress: { normal: 0, heroic: 0, mythic: 0 } },
  } as unknown as GuildDetailsData["members"][number];
}

describe("deriveProgression — Rotmire regression", () => {
  it("resolves a kill in the SECOND raid of the response, not just the first", () => {
    const details = makeDetails();
    const current = {
      ...emptyProgression,
      bosses: [boss("Imperator Averzian"), boss("Rotmire")],
    };

    const result = deriveProgression(details, current);

    const rotmire = result.bosses.find((b) => b.name === "Rotmire");
    expect(rotmire?.killed).toBe(true);
    expect(rotmire?.firstDefeated).toBe("2026-06-17T12:24:30.000Z");
  });

  it("would have failed under raidProgress[0]-only logic", () => {
    // Simulates the original bug: only look at raidProgress[0] (tier-mn-1).
    const details = makeDetails();
    const firstRaidOnly = details.raidProgress[0];
    const mythicDefeated = new Set(
      (firstRaidOnly.encountersDefeated["mythic"] ?? []).map((e) => e.slug),
    );
    expect(mythicDefeated.has("rotmire")).toBe(false); // proves the bug existed
  });
});

describe("deriveProgression — kill aggregation", () => {
  it("aggregates kills across every raid the Season claims", () => {
    const details = makeDetails();
    const current = {
      ...emptyProgression,
      bosses: [boss("Imperator Averzian"), boss("Vorasius"), boss("Rotmire")],
    };

    const result = deriveProgression(details, current);

    expect(result.kills).toBe(2); // Imperator Averzian + Rotmire
    expect(result.totalBosses).toBe(3);
  });

  it("does not credit a kill from a raid outside the Season's own raidSlugs", () => {
    const details = makeDetails();
    const current = {
      ...emptyProgression,
      // This Season only claims the primary raid — sporefall (and Rotmire's kill
      // in it) belongs to a different Season and must not contaminate this one.
      raidSlugs: [PRIMARY_RAID_SLUG],
      bosses: [boss("Imperator Averzian"), boss("Rotmire")],
    };

    const result = deriveProgression(details, current);

    expect(result.kills).toBe(1); // Imperator Averzian only
    const rotmire = result.bosses.find((b) => b.name === "Rotmire");
    expect(rotmire?.killed).toBe(false);
  });
});

describe("deriveProgression — kill lock", () => {
  it("returns an already-killed boss untouched, even if absent from the response", () => {
    const details = makeDetails();
    const current = {
      ...emptyProgression,
      bosses: [
        boss("Some Old Boss", { killed: true, firstDefeated: "2026-01-01T00:00:00.000Z", pulls: 5, bestPull: null }),
      ],
    };

    const result = deriveProgression(details, current);

    expect(result.bosses[0]).toEqual(current.bosses[0]);
  });
});

describe("deriveProgression — name/slug reconciliation", () => {
  it("matches a CMS boss name to its API slug via the raidAttempt name map", () => {
    const details = makeDetails();
    const current = { ...emptyProgression, bosses: [boss("Imperator Averzian")] };

    const result = deriveProgression(details, current);

    expect(result.bosses[0].killed).toBe(true);
  });

  it("falls back to slugifying the CMS name when no API slug matches", () => {
    const details = makeDetails();
    const current = { ...emptyProgression, bosses: [boss("Totally Unknown Boss")] };

    const result = deriveProgression(details, current);

    expect(result.bosses[0].killed).toBe(false);
    expect(result.bosses[0].name).toBe("Totally Unknown Boss");
  });
});

describe("deriveProgression — pulls / bestPull rules", () => {
  it("sets pulls and bestPull while in progress (not killed, pullCount > 0)", () => {
    const details = makeDetails();
    const current = { ...emptyProgression, bosses: [boss("Vorasius")] };

    const result = deriveProgression(details, current);
    const vorasius = result.bosses[0];

    expect(vorasius.killed).toBe(false);
    expect(vorasius.pulls).toBe(30);
    expect(vorasius.bestPull).toBe(4.2);
  });

  it("clears bestPull once the boss is killed", () => {
    const details = makeDetails();
    const current = { ...emptyProgression, bosses: [boss("Imperator Averzian")] };

    const result = deriveProgression(details, current);
    const imperator = result.bosses[0];

    expect(imperator.killed).toBe(true);
    expect(imperator.bestPull).toBeNull();
  });

  it("leaves pulls/bestPull null when there is no attempt data", () => {
    const details = makeDetails();
    const current = { ...emptyProgression, bosses: [boss("Totally Unknown Boss")] };

    const result = deriveProgression(details, current);

    expect(result.bosses[0].pulls).toBeNull();
    expect(result.bosses[0].bestPull).toBeNull();
  });
});

describe("deriveProgression — rankings", () => {
  it("picks the Season's Rank Source raid's mythic ranks and attaches active member count", () => {
    const details = makeDetails();
    const current = { ...emptyProgression, bosses: [] };

    const result = deriveProgression(details, current);

    expect(result.rankings).toEqual({ world: 1375, region: 450, realm: 6, members: 0 });
  });

  it("throws when raidRankings is non-empty but lacks the Season's Rank Source raid, naming the slugs", () => {
    const details = makeDetails({
      raidRankings: [
        { raid: "tier-mn-2", ranks: { mythic: { world: 1, region: 1, realm: 1 } } },
        { raid: "sporefall", ranks: { mythic: { world: 900, region: 300, realm: 3 } } },
      ],
    });
    const current = { ...emptyProgression, bosses: [] };

    expect(() => deriveProgression(details, current)).toThrowError(
      /Rank source raid "tier-mn-1" not found in response\. Available: tier-mn-2, sporefall/,
    );
  });

  it("preserves existing world/region/realm ranks when raidRankings is empty (the guild-rename case)", () => {
    const details = makeDetails({ raidRankings: [] });
    const current = {
      ...emptyProgression,
      bosses: [],
      rankings: { world: 100, region: 50, realm: 5, members: 3 },
    };

    const result = deriveProgression(details, current);

    // members is always recomputed from this response's active-member count, never
    // preserved — it isn't a "rank" that goes stale, it's a live count of details.members.
    expect(result.rankings).toEqual({ world: 100, region: 50, realm: 5, members: 0 });
  });

  it("reads a different Season's Rank Source without a code change", () => {
    const details = makeDetails({
      raidRankings: [{ raid: "tier-mn-2", ranks: { mythic: { world: 5, region: 2, realm: 1 } } }],
    });
    const current = { ...emptyProgression, bosses: [], rankSourceRaidSlug: "tier-mn-2" };

    const result = deriveProgression(details, current);

    expect(result.rankings).toEqual({ world: 5, region: 2, realm: 1, members: 0 });
  });
});

describe("deriveProgression — empty boss list", () => {
  it("still derives rankings and M+ data when the Season has no bosses yet", () => {
    const details = makeDetails({ members: [member("Heyems", { score: 4000 })] });
    const current = { ...emptyProgression, bosses: [] };

    const result = deriveProgression(details, current);

    expect(result.bosses).toEqual([]);
    expect(result.kills).toBe(0);
    expect(result.rankings).toEqual({ world: 1375, region: 450, realm: 6, members: 1 });
    expect(result.mythicPlusParticipants).toHaveLength(1);
  });

  it("does not throw when both bosses and raidSlugs are empty — the normal mid-rollover state", () => {
    const details = makeDetails({ members: [member("Heyems", { score: 4000 })] });
    const current = { ...emptyProgression, bosses: [], raidSlugs: [] };

    expect(() => deriveProgression(details, current)).not.toThrow();
  });
});

describe("deriveProgression — raidSlugs configuration failure", () => {
  it("throws when the Season has bosses but no raidSlugs, since no kill could ever resolve", () => {
    const details = makeDetails();
    const current = { ...emptyProgression, raidSlugs: [], bosses: [boss("Imperator Averzian")] };

    expect(() => deriveProgression(details, current)).toThrowError(/no raidSlugs/);
  });
});

describe("deriveProgression — M+ Participants", () => {
  it("captures every Character with a score, while the Leaderboard stays capped at ten", () => {
    const scoredMembers = Array.from({ length: 12 }, (_, i) => member(`Runner${i}`, { score: 100 - i }));
    const details = makeDetails({ members: scoredMembers });
    const current = { ...emptyProgression, bosses: [] };

    const result = deriveProgression(details, current);

    expect(result.mythicPlusParticipants).toHaveLength(12);
    expect(result.mythicPlusRunners).toHaveLength(10);
    expect(result.mythicPlusParticipants[0].name).toBe("Runner0");
    expect(result.mythicPlusParticipants[11].name).toBe("Runner11");
  });

  it("excludes a member with no score", () => {
    const details = makeDetails({
      members: [member("Scored", { score: 100 }), member("Unscored", { score: 0 })],
    });
    const current = { ...emptyProgression, bosses: [] };

    const result = deriveProgression(details, current);

    expect(result.mythicPlusParticipants).toHaveLength(1);
    expect(result.mythicPlusParticipants[0].name).toBe("Scored");
  });

  it("preserves the existing Participants when the response has no scored members (e.g. after a guild rename)", () => {
    const details = makeDetails({ members: [] });
    const existing = [{ name: "OldParticipant", class: "Mage", spec: "Frost", score: 3000 }];
    const current = { ...emptyProgression, bosses: [], mythicPlusParticipants: existing };

    const result = deriveProgression(details, current);

    // A Sync must never be what destroys the roster history ADR 0005 protects —
    // no data this run is the guild-rename case, not evidence everyone left.
    expect(result.mythicPlusParticipants).toEqual(existing);
  });
});
