import { getPayload } from "payload";
import config from "@/payload.config";
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

  const guild = {
    description: guildSettings.description ?? "",
    founded: guildSettings.founded ?? "",
    raidSchedule: (guildSettings.raidSchedule ?? []).map((r) => r.day),
    stats: {
      members: guildSettings.stats?.members ?? 0,
      cuttingEdge: guildSettings.stats?.cuttingEdge ?? 0,
      keystoneRuns: guildSettings.stats?.keystoneRuns ?? 0,
      worldRank: guildSettings.stats?.worldRank ?? 0,
    },
  };

  const prog = {
    tier: progression.tier ?? "",
    season: progression.season ?? "",
    mythicKills: progression.mythicKills ?? 0,
    totalBosses: progression.totalBosses ?? 8,
    bosses: (progression.bosses ?? []).map((b) => ({ name: b.name, mythic: b.mythic ?? false })),
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
      <Footer />
    </>
  );
}
