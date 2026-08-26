import { describe, expect, it } from "vitest";
import {
  buildRotation,
  countActiveCharacters,
  CATEGORIES,
  GUILD_GROUP_MIN,
  MIN_KEY_LEVEL,
  mergeStoredRuns,
  RECENCY_WINDOW_MS,
  RUN_RETENTION_MS,
  type GuildRun,
  type RunMember,
} from "@/lib/dungeonRotation";

// The section's whole reason for changing is that its old selection rule could
// not move: one best key per dungeon, ties broken by the *faster* clear. These
// tests pin the four categories that replaced it, the sign on a closest call —
// which the design's own prototype got wrong in one direction only — and the
// interleave that keeps a double-badged run off two adjacent tiles.

const T0 = Date.parse("2026-08-20T12:00:00.000Z");
const iso = (hoursAgo: number) => new Date(T0 - hoursAgo * 3600_000).toISOString();

let nextId = 1;

function member(name: string, role = "dps"): RunMember {
  return { name, class: "Mage", spec: "Arcane", role };
}

function run(over: Partial<GuildRun> & { dungeon: string }): GuildRun {
  return {
    keystoneRunId: nextId++,
    // Levels are written relative to the floor throughout, so moving
    // MIN_KEY_LEVEL does not silently gut the suite by dropping every fixture.
    mythicLevel: MIN_KEY_LEVEL + 2,
    clearTimeMs: 1_500_000,
    parTimeMs: 1_800_000,
    timed: true,
    completedAt: iso(24),
    members: [member("Solo")],
    ...over,
  };
}

/**
 * Every fixture is dated relative to T0, so the clock is pinned there rather
 * than left to run against the wall. Without this the whole suite would quietly
 * empty out two days after it was written — which is exactly what
 * RECENCY_WINDOW_MS does to real runs, and precisely why `buildRotation` takes
 * `now` as a parameter instead of calling `Date.now()` inside the loop.
 */
const build = (runs: GuildRun[]) => buildRotation(runs, T0);

/** The tile for one category, or undefined if the category produced none. */
const tileFor = (tiles: ReturnType<typeof buildRotation>, dungeon: string, category: string) =>
  tiles.find((t) => t.dungeon === dungeon && t.category === category);

// The key floor is currently **disarmed** (MIN_KEY_LEVEL = 0) for the early
// season, so these guard the mechanism rather than a live policy — they must
// keep passing when it is raised again, which is why every level here is
// written relative to the constant.
describe(`the +${MIN_KEY_LEVEL} floor`, () => {
  it("drops runs below it, so a low key cannot headline a tile", () => {
    const tiles = build([
      run({ dungeon: "Kings' Rest", mythicLevel: MIN_KEY_LEVEL, members: [member("Kept")] }),
      run({ dungeon: "Kings' Rest", mythicLevel: MIN_KEY_LEVEL - 1, completedAt: iso(0), members: [member("Dropped")] }),
    ]);
    expect(tiles.flatMap((t) => t.members.map((m) => m.name))).not.toContain("Dropped");
    // The newer run is the one that was dropped — the floor beats recency.
    expect(tileFor(tiles, "Kings' Rest", "latest-run")!.members[0].name).toBe("Kept");
  });

  it("drops a dungeon entirely when nothing there clears the floor", () => {
    const tiles = build([
      run({ dungeon: "Kings' Rest" }),
      run({ dungeon: "Voidscar Arena", mythicLevel: MIN_KEY_LEVEL - 1 }),
    ]);
    expect(tiles.map((t) => t.dungeon)).not.toContain("Voidscar Arena");
  });
});

describe("best key", () => {
  it("takes the highest level, including a depleted one", () => {
    const tiles = build([
      run({ dungeon: "Kings' Rest", mythicLevel: 14, timed: true, clearTimeMs: 1_000_000 }),
      run({ dungeon: "Kings' Rest", mythicLevel: 16, timed: false, clearTimeMs: 1_999_000 }),
    ]);
    const tile = tileFor(tiles, "Kings' Rest", "best-key")!;
    expect(tile.mythicLevel).toBe(16);
    expect(tile.outcome).toBe("OVER");
  });

  it("breaks ties on recency, not on the faster clear", () => {
    // The old grid preferred the faster run, which is why an equalled key never
    // changed the card. Recency is the entire point of the rewrite.
    const tiles = build([
      run({ dungeon: "Murder Row", mythicLevel: 15, clearTimeMs: 1_000_000, completedAt: iso(72), members: [member("Older")] }),
      run({ dungeon: "Murder Row", mythicLevel: 15, clearTimeMs: 1_700_000, completedAt: iso(2), members: [member("Newer")] }),
    ]);
    expect(tileFor(tiles, "Murder Row", "best-key")!.members[0].name).toBe("Newer");
  });
});

