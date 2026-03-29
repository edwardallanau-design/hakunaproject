"use client"

import React, { useState } from "react"

const MythicPlusPasteButton: React.FC = () => {
  const [pasteText, setPasteText] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSync = async () => {
    if (!pasteText.trim()) return
    setStatus("loading")
    setMessage("")

    try {
      const res = await fetch("/api/fetch-runners", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pasteText }),
      })
      const data = await res.json()

      if (res.ok) {
        const notFoundNote = data.notFound > 0
          ? ` (${data.notFound} names not in roster — run Raid Sync first)`
          : ""
        setStatus("success")
        setMessage(`Saved ${data.count} runners${notFoundNote}`)
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setStatus("error")
        setMessage(data.error ?? "Failed")
      }
    } catch (err) {
      setStatus("error")
      setMessage(err instanceof Error ? err.message : "Network error")
    }
  }

  return (
    <div style={{ padding: "12px 0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
      <p style={{ margin: 0, fontSize: 13, color: "var(--theme-elevation-500, #888)" }}>
        Paste the roster text from the Raider.IO guild page (roster → M+ mode). Run the Raid Sync first to populate the member list.
      </p>
      <textarea
        value={pasteText}
        onChange={(e) => setPasteText(e.target.value)}
        rows={12}
        placeholder={"Dawnxp\n268\n3216.1\n6 / 9 H\n2\nDhuntis\n271\n3121.9\n6 / 9 H\n9\n..."}
        style={{
          width: "100%",
          fontFamily: "monospace",
          fontSize: 12,
          padding: 8,
          background: "var(--theme-elevation-50, #1c1c1c)",
          border: "1px solid var(--theme-elevation-200, #404040)",
          borderRadius: 4,
          color: "inherit",
          resize: "vertical",
          boxSizing: "border-box",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          type="button"
          onClick={handleSync}
          disabled={status === "loading" || !pasteText.trim()}
          style={{
            padding: "8px 16px",
            backgroundColor: status === "loading" ? "#6b7280" : "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: (status === "loading" || !pasteText.trim()) ? "not-allowed" : "pointer",
            fontSize: 14,
            fontWeight: 500,
            opacity: !pasteText.trim() ? 0.5 : 1,
          }}
        >
          {status === "loading" ? "Fetching..." : "Parse & Sync M+ Runners"}
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

export default MythicPlusPasteButton
