"use client";

import React, { useState } from "react";

const SyncProgressionButton: React.FC = () => {
  const [status, setStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSync = async () => {
    setStatus("syncing");
    setMessage("");

    try {
      const res = await fetch("/api/sync-progression", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.message ?? `Synced: ${data.summary}`);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setStatus("error");
        setMessage(data.error ?? "Sync failed");
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
        disabled={status === "syncing"}
        type="button"
        style={{
          padding: "8px 16px",
          backgroundColor: status === "syncing" ? "#6b7280" : "#4f46e5",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          cursor: status === "syncing" ? "not-allowed" : "pointer",
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        {status === "syncing" ? "Syncing..." : "Sync from Guild Details"}
      </button>
      {message && (
        <span style={{ fontSize: 13, color: status === "error" ? "#ef4444" : "#22c55e" }}>
          {message}
        </span>
      )}
    </div>
  );
};

export default SyncProgressionButton;
