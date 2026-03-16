"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

type RecruitmentRoleData = { role: string; specs: string[]; priority: string }

const PRIORITY_STYLE: Record<string, { bg: string; text: string }> = {
  High: { bg: "rgba(239,68,68,0.15)", text: "#f87171" },
  Low:  { bg: "rgba(34,211,238,0.1)", text: "#22d3ee" },
};

export function Recruitment({ recruitmentRoles }: { recruitmentRoles: RecruitmentRoleData[] }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isVoid = resolvedTheme !== "light";

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
      {/* Background ambient */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: isVoid
            ? "radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.12) 0%, transparent 65%)"
            : "radial-gradient(ellipse at 50% 50%, rgba(251,191,36,0.15) 0%, transparent 65%)",
        }}
      />

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <p className="text-xs tracking-[0.3em] uppercase mb-3"
            style={{ fontFamily: "'Rajdhani', sans-serif", color: "var(--accent)" }}>
            Join the Ranks
          </p>
          <h2
            className="glow-text mb-4"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(1.6rem, 4vw, 2.8rem)",
              color: "var(--text)",
            }}
          >
            We&apos;re Recruiting
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: "var(--muted)" }}>
            Looking for dedicated players who can parse, execute mechanics, and still have fun doing it.
            Semi-hardcore means high standards, low drama.
          </p>
        </motion.div>

        {/* Roles grid */}
        <div className="grid sm:grid-cols-3 gap-5 mb-12">
          {recruitmentRoles.map((r, i) => {
            const ps = PRIORITY_STYLE[r.priority] ?? PRIORITY_STYLE.Low;
            return (
              <motion.div
                key={r.role}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="glass-card rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "0.95rem", color: "var(--text)" }}>
                    {r.role}
                  </h3>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      background: ps.bg,
                      color: ps.text,
                      border: `1px solid ${ps.text}44`,
                    }}
                  >
                    {r.priority}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {r.specs.map((spec) => (
                    <span
                      key={spec}
                      className="px-2.5 py-1 rounded-md text-xs"
                      style={{
                        fontFamily: "'Rajdhani', sans-serif",
                        background: isVoid ? "rgba(124,58,237,0.1)" : "rgba(245,158,11,0.08)",
                        border: "1px solid var(--border)",
                        color: "var(--muted)",
                      }}
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
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
            className="flex items-center gap-2 px-10 py-4 rounded-xl text-sm tracking-widest font-medium transition-all duration-300"
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              background: isVoid
                ? "linear-gradient(135deg, #7c3aed, #4a1d8a)"
                : "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "#fff",
              boxShadow: isVoid
                ? "0 0 30px rgba(124,58,237,0.5)"
                : "0 0 30px rgba(245,158,11,0.4)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            Apply via Discord <ExternalLink size={14} />
          </a>
          <p className="text-xs" style={{ fontFamily: "'Rajdhani', sans-serif", color: "var(--muted)" }}>
            Exceptional players of any role are always considered
          </p>
        </motion.div>
      </div>
    </section>
  );
}
