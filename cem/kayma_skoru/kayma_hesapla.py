"""Eşya başına normalize kaymayı (d_i) hesaplar."""

import numpy as np


def kayma_hesapla(t0_merkezler, t1_merkezler, oda_boyutlari):
    """Her eşya için 0-1 arası kayma değeri döndürür.

    dx = |x0 − x1| / Lx, dy = |y0 − y1| / Ly, dz = |z0 − z1| / Lz
    d_i = √(dx² + dy² + dz²) / √3
    """
    t0 = np.asarray(t0_merkezler, dtype=float)
    t1 = np.asarray(t1_merkezler, dtype=float)

    # Konum farklarını her eksende oda boyutuna göre normalize et.
    normalize_farklar = np.abs(t1 - t0) / np.asarray(oda_boyutlari, dtype=float)
    # Öklid uzaklığını 0-1 aralığına ölçekle ve sınırla.
    kaymalar = np.linalg.norm(normalize_farklar, axis=1) / np.sqrt(3.0)
    return np.clip(kaymalar, 0.0, 1.0)
