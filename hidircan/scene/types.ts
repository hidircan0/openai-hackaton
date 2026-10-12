/** Minimal scene-facing shape of the shared room contract. All measurements are cm. */
export type Vektor = { x: number; y: number };
export type Taban = { x1: number; y1: number; x2: number; y2: number };
export type Oda = { Lx: number; Ly: number; Lz: number };
export type Esya = {
  id: string;
  tip: string;
  taban: Taban;
  z0: number;
  h: number;
  yon: "+x" | "-x" | "+y" | "-y";
  t1?: { taban: Taban; z0: number; z1?: number; h?: number } | null;
};
export type Bolge = { id?: string; tip?: "kacis" | "yatak" | "calisma"; tur?: "kacis" | "yatak" | "calisma"; taban: Taban };
