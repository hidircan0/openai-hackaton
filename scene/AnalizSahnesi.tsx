"use client";
import { useMemo } from "react";
import { Sahne } from "./Sahne";
import { Plan2D } from "./Plan2D";
import { analizSahneModeli } from "./analizAdaptor";
import type { AnalyzeResponse } from "./analyzeResponse";

/** Direct entry point for POST /api/analyze responses. */
export function AnalizSahnesi({ analiz, deprem, gorunum = "3d", className }: {
  analiz: AnalyzeResponse;
  deprem: boolean;
  gorunum?: "3d" | "2d";
  className?: string;
}) {
  const model = useMemo(() => analizSahneModeli(analiz), [analiz]);
  if (gorunum === "2d") {
    return <div className={className}><Plan2D {...model} /></div>;
  }
  return <Sahne {...model} deprem={deprem} className={className} />;
}

