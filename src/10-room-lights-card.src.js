/*!
 * One Stop – Room Lights card
 * One Stop Smart Homes · standalone Home Assistant dashboard card (no other add-ons needed)
 * Everything is set from the visual card editor.
 */
(() => {
'use strict';
const VERSION = '1.4.0';
const TAG = 'one-stop-room-lights-card';
const EDITOR_TAG = TAG + '-editor';
const POPUP_TAG = 'one-stop-room-lights-popup';
const PICTURES = __PICTURES__;
const PICTURE_NAMES = { auto: 'Match the room', kitchen: 'Kitchen', bedroom: 'Bedroom', bathroom: 'Bathroom', living_room: 'Living room', office: 'Office / computer room', hallway: 'Hallway', staircase: 'Staircase', outside: 'Outside / porch', laundry: 'Laundry room', none: 'No picture' };
const ICON_GUESS = [[/kitchen/,'mdi:stove'],[/bed/,'mdi:bed-king-outline'],[/bath|wash|powder|ensuite/,'mdi:shower'],[/living|family|lounge|great/,'mdi:sofa-outline'],[/office|computer|study|den/,'mdi:monitor-dashboard'],[/hall|entry|foyer/,'mdi:door-open'],[/stair/,'mdi:stairs'],[/out|porch|yard|garden|patio|deck|front|back/,'mdi:tree-outline'],[/laundry|utility|mud/,'mdi:washing-machine'],[/garage/,'mdi:garage'],[/dining/,'mdi:silverware-fork-knife'],[/basement/,'mdi:home-floor-b'],[/kid|nursery|play/,'mdi:teddy-bear']];
const PIC_GUESS = [[/kitchen/,'kitchen'],[/bed|nursery|kid/,'bedroom'],[/bath|wash|powder|ensuite/,'bathroom'],[/living|family|lounge|great|basement/,'living_room'],[/office|computer|study|den/,'office'],[/hall|entry|foyer/,'hallway'],[/stair/,'staircase'],[/out|porch|yard|garden|patio|deck|front|back|garage/,'outside'],[/laundry|utility|mud/,'laundry']];

const DEFAULTS = {
  picture: 'auto', tap: 'popup', hold: 'none',
  show_picture: true, show_icon: true, show_status: false, show_buttons: true, show_brightness: true, show_brightness_words: true, show_presets: true, show_wheel: true,
  button_position: 'auto', card_spacing: 'standard', corners: 'rounded', title_size: 'medium', font: 'classic', animations: true, haptics: true,
  off_background: 'theme', on_glow: 'normal', follow_light_colour: true, icon_color: 'lights', icon_background: true,
  button_size: 'large', button_shape: 'rounded', button_style: 'tinted', button_content: 'icon_words', button_text_size: 'medium', button_tint: 'soft',
  on_color: [35, 145, 86], off_color: [178, 52, 64], on_text: 'On', off_text: 'Off',
  on_icon: 'mdi:lightbulb-on', off_icon: 'mdi:lightbulb-off-outline',
  slider_style: 'bubble', slider_size: 'standard', slider_colour: 'lights',
  chip_shape: 'circle', chip_size: 'medium',
  preset_1: '2000', preset_2: '3500', preset_3: '5000', preset_4: '6500', colour_count: '0',
  picture_size: 'medium', picture_on_phones: false,
  wake_brightness: 50,
  no_master: 'all', rule_on: 'master', on_brightness: 'keep', on_brightness_pct: 100, on_white: 'keep',
  rule_off: 'all', rule_slider: 'on', rule_colour: 'on', rule_active: 'any',
  title_color: [247, 249, 252], hover_color: [184, 184, 184], off_custom_color: [40, 44, 52], icon_custom_color: [255, 196, 120],
  slider_custom_color: [255, 179, 107], colour_1: [255, 64, 64], colour_2: [64, 120, 255], colour_3: [180, 80, 255],
};
const PRESETS = { '2000': ['Candlelight', '#ff890e'], '2700': ['Warm white', '#ffa957'], '3000': ['Soft white', '#ffb46b'], '3500': ['Soft white', '#ffc18d'], '4000': ['Neutral white', '#ffd1a3'], '5000': ['Cool white', '#ffe4ce'], '6500': ['Daylight', '#fffefa'] };
const COLOUR_MODES = ['hs', 'xy', 'rgb', 'rgbw', 'rgbww'];
const NEUTRAL = [184, 184, 184];

/* ---------------- helpers ---------------- */
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const okRgb = v => Array.isArray(v) && v.length === 3 && v.every(n => Number.isFinite(+n));
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const titleCase = s => String(s || '').replace(/_/g, ' ').replace(/\b\w/g, m => m.toUpperCase());
const live = st => st && !['unavailable', 'unknown'].includes(st.state);
const isOn = st => st && st.state === 'on';
const modesOf = st => st?.attributes?.supported_color_modes || [];
const dimmable = st => { const m = modesOf(st); return m.length ? m.some(x => x !== 'onoff') : st?.attributes?.brightness != null; };
const supportsTemp = st => modesOf(st).includes('color_temp') || st?.attributes?.min_color_temp_kelvin != null;
const supportsColour = st => modesOf(st).some(m => COLOUR_MODES.includes(m));
const isGroup = st => Array.isArray(st?.attributes?.entity_id);
function kelvinToRgb(k) {
  const t = Math.max(1000, Math.min(40000, k)) / 100; let r, g, b;
  if (t <= 66) { r = 255; g = 99.47 * Math.log(t) - 161.12; b = t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04; }
  else { r = 329.7 * Math.pow(t - 60, -0.1332); g = 288.12 * Math.pow(t - 60, -0.0755); b = 255; }
  return [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))));
}
function hsToRgb(h, s) {
  s /= 100; const f = n => { const k = (n + h / 60) % 6; return Math.round(255 * (1 - s * Math.max(0, Math.min(k, 4 - k, 1)))); };
  return [f(5), f(3), f(1)];
}
function lightRgb(st) {
  const a = st.attributes || {};
  if (a.color_mode === 'color_temp' && a.color_temp_kelvin) return kelvinToRgb(a.color_temp_kelvin);
  if (Array.isArray(a.rgb_color)) return a.rgb_color;
  if (Array.isArray(a.hs_color)) return hsToRgb(a.hs_color[0], a.hs_color[1]);
  if (a.color_temp_kelvin) return kelvinToRgb(a.color_temp_kelvin);
  return [255, 196, 120];
}

/* Find the room's lights from Home Assistant's own Area assignments. */
function roomLights(hass, cfg) {
  const out = new Set();
  const ents = hass.entities || {}, devs = hass.devices || {};
  const hide = new Set(cfg.hide_lights || []);
  if (cfg.area) for (const [id, e] of Object.entries(ents)) {
    if (!id.startsWith('light.')) continue;
    if (e.entity_category || /_segment_\d+$/.test(id)) continue;
    const area = e.area_id || devs[e.device_id]?.area_id;
    if (area !== cfg.area) continue;
    const st = hass.states[id];
    if (!st || isGroup(st)) continue;
    out.add(id);
  }
  for (const id of cfg.extra_lights || []) if (hass.states[id]) out.add(id);
  for (const id of hide) out.delete(id);
  return [...out].sort((a, b) => (hass.states[a]?.attributes?.friendly_name || a).localeCompare(hass.states[b]?.attributes?.friendly_name || b));
}
/* Master lights: what turns on when the room is off. */
function masterLights(hass, cfg, members) {
  const picked = cfg.master_lights?.length ? cfg.master_lights : cfg.on_lights?.length ? cfg.on_lights : null;
  if (picked) return picked.filter(id => hass.states[id]);
  return cfg.no_master === 'hide' ? [] : members;
}
const onTargets = (hass, cfg, members) => masterLights(hass, cfg, members).filter(id => live(hass.states[id]));
const dimmableAll = (hass, ids) => ids.every(id => dimmable(hass.states[id]) || isGroup(hass.states[id]));
const ruleSet = (hass, cfg, members, rule) => (rule === 'master' ? masterLights(hass, cfg, members) : members).filter(id => live(hass.states[id]));


/* ---------------- shared house style (master edit) ----------------
 * Stored once per Home Assistant in a hidden dashboard, so every Room Lights card
 * (on any dashboard) follows it. Card-level settings still win. */
