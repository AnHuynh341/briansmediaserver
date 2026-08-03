import json
from pathlib import Path

music_dir = Path("files")
tracks = []

for file in sorted(music_dir.glob("*.mp3")):
    tracks.append({
        "name": file.stem,
        "file": f"files/{file.name}"
    })

with open(music_dir / "tracks.json", "w", encoding="utf-8") as output_file:
    json.dump(tracks, output_file, indent=2, ensure_ascii=False)

print("tracks.json updated")
