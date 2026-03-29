"use client"

import React, { useState } from "react"
import { useFormFields } from "@payloadcms/ui"

const OfficerSyncButton: React.FC<{ path: string }> = ({ path }) => {
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle")
  const [msg, setMsg] = useState("")

  // path is e.g. "officers.0.sync" → base is "officers.0"
  const basePath = path.substring(0, path.lastIndexOf("."))

  const nameValue = useFormFields(
    ([fields]) => (fields[`${basePath}.name`]?.value ?? "") as string,
  )
  const dispatch = useFormFields(([, d]) => d)

  const handleSync = async () => {
    if (!nameValue) return
    setStatus("loading")
    setMsg("")

    try {
      const res = await fetch(
        `/api/lookup-character?name=${encodeURIComponent(nameValue)}`,
        { credentials: "include" },
      )
      const data = await res.json()

      if (!res.ok) {
        setStatus("error")
        setMsg(data.error ?? "Character not found")
        return
      }

      dispatch({ type: "UPDATE", path: `${basePath}.class`, value: data.class })
      dispatch({ type: "UPDATE", path: `${basePath}.spec`, value: data.spec })
      dispatch({ type: "UPDATE", path: `${basePath}.role`, value: data.role })
      dispatch({ type: "UPDATE", path: `${basePath}.ilvl`, value: data.ilvl })

      setStatus("success")
      setMsg(`${data.spec} ${data.class} — ${data.ilvl} ilvl`)
    } catch {
      setStatus("error")
      setMsg("Network error")
    }
  }

  return (
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
  )
}

export default OfficerSyncButton
