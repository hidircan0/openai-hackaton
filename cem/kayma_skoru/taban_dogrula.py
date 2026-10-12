"""Kuşbakışı taban dikdörtgenini doğrular."""

from .sayi_dogrula import sayi_dogrula


def taban_dogrula(taban, etiket):
    """``{x1, y1, x2, y2}`` tabanını doğrular; x2 > x1 ve y2 > y1 olmalı."""
    if not isinstance(taban, dict):
        raise ValueError(f"{etiket} bir sözlük olmalı: {{x1, y1, x2, y2}}.")

    eksik = {"x1", "y1", "x2", "y2"} - taban.keys()
    if eksik:
        raise ValueError(f"{etiket} içinde eksik alan(lar) var: {', '.join(sorted(eksik))}.")

    dogrulanmis = {
        anahtar: sayi_dogrula(taban[anahtar], f"{etiket} {anahtar}")
        for anahtar in ("x1", "y1", "x2", "y2")
    }
    if dogrulanmis["x2"] <= dogrulanmis["x1"] or dogrulanmis["y2"] <= dogrulanmis["y1"]:
        raise ValueError(f"{etiket} için x2 > x1 ve y2 > y1 olmalı.")
    return dogrulanmis
