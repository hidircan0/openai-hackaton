"""Ömer'in /api/analyze yanıtını skor hesabına hazırlar."""

from .alfa_oku import alfa_oku
from .bolgeleri_oku import bolgeleri_oku
from .carpan_hesapla import carpan_hesapla
from .carpma_oku import carpma_oku
from .kaymaya_girer_mi import kaymaya_girer_mi
from .kutu_hacmi_hesapla import kutu_hacmi_hesapla
from .kutu_merkezi_hesapla import kutu_merkezi_hesapla
from .oda_boyutlari_al import oda_boyutlari_al
from .omer_kutusu_oku import omer_kutusu_oku
from .tip_dogrula import tip_dogrula


def data_omer_oku(data_omer):
    """Ömer'in yanıtından oda boyutlarını, eşyaları, bölgeleri ve alfayı çıkarır.

    Kullanılan alanlar (``omer/ornek-analyze-response.json``; birim cm):
        room.dimensions: widthCm, depthCm, heightCm
        items[]: id, type, before, after ({footprint, bottomZ, topZ}),
                 impact ({hit, hitZones}; multiplier okunmaz, biz hesaplarız)
        criticalZones[]: id, penaltyPoints
        penalties.alpha

    Returns:
        ``{"oda_boyutlari", "esyalar", "bolgeler", "alfa"}``. Her eşyada ``id``,
        ``tip``, ``hacim``, ``t0_merkez``, ``t1_merkez``, ``carpan`` ve
        ``carptigi_bolgeler`` bulunur. Kayma dışı tipler (``esya_tipleri.py``)
        listeye alınmaz.
    """
    if not isinstance(data_omer, dict):
        raise ValueError("data_omer bir sözlük olmalı: {room, items, criticalZones, penalties, ...}.")

    eksik = {"room", "items", "criticalZones", "penalties"} - data_omer.keys()
    if eksik:
        raise ValueError(f"data_omer içinde eksik alan(lar) var: {', '.join(sorted(eksik))}.")

    oda = data_omer["room"]
    if not isinstance(oda, dict):
        raise ValueError("room bir sözlük olmalı: {dimensions, ...}.")
    oda_boyutlari = oda_boyutlari_al(oda.get("dimensions"))
    bolgeler = bolgeleri_oku(data_omer["criticalZones"])

    ham_esyalar = data_omer["items"]
    if not isinstance(ham_esyalar, (list, tuple)):
        raise ValueError("items bir liste olmalı.")

    esyalar = []
    for sira, esya in enumerate(ham_esyalar, start=1):
        if not isinstance(esya, dict):
            raise ValueError(f"{sira}. eşya bir sözlük olmalı.")

        eksik = {"id", "type", "before", "after", "impact"} - esya.keys()
        if eksik:
            raise ValueError(f"{sira}. eşyada eksik alan(lar) var: {', '.join(sorted(eksik))}.")

        esya_id = esya["id"]
        if not isinstance(esya_id, str) or not esya_id.strip():
            raise ValueError(f"{sira}. eşyanın id'si boş olmayan bir metin olmalı.")

        etiket = f"'{esya_id}'"
        tip = tip_dogrula(esya["type"], etiket)
        if not kaymaya_girer_mi(tip):
            continue

        ilk_kutu = omer_kutusu_oku(esya["before"], f"{etiket} before")
        son_kutu = omer_kutusu_oku(esya["after"], f"{etiket} after")

        taban, alt_z, ust_z = ilk_kutu
        if ust_z <= alt_z:
            raise ValueError(f"{etiket} before yüksekliği (topZ - bottomZ) pozitif olmalı.")

        esyalar.append({
            "id": esya_id,
            "tip": tip,
            "hacim": kutu_hacmi_hesapla(taban, ust_z - alt_z),
            "t0_merkez": kutu_merkezi_hesapla(*ilk_kutu),
            "t1_merkez": kutu_merkezi_hesapla(*son_kutu),
            "carpan": carpan_hesapla(ust_z - alt_z, tip),
            "carptigi_bolgeler": carpma_oku(esya["impact"], etiket, bolgeler),
        })

    if not esyalar:
        raise ValueError("Kayma hesabına girecek en az bir eşya olmalı.")

    return {
        "oda_boyutlari": oda_boyutlari,
        "esyalar": esyalar,
        "bolgeler": bolgeler,
        "alfa": alfa_oku(data_omer["penalties"]),
    }
