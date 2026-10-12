"use client";
import { cmToWorld, tabanOlculeri } from "./koordinat";
import type { Bolge, Oda } from "./types";

const renk: Record<string, string> = { kacis: "#E0A73A", yatak: "#9966CC", calisma: "#3FB27F" };
export function Bolgeler({ bolgeler, oda }: { bolgeler: Bolge[]; oda: Oda }) {
  return <group>{bolgeler.map((b, i) => {
    const kind = b.tip ?? b.tur ?? "calisma";
    const w = tabanOlculeri(b.taban);
    const [x, , z] = cmToWorld((b.taban.x1 + b.taban.x2) / 2, (b.taban.y1 + b.taban.y2) / 2, 0.4, oda);
    return <mesh key={b.id ?? `${kind}-${i}`} position={[x, 0.004, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={w} />
      <meshBasicMaterial color={renk[kind]} transparent opacity={0.24} depthWrite={false} />
    </mesh>;
  })}</group>;
}
