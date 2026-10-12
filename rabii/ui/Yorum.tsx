"use client";

type YorumProps = {
  metin: string;
  yukleniyor?: boolean;
  hata?: string;
};

export default function Yorum({
  metin,
  yukleniyor = false,
  hata,
}: YorumProps) {
  return (
    <section
      aria-live="polite"
      className=" w-full rounded-lg border border-[#2C3444] bg-[#151518] p-5 text-[#F2F0F5]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Analiz yorumu</h2>
        {yukleniyor && (
          <span className="text-xs text-[#B28DDB]">Yorum hazırlanıyor…</span>
        )}
      </div>

      {hata ? (
        <p role="alert" className="mt-3 text-sm text-[#E0A73A]">{hata}</p>
      ) : metin ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#A7A3B3]">
          {metin}
        </p>
      ) : (
        <p className="mt-3 text-sm leading-6 text-[#A7A3B3]">
          Analiz yorumu burada gösterilecek. Skor ve riskler yorumdan bağımsızdır.
        </p>
      )}
    </section>
  );
}
