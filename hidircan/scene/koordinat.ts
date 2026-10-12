import type { Oda, Taban } from "./types";

const M = 0.01;
/** Room-centered three.js coordinates: source x→x, source z→y, source y→-z. */
export function cmToWorld(x: number, y: number, z: number, oda: Oda): [number, number, number] {
  return [(x - oda.Lx / 2) * M, z * M, (oda.Ly / 2 - y) * M];
}
export function tabanOlculeri(t: Taban): [number, number] {
  return [(t.x2 - t.x1) * M, (t.y2 - t.y1) * M];
}
export function tabanMerkezi(t: Taban): [number, number] {
  return [(t.x1 + t.x2) / 2, (t.y1 + t.y2) / 2];
}
