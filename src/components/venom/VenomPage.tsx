import type { Season } from "@/payload-types";
import { initialDifficulty, availableDifficulties, rankingsAt, difficultyLabel } from "@/lib/venomViewModel";
import { VenomNavbar, type SwitcherSeason } from "./VenomNavbar";
import { VenomHero } from "./VenomHero";
import { RaidTimeline } from "./RaidTimeline";
import { DungeonGrid, type DungeonRun } from "./DungeonGrid";
import { Leaderboard, type Runner } from "./Leaderboard";
import { VenomAbout, VenomOfficers, VenomRecruitment, VenomFooter, BackToTop, type OfficerCard, type RoleCard } from "./VenomSections";

/**
 * The editorial layout — Season 2's whole page.
 *
 * This is a *parallel* tree to the pixel components, not a replacement. The
 * page picks between them on the theme's declared `layout`, so `void` keeps
 * rendering the same eight components it always has and Season 1 is frozen by
 * construction rather than by careful editing.
 *
 * Copy that the CMS owns (About, recruitment roles, footer links) is passed in.
 * Copy the design invented — the hero intro, the recruitment headline — is
 * hardcoded here: a theme is a reviewed, built whole (ADR 0007), and one-off
 * strings do not earn CMS fields.
 */
export function VenomPage({
  season,
  seasons,
  selectedUrlSlug,
  currentUrlSlug,
  isArchived,
  aboutHeading,
  descriptionHTML,
  officers,
  recruitment,
  footerLinks,
  runners,
  dungeons,
}: {
  season: Season;
  seasons: SwitcherSeason[];
  selectedUrlSlug: string;
  currentUrlSlug: string;
  isArchived: boolean;
  aboutHeading: string;
  descriptionHTML: string;
  officers: OfficerCard[];
  recruitment: {
    heading: string;
    description: string;
    roles: RoleCard[];
    ctaLabel: string;
    discordUrl: string;
    footerNote: string;
  };
  footerLinks: { label: string; href: string }[];
  runners: Runner[];
  dungeons: DungeonRun[];
}) {
  // Server-computed so the client toggle initialises without a hydration
  // mismatch.
  const difficulty = initialDifficulty(season);
  const difficulties = availableDifficulties(season);

  // The stats bar shows the ranks for the difficulty actually being displayed.
  // Showing mythic's zeros while the guild is ranked on heroic would read as
  // "unranked" and be simply wrong.
  const ranks = rankingsAt(season, difficulty);

  return (
    <div className={`theme-${season.themeSlug}`} style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <VenomNavbar seasons={seasons} selectedUrlSlug={selectedUrlSlug} currentUrlSlug={currentUrlSlug} />
      <main>
        <VenomHero
          eyebrow={`Season 2 · ${season.name}`}
          intro="Semi-hardcore Mythic progression. Two nights a week. Small potatoes, big pulls — don't worry, be raiding."
          stats={{
            members: season.rankings?.members ?? 0,
            world: ranks.world,
            region: ranks.region,
            realm: ranks.realm,
          }}
          rankLabel={difficultyLabel(difficulty)}
        />

        {isArchived && (
          <div style={{ padding: "clamp(16px,2vw,28px) clamp(20px,4vw,64px) 0", display: "flex", justifyContent: "center" }}>
            <span
              style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 600,
                fontSize: "var(--ui-xs)",
                color: "var(--accent2)",
                border: "1px solid color-mix(in srgb,var(--accent2) 40%,transparent)",
                background: "color-mix(in srgb,var(--accent2) 10%,transparent)",
                padding: "clamp(6px,0.6vw,10px) clamp(12px,1.2vw,20px)",
                letterSpacing: "0.16em",
                textAlign: "center",
              }}
            >
              ◆ VIEWING ARCHIVED SEASON — PROGRESSION SHOWN IS HISTORICAL ◆
            </span>
          </div>
        )}

        <RaidTimeline
          season={season}
          raidName={season.name}
          initialDifficulty={difficulty}
          difficulties={difficulties}
        />
        <DungeonGrid dungeons={dungeons} />
        <Leaderboard runners={runners} />
        <VenomAbout heading={aboutHeading} descriptionHTML={descriptionHTML} />
        <VenomOfficers officers={officers} />
        <VenomRecruitment {...recruitment} />
      </main>
      <VenomFooter links={footerLinks} />
      <BackToTop />
    </div>
  );
}
