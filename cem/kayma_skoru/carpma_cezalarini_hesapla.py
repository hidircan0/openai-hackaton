"""Bölge çarpma cezalarını eşyaların ve yüklerin çarpma bilgisinden hesaplar."""


def carpma_cezalarini_hesapla(carpanlar, bolgeler):
    """Her bölge tipi en fazla bir kez cezalanır.

    O bölgeye çarpan eşya ve yüklerden çarpanı en büyük olan seçilir (eşitlikte
    listede önce gelen); puan = bölgenin ceza puanı × çarpan. Kaçış (exit)
    burada yoktur; o ceza R4 kaydından gelir.

    Args:
        carpanlar: ``data_omer_oku`` eşyaları ve yükleri (``id``, ``carpan``,
            ``carptigi_bolgeler``).
        bolgeler: ``{bolge_tipi: ceza_puani}``.

    Returns:
        ``[{"bolge", "esya_id", "puan"}]``; bölgeler JSON'daki sırayla.
    """
    carpmalar = []
    for bolge, ceza_puani in bolgeler.items():
        en_agir = None
        for carpan in carpanlar:
            if bolge not in carpan["carptigi_bolgeler"]:
                continue
            if en_agir is None or carpan["carpan"] > en_agir["carpan"]:
                en_agir = carpan

        if en_agir is not None:
            carpmalar.append({
                "bolge": bolge,
                "esya_id": en_agir["id"],
                "puan": ceza_puani * en_agir["carpan"],
            })
    return carpmalar
