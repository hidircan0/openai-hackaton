"""Eşya başına hacim ağırlığını (w_i) hesaplar."""

import numpy as np


def agirlik_hesapla(hacimler):
    """w_i = hacim_i / toplam hacim. Büyük eşyalar kayma indeksini daha çok etkiler."""
    hacimler = np.asarray(hacimler, dtype=float)
    toplam_hacim = float(np.sum(hacimler))
    if not np.isfinite(toplam_hacim) or toplam_hacim <= 0:
        raise ValueError("Eşyaların toplam hacmi sıfırdan büyük ve sonlu olmalı.")
    return hacimler / toplam_hacim
