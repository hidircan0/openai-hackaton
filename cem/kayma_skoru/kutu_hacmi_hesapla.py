"""Eksenlere paralel bir kutunun hacmini hesaplar."""


def kutu_hacmi_hesapla(taban, yukseklik):
    """Taban alanı × yükseklik (cm³)."""
    return (taban["x2"] - taban["x1"]) * (taban["y2"] - taban["y1"]) * yukseklik
