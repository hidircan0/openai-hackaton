"""Ömer'in yanıtındaki bir kutuyu (before / after) okur."""

from .sayi_dogrula import sayi_dogrula
from .taban_dogrula import taban_dogrula


def omer_kutusu_oku(kutu, etiket):
    """``{footprint, bottomZ, topZ}`` kutusunu ``(taban, alt_z, ust_z)`` olarak döndürür."""
    if not isinstance(kutu, dict):
        raise ValueError(f"{etiket} bir sözlük olmalı: {{footprint, bottomZ, topZ}}.")

    eksik = {"footprint", "bottomZ", "topZ"} - kutu.keys()
    if eksik:
        raise ValueError(f"{etiket} içinde eksik alan(lar) var: {', '.join(sorted(eksik))}.")

    taban = taban_dogrula(kutu["footprint"], f"{etiket} footprint")
    alt_z = sayi_dogrula(kutu["bottomZ"], f"{etiket} bottomZ")
    ust_z = sayi_dogrula(kutu["topZ"], f"{etiket} topZ")
    if ust_z < alt_z:
        raise ValueError(f"{etiket} topZ, bottomZ'den küçük olamaz.")
    return taban, alt_z, ust_z
