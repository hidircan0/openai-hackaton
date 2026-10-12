# Motor planı · Fizik tabanlı sallama simülasyonu

**Sahibi:** Ömer · **Branch:** `feat/engine` · Karar: 12 Ekim 2026, ekip kural 7'yi "fizik motoru yok" yerine "fizik motoru yalnızca `/engine`'de, sunucuda" olarak değiştirdi. Kurallar: [../SKILL.md](../SKILL.md)

## 1. Amaç ve sınırlar

Algılamadan gelen t0 odası sunucuda, rijit cisim fizik motoruyla (Rapier) birkaç saniye sallanır. Her eşyanın durduğu yer t1 olur. Skor formülü, bölgeler ve risk tablosu değişmez; sadece t1'in kaynağı değişir.

Değişmeyenler:
- Skoru kod hesaplar; model puan üretmez.
- t1'i yalnızca `/engine` hesaplar. Sahne fizik çalıştırmaz, motorun kaydettiği hareketi oynatır.
- Profil davranışı ayar dosyasından gelir; kodda profil dallanması yok.
- Bina ya da yapısal analiz iddiası yok. Eşyalar kutu, kütle ve sürtünme eşya tipine göre tahmini.

Yeni zorunluluk:
- **Deterministik simülasyon.** Aynı girdi her seferinde birebir aynı t1'i ve skoru verir: sabit adım, sabit eşya sırası, rastgelelik yok, Rapier sürümü sabitlenmiş.

## 2. Teknoloji

