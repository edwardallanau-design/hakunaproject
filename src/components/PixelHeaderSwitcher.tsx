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
  // Where the switcher may sit: clear of the controls on its right AND the nav
  // links on its left. `null` means there is no room, so it does not render.
  const [slot, setSlot] = useState<{ right: number; maxWidth: number } | null>(null);
  // Nothing renders until the first measurement, so the switcher never appears
  // in the header and then jumps below it.
  const [measured, setMeasured] = useState(false);

  useEffect(() => {
    // The switcher has to fit *between* two moving things. Positioning it from
    // one side only is what caused two separate overlaps: first a fixed offset
    // ran it under the theme toggle at 1440px, then measuring only the right
    // side let it run over the RECRUITMENT link everywhere from 640 to 880px.
    // Both sides get measured, and if the gap is too small it steps aside.
    const GAP = 12;
    const MIN_WIDTH = 120;

    const measure = () => {
      const nav = document.querySelector("nav");
      if (!nav) { setMeasured(true); return setSlot(null); }

      const visible = (el: Element | null): el is HTMLElement => {
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && getComputedStyle(el).display !== "none";
      };

      const controls = [
        nav.querySelector('button[aria-label="Toggle theme"]'),
        nav.querySelector('button[aria-label="Menu"]'),
      ].filter(visible);
      if (controls.length === 0) { setMeasured(true); return setSlot(null); }

      const rightEdge = Math.min(...controls.map((el) => el.getBoundingClientRect().left)) - GAP;

      // The nav links, when shown, set the left boundary.
      const links = [...nav.querySelectorAll('a[href^="#"]')].filter(visible);
      const leftEdge =
        links.length > 0 ? Math.max(...links.map((el) => el.getBoundingClientRect().right)) + GAP : GAP;

      const available = rightEdge - leftEdge;
      // Too tight to sit between them without covering something.
      if (available < MIN_WIDTH) { setMeasured(true); return setSlot(null); }

      setMeasured(true);

      setSlot({
        right: Math.max(0, Math.round(window.innerWidth - rightEdge)),
        maxWidth: Math.min(220, Math.floor(available)),
      });
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
  if (!measured) return null;

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

  const select = (
    <select
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
        maxWidth: slot ? slot.maxWidth : undefined,
        minWidth: 0,
      }}
    >
      {ordered.map((s) => (
        <option key={s.urlSlug} value={s.urlSlug}>
          {s.name}
          {s.urlSlug === currentUrlSlug ? "" : " (archived)"}
        </option>
      ))}
    </select>
  );

  // No room between the links and the controls — below 640px, or wherever the
  // links grow enough to close the gap. It falls back to sitting under the
  // navbar rather than covering something, which is the failure the two
  // earlier attempts made.
  if (!slot) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          paddingTop: "calc(clamp(52px,4.5vw,72px) + 16px)",
        }}
      >
        {select}
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: slot.right,
        height: "clamp(52px,4.5vw,72px)",
        display: "flex",
        alignItems: "center",
        zIndex: 51,
        pointerEvents: "none",
      }}
    >
      {select}
    </div>
  );
}

