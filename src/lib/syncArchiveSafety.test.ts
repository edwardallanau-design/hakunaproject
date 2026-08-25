import { describe, expect, it } from "vitest";
import { deriveProgression } from "@/lib/syncProgression";
import type { GuildDetailsData } from "@/lib/raiderio";

// What a Sync does to an ARCHIVED Season's snapshot.
//
// ADR 0005 makes an archived Season a frozen snapshot, and the operator
// reaffirmed on 2026-08-25 that Season 1 must stay exactly as stored. Normally
// nothing can reach it: the Sync writes only to `guild-settings.currentSeason`.
// But "unreachable" is a property of the caller, not of the derivation — and
// derivation is where the guarantee has to live, because a Season can be made
// current again by a single field edit in the admin panel.
//
// These tests pin what actually happens in that case, including one thing that
// is genuinely unsafe.

const RAID = "tier-mn-1";

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
      { raid: RAID, ranks: { mythic: { world: 1375, region: 450, realm: 6 } } },
    ],
    raidProgress: [
      {
        raid: RAID,
        aotc: null,
        cuttingEdge: null,
        // Upstream still reports normal and heroic kills for Season 1's raid —
        // it demonstrably does, since tier-mn-1 has not gone anywhere.
        encountersDefeated: {
          normal: [{ slug: "midnight-falls", firstDefeated: "2026-05-01T00:00:00.000Z" }],
          heroic: [{ slug: "midnight-falls", firstDefeated: "2026-06-01T00:00:00.000Z" }],
          mythic: [{ slug: "midnight-falls", firstDefeated: "2026-07-17T00:00:00.000Z" }],
        },
      },
    ],
    raidAttempt: [
      {
        raid: RAID,
        encounters: {
          normal: [
            {
              slug: "midnight-falls",
              name: "Midnight Falls",
              bestPercent: 0,
              pullCount: 3,
              pullStartedAt: "2026-05-01T00:00:00.000Z",
              lastPullAt: "2026-05-01T00:00:00.000Z",
            },
          ],
          mythic: [
            {
              slug: "midnight-falls",
              name: "Midnight Falls",
              bestPercent: 0,
              // Upstream has rewritten this: the archive says 608.
              pullCount: 12,
              pullStartedAt: "2026-07-01T00:00:00.000Z",
              lastPullAt: "2026-07-17T00:00:00.000Z",
            },
          ],
        },
      },
    ],
    members: [],
    ...overrides,
  };
}

function member(name: string, score: number) {
  return {
    character: { name, class: { name: "Warrior" }, spec: { name: "Fury" } },
    keystoneScores: { allScore: score },
    raidProgress: { progress: { normal: 0, heroic: 0, mythic: 0 } },
  } as unknown as GuildDetailsData["members"][number];
}

// Season 1 as actually stored: mythic-killed, no difficulty groups.
const archivedBoss = {
  name: "Midnight Falls",
  killed: true,
  firstDefeated: "2026-07-17T00:00:00.000Z",
  pulls: 608,
  bestPull: null,
};

const archivedState = {
  bosses: [archivedBoss],
  kills: 1,
  totalBosses: 1,
  rankings: { world: 1375, region: 450, realm: 6, members: 595 },
  mythicPlusRunners: [
    { name: "Heyems", class: "Demon Hunter", spec: "Devourer", score: 4234 },
  ],
  mythicPlusParticipants: [
    { name: "Heyems", class: "Demon Hunter", spec: "Devourer", score: 4234 },
    { name: "Exyie", class: "Evoker", spec: "Augmentation", score: 4208.9 },
  ],
  raidSlugs: [RAID],
  rankSourceRaidSlug: RAID,
  // The whole point: the caller declares this Season is an archive.
  isArchived: true,
};

describe("an archived Season's bosses survive a Sync", () => {
  it("keeps mythic data even when upstream now disagrees", () => {
    // Upstream says 12 pulls; the archive says 608. Raider.IO really does
    // rewrite its own history — four of Season 1's rows changed after the
    // fact, and Salhadaar's count fell from 41 to 6.
    const result = deriveProgression(makeDetails(), archivedState);

    expect(result.bosses[0].pulls).toBe(608);
    expect(result.bosses[0].firstDefeated).toBe("2026-07-17T00:00:00.000Z");
  });

  it("does not attach difficulty groups, even though upstream reports them", () => {
    // The kill lock short-circuits before the group logic, so a mythic-killed
    // boss never gains normal/heroic. This is what keeps Season 1's rows
    // byte-identical rather than merely equivalent.
    const result = deriveProgression(makeDetails(), archivedState);

    expect(result.bosses[0]).not.toHaveProperty("normal");
    expect(result.bosses[0]).not.toHaveProperty("heroic");
    expect(result.bosses[0]).toEqual(archivedBoss);
  });
});

