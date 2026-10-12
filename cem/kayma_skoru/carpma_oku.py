"""Bir eşyanın çarpma bilgisini (impact) okur."""


def carpma_oku(carpma, etiket, bolgeler):
    """``{hit, hitZones}`` alanını doğrular ve çarpılan bölge id'lerini döndürür.

    ``multiplier`` okunmaz; çarpanı ``carpan_hesapla`` hesaplar.

    Args:
        carpma: Eşyanın ``impact`` alanı.
        etiket: Hata mesajlarında eşyayı gösteren metin.
        bolgeler: ``bolgeleri_oku`` çıktısı; hitZones içindeki id'ler burada olmalı.

    Returns:
        Çarpılan bölge id'lerinin listesi; eşya çarpmadıysa boş liste.
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
    for bolge_id in degdigi_bolgeler:
        if not isinstance(bolge_id, str) or bolge_id not in bolgeler:
            raise ValueError(f"{etiket} impact.hitZones içindeki {bolge_id!r} criticalZones içinde yok.")
    return list(dict.fromkeys(degdigi_bolgeler))
