"""Skor sonucunu okunaklı biçimde yazdırır."""


def rapor_yazdir(sonuc):
    """``skor_hesapla`` çıktısını ekrana yazar."""
    print("Eşya başına kayma (d) ve hacim ağırlığı:")
    for esya in sonuc["items"]:
        kayma = esya["displacement"]
        print(f"- {esya['id']} ({esya['type']}): d={kayma['d']:.4f}, agirlik={kayma['volumeWeight']:.4f}")

    cezalar = sonuc["penalties"]
    print(f"Kayma indeksi: {cezalar['slidingIndex']:.4f}")
    print(f"Kayma cezası (alfa = {cezalar['alpha']:g}): {cezalar['sliding']:.2f}")
    print("Çarpma cezaları:")
    for carpma in cezalar["impacts"]:
        print(f"- {carpma['zone']}: {carpma['itemId']} -> {carpma['points']:.2f}")
    if not cezalar["impacts"]:
        print("- yok")
    print(f"Toplam ceza: {cezalar['total']:.2f}")
    print(f"Oda Güvenlik Skoru: {sonuc['rawSafetyScore']:.2f} / 100 (ekranda {sonuc['safetyScore']})")
