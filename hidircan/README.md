# Hıdırcan · 3D sahne

**Sahibi:** Hıdırcan · **Branch:** `feat/scene` · Kurallar: [../SKILL.md](../SKILL.md)

## Sorumluluk

`/scene` klasörü `@react-three/fiber` ile oda sahnesini içerir: eşya kutuları, kritik bölgeler ve deprem animasyonu. Sahne **hesap yapmaz**. t0 ve t1 API yanıtından gelir; sahne yalnızca gösterir ve canlandırır. Fizik motoru yok.

## Planlanan yapı

```
scene/
    ├── Sahne.tsx        <Canvas>, kamera, ışık; dışarıya açılan tek bileşen
    ├── EsyaKutusu.tsx   t0'a göre kutu; riskli eşya danger (#F0676B)
    ├── Bolgeler.tsx     zeminde yarı saydam kacis / yatak / calisma alanları
    ├── deprem.tsx       kısa kamera sarsıntısı, sonra riskli eşyalar sırayla t0 → t1
    ├── koordinat.ts     şema (cm, z yukarı) → three.js (m, y yukarı) dönüşümü, tek yerde
    └── Plan2D.tsx       paraşüt: SVG kuşbakışı plan + devrilme izleri
```

## Girdi

`AnalizSahnesi`, `POST /api/analyze` yanıtını doğrudan alır. `analizAdaptor.ts` API alanlarını sahne modeline dönüştürür; arayüz dönüşüm kodu yazmadan yanıtı sahneye verebilir. `gorunum="2d"` yedek SVG planını açar.

```tsx
<AnalizSahnesi analiz={analyzeResponse} deprem={depremBasladi} />
```

`Sahne` düşük seviyeli bileşendir; `oda`, `esyalar` (t0 + t1), `bolgeler`, riskli eşya id'leri ve `deprem` alır. Normal entegrasyonda bunu `AnalizSahnesi` üzerinden kullanın.

Örnek API yanıtındaki alan eşleştirmeleri:

- `oda.boyut.*Cm` → `Lx`, `Ly`, `Lz`
- `esya.t0` ve `esya.t1` → başlangıç ve bitiş kutusu
- `bolge.sinirlar` → zemindeki kritik alan
- `riskler[].esyaId` → risk rengi ve deprem animasyonu

Sahne `odaSkoru`, GPT yorumları, risk puanları veya yeni eşya konumu üretmez. fal.ai bu bileşenden bağımsız bir sonraki entegrasyon katmanıdır.

## Dikkat

- **Koordinat:** Şemada `x` genişlik, `y` derinlik, `z` yükseklik, birim cm. three.js'te yukarı `y`. Dönüşüm sadece `koordinat.ts`'te yapılır.
- **Devrilme:** Animasyon ön alt kenar etrafında 90° dönme gibi görünmeli ama son kare birebir `/engine`'in t1'i olmalı.
- Jüri devrilen kutunun hangi bölgeye düştüğünü net görmeli.

## Kontrol noktaları

- **12:30**: Sahne `ornek-oda.json` ile çiziliyor
- **13:30**: Sahne takılıyorsa `Plan2D.tsx` paraşütüne geç
- **14:30**: Deprem butonu çalışıyor
