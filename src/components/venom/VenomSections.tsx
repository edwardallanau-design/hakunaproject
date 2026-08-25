"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CLASS_COLORS } from "@/lib/wow-constants";
import { SectionHeader } from "./SectionHeader";

const classColor = (cls: string) => CLASS_COLORS[cls] ?? "#9ca3af";

/* ── 04 · Who We Are ─────────────────────────────────────────────────────── */

export function VenomAbout({ heading, descriptionHTML }: { heading: string; descriptionHTML: string }) {
  return (
    <section
      id="about"
      style={{
        padding: "clamp(80px,9vw,130px) clamp(20px,4vw,64px)",
        background: "linear-gradient(180deg, transparent, rgba(20,50,10,0.12) 50%, transparent)",
        borderTop: "1px solid var(--border-dim)",
      }}
    >
      <div className="venom-about-grid" style={{ maxWidth: "76rem", margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, x: -36 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65 }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: "clamp(14px,1.8vw,30px)", marginBottom: "clamp(18px,2vw,30px)" }}>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(46px,5vw,92px)",
                lineHeight: 1,
                color: "transparent",
                WebkitTextStroke: "1.5px var(--border)",
              }}
            >
              04
            </span>
            <div>
              <span
                style={{
                  fontFamily: "var(--font-ui)",
                  fontWeight: 600,
                  fontSize: "var(--ui-md)",
                  color: "var(--accent2)",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  display: "block",
                }}
              >
                Who We Are
              </span>
              <h2
                style={{
                  margin: "2px 0 0",
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(30px,3vw,54px)",
                  fontWeight: 400,
                  color: "var(--text)",
                  letterSpacing: "0.03em",
                  lineHeight: 1.05,
                  textShadow: "0 0 20px color-mix(in srgb,var(--glow) 45%,transparent)",
                }}
              >
                {heading}
              </h2>
            </div>
          </div>
          {/* Same trust boundary as the pixel layout's About: this HTML is
              produced by Payload's own convertLexicalToHTML from rich text an
              authenticated operator wrote in the admin panel. It is not user
              input and does not cross an untrusted boundary. */}
          <div
            className="richtext"
            style={{ fontFamily: "var(--font-body)", fontSize: "var(--bd-sm)", lineHeight: 1.6, color: "var(--muted)" }}
            dangerouslySetInnerHTML={{ __html: descriptionHTML }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          style={{ position: "relative" }}
        >
          <div style={{ position: "relative", overflow: "hidden", aspectRatio: "4/3", border: "1px solid var(--border)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/guild-logo.png"
              alt="Guild Logo"
              style={{ width: "100%", height: "100%", objectFit: "contain", background: "var(--surface)", padding: "clamp(16px,4%,32px)" }}
            />
            <div
              aria-hidden
              style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 64, background: "linear-gradient(to top, var(--surface), transparent)" }}
            />
          </div>
          {/* Corner brackets, offset outside the frame. */}
          {[
            { top: -6, left: -6, borderTop: true, borderLeft: true },
            { top: -6, right: -6, borderTop: true, borderRight: true },
            { bottom: -6, left: -6, borderBottom: true, borderLeft: true },
            { bottom: -6, right: -6, borderBottom: true, borderRight: true },
          ].map((c, i) => (
            <div
              key={i}
              aria-hidden
              style={{
                position: "absolute",
                width: 22,
                height: 22,
                top: c.top,
                left: c.left,
                right: c.right,
                bottom: c.bottom,
                borderTop: c.borderTop ? "2px solid var(--accent)" : undefined,
                borderBottom: c.borderBottom ? "2px solid var(--accent)" : undefined,
                borderLeft: c.borderLeft ? "2px solid var(--accent)" : undefined,
                borderRight: c.borderRight ? "2px solid var(--accent)" : undefined,
              }}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ── 05 · The Officers ───────────────────────────────────────────────────── */

export type OfficerCard = { id: string; name: string; class: string; spec: string; rank: string; ilvl: number };

export function VenomOfficers({ officers }: { officers: OfficerCard[] }) {
  if (officers.length === 0) return null;

  return (
    <section id="roster" style={{ padding: "clamp(80px,9vw,130px) clamp(20px,4vw,64px)", borderTop: "1px solid var(--border-dim)" }}>
      <div style={{ maxWidth: "76rem", margin: "0 auto" }}>
        <SectionHeader numeral="05" eyebrow="Leadership" heading="The Officers" />
        <div className="venom-officer-grid">
          {officers.map((o, i) => {
            const c = classColor(o.class);
            return (
              <motion.div
                key={o.id}
                className="venom-card-hover"
                initial={{ opacity: 0, scale: 0.94 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: Math.min(i * 0.06, 0.3) }}
                style={{
                  position: "relative",
                  background: "var(--card-bg)",
                  border: "1px solid var(--border-dim)",
                  padding: "clamp(16px,1.4vw,24px)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "clamp(9px,0.8vw,13px)",
                }}
              >
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: `linear-gradient(90deg, ${c}, ${c}88, transparent)`,
                  }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: "clamp(44px,3.6vw,60px)",
                      height: "clamp(44px,3.6vw,60px)",
                      border: `2px solid ${c}50`,
                      background: `radial-gradient(circle, ${c}24, ${c}08)`,
                      boxShadow: `0 0 16px ${c}30`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px,2vw,36px)", color: c, lineHeight: 1 }}>
                      {o.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--bd-md)", color: "var(--text)", lineHeight: 1 }}>
                      {o.name}
                    </p>
                    <p style={{ margin: "4px 0 0", fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: "var(--ui-xs)", color: c, letterSpacing: "0.1em" }}>
                      {o.spec} {o.class}
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid var(--border-dim)",
                    paddingTop: "clamp(8px,0.7vw,12px)",
                    fontFamily: "var(--font-ui)",
                    fontWeight: 600,
                    fontSize: "var(--ui-xs)",
                    color: "var(--muted)",
                    letterSpacing: "0.1em",
                  }}
                >
                  <span>{o.rank}</span>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--bd-md)", color: "var(--accent2)" }}>{o.ilvl}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Recruitment ─────────────────────────────────────────────────────────── */

const PRIORITY = {
  High: { text: "#f87171", bg: "rgba(239,68,68,0.15)" },
  Medium: { text: "#fbbf24", bg: "rgba(245,158,11,0.12)" },
  Low: { text: "#2dd4bf", bg: "rgba(45,212,191,0.1)" },
} as const;

export type RoleCard = { role: string; specs: string[]; priority: keyof typeof PRIORITY };

export function VenomRecruitment({
  heading,
  description,
  roles,
  ctaLabel,
  discordUrl,
  footerNote,
}: {
  heading: string;
  description: string;
  roles: RoleCard[];
  ctaLabel: string;
  discordUrl: string;
  footerNote: string;
}) {
  return (
    <section
      id="recruitment"
      style={{
        padding: "clamp(90px,10vw,150px) clamp(20px,4vw,64px)",
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(135deg, rgba(20,50,10,0.45) 0%, rgba(5,15,8,0.95) 55%, rgba(132,204,22,0.10) 100%)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div style={{ maxWidth: "66rem", margin: "0 auto", position: "relative", zIndex: 10 }}>
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65 }}
          style={{ textAlign: "center", marginBottom: "clamp(40px,4.5vw,64px)" }}
        >
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontWeight: 600,
              fontSize: "var(--ui-md)",
              color: "var(--accent)",
              letterSpacing: "0.34em",
              display: "block",
              marginBottom: 12,
              textTransform: "uppercase",
            }}
          >
            ◆ Join Us ◆
          </span>
          <h2
            style={{
              margin: "0 0 12px",
              fontFamily: "var(--font-display)",
              fontSize: "clamp(38px,4.4vw,80px)",
              fontWeight: 400,
              color: "var(--text)",
              textShadow: "0 0 24px color-mix(in srgb,var(--glow) 50%,transparent)",
              letterSpacing: "0.03em",
              lineHeight: 1,
            }}
          >
            {heading}
          </h2>
          <p style={{ margin: "0 auto", fontFamily: "var(--font-body)", fontSize: "var(--bd-sm)", color: "var(--muted)", maxWidth: "44ch" }}>
            {description}
          </p>
        </motion.div>

        <div className="venom-role-grid" style={{ marginBottom: "clamp(32px,3.2vw,52px)" }}>
          {roles.map((r, i) => {
            const p = PRIORITY[r.priority] ?? PRIORITY.Medium;
            return (
              <motion.div
                key={r.role}
                initial={{ opacity: 0, scale: 0.94 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: Math.min(i * 0.07, 0.25) }}
                style={{
                  position: "relative",
                  background: "var(--card-bg)",
                  border: "1px solid var(--border-dim)",
                  padding: "clamp(16px,1.4vw,24px)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "clamp(10px,1vw,16px)", gap: 8 }}>
                  <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--bd-md)", fontWeight: 400, color: "var(--text)" }}>
                    {r.role}
                  </h3>
                  <span
                    style={{
                      fontFamily: "var(--font-ui)",
                      fontWeight: 700,
                      fontSize: "var(--ui-xs)",
                      padding: "3px 10px",
                      border: `1px solid ${p.text}44`,
                      background: p.bg,
                      color: p.text,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      letterSpacing: "0.14em",
                    }}
                  >
                    {r.priority === "High" && (
                      <span className="animate-pulse-dot" style={{ width: 6, height: 6, background: p.text, borderRadius: "50%", display: "inline-block" }} />
                    )}
                    {r.priority}
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {r.specs.map((s) => (
                    <span
                      key={s}
                      style={{
                        fontFamily: "var(--font-ui)",
                        fontWeight: 600,
                        fontSize: "var(--ui-xs)",
                        padding: "3px 10px",
                        border: "1px solid var(--border-dim)",
                        background: "color-mix(in srgb,var(--accent) 6%,transparent)",
                        color: "var(--muted)",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}
        >
          <a href={discordUrl} target="_blank" rel="noopener noreferrer" className="venom-btn" style={{ letterSpacing: "0.16em" }}>
            {ctaLabel}
          </a>
          <p
            style={{
              margin: "8px 0 0",
              fontFamily: "var(--font-ui)",
              fontWeight: 600,
              fontSize: "var(--ui-sm)",
              color: "var(--muted)",
              letterSpacing: "0.16em",
            }}
          >
            {footerNote}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ── Footer ──────────────────────────────────────────────────────────────── */

export function VenomFooter({ links }: { links: { label: string; href: string }[] }) {
  return (
    <footer style={{ borderTop: "2px solid var(--border-dim)", padding: "clamp(36px,4vw,60px) clamp(24px,3vw,48px)" }}>
      <div
        style={{
          maxWidth: "clamp(480px,60vw,720px)",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "clamp(12px,1.2vw,20px)",
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: "clamp(26px,2.1vw,38px)",
            color: "var(--text)",
            textShadow: "0 0 16px color-mix(in srgb,var(--glow) 40%,transparent)",
            letterSpacing: "0.06em",
          }}
        >
          Potato Corner
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "clamp(16px,1.8vw,32px)" }}>
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 600,
                fontSize: "var(--ui-sm)",
                color: "var(--muted)",
                textDecoration: "none",
                letterSpacing: "0.14em",
                transition: "color 200ms ease",
              }}
            >
              {l.label} ↗
            </a>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, width: "100%", maxWidth: 260 }}>
          <span style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, var(--border), transparent)", maxWidth: 60 }} />
          <span style={{ fontFamily: "var(--font-ui)", fontSize: "var(--ui-sm)", color: "var(--muted)", letterSpacing: "0.15em" }}>◆</span>
          <span style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, var(--border), transparent)", maxWidth: 60 }} />
        </div>
        <p style={{ margin: 0, fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: "var(--ui-xs)", color: "var(--muted)", opacity: 0.5, letterSpacing: "0.1em" }}>
          © 2026 Potato Corner · Barthilas US · World of Warcraft
        </p>
        <p style={{ margin: 0, fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: "var(--ui-xs)", opacity: 0.3, color: "var(--muted)" }}>
          World of Warcraft is a trademark of Blizzard Entertainment
        </p>
      </div>
    </footer>
  );
}

/* ── Back to top ─────────────────────────────────────────────────────────── */

export function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="venom-card-hover"
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 40,
        width: 44,
        height: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        cursor: "pointer",
        background: "var(--card-bg)",
        border: "2px solid var(--border)",
        boxShadow: "0 0 20px color-mix(in srgb,var(--accent) 18%,transparent)",
        backdropFilter: "blur(8px)",
      }}
    >
      <span style={{ fontFamily: "var(--font-ui)", color: "var(--accent)", fontSize: 18, lineHeight: 1 }}>▲</span>
    </button>
  );
}
