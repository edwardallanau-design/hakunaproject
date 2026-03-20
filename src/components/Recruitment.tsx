"use client";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Heart, Swords } from "lucide-react";

type RecruitmentRoleData = { role: string; specs: string[]; priority: string }

const PRIORITY_STYLE: Record<string, { bg: string; text: string }> = {
  High:   { bg: "rgba(239,68,68,0.15)",   text: "#f87171" },
  Medium: { bg: "rgba(245,158,11,0.12)",  text: "#fbbf24" },
  Low:    { bg: "rgba(34,211,238,0.1)",   text: "#22d3ee" },
};

const ROLE_ICONS = { Tank: Shield, Healer: Heart, DPS: Swords };

export function Recruitment({ recruitmentRoles }: { recruitmentRoles: RecruitmentRoleData[] }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isVoid = resolvedTheme !== "light";

  const [activeCard, setActiveCard] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const cards = Array.from(track.querySelectorAll<HTMLElement>('.scroll-card'));
    const onScroll = () => {
      let closest = 0, minDist = Infinity;
      cards.forEach((c, i) => {
        const dist = Math.abs(c.offsetLeft - track.offsetLeft - track.scrollLeft);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      setActiveCard(closest);
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => track.removeEventListener('scroll', onScroll);
  }, [mounted]);

  const scrollTrack = (dir: 1 | -1) => {
    const track = trackRef.current;
    const card = track?.querySelector<HTMLElement>('.scroll-card');
    if (!track || !card) return;
    track.scrollBy({ left: dir * (card.offsetWidth + 16), behavior: 'smooth' });
  };

  return (
    <section
      id="recruitment"
      className="py-28 px-5 relative overflow-hidden"
      style={{
        background: isVoid
          ? "linear-gradient(135deg, rgba(45,27,105,0.4) 0%, rgba(3,7,16,0.95) 50%, rgba(124,58,237,0.15) 100%)"
          : "linear-gradient(135deg, rgba(254,243,199,0.8) 0%, rgba(250,248,242,0.95) 50%, rgba(245,158,11,0.15) 100%)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "var(--px-md)", color: "var(--accent)", letterSpacing: "0.2em", display: "block", marginBottom: 12 }}>
            ◆ Join the Ranks ◆
          </span>
          <h2 style={{ fontFamily: "'VT323', monospace", fontSize: "var(--vt-lg)", color: "var(--text)", textShadow: "0 0 20px color-mix(in srgb,var(--glow) 50%,transparent)", letterSpacing: "0.08em", marginBottom: 12 }}>
            We&apos;re Recruiting
          </h2>
          <p style={{ fontFamily: "'VT323', monospace", fontSize: "var(--vt-sm)", color: "var(--muted)", maxWidth: "clamp(380px,44vw,580px)", margin: "0 auto" }}>
            Looking for dedicated players who can parse, execute mechanics, and still have fun doing it.
            Semi-hardcore means high standards, low drama.
          </p>
        </motion.div>

        {/* Roles scroll track */}
        <div className="card-track-wrap" style={{ marginBottom: "clamp(28px,2.8vw,44px)" }}>
          <button className="scroll-arrow left" onClick={() => scrollTrack(-1)} aria-label="Previous">◀</button>
          <button className="scroll-arrow right" onClick={() => scrollTrack(1)} aria-label="Next">▶</button>

          <div className="card-track recruitment-track" ref={trackRef}>
            {recruitmentRoles.map((r, i) => {
              const ps = PRIORITY_STYLE[r.priority] ?? PRIORITY_STYLE.Low;
              const RoleIcon = ROLE_ICONS[r.role as keyof typeof ROLE_ICONS] ?? Swords;
              const isHigh = r.priority === "High";
              return (
                <div key={r.role} className="scroll-card">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.6 }}
                    className="px-card"
                    style={{ padding: "clamp(14px,1.3vw,22px)", height: "100%" }}
                  >
                    <div className="px-gem tl" /><div className="px-gem br" />

                    {/* Role row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "clamp(10px,1vw,16px)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: "clamp(30px,2.8vw,46px)", height: "clamp(30px,2.8vw,46px)",
                          border: "2px solid var(--border)",
                          background: "color-mix(in srgb,var(--accent) 10%,transparent)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <RoleIcon size={16} style={{ color: "var(--accent)" }} />
                        </div>
                        <h3 style={{ fontFamily: "'VT323', monospace", fontSize: "var(--vt-md)", color: "var(--text)", letterSpacing: "0.05em" }}>
                          {r.role}
                        </h3>
                      </div>
                      <span style={{
                        fontFamily: "'Press Start 2P', monospace",
                        fontSize: "var(--px-xs)",
                        padding: "clamp(3px,0.3vw,5px) clamp(7px,0.6vw,10px)",
                        border: `1px solid ${ps.text}44`,
                        background: ps.bg,
                        color: ps.text,
                        display: "flex", alignItems: "center", gap: 6,
                      }}>
                        {isHigh && <span className="animate-pulse-dot" style={{ width: 6, height: 6, background: ps.text, borderRadius: "50%", display: "inline-block" }} />}
                        {r.priority}
                      </span>
                    </div>

                    {/* Spec tags */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "clamp(4px,0.4vw,7px)" }}>
                      {r.specs.map((spec) => (
                        <span key={spec} style={{
                          fontFamily: "'Press Start 2P', monospace",
                          fontSize: "var(--px-xs)",
                          padding: "clamp(3px,0.3vw,5px) clamp(7px,0.6vw,10px)",
                          border: "1px solid var(--border-dim)",
                          background: "color-mix(in srgb,var(--accent) 6%,transparent)",
                          color: "var(--muted)",
                        }}>
                          {spec}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>

          <div className="scroll-dots">
            {recruitmentRoles.map((_, i) => (
              <div
                key={i}
                className={`scroll-dot${i === activeCard ? " active" : ""}`}
                onClick={() => {
                  const track = trackRef.current;
                  const cards = track?.querySelectorAll<HTMLElement>('.scroll-card');
                  if (!track || !cards?.[i]) return;
                  track.scrollTo({ left: cards[i].offsetLeft - track.offsetLeft - 4, behavior: 'smooth' });
                }}
              />
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex flex-col items-center gap-4"
        >
          <a
            href="https://discord.gg/placeholder"
            target="_blank"
            rel="noopener noreferrer"
            className="px-btn"
            style={{ fontSize: "var(--px-lg)", padding: "clamp(12px,1.1vw,18px) clamp(24px,2.2vw,36px)" }}
          >
            Apply via Discord ↗
          </a>
          <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "var(--px-sm)", color: "var(--muted)", marginTop: "clamp(10px,1vw,16px)", letterSpacing: "0.1em" }}>
            Exceptional players of any role are always considered
          </p>
        </motion.div>
      </div>
    </section>
  );
}
