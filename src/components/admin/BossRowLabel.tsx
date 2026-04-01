"use client"

import React from "react"
import { useRowLabel } from "@payloadcms/ui"

const BossRowLabel: React.FC = () => {
  const { data, rowNumber } = useRowLabel<{ name?: string }>()
  return <>{data?.name || `Boss ${String(rowNumber ?? 1).padStart(2, "0")}`}</>
}

export default BossRowLabel
