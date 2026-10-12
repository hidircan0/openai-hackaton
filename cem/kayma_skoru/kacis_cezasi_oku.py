"""Ömer'in yanıtından kaçış yolu (R4) cezasını okur."""

from .sayi_dogrula import sayi_dogrula

KACIS_BOLGESI = "exit"


def kacis_cezasi_oku(etkiler):
    """``penalties.impacts`` içindeki kaçış kaydını döndürür.

    Kaçış cezası bir çarpma değil, Ömer'in genişlik kontrolüdür (R4): kapı
    koridorunda kalan açık genişlik < 60 cm ise ``zone: "exit"``, ``rule: "R4"``
    kaydı yazılır. Diğer kayıtları (bed, work_area) biz hesapladığımız için okumayız.

    Returns:
        ``[{"zone", "itemId", "points", "rule"}]``; kaçış yolu açıksa boş liste.
    """
    if not isinstance(etkiler, (list, tuple)):
        raise ValueError("penalties.impacts bir liste olmalı.")

    kacis = []
    for sira, etki in enumerate(etkiler, start=1):
        if not isinstance(etki, dict):
            raise ValueError(f"penalties.impacts içindeki {sira}. kayıt bir sözlük olmalı.")
        if etki.get("rule") != "R4" and etki.get("zone") != KACIS_BOLGESI:
            continue

        if "points" not in etki:
            raise ValueError(f"penalties.impacts içindeki {sira}. kaçış kaydında points olmalı.")
        puan = sayi_dogrula(etki["points"], f"penalties.impacts {sira}. points")
        if puan < 0:
            raise ValueError(f"penalties.impacts {sira}. points negatif olamaz.")
        kacis.append({"zone": KACIS_BOLGESI, "itemId": etki.get("itemId"), "points": puan, "rule": "R4"})

    if len(kacis) > 1:
        raise ValueError("penalties.impacts içinde birden fazla kaçış (R4) kaydı var; kaçış en fazla bir kez cezalanır.")
    return kacis
