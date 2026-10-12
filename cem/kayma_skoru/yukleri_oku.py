"""Ömer'in yanıtındaki düşen yükleri (loads) okur."""

from .carpan_hesapla import YUK_CARPANI
from .carpma_oku import carpma_oku


def yukleri_oku(yukler, bolgeler):
    """``loads`` listesini çarpma hesabına hazırlar.

    Yükler kayma indeksine girmez; yalnızca bir bölgeye çarptıklarında
    ``YUK_CARPANI`` ile ceza yazdırırlar.

    Returns:
        ``[{"id", "carpan", "carptigi_bolgeler"}]``.
    """
    if not isinstance(yukler, (list, tuple)):
        raise ValueError("loads bir liste olmalı.")

    okunan = []
    for sira, yuk in enumerate(yukler, start=1):
        if not isinstance(yuk, dict):
            raise ValueError(f"loads içindeki {sira}. yük bir sözlük olmalı.")

        eksik = {"id", "impact"} - yuk.keys()
        if eksik:
            raise ValueError(f"loads içindeki {sira}. yükte eksik alan(lar) var: {', '.join(sorted(eksik))}.")

        yuk_id = yuk["id"]
        if not isinstance(yuk_id, str) or not yuk_id.strip():
            raise ValueError(f"loads içindeki {sira}. yükün id'si boş olmayan bir metin olmalı.")

        okunan.append({
            "id": yuk_id,
            "carpan": YUK_CARPANI,
            "carptigi_bolgeler": carpma_oku(yuk["impact"], f"'{yuk_id}' yükü", bolgeler),
        })
    return okunan
