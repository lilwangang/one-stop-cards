/* One Stop - Remote card
 * A remote control for TVs, streaming boxes, receivers and anything else in Home Assistant.
 * The remote engine (src/70-remote-engine.src.js) is Universal Remote Card by Nerwyn, Apache-2.0;
 * this file adds the One Stop look and a plain-English visual editor on top of it.
 */
(() => {
const init = E => {
const VERSION = '1.3.0'
const TAG = 'one-stop-remote-card';
const EDITOR_TAG = TAG + '-editor';

const clone = o => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const okRgb = v => Array.isArray(v) && v.length === 3 && v.every(n => typeof n === 'number');
const rgb = (v, a) => (a == null ? `rgb(${v.join(',')})` : `rgba(${v.join(',')},${a})`);
const lift = (v, n) => v.map(x => Math.min(255, Math.round(x + (255 - x) * n)));
const hasTpl = s => typeof s === 'string' && /\{\{|\{%/.test(s);

/* ------------------------------------------------------------------ look -> CSS */
const SIZES = { small: [44, 24], medium: [56, 28], large: [68, 34], xl: [84, 42] };          // [box, icon] in px
const GAPS = { tight: 4, normal: 8, roomy: 14 };
const SHAPES = { rounded: '16px', round: '999px', square: '6px' };
const SLIDER_H = { small: 32, medium: 44, large: 56 };
const LOOK = { design: 'one_stop', background: 'glass', accent_bar: false, accent: [133, 142, 228], button_style: 'tile', button_size: 'large', shape: 'rounded', stretch: true, gap: 'normal', tint_ok: true, tint_power: true, slider_size: 'medium' };
const OFF_STATES = '["off","unavailable","unknown","idle","standby","closed","paused","not_home","locked","none",""]';
const TILE = 'background:linear-gradient(150deg,rgba(255,255,255,.07),rgba(255,255,255,.01)),color-mix(in srgb,var(--primary-text-color) 9%,transparent);border:1px solid color-mix(in srgb,var(--primary-text-color) 24%,transparent);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 3px 8px rgba(0,0,0,.16);';
const NAV = '#up,#down,#left,#right,#center';
// Buttons never grow past a fifth of the card, so four always fit side by side on a phone.
const fit = px => `min(${px}px,21cqi)`;

// Styles written for the original card keep working: its tag names are mapped to this card's.
const alias = css => (typeof css === 'string' ? css.replace(/(^|[^\w-])remote-(button|slider|touchpad|circlepad|dialog)(?![\w-])/g, '$1os-remote-$2') : css);

function cardCss(raw) {
  const l = { ...LOOK, ...(raw || {}) };
  if (l.design === 'plain') return '';
  const [px, icon] = SIZES[l.button_size] || SIZES.large, box = fit(px), gap = GAPS[l.gap] ?? 8, radius = SHAPES[l.shape] || '16px';
  const ac = okRgb(l.accent) ? l.accent : LOOK.accent;
  const out = [];
  const bg = {
    glass: 'background:linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.015)),var(--bubble-button-main-background-color,var(--bubble-main-background-color,var(--background-color-2,var(--ha-card-background,var(--card-background-color)))));border:1px solid color-mix(in srgb,var(--primary-text-color) 12%,transparent);box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 10px 24px rgba(0,0,0,.10);backdrop-filter:blur(18px) saturate(1.1);-webkit-backdrop-filter:blur(18px) saturate(1.1);',
    theme: '',
    clear: 'background:transparent;border:none;box-shadow:none;',
  }[l.background] ?? '';
  out.push(`ha-card{container-type:inline-size;padding:${l.background === 'clear' ? '0' : '16px 14px 18px'};border-radius:22px;${bg}${l.accent_bar ? `border-top:3px solid ${rgb(ac)};` : ''}}`);
  out.push(`.row,.column{gap:${gap}px;}`);
  out.push(`os-remote-button{width:${box};height:${box};--icon-size:${icon}px;border-radius:${radius};box-sizing:border-box;color:var(--primary-text-color);${l.button_style === 'tile' ? TILE : l.button_style === 'outline' ? 'background:transparent;border:1px solid color-mix(in srgb,var(--primary-text-color) 40%,transparent);' : ''}}`);
  out.push('os-remote-button::part(button){border-radius:inherit;}');
  out.push('os-remote-button::part(label){color:var(--primary-text-color);font-size:13px;font-weight:500;height:auto;line-height:1.15;margin-top:3px;}');
  out.push('os-remote-button:active{filter:brightness(1.18);}');
  if (l.stretch) out.push(`.row > os-remote-button:not(${NAV}){flex:1 1 0;min-width:0;width:auto;}`);
  out.push(`.button-pad{grid-template-rows:repeat(3,${box});grid-template-columns:repeat(3,${box});grid-gap:${gap}px;}`);
  out.push(`.empty-button{width:${box};height:${box};}`);
  if (l.button_style !== 'plain') {
    if (l.tint_ok) out.push(`os-remote-button#center{background:linear-gradient(150deg,rgba(255,255,255,.10),rgba(255,255,255,.02)),${rgb(ac, .42)};border-color:${rgb(lift(ac, .35), .7)};}`);
    if (l.tint_power) out.push('os-remote-button:is(#power,#power_off){background:linear-gradient(150deg,rgba(255,255,255,.06),rgba(255,255,255,.015)),rgba(178,52,64,.30);border-color:rgba(231,142,150,.5);}');
  }
  out.push(`os-remote-slider{--height:${SLIDER_H[l.slider_size] || 44}px;--color:${rgb(ac)};--background:${rgb(ac, .16)};}`);
  return out.join('\n');
}

function elementCss(el) {
  const l = el.look;
  if (!l || typeof l !== 'object') return '';
  const type = el.type || 'button', host = [], extra = [];
  if (type === 'slider') {
    if (okRgb(l.color)) host.push(`--color:${rgb(l.color)}`, `--background:${rgb(l.color, .16)}`);
    if (l.height) host.push(`--height:${+l.height}px`);
  } else if (type === 'button') {
    if (SIZES[l.size]) host.push(`width:${fit(SIZES[l.size][0])}`, `height:${fit(SIZES[l.size][0])}`, `--icon-size:${SIZES[l.size][1]}px`);
    if (l.fill === 'yes') host.push('flex:1 1 0', 'min-width:0', 'width:auto');
    if (l.fill === 'no') host.push('flex:0 0 auto', ...(SIZES[l.size] ? [] : ['width:unset']));
    if (l.height) host.push(`height:${+l.height}px`);
    if (l.icon_size) host.push(`--icon-size:${+l.icon_size}px`);
    if (okRgb(l.color)) host.push(`--icon-color:${rgb(l.color)}`);
    if (l.background === 'none') host.push('background:transparent', 'border-color:transparent', 'box-shadow:none');
    if (l.background === 'custom' && okRgb(l.background_color)) host.push(`background:${rgb(l.background_color)}`, `border-color:${rgb(lift(l.background_color, .3), .7)}`);
    if (l.layout === 'inline') extra.push('button{flex-direction:row;gap:8px;} .label{margin:0;font-size:15px;}');
    if (l.highlight && el.entity_id && !hasTpl(el.entity_id)) {
      const c = okRgb(l.highlight_color) ? l.highlight_color : [133, 142, 228];
      extra.push(`{% if not (states("${el.entity_id}") in ${OFF_STATES}) %}:host{background:${rgb(c, .26)};border-color:${rgb(lift(c, .3), .65)};--icon-color:${rgb(lift(c, .45))};}{% endif %}`);
    }
  }
  return (host.length ? `:host{${host.join(';')};}` : '') + (extra.length ? '\n' + extra.join('\n') : '');
}

const POPUP_EVENT = 'one-stop-remote-popup';
const popupList = c => (Array.isArray(c?.popups) ? c.popups.filter(p => p && typeof p === 'object' && p.name) : []);
function compile(config) {
  const c = { ...config };
  const css = cardCss(c.look);
  delete c.look;
  const pops = popupList(c);
  delete c.popups;
  if (pops.length) {
    c.custom_actions = [...(Array.isArray(c.custom_actions) ? c.custom_actions : [])];
    for (const p of pops) {
      const i = c.custom_actions.findIndex(a => a && a.name === p.name), base = i >= 0 ? c.custom_actions[i] : {};
      const btn = { ...base, type: 'button', name: p.name, icon: p.icon || base.icon || (p.card ? 'mdi:card-outline' : 'mdi:dots-grid'), label: p.label ?? base.label ?? 'More',
        tap_action: { action: 'fire-dom-event', event_type: POPUP_EVENT, popup: p.name }, hold_action: { action: 'none' }, double_tap_action: { action: 'none' } };
      if (p.styles) btn.styles = p.styles;
      if (p.look) btn.look = p.look;
      if (i >= 0) c.custom_actions[i] = btn; else c.custom_actions.push(btn);
    }
  }
  c.styles = [css, alias(c.styles)].filter(Boolean).join('\n') || undefined;
  if (Array.isArray(c.custom_actions)) {
    c.custom_actions = c.custom_actions.map(el => {
      if (!el || typeof el !== 'object') return el;
      const out = { ...el }, s = [elementCss(el), alias(el.styles)].filter(Boolean).join('\n');
      delete out.look;
      if (s) out.styles = s; else delete out.styles;
      for (const d of ['up', 'down', 'left', 'right']) if (out[d]?.styles) out[d] = { ...out[d], styles: alias(out[d].styles) };
      return out;
    });
  }
  return c;
}

/* ------------------------------------------------------------------ card */
const TEMPLATES = {
  arrows: { name: 'Arrow buttons', icon: 'mdi:gamepad', rows: [['back', 'home', 'menu', 'power'], ['navigation_buttons'], ['volume_buttons'], ['rewind', 'play_pause', 'fast_forward']] },
  touchpad: { name: 'Swipe touchpad', icon: 'mdi:gesture-swipe', rows: [['back', 'home', 'menu', 'power'], ['touchpad'], ['volume_buttons'], ['rewind', 'play_pause', 'fast_forward']] },
  simple: { name: 'Just power and volume', icon: 'mdi:power', rows: [['power'], ['volume_buttons']] },
  blank: { name: 'Empty - I’ll build my own', icon: 'mdi:plus-box-outline', rows: [[]] },
};

const nowPlayingFor = (hass, ids) => {        // One Stop 'now playing' sensors (Netflix etc. on an Apple TV in the same device/room)
  if (!hass) return null;
  const dev = id => hass.entities?.[id]?.device_id;
  const want = new Set(ids.filter(Boolean)), devs = new Set([...want].map(dev).filter(Boolean));
  for (const st of Object.values(hass.states)) {
    const a = st.attributes; if (!a?.one_stop_now_playing || !st.state || ['unknown', 'unavailable', ''].includes(st.state)) continue;
    if (want.has(a.media_player) || devs.has(dev(a.media_player))) return { title: st.state, ep: a.episode, profile: a.profile, service: a.service, sure: a.confidence === 'confirmed' };
  }
  return null;
};
const NP_CSS = '.os-np{display:flex;align-items:center;gap:10px;margin:0 0 10px;padding:10px 12px;border-radius:14px;background:rgba(229,9,20,.14);border:1px solid rgba(229,9,20,.4);font-size:14px;line-height:1.3}.os-np ha-icon{color:#e50914;--mdc-icon-size:22px;flex:none}.os-np b{display:block;font-size:15px}.os-np small{opacity:.75}';
class OneStopRemoteCard extends E.Card {
  static getConfigElement() { return document.createElement(EDITOR_TAG); }
  static getStubConfig() { return { type: 'custom:' + TAG, rows: clone(TEMPLATES.arrows.rows) }; }
  setConfig(config) {
    if (!config) throw new Error('Invalid configuration');
    this._raw = config;
    super.setConfig(compile(config));
    // The engine only re-reads layout, labels, icons and styles when Home Assistant updates; nudge it so edits show at once.
    if (this.hass) this.hass = { ...this.hass };
  }
  getGridOptions() { return { columns: 12, min_columns: 12 }; }
  updated(changed) {
    if (super.updated) super.updated(changed);
    if (!this._noNp) this._nowPlaying();
  }
  _nowPlaying() {                                 // 'Now playing' strip for apps that don't report titles (Netflix)
    const card = this.shadowRoot?.querySelector('ha-card'); if (!card) return;
    const r = this._raw || {}, np = nowPlayingFor(this.hass, [r.media_player_id, r.remote_id]);
    let el = card.querySelector(':scope > .os-np');
    if (!np) { el?.remove(); return; }
    if (!el) { el = document.createElement('div'); el.className = 'os-np'; card.prepend(el); if (!this.shadowRoot.querySelector('style[data-np]')) { const st = document.createElement('style'); st.dataset.np = ''; st.textContent = NP_CSS; this.shadowRoot.appendChild(st); } }
    const key = JSON.stringify(np); if (el.dataset.k === key) return; el.dataset.k = key;
    const esc2 = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    el.innerHTML = `<ha-icon icon="mdi:netflix"></ha-icon><div><b>${esc2(np.title)}</b><small>${esc2([np.ep, np.profile ? (np.sure ? '' : 'probably ') + np.profile + '’s profile' : ''].filter(Boolean).join(' · '))}</small></div>`;
  }
  connectedCallback() {
    super.connectedCallback();
    if (!this._popListen) {
      this._popListen = e => { const name = e.detail?.popup; if (name == null) return; e.stopPropagation(); this._openPopup(String(name)); };
      this.addEventListener(POPUP_EVENT, this._popListen);
    }
    if (!this._navListen) { this._navListen = () => this._closePopup(); window.addEventListener('location-changed', this._navListen); }
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._navListen) { window.removeEventListener('location-changed', this._navListen); this._navListen = null; }
    this._closePopup();
  }
  shouldUpdate(changed) {
    if (changed.has('hass') && this._popCard) this._popCard.hass = this.hass;
    return super.shouldUpdate(changed);
  }
  _openPopup(name) {
    const raw = this._raw || {}, p = popupList(raw).find(x => x.name === name);
    if (!p || !this.shadowRoot) return;
    let d = this._popDialog;
    if (!d || !d.isConnected) {
      d = this._popDialog = document.createElement('dialog');
      d.className = 'os-pop';
      d.innerHTML = `<style>${POPUP_CSS}</style><div class="grab"></div><div class="head"><span></span><button class="x" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button></div><div class="body"></div>`;
      d.addEventListener('click', e => { if (e.target === d) this._closePopup(); });
      d.querySelector('.x').addEventListener('click', () => this._closePopup());
      d.addEventListener('close', () => { if (!d.open) this._popCard = null; });
      this.shadowRoot.appendChild(d);
    }
    d.querySelector('.head span').textContent = p.title || p.label || 'More';
    d.style.width = p.width ? `min(${p.width},100vw)` : '';
    if (p.card && typeof p.card === 'object') {                     // any dashboard card, e.g. the Music card
      const token = this._popToken = {};
      d.querySelector('.body').replaceChildren();
      if (!d.open) { try { d.showModal(); } catch (e) { d.setAttribute('open', ''); } }
      (async () => {
        let el;
        try { const helpers = await window.loadCardHelpers(); el = helpers.createCardElement(p.card); }
        catch (e) { el = document.createElement('div'); el.textContent = 'Could not load this card: ' + (e?.message || e); }
        if (this._popToken !== token) return;
        el.hass = this.hass;
        d.querySelector('.body').replaceChildren(el);
        this._popCard = el;
      })();
      return;
    }
    this._popToken = null;
    const inner = document.createElement(TAG);
    inner._noNp = true;
    const cfg = { ...raw, rows: Array.isArray(p.rows) ? p.rows : [], title: undefined,
      styles: [raw.styles, 'ha-card{background:none;--ha-card-background:transparent;border:none;border-top:none;border-radius:0;box-shadow:none;padding:4px 2px 2px;backdrop-filter:none;-webkit-backdrop-filter:none;}'].filter(Boolean).join('\n') };
    delete cfg.grid_options; delete cfg.title;
    inner.setConfig(cfg);
    inner.hass = this.hass;
    d.querySelector('.body').replaceChildren(inner);
    this._popCard = inner;
    if (!d.open) { try { d.showModal(); } catch (e) { d.setAttribute('open', ''); } }
    if (this.hass && (raw.haptics ?? true) !== false) { try { navigator.vibrate?.(10); } catch (e) {} }
  }
  _closePopup() {
    const d = this._popDialog;
    if (d && d.open) { try { d.close(); } catch (e) { d.removeAttribute('open'); } }
    this._popCard = null;
  }
}
const POPUP_CSS = `
dialog.os-pop{border:none;padding:0 0 max(14px,env(safe-area-inset-bottom));margin:auto auto 0;width:min(560px,100vw);max-width:100vw;max-height:88vh;overflow:auto;box-sizing:border-box;
  border-radius:26px 26px 0 0;color:var(--primary-text-color);
  background:linear-gradient(160deg,rgba(255,255,255,.07),rgba(255,255,255,.015)),var(--ha-card-background,var(--card-background-color,#1f2228));
  backdrop-filter:blur(24px) saturate(1.2);-webkit-backdrop-filter:blur(24px) saturate(1.2);
  border-top:1px solid color-mix(in srgb,var(--primary-text-color) 16%,transparent);box-shadow:0 -12px 40px rgba(0,0,0,.45);animation:ospop .22s cubic-bezier(.2,.8,.2,1)}
dialog.os-pop::backdrop{background:rgba(0,0,0,.45);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}
@media (min-width:700px){dialog.os-pop{margin:auto;border-radius:26px;border:1px solid color-mix(in srgb,var(--primary-text-color) 16%,transparent);padding-bottom:14px}}
@keyframes ospop{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}
.grab{width:42px;height:5px;border-radius:3px;background:color-mix(in srgb,var(--primary-text-color) 30%,transparent);margin:10px auto 0}
@media (min-width:700px){.grab{display:none}}
.head{display:flex;align-items:center;gap:10px;padding:12px 16px 4px 22px}
.head span{flex:1;font-size:19px;font-weight:650}
.x{width:44px;height:44px;border-radius:50%;border:none;cursor:pointer;display:grid;place-items:center;color:inherit;background:color-mix(in srgb,var(--primary-text-color) 10%,transparent)}
.x ha-icon{--mdc-icon-size:22px}
.body{padding:0 10px}
`;

/* ------------------------------------------------------------------ editor helpers */
const SPECIAL = {
  navigation_buttons: ['Arrow buttons', 'mdi:gamepad', 'Up, down, left, right and OK', ['up', 'down', 'left', 'right', 'center']],
  dpad: ['Arrow buttons (tight grid)', 'mdi:gamepad-variant', 'The same five buttons, closer together', ['up', 'down', 'left', 'right', 'center']],
  volume_buttons: ['Volume buttons', 'mdi:volume-high', 'Down, mute and up', ['volume_down', 'volume_mute', 'volume_up']],
  numpad: ['Number pad', 'mdi:dialpad', '1 to 9', ['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'n9']],
  dialpad: ['Number pad (7-8-9 on top)', 'mdi:dialpad', '', ['n7', 'n8', 'n9', 'n4', 'n5', 'n6', 'n1', 'n2', 'n3']],
  xpad: ['A B X Y buttons', 'mdi:gamepad-round', 'Game controller layout', ['y', 'x', 'b', 'a']],
  npad: ['A B X Y buttons (Nintendo)', 'mdi:gamepad-round-outline', '', ['x', 'y', 'a', 'b']],
};
const PADS = {
  touchpad: ['Touchpad', 'mdi:gesture-swipe', 'Swipe to move, tap for OK'],
  circlepad: ['Round arrow pad', 'mdi:gamepad-circle', 'Five buttons in a circle'],
  clickwheel: ['Click wheel', 'mdi:radiobox-marked', 'iPod-style wheel for media and volume'],
  dragpad: ['Drag pad', 'mdi:gesture-swipe-horizontal', 'Drag your finger to move'],
  mousepad: ['Mouse pad', 'mdi:mouse', 'Moves a mouse pointer'],
  slider: ['Volume slider', 'mdi:volume-source', 'Slide to set the volume'],
};
const NICE = { center: 'OK', volume_mute: 'Mute', play_pause: 'Play / Pause', n0: '0', n1: '1', n2: '2', n3: '3', n4: '4', n5: '5', n6: '6', n7: '7', n8: '8', n9: '9' };
const nice = name => SPECIAL[name]?.[0] || PADS[name]?.[0] || NICE[name] || String(name).replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const TYPE_WORD = { button: 'button', slider: 'slider', touchpad: 'touchpad', circlepad: 'round pad' };
const DIRS = [['up', 'Up'], ['down', 'Down'], ['left', 'Left'], ['right', 'Right']];

const sel = (options, extra) => ({ select: { mode: 'dropdown', options: options.map(([value, label]) => ({ value, label })), ...(extra || {}) } });
const toggle = { boolean: {} };
// Dropdowns always have a choice, so they get no confusing “clear” button.
const req = schema => schema.map(s => (s.schema ? { ...s, schema: req(s.schema) } : s.selector?.select && !s.selector.select.multiple ? { ...s, required: true } : s));
const OTHER = '__other';

/* What an action does, in plain words. `slots` says where the choice is offered. */
const KINDS = [
  ['none', 'Nothing', 'all'],
  ['key', 'Press a remote button', 'btn'],
  ['source', 'Open an app or input', 'btn'],
  ['volume', 'Set a speaker’s volume', 'slider'],
  ['brightness', 'Set a light’s brightness', 'slider'],
  ['number', 'Set a number (helper or setting)', 'slider'],
  ['cover', 'Set a shade or blind position', 'slider'],
  ['toggle', 'Turn something on or off', 'btn'],
  ['service', 'Do something in Home Assistant', 'all'],
  ['navigate', 'Go to a page or open a pop-up', 'btn'],
  ['more-info', 'Show a device’s details', 'btn'],
  ['url', 'Open a website', 'btn'],
  ['assist', 'Talk to the voice assistant', 'btn'],
  ['keyboard', 'Type on the TV as you go', 'btn'],
  ['textbox', 'Send a line of text to the TV', 'btn'],
  ['search', 'Search on the TV', 'btn'],
  ['repeat', 'Keep repeating the tap', 'hold'],
  ['yaml', 'Advanced - write it yourself (YAML)', 'all'],
];
const SLIDER_KINDS = {
  volume: { service: 'media_player.volume_set', field: 'volume_level', tpl: '{{ value | float }}', domain: ['media_player'], attr: 'volume_level', range: [0, 1], step: 0.01 },
  brightness: { service: 'light.turn_on', field: 'brightness_pct', tpl: '{{ value | int }}', domain: ['light'], attr: 'brightness', range: [0, 100], step: 1 },
  cover: { service: 'cover.set_cover_position', field: 'position', tpl: '{{ value | int }}', domain: ['cover'], attr: 'current_position', range: [0, 100], step: 1 },
  number: { service: 'number.set_value', field: 'value', tpl: '{{ value | float }}', domain: ['number', 'input_number'] },
};
const TIMING = ['hold_time', 'repeat_delay', 'double_tap_window'];
const ALLOWED = { none: [], repeat: [], key: ['key'], source: ['source'], 'perform-action': ['perform_action', 'data', 'target'], navigate: ['navigation_path'], url: ['url_path'], 'more-info': ['target'], toggle: ['target'], assist: ['pipeline_id', 'start_listening'], keyboard: ['keyboard_prompt'], textbox: ['keyboard_prompt'], search: ['keyboard_prompt'] };
const deepTpl = o => (typeof o === 'string' ? hasTpl(o) : o && typeof o === 'object' ? Object.values(o).some(deepTpl) : false);
const oneEntity = t => !t || (Object.keys(t).every(k => k === 'entity_id') && (t.entity_id == null || typeof t.entity_id === 'string'));

function actionToForm(a, sticky) {
  if (!a || typeof a !== 'object' || !a.action) return { kind: 'none' };
  const f = {};
  for (const k of TIMING) if (a[k] != null) f[k] = a[k];
  if (a.confirmation === true) f.confirm = true;
  else if (a.confirmation && typeof a.confirmation === 'object' && Object.keys(a.confirmation).every(k => k === 'text')) { f.confirm = true; f.confirm_text = a.confirmation.text; }
  const action = a.action === 'call-service' ? 'perform-action' : a.action;
  const known = ALLOWED[action];
  const extra = known ? Object.keys(a).filter(k => !['action', 'confirmation', ...TIMING, ...known].includes(k) && a[k] != null) : ['?'];
  const odd = extra.length || (a.confirmation && !f.confirm) || a.action === 'call-service';
  const asYaml = () => ({ kind: 'yaml', yaml: a });
  if (sticky || odd) return asYaml();
  if (action === 'perform-action') {
    for (const [kind, d] of Object.entries(SLIDER_KINDS)) {
      const svc = a.perform_action === d.service || (kind === 'number' && a.perform_action === 'input_number.set_value');
      if (svc && a.data && Object.keys(a.data).length === 1 && hasTpl(a.data[d.field]) && /\bvalue\b/.test(a.data[d.field]) && oneEntity(a.target) && !hasTpl(a.target?.entity_id))
        return { ...f, kind, entity: a.target?.entity_id };
    }
    if (deepTpl(a.data) || deepTpl(a.target) || hasTpl(a.perform_action)) return asYaml();
    return { ...f, kind: 'service', ha: { action: 'perform-action', perform_action: a.perform_action, ...(a.target ? { target: a.target } : {}), ...(a.data ? { data: a.data } : {}) } };
  }
  if (action === 'more-info' || action === 'toggle') { if (!oneEntity(a.target)) return asYaml(); return { ...f, kind: action, entity: a.target?.entity_id }; }
  const g = { ...f, kind: action };
  for (const k of known) if (a[k] != null) g[k] = a[k];
  return g;
}

function formToAction(v, prev) {
  const kind = v.kind || 'none';
  if (kind === 'yaml') {
    if (v.yaml && typeof v.yaml === 'object' && v.yaml.action) return v.yaml;
    return prev && prev.action ? prev : { action: 'none' };
  }
  let a;
  if (kind === 'service') { const h = v.ha || {}; a = { action: 'perform-action', ...(h.perform_action ? { perform_action: h.perform_action } : {}), ...(h.target && Object.keys(h.target).length ? { target: h.target } : {}), ...(h.data && Object.keys(h.data).length ? { data: h.data } : {}) }; }
  else if (SLIDER_KINDS[kind]) {
    const d = SLIDER_KINDS[kind];
    const service = kind === 'number' && String(v.entity || '').startsWith('input_number.') ? 'input_number.set_value' : d.service;
    a = { action: 'perform-action', perform_action: service, ...(v.entity ? { target: { entity_id: v.entity } } : {}), data: { [d.field]: d.tpl } };
  }
  else if (kind === 'more-info' || kind === 'toggle') a = { action: kind, ...(v.entity ? { target: { entity_id: v.entity } } : {}) };
  else { a = { action: kind }; for (const k of ALLOWED[kind] || []) if (v[k] != null && v[k] !== '') a[k] = v[k]; }
  if (kind !== 'none' && kind !== 'repeat' && v.confirm) a.confirmation = v.confirm_text ? { text: v.confirm_text } : true;
  for (const k of TIMING) if (v[k] != null && v[k] !== '') a[k] = v[k];
  return a;
}

/* ------------------------------------------------------------------ editor */
const CSS = `
:host{display:block;font-size:15px;line-height:1.4;color:var(--primary-text-color)}
*{box-sizing:border-box}
button{font:inherit;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:14px}
.tab{border:1px solid var(--divider-color);background:transparent;border-radius:14px;padding:8px 4px;min-height:58px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-weight:600;font-size:13px}
.tab ha-icon{--mdc-icon-size:22px}
.tab.on{background:var(--primary-color);border-color:var(--primary-color);color:var(--text-primary-color,#fff)}
.note{margin:0 0 14px;padding:11px 13px;border-radius:12px;background:rgba(var(--rgb-primary-color,3,169,244),.12);font-size:14px}
.note b{font-weight:650}
h3{margin:18px 0 8px;font-size:16px;font-weight:650}
h3:first-child{margin-top:0}
.sub{font-size:13px;opacity:.72;margin:-4px 0 10px}
.rowbox{border:1px solid var(--divider-color);border-radius:16px;padding:10px;margin-bottom:10px;background:rgba(127,127,127,.05)}
.rowhead{display:flex;align-items:center;gap:6px;margin-bottom:8px;font-weight:650;font-size:14px}
.rowhead .sp{flex:1}
.ib{width:38px;height:38px;border-radius:10px;border:1px solid var(--divider-color);background:transparent;display:inline-flex;align-items:center;justify-content:center;padding:0}
.ib ha-icon{--mdc-icon-size:20px}
.ib[disabled]{opacity:.3;cursor:default}
.grp{display:flex;gap:6px;flex-wrap:wrap;align-items:stretch}
.grp.c{flex-direction:column;flex-wrap:nowrap}
.nest{border:1px dashed var(--divider-color);border-radius:12px;padding:6px;display:flex;flex-direction:column;gap:6px;flex:1 1 auto;min-width:96px}
.nest.on{border-color:var(--primary-color);border-style:solid}
.nesthead{align-self:flex-start;border:none;background:none;padding:2px 4px;font-size:12px;font-weight:650;opacity:.75;text-transform:uppercase;letter-spacing:.4px}
.chip{min-height:54px;min-width:64px;max-width:150px;flex:1 1 64px;border:1px solid var(--divider-color);background:var(--card-background-color,rgba(127,127,127,.1));border-radius:12px;padding:6px 8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:12px;font-weight:550;text-align:center;overflow:hidden}
.chip span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.chip ha-icon,.chip svg{--mdc-icon-size:22px;width:22px;height:22px;flex:none}
.chip svg{fill:currentColor}
.chip.wide{flex-basis:100%;max-width:none;flex-direction:row;gap:8px;font-size:13px}
.chip.on{border-color:var(--primary-color);box-shadow:0 0 0 2px var(--primary-color) inset}
.chip.add{flex:0 0 54px;min-width:54px;border-style:dashed;font-size:24px;font-weight:400;color:var(--primary-color)}
.grp.c>.chip{flex:0 0 auto;max-width:none}
.tool{margin-top:10px;padding:10px;border-radius:12px;background:rgba(var(--rgb-primary-color,3,169,244),.12)}
.tname{font-weight:650;margin-bottom:8px;display:flex;align-items:center;gap:8px}
.tname small{font-weight:400;opacity:.7}
.tbtns{display:flex;gap:6px;flex-wrap:wrap}
.btn{min-height:44px;padding:0 14px;border-radius:12px;border:1px solid var(--divider-color);background:var(--card-background-color,transparent);font-weight:600;font-size:14px;display:inline-flex;align-items:center;gap:6px}
.btn ha-icon{--mdc-icon-size:19px}
.btn.pri{background:var(--primary-color);border-color:var(--primary-color);color:var(--text-primary-color,#fff)}
.btn.warn{color:var(--error-color,#db4437)}
.btn.big{width:100%;justify-content:center;min-height:50px;border-style:dashed;color:var(--primary-color)}
.btn[disabled]{opacity:.35;cursor:default}
.inner{margin-top:8px;font-size:13px}
.inner .tbtns{margin-top:6px}
.back{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.back b{font-size:16px;font-weight:650;display:flex;align-items:center;gap:8px;min-width:0}
.search{width:100%;height:46px;border-radius:12px;border:1px solid var(--divider-color);background:var(--card-background-color,transparent);color:inherit;font:inherit;padding:0 14px;margin-bottom:6px}
.picks{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:6px}
.pick{min-height:62px;border:1px solid var(--divider-color);background:var(--card-background-color,rgba(127,127,127,.1));border-radius:12px;padding:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font-size:12px;font-weight:550;text-align:center}
.pick ha-icon,.pick svg{--mdc-icon-size:22px;width:22px;height:22px}
.pick svg{fill:currentColor}
.pick small{font-weight:400;opacity:.7;font-size:11px;line-height:1.2}
.pick.row{flex-direction:row;justify-content:flex-start;text-align:left;gap:10px;padding:8px 12px;font-size:14px}
.pick.row div{display:flex;flex-direction:column}
.picks.list{grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
.added{position:sticky;bottom:0;margin-top:12px;padding:10px 12px;border-radius:12px;background:var(--primary-color);color:var(--text-primary-color,#fff);font-weight:600;display:flex;align-items:center;gap:10px}
.added span{flex:1}
.added .btn{background:rgba(255,255,255,.2);border-color:transparent;color:inherit}
details.sec{border:1px solid var(--divider-color);border-radius:14px;margin-bottom:10px;overflow:hidden}
details.sec>summary{list-style:none;cursor:pointer;padding:13px 14px;font-weight:650;font-size:15px;display:flex;align-items:center;gap:10px}
details.sec>summary::-webkit-details-marker{display:none}
details.sec>summary ha-icon{--mdc-icon-size:21px;opacity:.85}
details.sec>summary .sp{flex:1}
details.sec>summary .chev{transition:transform .15s}
details.sec[open]>summary .chev{transform:rotate(180deg)}
details.sec>summary small{font-weight:400;opacity:.7;font-size:13px}
.secbody{padding:2px 14px 14px}
.act{border-radius:12px;background:rgba(127,127,127,.07);padding:10px 12px;margin-bottom:8px}
.act>b{display:block;font-weight:650;font-size:14px;margin-bottom:6px}
.tmpl{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
ha-form{display:block}
`;

class OneStopRemoteCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._tab = null; this._forms = []; this._open = new Set(['look', 'does']); this._sticky = new Set(); this._other = new Set();
    this.shadowRoot.addEventListener('click', e => this._click(e));
    this.shadowRoot.addEventListener('input', e => { if (e.target.id === 'q') { this._q = e.target.value; this._fillPicker(); } });
    this.shadowRoot.addEventListener('toggle', e => { const id = e.target?.dataset?.sec; if (id) e.target.open ? this._open.add(id) : this._open.delete(id); }, true);
  }
  connectedCallback() {
    // Home Assistant only loads its device picker on demand; ask for it so the pickers always appear.
    if (customElements.get('ha-entity-picker') || this._loading) return;
    this._loading = (async () => {
      try { const h = await window.loadCardHelpers?.(); const c = await h?.createCardElement({ type: 'entities', entities: [] }); await c?.constructor?.getConfigElement?.(); } catch (e) { /* pickers load later */ }
    })();
  }
  setConfig(config) {
    const j = JSON.stringify(config);
    if (j === this._json) return;
    this._json = j; this._config = clone(config) || {};
    if (Array.isArray(this._config.rows)) this._config.rows = this._config.rows.map(x => (Array.isArray(x) ? x : [x]));
    if (this._scope != null && !this._popup(this._scope)) this._scope = null;
    if (this._tab == null) this._tab = (this._config.remote_id || this._config.media_player_id || this._config.custom_actions?.length) ? 'buttons' : 'device';
    this._render();
  }
  set hass(hass) {
    const first = !this._hass; this._hass = hass;
    for (const f of this._forms) f.el.hass = hass;
    if (first) this._render();
  }

  /* ---------- data helpers ---------- */
  get _platform() { const p = this._config.platform; return !p || hasTpl(p) || !E.Platforms.includes(p) ? 'Android TV' : p; }
  _defaults() {
    const p = this._platform;
    if (this._defP !== p) { const [keys, sources] = E.getDefaultActions(p); this._defP = p; this._keys = keys; this._sources = sources; }
    return [this._keys, this._sources];
  }
  _custom(name) { return (this._config.custom_actions || []).find(a => a && a.name === name); }
  _default(name) { const [k, s] = this._defaults(); return k.find(a => a.name === name) || s.find(a => a.name === name); }
  _el(name) { return this._custom(name) || this._default(name) || null; }
  _ensure(name) {                                           // custom copy of an element, created on first change
    let el = this._custom(name);
    if (!el) { el = clone(this._default(name)) || { type: 'button', name }; el.name = name; (this._config.custom_actions = this._config.custom_actions || []).push(el); }
    return el;
  }
  _popups() { return popupList(this._config); }
  _popup(name) { return this._popups().find(p => p.name === name); }
  _scopePop() { return this._scope != null ? this._popup(this._scope) : null; }
  _rootRows() { const p = this._scopePop(); return p ? p.rows : this._config.rows; }
  _setRows(r) { const p = this._scopePop(); if (p) p.rows = r; else this._config.rows = r; }
  _rows() { const r = this._rootRows(); return (Array.isArray(r) ? r : []).map(x => (Array.isArray(x) ? x : [x])); }
  _allRows() { return [this._config.rows || [], ...this._popups().map(p => p.rows || [])]; }
  _at(path) { let n = this._rootRows(); for (const i of path) n = n?.[i]; return n; }
  _parent(path) { return this._at(path.slice(0, -1)); }
  _icon(icon, fallback) {
    if (!icon || hasTpl(icon)) return `<ha-icon icon="${fallback || 'mdi:gesture-tap-button'}"></ha-icon>`;
    if (/^[\w-]+:[\w-]+$/.test(icon)) return `<ha-icon icon="${esc(icon)}"></ha-icon>`;
    const svg = (this._config.custom_icons || []).find(i => i.name === icon) || E.defaultIcons.find(i => i.name === icon);
    return svg ? `<svg viewBox="0 0 24 24"><path d="${esc(svg.path)}"></path></svg>` : `<ha-icon icon="${fallback || 'mdi:gesture-tap-button'}"></ha-icon>`;
  }
  _iconFor(name) {
    if (SPECIAL[name]) return this._icon(SPECIAL[name][1]);
    const pop = this._popup(name);
    if (pop) return this._icon(pop.icon || 'mdi:dots-grid');
    const el = this._el(name);
    if (!el) return this._icon(null, 'mdi:border-none-variant');
    return this._icon(el.icon, PADS[name]?.[1] || { slider: 'mdi:tune-variant', touchpad: 'mdi:gesture-swipe', circlepad: 'mdi:gamepad-circle' }[el.type] || (el.label ? 'mdi:format-text' : undefined));
  }
  _label(name) {
    const pop = this._popup(name);
    if (pop) return String(pop.label || 'More');
    const c = this._custom(name);
    if (c && c.label && !hasTpl(c.label) && !this._default(name)) return String(c.label);
    return nice(name);
  }
  _kindWord(name) {
    if (hasTpl(name)) return 'template';
    if (this._popup(name)) { const n = JSON.stringify(this._popup(name).rows || []).match(/"[^"]*"/g)?.length || 0; return `pop-up with ${n} button${n === 1 ? '' : 's'}`; }
    if (SPECIAL[name]) return 'set of buttons';
    const el = this._el(name);
    if (!el) return 'empty space';
    const t = TYPE_WORD[el.type || 'button'];
    return this._custom(name) ? (this._default(name) ? `built-in ${t}, changed by you` : `your own ${t}`) : `built-in ${t}`;
  }

  /* ---------- saving ---------- */
  _clean() {
    const c = this._config;
    for (const k of Object.keys(c)) if (c[k] === '' || c[k] == null || (k === 'look' && !Object.keys(c[k]).length) || (Array.isArray(c[k]) && !c[k].length && k !== 'rows')) delete c[k];
    for (const el of c.custom_actions || []) if (el.look && !Object.keys(el.look).length) delete el.look;
  }
  _commit(full) {
    this._clean();
    this._json = JSON.stringify(this._config);
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: clone(this._config) }, bubbles: true, composed: true }));
    if (full) this._render(); else this._refresh();
  }
  _refresh() { for (const f of this._forms) { f.el.schema = f.def.schema(); f.el.data = f.def.data(); } if (this._dyn) this._dyn(); }

  /* ---------- building blocks ---------- */
  _html(parent, html) { const t = document.createElement('template'); t.innerHTML = html.trim(); const n = t.content.firstElementChild; parent.appendChild(t.content); return n; }
  _form(parent, def) {
    const el = document.createElement('ha-form');
    el.hass = this._hass;
    el.computeLabel = s => s.label ?? s.title ?? s.name;
    el.computeHelper = s => s.helper;
    const schema = def.schema; def.schema = () => req(schema());
    el.schema = def.schema(); el.data = def.data();
    el.addEventListener('value-changed', ev => { ev.stopPropagation(); const full = def.change(ev.detail.value); this._commit(!!full); });
    parent.appendChild(el);
    this._forms.push({ el, def });
    return el;
  }
  _section(parent, id, title, icon, hint) {
    const d = this._html(parent, `<details class="sec" data-sec="${id}" ${this._open.has(id) ? 'open' : ''}><summary><ha-icon icon="${icon}"></ha-icon><span>${esc(title)}${hint ? `<br><small>${esc(hint)}</small>` : ''}</span><span class="sp"></span><ha-icon class="chev" icon="mdi:chevron-down"></ha-icon></summary><div class="secbody"></div></details>`);
    return d.querySelector('.secbody');
  }

  _render() {
    if (!this._config || !this._hass) return;
    const root = this.shadowRoot;
    this._forms = []; this._dyn = null;
    const tabs = [['device', 'Device', 'mdi:television'], ['buttons', 'Buttons', 'mdi:remote'], ['look', 'Look', 'mdi:palette-outline'], ['more', 'More', 'mdi:tune']];
    root.innerHTML = `<style>${CSS}</style><div class="tabs">${tabs.map(([id, name, icon]) => `<button class="tab ${this._tab === id ? 'on' : ''}" data-act="tab" data-tab="${id}"><ha-icon icon="${icon}"></ha-icon>${name}</button>`).join('')}</div><div id="body"></div>`;
    const body = root.getElementById('body');
    if (this._tab === 'device') this._viewDevice(body);
    else if (this._tab === 'look') this._viewLook(body);
    else if (this._tab === 'more') this._viewMore(body);
    else if (this._picker) this._viewPicker(body);
    else if (this._edit && (this._el(this._edit) || this._custom(this._edit))) this._viewElement(body);
    else { this._edit = null; this._viewLayout(body); }
  }

  /* ---------- tab 1: device ---------- */
  _viewDevice(body) {
    this._html(body, '<div class="note"><b>What does this remote control?</b> Pick the device and the buttons on the next tab are set up for it automatically.</div>');
    const feat = () => E.PlatformConfig[this._platform] || {};
    this._form(body, {
      schema: () => {
        const f = feat(), p = this._platform, s = [];
        s.push({ name: 'platform', label: 'Kind of device', selector: sel(E.Platforms.map(x => [x, x === 'Generic Remote' ? 'Something else (infrared / RF blaster)' : x])) });
        if (f.remote_id) s.push({ name: 'remote_id', label: 'Its remote', helper: 'Starts with “remote.” - this is what sends the button presses.', selector: { entity: { filter: { domain: 'remote' } } } });
        if (f.media_player_id) s.push({ name: 'media_player_id', label: 'Its media player', helper: 'Used for the volume slider and for opening apps and inputs.', selector: { entity: { filter: { domain: 'media_player' } } } });
        if (['Android TV', 'Sony BRAVIA', 'Fire TV'].includes(p)) s.push({ name: 'keyboard_id', label: 'Android Debug Bridge entity (for typing and search)', helper: 'Only needed if you want the keyboard or search buttons.', selector: { entity: { filter: { domain: ['remote', 'media_player'] } } } });
        if (p === 'Apple TV') s.push({ name: 'config_entry_id', label: 'Apple TV (for the keyboard button)', selector: { config_entry: { integration: 'apple_tv' } } });
        if (f.device) s.push({ name: 'device', label: p === 'Unified Remote' ? 'Unified Remote server name' : 'Device name on the blaster', helper: p === 'Unified Remote' ? '' : 'The device name you used when learning the commands.', selector: { text: {} } });
        if (f.mac) s.push({ name: 'mac', label: 'MAC address (to switch it on over the network)', helper: 'Optional. Used by the “Wake On Lan” button.', selector: { text: {} } });
        s.push({ name: 'title', label: 'Title above the remote (optional)', selector: { text: {} } });
        return s;
      },
      data: () => ({ ...this._config, platform: this._platform }),
      change: v => {
        const c = this._config, before = this._platform;
        for (const k of ['remote_id', 'media_player_id']) {
          if (v[k] && v[k] !== c[k] && !c.platform) { const p = E.platforms[this._hass.entities?.[v[k]]?.platform]; if (p) v.platform = p; }
        }
        for (const k of ['platform', 'remote_id', 'media_player_id', 'keyboard_id', 'config_entry_id', 'device', 'mac', 'title']) { if (v[k] == null || v[k] === '') delete c[k]; else c[k] = v[k]; }
        return this._platform !== before;
      },
    });
    this._html(body, '<div style="margin-top:14px"><button class="btn pri" data-act="tab" data-tab="buttons">Next: choose the buttons <ha-icon icon="mdi:arrow-right"></ha-icon></button></div>');
  }

  /* ---------- tab 2: buttons (layout) ---------- */
  _chip(name, path, on) {
    const wide = SPECIAL[name] || ['touchpad', 'slider', 'circlepad'].includes(this._el(name)?.type);
    return `<button class="chip ${wide ? 'wide' : ''} ${on ? 'on' : ''}" data-act="sel" data-path="${path.join(',')}" title="${esc(name)}">${this._iconFor(name)}<span>${esc(hasTpl(name) ? 'Template' : this._el(name) || SPECIAL[name] || this._popup(name) ? this._label(name) : 'Empty space')}</span></button>`;
  }
  _group(arr, path, isRow) {
    const selp = (this._sel || []).join(',');
    const items = (Array.isArray(arr) ? arr : [arr]).map((item, i) => {
      const p = [...path, i];
      if (Array.isArray(item)) return `<div class="nest ${selp === p.join(',') ? 'on' : ''}"><button class="nesthead" data-act="sel" data-path="${p.join(',')}">${isRow ? 'Stack' : 'Side by side'} ⋯</button>${this._group(item, p, !isRow)}</div>`;
      return this._chip(item, p, selp === p.join(','));
    }).join('');
    return `<div class="grp ${isRow ? 'r' : 'c'}">${items}<button class="chip add" data-act="add" data-path="${path.join(',')}" title="Add here">＋</button></div>`;
  }
  _toolbar() {
    const p = this._sel, item = this._at(p), parent = this._parent(p), i = p[p.length - 1];
    const isGroup = Array.isArray(item), name = isGroup ? null : item;
    const head = isGroup ? `<ha-icon icon="mdi:view-grid-outline"></ha-icon>Group of ${item.length} ` : `${this._iconFor(name)}${esc(this._el(name) || SPECIAL[name] || this._popup(name) ? this._label(name) : 'Empty space')} <small>${esc(this._kindWord(name))}</small>`;
    const canEdit = name && !SPECIAL[name] && !hasTpl(name) && this._el(name);
    let inner = '';
    if (name && SPECIAL[name]) inner = `<div class="inner">Change one of its buttons:<div class="tbtns">${[...new Set(SPECIAL[name][3])].filter(n => this._el(n)).map(n => `<button class="btn" data-act="edit" data-name="${n}">${this._iconFor(n)}${esc(nice(n))}</button>`).join('')}</div></div>`;
    return `<div class="tool"><div class="tname">${head}</div><div class="tbtns">
      ${name && this._popup(name) ? `<button class="btn pri" data-act="scope" data-name="${esc(name)}"><ha-icon icon="mdi:open-in-app"></ha-icon>Open and change it</button>` : canEdit ? `<button class="btn pri" data-act="edit" data-name="${esc(name)}"><ha-icon icon="mdi:pencil"></ha-icon>Change it</button>` : ''}
      <button class="btn" data-act="move" data-d="-1" ${i === 0 ? 'disabled' : ''}><ha-icon icon="mdi:arrow-left"></ha-icon>Move</button>
      <button class="btn" data-act="move" data-d="1" ${i >= parent.length - 1 ? 'disabled' : ''}>Move<ha-icon icon="mdi:arrow-right"></ha-icon></button>
      <button class="btn warn" data-act="remove"><ha-icon icon="mdi:close"></ha-icon>Take off</button>
    </div>${inner}</div>`;
  }
  _viewLayout(body) {
    const rows = this._rows(), pop = this._scopePop();
    if (pop) return this._viewPopup(body, pop, rows);
    if (!rows.length || (rows.length === 1 && !rows[0].length && !(this._config.custom_actions || []).length)) {
      this._html(body, '<div class="note"><b>Start with a ready-made remote</b>, then change anything you like.</div>');
      this._templates(body);
      if (!rows.length) return;
    }
    this._html(body, '<div class="note"><b>This is your remote, row by row.</b> Tap a button to change, move or remove it. Tap <b>＋</b> to add one.</div>');
    this._rowsBlock(body, rows);
    this._html(body, `<h3 style="margin-top:22px">Pop-ups</h3><div class="sub">Tuck buttons you use less often behind one button. Tapping it slides up a panel with them.</div>
      <div class="tbtns">${this._popups().map(p => `<button class="btn" data-act="scope" data-name="${esc(p.name)}">${this._icon(p.icon || 'mdi:dots-grid')}${esc(p.label || 'More')}</button>`).join('')}
      <button class="btn" data-act="pop-new"><ha-icon icon="mdi:plus"></ha-icon>New pop-up</button></div>`);
  }
  _rowsBlock(body, rows) {
    const n = rows.length;
    rows.forEach((row, i) => {
      const selHere = this._sel && this._sel[0] === i && this._at(this._sel) !== undefined;
      this._html(body, `<div class="rowbox"><div class="rowhead"><span>Row ${i + 1}</span><span class="sp"></span>
        <button class="ib" data-act="row-move" data-i="${i}" data-d="-1" title="Move row up" ${i === 0 ? 'disabled' : ''}><ha-icon icon="mdi:arrow-up"></ha-icon></button>
        <button class="ib" data-act="row-move" data-i="${i}" data-d="1" title="Move row down" ${i === n - 1 ? 'disabled' : ''}><ha-icon icon="mdi:arrow-down"></ha-icon></button>
        <button class="ib" data-act="row-del" data-i="${i}" title="Delete row"><ha-icon icon="mdi:trash-can-outline"></ha-icon></button></div>
        ${this._group(row, [i], true)}${selHere ? this._toolbar() : ''}</div>`);
    });
    this._html(body, '<button class="btn big" data-act="row-add"><ha-icon icon="mdi:plus"></ha-icon>Add a row</button>');
  }
  _viewPopup(body, pop, rows) {
    this._html(body, `<div class="back"><button class="btn" data-act="scope-done"><ha-icon icon="mdi:arrow-left"></ha-icon>Back</button><b>${this._icon(pop.icon || 'mdi:dots-grid')}Pop-up: ${esc(pop.label || 'More')}</b></div>`);
    const look = this._section(body, 'poplook', 'Its button on the remote', 'mdi:gesture-tap-button');
    this._form(look, {
      schema: () => [{ name: 'label', label: 'Words on the button', selector: { text: {} } }, { name: 'icon', label: 'Icon', selector: { icon: {} } },
        { name: 'title', label: 'Heading at the top of the pop-up (optional)', selector: { text: {} } }],
      data: () => { const p = this._scopePop() || {}; return { label: p.label, icon: p.icon, title: p.title }; },
      change: v => { const p = this._scopePop(); if (!p) return false; for (const k of ['label', 'icon', 'title']) { if (v[k]) p[k] = v[k]; else delete p[k]; } return false; },
    });
    this._html(body, '<div class="note"><b>These buttons appear in the pop-up.</b> Tap a button to change, move or remove it. Tap <b>＋</b> to add one.</div>');
    this._rowsBlock(body, rows);
    this._html(body, '<div class="tbtns" style="margin-top:14px"><button class="btn warn" data-act="pop-del"><ha-icon icon="mdi:trash-can-outline"></ha-icon>Delete this pop-up</button></div>');
  }
  _templates(body) {
    this._html(body, `<div class="tmpl">${Object.entries(TEMPLATES).map(([id, t]) => `<button class="pick" data-act="template" data-id="${id}"><ha-icon icon="${t.icon}"></ha-icon>${esc(t.name)}</button>`).join('')}</div>`);
  }

  /* ---------- picker ---------- */
  _viewPicker(body) {
    const p = this._picker;
    this._html(body, `<div class="back"><button class="btn" data-act="picker-done"><ha-icon icon="mdi:arrow-left"></ha-icon>Back</button><b>Add to row ${p[0] + 1}${this._scopePop() ? ' of the pop-up' : ''}</b></div>`);
    const q = this._html(body, `<input class="search" id="q" type="search" placeholder="Search - try “power”, “netflix”, “volume”…" autocomplete="off">`);
    q.value = this._q || '';
    this._html(body, '<div id="plist"></div>');
    this._html(body, `<div class="added" id="added" ${this._added ? '' : 'hidden'}><span></span><button class="btn" data-act="picker-done">Done</button></div>`);
    this._fillPicker();
  }
  _fillPicker() {
    const list = this.shadowRoot.getElementById('plist'); if (!list) return;
    const q = (this._q || '').trim().toLowerCase(), [keys, sources] = this._defaults();
    const match = (...t) => !q || t.some(x => String(x || '').toLowerCase().includes(q));
    const pick = (name, label, sub) => `<button class="pick" data-act="pick" data-name="${esc(name)}">${this._iconFor(name)}<span>${esc(label)}</span>${sub ? `<small>${esc(sub)}</small>` : ''}</button>`;
    const row = (act, attrs, icon, label, sub) => `<button class="pick row" data-act="${act}" ${attrs}><ha-icon icon="${icon}"></ha-icon><div><span>${esc(label)}</span>${sub ? `<small>${esc(sub)}</small>` : ''}</div></button>`;
    const out = [];
    const mine = (this._config.custom_actions || []).filter(a => a?.name && !this._default(a.name) && match(a.name, a.label));
    const make = [['button', 'mdi:gesture-tap-button', 'A new button of my own', 'Runs anything in Home Assistant, opens a page, and more'], ['slider', 'mdi:tune-variant', 'A new slider', 'Volume, brightness, a shade…'], ['touchpad', 'mdi:gesture-swipe', 'A new touchpad', 'With your own swipe actions'], ['circlepad', 'mdi:gamepad-circle', 'A new round pad', 'Five buttons in a circle']]
      .filter(m => match(m[2], m[3]));
    if (make.length) out.push('<h3>Make something new</h3>', `<div class="picks list">${make.map(m => row('new', `data-type="${m[0]}"`, m[1], m[2], m[3])).join('')}</div>`);
    if (mine.length) out.push('<h3>Your own</h3>', `<div class="picks">${mine.map(a => pick(a.name, this._label(a.name), TYPE_WORD[a.type || 'button'])).join('')}</div>`);
    const big = [...Object.keys(SPECIAL).map(n => [n, SPECIAL[n]]), ...Object.keys(PADS).filter(n => this._default(n)).map(n => [n, PADS[n]])].filter(([n, s]) => match(n, s[0], s[2]));
    if (big.length) out.push('<h3>Ready-made controls</h3>', `<div class="picks list">${big.map(([n, s]) => row('pick', `data-name="${n}"`, s[1], s[0], s[2])).join('')}</div>`);
    const btns = keys.filter(k => (k.type || 'button') === 'button' && match(k.name, nice(k.name)));
    if (btns.length) out.push(`<h3>${esc(this._platform === 'Generic Remote' ? 'Remote' : this._platform)} buttons</h3>`, `<div class="picks">${btns.map(k => pick(k.name, nice(k.name))).join('')}</div>`);
    const apps = sources.filter(k => match(k.name, nice(k.name)));
    if (apps.length) out.push('<h3>Apps and inputs</h3>', `<div class="picks">${apps.map(k => pick(k.name, nice(k.name))).join('')}</div>`);
    const lay = [...(this._scope == null ? [['pop-new', 'data-insert="1"', 'mdi:dots-grid', 'A pop-up button', 'One button that slides up more buttons']] : []), ['pick', 'data-name="spacer"', 'mdi:border-none-variant', 'Empty space', 'Leaves a gap the size of a button'], ['group', '', 'mdi:view-grid-outline', this._picker.length % 2 ? 'A stack' : 'A side-by-side group', this._picker.length % 2 ? 'Buttons on top of each other, beside the rest of the row' : 'Buttons next to each other inside this stack']].filter(m => match(m[3], m[4]));
    if (lay.length) out.push('<h3>Layout</h3>', `<div class="picks list">${lay.map(m => row(...m)).join('')}</div>`);
    list.innerHTML = out.join('') || '<div class="note">Nothing matches that search.</div>';
  }
  _insert(item) {
    const p = this._picker;
    this._setRows(this._rows());
    const target = this._at(p);
    if (!Array.isArray(target)) return;
    target.push(item);
  }
  _uniqueName(base) { let n = base, i = 2; while (this._el(n) || SPECIAL[n] || this._popup(n)) n = `${base}_${i++}`; return n; }

  /* ---------- element editor ---------- */
  _keyOptions() {
    const seen = new Set(), out = [];
    for (const k of this._defaults()[0]) { const key = k.tap_action?.action === 'key' && k.tap_action.key; if (key && !hasTpl(key) && !seen.has(key)) { seen.add(key); out.push({ value: key, label: nice(k.name) }); } }
    return out;
  }
  _sourceOptions() {
    const seen = new Set(), out = [];
    for (const k of this._defaults()[1]) { const s = k.tap_action?.source ?? (k.tap_action?.action === 'key' ? k.tap_action.key : null); if (s && !seen.has(s)) { seen.add(s); out.push({ value: s, label: nice(k.name) }); } }
    return out;
  }
  // One "what happens when…" block. holder(create) returns the object that owns `slot`.
  _action(parent, title, holder, slot, where, id) {
    const box = this._html(parent, `<div class="act"><b>${esc(title)}</b></div>`);
    const get = () => {
      const v = actionToForm((holder(false) || {})[slot], this._sticky.has(id));
      if (v.kind === 'key' || v.kind === 'source') {
        const cur = v[v.kind], opts = v.kind === 'key' ? this._keyOptions() : this._sourceOptions();
        v.pick = !this._other.has(id) && opts.some(o => o.value === cur) ? cur : cur != null || this._other.has(id) ? OTHER : undefined;
      }
      return v;
    };
    this._form(box, {
      schema: () => {
        const v = get(), k = v.kind, s = [];
        const kinds = KINDS.filter(([, , w]) => w === 'all' || (w === 'btn' && where !== 'slider') || w === where || (w === 'hold' && where === 'hold')).map(([value, label]) => [value, label]);
        s.push({ name: 'kind', label: 'What happens', selector: sel(kinds) });
        if (k === 'key' || k === 'source') {
          const opts = k === 'key' ? this._keyOptions() : this._sourceOptions();
          if (opts.length) s.push({ name: 'pick', label: k === 'key' ? 'Which button' : 'Which app or input', selector: { select: { mode: 'dropdown', options: [...opts, { value: OTHER, label: k === 'key' ? 'A different one (type its command)' : 'A different one (type its name)' }] } } });
          if (!opts.length || v.pick === OTHER) s.push({ name: k, label: k === 'key' ? 'Command to send' : 'Name of the app or input', helper: k === 'key' ? 'Exactly as your device expects it.' : 'Exactly as it appears in the device’s source list.', selector: { text: {} } });
        }
        if (SLIDER_KINDS[k]) s.push({ name: 'entity', label: { volume: 'Which speaker or TV', brightness: 'Which light', cover: 'Which shade or blind', number: 'Which number' }[k], selector: { entity: { filter: { domain: SLIDER_KINDS[k].domain } } } });
        if (k === 'toggle') s.push({ name: 'entity', label: 'What to turn on or off', selector: { entity: {} } });
        if (k === 'more-info') s.push({ name: 'entity', label: 'Which device', selector: { entity: {} } });
        if (k === 'service') s.push({ name: 'ha', label: 'Action', selector: { ui_action: { actions: ['perform-action'], default_action: 'perform-action' } } });
        if (k === 'navigate') s.push({ name: 'navigation_path', label: 'Page', helper: 'Pick a page, or type a pop-up link like #my-popup.', selector: { navigation: {} } });
        if (k === 'url') s.push({ name: 'url_path', label: 'Web address', selector: { text: { type: 'url' } } });
        if (k === 'assist') s.push({ name: 'pipeline_id', label: 'Assistant', selector: { assist_pipeline: {} } }, { name: 'start_listening', label: 'Start listening right away', selector: toggle });
        if (['keyboard', 'textbox', 'search'].includes(k)) s.push({ name: 'keyboard_prompt', label: 'Hint shown in the typing box (optional)', selector: { text: {} } });
        if (k === 'yaml') s.push({ name: 'yaml', label: 'Action (YAML)', helper: 'Anything the remote understands, including templates, fire-dom-event and eval.', selector: { object: {} } });
        const extra = [];
        if (!['none', 'repeat', 'yaml'].includes(k)) { extra.push({ name: 'confirm', label: 'Ask “Are you sure?” first', selector: toggle }); if (v.confirm) extra.push({ name: 'confirm_text', label: 'Question to ask (optional)', selector: { text: {} } }); }
        if (where === 'hold' && k !== 'none') extra.push({ name: 'hold_time', label: 'How long to hold (milliseconds)', helper: 'Leave empty for the usual half second.', selector: { number: { min: 100, max: 5000, step: 50, mode: 'box' } } });
        if (k === 'repeat') extra.push({ name: 'repeat_delay', label: 'Time between repeats (milliseconds)', selector: { number: { min: 20, max: 2000, step: 10, mode: 'box' } } });
        if (where === 'double' && k !== 'none') extra.push({ name: 'double_tap_window', label: 'How fast the two taps must be (milliseconds)', selector: { number: { min: 100, max: 1000, step: 10, mode: 'box' } } });
        if (extra.length && k !== 'yaml') s.push({ type: 'expandable', flatten: true, name: 'x', title: 'Extras', schema: extra });
        return s;
      },
      data: get,
      change: v => {
        const h = holder(true), prev = h[slot], before = get();
        if (v.kind === 'yaml') this._sticky.add(id); else this._sticky.delete(id);
        if ((v.kind === 'key' || v.kind === 'source') && v.kind === before.kind && v.pick !== before.pick) {
          if (v.pick === OTHER) this._other.add(id); else { this._other.delete(id); v[v.kind] = v.pick; }
        }
        if (v.kind !== before.kind) this._other.delete(id);
        delete v.pick;
        if (v.kind === 'yaml' && before.kind !== 'yaml') v.yaml = prev && prev.action ? prev : { action: 'none' };
        if (v.kind !== before.kind && v.kind !== 'yaml') for (const k of ['key', 'source', 'entity', 'ha', 'navigation_path', 'url_path', 'pipeline_id', 'start_listening', 'keyboard_prompt', 'yaml', 'repeat_delay']) delete v[k];
        const a = formToAction(v, prev);
        if (a.action === 'none' && slot !== 'tap_action' && !prev) delete h[slot]; else h[slot] = a;
        if (where === 'slider' && SLIDER_KINDS[v.kind] && v.entity && v.entity !== before.entity) {      // keep the slider in step with what it controls
          const d = SLIDER_KINDS[v.kind], st = this._hass.states[v.entity]?.attributes || {};
          h.entity_id = v.entity;
          if (d.attr) { h.value_attribute = d.attr; h.range = d.range; h.step = d.step; }
          else { delete h.value_attribute; h.range = [st.min ?? 0, st.max ?? 100]; h.step = st.step ?? 1; }
        }
        return false;
      },
    });
  }
  _viewElement(body) {
    const name = this._edit, builtin = this._default(name), el = () => this._el(name) || {}, type = el().type || 'button';
    const own = () => this._ensure(name);
    this._html(body, `<div class="back"><button class="btn" data-act="edit-done"><ha-icon icon="mdi:arrow-left"></ha-icon>Back</button><b>${this._iconFor(name)}${esc(this._label(name))}</b></div>`);
    const noteBox = this._html(body, '<div></div>');

    /* how it looks */
    const look = this._section(body, 'look', 'How it looks', 'mdi:palette-outline');
    this._form(look, {
      schema: () => {
        const e = el(), l = e.look || {}, s = [];
        if (type !== 'slider') s.push({ name: 'label', label: 'Words on it', helper: 'Leave empty for just the icon.', selector: { text: {} } });
        s.push({ name: 'icon', label: 'Icon', selector: { icon: {} } });
        if (type === 'button') {
          s.push({ name: 'lk_size', label: 'Size', selector: sel([['same', 'Same as the other buttons'], ['small', 'Small'], ['medium', 'Medium'], ['large', 'Large'], ['xl', 'Extra large']]) });
          s.push({ name: 'lk_fill', label: 'Width', selector: sel([['same', 'Same as the other buttons'], ['yes', 'Stretch to fill the row'], ['no', 'Only as wide as it needs']]) });
          s.push({ name: 'lk_layout', label: 'Icon and words', selector: sel([['same', 'Icon above the words'], ['inline', 'Icon beside the words']]) });
          s.push({ name: 'lk_height', label: 'Exact height in pixels (optional)', selector: { number: { min: 24, max: 300, step: 1, mode: 'box' } } });
          s.push({ name: 'lk_colour', label: 'Icon colour', selector: sel([['same', 'Standard'], ['custom', 'My own colour']]) });
          if (okRgb(l.color)) s.push({ name: 'lk_color', label: 'Your icon colour', selector: { color_rgb: {} } });
          s.push({ name: 'lk_background', label: 'Background', selector: sel([['same', 'Same as the other buttons'], ['none', 'No background'], ['custom', 'My own colour']]) });
          if (l.background === 'custom') s.push({ name: 'lk_background_color', label: 'Your background colour', selector: { color_rgb: {} } });
          s.push({ name: 'lk_highlight', label: 'Light up while something is on', helper: 'For example a switch, a light or a TV.', selector: toggle });
          if (l.highlight) s.push({ name: 'entity_id', label: 'Light up when this is on', selector: { entity: {} } }, { name: 'lk_highlight_color', label: 'Colour when on', selector: { color_rgb: {} } });
        }
        if (type === 'slider') {
          s.push({ name: 'vertical', label: 'Stand it upright', selector: toggle });
          s.push({ name: 'lk_colour', label: 'Colour', selector: sel([['same', 'Same as the rest of the remote'], ['custom', 'My own colour']]) });
          if (okRgb(l.color)) s.push({ name: 'lk_color', label: 'Your slider colour', selector: { color_rgb: {} } });
          s.push({ name: 'lk_height', label: 'Thickness in pixels (optional)', selector: { number: { min: 12, max: 120, step: 1, mode: 'box' } } });
        }
        return s;
      },
      data: () => {
        const e = el(), l = e.look || {};
        return { label: e.label, icon: e.icon, vertical: !!e.vertical, entity_id: e.entity_id, lk_size: l.size || 'same', lk_fill: l.fill || 'same', lk_layout: l.layout || 'same', lk_height: l.height, lk_colour: okRgb(l.color) ? 'custom' : 'same', lk_color: l.color, lk_background: l.background || 'same', lk_background_color: l.background_color || [66, 70, 76], lk_highlight: !!l.highlight, lk_highlight_color: l.highlight_color || [133, 142, 228] };
      },
      change: v => {
        const e = own(), l = { ...(e.look || {}) };
        const put = (o, k, val) => { if (val == null || val === '' || val === 'same' || val === false) delete o[k]; else o[k] = val; };
        if (type !== 'slider') put(e, 'label', v.label);
        put(e, 'icon', v.icon);
        if (type === 'slider') put(e, 'vertical', v.vertical);
        put(l, 'size', v.lk_size); put(l, 'fill', v.lk_fill); put(l, 'layout', v.lk_layout); put(l, 'height', v.lk_height);
        if (v.lk_colour === 'custom') l.color = okRgb(v.lk_color) ? v.lk_color : [133, 142, 228]; else delete l.color;
        put(l, 'background', v.lk_background);
        if (v.lk_background === 'custom') l.background_color = okRgb(v.lk_background_color) ? v.lk_background_color : [66, 70, 76]; else delete l.background_color;
        put(l, 'highlight', v.lk_highlight);
        if (v.lk_highlight) { l.highlight_color = okRgb(v.lk_highlight_color) ? v.lk_highlight_color : [133, 142, 228]; if (type === 'button' && 'entity_id' in v) put(e, 'entity_id', v.entity_id); } else delete l.highlight_color;
        put(e, 'look', Object.keys(l).length ? l : null);
        return false;
      },
    });

    /* what it does */
    const A = (parent, title, slot, where, sub) => this._action(parent, title, create => { const e = create ? own() : el(); if (!sub) return e; if (create && !e[sub]) e[sub] = {}; return e[sub] || {}; }, slot, where, `${name}/${sub || ''}/${slot}`);
    if (type === 'slider') {
      const does = this._section(body, 'does', 'What it does', 'mdi:gesture-swipe-horizontal');
      A(does, 'When you slide it', 'tap_action', 'slider');
      this._form(does, {
        schema: () => [{ type: 'grid', name: 'g', flatten: true, schema: [{ name: 'min', label: 'Lowest value', selector: { number: { mode: 'box', step: 'any' } } }, { name: 'max', label: 'Highest value', selector: { number: { mode: 'box', step: 'any' } } }, { name: 'step', label: 'Step', selector: { number: { mode: 'box', step: 'any', min: 0 } } }] },
          { name: 'entity_id', label: 'Show the current value of', helper: 'The slider follows this device.', selector: { entity: {} } }],
        data: () => { const e = el(); return { min: e.range?.[0] ?? 0, max: e.range?.[1] ?? 1, step: e.step ?? 0.01, entity_id: e.entity_id }; },
        change: v => { const e = own(); e.range = [v.min ?? 0, v.max ?? 1]; e.step = v.step ?? 0.01; if (v.entity_id) e.entity_id = v.entity_id; else delete e.entity_id; return false; },
      });
    } else if (type === 'button') {
      const does = this._section(body, 'does', 'What it does', 'mdi:gesture-tap');
      A(does, 'When you tap it', 'tap_action', 'tap');
      A(does, 'When you press and hold it', 'hold_action', 'hold');
      A(does, 'When you double-tap it', 'double_tap_action', 'double');
      const mom = this._section(body, 'momentary', 'While it’s held down', 'mdi:gesture-tap-hold', 'For things that should run only while your finger is on the button');
      this._html(mom, '<div class="sub">Setting any of these replaces tap, hold and double-tap for this button.</div>');
      A(mom, 'The moment you press down', 'momentary_start_action', 'tap');
      A(mom, 'Over and over while held', 'momentary_repeat_action', 'tap');
      A(mom, 'The moment you let go', 'momentary_end_action', 'tap');
    } else {
      const pad = type === 'touchpad';
      const does = this._section(body, 'does', pad ? 'Tapping the pad' : 'The middle button', 'mdi:gesture-tap');
      A(does, 'When you tap it', 'tap_action', 'tap');
      A(does, 'When you press and hold it', 'hold_action', 'hold');
      A(does, 'When you double-tap it', 'double_tap_action', 'double');
      for (const [d, D] of DIRS) {
        const sec = this._section(body, 'dir-' + d, pad ? `Swiping ${d}` : `The ${d} button`, `mdi:arrow-${d}-bold`);
        A(sec, pad ? `When you swipe ${d}` : 'When you tap it', 'tap_action', 'tap', d);
        A(sec, pad ? `When you swipe ${d} and keep holding` : 'When you press and hold it', 'hold_action', 'hold', d);
        if (!pad) A(sec, 'When you double-tap it', 'double_tap_action', 'double', d);
        this._form(sec, {
          schema: () => [{ name: 'label', label: `Words shown at the ${d === 'up' ? 'top' : d === 'down' ? 'bottom' : d}`, selector: { text: {} } }, { name: 'icon', label: 'Icon', selector: { icon: {} } }],
          data: () => ({ label: el()[d]?.label, icon: el()[d]?.icon }),
          change: v => { const e = own(); e[d] = e[d] || {}; for (const k of ['label', 'icon']) { if (v[k]) e[d][k] = v[k]; else delete e[d][k]; } return false; },
        });
      }
      if (pad) {
        const two = this._section(body, 'multi', 'Two-finger gestures', 'mdi:gesture-two-tap', 'Optional extra actions when two fingers are used');
        A(two, 'Two-finger tap', 'multi_tap_action', 'tap');
        A(two, 'Two-finger press and hold', 'multi_hold_action', 'hold');
        A(two, 'Two-finger double-tap', 'multi_double_tap_action', 'double');
        for (const [d] of DIRS) { A(two, `Two-finger swipe ${d}`, 'multi_tap_action', 'tap', d); A(two, `Two-finger swipe ${d} and hold`, 'multi_hold_action', 'hold', d); }
      }
      const drag = this._section(body, 'drag', pad ? 'Dragging (mouse-style)' : 'Spinning the outer ring', 'mdi:cursor-move', pad ? 'Runs constantly while a finger moves. Turns off the swipes.' : 'Like an iPod click wheel');
      A(drag, pad ? 'While dragging one finger' : 'While spinning the ring', 'drag_action', 'tap');
      if (pad) A(drag, 'While dragging two fingers', 'multi_drag_action', 'tap');
    }

    /* advanced */
    const adv = this._section(body, 'adv', 'Advanced', 'mdi:cog-outline', 'Name, vibration, keyboard shortcut, custom CSS and YAML');
    this._form(adv, {
      schema: () => {
        const s = [];
        if (!builtin) s.push({ name: 'name', label: 'Internal name', helper: 'Used in the layout. Letters, numbers and underscores.', selector: { text: {} } });
        if (!builtin) s.push({ name: 'type', label: 'Kind of control', selector: sel([['button', 'Button'], ['slider', 'Slider'], ['touchpad', 'Touchpad'], ['circlepad', 'Round pad']]) });
        s.push({ name: 'haptics', label: 'Vibrate when touched', selector: sel([['same', 'Same as the rest of the remote'], ['on', 'Yes'], ['off', 'No']]) });
        s.push({ name: 'entity_id', label: 'Device it follows', helper: 'Its state is available to labels and styles as “value”.', selector: { entity: {} } });
        s.push({ name: 'value_attribute', label: 'Which detail of that device (attribute)', helper: 'Leave empty to use its main state.', selector: { text: {} } });
        s.push({ name: 'value_template', label: 'Value from a template (only if no device is set)', selector: { template: {} } });
        s.push({ name: 'unit_of_measurement', label: 'Unit shown after the value', selector: { text: {} } });
        if (type === 'button') s.push({ name: 'keypress', label: 'Keyboard shortcut', helper: 'A key on a computer keyboard that presses this button, for example “p”.', selector: { text: {} } });
        if (type === 'touchpad') s.push({ name: 'touch_threshold', label: 'Swipe distance before it counts (pixels)', selector: { number: { min: 1, max: 200, step: 1, mode: 'box' } } });
        if (type === 'slider') s.push({ name: 'value_from_hass_delay', label: 'Wait before following the device again (milliseconds)', selector: { number: { min: 0, max: 10000, step: 100, mode: 'box' } } });
        s.push({ name: 'styles', label: 'Custom CSS', helper: 'For fine-tuning. Templates are allowed.', selector: { text: { multiline: true } } });
        s.push({ type: 'expandable', flatten: true, name: 'rawx', title: 'Everything as YAML', schema: [{ name: 'raw', label: 'This control’s full settings', selector: { object: {} } }] });
        return s;
      },
      data: () => { const e = el(); return { ...e, haptics: e.haptics === true ? 'on' : e.haptics === false ? 'off' : 'same', type, raw: e }; },
      change: v => {
        const cur = el();
        if (v.raw && typeof v.raw === 'object' && !same(v.raw, cur)) {
          const list = this._config.custom_actions = this._config.custom_actions || [], i = list.findIndex(a => a.name === name);
          const next = { ...v.raw, name }; if (i < 0) list.push(next); else list[i] = next;
          return true;
        }
        const e = own();
        for (const k of ['entity_id', 'value_attribute', 'value_template', 'unit_of_measurement', 'keypress', 'touch_threshold', 'value_from_hass_delay', 'styles']) { if (!(k in v) && !(k in e)) continue; if (v[k] == null || v[k] === '') delete e[k]; else e[k] = v[k]; }
        if (v.haptics === 'on') e.haptics = true; else if (v.haptics === 'off') e.haptics = false; else delete e.haptics;
        let full = false;
        if (!builtin && v.type && v.type !== (e.type || 'button')) { e.type = v.type; full = true; }
        const nn = String(v.name || '').trim().replace(/\s+/g, '_');
        if (!builtin && nn && nn !== name && !this._el(nn) && !SPECIAL[nn]) {
          e.name = nn;
          const walk = a => a.map(x => (Array.isArray(x) ? walk(x) : x === name ? nn : x));
          this._config.rows = walk(this._config.rows || []); for (const pp of this._popups()) pp.rows = walk(pp.rows || []);
          this._edit = nn; full = true;
        }
        return full;
      },
    });

    const footBox = this._html(body, '<div class="tbtns" style="margin-top:14px"></div>');
    this._dyn = () => {
      const changed = !!this._custom(name), used = JSON.stringify(this._allRows()).includes(JSON.stringify(name));
      noteBox.innerHTML = builtin ? `<div class="note">${changed ? 'This built-in ' + TYPE_WORD[type] + ' has been changed for this remote.' : 'This is a built-in ' + TYPE_WORD[type] + '. Anything you change here only affects this remote.'}</div>` : '';
      footBox.innerHTML = `${builtin && changed ? '<button class="btn" data-act="el-reset"><ha-icon icon="mdi:restore"></ha-icon>Put it back to the built-in one</button>' : ''}
        <button class="btn" data-act="el-copy"><ha-icon icon="mdi:content-copy"></ha-icon>Make a copy</button>
        ${!builtin ? `<button class="btn warn" data-act="el-delete"><ha-icon icon="mdi:trash-can-outline"></ha-icon>Delete it${used ? ' (and take it off the remote)' : ''}</button>` : ''}`;
    };
    this._dyn();
  }

  /* ---------- tab 3: look ---------- */
  _viewLook(body) {
    const L = () => ({ ...LOOK, ...(this._config.look || {}) });
    this._html(body, '<div class="note"><b>The look of the whole remote.</b> A single button can still be given its own size and colour: tap it on the Buttons tab.</div>');
    this._form(body, {
      schema: () => {
        const l = L(), s = [{ name: 'design', label: 'Overall style', selector: sel([['one_stop', 'One Stop (frosted glass, easy-to-hit buttons)'], ['plain', 'Plain (icons only, style it yourself)']]) }];
        if (l.design !== 'plain') {
          s.push({ name: 'background', label: 'Card background', selector: sel([['glass', 'Frosted glass'], ['theme', 'Same as my other cards'], ['clear', 'None (see-through)']]) });
          s.push({ name: 'button_size', label: 'Button size', selector: sel([['small', 'Small'], ['medium', 'Medium'], ['large', 'Large'], ['xl', 'Extra large']]) });
          s.push({ name: 'button_style', label: 'Button style', selector: sel([['tile', 'Glass tiles'], ['outline', 'Outlines'], ['plain', 'Just the icons']]) });
          s.push({ name: 'shape', label: 'Button corners', selector: sel([['rounded', 'Rounded'], ['round', 'Fully round'], ['square', 'Square']]) });
          s.push({ name: 'stretch', label: 'Stretch buttons to fill each row', selector: toggle });
          s.push({ name: 'gap', label: 'Space between buttons', selector: sel([['tight', 'Tight'], ['normal', 'Normal'], ['roomy', 'Roomy']]) });
          s.push({ name: 'slider_size', label: 'Slider thickness', selector: sel([['small', 'Thin'], ['medium', 'Medium'], ['large', 'Thick']]) });
          s.push({ name: 'accent', label: 'Accent colour', helper: 'Used for sliders and the OK button.', selector: { color_rgb: {} } });
          s.push({ name: 'accent_bar', label: 'Accent line along the top of the card', selector: toggle });
          if (l.button_style !== 'plain') s.push({ name: 'tint_ok', label: 'Colour the OK button', selector: toggle }, { name: 'tint_power', label: 'Make the power button red', selector: toggle });
        }
        s.push({ type: 'expandable', flatten: true, name: 'cssx', title: 'Custom CSS (advanced)', schema: [{ name: 'styles', label: 'CSS for the whole remote', helper: 'Styles written for the Universal Remote Card work here too.', selector: { text: { multiline: true } } }] });
        return s;
      },
      data: () => ({ ...L(), styles: this._config.styles }),
      change: v => {
        const look = {};
        for (const k of Object.keys(LOOK)) if (k in v && !same(v[k], LOOK[k])) look[k] = v[k];
        this._config.look = look;
        if (v.styles) this._config.styles = v.styles; else delete this._config.styles;
        return false;
      },
    });
  }

  /* ---------- tab 4: more ---------- */
  _viewMore(body) {
    this._html(body, '<h3>How it feels</h3>');
    this._form(body, {
      schema: () => [
        { name: 'haptics', label: 'Vibrate when a button is touched', selector: toggle },
        { name: 'hold_time', label: 'How long counts as “press and hold” (milliseconds)', helper: 'Usually 500.', selector: { number: { min: 100, max: 5000, step: 50, mode: 'box' } } },
        { name: 'repeat_delay', label: 'Time between repeats while holding (milliseconds)', helper: 'Usually 100. Used by arrows and volume.', selector: { number: { min: 20, max: 2000, step: 10, mode: 'box' } } },
        { name: 'double_tap_window', label: 'How fast a double-tap must be (milliseconds)', helper: 'Usually 200. Keep it well below the press-and-hold time.', selector: { number: { min: 100, max: 1000, step: 10, mode: 'box' } } },
        { type: 'expandable', flatten: true, name: 'sharex', title: 'Share buttons between remotes (advanced)', schema: [{ name: 'custom_actions_file', label: 'File with shared buttons', helper: 'A YAML or JSON list in your www folder, for example local/remote_buttons.yaml.', selector: { text: {} } }] },
        { type: 'expandable', flatten: true, name: 'iconx', title: 'Your own icons (advanced)', schema: [{ name: 'custom_icons', label: 'Icons (YAML list of name + path)', helper: 'Each needs a name and a 24×24 SVG path. Use the name in a button’s icon box.', selector: { object: {} } }] },
      ],
      data: () => ({ ...this._config, haptics: this._config.haptics !== false }),
      change: v => {
        const c = this._config;
        if (v.haptics === false) c.haptics = false; else delete c.haptics;
        for (const k of ['hold_time', 'repeat_delay', 'double_tap_window', 'custom_actions_file']) { if (v[k] == null || v[k] === '') delete c[k]; else c[k] = v[k]; }
        if (Array.isArray(v.custom_icons) && v.custom_icons.length) c.custom_icons = v.custom_icons; else delete c.custom_icons;
        return false;
      },
    });
    this._html(body, '<h3>Start again from a ready-made remote</h3><div class="sub">Replaces the rows on the Buttons tab. Buttons you made yourself are kept.</div>');
    this._templates(body);
    this._html(body, `<div class="sub" style="margin-top:18px">One Stop - Remote card ${VERSION}. Already have a Universal Remote Card? Change its type to <b>custom:${TAG}</b> in the code editor and it carries straight over.</div>`);
  }

  /* ---------- clicks ---------- */
  _click(e) {
    const b = e.composedPath().find(n => n?.dataset?.act);
    if (!b || b.disabled) return;
    const d = b.dataset, c = this._config, path = d.path != null ? (d.path === '' ? [] : d.path.split(',').map(Number)) : null;
    const done = () => this._commit(true);
    switch (d.act) {
      case 'tab': this._tab = d.tab; this._picker = null; this._edit = null; this._sel = null; this._scope = null; return this._render();
      case 'sel': this._sel = this._sel && this._sel.join(',') === path.join(',') ? null : path; return this._render();
      case 'add': this._picker = path; this._q = ''; this._added = 0; return this._render();
      case 'picker-done': this._picker = null; this._sel = null; return this._render();
      case 'pick': case 'group': case 'new': {
        let item = d.name, label;
        if (d.act === 'group') { item = []; label = 'a group'; }
        if (d.act === 'new') {
          const name = this._uniqueName({ button: 'my_button', slider: 'my_slider', touchpad: 'my_touchpad', circlepad: 'my_pad' }[d.type]);
          const base = d.type === 'button' ? { type: 'button', name, icon: 'mdi:star', label: 'New button', tap_action: { action: 'none' } }
            : d.type === 'slider' ? { type: 'slider', name, range: [0, 1], step: 0.01, value_attribute: 'volume_level', tap_action: { action: 'perform-action', perform_action: 'media_player.volume_set', data: { volume_level: '{{ value | float }}' } } }
            : { ...(clone(this._default(d.type === 'touchpad' ? 'touchpad' : 'circlepad')) || {}), type: d.type, name };
          (c.custom_actions = c.custom_actions || []).push(base);
          this._insert(name);
          this._picker = null; this._sel = null; this._edit = name; this._open.add('look'); this._open.add('does');
          return done();
        }
        this._insert(item);
        this._added = (this._added || 0) + 1;
        this._commit(false);
        const bar = this.shadowRoot.getElementById('added');
        if (bar) { bar.hidden = false; bar.querySelector('span').textContent = `Added ${label || this._label(item)}. Tap more to keep adding.`; }
        return;
      }
      case 'scope': this._scope = d.name; this._sel = null; this._picker = null; this._edit = null; this._open.add('poplook'); return this._render();
      case 'scope-done': this._scope = null; this._sel = null; this._picker = null; return this._render();
      case 'pop-new': {
        const name = this._uniqueName('popup');
        (c.popups = Array.isArray(c.popups) ? c.popups : []).push({ name, label: 'More', icon: 'mdi:dots-grid', rows: [[]] });
        if (d.insert && this._picker) this._insert(name); else { c.rows = this._config.rows || []; (c.rows[c.rows.length - 1] || c.rows[c.rows.push([]) - 1]).push(name); }
        this._picker = null; this._sel = null; this._scope = name; this._open.add('poplook');
        return done();
      }
      case 'pop-del': {
        const name = this._scope, strip = a => a.filter(x => x !== name).map(x => (Array.isArray(x) ? strip(x) : x));
        this._scope = null; c.popups = this._popups().filter(p => p.name !== name); if (!c.popups.length) delete c.popups;
        c.rows = strip(c.rows || []); for (const pp of this._popups()) pp.rows = strip(pp.rows || []); this._sel = null; return done();
      }
      case 'edit': this._edit = d.name; return this._render();
      case 'edit-done': this._edit = null; return this._render();
      case 'move': {
        const p = this._sel, arr = this._parent(p), i = p[p.length - 1], j = i + +d.d;
        if (!arr || j < 0 || j >= arr.length) return;
        this._setRows(this._rows()); const a = this._parent(p); [a[i], a[j]] = [a[j], a[i]];
        this._sel = [...p.slice(0, -1), j]; return done();
      }
      case 'remove': { this._setRows(this._rows()); const p = this._sel; this._parent(p).splice(p[p.length - 1], 1); this._sel = null; return done(); }
      case 'row-add': this._setRows([...this._rows(), []]); this._sel = null; return done();
      case 'row-del': { const r = this._rows(); r.splice(+d.i, 1); this._setRows(r); this._sel = null; return done(); }
      case 'row-move': { const r = this._rows(), i = +d.i, j = i + +d.d; if (j < 0 || j >= r.length) return; [r[i], r[j]] = [r[j], r[i]]; this._setRows(r); this._sel = null; return done(); }
      case 'template': this._scope = null; c.rows = clone(TEMPLATES[d.id].rows); this._tab = 'buttons'; this._sel = null; return done();
      case 'el-reset': c.custom_actions = (c.custom_actions || []).filter(a => a.name !== this._edit); return done();
      case 'el-copy': {
        const name = this._uniqueName(this._edit + '_copy'), copy = { type: 'button', ...clone(this._el(this._edit)), name };
        (c.custom_actions = c.custom_actions || []).push(copy);
        const walk = a => { for (let i = 0; i < a.length; i++) { if (Array.isArray(a[i])) { if (walk(a[i])) return true; } else if (a[i] === this._edit) { a.splice(i + 1, 0, name); return true; } } return false; };
        const rr = this._rows(); if (!walk(rr)) (rr[rr.length - 1] || rr[rr.push([]) - 1]).push(name); this._setRows(rr);
        this._edit = name; return done();
      }
      case 'el-delete': {
        const name = this._edit, strip = a => a.filter(x => x !== name).map(x => (Array.isArray(x) ? strip(x) : x));
        c.custom_actions = (c.custom_actions || []).filter(a => a.name !== name); c.rows = strip(c.rows || []); for (const pp of this._popups()) pp.rows = strip(pp.rows || []); this._edit = null; return done();
      }
    }
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, OneStopRemoteCard);
if (!customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, OneStopRemoteCardEditor);
window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === TAG)) window.customCards.push({
  type: TAG, name: 'One Stop - Remote card', preview: true,
  description: 'A remote for TVs, streaming boxes, receivers and more: buttons, arrows, touchpad, sliders and your own buttons, set up in plain words.',
  getEntitySuggestion: (hass, entityId) => {
    const domain = entityId.split('.')[0];
    if (domain !== 'remote' && domain !== 'media_player') return null;
    const config = OneStopRemoteCard.getStubConfig();
    config[domain === 'remote' ? 'remote_id' : 'media_player_id'] = entityId;
    config.platform = E.platforms[hass.entities?.[entityId]?.platform || ''] || 'Generic Remote';
    return { config };
  },
});
console.info(`%c ONE STOP %c Remote card ${VERSION} `, 'background:#375374;color:#fff;border-radius:3px 0 0 3px;padding:2px 4px', 'background:#e9eef5;color:#375374;border-radius:0 3px 3px 0;padding:2px 4px');
window.__oneStopRemote = { compile, cardCss, elementCss, actionToForm, formToAction, VERSION };
};
// The engine finishes loading a moment after this file runs, so wait for it.
let tries = 0;
const go = () => {
  const E = window.__oneStopRemoteEngine;
  if (E) return init(E);
  if (++tries > 1500) return console.error('One Stop - Remote card: engine missing');
  setTimeout(go, 20);
};
go();
})();
