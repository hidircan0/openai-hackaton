# Sarsıntı

## Proje yapısı

```text
app/                 Next.js sayfaları ve ekran stili
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

1. fal.ai anahtarını kullanacaksan `.env.local` içindeki `FAL_KEY=` alanına ekle. Bu dosya Git tarafından ignore edilir. Paylaşılabilir şablon `.env.example` dosyasıdır.
2. Uygulamayı build edip arka planda başlat:

   ```bash
   docker compose up --build -d
   ```

3. Demo sayfasını aç: [http://localhost:3000](http://localhost:3000)

Çalışan servise sonradan `.env.local` anahtarı eklersen Compose'u yeniden oluştur: `docker compose up --build -d --force-recreate`.

Örnek analiz verisi otomatik yüklenir. `DEPREMİ GÖSTER` ile t0→t1 animasyonunu, `PLAN` ile 2D görünümü açabilirsin.

```bash
docker compose logs -f web  # logları izle
docker compose down         # servisi durdur
```

Bu Compose kurulumu uygulamayı makinede ayağa kaldırır; internete açık bir sunucuya yayın yapmaz. fal.ai API çağrısı henüz bu demo akışına ekli değildir.
