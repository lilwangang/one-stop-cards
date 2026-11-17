#!/bin/sh
# Builds src/70-remote-engine.src.js: the remote-control engine used by the
# One Stop - Remote card.
#
# The engine is Universal Remote Card by Nerwyn
# (https://github.com/Nerwyn/universal-remote-card, Apache License 2.0, see
# LICENSE in this folder). Changes made here, all applied by patch.py:
#   - every custom element tag is renamed (os-remote-*, os-*-keyboard) so the
#     engine can sit next to an installed copy of the original card
#   - the original visual editor is left out (One Stop ships its own)
#   - the card class is exported on window.__oneStopRemoteEngine instead of
#     being registered as a card
set -eu
PIN=7e43a0f            # upstream v4.12.5
HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$HERE/../.." && pwd)
WORK=${TMPDIR:-/tmp}/one-stop-remote-engine
rm -rf "$WORK"
git clone -q https://github.com/Nerwyn/universal-remote-card.git "$WORK"
cd "$WORK"
git checkout -q "$PIN"
python3 "$HERE/patch.py" "$WORK"
npm install --no-audit --no-fund --ignore-scripts >/dev/null
npx rspack >/dev/null
{
  printf '/*! One Stop - Remote card engine. Based on Universal Remote Card v4.12.5 by Nerwyn\n'
  printf ' *  (https://github.com/Nerwyn/universal-remote-card), Apache License 2.0. Modified by One Stop Smart Homes:\n'
  printf ' *  element tags renamed, original editor removed, card class exported. See vendor/remote-engine. */\n'
  cat dist/universal-remote-card.min.js
  printf '\n;\n'
} > "$ROOT/src/70-remote-engine.src.js"
ls -l "$ROOT/src/70-remote-engine.src.js"
