import { getPayload } from "payload"
import config from "@/payload.config"
import type { RosterMember, CharacterMatch } from "@/lib/raiderio"

const ROLE_MAP: Record<string, "Tank" | "Healer" | "DPS"> = {
  tank: "Tank",
  healer: "Healer",
  dps: "DPS",
  melee: "DPS",
  ranged: "DPS",
}

export async function GET(request: Request) {
  const payload = await getPayload({ config: await config })

  try {
    const { user } = await payload.auth({ headers: request.headers })
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const name = searchParams.get("name")

  if (!name) return Response.json({ error: "Name is required" }, { status: 400 })

  const roster = await payload.findGlobal({ slug: "roster" })
  const members: RosterMember[] = (roster.members as RosterMember[] | null) ?? []

  if (members.length === 0) {
    return Response.json(
      { error: "No roster data found — sync the Guild Roster first" },
      { status: 400 },
    )
  }

  const matches: CharacterMatch[] = members
    .filter((m) => m.character.name.toLowerCase() === name.toLowerCase())
    .map((m) => ({
      name: m.character.name,
      realm: m.character.realm.name,
      class: m.character.class.name,
      spec: m.character.spec.name,
      role: ROLE_MAP[m.character.spec.role.toLowerCase()] ?? "DPS",
      ilvl: m.character.itemLevelEquipped,
    }))

  if (matches.length === 0) {
    return Response.json(
      { error: `"${name}" not found in guild roster` },
      { status: 404 },
    )
  }

  return Response.json(matches)
}
