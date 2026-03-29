export const guild = {
  name: "Hakuna Muh Nagga",
  tagline: "Don't Worry, Be Raiding",
  server: "Barthilas",
  region: "US",
  faction: "Horde",
  founded: "September 2021",
  description:
    "We are a semi-hardcore Mythic progression guild on Barthilas-US. We take our kills seriously but keep the atmosphere loose. If you can parse and laugh at the same time, you'll fit right in.",
  raidSchedule: ["Tuesday 8–11 PM EST", "Thursday 8–11 PM EST", "Sunday 7–11 PM EST"],
  stats: {
    members: 24,
    cuttingEdge: 5,
    keystoneRuns: 1847,
    worldRank: 312,
  },
};

export const CLASS_COLORS: Record<string, string> = {
  "Death Knight": "#C41E3A",
  "Demon Hunter": "#A330C9",
  Druid: "#FF7C0A",
  Evoker: "#33937F",
  Hunter: "#AAD372",
  Mage: "#3FC7EB",
  Monk: "#00FF98",
  Paladin: "#F48CBA",
  Priest: "#FFFFFF",
  Rogue: "#FFF468",
  Shaman: "#0070DD",
  Warlock: "#8788EE",
  Warrior: "#C69B3A",
};

export const officers = [
  { id: 1, name: "Vorryndas", class: "Warrior", spec: "Protection", role: "Tank", rank: "Guild Master", ilvl: 639 },
  { id: 2, name: "Seraphina", class: "Paladin", spec: "Holy", role: "Healer", rank: "Officer", ilvl: 641 },
  { id: 3, name: "Zulgrimar", class: "Death Knight", spec: "Unholy", role: "DPS", rank: "Officer", ilvl: 638 },
  { id: 4, name: "Lunethara", class: "Druid", spec: "Restoration", role: "Healer", rank: "Officer", ilvl: 636 },
] as const;

export const currentProgression = {
  tier: "MN Tier 1 (VS / DR / MQD)",
  difficulty: "Heroic" as const,
  summary: "6/9 H",
  kills: 6,
  totalBosses: 9,
  bosses: [
    { name: "Imperator Averzian", killed: true },
    { name: "Vorasius", killed: true },
    { name: "Fallen-King Salhadaar", killed: true },
    { name: "Vaelgor & Ezzorak", killed: true },
    { name: "Lightblinded Vanguard", killed: true },
    { name: "Crown of the Cosmos", killed: false },
    { name: "Chimaerus the Undreamt God", killed: true },
    { name: "Belo'ren, Child of Al'ar", killed: false },
    { name: "Midnight Falls", killed: false },
  ],
};

export const footerLinks = [
  { label: "Raider.IO",    href: "https://raider.io/guilds/us/barthilas/Hakuna%20Muh%20Nagga" },
  { label: "WoWProgress",  href: "https://www.wowprogress.com/guild/us/barthilas/Hakuna+Muh+Nagga" },
  { label: "Discord",      href: "https://discord.gg/placeholder" },
  { label: "WarcraftLogs", href: "https://www.warcraftlogs.com/guild/us/barthilas/hakuna%20muh%20nagga" },
] as const;

export const recruitmentRoles = [
  { role: "Tank", specs: ["Blood DK", "Prot Warrior"], priority: "Low" },
  { role: "Healer", specs: ["Resto Druid", "Disc Priest"], priority: "High" },
  { role: "DPS", specs: ["Augmentation Evoker", "Havoc DH", "Arcane Mage"], priority: "High" },
] as const;
