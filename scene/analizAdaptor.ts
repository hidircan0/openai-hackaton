import type { AnalyzeResponse } from "./analyzeResponse";
import type { Bolge, Esya, Oda } from "./types";

/** Converts the API response into the scene's small, rendering-only model. */
export function analizSahneModeli(analiz: AnalyzeResponse): {
  oda: Oda; esyalar: Esya[]; bolgeler: Bolge[]; riskliEsyaIdleri: string[];
} {
  const oda: Oda = {
    Lx: analiz.room.dimensions.widthCm,
    Ly: analiz.room.dimensions.depthCm,
    Lz: analiz.room.dimensions.heightCm,
  };
  const esyalar: Esya[] = analiz.items.map((e) => ({
    id: e.id,
    tip: e.type,
    taban: e.before.footprint,
    z0: e.before.bottomZ,
    h: e.before.topZ - e.before.bottomZ,
    yon: e.fallDirection.axis ?? "+y",
    t1: {
      taban: e.after.footprint,
      z0: e.after.bottomZ,
      h: e.after.topZ - e.after.bottomZ,
    },
    track: e.track,
  }));
  const bolgeler: Bolge[] = analiz.criticalZones.map((zone) => ({
    id: zone.id,
    tip: zone.type === "bed" ? "yatak" : zone.type === "exit" ? "kacis" : "calisma",
    taban: zone.bounds,
  }));
  const riskliEsyaIdleri = [...new Set(analiz.risks.flatMap((risk) => risk.itemId ? [risk.itemId] : []))];
  return { oda, esyalar, bolgeler, riskliEsyaIdleri };
}

