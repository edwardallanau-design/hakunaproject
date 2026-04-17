"use client";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const links = [
  { href: "#home",        label: "HOME" },
  { href: "#progression", label: "PROGRESSION" },
  { href: "#roster",      label: "ROSTER" },
  { href: "#recruitment", label: "RECRUITMENT" },
];

export function Navbar() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted]             = useState(false);
  const [open, setOpen]                   = useState(false);
  const [scrolled, setScrolled]           = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = links.map((l) => l.href.slice(1));
    const handleScroll = () => {
      const trigger = window.scrollY + window.innerHeight * 0.38;
      let current = "home";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= trigger) current = id;
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isVoid = resolvedTheme !== "light";
  if (!mounted) return <nav className="fixed top-0 left-0 right-0 z-50" style={{ height: "clamp(52px,4.5vw,72px)" }} />;

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled
          ? isVoid ? "rgba(3,7,16,0.94)" : "rgba(250,248,242,0.95)"
          : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "2px solid var(--border)" : "2px solid transparent",
        boxShadow: scrolled ? "0 0 0 1px color-mix(in srgb,var(--accent2) 10%,transparent),0 4px 20px color-mix(in srgb,var(--accent) 12%,transparent)" : "none",
      }}
    >
      <div
        className="max-w-7xl mx-auto flex items-center justify-between gap-3"
        style={{ padding: "0 clamp(16px,2.5vw,48px)", height: "clamp(52px,4.5vw,72px)" }}
      >
        {/* Logo */}
        <a href="#home" className="flex items-center gap-2 min-w-0" style={{ textDecoration: "none", flexShrink: 1 }}>
          {/* Pixel gem replacing image drop-shadow */}
          <div style={{
            width: 10, height: 10, flexShrink: 0,
            background: "var(--glow)",
            transform: "rotate(45deg)",
            boxShadow: "0 0 8px var(--glow)",
          }} />
          {/* Title — hidden below 520px */}
          <span
            className="hidden-below-520"
            style={{
              fontFamily: "'VT323', monospace",
              fontSize: "clamp(18px,1.7vw,32px)",
              color: "var(--text)",
              textShadow: "0 0 16px color-mix(in srgb,var(--glow) 70%,transparent)",
              letterSpacing: "0.1em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            POTATO CORNER
          </span>
        </a>

        {/* Desktop nav links — hidden below 640px */}
        <div className="hidden-below-640 items-center" style={{ gap: "clamp(20px,2vw,36px)" }}>
          {links.map((l) => {
            const sId = l.href.slice(1);
            const isActive = activeSection === sId;
            return (
              <a
                key={l.href}
                href={l.href}
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: "var(--px-md)",
                  color: isActive ? "var(--glow)" : isVoid ? "rgba(226,217,243,0.6)" : "rgba(30,27,15,0.55)",
                  textShadow: isActive ? "0 0 8px var(--glow)" : "none",
                  letterSpacing: "0.1em",
                  textDecoration: "none",
                  position: "relative",
                }}
              >
                {l.label}
                {isActive && (
                  <motion.div
                    layoutId="navUnderline"
                    style={{ position: "absolute", bottom: -2, left: 0, right: 0, height: 2, background: "var(--glow)" }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </a>
            );
          })}
        </div>

        {/* Right side controls */}
        <div className="flex items-center" style={{ gap: 10, flexShrink: 0 }}>
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(isVoid ? "light" : "dark")}
            className="flex items-center cursor-pointer"
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "var(--px-sm)",
              gap: 7,
              padding: "clamp(5px,0.45vw,8px) clamp(8px,0.9vw,14px)",
              border: "2px solid var(--border)",
              background: "color-mix(in srgb,var(--accent) 12%,transparent)",
              color: "var(--glow)",
            }}
            aria-label="Toggle theme"
          >
            {isVoid
              ? <Moon size={10} style={{ color: "var(--glow)", flexShrink: 0 }} />
              : <Sun  size={10} style={{ color: "var(--glow)", flexShrink: 0 }} />}
            <span className="hidden-below-400">{isVoid ? "VOID" : "LIGHT"}</span>
          </button>

          {/* Hamburger — only below 640px */}
          <button
            className="show-below-640"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "var(--px-md)",
              background: "transparent",
              border: "1px solid var(--border-dim)",
              color: "var(--muted)",
              cursor: "pointer",
              padding: "clamp(5px,0.45vw,8px) clamp(8px,0.9vw,12px)",
            }}
            aria-label="Menu"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              background: isVoid ? "rgba(3,7,16,0.97)" : "rgba(250,248,242,0.97)",
              borderBottom: "2px solid var(--border)",
              padding: "12px 20px",
            }}
          >
            {links.map((l, i) => {
              const sId = l.href.slice(1);
              const isActive = activeSection === sId;
              return (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 8px",
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: "var(--px-md)",
                    color: isActive ? "var(--glow)" : "var(--muted)",
                    background: isActive ? "color-mix(in srgb,var(--accent) 10%,transparent)" : "transparent",
                    textDecoration: "none",
                    letterSpacing: "0.1em",
                  }}
                >
                  {isActive && (
                    <span style={{ width: 6, height: 6, background: "var(--glow)", transform: "rotate(45deg)", flexShrink: 0 }} />
                  )}
                  {l.label}
                </motion.a>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