describe("latest run", () => {
  it("takes the most recent run regardless of level", () => {
    const tiles = build([
      run({ dungeon: "Altar of Fangs", mythicLevel: 18, completedAt: iso(50), members: [member("Record")] }),
      run({ dungeon: "Altar of Fangs", mythicLevel: MIN_KEY_LEVEL, completedAt: iso(1), members: [member("Fresh")] }),
    ]);
    const tile = tileFor(tiles, "Altar of Fangs", "latest-run")!;
    expect(tile.mythicLevel).toBe(MIN_KEY_LEVEL);
    expect(tile.members[0].name).toBe("Fresh");
  });
});

describe("closest call", () => {
  it("keeps the clear time in the stat slot and puts the margin in the outcome", () => {
    // The margin used to occupy the stat slot, so a real 29:57 clear rendered
    // as "0:03" in the same position and format that every other tile uses for
    // a half-hour duration — and read as a three-second dungeon.
    const tiles = build([
      run({ dungeon: "Voidscar Arena", timed: true, clearTimeMs: 1_797_000, parTimeMs: 1_800_000 }),
    ]);
    const tile = tileFor(tiles, "Voidscar Arena", "closest-call")!;
    expect(tile.stat).toBe("29:57");
    expect(tile.outcome).toBe("SPARE BY 0:03");
  });

  it("shows OVER when it did not — the prototype hardcoded SPARE for both", () => {
    const tiles = build([
      run({ dungeon: "Voidscar Arena", timed: false, clearTimeMs: 1_803_000, parTimeMs: 1_800_000 }),
    ]);
    const tile = tileFor(tiles, "Voidscar Arena", "closest-call")!;
    expect(tile.stat).toBe("30:03");
    expect(tile.outcome).toBe("OVER BY 0:03");
    expect(tile.timed).toBe(false);
  });

  it("reads the same as every other category in the stat slot", () => {
    const one = run({ dungeon: "Kings' Rest", clearTimeMs: 1_762_000, parTimeMs: 1_800_000 });
    const tiles = build([one]);
    const stats = new Set(tiles.filter((t) => t.dungeon === "Kings' Rest").map((t) => t.stat));
    expect([...stats]).toEqual(["29:22"]);
  });

  it("measures the gap in either direction, so a heartbreak can win it", () => {
    const tiles = build([
      run({ dungeon: "Den of Nalorakk", timed: true, clearTimeMs: 1_780_000, parTimeMs: 1_800_000, members: [member("Comfortable")] }),
      run({ dungeon: "Den of Nalorakk", timed: false, clearTimeMs: 1_804_000, parTimeMs: 1_800_000, members: [member("Heartbreak")] }),
    ]);
    const tile = tileFor(tiles, "Den of Nalorakk", "closest-call")!;
    expect(tile.members[0].name).toBe("Heartbreak");
    expect(tile.outcome).toBe("OVER BY 0:04");
  });
});

