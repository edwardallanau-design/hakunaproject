"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp } from "lucide-react";

export function Footer({ links }: { links: { label: string; href: string }[] }) {
  const [mounted, setMounted]   = useState(false);
  const [showTop, setShowTop]   = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Floating back-to-top */}
      <AnimatePresence>
        {mounted && showTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            whileHover={{ y: -2 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="px-card"
            style={{
              position: "fixed",
              bottom: "1.5rem",
              right: "1.5rem",
              zIndex: 40,
              width: 40, height: 40,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 0,
              cursor: "pointer",
            }}
            aria-label="Back to top"
          >
            <div className="px-gem tl" style={{ width: 5, height: 5, position: "absolute", top: 0, left: 0 }} />
            <ChevronUp size={16} style={{ color: "var(--accent)" }} />
          </motion.button>
        )}
      </AnimatePresence>

      <footer
        style={{
          borderTop: "2px solid var(--border-dim)",
          padding: "clamp(36px,4vw,60px) clamp(24px,3vw,48px)",
        }}
      >
        <div style={{ maxWidth: "clamp(480px,60vw,720px)", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "clamp(12px,1.2vw,20px)", textAlign: "center" }}>
          {/* Guild name */}
          <p style={{
            fontFamily: "'VT323', monospace",
            fontSize: "clamp(24px,2vw,36px)",
            color: "var(--text)",
            textShadow: "0 0 16px color-mix(in srgb,var(--glow) 40%,transparent)",
            letterSpacing: "0.1em",
          }}>
            Potato Corner
          </p>

          {/* Links */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "clamp(16px,1.8vw,32px)" }}>
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: "var(--px-sm)",
                  color: "var(--muted)",
                  textDecoration: "none",
                  letterSpacing: "0.1em",
                  transition: "color 200ms ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--glow)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}
              >
                {l.label} ↗
              </a>
            ))}
          </div>

          {/* px-divider */}
          <div className="px-divider" style={{ width: "100%", maxWidth: 260 }}>
            <span className="px-divider-label">◆</span>
          </div>

          {/* Copyright */}
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "var(--px-xs)", color: "var(--muted)", opacity: 0.4, letterSpacing: "0.08em" }}>
            © {new Date().getFullYear()} Potato Corner · Barthilas US · World of Warcraft
          </p>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "var(--px-xs)", opacity: 0.25, color: "var(--muted)" }}>
            World of Warcraft is a trademark of Blizzard Entertainment
          </p>
        </div>
      </footer>
    </>
  );
}
