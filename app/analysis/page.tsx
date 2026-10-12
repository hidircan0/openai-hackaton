"use client";

import Link from "next/link";

import { useEffect, useRef, useState } from "react";

type Stage = "upload" | "loading" | "results";

type Risk = {

  id: string;

  tehlike: string;

  gerekce: string;

  onlem: string;

  olasilik: number;

  siddet: number;

  skor: number;

  seviye: string;

  onay: "bekliyor" | "onaylandi" | "duzenlendi";

};

type UncertaintyAnswer = "evet" | "hayir" | "bilmiyorum";

type UncertaintyQuestion = {

  id: string;

  soru: string;

  riskId?: string;

};

const demoQuestions: UncertaintyQuestion[] = [

  { id: "Q01", riskId: "R01", soru: "Yüksek dolap duvara sabitli mi?" },

];

const demoRisks: Risk[] = [

  { id: "R01", tehlike: "Sabitlenmemiş yüksek dolap", gerekce: "Sarsıntı sırasında devrilme riski bulunabilir.", onlem: "Dolabı uygun bağlantı elemanlarıyla duvara sabitleyin.", olasilik: 4, siddet: 5, skor: 20, seviye: "TOLERE EDİLEMEZ", onay: "bekliyor" },

  { id: "R02", tehlike: "Yüksekte bulunan ağır eşya", gerekce: "Düşen nesneler yaralanmaya neden olabilir.", onlem: "Ağır eşyaları alt raflara taşıyın.", olasilik: 3, siddet: 4, skor: 12, seviye: "ORTA", onay: "bekliyor" },

  { id: "R03", tehlike: "Açıkta kalan kablo", gerekce: "Tahliye sırasında takılma tehlikesi oluşturabilir.", onlem: "Kabloları koruyucu kanal içinde düzenleyin.", olasilik: 2, siddet: 3, skor: 6, seviye: "DÜŞÜK", onay: "bekliyor" },

];

function homeRiskLevel(score: number) {

  if (score >= 15) {

    return {

      label: "YÜKSEK",

      color: "border-[#F0676B]/40 bg-[#F0676B]/10 text-[#F0676B]",

      priority: "Öncelikli olarak ilgilenin",

    };

  }

  if (score >= 8) {

    return {

      label: "ORTA",

      color: "border-[#E0A73A]/40 bg-[#E0A73A]/10 text-[#E0A73A]",

      priority: "Mümkün olan en kısa sürede düzeltin",

    };

  }

  return {

    label: "DÜŞÜK",

    color: "border-[#3FB27F]/40 bg-[#3FB27F]/10 text-[#3FB27F]",

    priority: "Kontrol altında tutun",

  };

}

