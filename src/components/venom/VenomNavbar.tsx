"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

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
  const [menuOpen, setMenuOpen] = useState(false);

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

        {/* The switcher and the menu button share the right-hand side. They are
            siblings in one flex row rather than positioned independently, so
            they cannot overlap at any width — the mistake the pixel layout's
            switcher made when it guessed a fixed offset instead. */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, minWidth: 0 }}>
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
                flexShrink: 1,
                minWidth: 0,
                maxWidth: "clamp(120px,32vw,260px)",
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

          {/* Only below 640px, where the link row is hidden. Without it the
              sections are unreachable on a phone except by scrolling. */}
          <button
            className="venom-show-640"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label="Menu"
            style={{
              fontFamily: "var(--font-ui)",
              fontWeight: 700,
              fontSize: "var(--ui-md)",
              background: "transparent",
              border: "1px solid var(--border-dim)",
              color: "var(--muted)",
              cursor: "pointer",
              padding: "clamp(5px,0.45vw,8px) clamp(9px,0.9vw,13px)",
              flexShrink: 0,
              lineHeight: 1,
            }}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            style={{
              background: "rgba(5,15,8,0.97)",
              backdropFilter: "blur(16px)",
              borderBottom: "1px solid var(--border)",
              padding: "8px clamp(16px,2.5vw,48px) 14px",
            }}
          >
            {LINKS.map((l) => {
              const isActive = active === l.id;
              return (
                <a
                  key={l.id}
                  href={`#${l.id}`}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "11px 4px",
                    fontFamily: "var(--font-ui)",
                    fontWeight: 600,
                    fontSize: "var(--ui-lg)",
                    letterSpacing: "0.16em",
                    color: isActive ? "var(--glow)" : "rgba(227,240,218,0.7)",
                    textDecoration: "none",
                  }}
                >
                  {isActive && (
                    <span
                      aria-hidden
                      style={{
                        width: 6,
                        height: 6,
                        background: "var(--glow)",
                        transform: "rotate(45deg)",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  {l.label}
                </a>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
