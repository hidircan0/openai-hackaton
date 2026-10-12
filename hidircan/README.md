# hidircan/ · 3D sahne

**Sahibi:** Hıdırcan · **Branch:** `feat/scene` · Kurallar: [../SKILL.md](../SKILL.md)

## Sorumluluk

`@react-three/fiber` ile oda sahnesi: eşya kutuları, kritik bölgeler, "Deprem" animasyonu. Sahne **hesap yapmaz**. t0 ve t1 `omer/api` yanıtından gelir, sahne sadece t0'dan t1'e canlandırır. Fizik motoru yok.

## Planlanan yapı

```
hidircan/
└── scene/
    ├── Sahne.tsx        <Canvas>, kamera, ışık; dışarıya açılan tek bileşen
    ├── EsyaKutusu.tsx   t0'a göre kutu; riskli eşya danger (#F0676B)
    ├── Bolgeler.tsx     zeminde yarı saydam kacis / yatak / calisma alanları
    ├── deprem.ts        kısa kamera sarsıntısı, sonra riskli eşyalar sırayla t0 → t1
    ├── koordinat.ts     şema (cm, z yukarı) → three.js (m, y yukarı) dönüşümü, tek yerde
    └── Plan2D.tsx       paraşüt: SVG kuşbakışı plan + devrilme izleri
```

## Girdi

`Sahne` props'ları `cem/schema` tiplerinden: `oda`, `esyalar` (t0 + t1), `bolgeler`, riskli eşya id'leri, `deprem` tetikleyicisi. Bu bileşeni `rabii/ui` kullanır.

## Dikkat

- **Koordinat:** Şemada `x` genişlik, `y` derinlik, `z` yükseklik, birim cm. three.js'te yukarı `y`. Dönüşüm sadece `koordinat.ts`'te yapılır.
- **Devrilme:** Animasyon ön alt kenar etrafında 90° dönme gibi görünmeli ama son kare birebir `/engine`'in t1'i olmalı.
- Jüri devrilen kutunun hangi bölgeye düştüğünü net görmeli.

## Kontrol noktaları

- **12:30**: Sahne `ornek-oda.json` ile çiziliyor
- **13:30**: Sahne takılıyorsa `Plan2D.tsx` paraşütüne geç
- **14:30**: Deprem butonu çalışıyor
