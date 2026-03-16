"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Heart, Swords } from "lucide-react";
import { officers, CLASS_COLORS } from "@/lib/guildData";

const ROLE_ICONS = { Tank: Shield, Healer: Heart, DPS: Swords };

export function Officers() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isVoid = resolvedTheme !== "light";

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
          <p className="text-xs tracking-[0.3em] uppercase mb-3"
            style={{ fontFamily: "'Cinzel', serif", color: "var(--muted)" }}>
            The Vanguard
          </p>
          <h2
            className="glow-text"
            style={{
              fontFamily: "'Pirata One', serif",
              fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
              color: "var(--text)",
            }}
          >
            Guild Officers
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {officers.map((member, i) => {
            const classColor = CLASS_COLORS[member.class] ?? "#9ca3af";
            const RoleIcon = ROLE_ICONS[member.role as keyof typeof ROLE_ICONS] ?? Swords;

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                whileHover={{ y: -5 }}
                className="glass-card rounded-2xl p-6 flex flex-col gap-4"
              >
                {/* Avatar */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `radial-gradient(circle, ${classColor}22, transparent)`,
                      border: `2px solid ${classColor}55`,
                      boxShadow: `0 0 12px ${classColor}33`,
                    }}
                  >
                    <RoleIcon size={20} style={{ color: classColor }} />
                  </div>
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ fontFamily: "'Cinzel', serif", color: "var(--text)" }}
                    >
                      {member.name}
                    </p>
                    <p className="text-xs" style={{ color: classColor }}>
                      {member.class}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span style={{ fontFamily: "'Cinzel', serif", color: "var(--muted)" }}>Spec</span>
                    <span style={{ fontFamily: "'Cinzel', serif", color: "var(--text)" }}>{member.spec}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ fontFamily: "'Cinzel', serif", color: "var(--muted)" }}>Role</span>
                    <span style={{ fontFamily: "'Cinzel', serif", color: "var(--text)" }}>{member.role}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ fontFamily: "'Cinzel', serif", color: "var(--muted)" }}>ilvl</span>
                    <span style={{
                      fontFamily: "'Cinzel', serif",
                      color: isVoid ? "#22d3ee" : "#f59e0b",
                    }}>
                      {member.ilvl}
                    </span>
                  </div>
                </div>

                {/* Rank badge */}
                <div
                  className="mt-auto px-2 py-1 rounded-md text-center text-xs tracking-wider"
                  style={{
                    fontFamily: "'Cinzel', serif",
                    background: isVoid ? "rgba(124,58,237,0.1)" : "rgba(245,158,11,0.1)",
                    border: "1px solid var(--border)",
                    color: "var(--muted)",
                  }}
                >
                  {member.rank}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