describe("guild group", () => {
  it(`omits the tile below ${GUILD_GROUP_MIN} members`, () => {
    const below = Array.from({ length: GUILD_GROUP_MIN - 1 }, (_, i) => member(`M${i}`));
    const tiles = build([run({ dungeon: "Temple of Sethraliss", members: below })]);
    expect(tileFor(tiles, "Temple of Sethraliss", "guild-group")).toBeUndefined();
    // The other three still render — an empty category costs one tile, not the
    // dungeon.
    expect(tiles.filter((t) => t.dungeon === "Temple of Sethraliss")).toHaveLength(3);
  });

  it(`takes the tile at exactly ${GUILD_GROUP_MIN}`, () => {
    const at = Array.from({ length: GUILD_GROUP_MIN }, (_, i) => member(`M${i}`));
    const tiles = build([run({ dungeon: "Temple of Sethraliss", members: at })]);
    expect(tileFor(tiles, "Temple of Sethraliss", "guild-group")).toBeDefined();
  });

  it("prefers the biggest group over the highest key", () => {
    const tiles = build([
      run({ dungeon: "Murder Row", mythicLevel: 18, members: [member("A"), member("B"), member("C")] }),
      run({ dungeon: "Murder Row", mythicLevel: MIN_KEY_LEVEL, members: [member("D"), member("E"), member("F"), member("G")] }),
    ]);
    expect(tileFor(tiles, "Murder Row", "guild-group")!.mythicLevel).toBe(MIN_KEY_LEVEL);
  });
});

describe("tiles", () => {
  it("orders the party tank, healer, then dps", () => {
    const tiles = build([
      run({
        dungeon: "Kings' Rest",
        members: [member("Zed", "dps"), member("Ana", "healer"), member("Tam", "tank")],
      }),
    ]);
    expect(tileFor(tiles, "Kings' Rest", "best-key")!.members.map((m) => m.name)).toEqual(["Tam", "Ana", "Zed"]);
  });

  it("formats the clear time as mm:ss", () => {
    const tiles = build([run({ dungeon: "Kings' Rest", clearTimeMs: 1_762_000 })]);
    expect(tileFor(tiles, "Kings' Rest", "best-key")!.stat).toBe("29:22");
  });

  it("keeps a run that wins two categories on both tiles", () => {
    // One run wearing two badges is two true statements. Deduping would blank
    // whichever tile lost the coin toss.
    const only = run({ dungeon: "Kings' Rest", members: [member("A"), member("B"), member("C")] });
    const tiles = build([only]);
    expect(tiles.filter((t) => t.dungeon === "Kings' Rest")).toHaveLength(CATEGORIES.length);
  });
});

describe("the recency window", () => {
  it("drops a run older than the window, however good it was", () => {
    const tiles = build([
      run({ dungeon: "Kings' Rest", mythicLevel: 30, completedAt: iso(24 * 5), members: [member("Ancient")] }),
      run({ dungeon: "Kings' Rest", mythicLevel: 12, completedAt: iso(1), members: [member("Fresh")] }),
    ]);
    // The +30 would win best-key outright if it were eligible.
    expect(tileFor(tiles, "Kings' Rest", "best-key")!.members[0].name).toBe("Fresh");
    expect(tiles.flatMap((t) => t.members.map((m) => m.name))).not.toContain("Ancient");
  });

  it("hides the section when nothing is recent enough", () => {
    expect(build([run({ dungeon: "Kings' Rest", completedAt: iso(24 * 30) })])).toEqual([]);
  });
});

describe("countActiveCharacters", () => {
  it("counts distinct characters inside the window, not runs", () => {
    // Deliberately not a run count: upstream caps each character at ten recent
    // runs, so runs undercount while characters do not.
    const n = countActiveCharacters(
      [
        run({ dungeon: "Kings' Rest", members: [member("A"), member("B")] }),
        run({ dungeon: "Murder Row", members: [member("A")] }),
        run({ dungeon: "Ruby Life Pools", members: [member("C")] }),
      ],
      T0,
    );
    expect(n).toBe(3);
  });

  it("ignores anyone whose only runs fall outside the window", () => {
    const n = countActiveCharacters(
      [
        run({ dungeon: "Kings' Rest", completedAt: iso(1), members: [member("Active")] }),
        run({ dungeon: "Murder Row", completedAt: iso(24 * 5), members: [member("Lapsed")] }),
      ],
      T0,
    );
    expect(n).toBe(1);
  });

  it("uses the same window the tiles do", () => {
    // A headline counting a wider slice than the tiles show would be two
    // answers to one question.
    const runs = [
      run({ dungeon: "Kings' Rest", completedAt: iso(1), members: [member("In")] }),
      run({ dungeon: "Murder Row", completedAt: iso(24 * 3), members: [member("Out")] }),
    ];
    const named = new Set(build(runs).flatMap((t) => t.members.map((m) => m.name)));
    expect(countActiveCharacters(runs, T0)).toBe(named.size);
  });
});

