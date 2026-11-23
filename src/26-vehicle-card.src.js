/*!
 * One Stop – Vehicle card
 * A car or truck in one card: big picture, round action buttons (start, lock, lights, horn…)
 * and tidy info tiles (fuel, range, tires, service status…). Everything is set in the visual editor.
 */
(() => {
'use strict';
const VERSION = '1.0.0';
const TAG = 'one-stop-vehicle-card';
const EDITOR_TAG = TAG + '-editor';
const MAX_ACTIONS = 12, MAX_STATS = 24;

const COLORS = { green: '94,214,140', blue: '96,165,250', purple: '167,139,250', yellow: '250,204,21', teal: '45,212,191', red: '248,113,113', orange: '251,146,60', grey: '170,180,195' };
const DEFAULTS = { name: '', image: '', image_entity: '', show_updated: true, updated_entity: '', confirm_all: false, haptics: true, actions: [], stats: [], schedule_switch: '', schedule_time: '' };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dead = st => !st || ['unknown', 'unavailable'].includes(st.state);
const WORDS = { NO_ACTION_REQUIRED: 'OK', GOOD: 'Good', TRUE: 'Yes', FALSE: 'No', home: 'Home', not_home: 'Away', on: 'On', off: 'Off' };
const nice = s => WORDS[s] ?? String(s).replace(/_/g, ' ').toLowerCase().replace(/^./, c => c.toUpperCase());
const ago = ts => { const t = Date.parse(ts); if (!t) return ''; const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };
const iconFor = id => ({ button: 'mdi:gesture-tap-button', script: 'mdi:play', lock: 'mdi:car-door-lock', switch: 'mdi:toggle-switch', automation: 'mdi:robot' }[id?.split('.')[0]] || 'mdi:information-outline');

const CSS = `
:host{display:block}
ha-card{position:relative;overflow:hidden;padding:18px 14px 16px;border-radius:24px;color:#f2f6fa;font-family:var(--primary-font-family,Arial,sans-serif);
  background:radial-gradient(120% 70% at 50% 18%,rgba(70,110,170,.30),rgba(15,22,36,0) 70%),linear-gradient(180deg,#141d2c,#0d131e);
  border:1px solid rgba(255,255,255,.10);box-shadow:0 14px 34px rgba(0,0,0,.35)}
h2{margin:0;font:700 22px/26px inherit;letter-spacing:-.3px}
.upd{font-size:13px;color:#8f9db0;margin-top:2px}
.pic{display:block;width:92%;max-width:440px;margin:14px auto 6px;filter:drop-shadow(0 16px 18px rgba(0,0,0,.55))}
.acts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px 4px;margin:14px 0 4px}
@container (min-width:560px){.acts{grid-template-columns:repeat(6,minmax(0,1fr))}}
button{all:unset;box-sizing:border-box;cursor:pointer;-webkit-tap-highlight-color:transparent}
.a{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;min-width:0}
.a .c{width:54px;height:54px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.10);transition:transform .1s}
.a:active .c{transform:scale(.92)}
.a .c ha-icon{--mdc-icon-size:24px;color:#e8eef5}
.a.on .c{background:rgba(var(--ac),.16);border:1.5px solid rgba(var(--ac),.9);box-shadow:0 0 14px rgba(var(--ac),.35)} .a.on .c ha-icon{color:rgb(var(--ac))}
.a.busy .c{animation:pulse 1s ease-in-out infinite}@keyframes pulse{50%{opacity:.45}}
.a b{font-size:12px;font-weight:600;line-height:14px;color:#e8eef5}
.a small{font-size:11px;color:#8f9db0;margin-top:-4px}
.sec{font-size:13px;font-weight:650;color:#9aa7b8;letter-spacing:.3px;text-transform:uppercase;margin:16px 4px 8px}
.stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.s{display:grid;grid-template-columns:38px minmax(0,1fr);gap:0 10px;align-items:center;height:62px;padding:0 12px;border-radius:14px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08);min-width:0}
.s .i{grid-row:1/3;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.07)}
.s .i ha-icon{--mdc-icon-size:20px;color:rgb(var(--sc))}
.s span{font-size:12px;color:#9aa7b8;align-self:end;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.s strong{font-size:15px;font-weight:700;align-self:start;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.s.warn{border-color:rgba(248,113,113,.55)} .s.warn strong{color:#fca5a5}
.empty{font-size:14px;color:#9aa7b8;padding:10px 4px}
.toast{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);padding:10px 16px;border-radius:12px;background:rgba(10,14,22,.95);border:1px solid rgba(255,255,255,.15);font-size:14px;font-weight:600;white-space:nowrap}
`;

class OneStopVehicleCard extends HTMLElement {
  static getConfigElement() { return document.createElement(EDITOR_TAG); }
  static getStubConfig(hass) {
    const ids = Object.keys(hass?.states || {});
    const tracker = ids.find(e => e.startsWith('device_tracker.') && /car|truck|vehicle|chev|ford|tesla|toyota|honda/i.test(e));
    return { name: tracker ? hass.states[tracker].attributes.friendly_name : 'My vehicle', actions: [], stats: tracker ? [{ name: 'Location', icon: 'mdi:map-marker', entity: tracker, color: 'red' }] : [] };
  }
  setConfig(c) { if (!c) throw new Error('Invalid configuration'); this._cfg = { ...DEFAULTS, ...c }; if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._built = false; if (this._hass) this._render(); }
  set hass(h) { this._hass = h; if (!this._built) this._render(); else this._update(); }
  getCardSize() { return 10; }
  getGridOptions() { return { columns: 12, rows: 'auto', min_columns: 6 }; }
  _img() { const c = this._cfg; if (c.image) return c.image; const st = c.image_entity && this._hass.states[c.image_entity]; return st?.attributes?.entity_picture || ''; }
  _render() {
    const c = this._cfg, R = this.shadowRoot; if (!R || !this._hass) return;
    const acts = (c.actions || []).filter(a => a && (a.entity || a.name));
    const stats = (c.stats || []).filter(s => s && s.entity);
    const sched = c.schedule_switch || c.schedule_time;
    const img = this._img();
    R.innerHTML = `<style>${CSS}</style><ha-card style="container-type:inline-size">
      <h2>${esc(c.name || 'My vehicle')}</h2>${c.show_updated ? '<div class="upd" data-upd></div>' : ''}
      ${img ? `<img class="pic" src="${esc(img)}" alt="">` : ''}
      ${acts.length ? `<div class="acts">${acts.map((a, i) => `<button class="a" data-a="${i}" style="--ac:${COLORS[a.color] || COLORS.green}"><span class="c"><ha-icon icon="${esc(a.icon || iconFor(a.entity))}"></ha-icon></span><b>${esc(a.name || '')}</b><small data-as="${i}"></small></button>`).join('')}</div>` : ''}
      ${sched ? `<div class="sec">Scheduled start</div><div class="stats">
        ${c.schedule_switch ? `<button class="s" data-sw style="--sc:${COLORS.blue}"><span class="i"><ha-icon icon="mdi:clock-start"></ha-icon></span><span>Scheduled start</span><strong data-swv></strong></button>` : ''}
        ${c.schedule_time ? `<button class="s" data-st style="--sc:${COLORS.purple}"><span class="i"><ha-icon icon="mdi:clock-edit-outline"></ha-icon></span><span>Start time</span><strong data-stv></strong></button>` : ''}</div>` : ''}
      ${stats.length ? `${c.stats_title ? `<div class="sec">${esc(c.stats_title)}</div>` : '<div style="height:14px"></div>'}<div class="stats">${stats.map((s, i) => `<button class="s" data-s="${i}" style="--sc:${COLORS[s.color] || COLORS.blue}"><span class="i"><ha-icon icon="${esc(s.icon || this._hass.states[s.entity]?.attributes?.icon || 'mdi:information-outline')}"></ha-icon></span><span>${esc(s.name || this._hass.states[s.entity]?.attributes?.friendly_name || s.entity)}</span><strong data-sv="${i}"></strong></button>`).join('')}</div>` : ''}
      ${!acts.length && !stats.length ? '<div class="empty">Add buttons and info tiles in the card editor.</div>' : ''}
    </ha-card>`;
    this._acts = acts; this._stats = stats; this._built = true;
    R.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => this._press(acts[+b.dataset.a], b)));
    R.querySelectorAll('[data-s]').forEach(b => b.addEventListener('click', () => this._more(stats[+b.dataset.s].entity)));
    R.querySelector('[data-sw]')?.addEventListener('click', () => { this._buzz(); this._hass.callService('homeassistant', 'toggle', { entity_id: c.schedule_switch }); });
    R.querySelector('[data-st]')?.addEventListener('click', () => this._more(c.schedule_time));
    this._update();
  }
  _value(s) {
    const st = this._hass.states[s.entity]; if (dead(st)) return '—';
    if (s.attribute) { const v = st.attributes[s.attribute]; return v == null ? '—' : String(v); }
    if (/^[A-Z_]+$/.test(st.state) || ['home', 'not_home'].includes(st.state)) return nice(st.state);
    try { if (this._hass.formatEntityState) return this._hass.formatEntityState(st); } catch (e) {}
    const n = Number(st.state); const u = st.attributes.unit_of_measurement || '';
    return Number.isFinite(n) ? `${n.toLocaleString(undefined, { maximumFractionDigits: 1 })}${u ? ' ' + u : ''}` : nice(st.state);
  }
  _update() {
    const R = this.shadowRoot, h = this._hass, c = this._cfg; if (!R || !this._built) return;
    (this._stats || []).forEach((s, i) => {
      const el = R.querySelector(`[data-sv="${i}"]`); if (!el) return; const v = this._value(s); if (el.textContent !== v) el.textContent = v;
      const st = h.states[s.entity]; const bad = st && (/(ACTION_REQUIRED|WARNING|CRITICAL|LOW)$/.test(st.state) && st.state !== 'NO_ACTION_REQUIRED' || st.state === 'TRUE' && /low/i.test(s.entity));
      el.parentElement.classList.toggle('warn', !!bad);
      el.parentElement.style.display = s.hide_state && st && String(s.hide_state).split(',').map(x => x.trim()).includes(st.state) ? 'none' : '';
    });
    (this._acts || []).forEach((a, i) => {
      const st = h.states[a.entity], sub = R.querySelector(`[data-as="${i}"]`), btn = sub?.parentElement; if (!btn) return;
      let txt = '', on = false;
      if (st && ['lock', 'switch', 'input_boolean', 'automation', 'fan', 'light'].includes(a.entity.split('.')[0])) { txt = nice(st.state === 'locked' ? 'Locked' : st.state === 'unlocked' ? 'Unlocked' : st.state); on = ['on', 'locked'].includes(st.state); }
      else if (a.show_last && st && a.entity.startsWith('button.')) txt = ago(st.state);
      if (sub.textContent !== txt) sub.textContent = txt;
      btn.classList.toggle('on', on);
    });
    const upd = R.querySelector('[data-upd]');
    if (upd) { const ent = c.updated_entity && h.states[c.updated_entity]; const t = ent ? (Date.parse(ent.state) ? ent.state : ent.last_changed) : null; upd.textContent = t ? `Updated ${ago(t)}` : ''; }
    const sw = R.querySelector('[data-swv]'); if (sw) { const st = h.states[c.schedule_switch]; sw.textContent = dead(st) ? '—' : st.state === 'on' ? 'On' : 'Off'; sw.parentElement.classList.toggle('warn', false); }
    const tm = R.querySelector('[data-stv]'); if (tm) { const st = h.states[c.schedule_time]; tm.textContent = dead(st) ? '—' : this._time(st); }
  }
  _time(st) {
    const [H, M] = String(st.state).split(':').map(Number); if (!Number.isFinite(H)) return st.state;
    return new Date(2000, 0, 1, H, M).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  async _press(a, btn) {
    if (!a?.entity) return;
    if ((a.confirm || this._cfg.confirm_all) && !confirm(`${a.name || 'Do this'}?`)) return;
    this._buzz(); const d = a.entity.split('.')[0], h = this._hass;
    btn.classList.add('busy'); setTimeout(() => btn.classList.remove('busy'), 2500);
    try {
      if (d === 'button' || d === 'input_button') await h.callService(d, 'press', { entity_id: a.entity });
      else if (d === 'script') await h.callService('script', 'turn_on', { entity_id: a.entity });
      else if (d === 'scene') await h.callService('scene', 'turn_on', { entity_id: a.entity });
      else if (d === 'lock') await h.callService('lock', h.states[a.entity]?.state === 'locked' ? 'unlock' : 'lock', { entity_id: a.entity });
      else await h.callService('homeassistant', 'toggle', { entity_id: a.entity });
      this._toast(`${a.name || 'Done'} – sent`);
    } catch (e) { this._toast(`Couldn't send: ${e.message || e}`); }
  }
  _more(id) { if (id) this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId: id }, bubbles: true, composed: true })); }
  _toast(m) { const card = this.shadowRoot.querySelector('ha-card'); card.querySelector('.toast')?.remove(); const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; card.appendChild(t); setTimeout(() => t.remove(), 2500); }
  _buzz() { if (this._cfg.haptics) { try { navigator.vibrate?.(10); } catch (e) {} } }
}