const STYLE_DASH = 'one-stop-cards';
const ROOM_KEYS = ['type', 'area', 'name', 'room_icon', 'master_lights', 'on_lights', 'extra_lights', 'hide_lights', 'picture', 'picture_url', 'picture_caption', 'tap', 'tap_page', 'hold', 'hold_page', 'hover_color'];
const Shared = {
  data: null, loading: null, listeners: new Set(), subscribed: false,
  get(hass) {
    if (this.data) return Promise.resolve(this.data);
    if (!this.loading) this.loading = this._fetch(hass).then(d => { this.data = d; this._subscribe(hass); return d; });
    return this.loading;
  },
  async _fetch(hass) {
    try { const cfg = await hass.callWS({ type: 'lovelace/config', url_path: STYLE_DASH, force: true }); return cfg?.one_stop || {}; }
    catch (e) { return {}; }
  },
  _subscribe(hass) {
    if (this.subscribed || !hass?.connection) return; this.subscribed = true;
    hass.connection.subscribeEvents(async ev => {
      if (ev?.data?.url_path !== STYLE_DASH) return;
      this.data = await this._fetch(hass); this.listeners.forEach(fn => fn(this.data));
    }, 'lovelace_updated').catch(() => {});
  },
  async save(hass, section, values) {
    const list = await hass.callWS({ type: 'lovelace/dashboards/list' });
    if (!list.some(d => d.url_path === STYLE_DASH))
      await hass.callWS({ type: 'lovelace/dashboards/create', url_path: STYLE_DASH, title: 'One Stop Cards', icon: 'mdi:palette-swatch-outline', show_in_sidebar: false, require_admin: false, mode: 'storage' });
    let cfg; try { cfg = await hass.callWS({ type: 'lovelace/config', url_path: STYLE_DASH, force: true }); } catch (e) { cfg = null; }
    cfg = cfg && cfg.views ? cfg : { views: [{ title: 'One Stop Cards', cards: [{ type: 'markdown', content: '## One Stop Cards\nShared styles for One Stop cards live here. Change them from any card’s editor with **Master edit** turned on.' }] }] };
    cfg.one_stop = { ...(cfg.one_stop || {}), [section]: values };
    await hass.callWS({ type: 'lovelace/config/save', url_path: STYLE_DASH, config: cfg });
    this.data = cfg.one_stop; this.listeners.forEach(fn => fn(this.data));
  },
};

/* ---------------- styles ---------------- */
const CARD_CSS = `
:host{display:block;--osl-rgb:184,184,184}
ha-card{position:relative;overflow:hidden;padding:var(--osl-pad,18px);border-radius:var(--osl-radius,22px);box-sizing:border-box;container:osl/inline-size;
  background:linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.015)),var(--osl-off-bg);
  border:1px solid rgba(255,255,255,.12);box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 10px 24px rgba(0,0,0,.10);
  backdrop-filter:blur(18px) saturate(1.1);-webkit-backdrop-filter:blur(18px) saturate(1.1);color:#f7f9fc;cursor:pointer;
  -webkit-tap-highlight-color:transparent;user-select:none;font-family:var(--osl-font)}
ha-card.on{background:linear-gradient(145deg,rgba(255,255,255,.16),rgba(255,255,255,.035) 48%,rgba(255,255,255,.075)),
  linear-gradient(rgba(var(--osl-rgb),var(--osl-glow-a,.25)),rgba(var(--osl-rgb),var(--osl-glow-b,.12))),rgba(28,28,28,.62);
  border-color:rgba(var(--osl-rgb),var(--osl-glow-border,.34));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.25),inset 0 -1px 0 rgba(255,255,255,.04),0 8px 24px rgba(0,0,0,.16);
  backdrop-filter:blur(12px) saturate(1.15);-webkit-backdrop-filter:blur(12px) saturate(1.15)}
.wrap{display:grid;grid-template-columns:auto minmax(0,1fr) auto;grid-template-areas:"i n p" "art art art" "m m m";column-gap:12px;row-gap:12px;align-items:center}
.wrap.noicon{grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"n p" "art art" "m m"}
.icon{grid-area:i;width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:var(--osl-icon-bg,rgba(var(--osl-rgb),.10))}
.icon ha-icon{--mdc-icon-size:34px;color:var(--osl-icon-color,rgb(var(--osl-rgb)))}
ha-card.on.anim .icon ha-icon{animation:osl-breathe 3.2s ease-in-out infinite}
.head{grid-area:n;min-width:0;display:flex;flex-direction:column;gap:2px}
.name{font-weight:650;letter-spacing:-.4px;font-size:var(--osl-title,21px);line-height:1.2;color:var(--osl-title-color,#f7f9fc);overflow-wrap:anywhere}
.status{font-size:14px;line-height:18px;color:rgba(235,241,248,.78)}
.power{grid-area:p;display:flex;gap:8px;justify-content:flex-end}
.pbtn{all:unset;box-sizing:border-box;cursor:pointer;flex:0 0 auto;width:var(--osl-btn,80px);height:var(--osl-btn,80px);border-radius:var(--osl-btn-radius,14px);
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font-weight:650;font-size:var(--osl-btn-text,14px);line-height:1.25;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.1);transition:transform .12s ease,filter .12s ease;background:var(--b-bg);border:var(--b-border);color:var(--b-fg)}
.pbtn ha-icon{--mdc-icon-size:calc(var(--osl-btn,80px) * .42);color:var(--b-fg)}
.pbtn.icononly ha-icon{--mdc-icon-size:calc(var(--osl-btn,80px) * .5)} .pbtn.wordsonly{font-size:calc(var(--osl-btn-text,14px) * 1.25)}
.pbtn:active{transform:scale(.96)} .pbtn:focus-visible{outline:2px solid #fff;outline-offset:2px}
.pbtn.on{--b-bg:var(--osl-on-bg);--b-border:var(--osl-on-border);--b-fg:var(--osl-on-fg,#f7f9fc)}
.pbtn.off{--b-bg:var(--osl-off-btn-bg);--b-border:var(--osl-off-border);--b-fg:var(--osl-off-fg,#f7f9fc)}
.pbtn[disabled]{opacity:.45;cursor:default}
.wrap.below{grid-template-columns:auto minmax(0,1fr);grid-template-areas:"i n" "p p" "art art" "m m"}
.wrap.below.noicon{grid-template-columns:minmax(0,1fr);grid-template-areas:"n" "p" "art" "m"}
.wrap.below .pbtn{flex:1 1 0;height:min(var(--osl-btn,80px),76px)}
.art{grid-area:art;height:var(--osl-art-h,112px);border-radius:15px;overflow:hidden;pointer-events:none;--room-accent:rgb(var(--osl-rgb));--art-light:rgba(var(--osl-rgb),.95);--art-line:rgba(var(--osl-rgb),.7)}
ha-card.on .art{background:rgba(var(--osl-rgb),.06)} ha-card.on.anim .art .art-lights{animation:osl-art 3.6s ease-in-out infinite}
.art svg{display:block;width:100%;height:100%} .art img{display:block;width:100%;height:100%;object-fit:cover}
.master{grid-area:m;display:grid;grid-template-columns:repeat(var(--osl-chips,5),minmax(0,1fr));row-gap:10px;cursor:default}
.dim{grid-column:1/-1;display:flex;flex-direction:column;gap:2px}
.dimhead{display:flex;align-items:baseline;gap:7px;font-weight:600;font-size:16px;line-height:20px;color:#eef3fa}
.dimhead output{font-weight:650}
input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:var(--sl-h,56px);margin:0;background:transparent;cursor:pointer;touch-action:pan-y}
input[type=range]::-webkit-slider-runnable-track{height:var(--sl-t,12px);border-radius:999px;background:linear-gradient(90deg,var(--sl-c) var(--pct,0%),rgba(255,255,255,.16) var(--pct,0%))}
input[type=range]::-moz-range-track{height:var(--sl-t,12px);border-radius:999px;background:rgba(255,255,255,.16)}
input[type=range]::-moz-range-progress{height:var(--sl-t,12px);border-radius:999px;background:var(--sl-c)}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:var(--sl-th,32px);height:var(--sl-th,32px);border-radius:50%;margin-top:calc((var(--sl-t,12px) - var(--sl-th,32px)) / 2);background:var(--sl-c);border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)}
input[type=range]::-moz-range-thumb{width:calc(var(--sl-th,32px) - 6px);height:calc(var(--sl-th,32px) - 6px);border-radius:50%;background:var(--sl-c);border:3px solid #fff}
input[type=range]:disabled{opacity:.45;cursor:default}
.dim.bubble{position:relative;display:block;height:var(--sl-bh,56px);border-radius:var(--sl-br,18px);overflow:hidden;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.10);box-shadow:inset 0 1px 0 rgba(255,255,255,.05)}
.dim.bubble .bfill{position:absolute;inset:0 auto 0 0;width:var(--pct,0%);background:var(--sl-c);opacity:.55;border-radius:inherit;transition:width .12s ease-out}
.dim.bubble .blabel{position:absolute;inset:0;display:flex;align-items:center;gap:10px;padding:0 18px;pointer-events:none;font-weight:600;font-size:16px;color:#f7f9fc;text-shadow:0 1px 2px rgba(0,0,0,.35)}
.dim.bubble .blabel ha-icon{--mdc-icon-size:24px}
.dim.bubble .blabel .bpct{margin-left:auto;font-weight:650}
.dim.bubble input[type=range]{position:absolute;inset:0;width:100%;height:100%;opacity:0;margin:0;cursor:ew-resize}
.dim.bubble.nowords .btext{display:none}
.dim.bubble:has(input:disabled){opacity:.45}
.chip{all:unset;box-sizing:border-box;justify-self:center;width:calc(var(--chip,40px) + 20px);max-width:100%;height:calc(var(--chip,40px) + 20px);border-radius:var(--chip-r,50%);display:flex;align-items:center;justify-content:center;cursor:pointer}
.chip span{width:var(--chip,40px);height:var(--chip,40px);border-radius:var(--chip-r,50%);box-shadow:0 0 0 1px rgba(255,255,255,.18),0 2px 6px rgba(0,0,0,.25)}
.chip:focus-visible{outline:2px solid #fff}
.chip.wheel span{background:conic-gradient(red,#ff0,lime,cyan,blue,#f0f,red)}
.chip:active{transform:scale(.95)} .chip[disabled]{opacity:.4;cursor:default}
.msg{grid-column:1/-1;font-size:13px;line-height:17px;color:#ffd7d7;min-height:0}
.msg:empty{display:none}
@media (hover:hover) and (pointer:fine){ha-card:hover{border-color:var(--osl-hover,rgba(var(--osl-rgb),.7))}}
@media (max-width:767px){.art:not(.phones){display:none}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
@media (prefers-reduced-transparency:reduce){ha-card{backdrop-filter:none;-webkit-backdrop-filter:none;background:rgb(48,48,48)}}
@keyframes osl-breathe{0%,100%{transform:scale(1);opacity:.84}50%{transform:scale(1.055);opacity:1}}
@keyframes osl-art{0%,100%{opacity:.82}50%{opacity:1}}
.hide{display:none!important}
`;

