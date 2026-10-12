"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import sample from "../omer/ornek-analyze-response.json";
import type { AnalyzeResponse } from "../scene/analyzeResponse";

const AnalizSahnesi = dynamic(
  () => import("../scene/AnalizSahnesi").then((module) => module.AnalizSahnesi),
  { ssr: false, loading: () => <div className="scene-loading">Oda sahnesi hazırlanıyor…</div> },
);
const analiz = sample as unknown as AnalyzeResponse;

export default function Home() {
  const [deprem, setDeprem] = useState(false);
  const [gorunum, setGorunum] = useState<"3d" | "2d">("3d");
  const [runId, setRunId] = useState(0);

  function depremiBaslat() {
    setRunId((id) => id + 1);
    setDeprem(true);
    window.setTimeout(() => setDeprem(false), 2300);
  }

  return <main className="shell">
    <header className="topbar">
      <a className="brand" href="#"><span className="brand-mark">S</span><span>SARSINTI <small>ODA GÜVENLİĞİ</small></span></a>
      <span className="demo-tag"><i /> API ÖRNEK YANITI</span>
    </header>

    <section className="intro">
      <div><p className="eyebrow">{analiz.oda.profil.toUpperCase()} PROFİLİ · {analiz.oda.tip.replaceAll("_", " ").toUpperCase()}</p>
        <h1>Odanın risk haritası</h1>
        <p className="muted">Eşyaların mevcut konumlarını ve motorun hesapladığı deprem sonrası izleri inceleyin.</p>
      </div>
      <button className="quake-button" onClick={depremiBaslat} disabled={deprem}>
        <span className="quake-icon">⌁</span>{deprem ? "DEPREM SİMÜLE EDİLİYOR" : "DEPREMİ GÖSTER"}
      </button>
    </section>

    <section className="dashboard">
      <div className="main-column">
        <div className="scene-card">
          <div className="scene-toolbar">
            <div><span className="live-dot" /> ODA SAHNESİ <span className="divider">/</span> {analiz.oda.boyut.genislikCm} × {analiz.oda.boyut.derinlikCm} cm</div>
            <div className="view-switch" aria-label="Sahne görünümü">
              <button className={gorunum === "3d" ? "selected" : ""} onClick={() => setGorunum("3d")}>3D</button>
              <button className={gorunum === "2d" ? "selected" : ""} onClick={() => setGorunum("2d")}>PLAN</button>
            </div>
          </div>
          <div className="scene-area" key={`${gorunum}-${runId}`}>
            <AnalizSahnesi analiz={analiz} deprem={deprem} gorunum={gorunum} />
          </div>
          <div className="legend"><span><i className="legend-risk" /> Riskli eşya</span><span><i className="legend-safe" /> Diğer eşya</span><span><i className="legend-zone" /> Kritik bölge</span></div>
        </div>
        <article className="comment-card"><div className="comment-icon">AI</div><div><p className="eyebrow">ANALİZ YORUMU</p><p>{analiz.oda.yorum}</p></div></article>
      </div>

      <aside className="side-column">
        <article className="score-card">
          <div className="card-heading"><span>ODA GÜVENLİK SKORU</span><span className="score-caption">/ 100</span></div>
          <div className="score-value">{analiz.oda.odaSkoru}<span>%</span></div>
          <div className="score-track"><span style={{ width: `${analiz.oda.odaSkoru}%` }} /></div>
          <p className="muted">Skor analiz motoru tarafından hesaplandı.</p>
        </article>

        <article className="risk-card">
          <div className="card-heading"><span>ÖNCELİKLİ RİSKLER</span><span className="risk-count">{analiz.riskler.length}</span></div>
          <div className="risk-list">{analiz.riskler.map((risk) => <div className="risk-row" key={risk.id}>
            <span className="risk-marker" />
            <div className="risk-content"><strong>{analiz.esyalar.find((e) => e.id === risk.esyaId)?.tip ?? "Eşya"}</strong><p>{risk.tehlike}</p><span className="risk-severity">{risk.seviyeEtiketi}</span></div>
            <b className="risk-score">{risk.skor}</b>
          </div>)}</div>
        </article>

        <article className="penalty-card"><div className="card-heading"><span>SKOR ETKİSİ</span><span className="muted">MOTOR ÇIKTISI</span></div>
          <div className="penalty-line"><span>Kayma cezası</span><strong>−{analiz.cezalar.kayma}</strong></div>
          <div className="penalty-line"><span>Bölge çarpışmaları</span><strong>−{analiz.cezalar.carpma.reduce((sum, item) => sum + item.puan, 0)}</strong></div>
          <div className="penalty-total"><span>Toplam ceza</span><strong>−{analiz.cezalar.toplam}</strong></div>
        </article>
      </aside>
    </section>
    <footer>ÖRNEK ANALİZ VERİSİ · SKORU KOD HESAPLAR · 3D SAHNE t0 → t1 KONUMUNU GÖSTERİR</footer>
  </main>;
}
