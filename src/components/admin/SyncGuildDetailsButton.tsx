"use client";

import React, { useState } from "react";

const SyncGuildDetailsButton: React.FC = () => {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSync = async () => {
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/sync-guild-details", { credentials: "include" });
      const data = await res.json();

      if (res.ok) {
        setStatus("idle");
        setMessage(data.message ?? "Synced guild details");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Fetch failed");
      }
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Network error");
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button
        onClick={handleSync}
        disabled={status === "loading"}
        type="button"
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
        {status === "loading" ? "Syncing..." : "Sync Guild Details from Raider.IO"}
      </button>
      {message && (
        <span style={{ fontSize: 13, color: status === "error" ? "#ef4444" : "#22c55e" }}>
          {message}
        </span>
      )}
    </div>
  );
};

export default SyncGuildDetailsButton;
