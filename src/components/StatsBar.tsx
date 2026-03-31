"use client";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Users, Globe, Map, Landmark } from "lucide-react";
function useCountUp(target: number, active: boolean, duration = 1600) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = target / (duration / 16);
    const interval = setInterval(() => {
      start = Math.min(start + step, target);
      setVal(Math.floor(start));
      if (start >= target) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, [active, target, duration]);
  return val;
}

type StatsData = { members: number; world: number; region: number; realm: number }

function StatItem({ icon: Icon, value, label, prefix = "", suffix = "", isVoid }: {
  icon: typeof Users; value: number; label: string; prefix?: string; suffix?: string; isVoid: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const count = useCountUp(value, inView);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col items-center gap-2 px-6 py-2"
    >
      <Icon size={22} style={{ color: "var(--accent)" }} />
      <span
        className="leading-none"
        style={{
          fontFamily: "'VT323', monospace",
          fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
          color: "var(--text)",
          textShadow: isVoid ? "0 0 20px rgba(168,85,247,0.4)" : "0 0 16px rgba(245,158,11,0.3)",
        }}
      >
        {prefix}{count.toLocaleString()}{suffix}
      </span>
      <span
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "var(--px-sm)",
          letterSpacing: "0.15em",
          color: "var(--muted)",
          textTransform: "uppercase" as const,
        }}
      >
        {label}
      </span>
    </motion.div>
  );
}

export function StatsBar({ stats }: { stats: StatsData }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isVoid = mounted ? resolvedTheme !== "light" : false;

  const items = [
    { icon: Users, value: stats.members, label: "Members", suffix: "" },
    { icon: Globe, value: stats.world, label: "World", prefix: "" },
    { icon: Map, value: stats.region, label: "Region", prefix: "" },
    { icon: Landmark, value: stats.realm, label: "Realm", prefix: "" },
  ];

  return (
    <section
      className="relative py-12"
      style={{
        background: isVoid
          ? "linear-gradient(180deg, rgba(45,27,105,0.15) 0%, rgba(8,13,30,0.8) 50%, rgba(45,27,105,0.1) 100%)"
          : "linear-gradient(180deg, rgba(245,158,11,0.05) 0%, rgba(255,254,249,0.9) 50%, rgba(245,158,11,0.05) 100%)",
        borderTop: "2px solid var(--border-dim)",
        borderBottom: "2px solid var(--border-dim)",
      }}
    >
      <div className="max-w-4xl mx-auto px-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x" style={{ ["--tw-divide-opacity" as string]: "1" }}>
          {items.map((s) => (
            <StatItem key={s.label} {...s} isVoid={mounted ? isVoid : true} />
          ))}
        </div>
      </div>
    </section>
  );
}
