"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { SwitcherSeason } from "@/components/SeasonSwitcher";

/**
 * The Season switcher, placed in the pixel layout's header.
 *
 * **This is a deliberate, operator-approved amendment to the Season 1 freeze**
 * (2026-08-25): the switcher moves from mid-page into the navbar so both
 * layouts place it the same way. Season 1's page therefore does change, and the
 * committed baselines under .scratch/season-2-theming/baselines/ were updated
 * to match.
 *
 * It is a separate component rather than an edit to `Navbar.tsx` so the eight
 * original components stay untouched: the freeze bends here by addition, not by
 * modification, and reverting is deleting one file plus one line in page.tsx.
 *
 * Positioned absolutely into the navbar's right-hand region rather than being a
 * child of it, since `Navbar` renders its own fixed bar and accepts no slot.
 */
/**
 * The "you are reading history" notice, kept in its original mid-page position.
 *
 * Lifted out of `SeasonSwitcher` rather than toggled with a prop: that file is
 * one of the eight frozen components, and adding a flag to it would be editing
 * Season 1's layout code. The markup here is a copy of what it rendered, so the
 * notice itself is unchanged on screen.
 */
export function PixelArchivedNotice() {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
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
    </div>
  );
}

export function PixelHeaderSwitcher({
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
  // How far to sit from the right edge, measured from the controls Navbar
  // actually rendered rather than guessed.
  const [rightOffset, setRightOffset] = useState<number | null>(null);

  useEffect(() => {
    // A fixed `paddingRight` cannot track this: the navbar sizes its controls
    // with clamp() and hides the hamburger above 640px, so the space they
    // occupy is not a simple function of viewport width. Guessing produced a
    // real overlap at 1440px — the select ran under the theme toggle.
    const measure = () => {
      const nav = document.querySelector("nav");
      if (!nav) return;
      const controls = [
        nav.querySelector<HTMLElement>('button[aria-label="Toggle theme"]'),
        nav.querySelector<HTMLElement>('button[aria-label="Menu"]'),
      ].filter((el): el is HTMLElement => {
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && getComputedStyle(el).display !== "none";
      });
      if (controls.length === 0) return setRightOffset(null);
      // Sit left of the leftmost control, with a gap matching the navbar's own.
      const leftmost = Math.min(...controls.map((el) => el.getBoundingClientRect().left));
      setRightOffset(Math.max(0, Math.round(window.innerWidth - leftmost + 12)));
    };
    measure();
    window.addEventListener("resize", measure, { passive: true });
    // The navbar mounts its controls after hydration, so measure once more.
    const t = setTimeout(measure, 120);
    return () => {
      window.removeEventListener("resize", measure);
      clearTimeout(t);
    };
  }, []);

  if (seasons.length <= 1) return null;

  const ordered = [...seasons].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );

  function handleChange(urlSlug: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (urlSlug === currentUrlSlug) params.delete("season");
    else params.set("season", urlSlug);
    const query = params.toString();
    router.push(query ? `/?${query}` : "/");
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        // Measured clearance for whatever controls the navbar is showing.
        // Hidden until measured, so it never flashes in the wrong place.
        paddingRight: rightOffset ?? 0,
        visibility: rightOffset === null ? "hidden" : "visible",
        height: "clamp(52px,4.5vw,72px)",
        display: "flex",
        alignItems: "center",
        zIndex: 51,
        pointerEvents: "none",
      }}
    >
      <select
        className="hidden-below-640"
        value={selectedUrlSlug}
        onChange={(e) => handleChange(e.target.value)}
        aria-label="Select Season"
        style={{
          pointerEvents: "auto",
          fontFamily: "var(--font-ui)",
          fontSize: "var(--px-xs)",
          color: "var(--text)",
          background: "color-mix(in srgb,var(--accent) 12%,transparent)",
          border: "2px solid var(--border)",
          padding: "clamp(4px,0.4vw,7px) clamp(6px,0.6vw,10px)",
          letterSpacing: "0.06em",
          maxWidth: "clamp(140px,14vw,220px)",
        }}
      >
        {ordered.map((s) => (
          <option key={s.urlSlug} value={s.urlSlug}>
            {s.name}
            {s.urlSlug === currentUrlSlug ? "" : " (archived)"}
          </option>
        ))}
      </select>
    </div>
  );
}