describe("the archive guard survives Payload's hydration", () => {
  // The shape that actually reaches the route. The migration adds `killed` as
  // DEFAULT false, so Payload materialises a full empty group on every boss
  // that has never been touched at that difficulty — including all ten of
  // Season 1's.
  //
  // This is why the guard cannot be inferred from the row: a hydrated archive
  // boss and a live Season's mythic-first kill are the same shape. Two earlier
  // attempts inferred it and both were wrong, and neither the unit tests
  // (which passed bare objects) nor a live probe (which read a pre-migration
  // database) caught the second one — a code review did.
  const hydratedArchiveBoss = {
    ...archivedBoss,
    normal: { killed: false, firstDefeated: null, pulls: null, bestPull: null },
    heroic: { killed: false, firstDefeated: null, pulls: null, bestPull: null },
  };

  it("leaves a hydrated archive row unchanged", () => {
    const result = deriveProgression(makeDetails(), {
      ...archivedState,
      bosses: [hydratedArchiveBoss],
    });

    expect(result.bosses[0]).toEqual(hydratedArchiveBoss);
  });

  it("does not let upstream fill the hydrated empty groups", () => {
    // Upstream has real normal and heroic kills for this exact slug. Without
    // the content check they would be written into the archive.
    const result = deriveProgression(makeDetails(), {
      ...archivedState,
      bosses: [hydratedArchiveBoss],
    });

    expect(result.bosses[0].normal?.killed).toBe(false);
    expect(result.bosses[0].normal?.firstDefeated).toBeNull();
    expect(result.bosses[0].heroic?.killed).toBe(false);
    expect(result.bosses[0].pulls).toBe(608);
  });

  it("still records difficulties for a live Season with hydrated empties", () => {
    // The guard must not over-fire: a boss NOT killed on mythic still derives
    // normally, even though its groups arrive hydrated-empty too.
    const liveBoss = {
      name: "Midnight Falls",
      killed: false,
      firstDefeated: null,
      pulls: null,
      bestPull: null,
      normal: { killed: false, firstDefeated: null, pulls: null, bestPull: null },
      heroic: { killed: false, firstDefeated: null, pulls: null, bestPull: null },
    };

    const result = deriveProgression(makeDetails(), {
      ...archivedState,
      isArchived: false,
      bosses: [liveBoss],
    });

    expect(result.bosses[0].normal?.killed).toBe(true);
    expect(result.bosses[0].heroic?.killed).toBe(true);
    expect(result.bosses[0].killed).toBe(true);
  });
});

describe("an archived Season's M+ snapshot survives a Sync", () => {
  it("keeps the stored roster even when the live roster is full", () => {
    // The dangerous case. Raider.IO's roster exposes only the CURRENT M+
    // season's scores, so deriving an archive from a live response does not
    // refresh the snapshot — it replaces it with different data under the same
    // label. Season 1's 595 participants would become the current season's
    // ~160, and its champion would change from Heyems to whoever leads today.
    const details = makeDetails({
      members: [member("Buratski", 3386.7), member("Chocomann", 3260.7)],
    });

    const result = deriveProgression(details, archivedState);

    expect(result.mythicPlusParticipants.map((p) => p.name)).toEqual(["Heyems", "Exyie"]);
    expect(result.mythicPlusRunners[0].name).toBe("Heyems");
    expect(result.mythicPlusParticipants.map((p) => p.name)).not.toContain("Buratski");
  });

  it("still preserves the snapshot when the roster comes back empty", () => {
    const result = deriveProgression(makeDetails(), archivedState);

    expect(result.mythicPlusParticipants).toHaveLength(2);
    expect(result.mythicPlusParticipants[0].name).toBe("Heyems");
  });

  it("does NOT freeze a live Season's roster", () => {
    // The guard must not over-fire: without isArchived, the live roster wins.
    const details = makeDetails({
      members: [member("Buratski", 3386.7), member("Chocomann", 3260.7)],
    });

    const result = deriveProgression(details, { ...archivedState, isArchived: false });

    expect(result.mythicPlusParticipants.map((p) => p.name)).toEqual(["Buratski", "Chocomann"]);
  });
});
