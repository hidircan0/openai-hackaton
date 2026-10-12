"use client";

import { useState } from "react";

export type RiskOnayi = "bekliyor" | "onaylandi" | "duzenlendi";
export type RiskBolgesi = "kacis" | "yatak" | "calisma" | "bos";

export type RiskSatiri = {
  id: string;
  esyaId: string;
  kural: "R1" | "R2" | "R3" | "R4" | "R5" | "R6" | "R7";
  tehlike: string;
  bolge: RiskBolgesi;
  olasilik: number;
  siddet: number;
  skor: number;
  seviye: string;
  gerekce: string;
  onlem: string;
  sorumlu?: string;
  termin?: string;
  onay: RiskOnayi;
};

type RiskTablosuProps = {
  riskler: RiskSatiri[];
  profil: "isg" | "ev" | "okul";
  onayla: (riskId: string) => void;
  duzenle: (risk: RiskSatiri) => void;
};

const seviyeRengi: Record<string, string> = {
  dusuk: "text-[#3FB27F]",
  düşük: "text-[#3FB27F]",
  orta: "text-[#E0A73A]",
  yuksek: "text-[#F0676B]",
  yüksek: "text-[#F0676B]",
  "tolere edilemez": "text-[#F0676B]",
};

export function raporaGirecekRiskler(riskler: RiskSatiri[]) {
  return riskler.filter(
    (risk) => risk.onay === "onaylandi" || risk.onay === "duzenlendi"
  );
}

export default function RiskTablosu({
  riskler,
  profil,
  onayla,
  duzenle,
}: RiskTablosuProps) {
  const [duzenlenenId, setDuzenlenenId] = useState<string | null>(null);
  const [taslak, setTaslak] = useState<RiskSatiri | null>(null);

  function duzenlemeyiBaslat(risk: RiskSatiri) {
    setDuzenlenenId(risk.id);
    setTaslak({ ...risk });
  }

  function degisiklikleriKaydet() {
    if (!taslak) return;
    duzenle({ ...taslak, onay: "duzenlendi" });
    setDuzenlenenId(null);
    setTaslak(null);
  }

  if (riskler.length === 0) {
    return (
      <section className="rounded-lg border border-[#2C3444] bg-[#151518] p-5 text-sm text-[#A7A3B3]">
        Analiz sonucu geldiğinde risk tablosu burada gösterilecek.
      </section>
    );
  }

  return (
    <section className="w-full rounded-lg border border-[#2C3444] bg-[#151518] p-5 text-[#F2F0F5]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Risk değerlendirmesi</h2>
          <p className="mt-1 text-sm text-[#A7A3B3]">
            Onaylanmayan riskler rapora dahil edilmez.
          </p>
        </div>
        <span className="text-xs text-[#A7A3B3]">
          {raporaGirecekRiskler(riskler).length} / {riskler.length} onaylı
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {riskler.map((risk) => {
          const duzenleniyor = duzenlenenId === risk.id && taslak !== null;
          const aktifRisk = duzenleniyor ? taslak : risk;

          return (
            <article
              key={risk.id}
              className="rounded-lg border border-[#2C3444] bg-[#0B0C10] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-[#B28DDB]">
                      {risk.kural}
                    </span>
                    <span className={`text-xs font-medium ${
                      seviyeRengi[risk.seviye.toLocaleLowerCase("tr-TR")] ??
                      "text-[#A7A3B3]"
                    }`}>
                      {risk.seviye}
                    </span>
                    <span className="font-mono text-xs text-[#A7A3B3]">
                      O {risk.olasilik} × Ş {risk.siddet} = {risk.skor}
                    </span>
                  </div>
                  <h3 className="mt-2 font-medium">{risk.tehlike}</h3>
                  <p className="mt-1 text-xs text-[#A7A3B3]">
                    Bölge: {risk.bolge} · Eşya: {risk.esyaId}
                  </p>
                </div>
                <span className={`rounded border px-2 py-1 text-xs ${
                  risk.onay === "bekliyor"
                    ? "border-[#E0A73A] text-[#E0A73A]"
                    : "border-[#3FB27F] text-[#3FB27F]"
                }`}>
                  {risk.onay === "bekliyor"
                    ? "Onay bekliyor"
                    : risk.onay === "duzenlendi"
                      ? "Düzenlendi"
                      : "Onaylandı"}
                </span>
              </div>

              {duzenleniyor ? (
                <div className="mt-4 space-y-3">
                  <label className="block text-sm">
                    Gerekçe
                    <textarea
                      value={aktifRisk.gerekce}
                      onChange={(event) =>
                        setTaslak({ ...aktifRisk, gerekce: event.target.value })
                      }
                      rows={3}
                      className="mt-1 w-full rounded border border-[#2C3444] bg-[#151518] p-3 text-sm"
                    />
                  </label>
                  <label className="block text-sm">
                    Önerilen önlem
                    <textarea
                      value={aktifRisk.onlem}
                      onChange={(event) =>
                        setTaslak({ ...aktifRisk, onlem: event.target.value })
                      }
                      rows={3}
                      className="mt-1 w-full rounded border border-[#2C3444] bg-[#151518] p-3 text-sm"
                    />
                  </label>
                  {profil === "isg" && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block text-sm">
                        Sorumlu
                        <input
                          value={aktifRisk.sorumlu ?? ""}
                          onChange={(event) =>
                            setTaslak({ ...aktifRisk, sorumlu: event.target.value })
                          }
                          className="mt-1 w-full rounded border border-[#2C3444] bg-[#151518] p-2"
                        />
                      </label>
                      <label className="block text-sm">
                        Termin
                        <input
                          type="date"
                          value={aktifRisk.termin ?? ""}
                          onChange={(event) =>
                            setTaslak({ ...aktifRisk, termin: event.target.value })
                          }
                          className="mt-1 w-full rounded border border-[#2C3444] bg-[#151518] p-2"
                        />
                      </label>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={degisiklikleriKaydet}
                      className="rounded border border-[#3FB27F] px-3 py-2 text-sm text-[#3FB27F]"
                    >
                      Değişiklikleri kaydet
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDuzenlenenId(null);
                        setTaslak(null);
                      }}
                      className="rounded border border-[#2C3444] px-3 py-2 text-sm"
                    >
                      Vazgeç
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-4 space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-[#A7A3B3]">Gerekçe</p>
                      <p className="mt-1 leading-6">{risk.gerekce}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#A7A3B3]">Önerilen önlem</p>
                      <p className="mt-1 leading-6">{risk.onlem}</p>
                    </div>
                    {profil === "isg" && (
                      <p className="text-xs text-[#A7A3B3]">
                        Sorumlu: {risk.sorumlu || "Belirtilmedi"} · Termin:{" "}
                        {risk.termin || "Belirtilmedi"}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => duzenlemeyiBaslat(risk)}
                      className="rounded border border-[#2C3444] px-3 py-2 text-sm hover:border-[#9966CC]"
                    >
                      Düzenle
                    </button>
                    {risk.onay === "bekliyor" && (
                      <button
                        type="button"
                        onClick={() => onayla(risk.id)}
                        className="rounded border border-[#3FB27F] px-3 py-2 text-sm text-[#3FB27F]"
                      >
                        Riski onayla
                      </button>
                    )}
                  </div>
                </>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
