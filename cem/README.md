# cem/ · Yapay zekâ katmanı ve veri sözleşmesi

**Sahibi:** Cem · **Branch:** `feat/ai` · Kurallar: [../SKILL.md](../SKILL.md)

## Sorumluluk

- **`schema/`**: Veri sözleşmesinin tek kaynağı. Diğer üç klasör tipleri buradan alır. Ömer ile ortak; değişiklik sadece sync anlarında, doğrudan `main`'e.
- **`ai/`**: GPT-6 Sol (`gpt-6-sol`, Responses API) çağrıları. Projede modelin çağrıldığı **tek** yer: algılama ve yorum.

## Planlanan yapı

```
cem/
├── schema/
│   ├── index.ts         Oda, Esya, Bolge, Risk, AnalyzeResponse tipleri + doğrulama şemaları
│   └── ornek-oda.json   kabul testi odası (sahte veri; 09:50'de herkeste)
└── ai/
    ├── algila.ts        fotoğraf → { oda, esyalar (t0) }
    ├── yorumla.ts       skor + sayılar → { odaYorumu, riskler: [{ id, gerekce, onlem }] }, akışlı
    ├── yedekYorum.ts    yorum çağrısı hata verirse kuraldan üretilen kısa metin
    ├── dogrula.ts       model çıktısını şemaya göre doğrula; geçmezse hata
    └── prompts/         algılama ve yorum prompt'ları
```

## Dışarıya verdiği

| Fonksiyon | Girdi | Çıktı | Kim kullanır |
|---|---|---|---|
| `algila` | fotoğraf | `{ oda, esyalar }` (t1 boş) | `omer/api` |
| `yorumla` | odaSkoru, eşya başına `d`, çarpılan bölgeler, risk satırları, profil, önlem kütüphanesi, fotoğraf | `odaYorumu` + her risk için `gerekce`, `onlem` (akışlı) | `omer/api` |
| `schema/*` | – | tipler | herkes |

## Kurallar

- Yorum çıktı şemasında skor ya da puan alanı yok. Skor prompt'a sabit değer olarak verilir.
- Doğrulanamayan model çıktısı hata döner. Değer uydurulmaz, varsayılan sessizce doldurulmaz.
- Algılamada sabitleme görünmüyorsa `sabit: "belirsiz"`. `guven < 0.6` olan eşyalar arayüzde soruya dönüşür.
- Boyut referansları: iç kapı ≈ 200 cm, masa ≈ 75 cm, priz ≈ 30 cm.

## Kontrol noktaları

- **09:50**: `schema/index.ts` + `schema/ornek-oda.json` herkeste
- **12:30**: Gerçek fotoğraftan algılama → `omer/api` üzerinden uçtan uca