/* ---------------- visual editor ---------------- */
const colorSel = { select: { mode: 'dropdown', options: Object.keys(COLORS).map(k => ({ value: k, label: k[0].toUpperCase() + k.slice(1) })) } };
const LABELS = {
  name: 'Vehicle name', image: 'Picture (web address or /local/… file)', image_entity: 'Or use a picture entity', show_updated: 'Show "Updated … ago"', updated_entity: 'Sensor that shows when the data last updated',
  stats_title: 'Heading above the info tiles (optional)', confirm_all: 'Ask "are you sure?" before every button', haptics: 'Vibrate on press (phones)',
  schedule_switch: 'Scheduled start on/off (automation or switch)', schedule_time: 'Scheduled start time',
};
class OneStopVehicleCardEditor extends HTMLElement {
  setConfig(c) { this._config = { ...c }; this._draw(); }
  set hass(h) { this._hass = h; if (this._form) this._form.hass = h; else this._draw(); }
  _flat() {   // lists -> flat keys for ha-form
    const c = { ...DEFAULTS, ...this._config }, d = { ...c }; delete d.actions; delete d.stats; delete d.type;
    (c.actions || []).forEach((a, i) => { for (const k of ['name', 'icon', 'entity', 'color', 'confirm', 'show_last']) if (a[k] != null) d[`a${i}_${k}`] = a[k]; });
    (c.stats || []).forEach((s, i) => { for (const k of ['name', 'icon', 'entity', 'color', 'attribute', 'hide_state']) if (s[k] != null) d[`s${i}_${k}`] = s[k]; });
    return d;
  }
  _unflat(d) {
    const out = { type: this._config.type || `custom:${TAG}` }, acts = [], stats = [];
    for (const [k, v] of Object.entries(d)) {
      const m = k.match(/^([as])(\d+)_(\w+)$/);
      if (m) { const arr = m[1] === 'a' ? acts : stats; (arr[+m[2]] = arr[+m[2]] || {})[m[3]] = v; }
      else if (v !== '' && v != null && !(k in DEFAULTS && DEFAULTS[k] === v)) out[k] = v;
    }
    const clean = arr => arr.filter(x => x && (x.entity || x.name)).map(x => Object.fromEntries(Object.entries(x).filter(([, v]) => v !== '' && v != null && v !== false)));
    out.actions = clean(acts); out.stats = clean(stats); return out;
  }
  _draw() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement('ha-form');
      this._form.computeLabel = s => LABELS[s.name] ?? { name: 'Label', icon: 'Icon', entity: 'Entity', color: 'Icon colour', confirm: 'Ask "are you sure?" first', show_last: 'Show when it was last pressed', attribute: 'Show an attribute instead (optional)', hide_state: 'Hide this tile when the state is (e.g. NO_ACTION_REQUIRED)' }[s.name.replace(/^[as]\d+_/, '')] ?? s.name;
      this._form.addEventListener('value-changed', e => {
        this._config = this._unflat(e.detail.value);
        this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
        this._schema();
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass; this._schema();
  }
  _schema() {
    const c = this._config, na = Math.min(MAX_ACTIONS, (c.actions || []).length + 1), ns = Math.min(MAX_STATS, (c.stats || []).length + 1);
    const grid = s => ({ type: 'grid', name: '', schema: s });
    const title = (arr, i, word) => { const x = (arr || [])[i]; return x ? `${x.name || this._hass.states[x.entity]?.attributes?.friendly_name || x.entity || word}` : `+ Add ${word.toLowerCase()}`; };
    const acts = Array.from({ length: na }, (_, i) => ({ type: 'expandable', name: '', title: title(c.actions, i, 'Button'), icon: (c.actions || [])[i]?.icon || 'mdi:gesture-tap-button', schema: [
      { name: `a${i}_entity`, selector: { entity: { filter: [{ domain: 'button' }, { domain: 'script' }, { domain: 'lock' }, { domain: 'switch' }, { domain: 'input_button' }, { domain: 'scene' }, { domain: 'automation' }] } } },
      grid([{ name: `a${i}_name`, selector: { text: {} } }, { name: `a${i}_icon`, selector: { icon: {} } }]),
      grid([{ name: `a${i}_color`, selector: colorSel }, { name: `a${i}_confirm`, selector: { boolean: {} } }]),
      { name: `a${i}_show_last`, selector: { boolean: {} } },
    ] }));
    const stats = Array.from({ length: ns }, (_, i) => ({ type: 'expandable', name: '', title: title(c.stats, i, 'Info tile'), icon: (c.stats || [])[i]?.icon || 'mdi:information-outline', schema: [
      { name: `s${i}_entity`, selector: { entity: {} } },
      grid([{ name: `s${i}_name`, selector: { text: {} } }, { name: `s${i}_icon`, selector: { icon: {} } }]),
      grid([{ name: `s${i}_color`, selector: colorSel }, { name: `s${i}_attribute`, selector: { text: {} } }]),
      { name: `s${i}_hide_state`, selector: { text: {} } },
    ] }));
    this._form.schema = [
      grid([{ name: 'name', selector: { text: {} } }, { name: 'stats_title', selector: { text: {} } }]),
      { type: 'expandable', name: '', title: 'Picture', icon: 'mdi:image-outline', schema: [{ name: 'image', selector: { text: {} } }, { name: 'image_entity', selector: { entity: { filter: { domain: 'image' } } } }] },
      { type: 'expandable', name: '', title: `Buttons (${(c.actions || []).length})`, icon: 'mdi:gesture-tap-button', schema: acts },
      { type: 'expandable', name: '', title: `Info tiles (${(c.stats || []).length})`, icon: 'mdi:view-grid-outline', schema: stats },
      { type: 'expandable', name: '', title: 'Scheduled start', icon: 'mdi:clock-start', schema: [
        { name: 'schedule_switch', selector: { entity: { filter: [{ domain: 'automation' }, { domain: 'switch' }, { domain: 'input_boolean' }] } } },
        { name: 'schedule_time', selector: { entity: { filter: { domain: 'input_datetime' } } } }] },
      { type: 'expandable', name: '', title: 'Other', icon: 'mdi:cog-outline', schema: [
        { name: 'show_updated', selector: { boolean: {} } }, { name: 'updated_entity', selector: { entity: {} } },
        { name: 'confirm_all', selector: { boolean: {} } }, { name: 'haptics', selector: { boolean: {} } }] },
    ];
    this._form.data = this._flat();
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, OneStopVehicleCard);
if (!customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, OneStopVehicleCardEditor);
window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === TAG)) window.customCards.push({ type: TAG, name: 'One Stop - Vehicle card', description: 'A car or truck: picture, round action buttons and info tiles, all set up in the visual editor.', preview: true });
console.info(`%c ONE STOP VEHICLE CARD %c ${VERSION} `, 'color:#fff;background:#1d4ed8;font-weight:700', 'color:#1d4ed8;background:#fff');
})();
