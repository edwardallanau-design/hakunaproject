import { getPayload } from "payload";
import config from "@/payload.config";
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
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

  const [guildSettings, progression, officersData, recruitmentData] = await Promise.all([
    payload.findGlobal({ slug: "guild-settings" }),
    payload.findGlobal({ slug: "progression" }),
    payload.find({ collection: "officers", sort: "order", limit: 100 }),
    payload.find({ collection: "recruitment-roles", sort: "order", limit: 100 }),
  ]);

  const descriptionHTML = guildSettings.description
    ? convertLexicalToHTML({ data: guildSettings.description, disableContainer: true })
    : "";

  const guild = {
    description: descriptionHTML,
    founded: guildSettings.founded ?? "",
    raidSchedule: (guildSettings.raidSchedule ?? []).map((r) => r.day),
    stats: {
      members: guildSettings.stats?.members ?? 0,
      cuttingEdge: guildSettings.stats?.cuttingEdge ?? 0,
      keystoneRuns: guildSettings.stats?.keystoneRuns ?? 0,
      worldRank: guildSettings.stats?.worldRank ?? 0,
    },
  };

  const footerLinks = (guildSettings.footerLinks ?? []).map((l) => ({
    label: l.label,
    href: l.href,
  }));

  const prog = {
    tier: progression.tier ?? "",
    difficulty: (progression.difficulty as string) ?? "Heroic",
    kills: progression.kills ?? 0,
    totalBosses: progression.totalBosses ?? 9,
    summary: progression.summary ?? "",
    profileUrl: progression.profileUrl ?? "",
    bosses: (progression.bosses ?? []).map((b) => ({
      name: b.name,
      killed: b.killed ?? false,
      pulls: b.pulls ?? undefined,
      bestPull: b.bestPull ?? undefined,
    })),
    rankings: progression.rankings
      ? { world: progression.rankings.world ?? 0, region: progression.rankings.region ?? 0, realm: progression.rankings.realm ?? 0 }
      : null,
  };

  const officers = officersData.docs.map((o) => ({
    id: o.id,
    name: o.name,
    class: o.class,
    spec: o.spec,
    role: o.role,
    rank: o.rank ?? "Officer",
    ilvl: o.ilvl ?? 0,
  }));

  const recruitmentRoles = recruitmentData.docs.map((r) => ({
    role: r.role,
    specs: (r.specs ?? []).map((s) => s.spec),
    priority: r.priority ?? "Medium",
  }));

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <StatsBar stats={guild.stats} />
        <Progression progression={prog} />
        <About guild={guild} />
        <Officers officers={officers} />
        <Recruitment recruitmentRoles={recruitmentRoles} />
      </main>
      <Footer links={footerLinks} />
    </>
  );
}
