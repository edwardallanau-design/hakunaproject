import { describe, expect, it } from "vitest";
import { resolveRequestedSeason } from "@/lib/resolveRequestedSeason";
import type { Season } from "@/payload-types";

function season(overrides: Partial<Season> & { id: number; urlSlug: string }): Season {
  return {
    name: `Season ${overrides.id}`,
    themeSlug: "void",
    startedAt: "2026-01-01T00:00:00.000Z",
    rankSourceRaidSlug: "tier-mn-1",
    mythicPlusSeasonSlug: "season-mn-1",
    updatedAt: "2026-01-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as Season;
}

const season1 = season({ id: 1, urlSlug: "season-1", startedAt: "2026-01-01T00:00:00.000Z" });
const season2 = season({ id: 2, urlSlug: "season-2", startedAt: "2026-08-12T00:00:00.000Z" });
const allSeasons = [season1, season2];

describe("resolveRequestedSeason", () => {
  it("returns the current Season when no slug is requested", () => {
    expect(resolveRequestedSeason(allSeasons, season2.id, undefined)).toBe(season2);
  });

  it("falls back to the current Season for an unrecognised slug", () => {
    expect(resolveRequestedSeason(allSeasons, season2.id, "not-a-real-season")).toBe(season2);
  });

  it("returns the current Season when its own slug is requested", () => {
    expect(resolveRequestedSeason(allSeasons, season2.id, "season-2")).toBe(season2);
  });

  it("returns an archived Season when its slug is requested", () => {
    expect(resolveRequestedSeason(allSeasons, season2.id, "season-1")).toBe(season1);
  });

  it("throws when the pointer is empty and no slug is requested", () => {
    expect(() => resolveRequestedSeason(allSeasons, null, undefined)).toThrowError(
      /currentSeason is not set/,
    );
  });

  it("throws when the pointer is empty and the requested slug is unrecognised", () => {
    expect(() => resolveRequestedSeason(allSeasons, null, "not-a-real-season")).toThrowError(
      /currentSeason is not set/,
    );
  });
});
