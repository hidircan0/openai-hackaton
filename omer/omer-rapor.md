# Ömer'in Fizik Motoru Çalışma Raporu

**Tarih:** 12 Ekim 2026  
**İlgili plan:** [omer/motor-plan-v3.md](omer/motor-plan-v3.md)  
**Durum:** Ömer'in motor, risk bölgeleri ve skor bağlantısı uygulandı; ekip entegrasyonu ve uçtan uca doğrulama bekliyor.

## Tamamlanan işler — Ömer

- Python 3.11, FastAPI ve PyBullet kullanan sunucu tarafı simülasyon servisi oluşturuldu.
- Oda ve eşya girdileri doğrulanıyor. Eşya sabitliği kullanıcı girdisi olarak alınıyor; deprem şiddeti 1–9, süresi 5–60 saniye aralığında sınırlandırılıyor.
- Sabit adımlı 3D simülasyon; son poz, eşya sonucu (`stationary`, `slid`, `tipped`, `fell`) ve sahne oynatımına uygun hareket izleri üretiyor.
- Cem analizinden gelen `criticalZones` geometri ve ceza bilgisiyle doğrulanıyor. Devrilen/düşen eşyanın `bed` ve `work_area` bölgelerine değmesi `impact.hitZones` alanına yazılıyor; fiziksel eşya çarpışmaları `hitItemIds` alanında ayrı tutuluyor. Çıkış koridoru açıklığı R4 olarak hesaplanıyor.
- Eşya tipleri Cem'in ortak 16 tiplik kataloğuna göre doğrulanıyor.
- Simülasyondan sonra `cem/kayma_skoru` içindeki `kayma_skoru_hesapla` çağrılıyor; `rawSafetyScore`, `safetyScore`, `displacement` ve `penalties` yanıta ekleniyor.
- FastAPI `/simulate` ve `/health` uçları, Python servis Dockerfile'ı ve Next.js `/api/simulation` yönlendirme rotası eklendi.
- Docker imajı Cem'in skor modülünü de kopyalıyor. Test sırasında eksik `numpy` bağımlılığı ve devrilme momenti sorunu bulundu ve Ömer'in simülasyon dosyalarında düzeltildi.

## Yapılan doğrulamalar

- Python servis Docker imajı başarıyla oluşturuldu.
- PyBullet içinde yüksek şiddetli senaryoda cam eşyanın devrilmesi ve sabit masaya çarpması doğrulandı; `desk-1` `hitItemIds` içinde döndü.
- Sabit eşyalı çarpışmasız senaryoda `hit: false` ve ID alanının `null` olduğu doğrulandı.
- Şiddet ve süre alt/üst sınırları ile sınır dışı değerlerin reddedilmesi doğrulandı.
- Bölge + skor testinde `glass-1` devrildi, `bed` bölgesine değdi ve `desk-1` ile çarpıştı; `safetyScore` 61, ham skor 61.399 oldu.
- Çıkış koridorunda 60 cm'den az açıklık kaldığında R4 cezası ve Cem'in 16 tip dışındaki `table` tipinin reddedilmesi doğrulandı.
- Tam test girdisi ve çıktısı [omer/omer-simulation-test.json](omer/omer-simulation-test.json) dosyasında saklanıyor.

Testler motor fonksiyonunu Docker içinden doğrudan çalıştırdı. Next.js rotasına HTTP üzerinden uçtan uca istek, Compose ile birlikte çalışma ve Vercel dağıtım testi henüz yapılmadı. Maksimum 60 saniyelik istek süresinin gerçek çalışma süresi de ayrıca ölçülmeli.

## Sonraki işler ve sorumlular

| Sorumlu | Yapılacak iş | Tamamlanma ölçütü |
|---|---|---|
| **Rabii** | Arayüzde her eşya için sabitlik seçimi; şiddet 1–9 ve süre 5–60 kontrolleri; Cem'den gelen `criticalZones` alanını `/api/simulation` isteğine ekleme; skor, bölge çarpması ve eşya çarpışma sonuçlarını gösterme | Kullanıcı değerleri ve bölgeler API'ye gider; skor ve sonuçlar arayüzde gösterilir. |
| **Hıdırcan** | Web uygulaması ile Python servisini Compose/dağıtım ortamında bağlamak; `SIMULATION_SERVICE_URL` ayarlamak; `/health` kontrolü; sahnede `track` izlerini ve `criticalZones` alanlarını oynatıp çizmek | Servisler birlikte başlar, web API'si Python servisine erişir ve sahne fizik hesaplamadan izleri/bölgeleri gösterir. |
| **Ömer** | Hıdırcan'ın servis bağlantısı hazır olduğunda web API rotası üzerinden başarılı ve hatalı istekleri uçtan uca doğrulamak; 60 saniyelik simülasyon sınırında zaman aşımı/performance ölçmek; gerekirse API hata ve zaman aşımı ayarlarını düzeltmek | `/api/simulation` beklenen sözleşmeyle yanıt verir; maksimum süre senaryosu zaman aşımına uğramaz. |

## Kapsam notu

Ömer'in Python motoru ve backend yönlendirme işi hazır. Ancak v3 planındaki arayüz, Compose/dağıtım ve sahne entegrasyonu diğer ekip üyelerinin işidir; bu işler tamamlanmadan özellik site içinde uçtan uca bitmiş sayılmaz. Bu rapor commit içermez.
