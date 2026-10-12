"""Eşya tipinin ortak listede olduğunu doğrular."""

from .esya_tipleri import ESYA_TIPLERI


def tip_dogrula(tip, etiket):
    """Tip ``esya_tipleri.py`` listesinde birebir yoksa hata verir."""
    if not isinstance(tip, str) or tip not in ESYA_TIPLERI:
        raise ValueError(
            f"{etiket} tipi bilinmiyor: {tip!r}. Geçerli tipler: {', '.join(sorted(ESYA_TIPLERI))}."
        )
    return tip
