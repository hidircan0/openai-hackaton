"""Ömer'in yanıtındaki kritik bölgeleri okur."""

from .sayi_dogrula import sayi_dogrula


def bolgeleri_oku(kritik_bolgeler):
    """``criticalZones`` listesini ``{bolge_id: ceza_puani}`` sözlüğü olarak döndürür.

    Sözlük JSON'daki sırayı korur; çarpma cezaları bu sırayla listelenir.
    """
    if not isinstance(kritik_bolgeler, (list, tuple)):
        raise ValueError("criticalZones bir liste olmalı.")

    bolgeler = {}
    for sira, bolge in enumerate(kritik_bolgeler, start=1):
        if not isinstance(bolge, dict):
            raise ValueError(f"criticalZones içindeki {sira}. bölge bir sözlük olmalı.")

        eksik = {"id", "penaltyPoints"} - bolge.keys()
        if eksik:
            raise ValueError(f"criticalZones içindeki {sira}. bölgede eksik alan(lar) var: {', '.join(sorted(eksik))}.")

        bolge_id = bolge["id"]
        if not isinstance(bolge_id, str) or not bolge_id.strip():
            raise ValueError(f"criticalZones içindeki {sira}. bölgenin id'si boş olmayan bir metin olmalı.")
        if bolge_id in bolgeler:
            raise ValueError(f"'{bolge_id}' bölgesi criticalZones içinde birden fazla kez var.")

        ceza_puani = sayi_dogrula(bolge["penaltyPoints"], f"'{bolge_id}' penaltyPoints")
        if ceza_puani < 0:
            raise ValueError(f"'{bolge_id}' penaltyPoints negatif olamaz.")
        bolgeler[bolge_id] = ceza_puani
    return bolgeler
