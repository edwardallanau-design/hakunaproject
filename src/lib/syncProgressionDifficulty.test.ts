import { describe, expect, it } from "vitest";
import { deriveProgression, defaultDifficulty } from "@/lib/syncProgression";
import type { GuildDetailsData } from "@/lib/raiderio";

// Per-difficulty derivation. The upstream payload has always carried normal,
// heroic and mythic — the Zod boundary validates all three as records — and
// derivation simply discarded everything but mythic. These tests pin the
// behaviour of reading all three.
//
// The stored shape is deliberately ASYMMETRIC: a boss's flat `killed`/
// `firstDefeated`/`pulls`/`bestPull` stay canonical **mythic**, and `normal`
// and `heroic` arrive as their own groups. That keeps Season 1's rows
// byte-identical — no backfill, nothing to reverse — which is what "keep
// Season 1 exactly as stored" requires.

const RAID = "the-venomous-abyss";

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
      {
        raid: RAID,
        ranks: {
          normal: { world: 2886, region: 1236, realm: 19 },
          heroic: { world: 2442, region: 799, realm: 13 },
          mythic: { world: 0, region: 0, realm: 0 },
        },
      },
    ],
    raidProgress: [
      {
        raid: RAID,
        aotc: null,
        cuttingEdge: null,
        encountersDefeated: {
          normal: [
            { slug: "nekzali-the-soulcoiler", firstDefeated: "2026-08-20T11:03:46.000Z" },
            { slug: "entombed-sentinels", firstDefeated: "2026-08-20T12:42:46.000Z" },
          ],
          heroic: [
            { slug: "nekzali-the-soulcoiler", firstDefeated: "2026-08-21T13:30:22.000Z" },
          ],
          mythic: [],
        },
      },
    ],
    raidAttempt: [
      {
        raid: RAID,
        encounters: {
          normal: [
            {
              slug: "nekzali-the-soulcoiler",
              name: "Nek'zali the Soulcoiler",
              bestPercent: 0,
              pullCount: 2,
              pullStartedAt: "2026-08-20T11:00:00.000Z",
              lastPullAt: "2026-08-20T11:03:46.000Z",
            },
          ],
          heroic: [
            {
              slug: "nekzali-the-soulcoiler",
              name: "Nek'zali the Soulcoiler",
              bestPercent: 0,
              pullCount: 1,
              pullStartedAt: "2026-08-21T13:22:51.000Z",
              lastPullAt: "2026-08-21T13:22:51.000Z",
            },
            {
              slug: "entombed-sentinels",
              name: "Entombed Sentinels",
              bestPercent: 18.7,
              pullCount: 14,
              pullStartedAt: "2026-08-21T14:00:00.000Z",
              lastPullAt: "2026-08-22T14:00:00.000Z",
            },
          ],
          mythic: [],
        },
      },
    ],
    members: [],
    ...overrides,
  };
}

type Progress = {
  killed: boolean;
  firstDefeated?: string | null;
  pulls?: number | null;
  bestPull?: number | null;
};
type StoredBoss = Progress & { name: string; normal?: Progress | null; heroic?: Progress | null };

// Groups are optional, mirroring the stored shape: a boss row only carries
// `normal`/`heroic` once there is something to record for them.
function boss(name: string, extra: Partial<StoredBoss> = {}): StoredBoss {
  return {
    name,
    killed: false,
    firstDefeated: null,
    pulls: null,
    bestPull: null,
    normal: { killed: false, firstDefeated: null, pulls: null, bestPull: null },
    heroic: { killed: false, firstDefeated: null, pulls: null, bestPull: null },
    ...extra,
  };
}

const baseState = {
  bosses: [] as StoredBoss[],
  kills: 0,
  totalBosses: 0,
  rankings: null,
  mythicPlusRunners: [],
  mythicPlusParticipants: [],
  raidSlugs: [RAID],
  rankSourceRaidSlug: RAID,
};

describe("deriveProgression — per-difficulty kills", () => {
  it("records kills at every difficulty, not just mythic", () => {
    const current = {
      ...baseState,
      bosses: [boss("Nek'zali the Soulcoiler"), boss("Entombed Sentinels")],
    };

    const result = deriveProgression(makeDetails(), current);
    const nek = result.bosses.find((b) => b.name === "Nek'zali the Soulcoiler")!;

    expect(nek.normal?.killed).toBe(true);
    expect(nek.normal?.firstDefeated).toBe("2026-08-20T11:03:46.000Z");
    expect(nek.heroic?.killed).toBe(true);
    expect(nek.heroic?.firstDefeated).toBe("2026-08-21T13:30:22.000Z");
    // Flat fields remain canonical mythic, and mythic has no kills here.
    expect(nek.killed).toBe(false);
    expect(nek.firstDefeated).toBeNull();
  });

  it("keeps each difficulty's first-kill date distinct", () => {
    const current = { ...baseState, bosses: [boss("Nek'zali the Soulcoiler")] };
    const nek = deriveProgression(makeDetails(), current).bosses[0];

    // The same boss, killed on different days at different difficulties.
    expect(nek.normal?.firstDefeated).not.toBe(nek.heroic?.firstDefeated);
  });

  it("records pull counts and best-pull percentages per difficulty", () => {
    const current = { ...baseState, bosses: [boss("Entombed Sentinels")] };
    const ent = deriveProgression(makeDetails(), current).bosses[0];

    // Killed on normal, so no in-progress best percent there.
    expect(ent.normal?.killed).toBe(true);
    // Not killed on heroic: 14 pulls, best 18.7%.
    expect(ent.heroic?.killed).toBe(false);
    expect(ent.heroic?.pulls).toBe(14);
    expect(ent.heroic?.bestPull).toBe(18.7);
  });

  it("counts kills per difficulty", () => {
    const current = {
      ...baseState,
      bosses: [boss("Nek'zali the Soulcoiler"), boss("Entombed Sentinels")],
    };
    const result = deriveProgression(makeDetails(), current);

    expect(result.killsByDifficulty.normal).toBe(2);
    expect(result.killsByDifficulty.heroic).toBe(1);
    expect(result.killsByDifficulty.mythic).toBe(0);
    // `kills` stays canonical mythic for existing consumers.
    expect(result.kills).toBe(0);
  });
});

