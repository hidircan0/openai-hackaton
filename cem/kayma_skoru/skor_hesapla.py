"""Okunmuş veriden adımları sırayla çağırıp Oda Güvenlik Skorunu üretir."""

import math

from .agirlik_hesapla import agirlik_hesapla
from .carpma_cezalarini_hesapla import carpma_cezalarini_hesapla
from .carpma_cezasi_topla import carpma_cezasi_topla
from .kayma_cezasi_hesapla import kayma_cezasi_hesapla
from .kayma_hesapla import kayma_hesapla
from .kayma_indeksi_hesapla import kayma_indeksi_hesapla
from .oda_skoru_hesapla import oda_skoru_hesapla


def skor_hesapla(veri):
    """Skoru hesaplar.

    Args:
        veri: ``data_omer_oku`` çıktısı (``oda_boyutlari``, ``esyalar``,
            ``yukler``, ``bolgeler``, ``kacis_cezalari``, ``alfa``).

    Returns:
        Ömer'in JSON'uyla aynı adlarda sözlük: ``rawSafetyScore``,
        ``safetyScore``, ``items[].displacement`` (``d``, ``volumeWeight``),
        ``items[].impact`` (``hit``, ``multiplier``, ``hitZones``) ve
        ``penalties`` (``alpha``, ``slidingIndex``, ``sliding``, ``impacts``,
        ``total``). Kayma dışı eşyalar ``items`` listesinde yer almaz.
    """
    esyalar = veri["esyalar"]

    kaymalar = kayma_hesapla(
        [esya["t0_merkez"] for esya in esyalar],
        [esya["t1_merkez"] for esya in esyalar],
        veri["oda_boyutlari"],
    )
    agirliklar = agirlik_hesapla([esya["hacim"] for esya in esyalar])
    kayma_indeksi = kayma_indeksi_hesapla(agirliklar, kaymalar)
    kayma_cezasi = kayma_cezasi_hesapla(kayma_indeksi, veri["alfa"])
    carpmalar = carpma_cezalarini_hesapla(esyalar + veri["yukler"], veri["bolgeler"])
    # Bölge cezalarını biz hesaplarız; kaçış (R4) cezası Ömer'in genişlik kontrolünden gelir.
    etkiler = [
        {"zone": carpma["bolge"], "itemId": carpma["esya_id"], "points": carpma["puan"]}
        for carpma in carpmalar
    ] + veri["kacis_cezalari"]
    carpma_cezasi = carpma_cezasi_topla([etki["points"] for etki in etkiler])
    ham_oda_skoru = oda_skoru_hesapla(kayma_cezasi, carpma_cezasi)

    return {
        "rawSafetyScore": ham_oda_skoru,
        # Yarım yukarı yuvarlanır (61,5 -> 62); JavaScript'teki Math.round ile aynı.
        "safetyScore": int(math.floor(ham_oda_skoru + 0.5)),
        "items": [
            {
                "id": esya["id"],
                "type": esya["tip"],
                "displacement": {"d": float(kayma), "volumeWeight": float(agirlik)},
                # Çarpmayan eşyada multiplier null (Ömer'in JSON notu).
                "impact": {
                    "hit": bool(esya["carptigi_bolgeler"]),
                    "multiplier": esya["carpan"] if esya["carptigi_bolgeler"] else None,
                    "hitZones": esya["carptigi_bolgeler"],
                },
            }
            for esya, kayma, agirlik in zip(esyalar, kaymalar, agirliklar)
        ],
        "penalties": {
            "alpha": veri["alfa"],
            "slidingIndex": kayma_indeksi,
            "sliding": kayma_cezasi,
            "impacts": etkiler,
            "total": kayma_cezasi + carpma_cezasi,
        },
    }
