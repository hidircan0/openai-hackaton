# rabii/ · Arayüz

**Sahibi:** Rabii · **Branch:** `feat/ui` · Kurallar: [../SKILL.md](../SKILL.md)

## Sorumluluk

Ekranlar, skor göstergesi, risk tablosu, onay akışı. Arayüz metinleri Türkçe, renkler SkyEngineX token'larından. Arayüz skor hesaplamaz; her sayı `omer/api`'den gelir.

## Akış

Yükle → Profil seç → Analiz (adım adım) → 3D + Skor + Tablo → Onay

## Planlanan yapı

```
rabii/
└── ui/
    ├── Yukle.tsx            fotoğraf yükleme + profil seçimi (isg / ev / okul)
    ├── AnalizAdimlari.tsx   "Eşyalar çıkarılıyor… Riskler hesaplanıyor…"
    ├── SkorGostergesi.tsx   büyük rakam, anında; "Önlemleri uygula" ile önce/sonra (örn. 62 → 87 → 100)
    ├── Yorum.tsx            akan GPT-6 Sol yorumu; skor beklemeden görünür
    ├── RiskTablosu.tsx      tehlike, O, Ş, skor, seviye, gerekçe, önlem (+ isg'de sorumlu, termin); onayla / düzenle
    ├── BelirsizSorular.tsx  "Bu dolap duvara sabitli mi?" evet / hayır; cevap motoru yeniden çalıştırır
    └── tema.ts              renk ve font token'ları
```

## Bağımlılıklar

- **`omer/api`**: `POST /api/analyze` yanıtı ve akan yorum
- **`scene/`**: `<Sahne />` bileşeni, ortadaki 3D alan
- **`cem/schema`**: tipler
- **`omer/profiles`**: hangi sütunlar görünür, dil sade mi resmî mi. Ev görünümü ayrı ekran değil, aynı tablonun azaltılmış hâli.

## Görünüm

- Zemin `#0B0C10` · katman `#151518` / `#1F2633` · çizgi `#2C3444` · metin `#F2F0F5` / `#A7A3B3` · vurgu `#9966CC` (metin `#B28DDB`) · success `#3FB27F` · warning `#E0A73A` · danger `#F0676B`
- Space Grotesk (başlık), Inter (gövde), JetBrains Mono (etiket)
- Yok: ametist üstüne beyaz yazı, gradyan, neon glow, emoji başlık. Köşe yarıçapı en fazla 8 px.
- Onaylanmayan risk satırı rapora girmez.

## Kontrol noktaları

- **12:30**: Yükle → skor → tablo → 3D uçtan uca
- **14:30**: Ev modu