describe("deriveProgression — the kill lock is per difficulty", () => {
  it("freezes a difficulty once killed, while a harder one still progresses", () => {
    // Stored heroic kill carries hand-corrected data upstream no longer agrees
    // with — exactly the Season 1 case where the API rewrote its own history.
    const current = {
      ...baseState,
      bosses: [
        boss("Nek'zali the Soulcoiler", {
          heroic: {
            killed: true,
            firstDefeated: "2026-01-01T00:00:00.000Z",
            pulls: 999,
            bestPull: null,
          },
        }),
      ],
    };

    const nek = deriveProgression(makeDetails(), current).bosses[0];

    // Heroic is frozen: the stored date and pull count survive.
    expect(nek.heroic?.firstDefeated).toBe("2026-01-01T00:00:00.000Z");
    expect(nek.heroic?.pulls).toBe(999);
    // Normal was not locked, so it derives fresh.
    expect(nek.normal?.killed).toBe(true);
    expect(nek.normal?.firstDefeated).toBe("2026-08-20T11:03:46.000Z");
  });

  it("a locked mythic kill does not freeze the easier difficulties", () => {
    const current = {
      ...baseState,
      bosses: [
        boss("Nek'zali the Soulcoiler", {
          killed: true,
          firstDefeated: "2026-09-01T00:00:00.000Z",
          pulls: 50,
        }),
      ],
    };

    const nek = deriveProgression(makeDetails(), current).bosses[0];

    expect(nek.firstDefeated).toBe("2026-09-01T00:00:00.000Z");
    expect(nek.pulls).toBe(50);
    expect(nek.heroic?.killed).toBe(true);
    expect(nek.heroic?.firstDefeated).toBe("2026-08-21T13:30:22.000Z");
  });

  it("leaves an archived Season's bosses byte-identical", () => {
    // Season 1's rows predate difficulty tracking: mythic-killed, no groups,
    // and its raids report nothing new. A Sync must not append empty normal
    // and heroic groups to a frozen archive — the row has to come back exactly
    // as it went in.
    const stored = {
      name: "Midnight Falls",
      killed: true,
      firstDefeated: "2026-07-17T00:00:00.000Z",
      pulls: 608,
      bestPull: null,
    };
    const current = { ...baseState, bosses: [stored] };

    const result = deriveProgression(makeDetails(), current);

    expect(result.bosses[0]).toEqual(stored);
    expect(result.bosses[0]).not.toHaveProperty("normal");
    expect(result.bosses[0]).not.toHaveProperty("heroic");
  });
});

describe("deriveProgression — rankings per difficulty", () => {
  it("stores ranks for every difficulty the rank source reports", () => {
    const current = { ...baseState, bosses: [boss("Nek'zali the Soulcoiler")] };
    const result = deriveProgression(makeDetails(), current);

    expect(result.rankingsByDifficulty.heroic).toMatchObject({
      world: 2442,
      region: 799,
      realm: 13,
    });
    expect(result.rankingsByDifficulty.normal).toMatchObject({ world: 2886 });
    // Flat `rankings` stays mythic, as the existing site reads it.
    expect(result.rankings.world).toBe(0);
  });

  it("preserves a difficulty's stored ranks when the response has none", () => {
    // The guild-rename case, per difficulty: an empty rankings response must
    // never wipe what is already recorded.
    const current = {
      ...baseState,
      bosses: [boss("Nek'zali the Soulcoiler")],
      rankingsByDifficulty: {
        heroic: { world: 111, region: 22, realm: 3, members: 0 },
      },
    };
    const details = makeDetails({ raidRankings: [] });

    const result = deriveProgression(details, current);

    expect(result.rankingsByDifficulty.heroic).toMatchObject({ world: 111, region: 22, realm: 3 });
  });
});

describe("defaultDifficulty — highest with an actual kill", () => {
  it("picks mythic when mythic has kills", () => {
    expect(defaultDifficulty({ normal: 8, heroic: 4, mythic: 1 })).toBe("mythic");
  });

  it("picks heroic when mythic has none", () => {
    expect(defaultDifficulty({ normal: 8, heroic: 4, mythic: 0 })).toBe("heroic");
  });

  it("picks normal when only normal has kills", () => {
    expect(defaultDifficulty({ normal: 3, heroic: 0, mythic: 0 })).toBe("normal");
  });

  it("falls back to normal when nothing is killed anywhere", () => {
    // A Season that has just started. Showing an empty normal list reads as
    // "not started", where an empty mythic list would read as "0/9 mythic" and
    // under-report a guild that simply has not raided yet.
    expect(defaultDifficulty({ normal: 0, heroic: 0, mythic: 0 })).toBe("normal");
  });

  it("does NOT promote a difficulty that only has attempts", () => {
    // One exploratory mythic pull must not flip the page to 0/9 Mythic and
    // hide real heroic progress — the exact under-reporting the toggle exists
    // to prevent.
    expect(defaultDifficulty({ normal: 8, heroic: 4, mythic: 0 })).toBe("heroic");
  });
});
