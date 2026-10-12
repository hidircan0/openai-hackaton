"""Ömer'in yanıtındaki kritik bölgeleri okur."""

from .sayi_dogrula import sayi_dogrula


def bolgeleri_oku(kritik_bolgeler):
    """``criticalZones`` listesini ``{bolge_tipi: ceza_puani}`` sözlüğü olarak döndürür.

    hitZones bölge tipini tuttuğu için aynı tipten birden fazla bölge tek bölge
    sayılır; ceza puanları farklıysa hata verir. Sözlük JSON'daki sırayı korur.
    """
    if not isinstance(kritik_bolgeler, (list, tuple)):
        raise ValueError("criticalZones bir liste olmalı.")

    bolgeler = {}
    for sira, bolge in enumerate(kritik_bolgeler, start=1):
        if not isinstance(bolge, dict):
            raise ValueError(f"criticalZones içindeki {sira}. bölge bir sözlük olmalı.")

        eksik = {"type", "penaltyPoints"} - bolge.keys()
        if eksik:
            raise ValueError(f"criticalZones içindeki {sira}. bölgede eksik alan(lar) var: {', '.join(sorted(eksik))}.")

        tip = bolge["type"]
        if not isinstance(tip, str) or not tip.strip():
            raise ValueError(f"criticalZones içindeki {sira}. bölgenin tipi boş olmayan bir metin olmalı.")

        ceza_puani = sayi_dogrula(bolge["penaltyPoints"], f"'{tip}' bölgesi penaltyPoints")
        if ceza_puani < 0:
            raise ValueError(f"'{tip}' bölgesi penaltyPoints negatif olamaz.")
        if tip in bolgeler and bolgeler[tip] != ceza_puani:
            raise ValueError(
                f"'{tip}' tipindeki bölgelerin penaltyPoints değerleri farklı ({bolgeler[tip]:g} ve {ceza_puani:g})."
            )
        bolgeler[tip] = ceza_puani
    return bolgeler
