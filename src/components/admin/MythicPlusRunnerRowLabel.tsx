"use client"

import React from "react"
import { useRowLabel } from "@payloadcms/ui"

const MythicPlusRunnerRowLabel: React.FC = () => {
  const { data, rowNumber } = useRowLabel<{ name?: string; score?: number }>()
  if (!data?.name) return <>{`Runner ${String(rowNumber ?? 1).padStart(2, "0")}`}</>
  return <>{data.score ? `${data.name} — ${Math.round(data.score).toLocaleString()}` : data.name}</>
}

export default MythicPlusRunnerRowLabel
