import { getPayload } from "payload";
import config from "@/payload.config";
import { guild, currentProgression, recruitmentRoles, footerLinks } from "@/lib/guildData";

function makeLexicalParagraph(text: string) {
  return {
    root: {
      type: "root", format: "" as const, indent: 0, version: 1, direction: "ltr" as const,
      children: [
        {
          type: "paragraph", format: "" as const, indent: 0, version: 1, direction: "ltr" as const,
          textFormat: 0,
          children: [
            { type: "text", detail: 0, format: 0, mode: "normal", style: "", text, version: 1 },
          ],
        },
      ],
    },
  };
}

export async function GET() {
  const payload = await getPayload({ config: await config });

  // Prevent re-seeding if recruitment roles already exist
  const existing = await payload.find({ collection: "recruitment-roles", limit: 1 });
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
      description: makeLexicalParagraph(guild.description),
      stats: guild.stats,
      footerLinks: footerLinks.map(({ label, href }) => ({ label, href })),
    },
  });

  await payload.updateGlobal({
    slug: "progression",
    data: {
      tier: currentProgression.tier,
      difficulty: currentProgression.difficulty,
      summary: currentProgression.summary,
      kills: currentProgression.kills,
      totalBosses: currentProgression.totalBosses,
      bosses: currentProgression.bosses,
    },
  });

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
