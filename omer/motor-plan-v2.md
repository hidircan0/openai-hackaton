# Motor planı v2 · Fizik tabanlı sallama simülasyonu

> **Current implementation:** See [motor-plan-v3.md](./motor-plan-v3.md). It supersedes v2 where the engine/runtime, intensity and duration inputs, and collision response differ. This file is retained as design history.

**Sahibi:** Ömer · **Branch:** `feat/engine` · Kurallar: [../SKILL.md](../SKILL.md)
**Karar:** 12 Ekim 2026, ekip kural 7'yi "fizik motoru yok" yerine "fizik motoru yalnızca `/engine`'de, sunucuda" olarak değiştirdi.
**v2:** Cem ile netleşen kararlar işlendi. Değişen yerler **[v2]** ile işaretli.

---

## v2'de ne değişti? (önce bunu oku)

| # | Konu | Karar | Bölüm |
|---|---|---|---|
| 1 | Alan adları | İngilizce, `ornek-analyze-response.json` ile birebir. Yeni alanlar da İngilizce: `outcome`, `impact.hit`, `after.pose`, `loads`, `simulation.mode`, `simulation.intensity` | §5 |
| 2 | Çarptı mı çarpmadı mı | Her eşyada `impact.hit: true/false`. Sadece devrilen (`tipped`), düşen (`fell`) eşya ve düşen yük çarpabilir. Kayan (`slid`) ve kıpırdamayan (`stationary`) eşyada `hit: false` | §4.7, §5 |
| 3 | Deprem şiddeti | Frekans ve genlik kullanıcıya açık değil. Tek parametre `intensity`: `light`, `moderate`, `strong`. Varsayılan `moderate` (0,35g) | §4.4, §6 |
| 4 | Hitbox | Başlangıçta birbirine giren hitbox'lar ayrılır, oda dışına az taşan kırpılır. İkisi de uyarı yazar | §4.1 |
| 5 | İnce eşyalar | Demoda yok. Kabul odasındaki 2 cm'lik ayna için hitbox en az 5 cm | §4.3 |
| 6 | Soğuk başlangıç | Rapier başlatma süresi 3 sn bütçeye sayılmaz. `mode` her yanıtta var. "Önlemleri uygula" ilk analizle aynı mod ve şiddetle çalışır | §4.5, §7 |
| 7 | Vercel | Golden dosya Vercel'de üretilir. Toplam API süresi fonksiyonun süre sınırını aşmamalı | §8, §11 |
| 8 | Yük kutuları | `items` listesine girmez, ayrı `loads` listesinde döner | §5 |

---

## 1. Amaç ve sınırlar

Algılamadan gelen t0 odası sunucuda, rijit cisim fizik motoruyla (Rapier) birkaç saniye sallanır. Her eşyanın durduğu yer t1 olur. Skor formülü, bölgeler ve risk tablosu değişmez; sadece t1'in kaynağı değişir.

Değişmeyenler:
- Skoru kod hesaplar; model puan üretmez.
- t1'i yalnızca `/engine` hesaplar. Sahne fizik çalıştırmaz, motorun kaydettiği hareketi oynatır.
- Profil davranışı ayar dosyasından gelir; kodda profil dallanması yok.
- Bina ya da yapısal analiz iddiası yok. Eşyalar kutu, kütle ve sürtünme eşya tipine göre tahmini.

Zorunluluk:
- **Deterministik simülasyon.** Aynı girdi (aynı oda + aynı şiddet) her seferinde birebir aynı t1'i ve skoru verir: sabit adım, sabit eşya sırası, rastgelelik yok, Rapier sürümü sabitlenmiş.
- **[v2] Mod da deterministik olmalı.** Sunucunun soğuk ya da sıcak olması sonucu değiştirmemeli (§4.5).

## 2. Teknoloji

