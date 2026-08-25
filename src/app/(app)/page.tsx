export const dynamic = "force-dynamic";

import { getPayload } from "payload";
import config from "@/payload.config";
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import { toStatsData, toProgressionData } from "@/lib/seasonViewModel";
import { resolveRequestedSeason } from "@/lib/resolveRequestedSeason";
import { findTheme } from "@/lib/themes";
import { VenomPage } from "@/components/venom/VenomPage";
import { fetchDungeonRotation } from "@/lib/mythicPlusDungeons";
import type { DungeonTile } from "@/lib/dungeonRotation";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { StatsBar } from "@/components/StatsBar";
import { Progression } from "@/components/Progression";
import { PixelHeaderSwitcher, PixelArchivedNotice } from "@/components/PixelHeaderSwitcher";
import { About } from "@/components/About";
import { Officers } from "@/components/Officers";
import { Recruitment } from "@/components/Recruitment";
import { Footer } from "@/components/Footer";
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const payload = await getPayload({ config: await config });
  const { season: requestedSlug } = await searchParams;

  const [guildSettings, officersSection, recruitmentSection, allSeasons] =
    await Promise.all([
      payload.findGlobal({ slug: "guild-settings" }),
      payload.findGlobal({ slug: "officers-section" }),
      payload.findGlobal({ slug: "recruitment-section" }),
      payload.find({ collection: "seasons", limit: 0, depth: 0 }),
    ]);

  // An empty pointer must be announced, not silently rendered as an empty page.
  const currentSeasonRef = guildSettings.currentSeason;
  const currentSeasonId =
    currentSeasonRef && typeof currentSeasonRef === "object" ? currentSeasonRef.id : (currentSeasonRef ?? null);

  const selectedSeason = resolveRequestedSeason(allSeasons.docs, currentSeasonId, requestedSlug);
  // Looked up by id, not read off currentSeasonRef/selectedSeason — either can
  // diverge from the actual current Season (an unpopulated relationship, or a
  // visitor viewing an archived Season), and the switcher's "(current)" label
  // depends on this being the real thing, not a guess.
  const currentSeason = allSeasons.docs.find((s) => s.id === currentSeasonId) ?? selectedSeason;

  const descriptionHTML = convertLexicalToHTML({ data: guildSettings.description!, disableContainer: true });

  const guild = {
    eyebrow: guildSettings.eyebrow!,
    heading: guildSettings.heading!,
    description: descriptionHTML,
  };

  const stats = toStatsData(selectedSeason);

  const footerLinks = guildSettings.footerLinks!.map((l) => ({
    label: l.label,
    href: l.href,
  }));

  const prog = toProgressionData(selectedSeason);

  const isArchived = selectedSeason.urlSlug !== currentSeason.urlSlug;
  const switcherSeasons = allSeasons.docs.map((s) => ({
    urlSlug: s.urlSlug,
    name: s.name,
    startedAt: s.startedAt,
  }));

  const officersSectionData = {
    eyebrow: officersSection.eyebrow!,
    heading: officersSection.heading!,
    officers: officersSection.officers!.map((o) => ({
      id: o.id!,
      name: o.name!,
      class: o.class!,
      spec: o.spec!,
      role: o.role!,
      rank: o.rank!,
      ilvl: o.ilvl!,
    })),
  };

  const recruitmentSectionData = {
    eyebrow: recruitmentSection.eyebrow!,
    heading: recruitmentSection.heading!,
    description: recruitmentSection.description!,
    footerNote: recruitmentSection.footerNote!,
    ctaLabel: recruitmentSection.ctaLabel!,
    discordUrl: recruitmentSection.discordUrl!,
    roles: recruitmentSection.roles!.map((r) => ({
      role: r.role,
      specs: r.specs!.map((s) => s.spec),
      priority: r.priority!,
    })),
  };

  // ── The layout fork ──
  // A theme package can only swap tokens; Season 2's design changes structure,
  // so themes declare which component tree renders them. The branch is on the
  // *selected* Season, not the current one — switching to an archived Season
  // must render that Season's own layout, which is how `void` stays frozen.
  const theme = findTheme(selectedSeason.themeSlug);
  if (theme?.layout === "editorial") {
    // The dungeon marquee is decoration over live data, not load-bearing
    // content. An upstream outage should cost the section, never the page —
    // DungeonMarquee renders nothing for an empty list, the same way the M+
    // runners card does. Individual characters failing is handled a level down,
    // inside the poll, so one bad profile costs one person's runs and not the
    // strip.
    //
    // Never for an archived Season (ADR 0005). Raider.IO's M+ endpoints answer
    // only about the *current* season, so deriving an archive from them does
    // not show that season's rotation — it shows today's under a past season's
    // heading. An empty section is the honest answer until the rotation is
    // persisted at sync time; see the ledger's Open entry.
    // `activeCharacters: null` means "not measured" — an archived Season skips
    // the poll entirely, and a failed poll has nothing to report. A genuinely
    // quiet 48 hours is `0`, which is a real answer and must render as one.
    // Collapsing the three into a falsy zero is what let a quiet weekend show
    // the roster count under an activity label.
    const rotation: { tiles: DungeonTile[]; activeCharacters: number | null } = isArchived
      ? { tiles: [], activeCharacters: null }
      : await fetchDungeonRotation({
          region: process.env.GUILD_REGION ?? "us",
          realm: process.env.GUILD_REALM ?? "Barthilas",
          guild: process.env.GUILD_NAME ?? "Potato Corner",
          seasonSlug: selectedSeason.mythicPlusSeasonSlug,
        }).catch((err) => {
          console.error("Recent keys fetch failed; hiding the section.", err);
          return { tiles: [], activeCharacters: null };
        });

    return (
      <VenomPage
        season={selectedSeason}
        seasons={switcherSeasons}
        selectedUrlSlug={selectedSeason.urlSlug}
        currentUrlSlug={currentSeason.urlSlug}
        isArchived={isArchived}
        aboutHeading={guild.heading}
        heroIntro={guildSettings.heroIntro ?? ""}
        descriptionHTML={descriptionHTML}
        officers={officersSectionData.officers.map((o) => ({
          // `officersSectionData` keeps `ilvl` — the pixel layout below still
          // renders it and is frozen. The venom card no longer takes it.
          id: o.id,
          name: o.name,
          class: o.class,
          spec: o.spec,
          rank: o.rank,
        }))}
        recruitment={{
          heading: "The Vault Needs More Potatoes",
          description: recruitmentSectionData.description,
          roles: recruitmentSectionData.roles.map((r) => ({
            role: r.role,
            specs: r.specs,
            priority: r.priority as "High" | "Medium" | "Low",
          })),
          ctaLabel: recruitmentSectionData.ctaLabel,
          discordUrl: recruitmentSectionData.discordUrl,
          footerNote: recruitmentSectionData.footerNote,
        }}
        footerLinks={footerLinks}
        runners={prog.mythicPlusRunners}
        dungeonTiles={rotation.tiles}
        activeCharacters={rotation.activeCharacters}
      />
    );
  }

  return (
    <div className={`theme-${selectedSeason.themeSlug}`} style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      {/* Operator-approved amendment to the Season 1 freeze (2026-08-25): the
          switcher moves into the header so both layouts place it the same way.
          Added alongside Navbar rather than inside it, so the eight original
          components stay untouched. */}
      <PixelHeaderSwitcher
        seasons={switcherSeasons}
        selectedUrlSlug={selectedSeason.urlSlug}
        currentUrlSlug={currentSeason.urlSlug}
      />
      <main>
        <Hero />
        <StatsBar stats={stats} />
        {/* The archived notice keeps its mid-page home; only the select moved
            into the header. This is its own small component rather than a flag
            on SeasonSwitcher, because SeasonSwitcher is one of the eight frozen
            files and adding a prop to it would edit Season 1's components. */}
        {isArchived && (
          <div className="px-5" style={{ paddingTop: 24 }}>
            <PixelArchivedNotice />
          </div>
        )}
        <Progression progression={prog} />
        <About guild={guild} />
        <Officers section={officersSectionData} />
        <Recruitment section={recruitmentSectionData} />
      </main>
      <Footer links={footerLinks} />
    </div>
  );
}

