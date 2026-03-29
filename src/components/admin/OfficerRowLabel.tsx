"use client"

import React from "react"
import { useRowLabel } from "@payloadcms/ui"

const OfficerRowLabel: React.FC = () => {
  const { data, rowNumber } = useRowLabel<{ name?: string }>()
  return <>{data?.name || `Officer ${String(rowNumber ?? 1).padStart(2, "0")}`}</>
}

export default OfficerRowLabel
