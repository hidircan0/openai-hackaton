"""Eşyanın deprem sonrası gerçek merkezini (after.pose.position) okur."""

import numpy as np

from .sayi_dogrula import sayi_dogrula


def poz_merkezi_oku(sonra, etiket):
    """``after.pose.position`` varsa [x, y, z] dizisi, yoksa None döndürür.

    Fizik modunda gövde döndüğü için gerçek merkez kutu (AABB) merkezinden
    farklı olabilir; kural modunda ikisi aynıdır.
    """
    poz = sonra.get("pose")
    if poz is None:
        return None
    if not isinstance(poz, dict) or not isinstance(poz.get("position"), dict):
        raise ValueError(f"{etiket} after.pose.position bir sözlük olmalı: {{x, y, z}}.")

    konum = poz["position"]
    eksik = {"x", "y", "z"} - konum.keys()
    if eksik:
        raise ValueError(f"{etiket} after.pose.position içinde eksik alan(lar) var: {', '.join(sorted(eksik))}.")
    return np.array([sayi_dogrula(konum[eksen], f"{etiket} after.pose.position.{eksen}") for eksen in ("x", "y", "z")])
