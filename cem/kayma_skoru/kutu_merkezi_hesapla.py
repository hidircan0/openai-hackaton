"""Eksenlere paralel bir kutunun geometrik merkezini hesaplar."""

import numpy as np


def kutu_merkezi_hesapla(taban, z_alt, z_ust):
    """Doğrulanmış taban ve z aralığından [x, y, z] merkezini döndürür."""
    return np.array([
        (taban["x1"] + taban["x2"]) / 2.0,
        (taban["y1"] + taban["y2"]) / 2.0,
        (z_alt + z_ust) / 2.0,
    ])
