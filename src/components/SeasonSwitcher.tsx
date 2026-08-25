"use client";
import { useRouter, useSearchParams } from "next/navigation";

export type SwitcherSeason = { urlSlug: string; name: string; startedAt: string };

export function SeasonSwitcher({
  seasons,
  selectedUrlSlug,
  currentUrlSlug,
}: {
  seasons: SwitcherSeason[];
  selectedUrlSlug: string;
  currentUrlSlug: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isArchived = selectedUrlSlug !== currentUrlSlug;

  const ordered = [...seasons].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );

  function handleChange(urlSlug: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (urlSlug === currentUrlSlug) {
      params.delete("season");
    } else {
      params.set("season", urlSlug);
    }
    const query = params.toString();
    router.push(query ? `/?${query}#progression` : "/#progression");
  }

  if (seasons.length <= 1) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 24 }}>
      <select
        value={selectedUrlSlug}
        onChange={(e) => handleChange(e.target.value)}
        aria-label="Select Season"
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "var(--px-sm)",
          color: "var(--text)",
          background: "color-mix(in srgb,var(--accent) 8%,transparent)",
          border: "1px solid var(--border)",
          padding: "clamp(6px,0.6vw,10px) clamp(10px,1vw,16px)",
          letterSpacing: "0.06em",
        }}
      >
        {ordered.map((s) => (
          <option key={s.urlSlug} value={s.urlSlug}>
            {s.name}
            {s.urlSlug === currentUrlSlug ? " (current)" : ""}
          </option>
        ))}
      </select>

      {isArchived && (
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "var(--px-xs)",
            color: "var(--accent2)",
            border: "1px solid color-mix(in srgb,var(--accent2) 40%,transparent)",
            background: "color-mix(in srgb,var(--accent2) 10%,transparent)",
            padding: "clamp(4px,0.4vw,7px) clamp(8px,0.8vw,14px)",
            letterSpacing: "0.08em",
            textAlign: "center",
          }}
        >
          ◆ VIEWING ARCHIVED SEASON — PROGRESSION SHOWN IS HISTORICAL ◆
        </span>
      )}
    </div>
  );
}
