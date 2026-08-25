import { describe, expect, it } from "vitest";
import { mergeProfileRuns, runSeason, type Profile, type ProfileRun } from "@/lib/mythicPlusDungeons";

// The merge is where three overlapping run lists from twenty separate character
// requests become one set of runs with parties attached. Everything downstream
// assumes a run appears once and carries everyone who was on it.

function wireRun(over: Partial<ProfileRun> & { keystone_run_id: number }): ProfileRun {
  return {
    dungeon: "Kings' Rest",
    mythic_level: 12,
    completed_at: "2026-08-20T12:00:00.000Z",
    clear_time_ms: 1_500_000,
    par_time_ms: 1_800_000,
    num_keystone_upgrades: 1,
    url: "https://raider.io/mythic-plus-runs/season-mn-2/3608634-12-kings-rest",
    spec: { name: "Arcane", role: "dps" },
    ...over,
  };
}

function profile(name: string, runs: ProfileRun[]): Profile {
  return { name, class: "Mage", mythic_plus_recent_runs: runs };
}

describe("runSeason", () => {
  it("reads the season out of a run URL", () => {
    expect(runSeason("https://raider.io/mythic-plus-runs/season-mn-2/3608634-10-voidscar-arena")).toBe("season-mn-2");
  });

  it("returns null when there is nothing to read", () => {
    // Null means keep the run: a URL-format change upstream should cost the
    // guard, not the section.
    expect(runSeason(undefined)).toBeNull();
    expect(runSeason("https://raider.io/characters/us/tichondrius/Buratski")).toBeNull();
  });
});

describe("mergeProfileRuns", () => {
  it("collapses a run one character reports twice", () => {
    const run = wireRun({ keystone_run_id: 1 });
    const merged = mergeProfileRuns([profile("Buratski", [run, run])], "season-mn-2");
    expect(merged).toHaveLength(1);
    expect(merged[0].members.map((m) => m.name)).toEqual(["Buratski"]);
  });

  it("gathers a party from the separate requests that each saw the run", () => {
    // A party is only visible by collecting the same keystone id from every
    // member's own profile — no endpoint returns the group.
    const run = wireRun({ keystone_run_id: 7 });
    const merged = mergeProfileRuns(
      [profile("Buratski", [run]), profile("Warkeb", [run]), profile("Zoya", [run])],
      "season-mn-2",
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].members.map((m) => m.name).sort()).toEqual(["Buratski", "Warkeb", "Zoya"]);
  });

  it("drops a run that names a different season", () => {
    const merged = mergeProfileRuns(
      [
        profile("Buratski", [
            wireRun({ keystone_run_id: 1 }),
            wireRun({
              keystone_run_id: 2,
              url: "https://raider.io/mythic-plus-runs/season-mn-1/999-20-kings-rest",
            }),
          ]),
      ],
      "season-mn-2",
    );
    expect(merged.map((r) => r.keystoneRunId)).toEqual([1]);
  });

  it("keeps a run whose URL cannot be read", () => {
    const merged = mergeProfileRuns(
      [profile("Buratski", [wireRun({ keystone_run_id: 3, url: undefined })])],
      "season-mn-2",
    );
    expect(merged).toHaveLength(1);
  });

  it("reads timed off the keystone upgrades", () => {
    const merged = mergeProfileRuns(
      [
        profile("Buratski", [
            wireRun({ keystone_run_id: 1, num_keystone_upgrades: 0 }),
            wireRun({ keystone_run_id: 2, num_keystone_upgrades: 2 }),
          ]),
      ],
      "season-mn-2",
    );
    expect(merged.map((r) => r.timed)).toEqual([false, true]);
  });

  it("takes the spec played on the run, and the class off the profile", () => {
    const merged = mergeProfileRuns(
      [
        profile("Zoya", [wireRun({ keystone_run_id: 4, spec: { name: "Blood", role: "tank" } })]),
      ],
      "season-mn-2",
    );
    expect(merged[0].members[0]).toEqual({ name: "Zoya", class: "Mage", spec: "Blood", role: "tank" });
  });
});
