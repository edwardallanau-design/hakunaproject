"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * The editorial section header shared by sections 01–05: an outlined numeral, a
 * tracked eyebrow, the heading, and optional right-aligned meta, all above a
 * hairline rule.
 */
export function SectionHeader({
  numeral,
  eyebrow,
  heading,
  meta,
  headingSize = "clamp(34px,3.6vw,64px)",
}: {
  numeral: string;
  eyebrow: string;
  heading: string;
  meta?: ReactNode;
  headingSize?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -36 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.65, ease: "easeOut" }}
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: "clamp(14px,1.8vw,30px)",
        flexWrap: "wrap",
        marginBottom: "clamp(40px,4.5vw,70px)",
        borderBottom: "1px solid var(--border-dim)",
        paddingBottom: "clamp(16px,1.8vw,28px)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(46px,5vw,92px)",
          lineHeight: 1,
          color: "transparent",
          WebkitTextStroke: "1.5px var(--border)",
        }}
      >
        {numeral}
      </span>
      <div style={{ flex: 1, minWidth: "min(100%, 300px)" }}>
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
          {eyebrow}
        </span>
        <h2
          style={{
            margin: "2px 0 0",
            fontFamily: "var(--font-display)",
            fontSize: headingSize,
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
      {meta}
    </motion.div>
  );
}