/* ---------------- the card ---------------- */
class OneStopRoomLightsCard extends HTMLElement {
  static getConfigElement() { return document.createElement(EDITOR_TAG); }
  static getStubConfig(hass) {
    const areas = Object.values(hass?.areas || {});
    const a = areas.find(x => /kitchen/i.test(x.name)) || areas[0];
    return a ? { area: a.area_id } : {};
  }
  setConfig(config) {
    if (!config) throw new Error('Invalid configuration');
    this._raw = { ...config };
    this._merge();
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._built = false;
    if (this._hass) this._render();
  }
  _merge() { this._cfg = { ...DEFAULTS, ...((Shared.data || {}).room_lights || {}), ...this._raw }; }
  connectedCallback() {
    this._onShared = () => { this._merge(); this._built = false; if (this._hass) this._render(); };
    Shared.listeners.add(this._onShared);
  }
  set hass(hass) {
    const first = !this._hass; this._hass = hass;
    if (first && !Shared.data) Shared.get(hass).then(() => this._onShared?.());
    if (!this._built) this._render(); else this._update(); this._popup?.update(hass);
  }
  get hass() { return this._hass; }
  getCardSize() { return 6; }
  getGridOptions() { return { columns: 12, rows: 'auto', min_columns: 6 }; }

  _areaName() { const a = this._hass?.areas?.[this._cfg.area]; return a?.name || titleCase(this._cfg.area); }
  _icon() {
    if (this._cfg.room_icon) return this._cfg.room_icon;
    const a = this._hass?.areas?.[this._cfg.area]; if (a?.icon) return a.icon;
    const key = (this._cfg.area + ' ' + (a?.name || '')).toLowerCase();
    return (ICON_GUESS.find(([re]) => re.test(key)) || [, 'mdi:lightbulb-group'])[1];
  }
  _picture() {
    let k = this._cfg.picture;
    if (k === 'auto') { const key = (this._cfg.area + ' ' + this._areaName()).toLowerCase(); k = (PIC_GUESS.find(([re]) => re.test(key)) || [, 'living_room'])[1]; }
    let svg = PICTURES[k] || '';
    if (svg && this._cfg.picture_caption != null) svg = svg.replace(/(<text[^>]*>)[^<]*(<\/text>)/, `$1${esc(this._cfg.picture_caption)}$2`);
    return svg;
  }

