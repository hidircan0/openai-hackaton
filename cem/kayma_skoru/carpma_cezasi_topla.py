"""Bölge çarpma cezalarını toplar."""

import numpy as np


def carpma_cezasi_topla(carpma_cezalari):
    """Tek bir ceza ya da ceza listesi alır, doğrular ve toplamını döndürür."""
    try:
        cezalar = np.asarray(carpma_cezalari, dtype=float)
    except (TypeError, ValueError) as exc:
        raise ValueError("Çarpma cezaları sayısal değerlerden oluşmalı.") from exc
    if not np.all(np.isfinite(cezalar)):
        raise ValueError("Çarpma cezaları sonlu olmalı.")
    if np.any(cezalar < 0):
        raise ValueError("Çarpma cezaları negatif olamaz.")

    toplam = float(np.sum(cezalar))
    if not np.isfinite(toplam):
        raise ValueError("Toplam çarpma cezası sonlu olmalı.")
    return toplam
