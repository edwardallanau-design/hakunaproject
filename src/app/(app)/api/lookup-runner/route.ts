import { getPayload } from "payload"
import config from "@/payload.config"
import type { RunnerMatch } from "@/lib/raiderio"

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

  // Look up realm from the cached guild member list
  const global = await payload.findGlobal({ slug: "progression" })
  const storedMembers: { name: string; realm: string }[] =
    (global.guildMembers as { name: string; realm: string }[] | null) ?? []

  const member = storedMembers.find((m) => m.name.toLowerCase() === name.toLowerCase())
  if (!member) {
    return Response.json(
      { error: `"${name}" not found in guild roster — run Raid Sync first` },
      { status: 404 },
    )
  }

  const realmSlug = member.realm.toLowerCase().replace(/['\u2019]/g, "").replace(/\s+/g, "-")
  const res = await fetch(
    `https://raider.io/api/v1/characters/profile?region=us&realm=${realmSlug}&name=${encodeURIComponent(member.name)}&fields=mythic_plus_scores_by_season%3Acurrent,spec`,
  )

  if (!res.ok) {
    return Response.json({ error: "Character not found on Raider.IO" }, { status: 404 })
  }

  const d = await res.json() as {
    name?: string
    class?: string
    active_spec_name?: string
    mythic_plus_scores_by_season?: { scores: { all: number } }[]
  }

  const match: RunnerMatch = {
    name:  d.name ?? member.name,
    realm: member.realm,
    class: d.class ?? "",
    spec:  d.active_spec_name ?? "",
    score: d.mythic_plus_scores_by_season?.[0]?.scores?.all ?? 0,
  }

  return Response.json([match])
}