| Konu | Seçim | Neden |
|---|---|---|
| Fizik motoru | `@dimforge/rapier3d-compat` (sürüm `package.json`'da tam sabit) | WASM gömülü gelir, Node'da ve Vercel'de ayrı dosya yüklemeden çalışır; aynı sürüm ve aynı adım sırasıyla deterministik |
| Çalışma yeri | `POST /api/analyze` içinde, Node runtime (`export const runtime = "nodejs"`) | Edge runtime WASM ve süre sınırı açısından riskli |
| Başlatma | `await RAPIER.init()` modül düzeyinde bir kez | Soğuk başlangıçta bir kez ödenir |
| Birim | Motor içinde metre ve kg; giriş ve çıkış cm | Rapier varsayılanları metreye göre ayarlı |
| Eksen | z yukarı, yerçekimi `(0, 0, −9.81)` | Şemadaki eksenlerle aynı; dönüşüm sadece cm ↔ m |
| **[v2] Deploy** | Vercel | Golden dosya ve süre ölçümü burada yapılır |

Yedek: Rapier Vercel'de yüklenmezse `cannon-es` (saf JS) aynı arayüzün arkasına takılabilir. Önce Rapier denenir.

## 3. Klasör yapısı

```
omer/
├── engine/
│   ├── sim/
│   │   ├── tipler.ts        SimGirdi, SimSonuc, Simulator arayüzü
│   │   ├── index.ts         simule(oda, esyalar, profil, siddet): fizik çalışır; hata ya da süre aşımında kural simülatörüne düşer ve uyarı ekler
│   │   ├── fizik/
│   │   │   ├── hitbox.ts    [v2] başlangıç hitbox'ları: duvar payı, örtüşme ayırma, oda sınırına kırpma, min kalınlık
│   │   │   ├── dunya.ts     Rapier init, dünya, oda gövdesi (zemin + 4 duvar, kinematik)
│   │   │   ├── govdeler.ts  eşya → gövde + collider; yoğunluk, sürtünme; sabit, asılı, üst yük
│   │   │   ├── zemin.ts     zemin hareketi: şiddet → PGA, zarf × sinüs
│   │   │   ├── dongu.ts     sabit adımlı döngü, askı koparma, iz kaydı
│   │   │   └── sonuc.ts     son poz → AABB t1, sonuç sınıfı, snap, impact.hit
│   │   └── kural/
│   │       └── devrilme.ts  eski R1–R3 modeli (90° kenar dönmesi): paraşüt
│   ├── bolgeler.ts          eşyalar + kapılar → kritik bölgeler
│   ├── kacis.ts             R4: kalan geçiş genişliği
│   ├── kayma.ts             d_i, w_i, K, kayma cezası
│   ├── carpma.ts            iz–bölge örtüşmesi, bölge cezaları (sadece hit = true)
│   ├── skor.ts              odaSkoru
│   ├── risk.ts              risk satırları, O, Ş, seviye (R5, R6 dahil)
│   └── __tests__/
│       ├── fizik.test.ts    determinizm, davranış, bant, hit, mod tutarlılığı, patlama testleri
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

### 4.1 Girdi kontrolü ve hitbox hazırlığı **[v2]**
- Oda boyutları > 0, her eşyada `h > 0`, taban dikdörtgeni geçerli (`x2 > x1`, `y2 > y1`).
- Eşya `type` değeri `cem/kayma_skoru/esya_tipleri.py`'deki 16 tipten biri olmalı. Listede olmayan tip Cem'in okuyucusunda hata verir.
- Eşyalar `id`'ye göre sıralanır. Gövdeler bu sırayla eklenir (determinizm).
- **Hitbox kuralları** (`fizik/hitbox.ts`). Hitbox sadece çarpışma kutusudur; yanıttaki `before`/`after` gerçek ölçülerle kalır.
  - **Duvar payı:** Duvara tam değen hitbox 0,5 cm içeri alınır.
  - **Oda dışına taşma:** ≤ 10 cm taşan taban oda sınırına kırpılır ve `room.warnings`'a not düşülür ("bookcase-1 oda sınırına kırpıldı"). 10 cm'den fazla taşan eşya hata ile döner.
  - **Örtüşme:** GPT-6 Sol'un tahmini kutuları birbirine girebilir. Ayırmadan bırakılırsa Rapier ilk adımda kutuları birbirinden fırlatır ve eşyalar uçar. **Şart: ilk adımda hiçbir iki hitbox örtüşmemeli.** Yöntem Ömer'de. Öneri: küçük olan hitbox, örtüşme bitene kadar kendi merkezine doğru küçültülür (en fazla %20); yetmezse örtüşme ekseninde ayrılır. Her durumda `room.warnings`'a not.
  - **Minimum kalınlık:** Hitbox'ın en ince kenarı en az 5 cm (§4.3).

### 4.2 Oda gövdesi
- Zemin ve 4 duvar tek bir **kinematik** gövdenin collider'larıdır (`kinematicPositionBased`). Oda bütün olarak sallanır.
- Tavan yok.

### 4.3 Eşya gövdeleri

| Eşya durumu | Gövde | Sonuç |
|---|---|---|
| `anchored: yes` (yerde ya da duvarda) | Oda gövdesine eklenen collider | Odayla birlikte hareket eder; `after = before` birebir, `outcome: stationary` |
| `anchored: no \| uncertain`, yerde | Dinamik kutu | Serbestçe kayar ya da devrilir |
| `wallMounted` ve `anchored: no \| uncertain` | Dinamik kutu + oda gövdesine sabit eklem | Zemin ivmesi `askiKopmaIvmesi`'ni ilk geçtiği adımda eklem silinir, eşya düşer |
| `hasHeavyOrFragileLoad` (R2) ya da raf istifi (R7) | Eşyanın üstüne ayrı bir dinamik "yük" kutusu | Yük ayrı düşebilir; **[v2]** çıktıda `items`'ta değil `loads` listesinde |
| Yatak, kapı, kablo, söndürücü | Yatak dinamik kutu (ağır, hareket etmez); kablo ve söndürücü fiziğe girmez | Kablo R5, söndürücü R6 kuralıyla |

- **Kütle:** `yoğunluk(tip) × kutu hacmi`. Yoğunluk tablosu profilde (kg/m³, başlangıç): kitaplık 250, gardırop/dolap 150, raf 120, buzdolabı 180, TV 150, masa 60, sandalye 40, kanepe 60, yatak 100, ayna/cam 2500, istif 400, üst yük 300.
- **Sürtünme:** eşya–zemin `μ = 0.5`, eşya–eşya `μ = 0.4`; geri sekme `0`. Profilde.
- **Yük kutusu:** eşyanın tabanından her yanda 5 cm içeride, `yukYuksekligi` (20 cm) yüksekliğinde, eşyanın tepesine oturur.
- **Havada kalan eşya:** `bottomZ > 0`, asılı değil ve altında destek yoksa (ilk 0,5 s sarsıntısız bekleme sırasında 2 cm'den fazla düşüyorsa) `room.warnings`'a eklenir: "Eşyanın altında destek algılanmadı."
- **[v2] İnce eşyalar:** Demo odalarına ayna ya da cam gibi ince eşya konmuyor. Kabul odasındaki ayna (2 cm) için hitbox en az 5 cm kalınlıkta; böylece düşerken yatağın içinden geçmez ve titremez.

### 4.4 Zemin hareketi **[v2]**

Kullanıcıya açık tek parametre **deprem şiddeti** (`intensity`). Frekans ve genlik motorun içinde sabit, dışarıdan verilmez.

| `intensity` | PGA (başlangıç) | Kabul odasında beklenen (kaba statik eşik) |
|---|---|---|
| `light` | 0,20g | Kitaplık sınırda (öne devrilme eşiği ≈ 40/190 ≈ 0,21g) |
| `moderate` **(varsayılan)** | 0,35g | Kitaplık öne devrilir, masa kaymaz (μ 0,5 > 0,35) |
| `strong` | 0,50g | Masa kaymaya başlar, kitaplık yana da devrilebilir (yan eşik ≈ 80/190 ≈ 0,42g) |

PGA değerleri başlangıçtır; kalibrasyonda kesinleşir ve profile yazılır.

Oda gövdesinin konumu her adımda `setNextKinematicTranslation` ile verilir:

```
PGA = siddet[intensity] × g          f = 1.5 Hz (sabit)
A   = PGA / (2π f)²                  → moderate için A ≈ 3,9 cm
x(t) = A · zarf(t) · sin(2π · f · t)
y(t) = A · zarf(t) · sin(2π · 0.8f · t + π/3)     → y'de etkin PGA ≈ 0,64 × PGA
zarf(t): 0–1 s yükselme · 1–6 s tam · 6–8 s sönme (yumuşak, sonunda 0) · 8–10 s sarsıntısız durulma
```

- Zarf sıfıra yumuşak indiği için oda başlangıç konumuna döner. Yine de t1 oda koordinatında ölçülür (oda gövdesinin konumu çıkarılır).
- **API:** `POST /api/analyze` isteğinde `intensity?: "light" | "moderate" | "strong"`. Gelmezse `moderate`. Yanıtta `simulation.intensity` ve `simulation.pgaG` olarak geri döner.

### 4.5 Döngü
- Sabit adım `dt = 1/120 s`, 10 saniye = 1200 adım. Değişken adım yok.
- Her adımda: oda konumu → askı kontrolü → `world.step()` → her 6 adımda bir (20 fps) iz kaydı.
- Süre bütçesi: simülasyon 3 saniyeyi geçerse kesilir ve kural simülatörüne düşülür.
- **[v2] Soğuk başlangıç:**
  - **Sorun:** Vercel bir süre istek almazsa uyur. Uyandıktan sonraki ilk istek yavaştır. Bütçe duvar saatine bağlı olduğu için aynı oda ilk istekte kural modeliyle (örn. 62), ikinci istekte fizikle (örn. 58) hesaplanabilir. Jüri önünde aynı fotoğraf iki farklı skor alır.
  - **Rapier başlatma ve WASM yükleme bütçeye sayılmaz.** Sadece 1200 adımlık döngü ölçülür.
  - **Yanıtta her zaman `simulation.mode`** (`physics` | `rules`). Kurala düşüldüyse `room.warnings`'a not.
  - **Isıtma:** Demodan önce Hıdırcan `/api/health` üzerinden API'ye bir istek atar; Rapier'i de başlatır.

### 4.6 Sonuç → t1
- **Son poz:** konum (cm) ve dönüş (quaternion).
- **t1 dikdörtgeni:** kutunun 8 köşesi son poza göre döndürülür, eksenlere paralel sarmalayan kutu (AABB) alınır → `after.footprint`, `after.bottomZ`, `after.topZ`. Çapraz düşüşte iz biraz büyük çıkar; bilinçli temkinli tercih. **[v2]** AABB gerçek ölçülerden hesaplanır, hitbox'tan değil.
- **Kayma için merkez:** gövdenin gerçek son merkezi → `after.pose.position` (AABB merkezi değil). Cem'in okuyucusu bunu kullanır.
- **Sabitleme eşiği (snap):** merkez 2 cm'den az, dönüş 5°'den az değiştiyse `after = before`. Mikro titreşim skoru 99,8 yapmasın.
- **Sonuç sınıfı (`outcome`):**

| `outcome` | Koşul | Kural etiketi | Çarpabilir mi? |
|---|---|---|---|
| `stationary` | Snap eşiğinin altında | – | Hayır |
| `slid` | Devrilmedi, merkez ≥ 2 cm yer değiştirdi | – (sadece kayma cezası) | Hayır |
| `tipped` | Eşyanın yukarı ekseni ile dünya z ekseni arası açı > 45° | R1 | Evet |
| `fell` | Asılı eşyanın askısı koptu ve `bottomZ` en az 10 cm düştü | R3 | Evet |
| yük `fell` | Yük kutusu eşyanın tepesinden ayrıldı ve 10 cm'den fazla alçaldı | R2 (isg'de raf ise R7) | Evet |

### 4.7 Skor tarafı (formül aynı) **[v2]**
- `d_i`, `w_i`, K, kayma cezası: SKILL.md'deki formül. Yük kutuları `items`'ta olmadığı için K'ya girmez.
- **Çarptı mı? (`impact.hit`):**
  - `hit = true` yalnızca `outcome` `tipped` ya da `fell` ise **ve** `after.footprint` en az bir `bed` ya da `work_area` bölgesiyle örtüşüyorsa.
  - `stationary` ve `slid` eşyada her zaman `hit = false`, `hitZones = []`.
  - **Neden:** Masa çalışma bölgesinin içinde durur, çünkü o bölge masadan üretiliyor. Masa 3 cm kaysa izi kendi bölgesine değer. Bu kural olmasa masa her depremde −15 yer.
- **Bölge cezası:** Her bölge en fazla bir kez, `hit = true` olan eşyaların en büyük çarpanıyla: `bölge.puan × max(çarpan)`. Çarpan eşyanın orijinal `h`'ından: `h ≥ 180` → 1,0 · 120–180 → 0,7 · `< 120` → 0,4 · cam/ayna × 1,3. Düşen yükün çarpanı 0,4 (öneri).
- **R4 kaçış ayrı:** Devrilen, düşen **ve kayan** bütün eşyaların t1 izlerinden sonra kapı koridorunda kalan açık genişlik < 60 cm ise kaçış cezası (30). Bu bir "çarpma" değil, genişlik kontrolü. Bu yüzden kayan bir eşya da kaçış yolunu kapatabilir. `penalties.impacts`'te `zone: "exit"`, `rule: "R4"` ile yazılır.
- **R5, R6:** fizikten bağımsız, sadece risk satırı.
- **Olasılık:** sabitleme durumundan (SKILL.md tablosu). Fizik sonucu bölgeyi ve şiddeti belirler.

## 5. Çıktı (API yanıtı) **[v2]**

Alan adları İngilizce, `ornek-analyze-response.json` ile birebir. Mevcut alanlar aynen kalır. Fizik için eklenenler:

```json
{
  "rawSafetyScore": 61.87,
  "safetyScore": 62,
  "room": { "dimensions": { "widthCm": 400, "depthCm": 300, "heightCm": 260 }, "warnings": [] },
  "items": [
    {
      "id": "bookcase-1",
      "type": "bookcase",
      "before": { "footprint": { "x1": 50, "y1": 0, "x2": 130, "y2": 40 }, "bottomZ": 0, "topZ": 190 },
      "after": {
        "footprint": { "x1": 50, "y1": 40, "x2": 130, "y2": 230 },
        "bottomZ": 0,
        "topZ": 40,
        "pose": {
          "position": { "x": 90, "y": 135, "z": 20 },
          "rotation": { "x": -0.707, "y": 0, "z": 0, "w": 0.707 }
        }
      },
      "outcome": "tipped",
      "impact": { "hit": true, "multiplier": 1.0, "hitZones": ["bed"] },
      "displacement": { "d": 0.277, "volumeWeight": 0.2341 }
    },
    {
      "id": "desk-1",
      "type": "desk",
      "before": { "footprint": { "x1": 280, "y1": 200, "x2": 400, "y2": 260 }, "bottomZ": 0, "topZ": 75 },
      "after": {
        "footprint": { "x1": 280, "y1": 200, "x2": 400, "y2": 260 },
        "bottomZ": 0,
        "topZ": 75,
        "pose": { "position": { "x": 340, "y": 230, "z": 37.5 }, "rotation": { "x": 0, "y": 0, "z": 0, "w": 1 } }
      },
      "outcome": "stationary",
      "impact": { "hit": false, "multiplier": 0.4, "hitZones": [] },
      "displacement": { "d": 0, "volumeWeight": 0.2079 }
    }
  ],
  "loads": [
    {
      "id": "shelf-1-load",
      "itemId": "shelf-1",
      "outcome": "fell",
      "after": { "footprint": { "x1": 205, "y1": 45, "x2": 255, "y2": 75 }, "bottomZ": 0, "topZ": 20 },
      "impact": { "hit": true, "multiplier": 0.4, "hitZones": ["work_area"] }
    }
  ],
  "penalties": {
    "alpha": 2,
    "slidingIndex": 0.0657,
    "sliding": 13.13,
    "impacts": [
      { "zone": "bed", "itemId": "bookcase-1", "points": 25, "rule": "R1" }
    ],
    "total": 38.13
  },
  "simulation": {
    "engine": "rapier3d-compat@<sabit sürüm>",
    "mode": "physics",
    "intensity": "moderate",
    "pgaG": 0.35,
    "frequencyHz": 1.5,
    "fps": 20,
    "durationS": 10,
    "room": [[0, 0, 0, 0]],
    "tracks": { "bookcase-1": [[0, 90, 20, 95, 0, 0, 0, 1]] }
  }
}
```

**Alan kuralları** (Cem'in okuyucusu bunlara güveniyor):
- Her eşyada `before` ve `after` var. Hareket etmeyen eşyada `after = before`, `pose.position` = kutu merkezi, `rotation` = (0, 0, 0, 1).
- `id` her zaman metin. `type` `esya_tipleri.py`'deki 16 tipten biri.
- Her eşyada `outcome` var. Yatak, kapı, kablo ve söndürücüde `displacement: null`, `impact: null`.
- `after.pose.position` cm, oda koordinatında (oda gövdesinin ofseti çıkarılmış), gövdenin gerçek merkezi.
- `penalties.impacts`: `bed` ve `work_area` için bölge başına **en fazla bir kayıt** ve sadece `hit = true` eşya ya da yükten. `exit` kaydı R4'ten gelir. Her kayıtta `rule` alanı var.
- Yük kutuları sadece `loads` listesinde. `items`'a konmaz, K'ya girmez.
- `tracks[id]`: her kare `[t, x, y, z, qx, qy, qz, qw]`, cm. 10 s × 20 fps = 200 kare. Yükler de `tracks`'te kendi id'leriyle.
- `simulation.room`: odanın her karedeki yer değiştirmesi `[t, dx, dy, dz]`; sahne odayı da sallayabilir.
- Son kare her zaman `after.pose` ile birebir aynı.
- **Kural modunda** (`mode: "rules"`): `outcome` kuraldan gelir (R1 → `tipped`, R3 → `fell`, yoksa `stationary`), `pose.position` = AABB merkezi, `tracks` boş obje. Hıdırcan bu durumda eski t0 → t1 dönme animasyonunu oynatır.

**Cem'in okuyucusu** (`cem/kayma_skoru/data_omer_oku.py`) şunları kullanır:
- `room.dimensions`
- `items[].id`, `type`, `before`, `after`, `after.pose.position`, `outcome`, `impact.hit`
- `penalties.alpha`, `penalties.impacts[].points`
- karşılaştırma için `rawSafetyScore`

Ayrıca iki kontrol yapar: `slid` ya da `stationary` bir eşyadan gelen `bed`/`work_area` cezası varsa hata verir; aynı bölgede iki kayıt varsa hata verir.

## 6. Profil dosyasına eklenenler **[v2]**

```ts
fizik: {
  siddet: { light: 0.20, moderate: 0.35, strong: 0.50 },  // g, PGA
  varsayilanSiddet: "moderate",
  frekans: 1.5,         // Hz, sabit; kullanıcıya açık değil
  sure: { yukselme: 1, tam: 5, sonme: 2, durulma: 2 },  // s
  dt: 1 / 120,
  kayitFps: 20,
  sureButcesiMs: 3000,  // sadece döngü; Rapier init hariç
  askiKopmaIvmesi: 0.2, // g
  surtunme: { zemin: 0.5, esya: 0.4 },
  yogunluk: { kitaplik: 250, dolap: 150, /* ... */ },
  yukYuksekligi: 20,    // cm
  snap: { konumCm: 2, aciDerece: 5 },
  devrilmeAcisi: 45,    // derece
  dusmeEsigiCm: 10,
  hitbox: { duvarPayiCm: 0.5, minKalinlikCm: 5, kirpmaToleransiCm: 10, maxKucultme: 0.2 },
}
```

Profil farkı sadece değerlerde: örneğin `isg` R7 için yük kutusunu raflarda da kurar, `ev`'de R7 kapalı.

## 7. "Önlemleri uygula" ve "belirsiz" cevapları
- Sabitlenen eşyalar `anchored: yes` olur, simülasyon baştan çalışır. GPT'ye gidilmez.
- **[v2]** İstek, ilk analizin `mode` ve `intensity` değerlerini taşır. Tekrar çalıştırma aynı mod ve aynı şiddetle yapılır. Böylece önce/sonra farkı sadece sabitlemeden gelir.
- Sabitlenen eşya odaya eklendiği için diğer eşyaların hareketi de değişebilir (örneğin artık devrilen kitaplık başka eşyaya çarpmaz). Bu beklenen davranış.

## 8. Testler

Eski 62 → 87 → 100 testi artık fizik modu için birebir geçerli değil. Yerine:

1. **Determinizm:** Aynı girdiyle iki çalıştırma → birebir aynı JSON.
2. **Sabit oda:** Her şey `anchored: yes` → bütün eşyalar `stationary`, `safetyScore = 100`.
3. **Kabul testi odası davranışı** (`moderate`):
   - Kitaplık `tipped`, ağırlıkla `+y` yönünde; izi yatak bölgesiyle örtüşür.
   - Ayna `fell`, yatağın üzerine iner.
   - Gardırop `stationary` (sabit), masa ve yatak `stationary`.
   - Kaçış koridoru açık kalır.
4. **Skor bantları** (kabul odası, `moderate`): başlangıç 50–70 · kitaplık sabitlenince 80–95 · ayna da sabitlenince 100. Sıra her zaman artan.
5. **Golden dosya:** Kalibrasyon bitince kabul odasının tam sonucu `golden/kabul-odasi.json`'a kilitlenir. **[v2]** Golden Vercel'de üretilir; yerelde birebir tutmazsa küçük toleransla karşılaştırılır.
6. **Paraşüt:** Kural simülatörü 62 → 87 → 100 (±1) vermeye devam eder.
7. **Süre:** Kabul odası simülasyonu Vercel'de < 1 s.
8. **[v2] Çarpma bayrağı:** Kabul odasında kitaplık `hit: true` (`bed`), ayna `hit: true` (`bed`); gardırop, masa ve yatak `hit: false`. `penalties.impacts`'te `bed` için tek kayıt (25).
9. **[v2] Kayan eşya cezası:** Masayı kaydıracak bir test odası (örneğin `strong`) → masa `slid`, `hit: false`, `work_area` cezası yok, kayma cezası var.
10. **[v2] Mod tutarlılığı:** Soğuk başlatılmış süreçteki ilk çağrı ile sıcak çağrı aynı `mode` ve aynı skoru verir.
11. **[v2] Şiddet:** Aynı oda için skor sırası `light ≥ moderate ≥ strong`. Bantlar sadece `moderate` için tanımlı.
12. **[v2] Patlama testi:** Birbirine 10 cm giren iki kutu verildiğinde ilk 0,5 s içinde hiçbir eşya 20 cm'den fazla yer değiştirmez ve `room.warnings`'ta örtüşme notu vardır.

## 9. Kalibrasyon (gradient descent yok)
- Hedef: `moderate`'te kabul odasında yukarıdaki bantlar; dağınık demo odası 30–40, düzenli oda 85–95.
- Ayar sırası: önce `moderate` PGA'sı (kitaplık devrilmeli, masa kaymamalı), sonra `askiKopmaIvmesi`, sonra `light` ve `strong` (test 11'deki sıra korunmalı), en son α.
- Her ayar değişikliğinden sonra determinizm ve bant testleri çalıştırılır. Bulunan değerler profile yazılır ve golden güncellenir.

## 10. Yapılacaklar

Mevcut plan (§10 eski tablo: arayüz + paraşüt → Rapier → zemin + döngü + t1 → asılı + yük → test + kalibrasyon → API + Vercel → önlemler) aynen geçerli. v2 için eklenenler, önem sırasıyla:

- [ ] **1. Yanıt alanları:** `outcome`, `impact.hit`, `after.pose`, `simulation.mode`, `simulation.intensity` ekle. **Kural modunda da doldur.** Cem'in okuyucusu ve Hıdırcan'ın sahnesi buna bağlı, önce bu.
- [ ] **2. Çarpma:** `penalties.impacts`'te bölge başına tek kayıt, sadece `hit = true`, `rule` alanı. R4'ü `exit` kaydı olarak yaz.
- [ ] **3. Örnek yanıt:** `ornek-analyze-response.json`'ı yeni alanlarla güncelle. Fizik modundan ilk gerçek yanıtı `ornek-analyze-response-physics.json` olarak ekle.
- [ ] **4. Şiddet:** `intensity` isteği + profil eşlemesi + yanıtta `pgaG`.
- [ ] **5. Hitbox:** `fizik/hitbox.ts`: duvar payı, kırpma, örtüşme ayırma, min 5 cm, uyarılar.
- [ ] **6. Soğuk başlangıç:** Rapier init'i bütçeden çıkar; "Önlemleri uygula" isteğine `mode` ve `intensity` taşı; Hıdırcan'la `/api/health` ısıtmasını bağla.
- [ ] **7. Yükler:** `loads` listesi ve `tracks`'te yük izleri.
- [ ] **8. Testler 8–12.**
- [ ] **9. Vercel:** golden üretimi, süre ölçümü, fonksiyon süre sınırı kontrolü (§11).

**13:30 kararı (Cem + Ömer):** Fizik modu determinizm ve bant testlerini geçmiyorsa ya da Vercel'de 3 s'yi aşıyorsa varsayılan mod `rules` yapılır, fizik demo dışı kalır. 15:00'ten sonra fizik ayarı yapılmaz.

## 11. Riskler

| Risk | Önlem |
|---|---|
| Kütle ve sürtünme fotoğraftan bilinmiyor | Tip başına tablo, profilde; pitch'te "tahmini" deniyor |
| Sonuç ayara çok duyarlı | Golden dosya + bant testleri; parametreler sadece kalibrasyonda değişir |
| Determinizm bozulması | Sürüm sabit, sabit `dt`, `id` sırası, rastgelelik yok; test her commit'te |
| Rapier Vercel'de yüklenmez | `rapier3d-compat` (WASM gömülü); olmazsa `cannon-es`; en kötü durumda kural modu |
| Süre aşımı | 3 s bütçe (sadece döngü), aşılırsa kural moduna düşüş ve uyarı |
| Eğik düşüşte AABB izi büyür | Bilinçli temkinli tercih; gerekirse V2'de çokgen kesişim |
| Kural 62/87/100 rakamları pitch'te kullanılırsa yanlış olur | Pitch'te demo odasının fizik modundaki gerçek rakamları söylenir |
| **[v2]** Soğuk başlangıçta aynı oda farklı modla hesaplanır | Init bütçe dışında, `mode` yanıtta, demodan önce ısıtma, test 10 |
| **[v2]** Sol'un kutuları birbirine girer, ilk adımda eşyalar uçar | Hitbox ayırma (§4.1), patlama testi (test 12) |
| **[v2]** API toplam süresi (Sol algılama + simülasyon + Sol yorum) Vercel fonksiyon süre sınırını aşar | `maxDuration` ayarını kontrol et; yorum zaten akışlı, skor yorumdan önce dönebilir |
| **[v2]** Şiddet değişince skor değişir, demo ve testler karışır | Demo ve bantlar tek şiddette (`moderate`); şiddet seçici sadece ek gösterim |

## 12. Ekibe etkisi

- **Cem:** Skor formülü aynı. Okuyucu `after.pose.position`'ı t1 merkezi olarak, `outcome` ve `impact.hit`'i çarpma kontrolü için kullanır. Kabul testi beklentisi fizik modunda bant + golden'a dönüyor. Yorum çağrısına `outcome` (devrildi, düştü, kaydı) eklenir.
- **Hıdırcan:** t0 → t1 dönme animasyonu yerine `simulation.tracks` oynatılır; son kare `after.pose`. Kural modunda (`tracks` boş) eski animasyon. Yük kutuları `loads`'tan çizilir. Demodan önce `/api/health` ile API'yi ısıtır.
- **Rabii:** `simulation.mode` için küçük bir etiket ("Fizik simülasyonu" / "Kural modeli"). İstenirse şiddet seçici (varsayılan "Orta").
- **Pitch:** "Rijit cisim fizik simülasyonu: oda temsili bir deprem sarsıntısıyla (orta şiddet, 0,35g) sallanıyor, eşyalar kutu olarak modelleniyor, kütle ve sürtünme eşya tipine göre tahmini. Skoru kodumuz hesaplıyor." Gerçek bir depremin birebir simülasyonu ya da bina analizi olduğu söylenmez.
