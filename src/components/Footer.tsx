"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

const links = [
  { label: "Raider.IO", href: "https://raider.io/guilds/us/zuljin/Hakuna%20Muh%20Nagga" },
  { label: "WoWProgress", href: "https://www.wowprogress.com/guild/us/zuljin/Hakuna+Muh+Nagga" },
  { label: "Discord", href: "https://discord.gg/placeholder" },
  { label: "WarcraftLogs", href: "https://www.warcraftlogs.com/guild/us/zuljin/hakuna%20muh%20nagga" },
];

export function Footer() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isVoid = resolvedTheme !== "light";

  return (
    <footer
      className="py-12 px-5"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-6 text-center">
        {/* Guild name */}
        <p
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "1.1rem",
            color: "var(--text)",
            textShadow: isVoid ? "0 0 20px rgba(168,85,247,0.3)" : "0 0 16px rgba(245,158,11,0.3)",
          }}
        >
          Hakuna Muh Nagga
        </p>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-6">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs tracking-wider transition-colors duration-200"
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                color: "var(--muted)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--accent)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}
            >
              {l.label} <ExternalLink size={10} />
            </a>
          ))}
        </div>

        {/* Divider */}
        <div className="w-24 h-px" style={{ background: "var(--border)" }} />

        {/* Copyright */}
        <p className="text-xs" style={{ fontFamily: "'Rajdhani', sans-serif", color: "var(--muted)", opacity: 0.5 }}>
          © {new Date().getFullYear()} Hakuna Muh Nagga · Zul&apos;jin US · World of Warcraft
        </p>
        <p className="text-xs opacity-30" style={{ fontFamily: "'Rajdhani', sans-serif", color: "var(--muted)" }}>
          World of Warcraft is a trademark of Blizzard Entertainment
        </p>
      </div>
    </footer>
  );
}