  _render() {
    const c = this._cfg, R = this.shadowRoot;
    if (!c.area) { R.innerHTML = `<ha-card style="padding:16px">Pick a room in the card editor.</ha-card>`; return; }
    const pick = (map, key, dflt) => map[key] ?? map[dflt];
    const padPx = pick({ compact: 12, standard: 18, roomy: 24 }, c.card_spacing, 'standard');
    const radius = pick({ square: '8px', rounded: '22px', extra_round: '32px' }, c.corners, 'rounded');
    const title = pick({ small: '17px', medium: '21px', large: '24px', extra_large: '28px' }, c.title_size, 'medium');
    const btnPx = pick({ small: 56, medium: 68, large: 80, extra_large: 96 }, c.button_size, 'large');
    const bRad = pick({ square: '6px', rounded: '14px', extra_round: '50%' }, c.button_shape, 'rounded');
    const bText = pick({ small: '12px', medium: '14px', large: '17px' }, c.button_text_size, 'medium');
    const tint = pick({ very_soft: [.28, .30], soft: [.44, .46], medium: [.60, .62], bold: [.80, .82] }, c.button_tint, 'soft');
    const glow = pick({ subtle: [.13, .06, .2], normal: [.25, .12, .34], strong: [.42, .24, .5] }, c.on_glow, 'normal');
    const font = pick({ classic: 'Arial,Helvetica,sans-serif', theme: 'var(--ha-font-family-body,var(--paper-font-body1_-_font-family,Roboto,sans-serif))', rounded: "ui-rounded,'SF Pro Rounded','Nunito','Varela Round',system-ui,sans-serif" }, c.font, 'classic');
    const slider = pick({ thin: [44, 6, 22], standard: [56, 12, 32], thick: [64, 20, 40] }, c.slider_size, 'standard');
    const bubbleH = pick({ thin: 46, standard: 58, thick: 72 }, c.slider_size, 'standard');
    const chip = pick({ small: '32px', medium: '40px', large: '48px' }, c.chip_size, 'medium');
    const artH = pick({ small: '84px', medium: '112px', large: '150px' }, c.picture_size, 'medium');
    const onC = okRgb(c.on_color) ? c.on_color : DEFAULTS.on_color, offC = okRgb(c.off_color) ? c.off_color : DEFAULTS.off_color;
    const lift = (col, n) => col.map(v => Math.min(255, v + n));
    const btnLook = (col, a) => ({
      tinted: [rgba(col, a), `1px solid ${rgba(lift(col, 60), .7)}`, '#f7f9fc'],
      solid: [rgba(col, 1), `1px solid ${rgba(lift(col, 40), .9)}`, '#ffffff'],
      outline: ['transparent', `2px solid ${rgba(lift(col, 70), .95)}`, rgba(lift(col, 90), 1)],
      glass: ['rgba(255,255,255,.08)', '1px solid rgba(255,255,255,.2)', rgba(lift(col, 90), 1)],
    }[c.button_style] || null);
    const onLook = btnLook(onC, tint[0]) || btnLook(onC, tint[0]), offLook = btnLook(offC, tint[1]);
    const offBg = { theme: 'var(--bubble-button-main-background-color,var(--bubble-main-background-color,var(--background-color-2,var(--ha-card-background,var(--card-background-color,var(--secondary-background-color))))))', darker: 'rgba(14,16,21,.88)', lighter: 'rgba(84,90,102,.72)', custom: okRgb(c.off_custom_color) ? rgba(c.off_custom_color, .82) : 'var(--secondary-background-color)' }[c.off_background] || 'var(--secondary-background-color)';
    const vars = [`--osl-pad:${padPx}px`, `--osl-radius:${radius}`, `--osl-title:${title}`, `--osl-btn:${btnPx}px`, `--osl-btn-radius:${bRad}`, `--osl-btn-text:${bText}`, `--osl-font:${font}`,
      `--osl-on-bg:${onLook[0]}`, `--osl-on-border:${onLook[1]}`, `--osl-on-fg:${onLook[2]}`,
      `--osl-off-btn-bg:${offLook[0]}`, `--osl-off-border:${offLook[1]}`, `--osl-off-fg:${offLook[2]}`,
      `--osl-glow-a:${glow[0]}`, `--osl-glow-b:${glow[1]}`, `--osl-glow-border:${glow[2]}`, `--osl-off-bg:${offBg}`,
      `--sl-h:${slider[0]}px`, `--sl-bh:${bubbleH}px`, `--sl-br:${c.corners === 'square' ? '8px' : c.corners === 'extra_round' ? '999px' : '18px'}`, `--sl-t:${slider[1]}px`, `--sl-th:${slider[2]}px`,
      `--sl-c:${c.slider_colour === 'custom' && okRgb(c.slider_custom_color) ? rgba(c.slider_custom_color, 1) : c.slider_colour === 'white' ? '#f2f5f9' : 'rgba(var(--osl-rgb),.95)'}`,
      `--chip:${chip}`, `--chip-r:${c.chip_shape === 'rounded' ? '30%' : '50%'}`, `--osl-art-h:${artH}`];
    if (okRgb(c.title_color) && !same(c.title_color, DEFAULTS.title_color)) vars.push(`--osl-title-color:${rgba(c.title_color, 1)}`);
    if (okRgb(c.hover_color) && !same(c.hover_color, DEFAULTS.hover_color)) vars.push(`--osl-hover:${rgba(c.hover_color, .8)}`);
    if (c.icon_color === 'custom' && okRgb(c.icon_custom_color)) vars.push(`--osl-icon-color:${rgba(c.icon_custom_color, 1)}`, `--osl-icon-bg:${rgba(c.icon_custom_color, .12)}`);
    else if (c.icon_color === 'white') vars.push('--osl-icon-color:#f7f9fc', '--osl-icon-bg:rgba(255,255,255,.08)');
    if (!c.icon_background) vars.push('--osl-icon-bg:transparent');
    // chips: white buttons, colour buttons, colour wheel
    const whites = c.show_presets ? [c.preset_1, c.preset_2, c.preset_3, c.preset_4].map(k => String(k)).filter(k => k && k !== 'none') : [];
    const colours = c.show_presets ? [c.colour_1, c.colour_2, c.colour_3].slice(0, Math.max(0, Math.min(3, +c.colour_count || 0))).filter(okRgb) : [];
    const chipCount = whites.length + colours.length + (c.show_wheel ? 1 : 0);
    vars.push(`--osl-chips:${Math.max(1, chipCount)}`);
    // where the On/Off buttons go: beside the title, or underneath when the card is narrow
    const iconW = c.show_icon ? 44 + 12 : 0;
    const needed = iconW + 150 + 12 + btnPx * 2 + 8;   // container width is measured inside the padding
    const belowCss = c.button_position === 'auto' ? `@container osl (max-width:${needed}px){.wrap{grid-template-columns:auto minmax(0,1fr);grid-template-areas:"i n" "p p" "art art" "m m"}.wrap.noicon{grid-template-columns:minmax(0,1fr);grid-template-areas:"n" "p" "art" "m"}.wrap .pbtn{flex:1 1 0;height:min(var(--osl-btn,80px),76px)}}` : '';
    const content = c.button_content || 'icon_words';
    const btnInner = (icon, text) => `${content !== 'words' ? `<ha-icon icon="${esc(icon)}"></ha-icon>` : ''}${content !== 'icon' ? `<span>${esc(text)}</span>` : ''}`;
    const btnCls = content === 'icon' ? 'icononly' : content === 'words' ? 'wordsonly' : '';
    let pic = '';
    if (c.show_picture) pic = c.picture === 'custom' ? (c.picture_url ? `<img src="${esc(c.picture_url)}" alt="">` : '') : this._picture();
    const wrapCls = ['wrap', c.show_icon ? '' : 'noicon', c.button_position === 'below' ? 'below' : ''].join(' ');
    R.innerHTML = `<style>${CARD_CSS}${belowCss}</style>
<ha-card class="${c.animations ? 'anim' : ''}" style="${vars.join(';')}" role="button" tabindex="0" aria-label="${esc(this._title())} lights">
 <div class="${wrapCls}">
  <div class="icon ${c.show_icon ? '' : 'hide'}"><ha-icon></ha-icon></div>
  <div class="head"><div class="name"></div><div class="status ${c.show_status ? '' : 'hide'}"></div></div>
  <div class="power ${c.show_buttons ? '' : 'hide'}">
   <button class="pbtn on ${btnCls}" data-act="on" aria-label="Turn ${esc(this._title())} lights on">${btnInner(c.on_icon, c.on_text)}</button>
   <button class="pbtn off ${btnCls}" data-act="off" aria-label="Turn ${esc(this._title())} lights off">${btnInner(c.off_icon, c.off_text)}</button>
  </div>
  <div class="art ${pic ? '' : 'hide'} ${c.picture_on_phones ? 'phones' : ''}">${pic}</div>
  <div class="master ${c.show_brightness || chipCount ? '' : 'hide'}">
   ${c.slider_style === 'classic' ? `<div class="dim ${c.show_brightness ? '' : 'hide'}"><div class="dimhead ${c.show_brightness_words ? '' : 'hide'}"><span>Brightness</span><output></output></div>
    <input type="range" min="0" max="100" step="1" aria-label="${esc(this._title())} brightness"></div>`
    : `<div class="dim bubble ${c.show_brightness ? '' : 'hide'} ${c.show_brightness_words ? '' : 'nowords'}"><div class="bfill"></div>
    <div class="blabel"><ha-icon icon="mdi:brightness-6"></ha-icon><span class="btext">Brightness</span><output class="bpct"></output></div>
    <input type="range" min="0" max="100" step="1" aria-label="${esc(this._title())} brightness"></div>`}
   ${whites.map(k => `<button class="chip preset" data-k="${esc(k)}" title="${esc((PRESETS[k] || ['White'])[0])} · ${esc(k)} K" aria-label="${esc((PRESETS[k] || ['White'])[0])} ${esc(k)} kelvin"><span style="background:${(PRESETS[k] || [, '#ffe4ce'])[1]}"></span></button>`).join('')}
   ${colours.map(col => `<button class="chip fav" data-rgb="${col.join(',')}" title="Colour" aria-label="Set colour"><span style="background:${rgba(col, 1)}"></span></button>`).join('')}
   <button class="chip wheel ${c.show_wheel ? '' : 'hide'}" title="More colours" aria-label="More colours"><span></span></button>
   <div class="msg" aria-live="polite"></div>
  </div>
 </div>
</ha-card>`;
    this._el = { card: R.querySelector('ha-card'), icon: R.querySelector('.icon ha-icon'), name: R.querySelector('.name'), status: R.querySelector('.status'), range: R.querySelector('input[type=range]'), out: R.querySelector('output'), dim: R.querySelector('.dim'), msg: R.querySelector('.msg'), on: R.querySelector('[data-act=on]'), off: R.querySelector('[data-act=off]') };
    this._wire();
    this._built = true;
    this._update();
  }
  _title() { return this._cfg.name || this._areaName(); }

