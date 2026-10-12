---
name: sarsinti
description: Sarsıntı hackathon projesinde (fotoğraftan deprem ve İSG risk analizi) kod yazarken; şema, skor motoru, GPT-6 Sol çağrıları, 3D sahne, arayüz ya da pitch materyali üzerinde çalışırken kullan. Ekibin değişmez mimari kurallarını, veri sözleşmesini, skor formülünü, kabul testi odasını ve iş bölümünü içerir.
---

# Sarsıntı · Ekip skill'i

Bu dosya Cem, Ömer, Hıdırcan ve Rabii'nin agent'larının aynı kurallarla çalışması için. Bir kararla çelişen bir istek gelirse önce bu dosyadaki kurala uy, sonra durumu kullanıcıya söyle.

## Proje bir bakışta

Sarsıntı tek bir oda fotoğrafından deprem anında devrilebilecek eşyaları, kapanabilecek kaçış yollarını ve temel İSG risklerini çıkarır. Odayı 3D kurar, "Deprem" butonuyla riskli eşyaları devirir ve deprem öncesi ile sonrası konumları karşılaştırarak **Oda Güvenlik Skoru** (0–100) hesaplar.

- **Profiller:** `isg` (ana; kullanıcı İSG uzmanı, alıcı OSGB), `ev` (ikinci), `okul` (vakit kalırsa, Codex'e eklettirilecek).
- **Çıktı:** Oda Güvenlik Skoru (%) + GPT-6 Sol yorumu + risk tablosu (uzman onaylı).
- **Hackathon:** Build Anything with Codex, 12 Ekim 2026, DotsHub. Kodlama 09:30–16:00, ekip teslimi 15:50. Etkinlik "boş sayfa" ile başlıyor: önceden yazılmış ürün kodu yok.

## Değişmez kurallar

1. **Skoru kod hesaplar.** Model hiçbir puan üretmez ve değiştirmez. Modelin ürettiği tek sayılar, algılamadaki tahmini boyut ve koordinatlardır.
2. **GPT-6 Sol (`gpt-6-sol`, Responses API) yalnızca iki yerde çağrılır:** algılama (`/ai`) ve yorum (`/ai`). Başka model çağrısı ekleme.
3. **Yorum çağrısının çıktı şemasında skor ya da puan alanı yoktur.** Skor prompt'a sabit değer olarak verilir.
4. **Son konumları (t1) yalnızca `/engine` hesaplar.** `/scene` kendi fizik hesabını yapmaz, sadece t0'dan t1'e animasyon yapar.
5. **Profil davranışı `/profiles` altındaki ayar dosyalarıyla değişir.** Kodda `if (profil === "ev")` gibi dallanma yok.
6. **Model çıktısı her zaman şemaya göre doğrulanır.** Doğrulanamazsa hata döner; değer uydurulmaz, varsayılan sessizce doldurulmaz.
7. **Fizik motoru yok.** Devrilme, eşyanın ön alt kenarı etrafında 90° dönmesidir.
8. **Arayüz metinleri Türkçe**, renkler SkyEngineX token'larından.
9. **Küçük, odaklı değişiklik.** Testler geçmeden merge yok; `main` her an deploy edilebilir.
10. **Başkasının klasörüne dokunmadan önce sor** (sahiplik tablosu aşağıda).

## Akış

1. **Algılama (GPT-6 Sol):** Fotoğraf → oda, eşyalar, tahmini boyutlar, ilk konumlar (t0).
2. **Bölgeler (kod):** Eşya listesinden kritik bölgeler üretilir.
3. **Sallama (kod):** Devrilme modeli her eşyanın son konumunu (t1) hesaplar.
4. **Kayma (kod):** `|t0 − t1| / oda boyutu` → K.
5. **Çarpma (kod):** Devrilen eşyaların izi kritik bölgelere değiyor mu?
6. **Skor (kod):** `100 − kayma cezası − çarpma cezası`; risk satırlarının O ve Ş değerleri.
7. **Yorum (GPT-6 Sol):** Skor ve sayılar verilir, gerekçe ve önlem yazılır. Skor değişmez.

"Önlemleri uygula" denince sabitlenen eşyalar için 3–6. adımlar tekrar çalışır; GPT'ye tekrar gitmek gerekmez.

## Klasörler ve sahipler

| Klasör | Sahibi | Branch | İçerik |
|---|---|---|---|
| `/schema` | Cem + Ömer | `main` | Veri sözleşmesinin tek kaynağı; değişiklik sadece sync anlarında |
| `/ai` | Cem | `feat/ai` | Algılama ve yorum çağrıları, prompt'lar, şema doğrulama |
| `/engine` | Ömer | `feat/engine` | Bölgeler, sallama, kayma, çarpma, skor, O/Ş, matris; saf fonksiyonlar + testler |
| `/profiles` | Ömer | `feat/engine` | `isg`, `ev`, `okul` ayar dosyaları |
| `/api` | Ömer | `feat/engine` | `POST /api/analyze` |
| `/scene` | Hıdırcan | `feat/scene` | react-three-fiber sahnesi, animasyon, bölge çizimi |
| `/app` | Rabii | `feat/ui` | Ekranlar, skor göstergesi, risk tablosu, onay akışı |

Stack: Next.js (App Router) + TypeScript + Tailwind · 3D: `@react-three/fiber` · Deploy: Vercel. Merge'i Ömer yapar.

## Veri sözleşmesi

**Koordinat sistemi:** Birim cm. Orijin odanın bir köşesi, zemin seviyesinde. `x` genişlik, `y` derinlik, `z` yükseklik. Oda duvarlara hizalıdır; her şey eksenlere paralel dikdörtgen.

**Oda**
- `tip`: ofis, depo, atölye, sınıf, yatak odası, salon…
- `Lx`, `Ly`, `Lz`: genişlik, derinlik, yükseklik
- `kapilar`: her kapı için duvar, konum aralığı, genişlik
- `uyarilar`: "fotoğraf karanlık", "oda kısmen görünüyor" gibi notlar

**Eşya**
- `id`, `tip`: dolap, kitaplık, raf, TV, ayna, cam, yatak, masa, sandalye, kanepe, buzdolabı, söndürücü, kablo, istif
- `taban`: `{x1, y1, x2, y2}`, kuşbakışı taban dikdörtgeni (t0)
- `z0`: alt kenarın zeminden yüksekliği (zemindeyse 0, asılıysa > 0)
- `h`: yükseklik
- `yon`: ön yüzün baktığı yön, `+x | -x | +y | -y` (devrilme yönü)
- `sabit`: `evet | hayir | belirsiz`
- `asili`, `ustYuk`, `cam`: boolean
- `guven`: 0–1, modelin güveni
- `t1`: `/engine`'in hesapladığı yeni taban ve z aralığı (algılamada boş)

**Risk**
- `id`, `esyaId`, `kural` (R1–R7), `tehlike` (kısa tanım)
- `bolge`: `kacis | yatak | calisma | bos`
- `olasilik`, `siddet`: 1–5, **kod türetir**
- `skor` (O × Ş), `seviye`: **kod hesaplar**
- `gerekce`, `onlem`: **GPT-6 Sol yazar**
- `sorumlu`, `termin`: sadece `isg` profilinde
- `onay`: `bekliyor | onaylandi | duzenlendi`

**`POST /api/analyze` yanıtı:** `oda`, `esyalar` (t0 ve t1), `bolgeler`, `riskler`, `odaSkoru`, `cezalar` (`kayma` ve `carpma[]`: bölge, eşya, puan), ardından akan `yorum`.

## Algılama prompt'u (Cem)

- Çıktı yalnızca JSON, şemaya birebir uygun; birim cm.
- **Boyut tahmini için referans nesneler:** standart iç kapı ≈ 200 cm, masa ≈ 75 cm, prizin yerden yüksekliği ≈ 30 cm.
- Sadece fotoğrafta görüneni yaz. Sabitleme görünmüyorsa `sabit: "belirsiz"`.
- Düşük güvenli eşyalar (`guven < 0.6`) ve `belirsiz` alanlar arayüzde kullanıcıya soru olarak çıkar: "Bu dolap duvara sabitli mi?" Cevap motoru yeniden çalıştırır.

## Kritik bölgeler (Cem)

| Bölge | Nasıl üretilir? | Puan |
|---|---|---|
| `kacis` | Kapının önünde, kapı genişliği × 100 cm içeri | 30 |
| `yatak` | Yatağın tabanı + her yönde 20 cm | 25 |
| `calisma` | Masa + açık tarafında 80 cm oturma bandı; kanepe ve sandalyeler | 15 |

## Devrilme modeli (Ömer)

| Kod | Koşul | Simülasyonda ne olur? | Profil |
|---|---|---|---|
| R1 | Sabit değil ya da belirsiz, `h ≥ 120` | Ön alt kenar etrafında 90° devrilir. Yeni taban: ön kenar boyunca genişlik, `yon` yönünde `h` uzunluk; yeni yükseklik = eski derinlik | Hepsi |
| R2 | `ustYuk` ve `h ≥ 150` | Yük önüne düşer: eşyanın önünde `h/2` uzunluğunda iz | Hepsi |
| R3 | `asili` ve sabitlemesi belirsiz (ayna, cam, duvar rafı) | Aşağı düşer: izdüşüm + `yon` yönünde `h/2`; z alttaki yüzeye iner | Hepsi |
| R4 | Kapı önü koridoru | Devrilenlerden sonra kalan açık genişlik < 60 cm ise yol kapalı | Hepsi |
| R5 | Yerde kablo, geçiş yolunda | Simülasyona girmez; sadece risk satırı | isg, okul |
| R6 | Söndürücü yok ya da önü kapalı | Simülasyona girmez; sadece risk satırı | isg, okul |
| R7 | Ağır yük rafın üst yarısında | R2 gibi; raf sabit değilse R1 de çalışır | isg |

Sabit eşya devrilmez: `t1 = t0`. Eşikler başlangıç değerleridir; profil dosyasından okunur.

## Skor formülü (Ömer)

```
Her eşya i için (yatak, kapı, kablo, söndürücü hariç):
  merkez = kutunun geometrik merkezi
  dx = |x0 − x1| / Lx     dy = |y0 − y1| / Ly     dz = |z0 − z1| / Lz
  d_i = √(dx² + dy² + dz²) / √3            → 0–1
  w_i = hacim_i / toplam hacim

K = Σ (w_i × d_i)
kayma_cezasi = 100 × α × K                 → α = 2 (başlangıç)

Her bölge için (en fazla bir kez):
  çarpanlar = devrilen ve izi bölgeye değen eşyaların çarpanları
  bölge_cezasi = bölge.puan × max(çarpanlar)
  (kacis: "değiyor mu?" değil, "kalan geçiş < 60 cm mi?")

eşya çarpanı: h ≥ 180 → 1,0 · 120–180 → 0,7 · < 120 → 0,4 · cam/ayna ise × 1,3

odaSkoru = clamp(100 − kayma_cezasi − Σ bölge_cezasi, 0, 100)   → ekranda yuvarlanır
```

**Kesişim:** `örtüşme = max(0, min(a.x2, b.x2) − max(a.x1, b.x1)) × max(0, min(a.y2, b.y2) − max(a.y1, b.y1))`. Yatak ve çalışma alanında `örtüşme > 0` yeterli.

**α seçimi:** Hedeften geriye. Dağınık bir test odasında kayma cezası ≈ 20 olsun → `α = 20 / (100 × K_dağınık)`. Hedef aralık: dağınık oda 30–40, düzenli oda 85–95. Gradient descent yok (etiketli veri yok).

## Risk satırı puanları (Ömer)

- **Olasılık:** sabit değil 4 (uzun, dar tabanlı ve üstü yüklüyse 5) · belirsiz 3 · sabit 1
- **Şiddet (çarptığı bölge):** `kacis` 5 · `yatak` 5 · `calisma` 4 · `bos` 2
- **R5 kablo:** O 4 / Ş 2 · **R6 söndürücü:** O 3 / Ş 4
- **Seviye (O × Ş):** 1 önemsiz · 2–6 düşük · 8–12 orta · 15–16 yüksek · 20–25 tolere edilemez. Ev profili: 1–6 düşük · 8–12 orta · 15+ yüksek.

## Kabul testi odası

`/engine` testleri bu odayla aşağıdaki sonuçları vermeli (±1).

- **Oda:** `Lx 400`, `Ly 300`, `Lz 260`
- **Kitaplık:** taban x 50–130, y 0–40; `h 190`; `yon +y`; `sabit hayir`
- **Yatak:** taban x 40–130, y 150–300; `h 50`
- **Ayna:** y = 300 duvarında asılı; taban x 60–120, y 298–300 (2 cm); z 110–190 (`h 80`); `yon -y`; `cam`; `sabit belirsiz`. R3 ile düşünce izi y 258–300, yatağın üstüne (z 50) iner
- **Gardırop:** taban x 250–370, y 0–60; `h 200`; `sabit evet`
- **Masa:** taban x 280–400, y 200–260; `h 75` (x = 400 duvarına dayalı)
- **Kapı:** x = 400 duvarında, y 100–190

| Durum | Ara değerler | odaSkoru |
|---|---|---|
| Başlangıç | `d_kitaplık ≈ 0,277` · `K ≈ 0,066` · kayma ≈ 13,1 · yatak cezası 25 (kitaplık, çarpan 1,0) | **62** |
| Kitaplık sabitlendi | kayma ≈ 0,2 · yatak cezası 13 (ayna, 0,4 × 1,3 = 0,52) | **87** |
| Ayna da sabitlendi | kayma 0 · ceza yok | **100** |

Kitaplığın devrilme izi y 40–230 aralığında yatak bölgesine (y ≥ 130) değer; kaçış koridoruna ve çalışma alanına değmez.

## Yorum çağrısı (Cem)

- **Girdi:** odaSkoru, eşya başına kayma (`d`), çarpılan bölgeler, risk satırları (O, Ş, seviye), profil, önlem kütüphanesi; bağlam için fotoğraf.
- **Çıktı şeması:** `odaYorumu` (2–3 cümle) + her risk için `gerekce` ve `onlem`. Skor alanı yok.
- **Prompt kuralları:**
  - "Skor {odaSkoru} olarak hesaplandı ve sabittir. Skoru değiştirme ya da yeni puan verme; sadece nedenini açıkla."
  - Gerekçede rakam kullan: "Kitaplık yaklaşık 1,2 m kayıp yatağın üzerine düşüyor."
  - Fotoğrafta görünmeyeni uydurma.
  - Dil: `isg` resmî ve teknik, `ev` samimi ve kısa.
  - Önlemleri önlem kütüphanesine dayandır. Ev profilinde AFAD'ın "Çök – Kapan – Tutun" hatırlatması; "hayat üçgeni" gibi tartışmalı öneriler yok.
- **Hata durumunda:** Skor ve tablo yine gösterilir; yorum alanına kuraldan üretilen kısa metin düşer.

**Önlem kütüphanesi:** dolap/kitaplık → duvara L-demir veya kayışla sabitleme · TV → duvara montaj ya da kayış · yüksekte ağır yük → alt raflara · ayna/cam → yataktan ve çalışma alanından uzaklaştırma · kaçış yolu → önünü boşaltma · kablo → kablo kanalı · söndürücü → erişilebilir konum.

## Arayüz (Rabii)

- **Akış:** Yükle → Profil seç → Analiz (adım adım: "Eşyalar çıkarılıyor… Riskler hesaplanıyor…") → 3D + Skor + Tablo → Onay.
- **Skor göstergesi:** Büyük rakam, koddan anında gelir; yorum ayrıca akarak gelir, kullanıcı yorumu beklemez.
- **"Önlemleri uygula":** Önce/sonra skoru gösterir (örnek 62 → 87 → 100).
- **Risk tablosu:** tehlike, O, Ş, skor, seviye, gerekçe, önlem; `isg`'de sorumlu ve termin; her satırda onayla / düzenle. Onaylanmayan satır rapora girmez.
- **Ev görünümü:** Ayrı ekran değil; aynı tablonun sütunları azaltılmış, dili sade hâli.
- **"Belirsiz" soruları:** Düşük güvenli eşyalar için evet/hayır soruları; cevap motoru yeniden çalıştırır.

## 3D sahne (Hıdırcan)

- Eşyalar t0'a göre kutu olarak çizilir. Riskli eşyalar danger rengiyle.
- Kritik bölgeler zeminde yarı saydam alanlar olarak görünür; jüri devrilen kutunun hangi bölgeye düştüğünü görmeli.
- **Deprem butonu:** Kısa kamera sarsıntısı, ardından riskli eşyalar sırayla t1'e devrilir. Konumlar `/engine`'den gelir; sahnede hesap yok.
- Sahne takılırsa 13:30 paraşütü: 2D kuşbakışı plan + devrilme izleri (SVG).

## Marka ve görünüm

- **Renkler:** zemin `#0B0C10` · katman `#151518` / `#1F2633` · çizgi `#2C3444` · metin `#F2F0F5` · ikincil metin `#A7A3B3` · vurgu `#9966CC` (vurgu metni `#B28DDB`) · durum: success `#3FB27F`, warning `#E0A73A`, danger `#F0676B`.
- **Fontlar:** Space Grotesk (başlık), Inter (gövde), JetBrains Mono (etiket ve kod).
- **Yasaklar:** Ametist üstüne beyaz yazı; gradyan; neon glow; emoji başlık. Köşe yarıçapı en fazla 8 px.

## Zaman ve kontrol noktaları

| Saat | Ne olmalı? |
|---|---|
| 09:50 | Şema + sahte oda JSON'u herkeste |
| 10:20 | Canlı URL |
| 12:30 | Uçtan uca akış: fotoğraf → skor → tablo → 3D |
| 13:30 | **Karar noktası:** çalışmıyorsa paraşüt (3D yerine 2D, ev modu iptal) |
| 14:30 | Deprem butonu ve ev modu; değilse ev ve okul iptal |
| 15:00 | **Özellik dondurma:** sadece hata düzeltme |
| 15:50 | Teslim (Ömer) |

15:00'ten sonra yeni özellik isteği gelirse uygulama; dondurmayı hatırlat.

## Yapma listesi

- Skoru ya da O/Ş'yi modele hesaplatma.
- Fizik motoru, model eğitimi ya da ince ayar ekleme.
- Bina sağlamlığı ya da yapısal analiz iddiasında bulunma.
- "Makine öğrenimi" ifadesini kayma hesabı için kullanma; doğrusu "normalize edilmiş kayma hesabı".
- Test ya da demo verisi uydurup gerçekmiş gibi gösterme; önceden analiz edilmiş bir örnek kullanılıyorsa sorulduğunda açıkça söyle.
- Fotoğraflardaki kişilerin yüzlerini işleme ya da saklama.

## Pitch ile tutarlılık

- "Oda Güvenlik Skoru", "basitleştirilmiş devrilme modeli", "taslak, uzman onaylı".
- "GPT-6 Sol fotoğrafı okuyor ve yorumluyor; skoru kodumuz hesaplıyor, model değiştiremiyor."
- "Her uzman onayı sisteme bir etiket; katsayılar uzman verisiyle kalibre edilecek."
- Skor rakamlarını demo odasının gerçek değerlerinden söyle; örnek rakamları gerçekmiş gibi kullanma.

## Codex çalışma düzeni

- Her kişi aynı anda 2–3 paralel Codex görevi yürütür; görev tanımı net olur: hangi dosya, girdi ne, çıktı ne, hangi test.
- Codex'in yazdığını çalıştırmadan merge etme. En geç 75 dakikada bir küçük parçalar `main`'e.
- **Codex günlüğü:** Herkes gün içindeki en etkileyici iki Codex anının ekran görüntüsünü ortak klasöre atar; pitch'teki "Codex kullanımı" slaytı buradan çıkar.
- Okul profili Codex'e eklettirilirken ekran kaydı alınır.
