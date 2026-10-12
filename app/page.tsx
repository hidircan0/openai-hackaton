
import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "MEKÂNI YÜKLE",
    description:
      "Odanızın fotoğrafını yükleyin ve kullanım profilinizi seçin.",
  },
  {
    number: "02",
    title: "RİSKLERİ KEŞFET",
    description:
      "Eşya konumlarını, olası tehlikeleri ve güvenlik skorunu inceleyin.",
  },
  {
    number: "03",
    title: "ÖNLEM AL",
    description:
      "Riskleri değerlendirin, önlemleri onaylayın ve iyileşmeyi görün.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0B0C10] text-[#F2F0F5]">
      {/* Navigation */}
      <header className="border-b border-[#2C3444]">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-5 md:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-[#9966CC] text-xl font-black text-[#0B0C10]">
              S<span className="-ml-1">X</span>
            </div>
            <div>
              <p className="text-lg font-black tracking-tight">
                SkyEngineX
              </p>
              <p className="font-mono text-[9px] tracking-[0.24em] text-[#A7A3B3]">
                SARSINTI / SAFETY INTELLIGENCE
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-xs font-medium tracking-widest text-[#A7A3B3] md:flex">
            <a href="#nasil-calisir" className="transition hover:text-white">
              NASIL ÇALIŞIR?
            </a>
            <a href="#hakkinda" className="transition hover:text-white">
              HAKKINDA
            </a>
          </nav>

          <Link
            href="/analysis"
            className="bg-[#9966CC] px-5 py-3 text-xs font-bold tracking-wider text-[#0B0C10] transition hover:bg-[#B28DDB]"
          >
            ANALİZE BAŞLA ↗
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#2C3444]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(#2C3444 1px, transparent 1px), linear-gradient(90deg, #2C3444 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage:
              "linear-gradient(to bottom, transparent, black 40%, transparent)",
          }}
        />

        <div className="relative mx-auto grid max-w-[1200px] gap-12 px-4 py-20 md:grid-cols-[1.2fr_0.8fr] md:px-8 md:py-28">
          <div>
            <div className="mb-8 flex items-center gap-3">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#9966CC]" />
              <span className="font-mono text-xs tracking-[0.2em] text-[#B28DDB]">
                SKYENGINEX / SARSINTI SYSTEM V1.0
              </span>
            </div>

            <h1 className="text-[clamp(4.5rem,12vw,10rem)] font-black leading-[0.85] tracking-[-0.08em]">
              SAR
              <br />
              SIN<span className="text-[#9966CC]">TI.</span>
            </h1>

            <div className="mt-10 max-w-xl border-l-2 border-[#9966CC] pl-5">
              <p className="text-xl font-medium leading-snug md:text-2xl">
                Deprem gelmeden önce,
                <br />
                <span className="text-[#B28DDB]">
                  riskleri görünür kılın.
                </span>
              </p>
              <p className="mt-4 max-w-md text-sm leading-7 text-[#A7A3B3]">
                Fotoğraf tabanlı mekânsal risk analizi.
                Eşyaları inceleyin, tehlikeleri değerlendirin
                ve daha güvenli yaşam alanları oluşturun.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-5">
              <Link
                href="/analysis"
                className="group inline-flex items-center gap-10 bg-[#9966CC] px-7 py-5 font-bold text-[#0B0C10] transition hover:bg-[#B28DDB]"
              >
                FOTOĞRAF YÜKLE
                <span className="text-xl transition group-hover:translate-x-1">
                  ↗
                </span>
              </Link>
              <a
                href="#nasil-calisir"
                className="border-b border-[#636E85] pb-2 text-sm text-[#F2F0F5] transition hover:border-[#9966CC]"
              >
                Sistemi keşfet ↓
              </a>
            </div>
          </div>

          {/* Visual panel */}
          <div className="flex items-center">
            <div className="w-full border border-[#2C3444] bg-[#151818] p-5 shadow-[24px_24px_0_-12px_#1F2633] md:p-7">
              <div className="flex items-center justify-between border-b border-[#2C3444] pb-5">
                <span className="font-mono text-[10px] tracking-widest text-[#A7A3B3]">
                  SYSTEM / PREVIEW
                </span>
                <span className="font-mono text-[10px] text-[#9966CC]">
                  ● DEMO
                </span>
              </div>

              <div className="py-9">
                <p className="font-mono text-xs tracking-widest text-[#A7A3B3]">
                  ÖRNEK ODA GÜVENLİK SKORU
                </p>
                <div className="mt-4 flex items-end gap-3">
                  <span className="text-[110px] font-black leading-none tracking-[-0.1em]">
                    62
                  </span>
                  <span className="mb-3 text-2xl text-[#A7A3B3]">/100</span>
                </div>
                <div className="mt-6 flex h-2 overflow-hidden bg-[#2C3444]">
                  <div className="w-[62%] bg-[#E0A73A]" />
                </div>
                <div className="mt-4 flex justify-between font-mono text-xs">
                  <span className="text-[#E0A73A]">İYİLEŞTİRME GEREKLİ</span>
                  <span className="text-[#A7A3B3]">62%</span>
                </div>
              </div>

              <div className="grid grid-cols-3 border-t border-[#2C3444] pt-5">
                {[
                  ["62", "MEVCUT"],
                  ["87", "ÖNLEM SONRASI"],
                  ["100", "HEDEF"],
                ].map(([score, label], index) => (
                  <div
                    key={label}
                    className={
                      index > 0
                        ? "border-l border-[#2C3444] pl-4"
                        : ""
                    }
                  >
                    <p className="text-3xl font-bold text-[#F2F0F5]">
                      {score}
                    </p>
                    <p className="mt-2 font-mono text-[9px] text-[#A7A3B3]">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-[11px] text-[#6F6B7A]">
                * Temsili değerlerdir; gerçek analiz sonucu değildir.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section
        id="nasil-calisir"
        className="mx-auto max-w-[1200px] px-4 py-24 md:px-8"
      >
        <div className="mb-12 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-4 font-mono text-xs tracking-widest text-[#9966CC]">
              01 / SİSTEM AKIŞI
            </p>
            <h2 className="text-4xl font-black tracking-tight md:text-6xl">
              ÜÇ ADIMDA
              <br />
              <span className="text-[#9966CC]">DAHA GÜVENLİ.</span>
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-7 text-[#A7A3B3]">
            Karmaşık risk değerlendirmesini anlaşılır,
            izlenebilir bir sürece dönüştürüyoruz.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="group border border-[#2C3444] bg-[#151818] p-7 transition hover:border-[#9966CC]"
            >
              <div className="mb-16 flex items-start justify-between">
                <span className="font-mono text-sm text-[#9966CC]">
                  / {step.number}
                </span>
                <span className="text-2xl text-[#636E85] transition group-hover:text-[#9966CC]">
                  ↗
                </span>
              </div>
              <h3 className="text-xl font-black tracking-tight">
                {step.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-[#A7A3B3]">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="hakkinda" className="bg-[#9966CC] text-[#0B0C10]">
        <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-10 px-4 py-16 md:flex-row md:items-center md:px-8">
          <div>
            <p className="mb-3 font-mono text-xs font-bold tracking-widest">
              SKYENGINEX / SAFETY INTELLIGENCE
            </p>
            <h2 className="text-4xl font-black tracking-tight md:text-6xl">
              RİSKİ GÖR.
              <br />
              ÖNLEMİ AL.
            </h2>
          </div>
          <Link
            href="/analysis"
            className="inline-flex items-center justify-between gap-12 border border-[#0B0C10] px-7 py-5 font-bold transition hover:bg-[#0B0C10] hover:text-white"
          >
            ANALİZİ BAŞLAT <span>↗</span>
          </Link>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-4 px-4 py-8 font-mono text-[10px] tracking-wider text-[#A7A3B3] md:px-8">
        <span>© 2026 SKYENGINEX — SARSINTI</span>
        <span>BUILD. REFINE. MOVE FORWARD.</span>
      </footer>
    </main>
  );
}
