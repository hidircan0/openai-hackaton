import type { AnalyzeResponse } from "./analyzeResponse";
import type { Bolge, Esya, Oda } from "./types";

/** Converts the API response into the scene's small, rendering-only model. */
export function analizSahneModeli(analiz: AnalyzeResponse): {
  oda: Oda; esyalar: Esya[]; bolgeler: Bolge[]; riskliEsyaIdleri: string[];
} {
  const oda: Oda = {
    Lx: analiz.oda.boyut.genislikCm,
    Ly: analiz.oda.boyut.derinlikCm,
    Lz: analiz.oda.boyut.yukseklikCm,
  };
  const esyalar: Esya[] = analiz.esyalar.map((e) => ({
    id: e.id,
    tip: e.tip,
    taban: e.t0.taban,
    z0: e.t0.zAlt,
    h: e.t0.zUst - e.t0.zAlt,
    yon: e.yon.eksen ?? "+y",
    t1: {
      taban: e.t1.taban,
      z0: e.t1.zAlt,
      h: e.t1.zUst - e.t1.zAlt,
    },
  }));
  const bolgeler: Bolge[] = analiz.bolgeler.map((b) => ({ id: b.id, tip: b.tip, taban: b.sinirlar }));
  const riskliEsyaIdleri = [...new Set(analiz.riskler.map((r) => r.esyaId))];
  return { oda, esyalar, bolgeler, riskliEsyaIdleri };
}

