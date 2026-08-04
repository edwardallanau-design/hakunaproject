import type { GuildDetailsData, RosterMember } from "@/lib/raiderio";

const ROLE_MAP: Record<string, "Tank" | "Healer" | "DPS"> = {
  tank: "Tank",
  healer: "Healer",
  dps: "DPS",
  melee: "DPS",
  ranged: "DPS",
};

type WowClass =
  | "Death Knight" | "Demon Hunter" | "Druid" | "Evoker" | "Hunter"
  | "Mage" | "Monk" | "Paladin" | "Priest" | "Rogue" | "Shaman" | "Warlock" | "Warrior";

export type Officer = {
  name?: string;
  class?: WowClass;
  spec?: string;
  role?: "Tank" | "Healer" | "DPS";
  ilvl?: number;
  rank?: string;
  id?: string;
};

export function deriveOfficers(details: GuildDetailsData, currentOfficers: Officer[]): Officer[] {
  if (currentOfficers.length === 0) return currentOfficers;
  if (!details.members?.length) return currentOfficers;

  const membersByName = new Map<string, RosterMember>();
  for (const m of details.members) {
    membersByName.set(m.character.name.toLowerCase(), m);
  }

  return currentOfficers.map((officer) => {
    if (!officer.name) return officer;
    const member = membersByName.get(officer.name.toLowerCase());
    if (!member) return officer;

    return {
      ...officer,
      class: member.character.class.name as WowClass,
      spec: member.character.spec.name,
      role: ROLE_MAP[member.character.spec.role.toLowerCase()] ?? "DPS",
      ilvl: member.character.itemLevelEquipped,
    };
  });
}
