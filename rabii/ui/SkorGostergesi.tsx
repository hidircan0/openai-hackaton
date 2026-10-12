
"use client";

type Props = {
  skor: number | null;
  oncekiSkor?: number | null;
  yukleniyor?: boolean;
};

export default function SkorGostergesi({
  skor,
  oncekiSkor = null,
  yukleniyor = false,
}: Props) {
  const valid =
    typeof skor === "number" &&
    Number.isFinite(skor) &&
    skor >= 0 &&
    skor <= 100;

  const value = valid ? Math.round(skor) : 0;
  const color =
    value >= 80 ? "#3FB27F" : value >= 50 ? "#E0A73A" : "#F0676B";

  const previousValid =
    typeof oncekiSkor === "number" &&
    Number.isFinite(oncekiSkor) &&
    oncekiSkor >= 0 &&
    oncekiSkor <= 100;

  return (
    <section
      aria-live="polite"
      className="border border-[#2C3444] bg-[#151818] p-6 text-[#F2F0F5] md:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-widest text-[#9966CC]">
            SAFETY / SCORE
          </p>
          <h2 className="mt-3 text-xl font-black">
            ODA GÜVENLİK SKORU
          </h2>
        </div>
        <span className="border border-[#2C3444] px-3 py-2 font-mono text-xs text-[#A7A3B3]">
          /100
        </span>
      </div>

      {!valid ? (
        <p className="mt-10 text-sm text-[#A7A3B3]">
          {yukleniyor
            ? "Güvenlik skoru hesaplanıyor..."
            : "Analiz tamamlandığında güvenlik skoru burada görünecek."}
        </p>
      ) : (
        <>
          <div className="mt-8 flex items-baseline gap-3">
            <span className="text-[clamp(5rem,12vw,8rem)] font-black leading-none tracking-[-0.08em]">
              {value}
            </span>
            <span className="text-xl text-[#A7A3B3]">/100</span>
          </div>

          <div
            className="mt-7 h-3 bg-[#2C3444]"
            role="progressbar"
            aria-label="Oda güvenlik skoru"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={value}
          >
            <div
              className="h-full transition-all duration-700"
              style={{ width: `${value}%`, backgroundColor: color }}
            />
          </div>

          <div className="mt-4 flex justify-between font-mono text-xs">
            <span style={{ color }}>
              {value >= 80
                ? "YÜKSEK GÜVENLİK SKORU"
                : value >= 50
                ? "İYİLEŞTİRME GEREKLİ"
                : "ÖNCELİKLİ İYİLEŞTİRME"}
            </span>
            <span className="text-[#A7A3B3]">{value}%</span>
          </div>

          {previousValid && oncekiSkor !== skor && (
            <div className="mt-7 flex items-center gap-4 border-t border-[#2C3444] pt-6">
              <span className="text-3xl font-black text-[#A7A3B3]">
                {Math.round(oncekiSkor)}
              </span>
              <span className="text-2xl text-[#9966CC]">→</span>
              <span className="text-3xl font-black text-[#3FB27F]">
                {value}
              </span>
              <span className="font-mono text-xs text-[#A7A3B3]">
                ÖNCE / SONRA
              </span>
            </div>
          )}
        </>
      )}

      <p className="mt-7 border-t border-[#2C3444] pt-5 text-xs leading-6 text-[#A7A3B3]">
        Bu skor mekân içi eşya risklerini ifade eder; binanın
        taşıyıcı sisteminin deprem dayanımını ölçmez.
      </p>
    </section>
  );
}
