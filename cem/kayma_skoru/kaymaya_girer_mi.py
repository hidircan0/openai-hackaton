"""Bir eşya tipinin kayma hesabına girip girmediğini söyler."""

from .esya_tipleri import KAYMA_DISI_TIPLER


def kaymaya_girer_mi(tip):
    """Tip kayma dışı listede değilse True döndürür. Tip önceden doğrulanmış olmalı."""
    return tip not in KAYMA_DISI_TIPLER