  _wire() {
    const { card, range, on, off } = this._el;
    const stop = e => e.stopPropagation();
    for (const el of this.shadowRoot.querySelectorAll('.power, .master')) { el.addEventListener('click', stop); el.addEventListener('pointerdown', stop); }
    on.addEventListener('click', () => this._power(true));
    off.addEventListener('click', () => this._power(false));
    this.shadowRoot.querySelectorAll('.preset').forEach(b => b.addEventListener('click', () => this._applyColour({ color_temp_kelvin: +b.dataset.k })));
    this.shadowRoot.querySelectorAll('.fav').forEach(b => b.addEventListener('click', () => this._applyColour({ rgb_color: b.dataset.rgb.split(',').map(Number) })));
    if (this._cfg.haptics) this.shadowRoot.querySelectorAll('button').forEach(b => b.addEventListener('click', () => this._haptic()));
    this.shadowRoot.querySelector('.wheel').addEventListener('click', () => this._openColour());
    // live brightness while dragging (throttled), final value on release
    let last = 0, timer = null, sent = null;
    const send = () => { if (+range.value === sent) return; sent = +range.value; this._sendBrightness(sent); last = Date.now(); };
    range.addEventListener('pointerdown', () => { this._dragging = true; sent = null; });
    range.addEventListener('input', () => {
      this._dragging = true; this._paintRange(+range.value);
      clearTimeout(timer); const wait = 160 - (Date.now() - last);
      if (wait <= 0) send(); else timer = setTimeout(send, wait);
    });
    range.addEventListener('change', () => { clearTimeout(timer); send(); setTimeout(() => { this._dragging = false; }, 1200); });
    // tap / hold on the card body
    let holdTimer = null, held = false;
    card.addEventListener('pointerdown', e => { held = false; holdTimer = setTimeout(() => { held = true; this._action(this._cfg.hold, this._cfg.hold_page); }, 550); });
    const cancel = () => clearTimeout(holdTimer);
    card.addEventListener('pointerup', cancel); card.addEventListener('pointerleave', cancel); card.addEventListener('pointercancel', cancel);
    card.addEventListener('click', () => { if (held) { held = false; return; } this._action(this._cfg.tap, this._cfg.tap_page); });
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._action(this._cfg.tap, this._cfg.tap_page); } });
  }
  _haptic() { window.dispatchEvent(new CustomEvent('haptic', { detail: 'light' })); }
  _action(kind, page) {
    if (kind === 'popup') return this._openPopup();
    if (kind === 'page' && page) { history.pushState(null, '', page); window.dispatchEvent(new CustomEvent('location-changed', { detail: { replace: false } })); }
  }

  _update() {
    const h = this._hass, c = this._cfg; if (!h || !this._el) return;
    const members = roomLights(h, c);
    this._members = members;
    const states = members.map(id => h.states[id]).filter(Boolean);
    const onStates = states.filter(isOn);
    const master = masterLights(h, c, members);
    const active = c.rule_active === 'master' ? master.some(id => isOn(h.states[id])) : onStates.length > 0;
    // live room colour (brightness-weighted)
    let rgb = NEUTRAL;
    if (active && c.follow_light_colour !== false) {
      let w = 0, acc = [0, 0, 0];
      for (const st of onStates) { const b = (st.attributes.brightness ?? 255) / 255 + .05, col = lightRgb(st); acc = acc.map((v, i) => v + col[i] * b); w += b; }
      rgb = acc.map(v => Math.round(v / w));
    } else if (active) rgb = [255, 196, 120];
    this._el.card.style.setProperty('--osl-rgb', rgb.join(','));
    this._el.card.classList.toggle('on', active);
    this._el.icon.setAttribute('icon', this._icon());
    this._el.name.textContent = this._title();
    if (c.show_status) {
      const n = onStates.length, total = states.length;
      this._el.status.textContent = !total ? 'No lights found' : n === 0 ? 'All off' : n === total ? (total === 1 ? 'On' : `All ${total} on`) : `${n} of ${total} on`;
    }
    const targets = c.rule_on === 'all' ? members.filter(id => live(h.states[id])) : onTargets(h, c, members);
    this._el.on.disabled = !targets.length;
    this._el.on.classList.toggle('hide', !master.length && c.no_master === 'hide' && c.rule_on !== 'all');
    this._el.off.disabled = !ruleSet(h, c, members, c.rule_off).length;
    // brightness
    const sliderIds = c.rule_slider === 'on' ? members : ruleSet(h, c, members, c.rule_slider);
    const dimOn = sliderIds.map(id => h.states[id]).filter(st => isOn(st) && dimmable(st));
    const pct = dimOn.length ? Math.round(dimOn.reduce((s, st) => s + (st.attributes.brightness || 0), 0) / dimOn.length / 2.55) : 0;
    if (!this._dragging) { this._el.range.value = pct; this._paintRange(pct); }
    this._el.range.disabled = !states.some(st => live(st) && dimmable(st));
    const tempOk = states.some(st => live(st) && supportsTemp(st)), colOk = states.some(st => live(st) && supportsColour(st));
    this.shadowRoot.querySelectorAll('.preset').forEach(b => { b.disabled = !tempOk; });
    this.shadowRoot.querySelectorAll('.fav').forEach(b => { b.disabled = !colOk; });
    this.shadowRoot.querySelector('.wheel').disabled = !(colOk || tempOk);
  }
  _paintRange(v) { this._el.range.style.setProperty('--pct', v + '%'); this._el.dim.style.setProperty('--pct', v + '%'); this._el.out.textContent = v + '%'; }
  _say(text) { this._el.msg.textContent = text || ''; if (text) setTimeout(() => { if (this._el.msg.textContent === text) this._el.msg.textContent = ''; }, 5000); }
  async _call(domain, service, data) {
    try { await this._hass.callService(domain, service, data); }
    catch (e) { this._say(e?.message || 'Couldn’t reach the lights'); }
  }

  _power(turnOn) {
    const h = this._hass, c = this._cfg, members = roomLights(h, c);
    if (!turnOn) { const t = ruleSet(h, c, members, c.rule_off); if (t.length) this._call('homeassistant', 'turn_off', { entity_id: t }); return; }
    const anyOn = members.some(id => isOn(h.states[id]));
    const useAll = c.rule_on === 'all' || (c.rule_on === 'master_if_off' && anyOn);
    const t = useAll ? members.filter(id => live(h.states[id])) : onTargets(h, c, members);
    if (!t.length) return;
    const extra = c.on_brightness === 'fixed' ? { brightness_pct: +c.on_brightness_pct || 100 } : {};
    if (c.on_white && c.on_white !== 'keep') {
      const k = +c.on_white, warm = t.filter(id => supportsTemp(h.states[id])), rest = t.filter(id => !supportsTemp(h.states[id]));
      if (warm.length) this._call('light', 'turn_on', { entity_id: warm, color_temp_kelvin: k, ...extra });
      const rl = rest.filter(id => id.startsWith('light.')), ro = rest.filter(id => !id.startsWith('light.'));
      if (rl.length) this._call('light', 'turn_on', { entity_id: rl, ...(dimmableAll(h, rl) ? extra : {}) });
      if (ro.length) this._call('homeassistant', 'turn_on', { entity_id: ro });
    } else {
      const lights = t.filter(id => id.startsWith('light.')), other = t.filter(id => !id.startsWith('light.'));
      if (lights.length) this._call('light', 'turn_on', { entity_id: lights, ...(dimmableAll(h, lights) ? extra : {}) });
      if (other.length) this._call('homeassistant', 'turn_on', { entity_id: other });
    }
  }
  _sendBrightness(v) {
    const h = this._hass, c = this._cfg, members = roomLights(h, c);
    if (c.rule_slider === 'master' || c.rule_slider === 'all') {
      const t = ruleSet(h, c, members, c.rule_slider).filter(id => dimmable(h.states[id]) || isGroup(h.states[id]));
      if (!t.length) return;
      if (v <= 0) this._call('light', 'turn_off', { entity_id: t }); else this._call('light', 'turn_on', { entity_id: t, brightness_pct: v });
      return;
    }
    const onNow = members.filter(id => isOn(h.states[id]) && dimmable(h.states[id]));
    if (v <= 0) { if (onNow.length) this._call('light', 'turn_off', { entity_id: onNow }); return; }
    const t = onNow.length ? onNow : onTargets(h, c, members).filter(id => dimmable(h.states[id]) || isGroup(h.states[id]));
    if (t.length) this._call('light', 'turn_on', { entity_id: t, brightness_pct: v });
  }
  /* Colour rule: if any room light is on, change only the lights that are on (keep their brightness).
     If everything is off, turn on the "On button" lights at the wake-up brightness. */
  _applyColour(data) {
    const h = this._hass, c = this._cfg, members = roomLights(h, c);
    const anyOn = members.some(id => isOn(h.states[id]));
    let targets;
    if (c.rule_colour === 'master') targets = onTargets(h, c, members);
    else if (c.rule_colour === 'all') targets = members.filter(id => live(h.states[id]));
    else targets = anyOn ? members.filter(id => isOn(h.states[id])) : onTargets(h, c, members);
    const wantsTemp = 'color_temp_kelvin' in data;
    targets = targets.filter(id => { const st = h.states[id]; return live(st) && (isGroup(st) || (wantsTemp ? supportsTemp(st) : supportsColour(st))); });
    if (!targets.length) { this._say(anyOn ? 'None of the lights that are on can do that colour.' : 'No lights here can do that colour.'); return; }
    for (const id of targets) {
      const st = h.states[id], d = { entity_id: id, ...data };
      if (wantsTemp && !isGroup(st)) { const lo = st.attributes.min_color_temp_kelvin || 2000, hi = st.attributes.max_color_temp_kelvin || 6500; d.color_temp_kelvin = Math.max(lo, Math.min(hi, data.color_temp_kelvin)); }
      if (!isOn(st)) d.brightness_pct = +c.wake_brightness || 50;
      this._call('light', 'turn_on', d);
    }
  }
  _openColour() { this._ensurePopup().open('colour'); }
  _openPopup() { this._ensurePopup().open('lights'); }
  _ensurePopup() {
    if (!this._popup) { this._popup = document.createElement(POPUP_TAG); this._popup.card = this; }
    if (!this._popup.isConnected) document.body.appendChild(this._popup);
    this._popup.update(this._hass);
    return this._popup;
  }
  disconnectedCallback() { this._popup?.close(); Shared.listeners.delete(this._onShared); }
}

