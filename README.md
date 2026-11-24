# One Stop Cards

Dashboard cards by **One Stop Smart Homes**. Every card works on its own (no other add-ons needed) and every option is set from the visual card editor, in plain words.

## Cards

### One Stop - Room Lights card
A room's lights in one card:

- **On / Off** buttons
- **Brightness** slider that follows your finger
- Four **white light** buttons (Candlelight → Daylight) and a **colour** button
- The card **glows the colour of the lights** that are on
- Tap the card to see **every light in the room** in a pop-up
- Finds the room's lights automatically from the room (Area) they're assigned to

Options in the editor include: which lights the On button controls, adding or leaving out lights, what to show, card spacing and corners, title size and colour, background when off, glow strength, button size/shape/colours/words/icons, white light choices, and what tap and press-and-hold do.

### One Stop - Shades card
A room's shades with six layouts to choose from — three compact (Slim bar, Swipe card, Tile) and three for tablets (Window, Control panel, Shade columns):

- Drag to set the position, plus **Close / Stop / Open** and quick **25 / 50 / 75%** buttons
- A slider for **each shade** in the room
- Room **temperature and humidity**
- **Open and close times** read straight from your automations (time and sunrise/sunset)
- Finds the room's shades automatically; **Master edit** changes every Shades card at once

### One Stop - Thermostat card
Room temperature, what it's doing ("Heating to 21°"), mode buttons, set temperature (single or Heat + Cool range), fan (buttons, slider or list) and presets. The card glows orange while heating and blue while cooling. Lots of options in the visual editor, plus Master edit.

### One Stop - Plex card
A full Plex page for a room's TV: Now Playing with controls, Continue Watching, Recently Added movies and TV, and every library with search, sort and show → season → episode browsing. Tap a title for Resume / Start over / Next episode on that room's Apple TV. Uses the included `one_stop_plex_play` script pattern (see the card editor's "Which TV plays it").

### One Stop - Streaming card
Browse and search Netflix, Disney+, Prime Video, Crave, Apple TV, Paramount+ and Hayu, filtered by country and plan so every title shown is one the home can watch (catalogue data from JustWatch). Tap a title to open it on the room's Apple TV, or open the app. YouTube, CBC Gem and TELUS TV+ open the app directly. Open a service directly with `?service=netflix` on the page URL.

For reliable loading on phones and remote access, add this to `configuration.yaml` and restart. The card then fetches the catalogue through Home Assistant instead of the browser, which JustWatch often refuses:

```yaml
rest_command:
  justwatch_graphql:
    url: "https://apis.justwatch.com/graphql"
    method: post
    content_type: "application/json"
    headers:
      Origin: "http://localhost:8123"
    payload: "{{ body }}"
    timeout: 20
```

### One Stop - Media Player card
One tidy player for any media player (TV, Apple TV, speaker): artwork with a blurred backdrop, now playing, play/pause/skip, progress, volume and mute, power, and a row of source/app buttons. Everything is set from the visual editor; show or hide each part and choose which sources appear.

```yaml
type: custom:one-stop-media-player-card
entity: media_player.living_room_apple_tv
color: blue
```

### One Stop - Music card
A Sonos / Apple Music style player for Music Assistant speakers. Big artwork with a blurred backdrop, scrubber, shuffle/repeat and volume; a "Play on" sheet to switch rooms, group speakers and set each room's volume; and your library (recently played, playlists, favourite songs) with search. Tap anything to play it on the current room.

```yaml
type: custom:one-stop-music-card
players:
  - media_player.living_room_music_assistant
  - entity: media_player.kitchen_music_assistant
    name: Kitchen
```

### One Stop - Remote card
A remote control for TVs, streaming boxes, receivers and anything else in Home Assistant: buttons, arrow pad, touchpad, round pad, sliders, number pad, app shortcuts and your own buttons.

The editor is built to be used without reading a manual:

- **Device** - pick the kind of device (Android TV, Apple TV, Samsung, LG webOS, Roku, Fire TV, Sony BRAVIA, Kodi, Philips, Denon, Yamaha, Jellyfin, Unfolded Circle, Unified Remote, or any infrared / RF blaster) and its remote and media player.
- **Buttons** - your remote shown row by row. Tap **+** to add from a searchable list, tap a button to change, move or remove it.
- Each button has **How it looks** (words, icon, size, colour, "light up while something is on") and **What it does** for tap, press-and-hold and double-tap, chosen in plain words: press a remote button, open an app, turn something on or off, do something in Home Assistant, go to a page, type on the TV, and more.
- **Look** - button size, style, corners, spacing and accent colour for the whole remote.
- Everything advanced is still there under **Advanced**: momentary (held-down) actions, two-finger and drag gestures, timings, keyboard shortcuts, templates, custom icons, custom CSS and raw YAML.

Already using Universal Remote Card? Change the card's type to `custom:one-stop-remote-card` and the same settings carry over.

The remote engine inside this card is [Universal Remote Card](https://github.com/Nerwyn/universal-remote-card) by Nerwyn, used under the Apache License 2.0 (see `vendor/remote-engine`). One Stop adds the look and the visual editor.

## Install

### HACS (recommended)
1. Open **HACS**.
2. Menu (⋮) → **Custom repositories**.
3. Repository: `https://github.com/lilwangang/one-stop-cards` · Type: **Dashboard** → **Add**.
4. Search **One Stop Cards** → **Download**.
5. Refresh your browser.

### Manual
1. Download `one-stop-cards.js` from the latest [release](https://github.com/lilwangang/one-stop-cards/releases).
2. Copy it to `/config/www/one-stop-cards.js`.
3. **Settings → Dashboards → ⋮ → Resources → Add**: `/local/one-stop-cards.js`, type **JavaScript module**.

## Use
Edit a dashboard → **Add card** → search **One Stop** → pick a card → choose the room. Everything else is optional.

Minimal YAML, if you prefer:

```yaml
type: custom:one-stop-room-lights-card
area: kitchen
```

## Support
Built and maintained by One Stop Smart Homes, Edmonton, Alberta.
