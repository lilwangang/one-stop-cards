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
