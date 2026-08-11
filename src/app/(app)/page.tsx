export const dynamic = "force-dynamic";

import { getPayload } from "payload";
import config from "@/payload.config";
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import { toStatsData, toProgressionData } from "@/lib/seasonViewModel";
import { resolveRequestedSeason } from "@/lib/resolveRequestedSeason";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { StatsBar } from "@/components/StatsBar";
import { Progression } from "@/components/Progression";
import { SeasonSwitcher } from "@/components/SeasonSwitcher";
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

  return (
    <div className={`theme-${selectedSeason.themeSlug}`} style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <main>
        <Hero />
        <StatsBar stats={stats} />
        <div className="px-5" style={{ paddingTop: 24 }}>
          <SeasonSwitcher
            seasons={allSeasons.docs.map((s) => ({ urlSlug: s.urlSlug, name: s.name, startedAt: s.startedAt }))}
            selectedUrlSlug={selectedSeason.urlSlug}
            currentUrlSlug={currentSeason.urlSlug}
          />
        </div>
        <Progression progression={prog} />
        <About guild={guild} />
        <Officers section={officersSectionData} />
        <Recruitment section={recruitmentSectionData} />
      </main>
      <Footer links={footerLinks} />
    </div>
  );
}
