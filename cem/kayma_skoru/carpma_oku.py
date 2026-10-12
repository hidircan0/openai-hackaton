"""Bir eşyanın ya da yükün çarpma bilgisini (impact) okur."""

from .kacis_cezasi_oku import KACIS_BOLGESI


def carpma_oku(carpma, etiket, bolgeler):
    """``{hit, hitZones}`` alanını doğrular ve çarpılan bölge tiplerini döndürür.

    ``multiplier`` okunmaz; çarpanı ``carpan_hesapla`` hesaplar.

    Args:
        carpma: Eşyanın ya da yükün ``impact`` alanı.
        etiket: Hata mesajlarında eşyayı gösteren metin.
        bolgeler: ``bolgeleri_oku`` çıktısı; hitZones içindeki tipler burada olmalı.

    Returns:
        Çarpılan bölge tiplerinin listesi; çarpmadıysa boş liste.
    """
    if not isinstance(carpma, dict):
        raise ValueError(f"{etiket} impact bir sözlük olmalı: {{hit, hitZones}}.")

    eksik = {"hit", "hitZones"} - carpma.keys()
    if eksik:
        raise ValueError(f"{etiket} impact içinde eksik alan(lar) var: {', '.join(sorted(eksik))}.")

    carpti_mi = carpma["hit"]
    if not isinstance(carpti_mi, bool):
        raise ValueError(f"{etiket} impact.hit true ya da false olmalı.")

    degdigi_bolgeler = carpma["hitZones"]
    if not isinstance(degdigi_bolgeler, (list, tuple)):
        raise ValueError(f"{etiket} impact.hitZones bir liste olmalı.")

    if not carpti_mi:
        if degdigi_bolgeler:
            raise ValueError(f"{etiket} impact.hit false ama hitZones boş değil.")
        return []

    if not degdigi_bolgeler:
        raise ValueError(f"{etiket} impact.hit true ama hitZones boş.")
    for bolge in degdigi_bolgeler:
        if bolge == KACIS_BOLGESI:
            raise ValueError(f"{etiket} impact.hitZones içinde 'exit' olamaz; kaçış cezası R4 kaydından gelir.")
        if not isinstance(bolge, str) or bolge not in bolgeler:
            raise ValueError(f"{etiket} impact.hitZones içindeki {bolge!r} criticalZones tiplerinde yok.")
    return list(dict.fromkeys(degdigi_bolgeler))
