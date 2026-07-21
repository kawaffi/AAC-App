"""
Cerca ogni parola su ARASAAC, scarica il primo pittogramma trovato
e arricchisce data/pictograms.json con id e percorso locale dell'immagine.

Uso:
    python3 scripts/download_pictograms.py
"""
import json
import time
import urllib.request
import urllib.error
import urllib.parse
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
DATA_FILE = PROJECT_ROOT / "frontend" / "pictograms.json"
IMAGES_DIR = PROJECT_ROOT / "frontend" / "assets" / "pictograms"

SEARCH_URL = "https://api.arasaac.org/api/pictograms/{locale}/search/{query}"
IMAGE_URL = "https://static.arasaac.org/pictograms/{id}/{id}_500.png"


def search_pictogram(query: str, locale: str = "it"):
    url = SEARCH_URL.format(locale=locale, query=urllib.parse.quote(query))
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            results = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        if e.code == 404:
            results = []
        else:
            raise
    if not results and locale != "es":
        return search_pictogram(query, locale="es")  # fallback allo spagnolo
    return results[0] if results else None


def download_image(picto_id: int) -> str:
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{picto_id}.png"
    dest = IMAGES_DIR / filename
    if not dest.exists():
        url = IMAGE_URL.format(id=picto_id)
        urllib.request.urlretrieve(url, dest)
    return f"assets/pictograms/{filename}"


def main():
    items = json.loads(DATA_FILE.read_text(encoding="utf-8"))

    for item in items:
        if "id" in item:
            continue  # già processato in una run precedente
        result = search_pictogram(item["search"])
        if not result:
            print(f"Nessun risultato per '{item['label']}' ({item['search']})")
            continue
        picto_id = result["_id"]
        item["id"] = picto_id
        item["image"] = download_image(picto_id)
        time.sleep(0.3)  # gentile con l'API

    DATA_FILE.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()