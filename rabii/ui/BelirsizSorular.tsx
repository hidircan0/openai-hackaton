"use client";

import { useState } from "react";

export type BelirsizSoru = {
  esyaId: string;
  esyaAdi: string;
  soru: string;
};

type BelirsizSorularProps = {
  sorular: BelirsizSoru[];
  yukleniyor?: boolean;
  onCevapla: (esyaId: string, cevap: "evet" | "hayir") => void;
};

export default function BelirsizSorular({
  sorular,
  yukleniyor = false,
  onCevapla,
}: BelirsizSorularProps) {
  const [cevaplananlar, setCevaplananlar] = useState<string[]>([]);

  if (sorular.length === 0) return null;

  function cevapVer(esyaId: string, cevap: "evet" | "hayir") {
    onCevapla(esyaId, cevap);
    setCevaplananlar((mevcut) =>
      mevcut.includes(esyaId) ? mevcut : [...mevcut, esyaId]
    );
  }

  return (
    <section className="w-full rounded-lg border border-[#2C3444] bg-[#151518] p-5 text-[#F2F0F5]">
      <h2 className="text-lg font-semibold">Netleştirilmesi gerekenler</h2>
      <p className="mt-1 text-sm leading-6 text-[#A7A3B3]">
        Bu yanıtlar yeni analizin yapılmasına yardımcı olur.
      </p>

      <ul className="mt-4 space-y-4">
        {sorular.map((soru) => {
          const cevaplandi = cevaplananlar.includes(soru.esyaId);

          return (
            <li
              key={soru.esyaId}
              className="rounded-lg border border-[#2C3444] bg-[#0B0C10] p-4"
            >
              <p className="text-xs text-[#B28DDB]">{soru.esyaAdi}</p>
              <p className="mt-1 text-sm">{soru.soru}</p>

              {cevaplandi ? (
                <p className="mt-3 text-xs text-[#A7A3B3]">
                  Yanıt gönderildi. Yeniden analiz sonucu bekleniyor.
                </p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={yukleniyor}
                    onClick={() => cevapVer(soru.esyaId, "evet")}
                    className="rounded border border-[#3FB27F] px-4 py-2 text-sm text-[#3FB27F] disabled:opacity-50"
                  >
                    Evet
                  </button>
                  <button
                    type="button"
                    disabled={yukleniyor}
                    onClick={() => cevapVer(soru.esyaId, "hayir")}
                    className="rounded border border-[#2C3444] px-4 py-2 text-sm text-[#F2F0F5] disabled:opacity-50"
                  >
                    Hayır
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
