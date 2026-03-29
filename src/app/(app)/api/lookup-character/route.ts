import { getPayload } from "payload"
import config from "@/payload.config"
import { fetchGuildCharacterMatches } from "@/lib/raiderio"

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

  const matches = await fetchGuildCharacterMatches(name)
  if (matches.length === 0) {
    return Response.json(
      { error: `"${name}" not found in guild roster` },
      { status: 404 },
    )
  }

  return Response.json(matches)
}