/* ---------------- pop-up: individual lights + colour picker ---------------- */
const POP_CSS = `
:host{position:fixed;inset:0;z-index:9999;display:none;font-family:var(--paper-font-body1_-_font-family,Arial,sans-serif)}
:host([open]){display:block}
.back{position:absolute;inset:0;background:rgba(0,0,0,.45);backdrop-filter:blur(2px)}
.sheet{position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:min(620px,100%);max-height:86vh;overflow:auto;box-sizing:border-box;padding:18px 16px calc(18px + env(safe-area-inset-bottom,0px));
  border-radius:28px 28px 0 0;background:linear-gradient(rgba(var(--osl-rgb),.18),rgba(var(--osl-rgb),.08)),var(--card-background-color,#1c1c1c);color:var(--primary-text-color,#f7f9fc);box-shadow:0 -10px 40px rgba(0,0,0,.4);animation:up .22s ease-out}
@media(min-width:768px){.sheet{bottom:auto;top:8vh;border-radius:28px}}
@keyframes up{from{transform:translate(-50%,24px);opacity:0}to{transform:translate(-50%,0);opacity:1}}
header{display:flex;align-items:center;gap:12px;margin-bottom:14px}
header h2{flex:1;margin:0;font:650 21px/25px Arial,sans-serif;letter-spacing:-.4px}
.x{all:unset;cursor:pointer;width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.08)}
.row{position:relative;display:flex;align-items:center;gap:12px;min-height:76px;margin-bottom:8px;padding:0 14px;border-radius:24px;overflow:hidden;cursor:pointer;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08)}
.row .fill{position:absolute;inset:0 auto 0 0;width:0;background:rgba(var(--c),.45);pointer-events:none;transition:width .15s}
.row .ic{position:relative;z-index:1;width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.1);cursor:pointer}
.row.on .ic{background:rgba(var(--c),.9);color:#111}
.row .tx{position:relative;z-index:1;flex:1;min-width:0}
.row .nm{font:600 18px/22px Arial,sans-serif;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.row .stt{font:16px/20px Arial,sans-serif;opacity:.78}
.row input{position:absolute;inset:0;width:100%;height:100%;opacity:0;margin:0;cursor:ew-resize;z-index:0;touch-action:pan-y}
.empty{opacity:.7;padding:20px 4px}
.wheelbox{display:flex;flex-direction:column;align-items:center;gap:16px;padding:6px 0 10px}
.wheel{width:260px;height:260px;border-radius:50%;cursor:crosshair;touch-action:none;position:relative;background:radial-gradient(circle,#fff 0,rgba(255,255,255,0) 70%),conic-gradient(from 90deg,red,#ff0,lime,cyan,blue,#f0f,red)}
.temps{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;width:100%}
.temps button{all:unset;cursor:pointer;height:48px;border-radius:14px;border:1px solid rgba(255,255,255,.14)}
.note{font:13px/17px Arial,sans-serif;opacity:.75;text-align:center}
`;
class OneStopRoomLightsPopup extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); this._onKey = e => { if (e.key === 'Escape') this.close(); }; }
  open(mode) { this._mode = mode; this.setAttribute('open', ''); this._build(); document.addEventListener('keydown', this._onKey); }
  close() { this.removeAttribute('open'); document.removeEventListener('keydown', this._onKey); }
  update(hass) { this._hass = hass; if (this.hasAttribute('open') && this._mode === 'lights') this._refresh(); }
  _build() {
    const card = this.card, title = card._title();
    this.style.setProperty('--osl-rgb', card._el.card.style.getPropertyValue('--osl-rgb') || '184,184,184');
    this.shadowRoot.innerHTML = `<style>${POP_CSS}</style><div class="back"></div><div class="sheet" role="dialog" aria-label="${esc(title)}">
      <header><h2>${esc(this._mode === 'colour' ? title + ' colour' : title)}</h2><button class="x" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button></header><div class="body"></div></div>`;
    this.shadowRoot.querySelector('.back').onclick = () => this.close();
    this.shadowRoot.querySelector('.x').onclick = () => this.close();
    this._body = this.shadowRoot.querySelector('.body');
    this._rows = {};
    if (this._mode === 'colour') this._buildColour(); else this._refresh();
  }
  _refresh() {
    const h = this._hass, card = this.card; if (!h || !this._body) return;
    const ids = roomLights(h, card._cfg);
    if (!ids.length) { this._body.innerHTML = `<div class="empty">No lights are assigned to this room yet. Assign lights to the room in Home Assistant, or add them under “Extra lights” in the card editor.</div>`; this._rows = {}; return; }
    if (Object.keys(this._rows).join() !== ids.join()) {
      this._body.innerHTML = ''; this._rows = {};
      for (const id of ids) {
        const row = document.createElement('div'); row.className = 'row';
        row.innerHTML = `<div class="fill"></div><input type="range" min="1" max="100" aria-label="Brightness"><div class="ic" role="button" aria-label="More settings"><ha-icon></ha-icon></div><div class="tx"><div class="nm"></div><div class="stt"></div></div>`;
        const input = row.querySelector('input'); let moved = false, t = null, last = 0;
        input.addEventListener('pointerdown', () => { moved = false; row._drag = true; });
        input.addEventListener('input', () => { moved = true; row.querySelector('.fill').style.width = input.value + '%'; clearTimeout(t);
          const go = () => { last = Date.now(); card._call('light', 'turn_on', { entity_id: id, brightness_pct: +input.value }); };
          const wait = 160 - (Date.now() - last); if (wait <= 0) go(); else t = setTimeout(go, wait); });
        input.addEventListener('change', () => { clearTimeout(t); if (moved) card._call('light', 'turn_on', { entity_id: id, brightness_pct: +input.value }); setTimeout(() => { row._drag = false; }, 1000); });
        input.addEventListener('click', () => { if (!moved) card._call('homeassistant', 'toggle', { entity_id: id }); moved = false; });
        row.addEventListener('click', e => { if (e.target === input || row._dimmable) return; card._call('homeassistant', 'toggle', { entity_id: id }); });
        row.querySelector('.ic').addEventListener('click', e => { e.stopPropagation(); this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: id }, bubbles: true, composed: true })); });
        this._body.appendChild(row); this._rows[id] = row;
      }
    }
    for (const id of ids) {
      const st = h.states[id], row = this._rows[id]; if (!st) continue;
      const on = isOn(st), pct = on ? Math.max(1, Math.round((st.attributes.brightness ?? 255) / 2.55)) : 0;
      const col = on ? lightRgb(st) : [140, 140, 140];
      row.classList.toggle('on', on); row.style.setProperty('--c', col.join(','));
      row.querySelector('.ic ha-icon').setAttribute('icon', st.attributes.icon || (on ? 'mdi:lightbulb-on' : 'mdi:lightbulb-outline'));
      row.querySelector('.nm').textContent = st.attributes.friendly_name || id;
      row.querySelector('.stt').textContent = !live(st) ? 'Not responding' : on ? (dimmable(st) ? pct + '%' : 'On') : 'Off';
      const input = row.querySelector('input'); input.disabled = !live(st);
      row._dimmable = id.startsWith('light.') && dimmable(st); input.style.pointerEvents = row._dimmable ? '' : 'none';
      if (!row._drag) { input.value = pct || 1; row.querySelector('.fill').style.width = pct + '%'; }
    }
  }
  _buildColour() {
    const card = this.card;
    const temps = [2000, 2700, 3000, 3500, 4000, 5000, 6500];
    this._body.innerHTML = `<div class="wheelbox"><div class="wheel" role="slider" aria-label="Colour wheel"></div>
      <div class="temps">${temps.map(k => `<button data-k="${k}" title="${k} K" style="background:${rgba(kelvinToRgb(k), 1)}"></button>`).join('')}</div>
      <div class="note">If any lights are on, only those change. If they’re all off, the room turns on at ${+card._cfg.wake_brightness || 50}%.</div></div>`;
    const wheel = this._body.querySelector('.wheel');
    const pick = e => { const r = wheel.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
      const d = Math.min(1, Math.hypot(x, y) / (r.width / 2)); let hue = Math.atan2(y, x) * 180 / Math.PI; hue = (hue + 360) % 360;
      return [Math.round(hue), Math.round(d * 100)]; };
    let down = false, last = 0;
    wheel.addEventListener('pointerdown', e => { down = true; wheel.setPointerCapture(e.pointerId); });
    wheel.addEventListener('pointermove', e => { if (!down || Date.now() - last < 200) return; last = Date.now(); card._applyColour({ hs_color: pick(e) }); });
    wheel.addEventListener('pointerup', e => { down = false; card._applyColour({ hs_color: pick(e) }); });
    this._body.querySelectorAll('.temps button').forEach(b => b.addEventListener('click', () => card._applyColour({ color_temp_kelvin: +b.dataset.k })));
  }
}

