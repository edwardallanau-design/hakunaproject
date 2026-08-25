"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

const LINKS = [
  { id: "home", label: "Home" },
  { id: "progression", label: "Raid" },
  { id: "dungeons", label: "Dungeons" },
  { id: "leaderboard", label: "Leaderboard" },
  { id: "recruitment", label: "Join" },
];

export type SwitcherSeason = { urlSlug: string; name: string; startedAt: string };

/**
 * The editorial navbar. The Season switcher lives here rather than mid-page —
 * the design moved it into the header, and the `?season=` routing is the same
 * mechanism the pixel layout's SeasonSwitcher uses.
 *
 * There is no light/dark toggle: venom is dark-only, so a control that appears
 * to offer a choice it will not honour would be worse than its absence.
 */
export function VenomNavbar({
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
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("home");

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      // Scroll-spy: the section whose top has passed 38% of the viewport.
      const trigger = y + window.innerHeight * 0.38;
      let current = "home";
      for (const l of LINKS) {
        const el = document.getElementById(l.id);
        if (el && el.offsetTop <= trigger) current = l.id;
      }
      setActive(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Newest first, matching the pixel switcher's ordering.
  const ordered = [...seasons].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );

  function handleChange(urlSlug: string) {
    const params = new URLSearchParams(searchParams.toString());
    // The current Season is the bare URL; only an archive carries the param.
    if (urlSlug === currentUrlSlug) params.delete("season");
    else params.set("season", urlSlug);
    const query = params.toString();
    router.push(query ? `/?${query}` : "/");
  }

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: "background 0.5s, backdrop-filter 0.5s, border-color 0.5s",
        background: scrolled ? "rgba(5,15,8,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: `1px solid ${scrolled ? "var(--border-dim)" : "transparent"}`,
      }}
    >
      <div
        style={{
          maxWidth: "88rem",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "0 clamp(16px,2.5vw,48px)",
          height: "clamp(54px,4.5vw,74px)",
        }}
      >
        <a href="#home" style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0, textDecoration: "none" }}>
          {/* The potato mark: an irregular blob rather than a circle. */}
          <div
            style={{
              width: 15,
              height: 11,
              flexShrink: 0,
              background: "radial-gradient(circle at 40% 35%, #e3bc7f, #b9854a 60%, #6e4a24)",
              borderRadius: "52% 60% 55% 62%",
              transform: "rotate(-16deg)",
              boxShadow: "0 0 9px var(--glow)",
            }}
          />
          <span
            className="venom-hide-520"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(19px,1.7vw,32px)",
              color: "var(--text)",
              letterSpacing: "0.08em",
              whiteSpace: "nowrap",
            }}
          >
            Potato Corner
          </span>
        </a>

        <div className="venom-hide-640" style={{ alignItems: "center", gap: "clamp(18px,2vw,36px)" }}>
          {LINKS.map((l) => {
            const isActive = active === l.id;
            return (
              <a
                key={l.id}
                href={`#${l.id}`}
                style={{
                  fontFamily: "var(--font-ui)",
                  fontWeight: 600,
                  fontSize: "var(--ui-md)",
                  color: isActive ? "var(--glow)" : "rgba(227,240,218,0.6)",
                  letterSpacing: "0.16em",
                  textDecoration: "none",
                  position: "relative",
                }}
              >
                {l.label}
                {isActive && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: -4,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: "linear-gradient(90deg,var(--accent),var(--accent2))",
                    }}
                  />
                )}
              </a>
            );
          })}
        </div>

        {seasons.length > 1 && (
          <select
            value={selectedUrlSlug}
            onChange={(e) => handleChange(e.target.value)}
            aria-label="Select Season"
            style={{
              fontFamily: "var(--font-ui)",
              fontWeight: 600,
              fontSize: "var(--ui-xs)",
              color: "var(--glow)",
              background: "color-mix(in srgb,var(--accent) 10%,transparent)",
              border: "1px solid var(--border)",
              padding: "clamp(5px,0.5vw,9px) clamp(8px,0.8vw,13px)",
              letterSpacing: "0.1em",
              flexShrink: 0,
            }}
          >
            {ordered.map((s) => (
              <option key={s.urlSlug} value={s.urlSlug}>
                {s.name}
                {s.urlSlug === currentUrlSlug ? "" : " (archived)"}
              </option>
            ))}
          </select>
        )}
      </div>
    </motion.nav>
  );
}
