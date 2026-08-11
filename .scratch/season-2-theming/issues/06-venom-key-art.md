# 06 — Venom key art

**What to build:** The season's hero illustration — Ula'tek, code-drawn as stylised SVG pixel art — plus the generic slot it renders in. The slot's contract: a theme that provides key art shows it; a theme that doesn't (void, and any minimal future theme) renders **nothing** — no placeholder, no reserved space.

Exact placement (layered into the existing hero vs. its own block) is a design decision made in this ticket's session with `/frontend-design:frontend-design` loaded — the spec deliberately left it open.

**Blocked by:** 03 — The venom theme: palette and typography

**Status:** ready-for-agent

- [ ] A generic, manifest-driven key-art slot: presence is declared per theme in the manifest, absence renders nothing — verified by `void` showing zero difference
- [ ] Venom's key art is authored in-repo as SVG pixel art in the site's 8-bit language; honest about its ceiling — the slug-keyed convention lets a better piece replace it later without seam changes
- [ ] Responsive at every breakpoint with no layout shift; decorative-image accessibility handled (empty alt / `aria-hidden` as appropriate)
- [ ] Light mode renders no venom key art — season-neutral light preserved
- [ ] Verified: `void` untouched in both modes; venom verified in dark at mobile and desktop widths — screenshots
