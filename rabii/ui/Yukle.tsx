"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

export type Profil = "isg" | "ev" | "okul";

type YukleProps = {
  onAnalyze: (file: File, profil: Profil) => void;
  isLoading?: boolean;
};

const profiller: { id: Profil; baslik: string; aciklama: string }[] = [
  {
    id: "isg",
    baslik: "İş güvenliği",
    aciklama: "Teknik riskler ve uzman onayı",
  },
  {
    id: "ev",
    baslik: "Ev",
    aciklama: "Ev ortamı için sade öneriler",
  },
  {
    id: "okul",
    baslik: "Okul",
    aciklama: "Sınıf ve ortak alan riskleri",
  },
];

export default function Yukle({
  onAnalyze,
  isLoading = false,
}: YukleProps) {
  const [dosya, setDosya] = useState<File | null>(null);
  const [profil, setProfil] = useState<Profil>("isg");
  const [hata, setHata] = useState("");
  const [onizleme, setOnizleme] = useState("");

  useEffect(() => {
    if (!dosya) {
      setOnizleme("");
      return;
    }

    const url = URL.createObjectURL(dosya);
    setOnizleme(url);

    return () => URL.revokeObjectURL(url);
  }, [dosya]);

  function dosyaSec(event: ChangeEvent<HTMLInputElement>) {
    const secilen = event.target.files?.[0];

    setHata("");
    if (!secilen) return;

    if (!secilen.type.startsWith("image/")) {
      setDosya(null);
      setHata("Lütfen bir fotoğraf dosyası seçin.");
      event.target.value = "";
      return;
    }

    if (secilen.size > 10 * 1024 * 1024) {
      setDosya(null);
      setHata("Fotoğraf boyutu en fazla 10 MB olabilir.");
      event.target.value = "";
      return;
    }

    setDosya(secilen);
  }

  function gonder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dosya || isLoading) return;

    setHata("");
    onAnalyze(dosya, profil);
  }

  return (
    <form
      onSubmit={gonder}
      className="w-full max-w-2xl space-y-6 rounded-lg border border-[#2C3444] bg-[#151518] p-5 text-[#F2F0F5] sm:p-7"
    >
      <header className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#B28DDB]">
          SARSINTI / ODA ANALİZİ
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Odanı daha güvenli hâle getir
        </h1>
        <p className="text-sm leading-6 text-[#A7A3B3]">
          Bir oda fotoğrafı yükle. Riskleri analiz edelim ve alınabilecek
          önlemleri birlikte inceleyelim.
        </p>
      </header>

      <section className="space-y-3">
        <label
          htmlFor="oda-fotografi"
          className="block text-sm font-medium"
        >
          1. Oda fotoğrafı
        </label>

        <label
          htmlFor="oda-fotografi"
          className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#2C3444] bg-[#0B0C10] p-5 text-center transition-colors hover:border-[#9966CC]"
        >
          {onizleme ? (
            <img
              src={onizleme}
              alt="Seçilen oda fotoğrafının önizlemesi"
              className="max-h-64 w-full rounded object-contain"
            />
          ) : (
            <>
              <span className="text-sm font-medium">
                Fotoğraf seçmek için tıkla
              </span>
              <span className="text-xs text-[#A7A3B3]">
                JPG, PNG veya WebP · En fazla 10 MB
              </span>
            </>
          )}
          <input
            id="oda-fotografi"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={dosyaSec}
            disabled={isLoading}
            className="sr-only"
          />
        </label>

        {dosya && (
          <p className="break-all text-xs text-[#A7A3B3]">
            Seçildi: {dosya.name}
          </p>
        )}
      </section>

      <fieldset className="space-y-3" disabled={isLoading}>
        <legend className="mb-3 text-sm font-medium">
          2. Analiz profili
        </legend>

        <div className="grid gap-3 sm:grid-cols-3">
          {profiller.map((secenek) => {
            const secili = profil === secenek.id;

            return (
              <label
                key={secenek.id}
                className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                  secili
                    ? "border-[#9966CC] bg-[#1F2633]"
                    : "border-[#2C3444] bg-[#0B0C10] hover:border-[#A7A3B3]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="profil"
                    value={secenek.id}
                    checked={secili}
                    onChange={() => setProfil(secenek.id)}
                    className="accent-[#9966CC]"
                  />
                  <span className="text-sm font-medium">
                    {secenek.baslik}
                  </span>
                </span>
                <span className="mt-2 block text-xs leading-5 text-[#A7A3B3]">
                  {secenek.aciklama}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {hata && (
        <p role="alert" className="text-sm text-[#F0676B]">
          {hata}
        </p>
      )}

      <button
        type="submit"
        disabled={!dosya || isLoading}
        className="w-full rounded-lg bg-[#9966CC] px-4 py-3 text-sm font-semibold text-[#0B0C10] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isLoading ? "Analiz başlatılıyor…" : "Odayı analiz et"}
      </button>

      <p className="text-xs leading-5 text-[#A7A3B3]">
        Analiz sonucu taslaktır. Risklerin rapora girmesi için uzman onayı
        gerekir.
      </p>
    </form>
  );
}
