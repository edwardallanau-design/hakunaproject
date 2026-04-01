"use client"

import React, { useState } from "react"

const SyncBossesButton: React.FC = () => {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSync = async () => {
    setStatus("loading")
    setMessage("")

    try {
      const res = await fetch("/api/sync-bosses", {
        method: "POST",
        credentials: "include",
      })
      const data = await res.json()

      if (res.ok) {
        setStatus("idle")
        setMessage(data.message ?? `Synced: ${data.summary}`)
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setStatus("error")
        setMessage(data.error ?? "Sync failed")
      }
    } catch (err) {
      setStatus("error")
      setMessage(err instanceof Error ? err.message : "Network error")
    }
  }

  return (
    <div style={{ padding: "12px 0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
      <p style={{ margin: 0, fontSize: 13, color: "var(--theme-elevation-500, #888)" }}>
        Pull mythic boss progression from the synced Guild Details data (kills, pulls, best %).
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          type="button"
          onClick={handleSync}
          disabled={status === "loading"}
          style={{
            padding: "8px 16px",
            backgroundColor: status === "loading" ? "#6b7280" : "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: status === "loading" ? "not-allowed" : "pointer",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {status === "loading" ? "Syncing..." : "Sync Boss Progression from Guild Details"}
        </button>
        {message && (
          <span style={{ fontSize: 13, color: status === "error" ? "#ef4444" : "#22c55e" }}>
            {message}
          </span>
        )}
      </div>
    </div>
  )
}

export default SyncBossesButton
