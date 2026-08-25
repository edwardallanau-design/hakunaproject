import { describe, expect, it } from "vitest";
import type { Season } from "@/payload-types";
import {
  availableDifficulties,
  initialDifficulty,
  killsByDifficulty,
  rankingsAt,
  toVenomProgression,
} from "@/lib/venomViewModel";

// The view model exists to pay the asymmetric-storage cost once: mythic in the
// flat fields, normal and heroic in groups. These tests pin that the split
// never leaks past this seam, and that the render-state rule is decided here
// rather than in JSX.

function boss(name: string, at: Partial<Record<"mythic" | "normal" | "heroic", unknown>> = {}) {
  const m = (at.mythic ?? {}) as Record<string, unknown>;
  return {
    name,
    killed: m.killed ?? false,
    firstDefeated: m.firstDefeated ?? null,
    pulls: m.pulls ?? null,
    bestPull: m.bestPull ?? null,
    ...(at.normal ? { normal: at.normal } : {}),
    ...(at.heroic ? { heroic: at.heroic } : {}),
  };
}

function season(overrides: Partial<Season> = {}): Season {
  return {
    id: 2,
    name: "The Curse of Ula'tek",
    urlSlug: "season-2",
    themeSlug: "venom",
    startedAt: "2026-08-12T00:00:00.000Z",
    rankSourceRaidSlug: "the-venomous-abyss",
    mythicPlusSeasonSlug: "season-mn-2",
    bosses: [],
    rankings: { world: 0, region: 0, realm: 0, members: 165 },
    updatedAt: "",
    createdAt: "",
    ...overrides,
  } as unknown as Season;
}

describe("killsByDifficulty reads both storage shapes", () => {
  it("counts mythic from the flat fields and the rest from groups", () => {
    const s = season({
      bosses: [
        boss("A", { mythic: { killed: true }, normal: { killed: true }, heroic: { killed: true } }),
        boss("B", { normal: { killed: true }, heroic: { killed: true } }),
        boss("C", { normal: { killed: true } }),
      ],
    } as Partial<Season>);

    expect(killsByDifficulty(s)).toEqual({ normal: 3, heroic: 2, mythic: 1 });
  });

  it("treats a missing group as no kill rather than throwing", () => {
    // Season 1's rows have no groups at all.
    const s = season({ bosses: [boss("A", { mythic: { killed: true } })] } as Partial<Season>);

    expect(killsByDifficulty(s)).toEqual({ normal: 0, heroic: 0, mythic: 1 });
  });
});

describe("the difficulty the page opens on", () => {
  it("is the hardest with a kill", () => {
    const s = season({
      bosses: [boss("A", { normal: { killed: true }, heroic: { killed: true } })],
    } as Partial<Season>);

    expect(initialDifficulty(s)).toBe("heroic");
  });

  it("is normal for a Season that has not started", () => {
    const s = season({ bosses: [boss("A")] } as Partial<Season>);

    expect(initialDifficulty(s)).toBe("normal");
  });

  it("offers only difficulties with kills", () => {
    const s = season({
      bosses: [boss("A", { normal: { killed: true }, heroic: { killed: true } })],
    } as Partial<Season>);

    expect(availableDifficulties(s)).toEqual(["normal", "heroic"]);
  });

  it("still offers one option when nothing is killed", () => {
    // An empty toggle would be a worse control than a single-item one.
    const s = season({ bosses: [boss("A")] } as Partial<Season>);

    expect(availableDifficulties(s)).toEqual(["normal"]);
  });
});

describe("boss render state", () => {
  it("is dead when killed", () => {
    const s = season({
      bosses: [boss("A", { heroic: { killed: true, firstDefeated: "2026-08-21T00:00:00.000Z" } })],
    } as Partial<Season>);

    const vm = toVenomProgression(s, "heroic");
    expect(vm.bosses[0].state).toBe("dead");
    expect(vm.bosses[0].firstDefeated).toBe("2026-08-21T00:00:00.000Z");
  });

  it("is prog when pulled but not killed", () => {
    const s = season({
      bosses: [boss("A", { heroic: { killed: false, pulls: 14, bestPull: 18.7 } })],
    } as Partial<Season>);

    const vm = toVenomProgression(s, "heroic");
    expect(vm.bosses[0].state).toBe("prog");
    expect(vm.bosses[0].bestPull).toBe(18.7);
  });

  it("is sealed when never pulled", () => {
    const s = season({ bosses: [boss("A", { heroic: { killed: false } })] } as Partial<Season>);

    expect(toVenomProgression(s, "heroic").bosses[0].state).toBe("sealed");
  });

  it("hides a zero best-pull rather than rendering 'BEST 0.0%'", () => {
    // Every live bestPercent from upstream is currently 0.0000%. A chip reading
    // "BEST 0.0%" looks like a bug, so the pull count is shown instead.
    const s = season({
      bosses: [boss("A", { heroic: { killed: false, pulls: 14, bestPull: 0 } })],
    } as Partial<Season>);

    const vm = toVenomProgression(s, "heroic");
    expect(vm.bosses[0].state).toBe("prog");
    expect(vm.bosses[0].bestPull).toBeNull();
    expect(vm.bosses[0].pulls).toBe(14);
  });
});

describe("progression totals follow the displayed difficulty", () => {
  it("counts and percentages change with the difficulty", () => {
    const s = season({
      bosses: [
        boss("A", { normal: { killed: true }, heroic: { killed: true } }),
        boss("B", { normal: { killed: true } }),
        boss("C", {}),
      ],
    } as Partial<Season>);

    expect(toVenomProgression(s, "normal")).toMatchObject({ kills: 2, totalBosses: 3, pct: 67 });
    expect(toVenomProgression(s, "heroic")).toMatchObject({ kills: 1, totalBosses: 3, pct: 33 });
    expect(toVenomProgression(s, "mythic")).toMatchObject({ kills: 0, totalBosses: 3, pct: 0 });
  });

  it("does not divide by zero for a Season with no bosses", () => {
    expect(toVenomProgression(season(), "mythic").pct).toBe(0);
  });
});

describe("ranks follow the displayed difficulty", () => {
  it("reads heroic ranks rather than mythic's zeros", () => {
    // The real Season 2 case: mythic ranks are 0/0/0 because there is no mythic
    // progress, while heroic is world 2450. Showing mythic would read as
    // "unranked" when the guild is ranked.
    const s = season({
      rankings: { world: 0, region: 0, realm: 0, members: 165 },
      rankingsHeroic: { world: 2450, region: 802, realm: 13 },
      rankingsNormal: { world: 2886, region: 1236, realm: 19 },
    } as Partial<Season>);

    expect(rankingsAt(s, "heroic")).toEqual({ world: 2450, region: 802, realm: 13 });
    expect(rankingsAt(s, "normal")).toEqual({ world: 2886, region: 1236, realm: 19 });
    expect(rankingsAt(s, "mythic")).toEqual({ world: 0, region: 0, realm: 0 });
  });

  it("returns zeros rather than null when a group is absent", () => {
    expect(rankingsAt(season(), "heroic")).toEqual({ world: 0, region: 0, realm: 0 });
  });
});
