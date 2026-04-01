import type { Payload } from "payload";
import type { GuildDetailsData, RosterMember } from "@/lib/raiderio";

const ROLE_MAP: Record<string, "Tank" | "Healer" | "DPS"> = {
  tank: "Tank",
  healer: "Healer",
  dps: "DPS",
  melee: "DPS",
  ranged: "DPS",
};

export async function syncOfficersFromDetails(payload: Payload): Promise<number> {
  const [guildDetailsGlobal, officersGlobal] = await Promise.all([
    payload.findGlobal({ slug: "guild-details" }),
    payload.findGlobal({ slug: "officers-section" }),
  ]);

  const details = guildDetailsGlobal.details as GuildDetailsData | null;
  if (!details?.members?.length) return 0;

  type WowClass =
    | "Death Knight" | "Demon Hunter" | "Druid" | "Evoker" | "Hunter"
    | "Mage" | "Monk" | "Paladin" | "Priest" | "Rogue" | "Shaman" | "Warlock" | "Warrior";

  const existingOfficers = (officersGlobal.officers ?? []) as {
    name?: string;
    class?: WowClass;
    spec?: string;
    role?: "Tank" | "Healer" | "DPS";
    ilvl?: number;
    rank?: string;
    id?: string;
  }[];

  if (existingOfficers.length === 0) return 0;

  // Build a lookup by lowercase name
  const membersByName = new Map<string, RosterMember>();
  for (const m of details.members) {
    membersByName.set(m.character.name.toLowerCase(), m);
  }

  let updated = 0;
  const officers = existingOfficers.map((officer) => {
    if (!officer.name) return officer;
    const member = membersByName.get(officer.name.toLowerCase());
    if (!member) return officer;

    updated++;
    return {
      ...officer,
      class: member.character.class.name as WowClass,
      spec: member.character.spec.name,
      role: ROLE_MAP[member.character.spec.role.toLowerCase()] ?? "DPS",
      ilvl: member.character.itemLevelEquipped,
    };
  });

  if (updated > 0) {
    await payload.updateGlobal({
      slug: "officers-section",
      data: { officers, lastSyncedAt: new Date().toISOString() },
    });
  }

  return updated;
}
