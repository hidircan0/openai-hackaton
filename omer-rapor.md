# Ömer'in Fizik Motoru Çalışma Raporu

**Tarih:** 12 Ekim 2026  
**İlgili plan:** [omer/motor-plan-v3.md](omer/motor-plan-v3.md)  
**Durum:** Ömer'in motor ve backend kapsamı uygulandı; ekip entegrasyonu ve uçtan uca doğrulama bekliyor.

## Tamamlanan işler — Ömer

- Python 3.11, FastAPI ve PyBullet kullanan sunucu tarafı simülasyon servisi oluşturuldu.
- Oda ve eşya girdileri doğrulanıyor. Eşya sabitliği kullanıcı girdisi olarak alınıyor; deprem şiddeti 1–9, süresi 5–60 saniye aralığında sınırlandırılıyor.
- Sabit adımlı 3D simülasyon; son poz, eşya sonucu (`stationary`, `slid`, `tipped`, `fell`) ve sahne oynatımına uygun hareket izleri üretiyor.
- Eşyalar arası çarpışmada çarpan eşyanın ve çarpılan eşyaların ID'leri dönüyor. Çarpışma yoksa ID alanı `null` oluyor.
- FastAPI `/simulate` ve `/health` uçları, Python servis Dockerfile'ı ve Next.js `/api/simulation` yönlendirme rotası eklendi.
- Test sırasında eksik `numpy` bağımlılığı ve devrilme momenti sorunu bulundu ve Ömer'in simülasyon dosyalarında düzeltildi.

## Yapılan doğrulamalar

- Python servis Docker imajı başarıyla oluşturuldu.
- PyBullet içinde yüksek şiddetli senaryoda eşyanın devrilmesi ve sabit masaya çarpması doğrulandı; `table-1` çarpılan eşya ID'si olarak döndü.
- Sabit eşyalı çarpışmasız senaryoda `hit: false` ve ID alanının `null` olduğu doğrulandı.
- Şiddet ve süre alt/üst sınırları ile sınır dışı değerlerin reddedilmesi doğrulandı.

Testler motor fonksiyonunu Docker içinden doğrudan çalıştırdı. Next.js rotasına HTTP üzerinden uçtan uca istek, Compose ile birlikte çalışma ve Vercel dağıtım testi henüz yapılmadı. Maksimum 60 saniyelik istek süresinin gerçek çalışma süresi de ayrıca ölçülmeli.

## Sonraki işler ve sorumlular

| Sorumlu | Yapılacak iş | Tamamlanma ölçütü |
|---|---|---|
| **Rabii** | Arayüzde her eşya için sabitlik seçimi; deprem şiddeti 1–9 ve süre 5–60 saniye kontrolleri; `/api/simulation` isteği ve sonuç/çarpışma gösterimi | Kullanıcı değerleri API'ye gönderilir ve dönen simülasyon sonucu arayüzde gösterilir. |
| **Hıdırcan** | Web uygulaması ile Python servisini Compose/dağıtım ortamında bağlamak; `SIMULATION_SERVICE_URL` ayarlamak; `/health` kontrolü ve sahnede sunucudan gelen `track` izlerini oynatmak | Servisler birlikte başlar, web API'si Python servisine erişir ve sahne fizik hesaplamadan izleri oynatır. |
| **Ömer** | Hıdırcan'ın servis bağlantısı hazır olduğunda web API rotası üzerinden başarılı ve hatalı istekleri uçtan uca doğrulamak; 60 saniyelik simülasyon sınırında zaman aşımı/performance ölçmek; gerekirse API hata ve zaman aşımı ayarlarını düzeltmek | `/api/simulation` beklenen sözleşmeyle yanıt verir; maksimum süre senaryosu zaman aşımına uğramaz. |

## Kapsam notu

Ömer'in Python motoru ve backend yönlendirme işi hazır. Ancak v3 planındaki arayüz, Compose/dağıtım ve sahne entegrasyonu diğer ekip üyelerinin işidir; bu işler tamamlanmadan özellik site içinde uçtan uca bitmiş sayılmaz. Bu rapor commit içermez.
