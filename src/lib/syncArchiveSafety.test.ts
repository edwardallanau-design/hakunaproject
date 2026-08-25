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

describe("an archived Season's M+ snapshot does NOT survive a Sync", () => {
  it("replaces the stored participants with the live roster", () => {
    // Documents a REAL HAZARD rather than a guarantee.
    //
    // `mythicPlusParticipants` preserves only when the fetch returns nothing —
    // the guild-rename case. It has no notion of the Season being archived. So
    // making Season 1 current again and syncing would overwrite its 595-strong
    // Season 1 roster with whatever the CURRENT M+ season reports, because
    // Raider.IO's roster exposes only current-season scores.
    //
    // Nothing reaches this today (the Sync writes only to the current Season),
    // and the difficulty work neither caused nor worsened it. It is pinned here
    // so the exposure is visible instead of implicit, and so a future guard has
    // a failing test to flip.
    const details = makeDetails({
      members: [member("Buratski", 3386.7), member("Chocomann", 3260.7)],
    });

    const result = deriveProgression(details, archivedState);

    expect(result.mythicPlusParticipants).toHaveLength(2);
    expect(result.mythicPlusParticipants[0].name).toBe("Buratski");
    // Heyems, the real Season 1 champion, is gone.
    expect(result.mythicPlusParticipants.map((p) => p.name)).not.toContain("Heyems");
  });

  it("still preserves the snapshot when the roster comes back empty", () => {
    // The guarantee that DOES hold: an empty fetch never wipes the archive.
    const result = deriveProgression(makeDetails(), archivedState);

    expect(result.mythicPlusParticipants).toHaveLength(2);
    expect(result.mythicPlusParticipants[0].name).toBe("Heyems");
  });
});
