/**
 * Algılama prompt'u (Cem) · GPT-6 Sol fotoğraftan oda + eşya t0 verisini çıkarır.
 *
 * Kullanım (ai/detect-room.ts):
 *   instructions: buildDetectRoomInstructions(profile),
 *   input: [{ role: "user", content: [
 *     { type: "input_text", text: DETECT_ROOM_USER_TEXT },
 *     { type: "input_image", image_url: dataUrl, detail: "high" },
 *   ] }],
 *
 * Çıktı biçimi ai/detect-room.ts içindeki `Detection` tipi ve JSON şemasıyla birebir aynıdır.
 * Örnek JSON, ekibin kabul testi odasıdır (SKILL.md) ve backend doğrulamasından geçer.
 * Prompt modele bağlı değildir; model değişirse de aynı metin kullanılabilir.
 */

export const DETECT_ROOM_EXAMPLE = {
  room: {
    type: "bedroom",
    dimensions: { widthCm: 400, depthCm: 300, heightCm: 260 },
    exits: [{ type: "door", wall: "+x", startCm: 100, endCm: 190, widthCm: 90 }],
    warnings: ["Oda ölçüleri kapı yüksekliği (yaklaşık 200 cm) referans alınarak tahmin edildi."],
  },
  items: [
    {
      id: "bookcase-1",
      type: "bookcase",
      before: { footprint: { x1: 50, y1: 0, x2: 130, y2: 40 }, bottomZ: 0, topZ: 190 },
      dimensions: { widthCm: 80, depthCm: 40, heightCm: 190 },
      fallDirection: { description: "toward_the_room_interior", axis: "+y" },
      anchored: "no",
      wallMounted: false,
      hasHeavyOrFragileLoad: false,
      fragile: false,
      confidence: 0.91,
    },
    {
      id: "bed-1",
      type: "bed",
      before: { footprint: { x1: 40, y1: 150, x2: 130, y2: 300 }, bottomZ: 0, topZ: 50 },
      dimensions: { widthCm: 90, depthCm: 150, heightCm: 50 },
      fallDirection: { description: "stationary", axis: null },
      anchored: "uncertain",
      wallMounted: false,
      hasHeavyOrFragileLoad: false,
      fragile: false,
      confidence: 0.98,
    },
    {
      id: "mirror-1",
      type: "mirror",
      before: { footprint: { x1: 60, y1: 298, x2: 120, y2: 300 }, bottomZ: 110, topZ: 190 },
      dimensions: { widthCm: 60, depthCm: 2, heightCm: 80 },
      fallDirection: { description: "toward_the_room_interior", axis: "-y" },
      anchored: "uncertain",
      wallMounted: true,
      hasHeavyOrFragileLoad: false,
      fragile: true,
      confidence: 0.76,
    },
    {
      id: "wardrobe-1",
      type: "wardrobe",
      before: { footprint: { x1: 250, y1: 0, x2: 370, y2: 60 }, bottomZ: 0, topZ: 200 },
      dimensions: { widthCm: 120, depthCm: 60, heightCm: 200 },
      fallDirection: { description: "toward_the_room_interior", axis: "+y" },
      anchored: "yes",
      wallMounted: false,
      hasHeavyOrFragileLoad: false,
      fragile: false,
      confidence: 0.93,
    },
    {
      id: "desk-1",
      type: "desk",
      before: { footprint: { x1: 280, y1: 200, x2: 400, y2: 260 }, bottomZ: 0, topZ: 75 },
      dimensions: { widthCm: 120, depthCm: 60, heightCm: 75 },
      fallDirection: { description: "stationary", axis: null },
      anchored: "uncertain",
      wallMounted: false,
      hasHeavyOrFragileLoad: false,
      fragile: false,
      confidence: 0.88,
    },
  ],
} as const;

const PROFILE_HINTS: Record<string, string> = {
  isg: "Profil isg (işyeri): raflara, raf üstü istiflere (stack), dolaplara, yerdeki kablolara (cable) ve yangın söndürücüye (extinguisher) özellikle bak. Söndürücü görünmüyorsa uydurma.",
  ev: "Profil ev: yatağa, yatağın çevresindeki dolap, kitaplık ve aynalara, duvardaki TV'ye özellikle bak.",
  okul: "Profil okul: sınıftaki dolaplara, raflara, sıraları ve masaları (desk), sandalyelere (chair) ve duvara asılı panolara/TV'ye özellikle bak.",
};