/* ---------------- visual editor ---------------- */
const sel = opts => ({ select: { mode: 'dropdown', options: opts.map(([value, label]) => ({ value, label })) } });
const toggle = { boolean: {} };
const presetChoices = sel([...Object.entries(PRESETS).map(([k, [n]]) => [k, `${n} (${k} K)`]), ['none', 'No button']]);
const schema = d => {
  const grid = items => ({ type: 'grid', name: '', flatten: true, schema: items });
  const section = (name, title, icon, items) => ({ name, type: 'expandable', flatten: true, title, icon, schema: items });
  const size4 = sel([['small', 'Small'], ['medium', 'Medium'], ['large', 'Large'], ['extra_large', 'Extra large']]);
  return [
  { name: 'area', required: true, selector: { area: {} } },
  grid([{ name: 'name', selector: { text: {} } }, { name: 'room_icon', selector: { icon: {} } }]),
  section('g_master', 'Master lights', 'mdi:lightbulb-on-outline', [
    { name: 'master_lights', selector: { entity: { multiple: true, filter: [{ domain: 'light' }, { domain: 'switch' }] } } },
    { name: 'no_master', selector: sel([['all', 'Use every light in the room'], ['hide', 'Hide the On button']]) },
  ]),
  section('g_rules', 'Master rules', 'mdi:script-text-outline', [
    { name: 'rule_on', selector: sel([['master', 'Turn on the master lights'], ['master_if_off', 'Master lights if the room is off, every light if some are already on'], ['all', 'Turn on every light in the room']]) },
    grid([
      { name: 'on_brightness', selector: sel([['keep', 'Their last brightness'], ['fixed', 'A set brightness']]) },
      ...(d.on_brightness === 'fixed' ? [{ name: 'on_brightness_pct', selector: { number: { min: 5, max: 100, step: 5, mode: 'slider', unit_of_measurement: '%' } } }] : []),
      { name: 'on_white', selector: sel([['keep', 'Their last colour'], ...Object.entries(PRESETS).map(([k, [n]]) => [k, `${n} (${k} K)`])]) },
    ]),
    { name: 'rule_off', selector: sel([['all', 'Every light in the room'], ['master', 'Only the master lights']]) },
    { name: 'rule_slider', selector: sel([['on', 'Lights that are on (if all are off, the master lights)'], ['master', 'Always the master lights'], ['all', 'Every light in the room']]) },
    { name: 'rule_colour', selector: sel([['on', 'Lights that are on (if all are off, the master lights)'], ['master', 'Always the master lights'], ['all', 'Every light in the room']]) },
    { name: 'wake_brightness', selector: { number: { min: 5, max: 100, step: 5, mode: 'slider', unit_of_measurement: '%' } } },
    { name: 'rule_active', selector: sel([['any', 'Any light in the room is on'], ['master', 'A master light is on']]) },
  ]),
  section('g_lights', 'Other lights', 'mdi:lightbulb-group-outline', [
    { name: 'extra_lights', selector: { entity: { multiple: true, filter: [{ domain: 'light' }, { domain: 'switch' }] } } },
    { name: 'hide_lights', selector: { entity: { multiple: true, filter: { domain: 'light' } } } },
  ]),
  section('g_show', 'What to show', 'mdi:eye-outline', [grid([
    { name: 'show_icon', selector: toggle }, { name: 'show_status', selector: toggle },
    { name: 'show_buttons', selector: toggle }, { name: 'show_picture', selector: toggle },
    { name: 'show_brightness', selector: toggle }, { name: 'show_brightness_words', selector: toggle },
    { name: 'show_presets', selector: toggle }, { name: 'show_wheel', selector: toggle },
  ])]),
  section('g_layout', 'Layout and text', 'mdi:page-layout-header', [grid([
    { name: 'button_position', selector: sel([['auto', 'Beside the title (moves under on small screens)'], ['beside', 'Always beside the title'], ['below', 'Always under the title']]) },
    { name: 'card_spacing', selector: sel([['compact', 'Compact'], ['standard', 'Standard'], ['roomy', 'Roomy']]) },
    { name: 'corners', selector: sel([['square', 'Square'], ['rounded', 'Rounded'], ['extra_round', 'Extra round']]) },
    { name: 'font', selector: sel([['classic', 'Classic'], ['theme', 'Same as Home Assistant'], ['rounded', 'Rounded']]) },
    { name: 'title_size', selector: size4 },
    { name: 'title_color', selector: { color_rgb: {} } },
  ])]),
  section('g_colours', 'Colours and glow', 'mdi:palette-outline', [grid([
    { name: 'off_background', selector: sel([['theme', 'Match my other cards'], ['darker', 'Darker'], ['lighter', 'Lighter'], ['custom', 'My own colour']]) },
    ...(d.off_background === 'custom' ? [{ name: 'off_custom_color', selector: { color_rgb: {} } }] : []),
    { name: 'on_glow', selector: sel([['subtle', 'Subtle'], ['normal', 'Normal'], ['strong', 'Strong']]) },
    { name: 'follow_light_colour', selector: toggle },
    { name: 'icon_color', selector: sel([['lights', 'Match the lights'], ['white', 'White'], ['custom', 'My own colour']]) },
    ...(d.icon_color === 'custom' ? [{ name: 'icon_custom_color', selector: { color_rgb: {} } }] : []),
    { name: 'icon_background', selector: toggle },
    { name: 'hover_color', selector: { color_rgb: {} } },
    { name: 'animations', selector: toggle },
  ])]),
  section('g_buttons', 'On and Off buttons', 'mdi:gesture-tap-button', [grid([
    { name: 'button_size', selector: size4 },
    { name: 'button_shape', selector: sel([['square', 'Square corners'], ['rounded', 'Rounded'], ['extra_round', 'Circle']]) },
    { name: 'button_style', selector: sel([['tinted', 'Soft colour'], ['solid', 'Solid colour'], ['outline', 'Outline'], ['glass', 'Clear glass']]) },
    ...(d.button_style === 'tinted' ? [{ name: 'button_tint', selector: sel([['very_soft', 'Very soft'], ['soft', 'Soft'], ['medium', 'Medium'], ['bold', 'Bold']]) }] : []),
    { name: 'button_content', selector: sel([['icon_words', 'Icon and words'], ['icon', 'Icon only'], ['words', 'Words only']]) },
    { name: 'button_text_size', selector: sel([['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']]) },
    { name: 'on_color', selector: { color_rgb: {} } }, { name: 'off_color', selector: { color_rgb: {} } },
    { name: 'on_text', selector: { text: {} } }, { name: 'off_text', selector: { text: {} } },
    { name: 'on_icon', selector: { icon: {} } }, { name: 'off_icon', selector: { icon: {} } },
  ])]),
  section('g_slider', 'Brightness slider', 'mdi:tune-variant', [grid([
    { name: 'slider_style', selector: sel([['bubble', 'Bubble (big rounded bar)'], ['classic', 'Classic (thin bar with a knob)']]) },
    { name: 'slider_size', selector: sel([['thin', 'Thin'], ['standard', 'Standard'], ['thick', 'Thick']]) },
    { name: 'slider_colour', selector: sel([['lights', 'Match the lights'], ['white', 'White'], ['custom', 'My own colour']]) },
    ...(d.slider_colour === 'custom' ? [{ name: 'slider_custom_color', selector: { color_rgb: {} } }] : []),
  ])]),
  section('g_presets', 'Light colour buttons', 'mdi:white-balance-sunny', [
    grid([
      { name: 'chip_shape', selector: sel([['circle', 'Circles'], ['rounded', 'Rounded squares']]) },
      { name: 'chip_size', selector: sel([['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']]) },
      { name: 'preset_1', selector: presetChoices }, { name: 'preset_2', selector: presetChoices },
      { name: 'preset_3', selector: presetChoices }, { name: 'preset_4', selector: presetChoices },
    ]),
    { name: 'colour_count', selector: sel([['0', 'None'], ['1', '1'], ['2', '2'], ['3', '3']]) },
    grid([
      ...(+d.colour_count >= 1 ? [{ name: 'colour_1', selector: { color_rgb: {} } }] : []),
      ...(+d.colour_count >= 2 ? [{ name: 'colour_2', selector: { color_rgb: {} } }] : []),
      ...(+d.colour_count >= 3 ? [{ name: 'colour_3', selector: { color_rgb: {} } }] : []),
    ]),
  ]),
  section('g_picture', 'Room picture', 'mdi:image-outline', [grid([
    { name: 'picture', selector: sel([...Object.entries(PICTURE_NAMES).filter(([k]) => k !== 'none'), ['custom', 'My own picture']]) },
    ...(d.picture === 'custom' ? [{ name: 'picture_url', selector: { text: {} } }] : [{ name: 'picture_caption', selector: { text: {} } }]),
    { name: 'picture_size', selector: sel([['small', 'Short'], ['medium', 'Standard'], ['large', 'Tall']]) },
    { name: 'picture_on_phones', selector: toggle },
  ])]),
  section('g_actions', 'Tap and hold', 'mdi:gesture-tap', [
    { name: 'tap', selector: sel([['popup', 'Show each light in a pop-up'], ['page', 'Go to a page'], ['none', 'Do nothing']]) },
    ...(d.tap === 'page' ? [{ name: 'tap_page', selector: { navigation: {} } }] : []),
    { name: 'hold', selector: sel([['popup', 'Show each light in a pop-up'], ['page', 'Go to a page'], ['none', 'Do nothing']]) },
    ...(d.hold === 'page' ? [{ name: 'hold_page', selector: { navigation: {} } }] : []),
    { name: 'haptics', selector: toggle },
  ]),
  ];
};
const LABELS = {
  edit_all: 'Master edit – change all Room Lights cards at once', reset_style: 'Use the shared style on this card (clear its own changes)',
  area: 'Room', name: 'Card title', room_icon: 'Room icon',
  master_lights: 'Master lights (what turns on when the room is off)', no_master: 'If no master lights are picked',
  rule_on: 'When you press On', on_brightness: 'Turn on at', on_brightness_pct: 'Brightness', on_white: 'Light colour when turned on',
  rule_off: 'When you press Off, turn off', rule_slider: 'The brightness slider changes', rule_colour: 'The colour buttons change',
  rule_active: 'Show the room as on when', extra_lights: 'Add lights from other rooms', hide_lights: 'Leave these lights out',
  wake_brightness: 'Brightness when a colour turns a light on',
  show_icon: 'Room icon', show_status: 'How many lights are on', show_buttons: 'On / Off buttons', show_picture: 'Room picture',
  show_brightness: 'Brightness slider', show_brightness_words: 'Brightness word and %', show_presets: 'Light colour buttons', show_wheel: 'Colour wheel button',
  button_position: 'Where the On / Off buttons go', card_spacing: 'Spacing inside the card', corners: 'Card corners', font: 'Lettering style',
  title_size: 'Title size', title_color: 'Title colour',
  off_background: 'Background when the lights are off', off_custom_color: 'Your background colour', on_glow: 'Glow when the lights are on', follow_light_colour: 'Glow matches the light colour',
  icon_color: 'Room icon colour', icon_custom_color: 'Your icon colour', icon_background: 'Shaded box behind the icon',
  hover_color: 'Edge colour on mouse-over (grey = follow the lights)', animations: 'Gentle animations',
  button_size: 'Button size', button_shape: 'Button shape', button_style: 'Button style', button_tint: 'Colour strength',
  button_content: 'What the buttons show', button_text_size: 'Button word size',
  on_color: 'On button colour', off_color: 'Off button colour', on_text: 'On button words', off_text: 'Off button words', on_icon: 'On button icon', off_icon: 'Off button icon',
  slider_style: 'Slider style', slider_size: 'Slider thickness', slider_colour: 'Slider colour', slider_custom_color: 'Your slider colour',
  chip_shape: 'Button shape', chip_size: 'Button size',
  preset_1: 'White button 1', preset_2: 'White button 2', preset_3: 'White button 3', preset_4: 'White button 4',
  colour_count: 'Extra colour buttons', colour_1: 'Colour button 1', colour_2: 'Colour button 2', colour_3: 'Colour button 3',
  picture: 'Picture', picture_url: 'Picture web address (or /local/… file)', picture_caption: 'Words on the picture', picture_size: 'Picture height', picture_on_phones: 'Show on phones too',
  tap: 'When you tap the card', tap_page: 'Page to open on tap', hold: 'When you press and hold', hold_page: 'Page to open on hold', haptics: 'Vibrate on press (phones)',
};
const HELPERS = {
  name: 'Leave empty to use the room’s name.',
  master_lights: 'Tip: pick the room’s light group or its main lights. These are also used by the slider and colour buttons when the room is off.',
  rule_active: 'Controls the glow and the “on” look of the card.',
  hide_lights: 'Left-out lights stay out of the pop-up, the glow and the buttons.',
  picture_caption: 'Leave empty to keep the standard wording.',
  colour_count: 'Adds your own colour buttons next to the white ones.',
};

