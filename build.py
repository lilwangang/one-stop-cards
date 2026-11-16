#!/usr/bin/env python3
"""Build dist/one-stop-cards.js from src/*.src.js (fills in shared assets)."""
import json, pathlib
root = pathlib.Path(__file__).resolve().parent
pictures = json.loads((root / 'assets/pictures.json').read_text())
parts = []
for f in sorted((root / 'src').glob('*.src.js')):
    parts.append(f.read_text().replace('__PICTURES__', json.dumps(pictures)))
(root / 'dist').mkdir(exist_ok=True)
(root / 'dist/one-stop-cards.js').write_text('\n'.join(parts))
print('built', (root / 'dist/one-stop-cards.js').stat().st_size, 'bytes')
