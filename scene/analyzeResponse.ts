/** API contract consumed by the scene. Measurements are centimeters. */
export type AnalyzeResponse = {
  oda: {
    tip: string;
    boyut: { genislikCm: number; derinlikCm: number; yukseklikCm: number };
    kacisNoktalari?: Array<{ tip: string; duvar: string; baslangicCm: number; bitisCm: number; genislikCm: number }>;
    uyarilar: string[];
    profil: string;
    odaSkoru: number;
    yorum: string;
  };
  esyalar: Array<{
    id: string;
    tip: string;
    t0: { taban: { x1: number; y1: number; x2: number; y2: number }; zAlt: number; zUst: number };
    t1: { taban: { x1: number; y1: number; x2: number; y2: number }; zAlt: number; zUst: number };
    boyut: { genislikCm: number; derinlikCm: number; yukseklikCm: number };
    yon: { deger: string; eksen: "+x" | "-x" | "+y" | "-y" | null };
    sabit: "evet" | "hayir" | "belirsiz";
    asili: boolean;
    ustYuk: boolean;
    kirilgan: boolean;
    guven: number;
    tetiklenenKurallar: string[];
  }>;
  bolgeler: Array<{ id: string; tip: "kacis" | "yatak" | "calisma"; sinirlar: { x1: number; y1: number; x2: number; y2: number }; puan: number }>;
  riskler: Array<{ id: string; esyaId: string; bolge: string; tehlike: string; olasilik: number; siddet: number; skor: number; seviyeEtiketi: string }>;
  cezalar: { alfa: number; kaymaIndeksi: number; kayma: number; carpma: Array<{ bolge: string; esyaId: string; puan: number }>; toplam: number };
};

