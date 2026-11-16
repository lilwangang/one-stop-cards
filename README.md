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