describe("mergeStoredRuns", () => {
  it("keeps runs the fresh poll can no longer see", () => {
    // The whole reason runs are stored rather than fetched: each character
    // exposes only their ten most recent, so a poll cannot reach back further
    // than that window goes.
    const older = run({ dungeon: "Kings' Rest", completedAt: iso(40), members: [member("Scrolled")] });
    const fresh = run({ dungeon: "Murder Row", completedAt: iso(1), members: [member("Fresh")] });
    const merged = mergeStoredRuns([older], [fresh], T0);
    expect(merged.map((r) => r.keystoneRunId).sort()).toEqual([older.keystoneRunId, fresh.keystoneRunId].sort());
  });

  it("unions a party rather than replacing it", () => {
    // A run can first appear when only one member's window still holds it and
    // gain the rest later; taking the fresh copy wholesale would shrink it.
    const id = 4242;
    const stored = run({ dungeon: "Kings' Rest", keystoneRunId: id, members: [member("A"), member("B")] });
    const fresh = run({ dungeon: "Kings' Rest", keystoneRunId: id, members: [member("B"), member("C")] });
    const merged = mergeStoredRuns([stored], [fresh], T0);
    expect(merged).toHaveLength(1);
    expect(merged[0].members.map((m) => m.name).sort()).toEqual(["A", "B", "C"]);
  });

  it("prunes past the retention window so the blob stays bounded", () => {
    const ancient = run({ dungeon: "Kings' Rest", completedAt: new Date(T0 - RUN_RETENTION_MS - 1000).toISOString() });
    const keep = run({ dungeon: "Murder Row", completedAt: iso(1) });
    const merged = mergeStoredRuns([ancient, keep], [], T0);
    expect(merged.map((r) => r.keystoneRunId)).toEqual([keep.keystoneRunId]);
  });

  it("retains longer than it displays, so the window can be retuned", () => {
    expect(RUN_RETENTION_MS).toBeGreaterThan(RECENCY_WINDOW_MS);
  });

  it("returns newest first, so an hourly rewrite does not churn the blob", () => {
    const merged = mergeStoredRuns(
      [run({ dungeon: "A", completedAt: iso(30) }), run({ dungeon: "B", completedAt: iso(2) })],
      [run({ dungeon: "C", completedAt: iso(10) })],
      T0,
    );
    expect(merged.map((r) => r.dungeon)).toEqual(["B", "C", "A"]);
  });

  it("does not mutate what it was given", () => {
    const stored = run({ dungeon: "Kings' Rest", keystoneRunId: 7, members: [member("A")] });
    mergeStoredRuns([stored], [run({ dungeon: "Kings' Rest", keystoneRunId: 7, members: [member("B")] })], T0);
    expect(stored.members.map((m) => m.name)).toEqual(["A"]);
  });
});

describe("ordering", () => {
  const dungeons = ["D1", "D2", "D3", "D4", "D5"];
  const everyCategory = () =>
    build(
      dungeons.flatMap((d, i) => [
        run({ dungeon: d, mythicLevel: 20 - i, members: [member("A"), member("B"), member("C")] }),
        run({ dungeon: d, mythicLevel: MIN_KEY_LEVEL, completedAt: iso(1), timed: false, clearTimeMs: 1_801_000 }),
      ]),
    );

  it("visits every (category, dungeon) pair exactly once", () => {
    const tiles = everyCategory();
    expect(tiles).toHaveLength(CATEGORIES.length * dungeons.length);
    expect(new Set(tiles.map((t) => `${t.category}:${t.dungeon}`)).size).toBe(tiles.length);
  });

  it("never places two neighbours sharing a dungeon or a category", () => {
    const tiles = everyCategory();
    for (let i = 1; i < tiles.length; i++) {
      expect(tiles[i].dungeon).not.toBe(tiles[i - 1].dungeon);
      expect(tiles[i].category).not.toBe(tiles[i - 1].category);
    }
  });

  it("opens on the hardest key the guild has put itself in", () => {
    expect(everyCategory()[0].dungeon).toBe("D1");
  });

  it("returns nothing for no runs, which hides the section", () => {
    expect(build([])).toEqual([]);
  });
});