class OneStopRoomLightsCardEditor extends HTMLElement {
  setConfig(config) { const c = { ...config }; if (c.on_lights && !c.master_lights) { c.master_lights = c.on_lights; } delete c.on_lights; this._config = c; this._render(); }
  set hass(hass) {
    const first = !this._hass; this._hass = hass;
    if (first) Shared.get(hass).then(() => this._render());
    this._render();
  }
  _inherited() { return { ...DEFAULTS, ...((Shared.data || {}).room_lights || {}) }; }
  _ownStyleKeys() { return Object.keys(this._config || {}).filter(k => !ROOM_KEYS.includes(k)); }
  _clean(v) {
    const out = {};
    for (const [k, val] of Object.entries(v)) {
      if (['type', 'edit_all', 'reset_style'].includes(k) || val === '' || val == null) continue;
      if (Array.isArray(val) && !val.length && !okRgb(val)) continue;
      if (k === 'off_custom_color' && v.off_background !== 'custom') continue;
      if (k === 'icon_custom_color' && v.icon_color !== 'custom') continue;
      if (k === 'slider_custom_color' && v.slider_colour !== 'custom') continue;
      if (/^colour_[123]$/.test(k) && +k.slice(-1) > +(v.colour_count || 0)) continue;
      if (k === 'picture_url' && v.picture !== 'custom') continue;
      if (k === 'on_lights') continue;
      if (k === 'on_brightness_pct' && v.on_brightness !== 'fixed') continue;
      if (k === 'tap_page' && v.tap !== 'page') continue;
      if (k === 'hold_page' && v.hold !== 'page') continue;
      out[k] = val;
    }
    return out;
  }
  _emit(cfg) {
    this._config = cfg; this._render();
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: cfg }, bubbles: true, composed: true }));
  }
  _onChange(v) {
    if (!!v.edit_all !== !!this._all) { this._all = !!v.edit_all; this._render(); return; }
    const type = this._config.type || 'custom:' + TAG;
    if (v.reset_style) {                                   // drop this card's own style changes
      const cfg = { type }; for (const k of ROOM_KEYS) if (k in this._config && k !== 'type') cfg[k] = this._config[k];
      return this._emit(cfg);
    }
    const clean = this._clean(v), inherited = this._inherited();
    const cfg = { type };
    for (const k of ROOM_KEYS) if (k !== 'type' && k in clean && !(k in DEFAULTS && same(clean[k], DEFAULTS[k]))) cfg[k] = clean[k];
    if (this._all) {
      const shared = {};
      for (const [k, val] of Object.entries(clean)) if (!ROOM_KEYS.includes(k) && !(k in DEFAULTS && same(val, DEFAULTS[k]))) shared[k] = val;
      const before = (Shared.data || {}).room_lights || {};
      // keep any of this card's own changes that weren't touched now
      for (const k of this._ownStyleKeys()) if (same(clean[k], this._lastShown?.[k])) cfg[k] = this._config[k];
      for (const k of Object.keys(clean)) if (!ROOM_KEYS.includes(k) && !same(clean[k], this._lastShown?.[k])) delete cfg[k];
      if (!same(shared, before)) {
        Shared.data = { ...(Shared.data || {}), room_lights: shared };
        clearTimeout(this._saveT);
        this._saveT = setTimeout(() => Shared.save(this._hass, 'room_lights', shared).catch(e => { this._error = 'Couldn’t save the shared style: ' + (e?.message || e); this._render(); }), 500);
        Shared.listeners.forEach(fn => fn(Shared.data));
      }
    } else {
      for (const [k, val] of Object.entries(clean)) if (!ROOM_KEYS.includes(k) && !same(val, inherited[k])) cfg[k] = val;
    }
    this._emit(cfg);
  }
  _render() {
    if (!this._config) return;
    if (!this._form) {
      this._note = document.createElement('div');
      this._note.style.cssText = 'margin:0 0 12px;padding:10px 12px;border-radius:12px;font-size:14px;line-height:1.4;background:rgba(var(--rgb-primary-color,3,169,244),.12)';
      this.appendChild(this._note);
      this._form = document.createElement('ha-form');
      this._form.computeLabel = s => LABELS[s.name] ?? s.title ?? s.name;
      this._form.computeHelper = s => HELPERS[s.name];
      this._form.addEventListener('value-changed', ev => { ev.stopPropagation(); this._onChange(ev.detail.value); });
      this.appendChild(this._form);
    }
    const inherited = this._inherited(), own = this._ownStyleKeys();
    const room = Object.fromEntries(Object.entries(this._config).filter(([k]) => ROOM_KEYS.includes(k)));
    const data = this._all ? { ...inherited, ...room } : { ...inherited, ...this._config };
    data.edit_all = !!this._all; data.reset_style = false;
    this._lastShown = data;
    this._note.textContent = this._error || (this._all
      ? 'Master edit is on: look and rule changes apply to every Room Lights card. Room, title, icon and lights still apply to this card only.'
      : own.length ? `This card has ${own.length} setting${own.length > 1 ? 's' : ''} of its own; everything else follows the shared style.` : 'This card follows the shared style. Turn on Master edit to change every Room Lights card at once.');
    const top = [{ name: 'edit_all', selector: { boolean: {} } }, ...(!this._all && own.length ? [{ name: 'reset_style', selector: { boolean: {} } }] : [])];
    this._form.hass = this._hass;
    this._form.schema = [...top, ...schema(data)];
    this._form.data = data;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, OneStopRoomLightsCard);
if (!customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, OneStopRoomLightsCardEditor);
if (!customElements.get(POPUP_TAG)) customElements.define(POPUP_TAG, OneStopRoomLightsPopup);
window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === TAG)) window.customCards.push({ type: TAG, name: 'One Stop - Room Lights card', description: 'A room’s lights in one card: On/Off, brightness, white light, colour and every light in a pop-up.', preview: true });
console.info(`%c ONE STOP %c Room Lights card ${VERSION} `, 'background:#375374;color:#fff;border-radius:3px 0 0 3px;padding:2px 4px', 'background:#e9eef5;color:#375374;border-radius:0 3px 3px 0;padding:2px 4px');
window.__oneStopRoomLights = { roomLights, kelvinToRgb, DEFAULTS, VERSION, Shared };
})();
