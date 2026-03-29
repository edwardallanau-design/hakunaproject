"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Shield, Clock } from "lucide-react";
type Props = { guild: { eyebrow: string; heading: string; description: string; raidSchedule: string[]; founded: string } }

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
        borderTop: "1px solid var(--border)",
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
            {guild.eyebrow}
          </p>
          <h2
            className="mb-5 glow-text"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(1.4rem, 3.5vw, 2rem)",
              color: "var(--text)",
            }}
          >
            {guild.heading}
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
            {/* Guild logo */}
            <img
              src="/guild-logo.png"
              alt="Guild Logo"
              className="w-full h-full object-contain"
              style={{ background: isVoid ? "#080d1e" : "#fef9ec", padding: "clamp(16px,4%,32px)" }}
            />

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
