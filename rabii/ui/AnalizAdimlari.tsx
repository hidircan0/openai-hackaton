"use client";

type AnalizAdimlariProps = {
  aktifAdim: number | null;
  tamamlandi?: boolean;
  hata?: string;
};

const adimlar = [
  "Fotoğraf hazırlanıyor",
  "Eşyalar çıkarılıyor",
  "Riskler hesaplanıyor",
  "Güvenlik skoru oluşturuluyor",
];

export default function AnalizAdimlari({
  aktifAdim,
  tamamlandi = false,
  hata,
}: AnalizAdimlariProps) {
  if (aktifAdim === null && !tamamlandi && !hata) return null;

  return (
    <section
      aria-live="polite"
      className="w-full rounded-lg border border-[#2C3444] bg-[#151518] p-5 text-[#F2F0F5]"
    >
      <h2 className="text-lg font-semibold">Analiz durumu</h2>

      {hata ? (
        <p role="alert" className="mt-3 text-sm text-[#F0676B]">{hata}</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-[#A7A3B3]">
            {tamamlandi ? "Analiz tamamlandı." : "Oda inceleniyor…"}
          </p>

          <ol className="mt-5 space-y-4">
            {adimlar.map((adim, index) => {
              const bitti = tamamlandi || (
                aktifAdim !== null && index < aktifAdim
              );
              const siradaki = !tamamlandi && index === aktifAdim;

              return (
                <li key={adim} className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs ${
                      bitti
                        ? "border-[#3FB27F] text-[#3FB27F]"
                        : siradaki
                          ? "border-[#9966CC] text-[#B28DDB]"
                          : "border-[#2C3444] text-[#A7A3B3]"
                    }`}
                  >
                    {bitti ? "✓" : index + 1}
                  </span>
                  <span className={`text-sm ${
                    siradaki ? "text-[#F2F0F5]" : "text-[#A7A3B3]"
                  }`}>
                    {adim}
                    {siradaki && (
                      <span className="ml-2 text-[#B28DDB]">…</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </section>
  );
}
