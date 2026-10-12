# omer/ · Motor, profiller ve API

**Sahibi:** Ömer · **Branch:** `feat/engine` · Kurallar: [../SKILL.md](../SKILL.md) · Merge ve teslim Ömer'de.

## Sorumluluk

- **`engine/`**: Bölgeler, sallama (t1), kayma, çarpma, skor, O/Ş ve seviye. Hepsi saf fonksiyon: model çağrısı yok, yan etki yok, her biri testli.
- **`profiles/`**: `isg`, `ev`, `okul` ayar dosyaları. Profil davranışı sadece buradan değişir; kodda `if (profil === "ev")` yok.
- **`api/`**: `POST /api/analyze`. Akışı birleştirir: `cem/ai` → `engine` → `cem/ai`.
- **`simulation/`**: Python/FastAPI + PyBullet hizmeti; `criticalZones` geometrisiyle devrilen eşyaların risk bölgelerine çarpmasını hesaplar, fiziksel eşya çarpışma ID'lerini ayrı döndürür ve `cem/kayma_skoru` ile oda skorunu üretir. Eşya tipleri Cem'in 16 tiplik kataloğundan doğrulanır. Güncel sözleşme: [motor-plan-v3.md](./motor-plan-v3.md).

## Planlanan yapı

```
omer/
├── simulation/
│   ├── main.py          FastAPI /simulate ve /health
│   ├── models.py        İstek şeması ve aralık doğrulaması
│   ├── engine.py        PyBullet 3D simülasyon ve eşya çarpışmaları
│   └── Dockerfile       Python 3.11 servisi
├── engine/
│   ├── bolgeler.ts      esyalar + kapılar → Bolge[] (kacis 30, yatak 25, calisma 15)
│   ├── salla.ts         R1, R2, R3, R7 → her eşya için t1 (sabit eşyada t1 = t0)
│   ├── kayma.ts         d_i, K, kayma cezası (α profilden)
│   ├── carpma.ts        iz–bölge örtüşmesi; R4 kaçış genişliği < 60 cm
│   ├── skor.ts          odaSkoru = clamp(100 − kayma − Σ bölge cezası, 0, 100)
│   ├── risk.ts          risk satırları, O, Ş, O × Ş, seviye (R5, R6 dahil)
│   └── __tests__/       kabul testi odası: 62 → 87 → 100 (±1)
├── profiles/
│   ├── isg.ts           ana profil
│   ├── ev.ts            ikinci profil
│   └── okul.ts          vakit kalırsa, Codex'e eklettirilecek (ekran kaydıyla)
└── api/
    └── analyze.ts       POST /api/analyze
```

## Profil dosyasında ne var?

Devrilme eşikleri (`h ≥ 120`, `h ≥ 150`), aktif kurallar (R5, R6 sadece isg/okul; R7 sadece isg), α, seviye aralıkları, risk tablosu sütunları (`sorumlu`, `termin` sadece isg), yorum dili.

## Dışarıya verdiği

- **`POST /api/analyze`** → `oda`, `esyalar` (t0 ve t1), `bolgeler`, `riskler`, `odaSkoru`, `cezalar` (`kayma`, `carpma[]`), ardından akan `yorum`. Tipler `cem/schema`'dan.
- **"Önlemleri uygula" / "belirsiz" cevapları**: Sabitlenen eşyalarla 3–6. adımlar tekrar çalışır, GPT'ye gidilmez.
- `hidircan/scene` t1'i sadece buradan alır; sahnede hesap yapılmaz.

## Kontrol noktaları

- **10:20**: Canlı URL
- **12:30**: Fotoğraf → skor → tablo → 3D uçtan uca
- **15:00**: Özellik dondurma · **15:50**: Teslim
