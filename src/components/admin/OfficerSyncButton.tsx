"use client"

import React, { useEffect, useRef, useState } from "react"
import { useFormFields } from "@payloadcms/ui"
import { Modal, useModal } from "@payloadcms/ui"

type CharacterMatch = {
  name: string
  realm: string
  class: string
  spec: string
  role: string
  ilvl: number
}

type RosterMember = {
  character: {
    name: string
    realm: { name: string }
    class: { name: string }
    spec: { name: string; role: string }
    itemLevelEquipped: number
  }
}

const ROLE_MAP: Record<string, "Tank" | "Healer" | "DPS"> = {
  tank: "Tank",
  healer: "Healer",
  dps: "DPS",
  melee: "DPS",
  ranged: "DPS",
}

const OfficerSyncButton: React.FC<{ path: string }> = ({ path }) => {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [msg, setMsg] = useState("")
  const [matches, setMatches] = useState<CharacterMatch[]>([])
  const [search, setSearch] = useState("")
  const hasAutoOpened = useRef(false)

  const basePath = path.substring(0, path.lastIndexOf("."))
  const modalSlug = `pick-officer-${basePath.replace(/\./g, "-")}`

  const currentName = useFormFields(
    ([fields]) => (fields[`${basePath}.name`]?.value ?? "") as string,
  )
  const currentClass = useFormFields(
    ([fields]) => (fields[`${basePath}.class`]?.value ?? "") as string,
  )
  const currentSpec = useFormFields(
    ([fields]) => (fields[`${basePath}.spec`]?.value ?? "") as string,
  )
  const currentIlvl = useFormFields(
    ([fields]) => (fields[`${basePath}.ilvl`]?.value ?? 0) as number,
  )

  // Collect all existing officer names (excluding this row) to prevent duplicates
  const existingNames = useFormFields(([fields]) => {
    const names: string[] = []
    for (const key in fields) {
      if (key === `${basePath}.name`) continue
      if (/^officers\.\d+\.name$/.test(key) && fields[key]?.value) {
        names.push((fields[key].value as string).toLowerCase())
      }
    }
    return names
  })

  const dispatch = useFormFields(([, d]) => d)
  const { openModal, closeModal } = useModal()

  const hasOfficer = !!currentName

  // Auto-open the modal when a new row is added (no name yet)
  useEffect(() => {
    if (!hasOfficer && !hasAutoOpened.current) {
      hasAutoOpened.current = true
      openModal(modalSlug)
    }
  }, [hasOfficer, modalSlug, openModal])

  const resetModal = () => {
    setSearch("")
    setMatches([])
    setStatus("idle")
    setMsg("")
  }

  const applyMatch = (match: CharacterMatch) => {
    dispatch({ type: "UPDATE", path: `${basePath}.name`, value: match.name })
    dispatch({ type: "UPDATE", path: `${basePath}.class`, value: match.class })
    dispatch({ type: "UPDATE", path: `${basePath}.spec`, value: match.spec })
    dispatch({ type: "UPDATE", path: `${basePath}.role`, value: match.role })
    dispatch({ type: "UPDATE", path: `${basePath}.ilvl`, value: match.ilvl })
    resetModal()
    closeModal(modalSlug)
  }

  const handleSearch = async () => {
    const query = search.trim().toLowerCase()
    if (!query) return
    setStatus("loading")
    setMsg("")
    setMatches([])

    try {
      const res = await fetch("/api/globals/guild-details", { credentials: "include" })
      const data = await res.json()

      if (!res.ok) {
        setStatus("error")
        setMsg(data.errors?.[0]?.message ?? "Failed to fetch guild details")
        return
      }

      const members: RosterMember[] = data.details?.members ?? []

      if (members.length === 0) {
        setStatus("error")
        setMsg("No roster data found — sync Guild Details first")
        return
      }

      const results: CharacterMatch[] = members
        .filter((m) => m.character.name.toLowerCase().includes(query))
        .map((m) => ({
          name: m.character.name,
          realm: m.character.realm.name,
          class: m.character.class.name,
          spec: m.character.spec.name,
          role: ROLE_MAP[m.character.spec.role.toLowerCase()] ?? "DPS",
          ilvl: m.character.itemLevelEquipped,
        }))

      if (results.length === 0) {
        setStatus("error")
        setMsg(`"${search.trim()}" not found in guild roster`)
        return
      }

      setMatches(results)
      setStatus("idle")
    } catch {
      setStatus("error")
      setMsg("Network error")
    }
  }

  const handleOpenModal = () => {
    resetModal()
    openModal(modalSlug)
  }

  const handleCancel = () => {
    resetModal()
    closeModal(modalSlug)
  }

  return (
    <>
      {/* Row display */}
      {hasOfficer ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 12px",
          }}
        >
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{currentName}</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--theme-elevation-500, #888)" }}>
              {currentSpec} {currentClass} · {currentIlvl} ilvl
            </p>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleOpenModal}
          style={{
            padding: "8px 14px",
            background: "var(--theme-elevation-100, #262626)",
            border: "1px dashed var(--theme-elevation-200, #404040)",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
            color: "var(--theme-elevation-500, #888)",
            width: "100%",
          }}
        >
          Select Character…
        </button>
      )}

      {/* Search modal */}
      <Modal slug={modalSlug}>
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.6)",
          }}
        >
          <div
            style={{
              background: "var(--theme-elevation-50, #1c1c1c)",
              border: "1px solid var(--theme-elevation-150, #333)",
              borderRadius: 8,
              padding: 24,
              minWidth: 380,
              maxWidth: 500,
            }}
          >
            <p style={{ margin: "0 0 16px", fontWeight: 600, fontSize: 15 }}>
              Search Guild Roster
            </p>

            {/* Search input */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSearch() } }}
                placeholder="Character name…"
                autoFocus
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  background: "var(--theme-elevation-100, #262626)",
                  border: "1px solid var(--theme-elevation-200, #404040)",
                  borderRadius: 4,
                  color: "var(--theme-text, #fff)",
                  fontSize: 13,
                }}
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={status === "loading" || !search.trim()}
                style={{
                  padding: "8px 14px",
                  backgroundColor: status === "loading" ? "#6b7280" : "#4f46e5",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: status === "loading" || !search.trim() ? "not-allowed" : "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                  opacity: !search.trim() ? 0.5 : 1,
                }}
              >
                {status === "loading" ? "Searching…" : "Search"}
              </button>
            </div>

            {/* Error message */}
            {msg && (
              <p style={{ margin: "0 0 12px", fontSize: 13, color: "#ef4444" }}>{msg}</p>
            )}

            {/* Results */}
            {matches.length > 0 && (() => {
              const available = matches.filter(
                (m) => !existingNames.includes(m.name.toLowerCase()),
              )
              if (available.length === 0) {
                return (
                  <p style={{ margin: "0 0 12px", fontSize: 13, color: "#f59e0b" }}>
                    Already added as an officer
                  </p>
                )
              }
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {available.map((match) => (
                    <button
                      key={`${match.name}-${match.realm}`}
                      type="button"
                      onClick={() => applyMatch(match)}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 2,
                        padding: "10px 14px",
                        background: "var(--theme-elevation-100, #262626)",
                        border: "1px solid var(--theme-elevation-200, #404040)",
                        borderRadius: 6,
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: 14 }}>
                        {match.name}
                        <span style={{ fontWeight: 400, color: "var(--theme-elevation-500, #888)", marginLeft: 8 }}>
                          {match.realm}
                        </span>
                      </span>
                      <span style={{ fontSize: 12, color: "var(--theme-elevation-500, #888)" }}>
                        {match.spec} {match.class} · {match.ilvl} ilvl
                      </span>
                    </button>
                  ))}
                </div>
              )
            })()}

            <button
              type="button"
              onClick={handleCancel}
              style={{
                padding: "6px 14px",
                background: "transparent",
                border: "1px solid var(--theme-elevation-200, #404040)",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 13,
                width: "100%",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default OfficerSyncButton
