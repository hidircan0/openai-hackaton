"""Bölge çarpma cezalarını eşyaların çarpma bilgisinden hesaplar."""


def carpma_cezalarini_hesapla(esyalar, bolgeler):
    """Her bölge en fazla bir kez cezalanır.

    O bölgeye çarpan eşyalardan çarpanı en büyük olan seçilir (eşitlikte
    listede önce gelen); puan = bölgenin ceza puanı × çarpan.

    Args:
        esyalar: ``data_omer_oku`` eşyaları (``id``, ``carpan``, ``carptigi_bolgeler``).
        bolgeler: ``{bolge_id: ceza_puani}``.

    Returns:
        ``[{"bolge_id", "esya_id", "puan"}]``; bölgeler JSON'daki sırayla.
    """
    carpmalar = []
    for bolge_id, ceza_puani in bolgeler.items():
        en_agir = None
        for esya in esyalar:
            if bolge_id not in esya["carptigi_bolgeler"]:
                continue
            if en_agir is None or esya["carpan"] > en_agir["carpan"]:
                en_agir = esya

        if en_agir is not None:
            carpmalar.append({
                "bolge_id": bolge_id,
                "esya_id": en_agir["id"],
                "puan": ceza_puani * en_agir["carpan"],
            })
    return carpmalar
