export const dynamic = "force-dynamic";

import { getPayload } from "payload";
import config from "@/payload.config";
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import type { MythicPlusRunner } from "@/lib/raiderio";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { StatsBar } from "@/components/StatsBar";
import { Progression } from "@/components/Progression";
import { About } from "@/components/About";
import { Officers } from "@/components/Officers";
import { Recruitment } from "@/components/Recruitment";
import { Footer } from "@/components/Footer";
export default async function Home() {
  const payload = await getPayload({ config: await config });

  const [guildSettings, progression, officersSection, recruitmentSection] =
    await Promise.all([
      payload.findGlobal({ slug: "guild-settings" }),
      payload.findGlobal({ slug: "progression" }),
      payload.findGlobal({ slug: "officers-section" }),
      payload.findGlobal({ slug: "recruitment-section" }),
    ]);

  const descriptionHTML = convertLexicalToHTML({ data: guildSettings.description!, disableContainer: true });

  const guild = {
    eyebrow: guildSettings.eyebrow!,
    heading: guildSettings.heading!,
    description: descriptionHTML,
  };

  const stats = {
    members: progression.rankings!.members!,
    world: progression.rankings!.world!,
    region: progression.rankings!.region!,
    realm: progression.rankings!.realm!,
  };

  const footerLinks = guildSettings.footerLinks!.map((l) => ({
    label: l.label,
    href: l.href,
  }));

  const prog = {
    tier: progression.tier!,
    difficulty: progression.difficulty as string,
    kills: progression.kills!,
    totalBosses: progression.totalBosses!,
    summary: progression.summary!,
    profileUrl: progression.profileUrl!,
    bosses: progression.bosses!.map((b) => ({
      name: b.name,
      killed: b.killed!,
      pulls: b.pulls ?? undefined,
      bestPull: b.bestPull ?? undefined,
    })),
    rankings: {
      world: progression.rankings!.world!,
      region: progression.rankings!.region!,
      realm: progression.rankings!.realm!,
    },
    mythicPlusRunners: progression.mythicPlusRunners!.map((r): MythicPlusRunner => ({
      name: r.name,
      class: r.class,
      spec: r.spec,
      score: r.score!,
    })),
  };

  const officersSectionData = {
    eyebrow: officersSection.eyebrow!,
    heading: officersSection.heading!,
    officers: officersSection.officers!.map((o) => ({
      id: o.id,
      name: o.name,
      class: o.class,
      spec: o.spec,
      role: o.role,
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
    <>
      <Navbar />
      <main>
        <Hero />
        <StatsBar stats={stats} />
        <Progression progression={prog} />
        <About guild={guild} />
        <Officers section={officersSectionData} />
        <Recruitment section={recruitmentSectionData} />
      </main>
      <Footer links={footerLinks} />
    </>
  );
}
