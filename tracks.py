import json
from pathlib import Path

music_dir = Path("files")

tracks = []

for file in sorted(music_dir.glob("*.mp3")):
    tracks.append({
        "name": file.stem,
        "file": f"files/{file.name}"
    })

with open(music_dir / "tracks.json", "w") as f:
    json.dump(tracks, f, indent=2)

print("tracks.json updated")
