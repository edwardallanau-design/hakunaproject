import { getPayload } from "payload";
import config from "@/payload.config";
import { guild, currentProgression, officers, recruitmentRoles } from "@/lib/guildData";

export async function GET() {
  const payload = await getPayload({ config: await config });

  // Prevent re-seeding if officers already exist
  const existing = await payload.find({ collection: "officers", limit: 1 });
  if (existing.totalDocs > 0) {
    return Response.json({ message: "Already seeded — skipping." });
  }

  await payload.updateGlobal({
    slug: "guild-settings",
    data: {
      name: guild.name,
      tagline: guild.tagline,
      server: guild.server,
      region: guild.region,
      faction: guild.faction,
      founded: guild.founded,
      description: guild.description,
      raidSchedule: guild.raidSchedule.map((day) => ({ day })),
      stats: guild.stats,
    },
  });

  await payload.updateGlobal({
    slug: "progression",
    data: {
      tier: currentProgression.tier,
      season: currentProgression.season,
      mythicKills: currentProgression.mythicKills,
      totalBosses: currentProgression.totalBosses,
      bosses: currentProgression.bosses,
    },
  });

  for (const [i, officer] of officers.entries()) {
    await payload.create({
      collection: "officers",
      data: {
        name: officer.name,
        class: officer.class,
        spec: officer.spec,
        role: officer.role,
        rank: officer.rank,
        ilvl: officer.ilvl,
        order: i,
      },
    });
  }

  for (const [i, r] of recruitmentRoles.entries()) {
    await payload.create({
      collection: "recruitment-roles",
      data: {
        role: r.role,
        specs: r.specs.map((spec) => ({ spec })) as { id: string; spec: string }[],
        priority: r.priority,
        order: i,
      },
    });
  }

  return Response.json({ message: "Seeded successfully." });
}
