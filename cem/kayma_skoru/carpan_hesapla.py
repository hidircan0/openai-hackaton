"""Bir eşyanın çarpma çarpanını yüksekliğinden ve tipinden hesaplar."""

from .esya_tipleri import CAM_TIPLERI

# (alt sınır cm, çarpan): yükseklik alt sınıra eşit ya da büyükse o çarpan geçerli.
YUKSEKLIK_CARPANLARI = ((180.0, 1.0), (120.0, 0.7), (0.0, 0.4))
CAM_KATSAYISI = 1.3


def carpan_hesapla(yukseklik, tip):
    """h ≥ 180 → 1,0 · 120 ≤ h < 180 → 0,7 · h < 120 → 0,4; cam / ayna ise × 1,3.

    Args:
        yukseklik: Eşyanın deprem öncesi yüksekliği (cm, pozitif).
        tip: ``esya_tipleri.py`` listesindeki tip adı.
    """
    for alt_sinir, carpan in YUKSEKLIK_CARPANLARI:
        if yukseklik >= alt_sinir:
            break
    if tip in CAM_TIPLERI:
        carpan *= CAM_KATSAYISI
    return carpan
