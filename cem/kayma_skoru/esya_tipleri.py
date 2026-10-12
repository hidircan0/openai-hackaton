"""Ömer'le ortak eşya tipi listesi.

JSON'daki ``type`` değerleri buradaki adlarla birebir aynı olmalı. Yeni bir tip
eklenecekse önce buraya eklenir; Ömer de aynı adı kullanır.
"""

# tip adı: Türkçe karşılığı
ESYA_TIPLERI = {
    "bookcase": "kitaplık",
    "wardrobe": "gardırop",
    "cabinet": "dolap",
    "shelf": "raf",
    "tv": "TV",
    "mirror": "ayna",
    "glass": "cam",
    "desk": "masa",
    "chair": "sandalye",
    "sofa": "kanepe",
    "refrigerator": "buzdolabı",
    "stack": "istif",
    "bed": "yatak",
    "door": "kapı",
    "cable": "kablo",
    "extinguisher": "söndürücü",
}

# Kayma hesabına girmeyen tipler.
KAYMA_DISI_TIPLER = {"bed", "door", "cable", "extinguisher"}

# Çarpanı cam katsayısıyla artırılan tipler (cam / ayna).
CAM_TIPLERI = {"mirror", "glass"}
