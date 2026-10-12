"""Oda boyutlarını [Lx, Ly, Lz] dizisi olarak çıkarır."""

import numpy as np

from .sayi_dogrula import sayi_dogrula

ANAHTARLAR = ("widthCm", "depthCm", "heightCm")


def oda_boyutlari_al(boyutlar):
    """``room.dimensions`` sözlüğünü doğrular ve [genişlik, derinlik, yükseklik] dizisi döndürür."""
    if not isinstance(boyutlar, dict):
        raise ValueError("room.dimensions bir sözlük olmalı: {widthCm, depthCm, heightCm}.")

    eksik = set(ANAHTARLAR) - boyutlar.keys()
    if eksik:
        raise ValueError(f"room.dimensions içinde eksik alan(lar) var: {', '.join(sorted(eksik))}.")

    dizi = np.array([sayi_dogrula(boyutlar[anahtar], f"room.dimensions.{anahtar}") for anahtar in ANAHTARLAR])
    if np.any(dizi <= 0):
        raise ValueError("Oda boyutlarının tümü pozitif olmalı.")
    return dizi
