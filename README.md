# Sarsıntı

## Proje yapısı

```text
app/                 Next.js sayfaları ve ekran stili
app/api/fal/         fal.ai oda görseli API rotası
fal/                 Sunucu tarafı fal.ai istemcisi ve doğrulama
scene/               Oda sahnesi, API yanıt adaptörü, 2D yedek plan
omer/                Backend dokümanları ve örnek analiz yanıtı
cem/                 AI dokümanları
rabii/               Arayüz dokümanları
hidircan/            Sahne sorumluluğu ve entegrasyon notları
Dockerfile           Production imajı
compose.yaml          Yerel Compose servisi
```

Uygulama kaynak kodu kökteki `app/` ve `scene/` dizinlerinde; kişi klasörlerinde ekip dokümanları ve sorumluya ait çalışma notları bulunur.

## Docker ile yerel çalıştırma

1. fal.ai görselini yerelde deneyeceksen `.env.local` oluşturup `FAL_KEY=...` ekle. Bu dosya Git tarafından ignore edilir; anahtarı kaynak koda veya `.env.example` dosyasına koyma. Vercel'de `FAL_KEY` Production (ve istersen Preview) ortamında tanımlı olmalı.
2. Uygulamayı build edip arka planda başlat:

   ```bash
   docker compose up --build -d
   ```

3. Demo sayfasını aç: [http://localhost:3000](http://localhost:3000)

Çalışan servise sonradan `.env.local` anahtarı eklersen Compose'u yeniden oluştur: `docker compose up --build -d --force-recreate`.

Analiz ekranında fal.ai bölümünden oda fotoğrafı için temsili bir önlem sonrası görsel üretebilirsin. Fotoğraf JPEG, PNG veya WebP olmalı; fal.ai yükleme sınırı 4 MB. Görsel üretim hesabında ücret oluşturabilir ve skor/simülasyon sonucunu değiştirmez.

```bash
docker compose logs -f web  # logları izle
docker compose down         # servisi durdur
```

Bu Compose kurulumu uygulamayı makinede ayağa kaldırır; internete açık bir sunucuya yayın yapmaz. Vercel'e yeni kodu deploy ettikten sonra `FAL_KEY` değişkeninin etkin olduğu ortamda fal.ai düğmesi çalışır. Vercel ortam değişkeni değiştirildiyse yeni deployment gerekir.
