"use client";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Menu, X, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const links = [
  { href: "#home", label: "Home" },
  { href: "#progression", label: "Progression" },
  { href: "#roster", label: "Roster" },
  { href: "#recruitment", label: "Recruitment" },
];

export function Navbar() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isVoid = resolvedTheme !== "light";

  if (!mounted) return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16" />
  );

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled
          ? isVoid
            ? "rgba(3,7,16,0.92)"
            : "rgba(250,248,242,0.92)"
          : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? `1px solid var(--border)` : "1px solid transparent",
      }}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#home" className="flex items-center gap-3 group">
          <Image
            src="/guild-logo.png"
            alt="Hakuna Muh Nagga"
            width={40}
            height={40}
            className="rounded-full"
            style={{ filter: "drop-shadow(0 0 6px var(--glow))" }}
          />
          <span
            className="tracking-wider text-sm hidden sm:block transition-colors"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              color: isVoid ? "#e2d9f3" : "#1e1b0f",
              textShadow: isVoid ? "0 0 20px rgba(168,85,247,0.5)" : "0 0 20px rgba(245,158,11,0.4)",
            }}
          >
            Hakuna Muh Nagga
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm tracking-widest transition-colors duration-200"
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                color: isVoid ? "rgba(226,217,243,0.65)" : "rgba(30,27,15,0.6)",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.color = isVoid ? "#e2d9f3" : "#1e1b0f";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.color = isVoid ? "rgba(226,217,243,0.65)" : "rgba(30,27,15,0.6)";
              }}
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Theme toggle + mobile */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(isVoid ? "light" : "dark")}
            className="relative flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-500 cursor-pointer"
            style={{
              background: isVoid ? "rgba(124,58,237,0.15)" : "rgba(245,158,11,0.12)",
              border: `1px solid var(--border)`,
            }}
            aria-label="Toggle theme"
          >
            <motion.div
              animate={{ x: isVoid ? 0 : 2 }}
              className="flex items-center gap-1.5"
            >
              {isVoid ? (
                <Moon size={14} style={{ color: "#a855f7" }} />
              ) : (
                <Sun size={14} style={{ color: "#f59e0b" }} />
              )}
              <span
                className="text-xs tracking-widest hidden sm:block"
                style={{
                  fontFamily: "'Rajdhani', sans-serif",
                  color: isVoid ? "#a855f7" : "#f59e0b",
                }}
              >
                {isVoid ? "VOID" : "LIGHT"}
              </span>
            </motion.div>
          </button>

          <button
            className="md:hidden"
            onClick={() => setOpen(!open)}
            style={{ color: "var(--text)" }}
            aria-label="Menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
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
            className="md:hidden px-5 pb-5 pt-2"
            style={{ background: isVoid ? "rgba(3,7,16,0.96)" : "rgba(250,248,242,0.96)", borderBottom: "1px solid var(--border)" }}
          >
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block py-3 text-sm tracking-widest"
                style={{ fontFamily: "'Rajdhani', sans-serif", color: "var(--muted)" }}
              >
                {l.label}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
