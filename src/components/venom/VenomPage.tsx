import { MotionConfig } from "framer-motion";
import type { Season } from "@/payload-types";
import { DEFAULT_HERO_INTRO } from "@/globals/GuildSettings";
import { initialDifficulty, rankingsAt, raidGroups } from "@/lib/venomViewModel";
import { VenomNavbar, type SwitcherSeason } from "./VenomNavbar";
import { VenomHero } from "./VenomHero";
import { RaidTimeline } from "./RaidTimeline";
import { DungeonMarquee } from "./DungeonMarquee";
import type { DungeonTile } from "@/lib/dungeonRotation";
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
 * Copy that the CMS owns (About, recruitment roles, footer links, and now the
 * hero intro) is passed in. What the design invented and the CMS does not own —
 * the recruitment headline — stays hardcoded: a theme is a reviewed, built
 * whole (ADR 0007), and one-off strings do not earn CMS fields.
 *
 * The hero intro moved across that line on 2026-08-26 by operator decision. It
 * is the one sentence on the page that describes the guild rather than the
 * design, so it belongs with the other guild copy — and unlike the recruitment
 * headline it changes when the guild does, not when the theme does.
 */
export function VenomPage({
  season,
  seasons,
  selectedUrlSlug,
  currentUrlSlug,
  isArchived,
  aboutHeading,
  heroIntro,
  descriptionHTML,
  officers,
  recruitment,
  footerLinks,
  runners,
  dungeonTiles,
  activeCharacters,
  renderedAt,
}: {
  season: Season;
  seasons: SwitcherSeason[];
  selectedUrlSlug: string;
  currentUrlSlug: string;
  isArchived: boolean;
  aboutHeading: string;
  /** CMS-owned. Empty falls back to the layout's own copy. */
  heroIntro: string;
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
  dungeonTiles: DungeonTile[];
  /**
   * Distinct characters with a key inside the recency window, or `null` when
   * that was never measured — an archived Season, or a failed poll. Zero is a
   * measurement; null is the absence of one.
   */
  activeCharacters: number | null;
  /** Server render time, for the marquee start offset. */
  renderedAt: number;
}) {
  // Server-computed so the client toggle initialises without a hydration
  // mismatch.
  // Season-wide, for the stats bar only. Each raid section picks its own.
  const difficulty = initialDifficulty(season);

  // The stats bar shows the ranks for the difficulty actually being displayed.
  // Showing mythic's zeros while the guild is ranked on heroic would read as
  // "unranked" and be simply wrong.
  const ranks = rankingsAt(season, difficulty);
  const groups = raidGroups(season);

  /** Section numeral for the nth section after the raid groups, 1-indexed. */
  const numeralAfter = (n: number) => String(n + 1).padStart(2, "0");

  return (
    // Framer's whileInView/initial animations are not gated by the CSS
    // media query the rest of the motion uses, so one MotionConfig covers every
    // reveal in the tree rather than each component remembering to ask.
    <MotionConfig reducedMotion="user">
    <div className={`theme-${season.themeSlug}`} style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <VenomNavbar seasons={seasons} selectedUrlSlug={selectedUrlSlug} currentUrlSlug={currentUrlSlug} />
      <main>
        <VenomHero
          eyebrow={`Season 2 · ${season.name}`}
          // Falls back rather than rendering an empty line: a blank field in the
          // CMS should not leave a hole under the guild's name.
          intro={
            heroIntro.trim() || DEFAULT_HERO_INTRO
          }
          stats={{
            // "Active Members" now means what it says: distinct characters who
            // ran a key in the last 48 hours, derived from the Recent Keys
            // data. It used to read `season.rankings.members` — the guild's
            // roster size, which is a membership count and not an activity one.
            //
            // `null` means the poll never ran or failed — an archived Season
            // (ADR 0005) or an upstream outage. Only then does this fall back to
            // the roster count, which is exactly what the stat showed before, so
            // the degraded path is the old behaviour rather than an invention.
            //
            // A measured `0` is a real answer and renders as one: a guild that
            // ran nothing for 48 hours should say so, not quietly show its
            // roster size under an activity label.
            members: activeCharacters ?? season.rankings?.members ?? 0,
            world: ranks.world,
            region: ranks.region,
            realm: ranks.realm,
          }}
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

        {/* Section numerals run in one sequence across the page, so adding a
            raid does not leave two sections both numbered 02. The raid groups
            take 01..n and everything after continues from there. */}
        <RaidTimeline season={season} groups={groups} />
        <DungeonMarquee
          tiles={dungeonTiles}
          numeral={numeralAfter(groups.length)}
          renderedAt={renderedAt}
        />
        <Leaderboard runners={runners} numeral={numeralAfter(groups.length + 1)} />
        <VenomAbout
          heading={aboutHeading}
          descriptionHTML={descriptionHTML}
          numeral={numeralAfter(groups.length + 2)}
        />
        <VenomOfficers officers={officers} numeral={numeralAfter(groups.length + 3)} />
        <VenomRecruitment {...recruitment} />
      </main>
      <VenomFooter links={footerLinks} />
      <BackToTop />
    </div>
    </MotionConfig>
  );
}


