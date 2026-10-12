"""Odanın kayma indeksini (K) hesaplar."""

import numpy as np


def kayma_indeksi_hesapla(agirliklar, kaymalar):
    """K = Σ (w_i × d_i)."""
    return float(np.sum(np.asarray(agirliklar, dtype=float) * np.asarray(kaymalar, dtype=float)))
