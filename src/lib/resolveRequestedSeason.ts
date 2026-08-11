import type { Season } from "@/payload-types";

// The seam for the Season switcher: given every Season, which one is current,
// and what the visitor asked for (a query-parameter urlSlug, if any), decide
// which Season to render. An unrecognised slug falls back to the current
// Season rather than erroring, so a stale link still shows the site.
export function resolveRequestedSeason(
  allSeasons: Season[],
  currentSeasonId: number | null,
  requestedSlug: string | undefined | null,
): Season {
  const currentSeason = allSeasons.find((s) => s.id === currentSeasonId) ?? null;

  if (!requestedSlug) {
    if (!currentSeason) {
      throw new Error("guild-settings.currentSeason is not set — no Season to render.");
    }
    return currentSeason;
  }

  const requested = allSeasons.find((s) => s.urlSlug === requestedSlug);
  if (requested) return requested;

  if (!currentSeason) {
    throw new Error("guild-settings.currentSeason is not set — no Season to render.");
  }
  return currentSeason;
}
