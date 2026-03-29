"use client"

import React, { useState } from "react"
import { useFormFields } from "@payloadcms/ui"
import { Modal, useModal } from "@payloadcms/ui"

type RunnerMatch = {
  name: string
  realm: string
  class: string
  spec: string
  score: number
}

const MythicPlusRunnerSyncButton: React.FC<{ path: string }> = ({ path }) => {
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle")
  const [msg, setMsg] = useState("")
  const [matches, setMatches] = useState<RunnerMatch[]>([])

  const basePath = path.substring(0, path.lastIndexOf("."))
  const modalSlug = `pick-runner-${basePath.replace(/\./g, "-")}`

  const nameValue = useFormFields(
    ([fields]) => (fields[`${basePath}.name`]?.value ?? "") as string,
  )
  const dispatch = useFormFields(([, d]) => d)
  const { openModal, closeModal } = useModal()

  const applyMatch = (match: RunnerMatch) => {
    dispatch({ type: "UPDATE", path: `${basePath}.class`, value: match.class })
    dispatch({ type: "UPDATE", path: `${basePath}.spec`, value: match.spec })
    dispatch({ type: "UPDATE", path: `${basePath}.score`, value: match.score })
    setStatus("success")
    setMsg(`${match.spec} ${match.class} — ${Math.round(match.score).toLocaleString()}`)
    closeModal(modalSlug)
  }

  const handleSync = async () => {
    if (!nameValue) return
    setStatus("loading")
    setMsg("")

    try {
      const res = await fetch(
        `/api/lookup-runner?name=${encodeURIComponent(nameValue)}`,
        { credentials: "include" },
      )
      const data = await res.json()

      if (!res.ok) {
        setStatus("error")
        setMsg(data.error ?? "Character not found")
        return
      }

      setMatches(data)
      setStatus("idle")
      openModal(modalSlug)
    } catch {
      setStatus("error")
      setMsg("Network error")
    }
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0 8px" }}>
        <button
          type="button"
          onClick={handleSync}
          disabled={status === "loading" || !nameValue}
          style={{
            padding: "6px 14px",
            backgroundColor: status === "loading" ? "#6b7280" : "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: status === "loading" || !nameValue ? "not-allowed" : "pointer",
            fontSize: 13,
            fontWeight: 500,
            opacity: !nameValue ? 0.5 : 1,
          }}
        >
          {status === "loading" ? "Looking up…" : "Sync from Raider.IO"}
        </button>
        {msg && (
          <span style={{ fontSize: 13, color: status === "error" ? "#ef4444" : "#22c55e" }}>
            {msg}
          </span>
        )}
      </div>

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
              Characters found:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {matches.map((match) => (
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
                    {match.spec} {match.class} · {Math.round(match.score).toLocaleString()} M+ score
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => closeModal(modalSlug)}
              style={{
                marginTop: 16,
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

export default MythicPlusRunnerSyncButton