export default function AnalysisPage() {

    const [stage, setStage] = useState<Stage>("upload");

  const [file, setFile] = useState<File | null>(null);

  const [preview, setPreview] = useState<string | null>(null);

  const [demo, setDemo] = useState(true);

  const [exporting, setExporting] = useState(false);

  const [risks, setRisks] = useState<Risk[]>([]);

  const [score, setScore] = useState<number | null>(null);

  const [improvement, setImprovement] = useState(0);

  const [commentary, setCommentary] = useState("");

  const [error, setError] = useState("");

  const [questions, setQuestions] = useState<UncertaintyQuestion[]>([]);

  const [answers, setAnswers] = useState<Record<string, UncertaintyAnswer>>({});

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {

    if (!file) { setPreview(null); return; }

    const url = URL.createObjectURL(file);

    setPreview(url);

    return () => URL.revokeObjectURL(url);

  }, [file]);

  function reset() {

    setStage("upload"); setRisks([]); setScore(null); setImprovement(0);

    setCommentary(""); setQuestions([]); setAnswers({}); setError("");

  }

  async function analyze() {

    if (!file) { setError("Lütfen önce bir fotoğraf seçin."); return; }

    setError(""); setStage("loading"); setImprovement(0); setQuestions([]); setAnswers({});

    if (demo) {

      await new Promise((resolve) => setTimeout(resolve, 1200));

      setRisks(demoRisks.map((risk) => ({ ...risk })));

      setScore(62);

      setQuestions(demoQuestions);

      setCommentary("Bu örnek senaryoda devrilebilecek yüksek mobilyalar ve düşebilecek ağır eşyalar öncelikli risklerdir. Duvara sabitleme ve eşya yerleşimini değiştirme önerilir.");

      setStage("results");

      return;

    }

    try {

      const data = new FormData();

      data.append("photo", file); data.append("profile", "ev");

      const response = await fetch("/api/analyze", { method: "POST", body: data });

      if (!response.ok) {
        const errorBody: unknown = await response.json().catch(() => null);
        const apiMessage = errorBody && typeof errorBody === "object" && "error" in errorBody && typeof errorBody.error === "string"
          ? errorBody.error
          : `Analiz servisi yanıt vermedi (${response.status}).`;
        throw new Error(apiMessage);
      }

      const result: unknown = await response.json();

      if (!result || typeof result !== "object" || !("safetyScore" in result) || !("risks" in result)) {
        throw new Error("API yanıt biçimi beklenen yapıyla eşleşmiyor.");
      }

      const payload = result as {
        safetyScore: unknown;
        risks: unknown;
        commentary?: unknown;
        sorular?: unknown;
        belirsizSorular?: unknown;
      };

      if (
        typeof payload.safetyScore !== "number" ||
        !Number.isFinite(payload.safetyScore) ||
        payload.safetyScore < 0 ||
        payload.safetyScore > 100 ||
        !Array.isArray(payload.risks)
      ) {
        throw new Error("Skor veya risk listesi geçersiz.");
      }

      const validRisks = payload.risks.every((risk: unknown) => {
        if (!risk || typeof risk !== "object") return false;
        const r = risk as Record<string, unknown>;
        return typeof r.id === "string" &&
          typeof r.hazard === "string" &&
          typeof r.reason === "string" &&
          typeof r.recommendedAction === "string" &&
          typeof r.likelihood === "number" &&
          typeof r.severity === "number" &&
          typeof r.riskScore === "number" &&
          typeof r.levelLabel === "string";
      });

      if (!validRisks) throw new Error("API risk alanları beklenen biçimde değil.");

      const backendRisks = payload.risks as Array<{
        id: string;
        hazard: string;
        reason: string;
        recommendedAction: string;
        likelihood: number;
        severity: number;
        riskScore: number;
        levelLabel: string;
      }>;

      setRisks(backendRisks.map((risk): Risk => ({
        id: risk.id,
        tehlike: risk.hazard,
        gerekce: risk.reason,
        onlem: risk.recommendedAction,
        olasilik: risk.likelihood,
        siddet: risk.severity,
        skor: risk.riskScore,
        seviye: risk.levelLabel,
        onay: "bekliyor",
      })));
      setScore(payload.safetyScore);
      const backendCommentary = payload.commentary;
      setCommentary(
        backendCommentary && typeof backendCommentary === "object" &&
        "roomComment" in backendCommentary &&
        typeof backendCommentary.roomComment === "string"
          ? backendCommentary.roomComment
          : ""
      );

      // Optional API contract: sorular (or belirsizSorular) is an array of

      // { id: string, soru: string, riskId?: string }.

      // No example questions are shown for a real API response.

      const rawQuestions = payload.sorular ?? payload.belirsizSorular;

      if (Array.isArray(rawQuestions)) {

        const parsed = rawQuestions.filter((item: unknown): item is UncertaintyQuestion => {

          if (!item || typeof item !== "object") return false;

          const q = item as Record<string, unknown>;

          return typeof q.id === "string" && typeof q.soru === "string" &&

            (q.riskId === undefined || typeof q.riskId === "string");

        });

        setQuestions(parsed);

      }

      setStage("results");

    } catch (err) {

      setError(err instanceof Error ? err.message : "Analiz başarısız.");

      setStage("upload");

    }

  }

  function approve(id: string) {

    setRisks((previous) => previous.map((risk) => risk.id === id ? { ...risk, onay: "onaylandi" } : risk));

  }

  async function exportExcel() {

    const selected = risks.filter((risk) => risk.onay !== "bekliyor");

    if (selected.length === 0 || exporting) return;

    setExporting(true);

    setError("");

    try {

      const response = await fetch("/api/export-excel", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ risks: selected, profile: "ev", demo }),

      });

      if (!response.ok) {

        const message = await response.text();

        throw new Error(message || `Rapor servisi hata verdi (${response.status}).`);

      }

      const blob = await response.blob();

      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");

      anchor.href = url;

      anchor.download = `SkyEngineX_Risk_Raporu\_${new Date().toISOString().slice(0, 10)}.xlsx`;

      document.body.appendChild(anchor);

      anchor.click();

      anchor.remove();

      window.setTimeout(() => URL.revokeObjectURL(url), 1000);

    } catch (cause) {

      setError(cause instanceof Error ? `Excel raporu oluşturulamadı: ${cause.message}` : "Excel raporu oluşturulamadı.");

    } finally {

      setExporting(false);

    }

  }

  const approved = risks.filter((risk) => risk.onay !== "bekliyor").length;

  const criticalRisks = risks.filter((risk) => risk.skor >= 15).length;

  const displayedScore = demo && score !== null ? [62, 87, 100][improvement] : score;

  const scoreColor = displayedScore === null ? "#A7A3B3" : displayedScore >= 80 ? "#3FB27F" : displayedScore >= 50 ? "#E0A73A" : "#F0676B";

  const scoreStatus = displayedScore === null ? "HESAPLANMADI" : displayedScore >= 80 ? "YÜKSEK GÜVENLİK SKORU" : displayedScore >= 50 ? "İYİLEŞTİRME GEREKLİ" : "ÖNCELİKLİ İYİLEŞTİRME";

  return (

    <main className="min-h-screen bg-[#0B0C10] text-[#F2F0F5]">

      <header className="border-b border-[#2C3444]">

        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-5 md:px-8">

          <Link href="/" className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center bg-[#9966CC] font-black text-[#0B0C10]">SX</div>

            <div><p className="font-black">SkyEngineX</p><p className="font-mono text-[9px] tracking-[0.2em] text-[#A7A3B3]">SARSINTI / ANALYSIS</p></div>

          </Link>

          <Link href="/" className="text-xs text-[#B28DDB] hover:text-white">← ANA SAYFA</Link>

        </div>

      </header>

      <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-8 md:py-14">

        <div className="mb-9 flex flex-wrap items-end justify-between gap-5">

          <div><p className="mb-4 font-mono text-xs tracking-[0.2em] text-[#9966CC]">01 / MEKÂNSAL RİSK ANALİZİ</p><h1 className="text-4xl font-black tracking-tight md:text-6xl">RİSKLERİ<br/><span className="text-[#9966CC]">GÖRÜNÜR KIL.</span></h1></div>

          <p className="max-w-xs text-sm leading-7 text-[#A7A3B3]">Fotoğraf yükleyin. Riskleri inceleyin. Önlemleri değerlendirin.</p>

        </div>

        <div className="mb-8 grid grid-cols-3 border border-[#2C3444]">

          {["01 / YÜKLE", "02 / ANALİZ", "03 / ONAYLA"].map((label, index) => {

            const active = stage === "upload" ? 0 : stage === "loading" ? 1 : 2;

            return <div key={label} className={`border-r border-[#2C3444] px-3 py-4 font-mono text-[10px] last:border-r-0 sm:px-6 ${index <= active ? "bg-[#1F2633] text-[#B28DDB]" : "text-[#6F6B7A]"}`}>{label}</div>;

          })}

        </div>

        {stage === "upload" && (

          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">

            <section className="border border-[#2C3444] bg-[#151818] p-6 md:p-8">

              <p className="font-mono text-xs tracking-widest text-[#9966CC]">INPUT / 01</p>

              <h2 className="mt-3 text-2xl font-black">FOTOĞRAF YÜKLE</h2>

              <p className="mt-3 text-sm text-[#A7A3B3]">JPG, PNG veya WEBP formatında bir mekân fotoğrafı seçin.</p>

              <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setError(""); }} />

              <button type="button" onClick={() => inputRef.current?.click()} className="mt-7 flex min-h-64 w-full flex-col items-center justify-center overflow-hidden border border-dashed border-[#636E85] bg-[#0B0C10] transition hover:border-[#9966CC]">

                {preview ? <img src={preview} alt="Yüklenen mekân fotoğrafı" className="max-h-80 w-full object-contain" /> : <><span className="text-5xl text-[#9966CC]">↥</span><span className="mt-4 text-sm font-bold">FOTOĞRAF SEÇ</span><span className="mt-2 text-xs text-[#A7A3B3]">Analiz edilecek mekânın görüntüsü</span></>}

              </button>

              {file && <p className="mt-4 break-all font-mono text-xs text-[#A7A3B3]">SEÇİLEN / {file.name}</p>}

            </section>

            <section className="border border-[#2C3444] bg-[#151818] p-6 md:p-8">

              <p className="font-mono text-xs tracking-widest text-[#9966CC]">CONFIG / 02</p>

              <h2 className="mt-3 text-2xl font-black">EV GÜVENLİK ANALİZİ</h2>

              <p className="mt-3 text-sm leading-6 text-[#A7A3B3]">Evinizdeki eşyaların deprem sırasında oluşturabileceği riskleri inceleyin ve alınabilecek önlemleri öğrenin.</p>

              <label className="mt-7 flex cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={demo} onChange={(event) => setDemo(event.target.checked)} className="accent-[#9966CC]" />Demo verileriyle çalış</label>

              <p className="mt-2 text-xs leading-5 text-[#A7A3B3]">Demo modu temsili riskler üretir. Kapatıldığında gerçek /api/analyze servisine istek gönderilir.</p>

              {error && <p role="alert" className="mt-5 text-sm text-[#F0676B]">{error}</p>}

              <button type="button" onClick={analyze} disabled={!file} className="mt-8 w-full bg-[#9966CC] px-6 py-5 text-sm font-black text-[#0B0C10] transition hover:bg-[#B28DDB] disabled:cursor-not-allowed disabled:opacity-40">ANALİZİ BAŞLAT ↗</button>

            </section>

          </div>

        )}

        {stage === "loading" && <section className="border border-[#2C3444] bg-[#151818] p-10 text-center"><div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#2C3444] border-t-[#9966CC]"/><p className="mt-8 font-mono text-xs tracking-widest text-[#9966CC]">ANALYSIS / IN PROGRESS</p><h2 className="mt-4 text-3xl font-black">MEKÂN İNCELENİYOR</h2><p className="mt-4 text-sm text-[#A7A3B3]">Fotoğraf işleniyor, risk verileri hazırlanıyor.</p></section>}

        {stage === "results" && (

          <div className="space-y-5">

            <div className="flex flex-wrap items-center justify-between gap-3">

              <div className="flex flex-wrap items-center gap-3"><span className="font-mono text-xs tracking-widest text-[#9966CC]">RESULTS / OVERVIEW</span><span className={`border px-3 py-1 font-mono text-[10px] ${demo ? "border-[#E0A73A]/40 bg-[#E0A73A]/10 text-[#E0A73A]" : "border-[#3FB27F]/40 bg-[#3FB27F]/10 text-[#3FB27F]"}`}>{demo ? "● DEMO VERİSİ" : "● API YANITI"}</span></div>

              <div className="flex flex-wrap gap-2">

                <button type="button" onClick={exportExcel} disabled={approved === 0 || exporting} className="bg-[#9966CC] px-5 py-3 text-xs font-bold text-[#0B0C10] transition hover:bg-[#B28DDB] disabled:cursor-not-allowed disabled:opacity-40">{exporting ? "RAPOR HAZIRLANIYOR..." : `RAPORU İNDİR (.XLSX)${approved ? ` · ${approved}` : ""}`}</button>

                <button type="button" onClick={reset} className="border border-[#636E85] px-5 py-3 text-xs font-bold transition hover:border-[#9966CC]">← YENİ ANALİZ</button>

              </div>

            </div>

            {error && <p role="alert" className="border border-[#F0676B]/40 bg-[#F0676B]/10 p-3 text-sm text-[#F0676B]">{error}</p>}

            {demo && <div className="border-l-2 border-[#E0A73A] bg-[#E0A73A]/5 px-5 py-4"><p className="text-xs font-bold text-[#E0A73A]">DEMO MODU — TEMSİLİ ANALİZ</p><p className="mt-2 text-xs leading-6 text-[#A7A3B3]">Gösterilen riskler ve skorlar yüklenen fotoğraftan hesaplanmamıştır. Gerçek analiz için API bağlantısı gerekir.</p></div>}

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

              {[

                { label: "TESPİT EDİLEN RİSK", value: risks.length, color: "#F2F0F5", detail: "Toplam risk kaydı" },

                { label: "KRİTİK RİSK", value: criticalRisks, color: "#F0676B", detail: "Risk skoru ≥ 15" },

                { label: "İNCELENEN", value: approved, color: "#3FB27F", detail: "İncelenen öneri" },

                { label: "BEKLEYEN", value: risks.length - approved, color: "#E0A73A", detail: "Henüz incelenmemiş" },

              ].map((metric) => <div key={metric.label} className="border border-[#2C3444] bg-[#151818] p-5"><p className="font-mono text-[10px] tracking-wider text-[#A7A3B3]">{metric.label}</p><p className="mt-4 text-4xl font-black tracking-tight" style={{ color: metric.color }}>{String(metric.value).padStart(2, "0")}</p><p className="mt-3 text-[11px] text-[#A7A3B3]">{metric.detail}</p></div>)}

            </div>

            <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">

              <section className="overflow-hidden border border-[#2C3444] bg-[#151818]">

                <div className="flex items-center justify-between border-b border-[#2C3444] px-6 py-5"><div><p className="font-mono text-[10px] tracking-widest text-[#9966CC]">SPACE / VISUAL</p><h2 className="mt-2 text-lg font-black">MEKÂN GÖRÜNÜMÜ</h2></div><span className="border border-[#2C3444] px-3 py-2 font-mono text-[10px] text-[#A7A3B3]">FOTOĞRAF</span></div>

                <div className="flex min-h-[320px] items-center justify-center bg-[#0B0C10] p-4">{preview ? <img src={preview} alt="Analiz edilen mekân fotoğrafı" className="max-h-[430px] w-full object-contain" /> : <p className="text-sm text-[#A7A3B3]">Görüntü bulunamadı.</p>}</div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#2C3444] px-6 py-4"><div><p className="font-mono text-[10px] text-[#9966CC]">ANALYSIS PROFILE</p><p className="mt-1 text-sm font-bold">EV</p></div><span className="text-xs text-[#A7A3B3]">3D simülasyon entegrasyonu bekleniyor</span></div>

              </section>

              <div className="flex flex-col gap-5">

                <section className="flex-1 border border-[#2C3444] bg-[#151818] p-6">

                  <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] tracking-widest text-[#9966CC]">SAFETY / INDEX</p><h2 className="mt-2 text-lg font-black">GÜVENLİK SKORU</h2></div><span className="border border-[#2C3444] px-3 py-1 font-mono text-[10px] text-[#A7A3B3]">0–100</span></div>

                  <div className="mt-7 flex items-baseline gap-2"><span className="text-[clamp(5rem,10vw,7rem)] font-black leading-none tracking-[-0.08em]">{displayedScore ?? "—"}</span><span className="text-xl text-[#A7A3B3]">/100</span></div>

                  <div className="mt-6 h-2 bg-[#2C3444]" role="progressbar" aria-label="Oda güvenlik skoru" aria-valuemin={0} aria-valuemax={100} aria-valuenow={displayedScore ?? undefined}><div className="h-full transition-all duration-700" style={{ width: `${displayedScore ?? 0}%`, backgroundColor: scoreColor }}/></div>

                  <div className="mt-4 flex flex-wrap justify-between gap-2"><span className="font-mono text-[10px] font-bold" style={{ color: scoreColor }}>{scoreStatus}</span><span className="font-mono text-[10px] text-[#A7A3B3]">{displayedScore ?? 0}%</span></div>

                  <p className="mt-6 border-t border-[#2C3444] pt-4 text-xs leading-6 text-[#A7A3B3]">Bu skor mekân içi eşya risklerini değerlendirir. Binanın yapısal deprem dayanımını ölçmez.</p>

                </section>

                <section className="border border-[#2C3444] bg-[#151818] p-6">

                  <p className="font-mono text-[10px] tracking-widest text-[#9966CC]">IMPROVEMENT / TRACKER</p><h2 className="mt-2 text-lg font-black">ÖNCE / SONRA</h2>

                  {demo ? <><div className="mt-6 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2">{[{ value: 62, label: "MEVCUT" }, { value: 87, label: "ÖNLEM" }, { value: 100, label: "HEDEF" }].map((item, index) => <div key={item.label} className="contents">{index > 0 && <span className="text-center text-lg text-[#9966CC]">→</span>}<div className={`border p-3 text-center ${improvement === index ? "border-[#9966CC] bg-[#9966CC]/10" : "border-[#2C3444]"}`}><p className={`text-2xl font-black ${index === 2 ? "text-[#3FB27F]" : "text-[#F2F0F5]"}`}>{item.value}</p><p className="mt-2 font-mono text-[9px] text-[#A7A3B3]">{item.label}</p></div></div>)}</div><button type="button" disabled={improvement === 2} onClick={() => setImprovement((value) => Math.min(value + 1, 2))} className="mt-5 w-full bg-[#9966CC] px-5 py-4 text-xs font-black text-[#0B0C10] transition hover:bg-[#B28DDB] disabled:cursor-not-allowed disabled:opacity-40">{improvement === 2 ? "DEMO HEDEFİ GÖSTERİLDİ ✓" : "ÖNLEMLERİ UYGULA ↗"}</button><p className="mt-3 text-[11px] text-[#A7A3B3]">Temsili skor geçişi; gerçek yeniden hesaplama değildir.</p></> : <p className="mt-5 text-sm leading-6 text-[#A7A3B3]">Önlem sonrası skor hesaplaması API entegrasyonuyla etkinleşecek.</p>}

                </section>

              </div>

            </div>

  <section className="border border-[#2C3444] bg-[#151818] p-5 md:p-8">

    <p className="font-mono text-[10px] tracking-widest text-[#9966CC]">

      HOME / SAFETY CHECKLIST

    </p>

    <h2 className="mt-3 text-2xl font-black">

      EVİNİZ İÇİN YAPILACAKLAR

    </h2>

    <p className="mt-3 text-sm leading-6 text-[#A7A3B3]">

      Evinizdeki olası eşya risklerini azaltmak için aşağıdaki

      önerileri inceleyin. İncelediğiniz önerileri işaretleyebilirsiniz.

    </p>

    <div className="mt-7 space-y-4">

      {[...risks]

        .sort((a, b) => b.skor - a.skor)

        .map((risk) => {

          const level = homeRiskLevel(risk.skor);

          const completed = risk.onay !== "bekliyor";

          return (

            <article

              key={risk.id}

              className={`border p-5 transition ${

                completed

                  ? "border-[#3FB27F]/40 bg-[#3FB27F]/5"

                  : "border-[#2C3444] bg-[#0B0C10]"

              }`}

            >

              <div className="flex flex-wrap items-start justify-between gap-3">

                <div>

                  <h3 className="text-base font-bold">

                    {risk.tehlike}

                  </h3>

                  <p className="mt-2 text-xs text-[#A7A3B3]">

                    {level.priority}

                  </p>

                </div>

                <span

                  className={`border px-3 py-1 font-mono text-[10px] font-bold ${level.color}`}

                >

                  {level.label}

                </span>

              </div>

              <p className="mt-4 text-sm leading-6 text-[#A7A3B3]">

                {risk.gerekce}

              </p>

              <div className="mt-4 border-l-2 border-[#9966CC] pl-4">

                <p className="text-xs font-bold text-[#B28DDB]">

                  NE YAPMALISINIZ?

                </p>

                <p className="mt-2 text-sm leading-6">

                  {risk.onlem}

                </p>

              </div>

              <button

                type="button"

                onClick={() => approve(risk.id)}

                disabled={completed}

                className={`mt-5 w-full border px-5 py-3 text-xs font-bold transition ${

                  completed

                    ? "cursor-default border-[#3FB27F]/40 text-[#3FB27F]"

                    : "border-[#9966CC] bg-[#9966CC] text-[#0B0C10] hover:bg-[#B28DDB]"

                }`}

              >

                {completed ? "✓ İNCELENDİ" : "İNCELEDİM ✓"}

              </button>

            </article>

          );

        })}

    </div>

    <p className="mt-6 text-xs leading-6 text-[#A7A3B3]">

      Bu liste mekân içindeki eşyalara yönelik öneriler sunar.

      Binanın yapısal deprem güvenliğini değerlendirmez.

    </p>

  </section>

                         <div className="grid gap-5 lg:grid-cols-2">

              <section className="border border-[#2C3444] bg-[#151818] p-6"><p className="font-mono text-[10px] tracking-widest text-[#9966CC]">AI / INSIGHT</p><h2 className="mt-3 text-xl font-black">ANALİZ YORUMU</h2><div className="mt-5 border-l-2 border-[#9966CC] pl-4"><p className="text-sm leading-7 text-[#A7A3B3]">{commentary || "Bu analiz için yorum bulunmuyor."}</p></div></section>

              <section className="border border-[#2C3444] bg-[#151818] p-6">

                <p className="font-mono text-[10px] tracking-widest text-[#9966CC]">VERIFICATION / QUESTIONS</p>

                <h2 className="mt-3 text-xl font-black">BELİRSİZLİK KONTROLÜ</h2>

                {questions.length === 0 ? (

                  <p className="mt-5 text-sm leading-6 text-[#A7A3B3]">

                    Bu analiz için doğrulama sorusu bulunmuyor.

                  </p>

                ) : (

                  <>

                    <p className="mt-3 text-xs text-[#A7A3B3]">

                      {Object.keys(answers).length} / {questions.length} soru yanıtlandı

                    </p>

                    <div className="mt-5 space-y-5">

                      {questions.map((question) => (

                        <div key={question.id} className="border border-[#2C3444] bg-[#0B0C10] p-4">

                          <p className="text-sm leading-6">{question.soru}</p>

                          <div className="mt-4 flex flex-wrap gap-2">

                            {(["evet", "hayir", "bilmiyorum"] as const).map((answer) => (

                              <button

                                key={answer}

                                type="button"

                                aria-pressed={answers[question.id] === answer}

                                onClick={() => setAnswers((previous) => ({ ...previous, [question.id]: answer }))}

                                className={`border px-4 py-3 text-xs font-bold transition ${

                                  answers[question.id] === answer

                                    ? "border-[#9966CC] bg-[#2A2140] text-[#F2F0F5]"

                                    : "border-[#636E85] hover:border-[#9966CC]"

                                }`}

                              >

                                {answer === "evet" ? "EVET" : answer === "hayir" ? "HAYIR" : "BİLMİYORUM"}

                              </button>

                            ))}

                          </div>

                        </div>

                      ))}

                    </div>

                    {Object.keys(answers).length > 0 && (

                      <p role="status" className="mt-4 text-xs leading-6 text-[#E0A73A]">

                        Yanıtlar bu analiz ekranında saklanıyor. API'ye gönderilmedi ve risk skoru yeniden hesaplanmadı.

                      </p>

                    )}

                  </>

                )}

              </section>

            </div>

          </div>

        )}

        <footer className="mt-16 border-t border-[#2C3444] pt-6 font-mono text-[10px] text-[#A7A3B3]">SKYENGINEX / SARSINTI — BUILD. REFINE. MOVE FORWARD.</footer>

      </div>

    </main>

  );

}
