"use client";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Heart, Swords } from "lucide-react";

const CLASS_COLORS: Record<string, string> = {
  "Death Knight": "#C41E3A", "Demon Hunter": "#A330C9", Druid: "#FF7C0A",
  Evoker: "#33937F", Hunter: "#AAD372", Mage: "#3FC7EB", Monk: "#00FF98",
  Paladin: "#F48CBA", Priest: "#FFFFFF", Rogue: "#FFF468", Shaman: "#0070DD",
  Warlock: "#8788EE", Warrior: "#C69B3A",
};

const ROLE_ICONS = { Tank: Shield, Healer: Heart, DPS: Swords };

type OfficerData = { id: string; name: string; class: string; spec: string; role: string; rank: string; ilvl: number }

export function Officers({ officers }: { officers: OfficerData[] }) {
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
      id="roster"
      className="py-24 px-5"
      style={{
        background: isVoid
          ? "linear-gradient(180deg, transparent, rgba(13,20,40,0.6) 50%, transparent)"
          : "linear-gradient(180deg, transparent, rgba(254,249,236,0.6) 50%, transparent)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "var(--px-md)",
            color: "var(--muted)",
            letterSpacing: "0.2em",
            display: "block",
            marginBottom: 12,
          }}>◆ The Vanguard ◆</span>
          <h2 style={{
            fontFamily: "'VT323', monospace",
            fontSize: "var(--vt-lg)",
            color: "var(--text)",
            textShadow: "0 0 20px color-mix(in srgb,var(--glow) 50%,transparent)",
            letterSpacing: "0.08em",
          }}>
            Guild Officers
          </h2>
        </motion.div>

        <div className="card-track-wrap">
          {/* Arrows */}
          <button className="scroll-arrow left" onClick={() => scrollTrack(-1)} aria-label="Previous">◀</button>
          <button className="scroll-arrow right" onClick={() => scrollTrack(1)} aria-label="Next">▶</button>

          {/* Track */}
          <div className="card-track officers-track" ref={trackRef}>
            {officers.map((member, i) => {
              const classColor = CLASS_COLORS[member.class] ?? "#9ca3af";
              const RoleIcon = ROLE_ICONS[member.role as keyof typeof ROLE_ICONS] ?? Swords;
              return (
                <div key={member.id} className="scroll-card">
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.6 }}
                    whileHover={{ y: -4 }}
                    className="px-card"
                    style={{
                      padding: "clamp(14px,1.3vw,22px)",
                      display: "flex", flexDirection: "column",
                      gap: "clamp(8px,0.7vw,12px)",
                      height: "100%",
                    }}
                  >
                    {/* Class-color top bar */}
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${classColor}, ${classColor}88, transparent)` }} />
                    {/* Class-color corner gems (override --corner) */}
                    <div className="px-gem tl" style={{ background: classColor, boxShadow: `0 0 6px ${classColor}` }} />
                    <div className="px-gem tr" style={{ background: classColor, boxShadow: `0 0 4px ${classColor}` }} />
                    <div className="px-gem bl" style={{ background: classColor, boxShadow: `0 0 4px ${classColor}` }} />
                    <div className="px-gem br" style={{ background: classColor, boxShadow: `0 0 4px ${classColor}` }} />

                    {/* Avatar + name */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: "clamp(42px,3.5vw,58px)", height: "clamp(42px,3.5vw,58px)",
                        border: `2px solid ${classColor}50`,
                        background: `radial-gradient(circle, ${classColor}24, ${classColor}08)`,
                        boxShadow: `0 0 16px ${classColor}30`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        <span style={{ fontFamily: "'VT323', monospace", fontSize: "clamp(24px,2vw,36px)", color: classColor, lineHeight: 1 }}>
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p style={{ fontFamily: "'VT323', monospace", fontSize: "var(--vt-md)", color: "var(--text)", letterSpacing: "0.05em", lineHeight: 1 }}>
                          {member.name}
                        </p>
                        <p style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "var(--px-xs)", color: classColor, marginTop: 3, letterSpacing: "0.08em" }}>
                          {member.class}
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{ borderBottom: "1px solid var(--border-dim)", paddingBottom: "clamp(3px,0.3vw,5px)", display: "flex", justifyContent: "space-between", fontFamily: "'Press Start 2P', monospace", fontSize: "var(--px-xs)", color: "var(--muted)" }}>
                      Spec <span style={{ color: "var(--text)" }}>{member.spec}</span>
                    </div>
                    <div style={{ borderBottom: "1px solid var(--border-dim)", paddingBottom: "clamp(3px,0.3vw,5px)", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "'Press Start 2P', monospace", fontSize: "var(--px-xs)", color: "var(--muted)" }}>
                      Role
                      <span style={{ color: "var(--text)", display: "flex", alignItems: "center", gap: 4 }}>
                        <RoleIcon size={10} style={{ color: classColor, opacity: 0.8 }} />
                        {member.role}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "'Press Start 2P', monospace", fontSize: "var(--px-xs)", color: "var(--muted)" }}>
                      ilvl
                      <span style={{ fontFamily: "'VT323', monospace", fontSize: "var(--vt-md)", color: "var(--accent2)" }}>
                        {member.ilvl}
                      </span>
                    </div>

                    {/* Rank badge */}
                    <div style={{
                      marginTop: "auto",
                      padding: "clamp(4px,0.4vw,7px)",
                      border: "1px solid var(--border-dim)",
                      background: "color-mix(in srgb,var(--accent) 6%,transparent)",
                      textAlign: "center",
                      fontFamily: "'Press Start 2P', monospace",
                      fontSize: "var(--px-xs)",
                      color: "var(--muted)",
                      letterSpacing: "0.1em",
                    }}>
                      {member.rank}
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* Position dots */}
          <div className="scroll-dots">
            {officers.map((_, i) => (
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
      </div>
    </section>
  );
}
