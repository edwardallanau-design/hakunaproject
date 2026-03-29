"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Shield, Clock } from "lucide-react";
type Props = { guild: { description: string; raidSchedule: string[]; founded: string } }

export function About({ guild }: Props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isVoid = resolvedTheme !== "light";

  return (
    <section
      id="about"
      className="py-24 px-5 relative"
      style={{
        background: isVoid
          ? "linear-gradient(180deg, transparent, rgba(45,27,105,0.1) 50%, transparent)"
          : "linear-gradient(180deg, transparent, rgba(245,158,11,0.05) 50%, transparent)",
      }}
    >
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* Left: text */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-xs tracking-[0.3em] uppercase mb-3"
            style={{ fontFamily: "'Rajdhani', sans-serif", color: "var(--accent)" }}>
            About Us
          </p>
          <h2
            className="mb-5 glow-text"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(1.4rem, 3.5vw, 2rem)",
              color: "var(--text)",
            }}
          >
            The Guild
          </h2>
          <div className="mb-8 text-base leading-relaxed richtext" style={{ color: "var(--muted)" }} dangerouslySetInnerHTML={{ __html: guild.description }} />

          {/* Raid schedule */}
          <div
            className="glass-card rounded-xl p-5 space-y-3"
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock size={14} style={{ color: "var(--accent)" }} />
              <span className="text-xs tracking-[0.25em] uppercase" style={{ fontFamily: "'Rajdhani', sans-serif", color: "var(--muted)" }}>
                Raid Schedule
              </span>
            </div>
            {guild.raidSchedule.map((s) => (
              <div key={s} className="flex items-center gap-3">
                <Calendar size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />
                <span className="text-sm" style={{ fontFamily: "'Rajdhani', sans-serif", color: "var(--text)" }}>
                  {s}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-3 pt-1">
              <Shield size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />
              <span className="text-sm" style={{ fontFamily: "'Rajdhani', sans-serif", color: "var(--muted)" }}>
                Founded {guild.founded}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Right: decorative arcane panel */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative"
        >
          <div
            className="relative rounded-2xl overflow-hidden aspect-[4/3]"
            style={{ border: "1px solid var(--border)" }}
          >
            {/* Arcane crystal art */}
            <svg viewBox="0 0 400 300" className="w-full h-full" style={{ background: isVoid ? "#080d1e" : "#fef9ec" }}>
              <defs>
                <radialGradient id="aboutGlow" cx="50%" cy="50%" r="60%">
                  <stop offset="0%" stopColor={isVoid ? "#7c3aed" : "#fbbf24"} stopOpacity="0.25" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
                <filter id="aboutBlur">
                  <feGaussianBlur stdDeviation="8" />
                </filter>
              </defs>

              <ellipse cx="200" cy="150" rx="160" ry="120" fill="url(#aboutGlow)" />

              {/* Crystal formation */}
              {[
                [200, 60, 200, 200, 160, 240, 200, 60],
                [200, 60, 200, 200, 240, 240, 200, 60],
                [170, 100, 200, 200, 140, 220, 170, 100],
                [230, 100, 200, 200, 260, 220, 230, 100],
              ].map((pts, i) => (
                <polygon
                  key={i}
                  points={`${pts[0]},${pts[1]} ${pts[2]},${pts[3]} ${pts[4]},${pts[5]}`}
                  fill={isVoid ? "#7c3aed" : "#f59e0b"}
                  opacity={0.12 + i * 0.05}
                  stroke={isVoid ? "#a855f7" : "#fbbf24"}
                  strokeWidth="0.8"
                  strokeOpacity="0.4"
                />
              ))}

              {/* Center crystal */}
              <polygon
                points="200,80 220,140 200,200 180,140"
                fill={isVoid ? "#a855f7" : "#fbbf24"}
                opacity="0.25"
                stroke={isVoid ? "#22d3ee" : "#d97706"}
                strokeWidth="1.2"
                strokeOpacity="0.7"
              />

              {/* Inner light */}
              <ellipse cx="200" cy="150" rx="20" ry="30"
                fill={isVoid ? "#22d3ee" : "#fffde7"}
                filter="url(#aboutBlur)"
                opacity="0.3"
              />
              <circle cx="200" cy="150" r="4"
                fill={isVoid ? "#22d3ee" : "#fbbf24"}
                opacity="0.8"
              />

              {/* Decorative runes around border */}
              {Array.from({ length: 16 }).map((_, i) => {
                const a = (i / 16) * 2 * Math.PI;
                const r = 130;
                const x = 200 + r * Math.cos(a);
                const y = 150 + r * 0.85 * Math.sin(a);
                return (
                  <circle key={i} cx={x} cy={y} r="2"
                    fill={isVoid ? "#7c3aed" : "#f59e0b"}
                    opacity="0.4"
                  />
                );
              })}

              {/* Guild name watermark */}
              <text
                x="200" y="270"
                textAnchor="middle"
                fontSize="11"
                fill={isVoid ? "#7c3aed" : "#d97706"}
                opacity="0.5"
                style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.2em" }}
              >
                HAKUNA MUH NAGGA
              </text>
            </svg>

            {/* Overlay gradient at bottom */}
            <div
              className="absolute bottom-0 left-0 right-0 h-16"
              style={{
                background: isVoid
                  ? "linear-gradient(to top, #080d1e, transparent)"
                  : "linear-gradient(to top, #fef9ec, transparent)",
              }}
            />
          </div>

          {/* Corner accents */}
          {[
            "top-0 left-0 border-t border-l",
            "top-0 right-0 border-t border-r",
            "bottom-0 left-0 border-b border-l",
            "bottom-0 right-0 border-b border-r",
          ].map((cls, i) => (
            <div
              key={i}
              className={`absolute w-5 h-5 ${cls}`}
              style={{ borderColor: "var(--accent)", opacity: 0.6 }}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