| Konu | Seçim | Neden |
|---|---|---|
| Fizik motoru | `@dimforge/rapier3d-compat` (sürüm `package.json`'da tam sabit) | WASM gömülü gelir, Node'da ve Vercel'de ayrı dosya yüklemeden çalışır; hızlı; aynı sürüm ve aynı adım sırasıyla deterministik |
| Çalışma yeri | `POST /api/analyze` içinde, Node runtime (`export const runtime = "nodejs"`) | Edge runtime WASM ve süre sınırı açısından riskli |
| Başlatma | `await RAPIER.init()` modül düzeyinde bir kez | Soğuk başlangıçta bir kez ödenir |
| Birim | Motor içinde metre ve kg; giriş ve çıkış cm | Rapier varsayılanları metreye göre ayarlı |
| Eksen | z yukarı, yerçekimi `(0, 0, −9.81)` | Şemadaki eksenlerle aynı; dönüşüm sadece cm ↔ m |

Yedek: Rapier Vercel'de yüklenmezse `cannon-es` (saf JS) aynı arayüzün arkasına takılabilir. Önce Rapier denenir.

## 3. Klasör yapısı

```
omer/
├── engine/
│   ├── sim/
│   │   ├── tipler.ts        SimGirdi, SimSonuc, Simulator arayüzü
│   │   ├── index.ts         simule(oda, esyalar, profil): fizik çalışır; hata ya da süre aşımında kural simülatörüne düşer ve uyarı ekler
│   │   ├── fizik/
│   │   │   ├── dunya.ts     Rapier init, dünya, oda gövdesi (zemin + 4 duvar, kinematik)
│   │   │   ├── govdeler.ts  eşya → gövde + collider; yoğunluk, sürtünme; sabit, asılı, üst yük
│   │   │   ├── zemin.ts     zemin hareketi: zarf × sinüs, ivme hesabı
│   │   │   ├── dongu.ts     sabit adımlı döngü, askı koparma, iz kaydı
│   │   │   └── sonuc.ts     son poz → AABB t1, sonuç sınıfı, sabitleme eşiği (snap)
│   │   └── kural/
│   │       └── devrilme.ts  eski R1–R3 modeli (90° kenar dönmesi): paraşüt
│   ├── bolgeler.ts          eşyalar + kapılar → kritik bölgeler
│   ├── kacis.ts             R4: kalan geçiş genişliği
│   ├── kayma.ts             d_i, w_i, K, kayma cezası
│   ├── carpma.ts            iz–bölge örtüşmesi, bölge cezaları
│   ├── skor.ts              odaSkoru
│   ├── risk.ts              risk satırları, O, Ş, seviye (R5, R6 dahil)
│   └── __tests__/
│       ├── fizik.test.ts    determinizm, davranış ve bant testleri
│       ├── kural.test.ts    paraşüt modeli: 62 → 87 → 100
│       └── golden/kabul-odasi.json
├── profiles/
│   ├── isg.ts
│   ├── ev.ts
│   └── okul.ts
└── api/
    └── analyze.ts
```

## 4. Simülasyon adımları

### 4.1 Girdi kontrolü
- Oda boyutları > 0, her eşyada `h > 0`, taban dikdörtgeni geçerli ve oda içinde. Geçmeyen eşya hata ile döner; değer uydurulmaz.
- Eşyalar `id`'ye göre sıralanır. Gövdeler bu sırayla eklenir (determinizm).
- Eşyalar duvara tam temas ediyorsa collider 0,5 cm içeri alınır; başlangıçta iç içe geçme titreşimi olmasın.

### 4.2 Oda gövdesi
- Zemin ve 4 duvar tek bir **kinematik** gövdenin collider'larıdır (`kinematicPositionBased`). Oda bütün olarak sallanır.
- Tavan yok.

### 4.3 Eşya gövdeleri

| Eşya durumu | Gövde | Sonuç |
|---|---|---|
| `sabit: evet` (yerde ya da duvarda) | Oda gövdesine eklenen collider | Odayla birlikte hareket eder; `t1 = t0` birebir |
| `sabit: hayir \| belirsiz`, yerde | Dinamik kutu | Serbestçe kayar ya da devrilir |
| `asili` ve `sabit: hayir \| belirsiz` | Dinamik kutu + oda gövdesine sabit eklem | Zemin ivmesi `askiKopmaIvmesi`'ni ilk geçtiği adımda eklem silinir, eşya düşer |
| `ustYuk` (R2) ya da raf istifi (R7) | Eşyanın üstüne ayrı bir dinamik "yük" kutusu | Yük ayrı düşebilir; çıktıda `<id>-load` olarak görünür |
| Yatak, kapı, kablo, söndürücü | Yatak dinamik kutu (ağır, hareket etmez); kablo ve söndürücü fiziğe girmez | Kablo R5, söndürücü R6 kuralıyla |

- **Kütle:** `yoğunluk(tip) × kutu hacmi`. Yoğunluk tablosu profilde (başlangıç değerleri, kg/m³ kutu hacmi başına): kitaplık 250, gardırop/dolap 150, raf 120, buzdolabı 180, TV 150, masa 60, sandalye 40, kanepe 60, yatak 100, ayna/cam 2500, istif 400, üst yük 300.
- **Sürtünme:** eşya–zemin `μ = 0.5`, eşya–eşya `μ = 0.4`; geri sekme `0`. Profilde.
- **Yük kutusu:** eşyanın tabanından her yanda 5 cm içeride, `yukYuksekligi` (20 cm) yüksekliğinde, eşyanın tepesine oturur.
- **Havada kalan eşya:** `z0 > 0`, asılı değil ve altında destek yoksa (ilk 0,5 s sarsıntısız bekleme sırasında 2 cm'den fazla düşüyorsa) eşya `uyarilar`'a eklenir: "Eşyanın altında destek algılanmadı."

### 4.4 Zemin hareketi

Oda gövdesinin konumu her adımda `setNextKinematicTranslation` ile verilir:

```
x(t) = Ax · zarf(t) · sin(2π · f · t)
y(t) = Ay · zarf(t) · sin(2π · 0.8f · t + π/3)
A = PGA / (2π f)²                  → PGA 0.35g, f = 1.5 Hz için A ≈ 3,9 cm
zarf(t): 0–1 s yükselme · 1–6 s tam · 6–8 s sönme (yumuşak, sonunda 0) · 8–10 s sarsıntısız durulma
```

- Zarf sıfıra yumuşak indiği için oda başlangıç konumuna döner. Yine de t1 oda koordinatında ölçülür (oda gövdesinin konumu çıkarılır).
- Parametreler profilde: `pga`, `frekans`, `sure`, `yukselme`, `sonme`, `durulma`, `yEkseniOrani`.

### 4.5 Döngü
- Sabit adım `dt = 1/120 s`, 10 saniye = 1200 adım. Değişken adım yok.
- Her adımda: oda konumu → askı kontrolü → `world.step()` → her 6 adımda bir (20 fps) iz kaydı.
- Süre bütçesi: simülasyon 3 saniyeyi geçerse kesilir ve kural simülatörüne düşülür.

### 4.6 Sonuç → t1
- **Son poz:** konum (cm) ve dönüş (quaternion).
- **t1 dikdörtgeni:** kutunun 8 köşesi son poza göre döndürülür, eksenlere paralel sarmalayan kutu (AABB) alınır → `taban {x1, y1, x2, y2}` ve `z0`, `z1`. Çapraz düşüşte iz biraz büyük çıkar; bu bilinçli olarak temkinli bir tercih.
- **Kayma için merkez:** gövdenin gerçek son merkezi (AABB merkezi değil).
- **Sabitleme eşiği (snap):** merkez 2 cm'den az, dönüş 5°'den az değiştiyse `t1 = t0`. Mikro titreşim skoru 99,8 yapmasın.
- **Sonuç sınıfı:**

| Sınıf | Koşul | Kural etiketi |
|---|---|---|
| `stationary` | Snap eşiğinin altında | – |
| `slid` | Devrilmedi, merkez ≥ 2 cm yer değiştirdi | – (sadece kayma cezası) |
| `tipped` | Eşyanın yukarı ekseni ile dünya z ekseni arası açı > 45° | R1 |
| `fell` | Asılı eşyanın askısı koptu ve z0 en az 10 cm düştü | R3 |
| yük düştü | Yük kutusu eşyanın tepesinden ayrıldı ve 10 cm'den fazla alçaldı | R2 (isg'de raf ise R7) |

### 4.7 Skor tarafı (formül aynı)
- `d_i`, `w_i`, K, kayma cezası: SKILL.md'deki formül. Yük kutuları algılanan eşya olmadığı için K'ya girmez.
- **Çarpma:** sadece `tipped`, `fell` ve düşen yükler. İzleri (AABB) bölgeyle örtüşüyorsa bölge cezası. Çarpan eşyanın orijinal `h`'ından. `slid` eşyalar çarpma cezası almaz.
- **R4:** devrilen, düşen ve kayan bütün eşyaların t1 izlerinden sonra kapı koridorunda kalan açık genişlik < 60 cm ise kaçış cezası.
- **R5, R6:** fizikten bağımsız, sadece risk satırı.
- **Olasılık:** sabitleme durumundan (SKILL.md tablosu). Fizik sonucu bölgeyi ve şiddeti belirler.

## 5. Çıktı (API yanıtına eklenenler)

Alan adları İngilizce, [ornek-analyze-response.json](ornek-analyze-response.json) ile uyumlu:

```json
{
  "items": [
    {
      "id": "bookcase-1",
      "outcome": "tipped",
      "after": {
        "footprint": { "x1": 0, "y1": 0, "x2": 0, "y2": 0 },
        "bottomZ": 0,
        "topZ": 0,
        "pose": { "position": { "x": 0, "y": 0, "z": 0 }, "rotation": { "x": 0, "y": 0, "z": 0, "w": 1 } }
      }
    }
  ],
  "simulation": {
    "engine": "rapier3d-compat@<sabit sürüm>",
    "mode": "physics",
    "fps": 20,
    "durationS": 10,
    "groundMotion": { "pgaG": 0.35, "frequencyHz": 1.5 },
    "room": [[0, 0, 0]],
    "tracks": { "bookcase-1": [[0, 0, 0, 0, 0, 0, 0, 1]] }
  }
}
```

- `tracks[id]`: her kare için `[t, x, y, z, qx, qy, qz, qw]`, cm. 10 s × 20 fps = 200 kare.
- `room`: odanın her karedeki yer değiştirmesi; sahne odayı da sallayabilir.
- `mode`: `physics` ya da `rules`. Paraşüte düşüldüyse `rules` ve `room.warnings`'a not.
- Son kare her zaman `after.pose` ile birebir aynı.
- **Hıdırcan:** Sahne izleri oynatır, kendi fizik hesabı yok. Paraşüt modunda iz yoksa eski t0 → t1 dönme animasyonu.

## 6. Profil dosyasına eklenenler

```ts
fizik: {
  pga: 0.35,            // g cinsinden
  frekans: 1.5,         // Hz
  sure: { yukselme: 1, tam: 5, sonme: 2, durulma: 2 },  // s
  yEkseniOrani: 0.8,
  dt: 1 / 120,
  kayitFps: 20,
  sureButcesiMs: 3000,
  askiKopmaIvmesi: 0.2, // g
  surtunme: { zemin: 0.5, esya: 0.4 },
  yogunluk: { kitaplik: 250, dolap: 150, /* ... */ },
  yukYuksekligi: 20,    // cm
  snap: { konumCm: 2, aciDerece: 5 },
  devrilmeAcisi: 45,    // derece
  dusmeEsigiCm: 10,
}
```

Profil farkı sadece değerlerde: örneğin `isg` R7 için yük kutusunu raflarda da kurar, `ev`'de R7 kapalı.

## 7. "Önlemleri uygula" ve "belirsiz" cevapları
- Sabitlenen eşyalar `sabit: evet` olur, simülasyon baştan çalışır. GPT'ye gidilmez.
- Simülasyon deterministik olduğu için önce/sonra farkı sadece sabitlemeden gelir.
- Sabitlenen eşya odaya eklendiği için diğer eşyaların hareketi de değişebilir (örneğin artık devrilen kitaplık başka eşyaya çarpmaz). Bu beklenen davranış.

## 8. Testler

Eski 62 → 87 → 100 testi artık fizik modu için birebir geçerli değil. Yerine:

1. **Determinizm:** Aynı girdiyle iki çalıştırma → birebir aynı JSON.
2. **Sabit oda:** Her şey `sabit: evet` → bütün eşyalar `stationary`, `odaSkoru = 100`.
3. **Kabul testi odası davranışı:**
   - Kitaplık `tipped`, ağırlıkla `+y` yönünde; izi yatak bölgesiyle örtüşür.
   - Ayna `fell`, yatağın üzerine iner.
   - Gardırop `stationary` (sabit), masa ve yatak `stationary` (`μ = 0.5 > PGA 0.35g` olduğu için kaymaz).
   - Kaçış koridoru açık kalır.
4. **Skor bantları (kabul odası):** başlangıç 50–70 · kitaplık sabitlenince 80–95 · ayna da sabitlenince 100. Sıra her zaman artan.
5. **Golden dosya:** Kalibrasyon bitince kabul odasının tam sonucu `golden/kabul-odasi.json`'a kilitlenir; değişiklik ancak bilinçli güncellemeyle.
6. **Paraşüt:** Kural simülatörü 62 → 87 → 100 (±1) vermeye devam eder.
7. **Süre:** Kabul odası simülasyonu Vercel'de < 1 s.

## 9. Kalibrasyon (gradient descent yok)
- Hedef: kabul odasında yukarıdaki bantlar; dağınık demo odası 30–40, düzenli oda 85–95.
- Ayar sırası: önce `pga` ve `frekans` (kitaplık devrilmeli, masa kaymamalı), sonra `askiKopmaIvmesi`, en son α.
- Her ayar değişikliğinden sonra determinizm ve bant testleri çalıştırılır. Bulunan değerler profile yazılır ve golden güncellenir.

## 10. Uygulama sırası ve kontrol noktaları

| # | İş | Süre | Kontrol noktası |
|---|---|---|---|
| 0 | `sim/` arayüzü + kural simülatörü (paraşüt) + 62/87/100 testi | 40 dk | **12:00** t1 + bölgeler Cem'e ve Hıdırcan'a bu modelle gider; kimse fiziği beklemez |
| 1 | Rapier kurulumu, oda gövdesi, eşya kutuları, sabitler; Node'da çalışıyor; determinizm testi | 40 dk | |
| 2 | Zemin hareketi, döngü, son poz → AABB t1, sonuç sınıfları, snap | 40 dk | |
| 3 | Asılı eşyalar (askı koparma), üst yük kutuları (R2, R7), iz kaydı | 30 dk | **12:30** entegrasyonda `mode` kural ya da fizik; arayüz aynı |
| 4 | Kabul odası davranış ve bant testleri, kalibrasyon, golden | 30 dk | |
| 5 | API'de Node runtime, Vercel'de süre ölçümü, `simulation.tracks` Hıdırcan'a | 20 dk | **13:30** karar noktası |
| 6 | "Önlemleri uygula" döngüsü fizik modunda | 15 dk | **14:30** |

**13:30 kararı (Cem + Ömer):** Fizik modu determinizm ve bant testlerini geçmiyorsa ya da Vercel'de 3 s'yi aşıyorsa varsayılan mod `rules` yapılır, fizik demo dışı kalır. 15:00'ten sonra fizik ayarı yapılmaz.

## 11. Riskler

| Risk | Önlem |
|---|---|
| Kütle ve sürtünme fotoğraftan bilinmiyor | Tip başına tablo, profilde; pitch'te "tahmini" deniyor |
| Sonuç ayara çok duyarlı | Golden dosya + bant testleri; parametreler sadece kalibrasyonda değişir |
| Determinizm bozulması | Sürüm sabit, sabit `dt`, `id` sırası, rastgelelik yok; test her commit'te |
| Rapier Vercel'de yüklenmez | `rapier3d-compat` (WASM gömülü); olmazsa `cannon-es`; en kötü durumda kural modu |
| Süre aşımı | 3 s bütçe, aşılırsa kural moduna düşüş ve uyarı |
| Eğik düşüşte AABB izi büyür | Bilinçli temkinli tercih; gerekirse V2'de çokgen kesişim |
| Kural 62/87/100 rakamları pitch'te kullanılırsa yanlış olur | Pitch'te demo odasının fizik modundaki gerçek rakamları söylenir |

## 12. Ekibe etkisi

- **Cem:** Skor formülü aynı. Kabul testi beklentisi bant + golden'a dönüyor. Yorum çağrısına `outcome` (devrildi, düştü, kaydı) bilgisi eklenebilir.
- **Hıdırcan:** t0 → t1 dönme animasyonu yerine `simulation.tracks` oynatılır; son kare `after.pose`. Paraşüt modunda eski animasyon.
- **Rabii:** Değişiklik yok. İsterse `simulation.mode` için küçük bir etiket ("Fizik simülasyonu" / "Kural modeli").
- **Pitch:** "Rijit cisim fizik simülasyonu: eşyalar kutu olarak modelleniyor, kütle ve sürtünme eşya tipine göre tahmini. Skoru kodumuz hesaplıyor."
