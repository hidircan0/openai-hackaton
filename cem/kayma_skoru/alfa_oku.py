"""Ömer'in yanıtından alfa katsayısını okur."""

from .sayi_dogrula import sayi_dogrula


def alfa_oku(cezalar):
    """``penalties.alpha`` değerini döndürür."""
    if not isinstance(cezalar, dict) or "alpha" not in cezalar:
        raise ValueError("penalties bir sözlük olmalı ve alpha içermeli.")
    return sayi_dogrula(cezalar["alpha"], "penalties.alpha")
