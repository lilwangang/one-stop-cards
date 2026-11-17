#!/usr/bin/env python3
"""Apply the One Stop changes to a checkout of Universal Remote Card (see build.sh)."""
import pathlib, re, sys

work = pathlib.Path(sys.argv[1])
src = work / 'src'

# 1. Rename every custom element tag. Import paths (./remote-button) and CSS
#    variables (--remote-dialog-...) are left alone.
TAGS = re.compile(
    r"(?<![\w-])(?<![.\w]/)"
    r"(remote-(?:button|slider|touchpad|circlepad|dialog|icon-label)"
    r"|(?:apple-tv|unified-remote|kodi|samsung-tv|roku|android-tv|webos|adb)-keyboard)(?![\w-]*\.ts)\b")
for f in src.rglob('*.ts'):
    if f.name == 'universal-remote-card-editor.ts':
        continue
    text = f.read_text()
    lines = []
    for line in text.split('\n'):
        if not re.match(r"\s*import\b", line) and ' from ' not in line:
            line = TAGS.sub(lambda m: 'os-' + m.group(1), line)
        lines.append(line)
    f.write_text('\n'.join(lines))

# 2. Card file: no original editor, no registration, export the class instead.
card = src / 'universal-remote-card.ts'
t = card.read_text()

def must(old, new, count=1):
    global t
    if old not in t:
        raise SystemExit('patch target missing: ' + old[:60])
    t = t.replace(old, new, count)

must("import { UniversalRemoteCardEditor } from './universal-remote-card-editor';\n", '')
must("document.createElement('universal-remote-card-editor')", "document.createElement('one-stop-remote-card-editor')")
must("type: 'custom:universal-remote-card'", "type: 'custom:one-stop-remote-card'")
start = t.index('console.info(')
end = t.index('class UniversalRemoteCard')
t = t[:start] + t[end:]
start = t.index("customElements.define(\n\t'universal-remote-card-editor'")
end = t.index('if (!window.structuredClone)')
t = t[:start] + '''(window as any).__oneStopRemoteEngine = {
	Card: UniversalRemoteCard,
	getDefaultActions,
	platforms,
	Platforms,
	PlatformConfig,
	defaultIcons,
	version: packageInfo.version,
};

''' + t[end:]
must("import { platforms } from './models/maps/platforms';",
     "import { platforms } from './models/maps/platforms';\nimport { defaultIcons } from './models/maps';\nimport { Platforms } from './models/interfaces';\nimport { PlatformConfig } from './models/platforms';")
card.write_text(t)
(src / 'universal-remote-card-editor.ts').unlink()
print('patched', work)
