"use client";
import type { Bolge, Esya, Oda } from "./types";

const bolgeRenk: Record<string, string> = { kacis: "#E0A73A", yatak: "#9966CC", calisma: "#3FB27F" };
export function Plan2D({ oda, esyalar, bolgeler, riskliEsyaIdleri = [] }: {
  oda: Oda; esyalar: Esya[]; bolgeler: Bolge[]; riskliEsyaIdleri?: string[];
}) {
  const pad = 24, width = 720, height = 480;
  const scale = Math.min((width - pad * 2) / oda.Lx, (height - pad * 2) / oda.Ly);
  const ox = (width - oda.Lx * scale) / 2, oy = (height - oda.Ly * scale) / 2;
  const rect = (t: { x1: number; y1: number; x2: number; y2: number }) => ({ x: ox + t.x1 * scale, y: oy + t.y1 * scale, width: (t.x2 - t.x1) * scale, height: (t.y2 - t.y1) * scale });
  return <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Odanın kuşbakışı güvenlik planı" style={{ width: "100%", height: "100%", minHeight: 300, background: "#0B0C10" }}>
    <rect x={ox} y={oy} width={oda.Lx * scale} height={oda.Ly * scale} fill="#151518" stroke="#2C3444" strokeWidth="3" />
    {bolgeler.map((b, i) => { const r = rect(b.taban); const type = b.tip ?? b.tur ?? "calisma"; return <rect key={b.id ?? `b-${i}`} {...r} fill={bolgeRenk[type]} fillOpacity=".22" stroke={bolgeRenk[type]} strokeOpacity=".7" strokeDasharray="5 4" />; })}
    {esyalar.map((e) => {
      const risk = riskliEsyaIdleri.includes(e.id), r0 = rect(e.taban);
      const r1 = e.t1 ? rect(e.t1.taban) : null;
      return <g key={e.id}>
        {r1 && risk && <rect {...r1} fill="#F0676B" fillOpacity=".16" stroke="#F0676B" strokeDasharray="4 3" />}
        <rect {...r0} rx="2" fill={risk ? "#F0676B" : "#596579"} fillOpacity=".82" stroke="#A7A3B3" strokeWidth="1" />
        <text x={r0.x + 4} y={r0.y + 14} fill="#F2F0F5" fontSize="11">{e.tip}</text>
      </g>;
    })}
  </svg>;
}
