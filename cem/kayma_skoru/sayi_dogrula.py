"""Bir değerin sonlu bir sayı olduğunu doğrular."""

import numpy as np


def sayi_dogrula(deger, etiket):
    """Değeri float'a çevirir; sayı değilse ya da sonlu değilse hata verir."""
    if isinstance(deger, bool):
        raise ValueError(f"{etiket} sayısal olmalı.")
    try:
        sayi = float(deger)
    except (TypeError, ValueError) as exc:
        raise ValueError(f"{etiket} sayısal olmalı.") from exc
    if not np.isfinite(sayi):
        raise ValueError(f"{etiket} sonlu olmalı.")
    return sayi
