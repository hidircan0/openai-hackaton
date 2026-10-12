"""Ömer'in backend'inin çağırdığı giriş fonksiyonu."""

import json

from .data_omer_oku import data_omer_oku
from .skor_hesapla import skor_hesapla


def kayma_skoru_hesapla(data_omer):
    """Ömer'in /api/analyze JSON'undan kayma skorunu hesaplar.

    Args:
        data_omer: Ömer'in yanıtı; sözlük ya da JSON metni (str / bytes).

    Returns:
        JSON'a çevrilebilir, Ömer'in JSON'uyla aynı adlarda sözlük:
        ``rawSafetyScore``, ``safetyScore``, ``items[].displacement``
        (``d``, ``volumeWeight``), ``items[].impact`` (``hit``, ``multiplier``,
        ``hitZones``) ve ``penalties`` (``alpha``, ``slidingIndex``,
        ``sliding``, ``impacts``, ``total``).

    Raises:
        ValueError: JSON bozuksa ya da gerekli alanlar eksik veya hatalıysa.

    Örnek:
        from kayma_skoru import kayma_skoru_hesapla
        sonuc = kayma_skoru_hesapla(istek_json)
    """
    if isinstance(data_omer, (str, bytes, bytearray)):
        try:
            data_omer = json.loads(data_omer)
        except json.JSONDecodeError as exc:
            raise ValueError(f"data_omer geçerli bir JSON değil: {exc}") from exc
    return skor_hesapla(data_omer_oku(data_omer))
