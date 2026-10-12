"""Sarsıntı kayma skoru: ana giriş dosyası.

Ömer'in /api/analyze yanıtını okur, skoru adım adım kendimiz hesaplarız ve her
adımı Ömer'in yanıttaki değeriyle yan yana yazarız. Her adım ``kayma_skoru/``
klasöründe ayrı bir dosyadadır:

1. data_omer_oku          Ömer'in yanıtını okur, kayma dışı eşyaları ayıklar
2. kayma_hesapla          eşya başına d
3. agirlik_hesapla        eşya başına hacim ağırlığı
4. kayma_indeksi_hesapla  K = Σ (agirlik × d)
5. kayma_cezasi_hesapla   100 × α × K
6. carpan_hesapla             eşya çarpanı (yükseklik ve cam / ayna tipinden)
   carpma_cezalarini_hesapla  bölge başına ceza = bölge puanı × en büyük çarpan
   carpma_cezasi_topla        bölge cezalarının toplamı
7. oda_skoru_hesapla      clamp(100 − kayma − çarpma, 0, 100)

Ömer'in backend'i aynı hesabı tek çağrıyla yapar:
``from kayma_skoru import kayma_skoru_hesapla``.

Çalıştırma:
    python "cem/sarsıntı kayma skoru.py"                 (Ömer'in örnek yanıtı)
    python "cem/sarsıntı kayma skoru.py" yanit.json      (başka bir yanıt)
"""

import json
import sys
from pathlib import Path

from kayma_skoru import kayma_skoru_hesapla
from kayma_skoru.agirlik_hesapla import agirlik_hesapla
from kayma_skoru.carpma_cezalarini_hesapla import carpma_cezalarini_hesapla
from kayma_skoru.carpma_cezasi_topla import carpma_cezasi_topla
from kayma_skoru.data_omer_oku import data_omer_oku
from kayma_skoru.kayma_cezasi_hesapla import kayma_cezasi_hesapla
from kayma_skoru.kayma_hesapla import kayma_hesapla
from kayma_skoru.kayma_indeksi_hesapla import kayma_indeksi_hesapla
from kayma_skoru.oda_skoru_hesapla import oda_skoru_hesapla

KLASOR = Path(__file__).resolve().parent

# Varsayılan girdi: Ömer'in kabul testi odası için attığı örnek yanıt.
ORNEK_YANIT = KLASOR.parent / "omer" / "ornek-analyze-response.json"


if __name__ == "__main__":
    yanit_yolu = Path(sys.argv[1]) if len(sys.argv) > 1 else ORNEK_YANIT
    # utf-8-sig: Windows'ta (ör. PowerShell Out-File) dosya başına eklenen BOM'u atlar.
    data_omer = json.loads(yanit_yolu.read_text(encoding="utf-8-sig"))

    print(f"1. Ömer'in yanıtı okunuyor: {yanit_yolu.name}")
    veri = data_omer_oku(data_omer)
    esyalar = veri["esyalar"]
    lx, ly, lz = veri["oda_boyutlari"]
    print(f"   Oda: {lx:.0f} x {ly:.0f} x {lz:.0f} cm")
    print(f"   Kaymaya giren eşyalar: {', '.join(esya['id'] for esya in esyalar)}")

    # Ömer'in kendi hesapladığı değerler; köşeli parantez içinde karşılaştırma için.
    omer_kaymalari = {esya["id"]: esya.get("displacement") or {} for esya in data_omer["items"]}
    omer_cezalari = data_omer["penalties"]

    print("2. Eşya başına kayma (d)   [Ömer]")
    kaymalar = kayma_hesapla(
        [esya["t0_merkez"] for esya in esyalar],
        [esya["t1_merkez"] for esya in esyalar],
        veri["oda_boyutlari"],
    )
    for esya, kayma in zip(esyalar, kaymalar):
        print(f"   {esya['id']}: {kayma:.4f}   [{omer_kaymalari[esya['id']].get('d')}]")

    print("3. Hacim ağırlıkları (agirlik)   [Ömer]")
    agirliklar = agirlik_hesapla([esya["hacim"] for esya in esyalar])
    for esya, agirlik in zip(esyalar, agirliklar):
        print(f"   {esya['id']}: {agirlik:.4f}   [{omer_kaymalari[esya['id']].get('volumeWeight')}]")

    kayma_indeksi = kayma_indeksi_hesapla(agirliklar, kaymalar)
    print(f"4. Kayma indeksi K: {kayma_indeksi:.4f}   [{omer_cezalari.get('slidingIndex')}]")

    kayma_cezasi = kayma_cezasi_hesapla(kayma_indeksi, veri["alfa"])
    print(f"5. Kayma cezası (alfa = {veri['alfa']:g}): {kayma_cezasi:.2f}   [{omer_cezalari.get('sliding')}]")

    print("6. Çarpanlar (yükseklik ve tipten; yalnızca çarpan eşyalar)   [Ömer]")
    omer_esya_carpmalari = {esya["id"]: esya.get("impact") or {} for esya in data_omer["items"]}
    for esya in esyalar:
        if esya["carptigi_bolgeler"]:
            print(
                f"   {esya['id']}: {esya['carpan']:.2f} -> {', '.join(esya['carptigi_bolgeler'])}"
                f"   [{omer_esya_carpmalari[esya['id']].get('multiplier')}]"
            )
    print("   Çarpma cezaları (bölge: eşya -> puan)   [Ömer]")
    omer_carpmalari = {carpma.get("zone"): carpma for carpma in omer_cezalari.get("impacts") or []}
    carpmalar = carpma_cezalarini_hesapla(esyalar, veri["bolgeler"])
    for carpma in carpmalar:
        omer = omer_carpmalari.get(carpma["bolge_id"], {})
        print(
            f"   {carpma['bolge_id']}: {carpma['esya_id']} -> {carpma['puan']:.2f}"
            f"   [{omer.get('itemId')} -> {omer.get('points')}]"
        )
    if not carpmalar:
        print("   Çarpma yok.")
    carpma_cezasi = carpma_cezasi_topla([carpma["puan"] for carpma in carpmalar])
    print(f"   Toplam çarpma cezası: {carpma_cezasi:.2f}")

    oda_skoru = oda_skoru_hesapla(kayma_cezasi, carpma_cezasi)
    print(f"7. Oda Güvenlik Skoru: {oda_skoru:.2f} / 100   [{data_omer.get('rawSafetyScore')}]")

    # Adım adım hesap ile Ömer'in çağıracağı fonksiyon aynı skoru vermeli.
    tek_cagri = kayma_skoru_hesapla(data_omer)
    if abs(tek_cagri["rawSafetyScore"] - oda_skoru) > 1e-9:
        sys.exit(f"Tutarsızlık: kayma_skoru_hesapla {tek_cagri['rawSafetyScore']:.2f} verdi.")

    # Bizim skorumuz Ömer'in skoruyla (2 basamağa yuvarlanmış) uyuşmalı.
    omer_skoru = data_omer.get("rawSafetyScore")
    if omer_skoru is None:
        print("   Ömer'in yanıtında rawSafetyScore yok; karşılaştırılamadı.")
    elif abs(oda_skoru - omer_skoru) > 0.01:
        sys.exit(f"Uyuşmazlık: biz {oda_skoru:.2f}, Ömer {omer_skoru} hesapladı.")
    else:
        print(f"   Ömer'in skoruyla aynı (ekranda {tek_cagri['safetyScore']}).")
