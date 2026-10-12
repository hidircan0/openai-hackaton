"""Cezalardan Oda Güvenlik Skorunu hesaplar."""

import numpy as np


def oda_skoru_hesapla(kayma_cezasi, carpma_cezasi):
    """odaSkoru = clamp(100 − kayma_cezasi − çarpma_cezasi, 0, 100)."""
    return float(np.clip(100.0 - kayma_cezasi - carpma_cezasi, 0.0, 100.0))
