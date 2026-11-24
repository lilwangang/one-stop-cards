/*!
 * One Stop – Thermostat card
 * One Stop Smart Homes · standalone Home Assistant dashboard card (no other add-ons needed)
 */
(() => {
'use strict';
const VERSION = '1.0.0';
const TAG = 'one-stop-thermostat-card';
const EDITOR_TAG = TAG + '-editor';
const SECTION = 'thermostat', STYLE_DASH = 'one-stop-cards';

const MODE_INFO = {
  off: ['Off', 'mdi:power'], heat: ['Heat', 'mdi:fire'], cool: ['Cool', 'mdi:snowflake'], heat_cool: ['Heat + Cool', 'mdi:sun-snowflake-variant'],
  auto: ['Auto', 'mdi:thermostat-auto'], dry: ['Dry', 'mdi:water-percent'], fan_only: ['Fan', 'mdi:fan'],
};
const DEFAULTS = {
  // what to show
  show_name: true, show_icon: false, show_current: true, show_humidity: true, show_status: true, show_modes: true,
  show_target: true, show_fan: true, show_presets: true, show_outdoor: true, show_unit: true,
  // modes
  modes: [], mode_content: 'icon', mode_size: 'large', mode_shape: 'rounded', mode_style: 'tinted', mode_tint: 'soft', mode_text_size: 'medium',
  heat_color: [214, 110, 40], cool_color: [52, 120, 200], auto_color: [60, 160, 110], dry_color: [200, 160, 50], fan_color: [70, 170, 180], off_color: [150, 156, 166],
  modes_position: 'auto',
  // target
  target_style: 'buttons', step: 'auto', target_size: 'large', send_delay: 'normal', off_words: 'Off',
  // fan & presets
  fan_style: 'auto', fan_words: 'Fan', preset_style: 'chips',
  // layout & text
  card_spacing: 'standard', corners: 'rounded', font: 'classic', title_size: 'medium', title_caps: true, temp_size: 'large', title_color: [247, 249, 252],
  // colours & glow
  off_background: 'theme', off_custom_color: [40, 44, 52], glow_when: 'running', glow_strength: 'normal', temp_colour: 'state',
  icon_color: 'state', icon_custom_color: [255, 196, 120], hover_color: [184, 184, 184], animations: true, haptics: true,
  // actions
  tap: 'none', hold: 'more_info',
};
const ROOM_KEYS = ['type', 'entity', 'name', 'icon', 'modes', 'humidity_sensor', 'outdoor_sensor', 'tap', 'tap_page', 'hold', 'hold_page'];

/* ---------------- helpers ---------------- */
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const okRgb = v => Array.isArray(v) && v.length === 3 && v.every(n => Number.isFinite(+n));
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const lift = (c, n) => c.map(v => Math.min(255, v + n));
const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const live = st => st && !['unavailable', 'unknown'].includes(st.state);
const num = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };
const fmt = (v, step) => v == null ? '—' : (step < 1 || v % 1 ? (Math.round(v * 10) / 10).toFixed(1) : String(Math.round(v)));
const modeKey = m => m === 'auto' ? 'auto' : m === 'heat_cool' ? 'auto' : m === 'fan_only' ? 'fan' : m;

/* ---------------- shared house style (master edit) ---------------- */
const Shared = {
  data: null, loading: null, listeners: new Set(), subscribed: false,
  _cache() { try { localStorage.setItem('one-stop-cards-style', JSON.stringify(this.data || {})); } catch (e) {} },
  _readCache() { if (!this.data) { try { const c = JSON.parse(localStorage.getItem('one-stop-cards-style') || 'null'); if (c) this.data = c; } catch (e) {} } },
  get(hass) {
    this._readCache();
    if (!this.loading) this.loading = (async () => {
      let d = {}; try { d = (await hass.callWS({ type: 'lovelace/config', url_path: STYLE_DASH, force: true }))?.one_stop || {}; } catch (e) {}
      const changed = !same(d, this.data); this.data = d; this._cache(); this._subscribe(hass); if (changed) this.listeners.forEach(fn => fn(d)); return d;
    })();
    return this.loading;
  },
  _subscribe(hass) {
    if (this.subscribed || !hass?.connection) return; this.subscribed = true;
    hass.connection.subscribeEvents(async ev => {
      if (ev?.data?.url_path !== STYLE_DASH) return;
      try { this.data = (await hass.callWS({ type: 'lovelace/config', url_path: STYLE_DASH, force: true }))?.one_stop || {}; } catch (e) {}
      this._cache(); this.listeners.forEach(fn => fn(this.data));
    }, 'lovelace_updated').catch(() => {});
  },
  async save(hass, values) {
    const list = await hass.callWS({ type: 'lovelace/dashboards/list' });
    if (!list.some(d => d.url_path === STYLE_DASH))
      await hass.callWS({ type: 'lovelace/dashboards/create', url_path: STYLE_DASH, title: 'One Stop Cards', icon: 'mdi:palette-swatch-outline', show_in_sidebar: false, require_admin: false, mode: 'storage' });
    let cfg; try { cfg = await hass.callWS({ type: 'lovelace/config', url_path: STYLE_DASH, force: true }); } catch (e) { cfg = null; }
    cfg = cfg && cfg.views ? cfg : { views: [{ title: 'One Stop Cards', cards: [{ type: 'markdown', content: '## One Stop Cards\nShared styles for One Stop cards.' }] }] };
    cfg.one_stop = { ...(cfg.one_stop || {}), [SECTION]: values };
    await hass.callWS({ type: 'lovelace/config/save', url_path: STYLE_DASH, config: cfg });
    this.data = cfg.one_stop; this._cache(); this.listeners.forEach(fn => fn(this.data));
  },
};

/* ---------------- styles ---------------- */
const CSS = `
:host{display:block}
ha-card{position:relative;overflow:hidden;box-sizing:border-box;padding:var(--pad,18px);border-radius:var(--radius,22px);color:#f7f9fc;font-family:var(--font);container:ost/inline-size;cursor:default;
  background:linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.015)),var(--off-bg);
  border:1px solid rgba(255,255,255,.12);box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 10px 24px rgba(0,0,0,.10);backdrop-filter:blur(18px) saturate(1.1);-webkit-backdrop-filter:blur(18px) saturate(1.1);user-select:none;-webkit-tap-highlight-color:transparent}
ha-card.anim{transition:background .5s,border-color .5s,box-shadow .5s}
ha-card.glow{background:linear-gradient(145deg,rgba(255,255,255,.16),rgba(255,255,255,.035) 48%,rgba(255,255,255,.075)),linear-gradient(rgba(var(--st),var(--ga,.25)),rgba(var(--st),calc(var(--ga,.25) * .5))),rgba(28,28,28,.62);
  border-color:rgba(var(--st),var(--gb,.34));box-shadow:inset 0 1px 0 rgba(255,255,255,.25),inset 0 -1px 0 rgba(255,255,255,.04),0 8px 24px rgba(0,0,0,.16);backdrop-filter:blur(12px) saturate(1.15);-webkit-backdrop-filter:blur(12px) saturate(1.15)}
ha-card.tap{cursor:pointer}
@media (hover:hover){ha-card:hover{border-color:var(--hover,rgba(var(--st),.5))}}
ha-card.unavail{opacity:.6}
button{all:unset;box-sizing:border-box;cursor:pointer;-webkit-tap-highlight-color:transparent}
button:focus-visible{outline:2px solid #fff;outline-offset:2px}
button:active:not([disabled]){transform:scale(.96)} button[disabled]{opacity:.4;cursor:default}
.top{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"h m";gap:12px;align-items:start}
.top.below{grid-template-columns:minmax(0,1fr);grid-template-areas:"h" "m"}
.hd{grid-area:h;min-width:0;display:flex;gap:12px;align-items:flex-start}
.ic{flex:none;width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:rgba(var(--st),.12)}
.ic ha-icon{--mdc-icon-size:30px;color:var(--ic-c,rgb(var(--st)))}
.tx{min-width:0}
.nm{font-weight:650;font-size:var(--title,17px);line-height:1.2;letter-spacing:.3px;color:var(--title-c,#e9eef5);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nm.caps{text-transform:uppercase}
.cur{display:flex;align-items:flex-start;gap:2px;font-weight:600;font-size:var(--tsize,44px);line-height:1.05;letter-spacing:-1px;color:var(--t-c,#f7f9fc);margin-top:2px}
.cur small{font-size:calc(var(--tsize,44px) * .3);font-weight:600;opacity:.7;margin-top:calc(var(--tsize,44px) * .55);letter-spacing:0}
.meta{display:flex;flex-wrap:wrap;gap:4px 10px;font-size:14px;line-height:18px;color:rgba(235,241,248,.8);margin-top:4px}
.meta span{display:inline-flex;align-items:center;gap:3px;white-space:nowrap}
.meta ha-icon{--mdc-icon-size:16px;opacity:.85}
.dot{width:8px;height:8px;border-radius:50%;background:rgb(var(--st));box-shadow:0 0 8px rgba(var(--st),.9)}
ha-card:not(.running) .dot{box-shadow:none;opacity:.6}
.modes{grid-area:m;display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}
.top.below .modes{display:grid;grid-template-columns:repeat(var(--mn,3),minmax(0,1fr))}
.mb{width:var(--mbs,68px);height:var(--mbs,68px);border-radius:var(--mbr,14px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-weight:650;font-size:var(--mbt,13px);line-height:1.15;text-align:center;
  background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16);color:rgba(var(--mc),1);box-shadow:inset 0 1px 0 rgba(255,255,255,.08);transition:background .2s,border-color .2s,box-shadow .2s}
.top.below .mb{width:auto;height:min(var(--mbs,68px),64px)}
.mb ha-icon{--mdc-icon-size:calc(var(--mbs,68px) * .4);color:inherit}
.mb.words{font-size:calc(var(--mbt,13px) * 1.15)}
.mb.on{background:var(--mon-bg);border:var(--mon-bd);color:var(--mon-fg);box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 0 14px rgba(var(--mc),.35)}
.mb.off-mode{color:#f7f9fc}
.row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;margin-top:12px}
.pm{width:var(--pms,56px);height:var(--pms,56px);border-radius:var(--mbr,14px);display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);box-shadow:inset 0 1px 0 rgba(255,255,255,.1)}
.pm ha-icon{--mdc-icon-size:28px}
.tv{height:var(--pms,56px);border-radius:var(--mbr,14px);display:flex;align-items:center;justify-content:center;gap:8px;background:rgba(0,0,0,.18);border:1px solid rgba(255,255,255,.08);font-weight:650;font-size:calc(var(--pms,56px) * .4);font-variant-numeric:tabular-nums}
.tv .lbl{font-size:13px;font-weight:600;opacity:.7;text-transform:uppercase;letter-spacing:.5px}
.tv.pending{border-color:rgba(var(--st),.7);box-shadow:0 0 0 1px rgba(var(--st),.4) inset}
.tv.offv{color:rgba(235,241,248,.85)}
.hs{position:relative;height:var(--slh,58px);border-radius:var(--slr,18px);overflow:hidden;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.10);cursor:ew-resize;touch-action:none;margin-top:12px}
.hs .f{position:absolute;inset:0 auto 0 0;width:var(--p,0%);background:var(--sl-c,rgb(var(--st)));opacity:.55;border-radius:inherit}
ha-card.anim .hs:not(.moving) .f{transition:width .15s}
.hs .l{position:absolute;inset:0;display:flex;align-items:center;gap:10px;padding:0 18px;pointer-events:none;font-weight:600;font-size:16px;text-shadow:0 1px 2px rgba(0,0,0,.35)}
.hs .l ha-icon{--mdc-icon-size:22px}
.hs .l b{margin-left:auto}
.hs.dis{opacity:.45;pointer-events:none}
.fans{display:grid;grid-template-columns:repeat(var(--fn,2),minmax(0,1fr));gap:8px;margin-top:12px}
.fb{height:52px;border-radius:var(--mbr,14px);display:flex;align-items:center;justify-content:center;gap:6px;font-weight:650;font-size:15px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16)}
.fb ha-icon{--mdc-icon-size:20px}
.fb.on{background:rgba(255,255,255,.2);border-color:rgba(255,255,255,.55);box-shadow:inset 0 1px 0 rgba(255,255,255,.2)}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.chip{height:38px;padding:0 14px;border-radius:999px;display:flex;align-items:center;gap:6px;font-weight:600;font-size:14px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16)}
.chip.on{background:rgba(var(--st),.35);border-color:rgba(var(--st),.7)}
select.psel{all:unset;box-sizing:border-box;width:100%;height:46px;margin-top:12px;padding:0 14px;border-radius:var(--mbr,14px);background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16);font-weight:600;font-size:15px;color:#f7f9fc;cursor:pointer}
.ranges{display:flex;flex-direction:column}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
`;

/* ---------------- the card ---------------- */
class OneStopThermostatCard extends HTMLElement {
  static getConfigElement() { return document.createElement(EDITOR_TAG); }
  static getStubConfig(hass) { const e = Object.keys(hass?.states || {}).find(id => id.startsWith('climate.') && live(hass.states[id])); return e ? { entity: e } : {}; }
  setConfig(config) {
    if (!config) throw new Error('Invalid configuration');
    this._raw = { ...config }; this._merge();
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._sig = null; if (this._hass) this._render();
  }
  _merge() {
    Shared._readCache();
    const rl = (Shared.data || {}).room_lights || {}, look = {};
    for (const k of ['corners', 'font', 'card_spacing', 'off_background', 'off_custom_color', 'animations', 'haptics', 'title_color']) if (k in rl) look[k] = rl[k];
    this._cfg = { ...DEFAULTS, ...look, ...((Shared.data || {})[SECTION] || {}), ...this._raw };
  }
  connectedCallback() { this._onShared = () => { this._merge(); this._sig = null; if (this._hass) this._render(); }; Shared.listeners.add(this._onShared); }
  disconnectedCallback() { Shared.listeners.delete(this._onShared); clearTimeout(this._sendT); }
  set hass(hass) {
    const first = !this._hass; this._hass = hass; if (first) Shared.get(hass);
    const c = this._cfg || {}, ids = [c.entity, c.humidity_sensor, c.outdoor_sensor].filter(Boolean);
    const sig = JSON.stringify(ids.map(id => [hass.states[id]?.state, hass.states[id]?.attributes]));
    if (sig === this._sig || this._pending || this._dragging) return;
    this._sig = sig; this._render();
  }
  getCardSize() { return 4; }
  getGridOptions() { return { columns: 12, rows: 'auto', min_columns: 12 }; }

  _st() { return this._hass?.states[this._cfg.entity]; }
  _unit() { return this._hass?.config?.unit_system?.temperature || '°'; }
  _step(st) { const s = this._cfg.step; if (s && s !== 'auto') return +s; return num(st?.attributes?.target_temp_step) || (/F/.test(this._unit()) ? 1 : 0.5); }
  _modes(st) {
    const avail = st?.attributes?.hvac_modes || [];
    const want = (this._cfg.modes || []).length ? this._cfg.modes : avail;
    const order = ['off', 'heat', 'cool', 'heat_cool', 'auto', 'dry', 'fan_only'];
    return want.filter(m => avail.includes(m)).sort((a, b) => order.indexOf(a) - order.indexOf(b));
  }
  _colour(k) { const c = this._cfg[`${k}_color`]; return okRgb(c) ? c : DEFAULTS[`${k}_color`]; }
  _stateColour(st) {
    const a = st?.attributes?.hvac_action, m = st?.state;
    const k = a === 'heating' || a === 'preheating' ? 'heat' : a === 'cooling' ? 'cool' : a === 'drying' ? 'dry' : a === 'fan' ? 'fan'
      : m && m !== 'off' && MODE_INFO[m] ? modeKey(m) : 'off';
    return { k, rgb: this._colour(k) };
  }
  _running(st) {
    if (!live(st) || st.state === 'off') return false;
    const a = st.attributes?.hvac_action;
    if (this._cfg.glow_when === 'never') return false;
    if (this._cfg.glow_when === 'on') return true;
    return a ? !['idle', 'off'].includes(a) : true;
  }
  _status(st) {
    if (!live(st)) return 'Not responding';
    const a = st.attributes?.hvac_action, u = this._unit(), step = this._step(st), t = st.attributes;
    const tgt = t.target_temp_low != null && t.target_temp_high != null ? `${fmt(t.target_temp_low, step)}–${fmt(t.target_temp_high, step)}°` : t.temperature != null ? `${fmt(t.temperature, step)}°` : '';
    if (st.state === 'off') return 'Off';
    const word = { heating: 'Heating', preheating: 'Warming up', cooling: 'Cooling', drying: 'Drying', fan: 'Fan running', idle: 'Idle', defrosting: 'Defrosting' }[a];
    if (word && word !== 'Idle') return tgt ? `${word} to ${tgt}` : word;
    return `${MODE_INFO[st.state]?.[0] || st.state}${tgt ? ' · set to ' + tgt : ''}${word === 'Idle' ? ' · idle' : ''}`;
  }

  _render() {
    const c = this._cfg, h = this._hass, R = this.shadowRoot; if (!h || !R) return;
    if (!c.entity) { R.innerHTML = `<style>${CSS}</style><ha-card style="padding:16px">Pick a thermostat in the card editor.</ha-card>`; return; }
    const st = this._st();
    if (!st) { R.innerHTML = `<style>${CSS}</style><ha-card style="padding:16px">${esc(c.entity)} was not found.</ha-card>`; return; }
    const a = st.attributes || {}, ok = live(st), step = this._step(st), u = this._unit();
    const { k: sk, rgb } = this._stateColour(st), running = this._running(st);
    const modes = c.show_modes ? this._modes(st) : [];
    const mbs = { small: 48, medium: 58, large: 68, extra_large: 80 }[c.mode_size] || 68;
    const tA = { very_soft: .28, soft: .44, medium: .60, bold: .80 }[c.mode_tint] || .44;
    const pad = { compact: 12, standard: 18, roomy: 24 }[c.card_spacing] || 18;
    const font = { classic: 'Arial,Helvetica,sans-serif', theme: 'var(--ha-font-family-body,var(--paper-font-body1_-_font-family,Roboto,sans-serif))', rounded: "ui-rounded,'SF Pro Rounded','Nunito','Varela Round',system-ui,sans-serif" }[c.font] || 'Arial,Helvetica,sans-serif';
    const offBg = { theme: 'var(--bubble-button-main-background-color,var(--bubble-main-background-color,var(--background-color-2,var(--ha-card-background,var(--card-background-color,var(--secondary-background-color))))))', darker: 'rgba(14,16,21,.50)', lighter: 'rgba(120,128,142,.30)', custom: okRgb(c.off_custom_color) ? rgba(c.off_custom_color, .55) : 'var(--secondary-background-color)' }[c.off_background] || 'var(--secondary-background-color)';
    const glow = { subtle: [.14, .22], normal: [.25, .34], strong: [.42, .5] }[c.glow_strength] || [.25, .34];
    const vars = [`--st:${rgb.join(',')}`, `--pad:${pad}px`, `--radius:${{ square: '8px', rounded: '22px', extra_round: '32px' }[c.corners] || '22px'}`, `--font:${font}`, `--off-bg:${offBg}`,
      `--ga:${glow[0]}`, `--gb:${glow[1]}`, `--mbs:${mbs}px`, `--mbr:${{ square: '6px', rounded: '14px', extra_round: '50%' }[c.mode_shape] || '14px'}`,
      `--mbt:${{ small: '11px', medium: '13px', large: '15px' }[c.mode_text_size] || '13px'}`,
      `--pms:${{ small: 46, medium: 52, large: 58, extra_large: 68 }[c.target_size] || 58}px`,
      `--title:${{ small: '14px', medium: '17px', large: '20px', extra_large: '24px' }[c.title_size] || '17px'}`,
      `--tsize:${{ small: '32px', medium: '38px', large: '44px', extra_large: '54px' }[c.temp_size] || '44px'}`,
      `--slr:${c.corners === 'square' ? '8px' : c.corners === 'extra_round' ? '999px' : '18px'}`];
    if (c.temp_colour === 'state' && st.state !== 'off') vars.push(`--t-c:${rgba(lift(rgb, 60), 1)}`);
    if (okRgb(c.title_color) && !same(c.title_color, DEFAULTS.title_color)) vars.push(`--title-c:${rgba(c.title_color, 1)}`);
    if (okRgb(c.hover_color) && !same(c.hover_color, DEFAULTS.hover_color)) vars.push(`--hover:${rgba(c.hover_color, .8)}`);
    if (c.icon_color === 'white') vars.push('--ic-c:#f2f5f9'); else if (c.icon_color === 'custom' && okRgb(c.icon_custom_color)) vars.push(`--ic-c:${rgba(c.icon_custom_color, 1)}`);

    // header
    const hum = c.humidity_sensor ? num(h.states[c.humidity_sensor]?.state) : num(a.current_humidity);
    const out = c.outdoor_sensor ? num(h.states[c.outdoor_sensor]?.state) : null;
    const meta = [];
    if (c.show_status) meta.push(`<span><i class="dot"></i>${esc(this._status(st))}</span>`);
    if (c.show_humidity && hum != null) meta.push(`<span><ha-icon icon="mdi:water-percent"></ha-icon>${Math.round(hum)}%</span>`);
    if (c.show_outdoor && out != null) meta.push(`<span><ha-icon icon="mdi:home-export-outline"></ha-icon>${fmt(out, 1)}°</span>`);
    const head = `<div class="hd">${c.show_icon ? `<div class="ic"><ha-icon icon="${esc(c.icon || a.icon || 'mdi:thermostat')}"></ha-icon></div>` : ''}<div class="tx">
      ${c.show_name ? `<div class="nm ${c.title_caps ? 'caps' : ''}">${esc(c.name || a.friendly_name || c.entity)}</div>` : ''}
      ${c.show_current ? `<div class="cur">${ok ? fmt(num(a.current_temperature), 0.1) : '—'}°${c.show_unit ? `<small>${esc(u.replace('°', ''))}</small>` : ''}</div>` : ''}
      ${meta.length ? `<div class="meta">${meta.join('')}</div>` : ''}</div></div>`;

    // modes
    const look = col => ({ tinted: [rgba(col, tA), `1px solid ${rgba(lift(col, 60), .7)}`, '#fff'], solid: [rgba(col, 1), `1px solid ${rgba(lift(col, 40), .9)}`, '#fff'],
      outline: ['rgba(255,255,255,.04)', `2px solid ${rgba(lift(col, 70), .95)}`, rgba(lift(col, 90), 1)], glass: ['rgba(255,255,255,.2)', '1px solid rgba(255,255,255,.55)', rgba(lift(col, 90), 1)] }[c.mode_style] || [rgba(col, tA), `1px solid ${rgba(lift(col, 60), .7)}`, '#fff']);
    const mb = m => {
      const k = modeKey(m), col = this._colour(k), on = st.state === m, L = look(col), [word, icon] = MODE_INFO[m] || [m, 'mdi:thermostat'];
      const cont = c.mode_content;
      return `<button class="mb ${on ? 'on' : ''} ${m === 'off' ? 'off-mode' : ''} ${cont === 'words' ? 'words' : ''}" data-mode="${m}" aria-pressed="${on}" aria-label="${esc(word)}" ${ok ? '' : 'disabled'}
        style="--mc:${lift(col, m === 'off' ? 90 : 70).join(',')};--mon-bg:${L[0]};--mon-bd:${L[1]};--mon-fg:${L[2]}">${cont !== 'words' ? `<ha-icon icon="${icon}"></ha-icon>` : ''}${cont !== 'icon' ? `<span>${esc(word)}</span>` : ''}</button>`;
    };
    const need = 210 + modes.length * (mbs + 8) + pad * 2;
    const below = c.modes_position === 'below' || (c.modes_position !== 'beside' && modes.length > 4);
    const autoCss = c.modes_position === 'auto' && !below ? `<style>@container ost (max-width:${need}px){.top{grid-template-columns:minmax(0,1fr);grid-template-areas:"h" "m"}.top .modes{display:grid;grid-template-columns:repeat(var(--mn,3),minmax(0,1fr))}.top .mb{width:auto;height:min(var(--mbs,68px),64px)}}</style>` : '';
    const top = `<div class="top ${below ? 'below' : ''}">${head}${modes.length ? `<div class="modes" style="--mn:${modes.length}">${modes.map(mb).join('')}</div>` : ''}</div>`;

    // target
    let target = '';
    if (c.show_target) {
      const range = a.target_temp_low != null && a.target_temp_high != null && st.state !== 'off' && (st.state === 'heat_cool' || a.temperature == null);
      const p = this._pendingVals || {};
      const pend = Object.keys(p).length > 0;
      const val = k => p[k] ?? num(a[k]);
      if (!ok || st.state === 'off' || (!range && a.temperature == null)) {
        target = `<div class="row"><button class="pm" disabled aria-label="Lower"><ha-icon icon="mdi:minus"></ha-icon></button><div class="tv offv">${esc(!ok ? '—' : st.state === 'off' ? c.off_words : MODE_INFO[st.state]?.[0] || st.state)}</div><button class="pm" disabled aria-label="Raise"><ha-icon icon="mdi:plus"></ha-icon></button></div>`;
      } else if (c.target_style === 'slider' && !range) {
        const lo = num(a.min_temp) ?? 7, hi = num(a.max_temp) ?? 35, v = val('temperature');
        target = `<div class="hs" data-slide="temperature" data-min="${lo}" data-max="${hi}" style="--p:${Math.max(0, Math.min(100, (v - lo) / (hi - lo) * 100))}%"><div class="f"></div><div class="l"><ha-icon icon="mdi:thermometer"></ha-icon><span>Set to</span><b data-v>${fmt(v, step)}°</b></div></div>`;
      } else {
        const one = (key, lbl) => `<div class="row"><button class="pm" data-adj="${key}" data-d="-1" aria-label="Lower ${lbl || ''}"><ha-icon icon="mdi:minus"></ha-icon></button><div class="tv ${pend && p[key] != null ? 'pending' : ''}">${lbl ? `<span class="lbl">${lbl}</span>` : ''}<span data-v="${key}">${fmt(val(key), step)}°</span></div><button class="pm" data-adj="${key}" data-d="1" aria-label="Raise ${lbl || ''}"><ha-icon icon="mdi:plus"></ha-icon></button></div>`;
        target = range ? `<div class="ranges">${one('target_temp_low', 'Heat to')}${one('target_temp_high', 'Cool to')}</div>` : one('temperature', '');
      }
    }

    // fan
    let fan = '';
    const fm = a.fan_modes || [];
    if (c.show_fan && fm.length) {
      const pct = fm.every(x => /^\d+%$/.test(x));
      const style = c.fan_style === 'auto' ? (pct || fm.length > 4 ? 'slider' : 'buttons') : c.fan_style;
      if (style === 'slider') {
        const i = Math.max(0, fm.indexOf(a.fan_mode));
        fan = `<div class="hs ${ok ? '' : 'dis'}" data-slide="fan" data-n="${fm.length}" style="--p:${fm.length > 1 ? i / (fm.length - 1) * 100 : 100}%;--sl-c:rgba(235,241,248,.9)"><div class="f"></div><div class="l"><ha-icon icon="mdi:fan"></ha-icon><span>${esc(c.fan_words)}</span><b data-v>${esc(a.fan_mode || '—')}</b></div></div>`;
      } else if (style === 'dropdown') {
        fan = `<select class="psel" data-sel="fan" aria-label="${esc(c.fan_words)}">${fm.map(x => `<option value="${esc(x)}" ${x === a.fan_mode ? 'selected' : ''}>${esc(c.fan_words)} ${esc(x)}</option>`).join('')}</select>`;
      } else {
        fan = `<div class="fans" style="--fn:${Math.min(fm.length, 4)}">${fm.map(x => `<button class="fb ${x === a.fan_mode ? 'on' : ''}" data-fan="${esc(x)}" ${ok ? '' : 'disabled'}><ha-icon icon="${x === 'auto' ? 'mdi:fan-auto' : x === 'off' ? 'mdi:fan-off' : 'mdi:fan'}"></ha-icon>${esc(c.fan_words)} ${esc(x)}</button>`).join('')}</div>`;
      }
    }

    // presets
    let presets = '';
    const pm = (a.preset_modes || []).filter(x => x && x.toLowerCase() !== 'none');
    if (c.show_presets && pm.length) {
      presets = c.preset_style === 'dropdown' || pm.length > 6
        ? `<select class="psel" data-sel="preset" aria-label="Preset"><option value="none">No preset</option>${pm.map(x => `<option value="${esc(x)}" ${x === a.preset_mode ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>`
        : `<div class="chips">${pm.map(x => `<button class="chip ${x === a.preset_mode ? 'on' : ''}" data-preset="${esc(x)}" ${ok ? '' : 'disabled'}>${esc(x)}</button>`).join('')}</div>`;
    }

    const cls = ['', running ? 'glow running' : '', c.animations ? 'anim' : '', ok ? '' : 'unavail', c.tap !== 'none' ? 'tap' : ''].join(' ');
    R.innerHTML = `<style>${CSS}</style>${autoCss}<ha-card class="${cls}" style="${vars.join(';')}">${top}${target}${fan}${presets}</ha-card>`;
    this._wire(st);
  }

  _buzz() { if (this._cfg.haptics) { try { navigator.vibrate?.(12); } catch (e) {} this.dispatchEvent(new CustomEvent('haptic', { detail: 'light', bubbles: true, composed: true })); } }
  _call(service, data) { this._buzz(); return this._hass.callService('climate', service, { entity_id: this._cfg.entity, ...data }).catch(e => console.warn('One Stop Thermostat:', e?.message || e)); }
  _act(what, page) {
    if (!what || what === 'none') return; this._buzz();
    if (what === 'more_info') this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: this._cfg.entity }, bubbles: true, composed: true }));
    if (what === 'page' && page) { history.pushState(null, '', page); window.dispatchEvent(new CustomEvent('location-changed', { detail: { replace: false } })); }
  }
  _wire(st) {
    const R = this.shadowRoot, a = st.attributes || {}, step = this._step(st);
    R.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); if (st.state !== b.dataset.mode) this._call('set_hvac_mode', { hvac_mode: b.dataset.mode }); }));
    R.querySelectorAll('[data-fan]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); this._call('set_fan_mode', { fan_mode: b.dataset.fan }); }));
    R.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); this._call('set_preset_mode', { preset_mode: b.dataset.preset === a.preset_mode ? 'none' : b.dataset.preset }); }));
    R.querySelectorAll('[data-sel]').forEach(s => { s.addEventListener('click', e => e.stopPropagation()); s.addEventListener('change', () => s.dataset.sel === 'fan' ? this._call('set_fan_mode', { fan_mode: s.value }) : this._call('set_preset_mode', { preset_mode: s.value })); });
    const delay = { quick: 500, normal: 1000, slow: 2000 }[this._cfg.send_delay] || 1000;
    R.querySelectorAll('[data-adj]').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation(); this._buzz();
      const key = b.dataset.adj, d = +b.dataset.d, lo = num(a.min_temp) ?? 5, hi = num(a.max_temp) ?? 40;
      this._pendingVals = this._pendingVals || {};
      let v = this._pendingVals[key] ?? num(a[key]); v = Math.round((v + d * step) / step) * step; v = Math.max(lo, Math.min(hi, +v.toFixed(1)));
      if (key === 'target_temp_low') v = Math.min(v, (this._pendingVals.target_temp_high ?? num(a.target_temp_high)) - step);
      if (key === 'target_temp_high') v = Math.max(v, (this._pendingVals.target_temp_low ?? num(a.target_temp_low)) + step);
      this._pendingVals[key] = v; this._pending = true;
      const el = R.querySelector(`[data-v="${key}"]`); if (el) { el.textContent = fmt(v, step) + '°'; el.parentElement.classList.add('pending'); }
      clearTimeout(this._sendT); this._sendT = setTimeout(() => this._sendTargets(), delay);
    }));
    R.querySelectorAll('[data-slide]').forEach(el => this._drag(el, st));
    const card = R.querySelector('ha-card');
    let t = null, held = false;
    const inside = e => e.composedPath().some(n => n.localName === 'button' || n.localName === 'select' || (n.classList && n.classList.contains('hs')));
    card.addEventListener('pointerdown', e => { if (inside(e)) return; held = false; clearTimeout(t); t = setTimeout(() => { held = true; this._act(this._cfg.hold, this._cfg.hold_page); }, 550); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => card.addEventListener(ev, () => clearTimeout(t)));
    card.addEventListener('click', e => { if (inside(e) || held) return; this._act(this._cfg.tap, this._cfg.tap_page); });
  }
  _sendTargets() {
    const p = this._pendingVals || {}, st = this._st(), a = st?.attributes || {}, data = {};
    if (p.temperature != null) data.temperature = p.temperature;
    if (p.target_temp_low != null || p.target_temp_high != null) { data.target_temp_low = p.target_temp_low ?? num(a.target_temp_low); data.target_temp_high = p.target_temp_high ?? num(a.target_temp_high); }
    this._pendingVals = {}; this._pending = false;
    if (Object.keys(data).length) this._call('set_temperature', data);
    setTimeout(() => { this._sig = null; if (!this._pending) this.hass = this._hass; }, 1500);
  }
  _drag(el, st) {
    const a = st.attributes || {}, kind = el.dataset.slide, step = this._step(st), fm = a.fan_modes || [];
    let active = false;
    const frac = e => { const r = el.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); };
    const valOf = f => kind === 'fan' ? fm[Math.round(f * (fm.length - 1))] : (() => { const lo = +el.dataset.min, hi = +el.dataset.max; return Math.max(lo, Math.min(hi, +(Math.round((lo + f * (hi - lo)) / step) * step).toFixed(1))); })();
    const show = f => { const v = valOf(f); const p = kind === 'fan' ? (fm.length > 1 ? fm.indexOf(v) / (fm.length - 1) * 100 : 100) : (v - el.dataset.min) / (el.dataset.max - el.dataset.min) * 100; el.style.setProperty('--p', p + '%'); el.querySelector('[data-v]').textContent = kind === 'fan' ? v : fmt(v, step) + '°'; return v; };
    el.dataset.holdSlide = '';
    el.addEventListener('pointerdown', e => { active = true; this._dragging = true; el.setPointerCapture?.(e.pointerId); el.classList.add('moving'); show(frac(e)); e.preventDefault(); e.stopPropagation(); });
    el.addEventListener('pointermove', e => { if (active) show(frac(e)); });
    el.addEventListener('pointerup', e => {
      if (!active) return; active = false; el.classList.remove('moving'); const v = show(frac(e));
      if (kind === 'fan') { if (v !== a.fan_mode) this._call('set_fan_mode', { fan_mode: v }); } else this._call('set_temperature', { temperature: v });
      setTimeout(() => { this._dragging = false; this._sig = null; this.hass = this._hass; }, 1500);
    });
    el.addEventListener('pointercancel', () => { active = false; this._dragging = false; el.classList.remove('moving'); });
  }
}

/* ---------------- visual editor ---------------- */
const sel = opts => ({ select: { mode: 'dropdown', options: opts.map(([value, label]) => ({ value, label })) } });
const toggle = { boolean: {} };
const size4 = sel([['small', 'Small'], ['medium', 'Medium'], ['large', 'Large'], ['extra_large', 'Extra large']]);
const schema = (d, hass) => {
  const grid = items => ({ type: 'grid', name: '', flatten: true, schema: items });
  const section = (name, title, icon, items) => ({ name, type: 'expandable', flatten: true, title, icon, schema: items });
  const avail = hass?.states[d.entity]?.attributes?.hvac_modes || Object.keys(MODE_INFO);
  const action = sel([['none', 'Do nothing'], ['more_info', 'Open the thermostat pop-up'], ['page', 'Go to a page']]);
  return [
    { name: 'entity', selector: { entity: { filter: { domain: 'climate' } } } },
    grid([{ name: 'name', selector: { text: {} } }, { name: 'icon', selector: { icon: {} } }]),
    section('g_show', 'What to show', 'mdi:eye-outline', [grid([
      { name: 'show_name', selector: toggle }, { name: 'show_icon', selector: toggle },
      { name: 'show_current', selector: toggle }, { name: 'show_unit', selector: toggle },
      { name: 'show_status', selector: toggle }, { name: 'show_humidity', selector: toggle },
      { name: 'show_outdoor', selector: toggle }, { name: 'show_modes', selector: toggle },
      { name: 'show_target', selector: toggle }, { name: 'show_fan', selector: toggle },
      { name: 'show_presets', selector: toggle },
    ])]),
    section('g_modes', 'Mode buttons', 'mdi:thermostat', [
      { name: 'modes', selector: { select: { multiple: true, mode: 'list', options: avail.map(m => ({ value: m, label: MODE_INFO[m]?.[0] || m })) } } },
      grid([
        { name: 'modes_position', selector: sel([['auto', 'Beside the temperature (moves under on small screens)'], ['beside', 'Always beside the temperature'], ['below', 'Always under the temperature']]) },
        { name: 'mode_content', selector: sel([['icon', 'Icon only'], ['icon_words', 'Icon and words'], ['words', 'Words only']]) },
        { name: 'mode_size', selector: size4 },
        { name: 'mode_shape', selector: sel([['square', 'Square corners'], ['rounded', 'Rounded'], ['extra_round', 'Circle']]) },
        { name: 'mode_style', selector: sel([['tinted', 'Soft colour'], ['solid', 'Solid colour'], ['outline', 'Outline'], ['glass', 'Clear glass']]) },
        ...(d.mode_style === 'tinted' ? [{ name: 'mode_tint', selector: sel([['very_soft', 'Very soft'], ['soft', 'Soft'], ['medium', 'Medium'], ['bold', 'Bold']]) }] : []),
        { name: 'mode_text_size', selector: sel([['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']]) },
      ]),
    ]),
    section('g_colours_mode', 'Mode colours', 'mdi:palette', [grid([
      { name: 'heat_color', selector: { color_rgb: {} } }, { name: 'cool_color', selector: { color_rgb: {} } },
      { name: 'auto_color', selector: { color_rgb: {} } }, { name: 'dry_color', selector: { color_rgb: {} } },
      { name: 'fan_color', selector: { color_rgb: {} } }, { name: 'off_color', selector: { color_rgb: {} } },
    ])]),
    section('g_target', 'Set temperature', 'mdi:thermometer-lines', [grid([
      { name: 'target_style', selector: sel([['buttons', 'Minus and plus buttons'], ['slider', 'Slider']]) },
      { name: 'target_size', selector: size4 },
      { name: 'step', selector: sel([['auto', 'Automatic'], ['0.5', 'Half a degree'], ['1', 'One degree']]) },
      { name: 'send_delay', selector: sel([['quick', 'Quickly (½ second)'], ['normal', 'After 1 second'], ['slow', 'After 2 seconds']]) },
      { name: 'off_words', selector: { text: {} } },
    ])]),
    section('g_fan', 'Fan and presets', 'mdi:fan', [grid([
      { name: 'fan_style', selector: sel([['auto', 'Automatic'], ['buttons', 'Buttons'], ['slider', 'Slider'], ['dropdown', 'Drop-down list']]) },
      { name: 'fan_words', selector: { text: {} } },
      { name: 'preset_style', selector: sel([['chips', 'Buttons'], ['dropdown', 'Drop-down list']]) },
    ])]),
    section('g_sensors', 'Extra sensors', 'mdi:home-thermometer-outline', [
      { name: 'humidity_sensor', selector: { entity: { filter: { domain: 'sensor', device_class: 'humidity' } } } },
      { name: 'outdoor_sensor', selector: { entity: { filter: { domain: 'sensor', device_class: 'temperature' } } } },
    ]),
    section('g_layout', 'Layout and text', 'mdi:page-layout-header', [grid([
      { name: 'card_spacing', selector: sel([['compact', 'Compact'], ['standard', 'Standard'], ['roomy', 'Roomy']]) },
      { name: 'corners', selector: sel([['square', 'Square'], ['rounded', 'Rounded'], ['extra_round', 'Extra round']]) },
      { name: 'font', selector: sel([['classic', 'Classic'], ['theme', 'Same as Home Assistant'], ['rounded', 'Rounded']]) },
      { name: 'title_size', selector: size4 }, { name: 'title_caps', selector: toggle },
      { name: 'title_color', selector: { color_rgb: {} } },
      { name: 'temp_size', selector: size4 },
    ])]),
    section('g_colours', 'Background and glow', 'mdi:palette-outline', [grid([
      { name: 'off_background', selector: sel([['theme', 'Clear frosted glass'], ['darker', 'Darker frosted glass'], ['lighter', 'Lighter frosted glass'], ['custom', 'Frosted glass in my own colour']]) },
      ...(d.off_background === 'custom' ? [{ name: 'off_custom_color', selector: { color_rgb: {} } }] : []),
      { name: 'glow_when', selector: sel([['running', 'Only while heating or cooling'], ['on', 'Whenever it is on'], ['never', 'Never']]) },
      { name: 'glow_strength', selector: sel([['subtle', 'Subtle'], ['normal', 'Normal'], ['strong', 'Strong']]) },
      { name: 'temp_colour', selector: sel([['state', 'Match the mode colour'], ['white', 'White']]) },
      { name: 'icon_color', selector: sel([['state', 'Match the mode colour'], ['white', 'White'], ['custom', 'My own colour']]) },
      ...(d.icon_color === 'custom' ? [{ name: 'icon_custom_color', selector: { color_rgb: {} } }] : []),
      { name: 'hover_color', selector: { color_rgb: {} } },
      { name: 'animations', selector: toggle },
    ])]),
    section('g_actions', 'Tap and hold', 'mdi:gesture-tap', [
      { name: 'tap', selector: action },
      ...(d.tap === 'page' ? [{ name: 'tap_page', selector: { navigation: {} } }] : []),
      { name: 'hold', selector: action },
      ...(d.hold === 'page' ? [{ name: 'hold_page', selector: { navigation: {} } }] : []),
      { name: 'haptics', selector: toggle },
    ]),
  ];
};
const LABELS = {
  edit_all: 'Master edit – change all Thermostat cards at once', reset_style: 'Use the shared style on this card (clear its own changes)',
  entity: 'Thermostat', name: 'Card title', icon: 'Icon',
  show_name: 'Name', show_icon: 'Icon', show_current: 'Room temperature', show_unit: '°C / °F letter', show_status: 'What it’s doing (Heating to 21°)',
  show_humidity: 'Humidity', show_outdoor: 'Outdoor temperature', show_modes: 'Mode buttons', show_target: 'Set temperature', show_fan: 'Fan controls', show_presets: 'Presets',
  modes: 'Which modes to show (none ticked = all)', modes_position: 'Where the mode buttons go', mode_content: 'What the mode buttons show', mode_size: 'Mode button size',
  mode_shape: 'Mode button shape', mode_style: 'Look of the selected mode', mode_tint: 'Colour strength', mode_text_size: 'Mode word size',
  heat_color: 'Heat colour', cool_color: 'Cool colour', auto_color: 'Auto / Heat + Cool colour', dry_color: 'Dry colour', fan_color: 'Fan colour', off_color: 'Off colour',
  target_style: 'How to set the temperature', target_size: 'Size', step: 'Each press changes it by', send_delay: 'Send the new temperature', off_words: 'Words shown when off',
  fan_style: 'Fan controls style', fan_words: 'Fan word', preset_style: 'Presets style',
  humidity_sensor: 'Humidity sensor', outdoor_sensor: 'Outdoor temperature sensor',
  card_spacing: 'Spacing inside the card', corners: 'Card corners', font: 'Lettering style', title_size: 'Title size', title_caps: 'Title in capitals', title_color: 'Title colour', temp_size: 'Room temperature size',
  off_background: 'Background', off_custom_color: 'Your background colour', glow_when: 'Glow', glow_strength: 'Glow strength', temp_colour: 'Room temperature colour',
  icon_color: 'Icon colour', icon_custom_color: 'Your icon colour', hover_color: 'Edge colour on mouse-over (grey = follow the mode)', animations: 'Gentle animations',
  tap: 'When you tap the card', tap_page: 'Page to open on tap', hold: 'When you press and hold', hold_page: 'Page to open on hold', haptics: 'Vibrate on press (phones)',
};
const HELPERS = {
  name: 'Leave empty to use the thermostat’s name.',
  humidity_sensor: 'Leave empty to use the thermostat’s own humidity.',
  send_delay: 'Waits after your last press so it only sends one change.',
};

class OneStopThermostatCardEditor extends HTMLElement {
  setConfig(config) { this._config = { ...config }; this._render(); }
  set hass(hass) { const first = !this._hass; this._hass = hass; if (first) Shared.get(hass).then(() => this._render()); this._render(); }
  _inherited() { Shared._readCache(); return { ...DEFAULTS, ...((Shared.data || {})[SECTION] || {}) }; }
  _ownStyle() { return Object.keys(this._config || {}).filter(k => !ROOM_KEYS.includes(k)); }
  _emit(cfg) { this._config = cfg; this._render(); this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: cfg }, bubbles: true, composed: true })); }
  _onChange(v) {
    if (!!v.edit_all !== !!this._all) { this._all = !!v.edit_all; this._render(); return; }
    const type = this._config.type || 'custom:' + TAG;
    if (v.reset_style) { const cfg = { type }; for (const k of ROOM_KEYS) if (k in this._config && k !== 'type') cfg[k] = this._config[k]; return this._emit(cfg); }
    const dep = { off_custom_color: v.off_background === 'custom', icon_custom_color: v.icon_color === 'custom', mode_tint: v.mode_style === 'tinted', tap_page: v.tap === 'page', hold_page: v.hold === 'page' };
    const clean = {};
    for (const [k, val] of Object.entries(v)) { if (['type', 'edit_all', 'reset_style'].includes(k) || val === '' || val == null || dep[k] === false) continue; if (Array.isArray(val) && !val.length && !okRgb(val)) continue; clean[k] = val; }
    const inherited = this._inherited(), cfg = { type };
    for (const k of ROOM_KEYS) if (k !== 'type' && k in clean && !(k in DEFAULTS && same(clean[k], DEFAULTS[k]))) cfg[k] = clean[k];
    if (this._all) {
      const shared = {}; for (const [k, val] of Object.entries(clean)) if (!ROOM_KEYS.includes(k) && !(k in DEFAULTS && same(val, DEFAULTS[k]))) shared[k] = val;
      for (const k of this._ownStyle()) if (same(clean[k], this._shown?.[k])) cfg[k] = this._config[k];
      for (const k of Object.keys(clean)) if (!ROOM_KEYS.includes(k) && !same(clean[k], this._shown?.[k])) delete cfg[k];
      if (!same(shared, (Shared.data || {})[SECTION] || {})) {
        Shared.data = { ...(Shared.data || {}), [SECTION]: shared }; Shared.listeners.forEach(fn => fn(Shared.data));
        clearTimeout(this._t); this._t = setTimeout(() => Shared.save(this._hass, shared).catch(() => {}), 500);
      }
    } else for (const [k, val] of Object.entries(clean)) if (!ROOM_KEYS.includes(k) && !same(val, inherited[k])) cfg[k] = val;
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
    const inh = this._inherited(), own = this._ownStyle();
    const room = Object.fromEntries(Object.entries(this._config).filter(([k]) => ROOM_KEYS.includes(k)));
    const data = this._all ? { ...inh, ...room } : { ...inh, ...this._config };
    data.edit_all = !!this._all; data.reset_style = false; this._shown = data;
    this._note.textContent = this._all ? 'Master edit is on: look changes apply to every Thermostat card. Thermostat, sensors, modes and tap/hold still apply to this card only.'
      : own.length ? `This card has ${own.length} setting${own.length > 1 ? 's' : ''} of its own.` : 'Turn on Master edit to change every Thermostat card at once.';
    this._form.hass = this._hass;
    this._form.schema = [{ name: 'edit_all', selector: toggle }, ...(!this._all && own.length ? [{ name: 'reset_style', selector: toggle }] : []), ...schema(data, this._hass)];
    this._form.data = data;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, OneStopThermostatCard);
if (!customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, OneStopThermostatCardEditor);
window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === TAG)) window.customCards.push({ type: TAG, name: 'One Stop - Thermostat card', description: 'Thermostat with room temperature, what it’s doing, mode buttons, set temperature, fan and presets. Glows while heating or cooling.', preview: true });
console.info(`%c ONE STOP %c Thermostat card ${VERSION} `, 'background:#375374;color:#fff;border-radius:3px 0 0 3px;padding:2px 4px', 'background:#e9eef5;color:#375374;border-radius:0 3px 3px 0;padding:2px 4px');
})();
