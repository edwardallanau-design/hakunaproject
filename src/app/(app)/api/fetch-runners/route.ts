import { getPayload } from "payload";
import config from "@/payload.config";
import type { MythicPlusRunner } from "@/lib/raiderio";

// Strip invisible unicode characters that web copy-paste can introduce
// (zero-width spaces, non-breaking spaces, BOM, directional marks, etc.)
function sanitizeName(s: string): string {
  return s.replace(/[\u0000-\u001f\u007f-\u009f\u00a0\u200b-\u200f\u2028\u2029\ufeff]/g, "").trim();
}

function parsePasteNames(text: string): string[] {
  const lines = text.split("\n").map((l) => sanitizeName(l)).filter(Boolean);
  const names: string[] = [];
  for (let i = 0; i < lines.length; i += 5) {
    if (lines[i]) names.push(lines[i]);
  }
  return [...new Set(names)];
}

export async function POST(request: Request) {
  const payload = await getPayload({ config: await config });

  try {
    const { user } = await payload.auth({ headers: request.headers });
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let pasteText: string;
  try {
    const body = await request.json();
    pasteText = typeof body.pasteText === "string" ? body.pasteText : "";
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!pasteText.trim()) {
    return Response.json({ error: "pasteText is required" }, { status: 400 });
  }

  const parsedNames = parsePasteNames(pasteText);
  if (parsedNames.length === 0) {
    return Response.json({ error: "No names found in paste" }, { status: 400 });
  }

  // Load stored guild members (populated by sync-progression)
  const global = await payload.findGlobal({ slug: "progression" });
  const storedMembers: { name: string; realm: string }[] =
    (global.guildMembers as { name: string; realm: string }[] | null) ?? [];

  const memberMap = new Map(
    storedMembers.map((m) => [sanitizeName(m.name).toLowerCase(), m]),
  );

  const resolved = parsedNames
    .map((n) => memberMap.get(sanitizeName(n).toLowerCase()))
    .filter((m): m is { name: string; realm: string } => !!m);

  const notFound = parsedNames.length - resolved.length;

  // Batch-fetch character profiles 5 at a time with 300ms delay
  const runners: MythicPlusRunner[] = [];

  for (let i = 0; i < resolved.length; i += 5) {
    const batch = resolved.slice(i, i + 5);
    const fetched = await Promise.all(
      batch.map(async (member) => {
        const realmSlug = member.realm.toLowerCase().replace(/['\u2019]/g, "").replace(/\s+/g, "-");
        const res = await fetch(
          `https://raider.io/api/v1/characters/profile?region=us&realm=${realmSlug}&name=${encodeURIComponent(member.name)}&fields=mythic_plus_scores_by_season%3Acurrent,spec`,
        );
        if (!res.ok) return null;
        const d = await res.json() as {
          name?: string;
          class?: string;
          active_spec_name?: string;
          mythic_plus_scores_by_season?: { scores: { all: number } }[];
        };
        const score = d.mythic_plus_scores_by_season?.[0]?.scores?.all ?? 0;
        if (score <= 0) return null;
        return {
          name: d.name!,
          class: d.class!,
          spec: d.active_spec_name!,
          score,
        } satisfies MythicPlusRunner;
      }),
    );
    runners.push(...fetched.filter((x): x is MythicPlusRunner => x !== null));
    if (i + 5 < resolved.length) await new Promise((r) => setTimeout(r, 300));
  }

  const topRunners = runners.sort((a, b) => b.score - a.score).slice(0, 10);
  const syncedAt = new Date().toISOString();

  await payload.updateGlobal({
    slug: "progression",
    data: {
      mythicPlusRunners: topRunners.map((r) => ({
        name:  r.name,
        class: r.class,
        spec:  r.spec,
        score: r.score,
      })),
      mythicPlusSyncedAt: syncedAt,
    },
  });

  return Response.json({
    message:  `Saved ${topRunners.length} runners`,
    count:    topRunners.length,
    notFound,
  });
}