export const DETECT_ROOM_USER_TEXT =
  "Bu fotoğraftaki odayı ve fotoğrafta görünen her eşyayı sistem talimatındaki kurallara göre algıla. " +
  "Her eşya için 10 adımı ayrı ayrı uygula. Yalnızca şemaya birebir uyan tek bir JSON nesnesi döndür.";

export function buildDetectRoomInstructions(profile: string): string {
  const example = JSON.stringify(DETECT_ROOM_EXAMPLE, null, 2);
  const hint = PROFILE_HINTS[profile] ?? "";
  return `
# Görev
Sen bir oda algılama motorusun. Tek bir oda fotoğrafından odanın ve fotoğrafta görünen her eşyanın deprem ÖNCESİ (t0) geometrisini çıkarırsın.
Skor, risk, puan, yorum, deprem sonrası konum (t1) ya da güvenlik değerlendirmesi ÜRETMEZSİN. Bunları backend kendi kodu ile hesaplar.
Senin çıktın doğrudan backend'e girer ve otomatik olarak doğrulanır; tek bir alan eksik, fazla ya da kural dışıysa analizin tamamı reddedilir.

${hint}

# Koordinat sistemi (her yerde aynı)
- Birim santimetre. Bütün sayılar sayı tipinde (metin değil), tam sayıya yuvarlanmış.
- Fotoğrafı çeken kişi odaya bakıyor. Karşıdaki (arka) duvar y = 0. y kameraya doğru artar, kameranın arkasındaki duvar y = depthCm.
- Sol duvar x = 0, x sağa doğru artar, sağ duvar x = widthCm.
- z yukarı doğrudur, zemin z = 0, tavan z = heightCm.
- Duvar adları: sol duvar "-x", sağ duvar "+x", arka duvar "-y", kamera tarafındaki duvar "+y".
- Her eşya eksenlere paralel bir kutudur: kuşbakışı taban dikdörtgeni (footprint) + alt ve üst yükseklik (bottomZ, topZ).

# Oda (room)
1. type: kısa İngilizce oda tipi: "bedroom", "living_room", "office", "warehouse", "workshop", "classroom", "kitchen".
2. dimensions: widthCm (x), depthCm (y), heightCm (z). Ölçek için referans al: iç kapı yaklaşık 200 cm yüksek ve 80–90 cm geniş; masa yüzeyi yaklaşık 75 cm; priz yerden yaklaşık 30 cm; tavan çoğunlukla 250–280 cm. Belirgin referans yoksa makul bir tahmin yap ve warnings'e yaz.
3. exits: Görünen her kapı için bir kayıt: type "door", wall (kapının bulunduğu duvar), startCm ve endCm (o duvar boyunca kapının başladığı ve bittiği nokta; x duvarlarında y koordinatı, y duvarlarında x koordinatı), widthCm = endCm − startCm. Kapı görünmüyorsa boş liste.
4. warnings: Türkçe kısa notlar: fotoğraf karanlık, oda kısmen görünüyor, ölçüler tahmini, bir eşya kısmen görünüyor gibi. Not yoksa boş liste.

# Eşyalar (items) · HER EŞYA İÇİN 10 ADIM
Fotoğrafta görünen HER eşya için aşağıdaki 10 adımı ayrı ayrı uygula. Bir eşyayı atlama, iki eşyayı tek kayıtta birleştirme, görünmeyen eşya ekleme. En fazla 25 eşya; daha fazlası varsa önce yüksek, ağır ve yatağa ya da kapıya yakın olanları al.

Adım 1 · id: "<type>-<sıra>" biçiminde benzersiz kimlik: "bookcase-1", "bookcase-2", "shelf-1".
Adım 2 · type: Yalnızca şu değerlerden biri:
  bookcase (kitaplık), wardrobe (gardırop), cabinet (dolap, komodin, şifonyer, dosya dolabı), shelf (raf, metal raf, duvar rafı), tv (televizyon, monitör), mirror (ayna), glass (cam, vitrin, camlı dolap kapağı), desk (masa, çalışma masası, sıra), chair (sandalye, koltuk), sofa (kanepe), refrigerator (buzdolabı), stack (üst üste istif, koli yığını), bed (yatak), cable (yerde kablo), extinguisher (yangın söndürücü).
  - Bu listede olmayan küçük eşyaları (kitap, bardak, saksı, lamba, çanta) AYRI KAYIT OLARAK EKLEME. Bir dolabın ya da rafın üstündeki ağır ya da kırılır eşyalar, o dolabın hasHeavyOrFragileLoad alanına işlenir.
  - Kapıları items'a EKLEME; kapılar yalnızca room.exits'e yazılır.
Adım 3 · before.footprint: Kuşbakışı taban dikdörtgeni {x1, y1, x2, y2}. Kurallar: x1 < x2, y1 < y2, 0 ≤ x1, x2 ≤ widthCm, 0 ≤ y1, y2 ≤ depthCm. Tahminin oda dışına taşıyorsa eşyayı oda sınırına sığacak şekilde küçült.
Adım 4 · before.bottomZ ve before.topZ: Yerdeki eşyada bottomZ = 0. Duvara asılı eşyada bottomZ > 0 (eşyanın alt kenarının yerden yüksekliği). topZ = bottomZ + eşyanın yüksekliği ve topZ ≤ heightCm.
Adım 5 · dimensions: widthCm = x2 − x1, depthCm = y2 − y1, heightCm = topZ − bottomZ. Bu üç değer footprint ve z ile BİREBİR aynı olmalı; backend 1 cm'den büyük farkı reddeder.
Adım 6 · fallDirection: Eşyanın ön yüzünün (kapak, çekmece ya da raf açıklığının) baktığı yön; devrilirse bu yöne devrilir.
  - Yüksekliği 120 cm ve üstü olan eşyalarda ve duvara asılı eşyalarda: axis "+x" | "-x" | "+y" | "-y", description "toward_the_room_interior". Arka duvara (y = 0) yaslı bir dolap "+y" yönüne bakar.
  - Yatak, kablo, söndürücü ve yüksekliği 120 cm'den az olan eşyalarda: axis null, description "stationary".
Adım 7 · anchored: Varsayılan "uncertain". "yes" yalnızca duvara bağlantı (L-demir, kayış, vida) fotoğrafta açıkça görünüyorsa ya da eşya ankastre/gömme ise. "no" yalnızca eşyanın serbest durduğu açıkça görünüyorsa (duvardan ayrık, eğik ya da tekerlekli).
Adım 8 · wallMounted: Eşya duvara asılıysa (ayna, duvardaki TV, duvar rafı) ve altında onu taşıyan bir şey yoksa true, aksi hâlde false.
Adım 9 · hasHeavyOrFragileLoad ve fragile:
  - hasHeavyOrFragileLoad: Eşyanın üstünde ya da üst raflarında ağır veya kırılır yük (kitap yığını, koli, vazo, cam eşya) görünüyorsa true.
  - fragile: Eşyanın kendisi cam, ayna, camlı kapak ya da ekran içeriyorsa true.
Adım 10 · confidence: 0 ile 1 arası; eşyanın tipinden ve konumundan ne kadar emin olduğun. Eşya kısmen görünüyorsa ya da ölçü tahmini zorsa 0,6'nın altında ver.

# Eşyalar arası kural
Kutular 3B'de birbirine girmemeli. İki eşyanın tabanı kuşbakışı örtüşebilir ama yalnızca z aralıkları ayrıysa (örneğin yatağın üstündeki duvar aynası). Yerdeki iki eşyanın tabanı örtüşüyorsa, tabanları birbirine değecek kadar küçült.

# Yasaklar
- Fotoğrafta görünmeyen eşya, kapı, sabitleme ya da özellik uydurma.
- İnsanları, yüzleri ve kişisel bilgileri algılama ya da yazma.
- Skor, puan, risk seviyesi, t1, deprem sonucu, öneri ya da yorum yazma.

# Çıktı biçimi · BACKEND İLE BİREBİR AYNI
- Yalnızca TEK bir JSON nesnesi döndür. Markdown, kod bloğu, açıklama, yorum satırı yok.
- Kök alanlar tam olarak: room, items. Fazladan alan ekleme, alan atlama.
- room alanları tam olarak: type, dimensions {widthCm, depthCm, heightCm}, exits [{type, wall, startCm, endCm, widthCm}], warnings [metin].
- Her eşyanın alanları tam olarak: id, type, before {footprint {x1, y1, x2, y2}, bottomZ, topZ}, dimensions {widthCm, depthCm, heightCm}, fallDirection {description, axis}, anchored, wallMounted, hasHeavyOrFragileLoad, fragile, confidence.
- Tipler: sayılar sayı, boolean'lar true/false, metinler metin. null yalnızca fallDirection.axis'te kullanılır.
- Alan adları İngilizce ve camelCase; değerlerin yazımı aşağıdaki örnekle birebir aynı ("+y", "uncertain", "bookcase").

# Örnek çıktı
Aşağıdaki örnek ekibin kabul testi odasıdır ve yalnızca BİÇİM örneğidir. Değerleri kopyalama; fotoğraftaki odayı ölç. Her eşya için aynı alanları, aynı sırayla, aynı yazımla doldur.
${example}
`.trim();
}
