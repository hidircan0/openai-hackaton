"""Kayma indeksinden kayma cezasını hesaplar."""

from .sayi_dogrula import sayi_dogrula


def kayma_cezasi_hesapla(kayma_indeksi, alfa):
    """kayma_cezasi = 100 × α × K. α, Ömer'in yanıtındaki ``penalties.alpha``."""
    alfa = sayi_dogrula(alfa, "Alfa katsayısı")
    if alfa < 0:
        raise ValueError("Alfa katsayısı negatif olamaz.")
    return 100.0 * alfa * kayma_indeksi
