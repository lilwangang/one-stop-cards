/*!
 * One Stop – Vehicle card
 * A car or truck in one card: big picture, round action buttons (start, lock, lights, horn…)
 * and tidy info tiles (fuel, range, tires, service status…). Everything is set in the visual editor.
 */
(() => {
'use strict';
const VERSION = '1.1.0';
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
ha-card{position:relative;overflow:hidden;padding:20px 16px 18px;border-radius:26px;color:#f2f6fa;font-family:var(--primary-font-family,Arial,sans-serif);container-type:inline-size;
  background:radial-gradient(90% 46% at 50% 24%,rgba(64,120,200,.34),rgba(64,120,200,0) 70%),linear-gradient(180deg,#101a2b 0%,#0b111c 60%,#090e17 100%)!important;
  border:1px solid rgba(255,255,255,.09);box-shadow:0 18px 40px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.06)}
button{all:unset;box-sizing:border-box;cursor:pointer;-webkit-tap-highlight-color:transparent}
.top{display:flex;align-items:baseline;justify-content:space-between;gap:10px}
h2{margin:0;font:750 24px/28px inherit;letter-spacing:-.5px}
.upd{font-size:12.5px;color:#7f8ea3;white-space:nowrap}
.hero{position:relative;margin:8px 0 0}
.hero::after{content:'';position:absolute;left:14%;right:14%;bottom:6px;height:22px;border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.65),rgba(0,0,0,0));z-index:0}
.pic{position:relative;z-index:1;display:block;width:94%;max-width:460px;margin:0 auto}
.primary{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;height:56px;margin:14px 0 4px;border-radius:18px;font-size:17px;font-weight:700;letter-spacing:.2px;
  background:linear-gradient(180deg,rgba(var(--ac),.95),rgba(var(--ac),.72));color:#06101f;box-shadow:0 10px 24px rgba(var(--ac),.28),inset 0 1px 0 rgba(255,255,255,.35);transition:transform .1s}
.primary ha-icon{--mdc-icon-size:24px}.primary:active{transform:scale(.98)}
.acts{display:grid;grid-template-columns:repeat(var(--cols),minmax(0,1fr));gap:16px 6px;margin:18px 0 2px}
.a{display:flex;flex-direction:column;align-items:center;gap:7px;text-align:center;min-width:0}
.a .c{width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 50% 30%,rgba(255,255,255,.12),rgba(255,255,255,.04));border:1px solid rgba(255,255,255,.12);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 6px 14px rgba(0,0,0,.3);transition:transform .1s,box-shadow .2s}
.a:active .c{transform:scale(.92)}
.a .c ha-icon{--mdc-icon-size:25px;color:rgb(var(--ac))}
.a.on .c{background:rgba(var(--ac),.16);border:1.5px solid rgba(var(--ac),.9);box-shadow:0 0 16px rgba(var(--ac),.4)}
.a.busy .c{animation:pulse 1s ease-in-out infinite}@keyframes pulse{50%{box-shadow:0 0 0 6px rgba(var(--ac),.18)}}
.a b{font-size:12px;font-weight:600;line-height:14px;color:#dbe3ec}
.a small{font-size:11px;color:#8f9db0;margin-top:-5px}
.sec{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:#8494a9;letter-spacing:.8px;text-transform:uppercase;margin:22px 4px 10px}
.sec::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,rgba(255,255,255,.12),rgba(255,255,255,0))}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.s{display:flex;align-items:center;gap:12px;min-height:64px;padding:10px 12px;border-radius:16px;background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.03));border:1px solid rgba(255,255,255,.07);min-width:0}
.s.wide{grid-column:1/-1}
.s .i{flex:none;width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:rgba(var(--sc),.14)}
.s .i ha-icon{--mdc-icon-size:21px;color:rgb(var(--sc))}
.s .t{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}
.s span{font-size:12px;color:#8f9db0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.s strong small{font-size:12px;font-weight:600;color:#9aa7b8;margin-left:3px;letter-spacing:0}
.s strong{color:#f4f7fb;font-size:17px;font-weight:700;letter-spacing:-.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.s.warn{border-color:rgba(248,113,113,.5);background:rgba(248,113,113,.08)} .s.warn strong{color:#fca5a5}
.s.ok strong{color:#86efac}
.sw{flex:none;width:46px;height:28px;border-radius:14px;background:rgba(255,255,255,.16);position:relative;transition:background .2s}
.sw::after{content:'';position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:left .2s;box-shadow:0 2px 4px rgba(0,0,0,.3)}
.sw.on{background:rgb(96,165,250)}.sw.on::after{left:21px}
.tires{display:grid;grid-template-columns:1fr 70px 1fr;grid-template-rows:auto auto;align-items:center;gap:12px 10px;padding:14px 12px;border-radius:16px;background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.03));border:1px solid rgba(255,255,255,.07)}
.tires .car{grid-column:2;grid-row:1/3;display:grid;place-items:center}
.tires .car .body{width:46px;height:104px;border-radius:18px 18px 12px 12px;border:2px solid rgba(255,255,255,.22);background:linear-gradient(180deg,rgba(255,255,255,.08) 0 30%,rgba(255,255,255,.03) 30% 52%,transparent 52%);position:relative}
.tires .car .body::before,.tires .car .body::after{content:'';position:absolute;left:-7px;right:-7px;height:18px;border-left:5px solid rgba(255,255,255,.3);border-right:5px solid rgba(255,255,255,.3);border-radius:2px}
.tires .car .body::before{top:14px}.tires .car .body::after{bottom:14px}
.tp{display:flex;flex-direction:column;gap:2px;padding:8px 10px;border-radius:12px;background:rgba(45,212,191,.10);border:1px solid rgba(45,212,191,.25)}
.tp.r{text-align:right}.tp span{font-size:11px;color:#8f9db0}.tp strong{font-size:18px;font-weight:700}.tp strong small{font-size:12px;color:#9aa7b8;font-weight:600}
.tp.low{background:rgba(251,146,60,.12);border-color:rgba(251,146,60,.5)}.tp.low strong{color:#fdba74}
.empty{font-size:14px;color:#9aa7b8;padding:10px 4px}
.toast{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);padding:10px 16px;border-radius:12px;background:rgba(10,14,22,.95);border:1px solid rgba(255,255,255,.15);font-size:14px;font-weight:600;white-space:nowrap;z-index:5}
`;

const TIRE_KEYS = [['tire_front_left', 'Front left'], ['tire_front_right', 'Front right'], ['tire_rear_left', 'Rear left'], ['tire_rear_right', 'Rear right']];
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
  _tile(s, i) {
    const st = this._hass.states[s.entity];
    return `<button class="s ${s.wide ? 'wide' : ''}" data-s="${i}" style="--sc:${COLORS[s.color] || COLORS.blue}"><span class="i"><ha-icon icon="${esc(s.icon || st?.attributes?.icon || 'mdi:information-outline')}"></ha-icon></span><span class="t"><span>${esc(s.name || st?.attributes?.friendly_name || s.entity)}</span><strong data-sv="${i}"></strong></span></button>`;
  }
  _render() {
    const c = this._cfg, R = this.shadowRoot; if (!R || !this._hass) return;
    const all = (c.actions || []).filter(a => a && (a.entity || a.name));
    const prim = all.filter(a => a.primary), acts = all.filter(a => !a.primary);
    const n = acts.length, cols = n <= 4 ? Math.max(n, 1) : n % 3 === 0 ? 3 : n % 4 === 0 || n > 6 ? 4 : n === 5 ? 5 : 3;
    const stats = (c.stats || []).filter(s => s && s.entity);
    const tires = TIRE_KEYS.filter(([k]) => c[k]);
    const health = (c.health || []).filter(Boolean);
    const img = this._img();
    let grid = '', open = false;
    stats.forEach((s, i) => {
      if (s.section || !open) { if (open) grid += '</div>'; grid += `${s.section ? `<div class="sec">${esc(s.section)}</div>` : '<div style="height:18px"></div>'}<div class="grid">`; open = true; }
      grid += this._tile(s, i);
    });
    if (open) grid += '</div>';
    this._allActs = [...prim, ...acts];
    R.innerHTML = `<style>${CSS}</style><ha-card>
      <div class="top"><h2>${esc(c.name || 'My vehicle')}</h2>${c.show_updated ? '<div class="upd" data-upd></div>' : ''}</div>
      ${img ? `<div class="hero"><img class="pic" src="${esc(img)}" alt=""></div>` : ''}
      ${prim.map((a, i) => `<button class="primary" data-a="${i}" style="--ac:${COLORS[a.color] || COLORS.blue}"><ha-icon icon="${esc(a.icon || iconFor(a.entity))}"></ha-icon>${esc(a.name || '')}<small data-as="${i}" hidden></small></button>`).join('')}
      ${n ? `<div class="acts" style="--cols:${cols}">${acts.map((a, j) => { const i = j + prim.length; return `<button class="a" data-a="${i}" style="--ac:${COLORS[a.color] || COLORS.grey}"><span class="c"><ha-icon icon="${esc(a.icon || iconFor(a.entity))}"></ha-icon></span><b>${esc(a.name || '')}</b><small data-as="${i}"></small></button>`; }).join('')}</div>` : ''}
      ${c.schedule_switch || c.schedule_time ? `<div class="sec">Scheduled start</div><div class="grid"><div class="s wide" style="--sc:${COLORS.blue}"><span class="i"><ha-icon icon="mdi:clock-start"></ha-icon></span>
        <button class="t" data-st><span>Starts every morning at</span><strong data-stv></strong></button>${c.schedule_switch ? '<button class="sw" data-sw aria-label="Scheduled start on or off"></button>' : ''}</div></div>` : ''}
      ${grid}
      ${tires.length ? `<div class="sec">${esc(c.tires_title || 'Tires')}</div><div class="tires">${tires.map(([k, l], i) => `<button class="tp ${i % 2 ? 'r' : ''}" data-tire="${k}" style="grid-column:${i % 2 ? 3 : 1};grid-row:${i < 2 ? 1 : 2}"><span>${l}</span><strong data-tv="${k}"></strong></button>`).join('')}<div class="car"><div class="body"></div></div></div>` : ''}
      ${health.length ? `<div class="sec">${esc(c.health_title || 'Health')}</div><div class="grid" data-health></div>` : ''}
      ${!all.length && !stats.length ? '<div class="empty">Add buttons and info tiles in the card editor.</div>' : ''}
    </ha-card>`;
    this._acts = this._allActs; this._stats = stats; this._built = true;
    R.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => this._press(this._acts[+b.dataset.a], b)));
    R.querySelectorAll('[data-s]').forEach(b => b.addEventListener('click', () => this._more(stats[+b.dataset.s].entity)));
    R.querySelectorAll('[data-tire]').forEach(b => b.addEventListener('click', () => this._more(c[b.dataset.tire])));
    R.querySelector('[data-sw]')?.addEventListener('click', () => { this._buzz(); this._hass.callService('homeassistant', 'toggle', { entity_id: c.schedule_switch }); });
    R.querySelector('[data-st]')?.addEventListener('click', () => this._more(c.schedule_time || c.schedule_switch));
    this._update();
  }
  _value(s) {
    const st = this._hass.states[s.entity]; if (dead(st)) return '—';
    if (s.attribute) { const v = st.attributes[s.attribute]; return v == null ? '—' : String(v); }
    if (/^[A-Z_]+$/.test(st.state) || ['home', 'not_home'].includes(st.state)) return nice(st.state);
    const n = Number(st.state), u = String(st.attributes.unit_of_measurement || '');
    if (Number.isFinite(n)) {
      if (/^\$$|CAD|USD/i.test(u)) { const per = u.match(/\/\s*(l|liter|litre|gal)/i); return `$${n.toFixed(per ? 3 : 2)}${per ? '/' + (per[1][0].toLowerCase() === 'g' ? 'gal' : 'L') : ''}`; }
      const dp = Math.abs(n) >= 1000 ? 0 : Math.abs(n) >= 100 ? 0 : 1;
      return `${n.toLocaleString(undefined, { maximumFractionDigits: dp })}${u ? (u === '%' ? '%' : ' ' + u) : ''}`;
    }
    try { if (this._hass.formatEntityState) return this._hass.formatEntityState(st); } catch (e) {}
    return nice(st.state);
  }
  _update() {
    const R = this.shadowRoot, h = this._hass, c = this._cfg; if (!R || !this._built) return;
    (this._stats || []).forEach((s, i) => {
      const el = R.querySelector(`[data-sv="${i}"]`); if (!el) return; const v = this._value(s); const m = String(v).match(/^([-$\d.,]+(?:\/L|\/gal)?)\s+(\S.*)$/); const html = m ? `${esc(m[1])}<small>${esc(m[2])}</small>` : esc(v); if (el.innerHTML !== html) el.innerHTML = html;
      const st = h.states[s.entity], tile = el.closest('.s'); const bad = st && (/(ACTION_REQUIRED|WARNING|CRITICAL|LOW)$/.test(st.state) && st.state !== 'NO_ACTION_REQUIRED' || st.state === 'TRUE' && /low/i.test(s.entity));
      tile.classList.toggle('warn', !!bad);
      tile.style.display = s.hide_state && st && String(s.hide_state).split(',').map(x => x.trim()).includes(st.state) ? 'none' : '';
    });
    const low = +c.tire_low || 30;
    for (const [k] of TIRE_KEYS) {
      const el = R.querySelector(`[data-tv="${k}"]`); if (!el) continue; const st = h.states[c[k]];
      const n = Number(st?.state); el.innerHTML = Number.isFinite(n) ? `${Math.round(n)}<small> ${esc(st.attributes.unit_of_measurement || 'psi')}</small>` : '—';
      el.parentElement.classList.toggle('low', Number.isFinite(n) && n < low);
    }
    const hb = R.querySelector('[data-health]');
    if (hb) {
      const okv = String(c.health_ok || 'NO_ACTION_REQUIRED').split(',').map(x => x.trim());
      const bad = (c.health || []).filter(e => { const st = h.states[e]; return st && !dead(st) && !okv.includes(st.state); });
      const key = bad.map(e => e + h.states[e].state).join('|') || 'ok';
      if (hb.dataset.k !== key) {
        hb.dataset.k = key;
        hb.innerHTML = bad.length ? bad.map(e => `<button class="s wide warn" data-he="${esc(e)}" style="--sc:${COLORS.red}"><span class="i"><ha-icon icon="mdi:alert-circle-outline"></ha-icon></span><span class="t"><span>${esc((h.states[e].attributes.friendly_name || e).replace(c.name_strip || /^\d{4}\s+\S+\s+\S+\s+/, ''))}</span><strong>${esc(nice(h.states[e].state))}</strong></span></button>`).join('')
          : `<div class="s wide ok" style="--sc:${COLORS.green}"><span class="i"><ha-icon icon="mdi:shield-check-outline"></ha-icon></span><span class="t"><span>${(c.health || []).length} systems checked</span><strong>All good</strong></span></div>`;
        hb.querySelectorAll('[data-he]').forEach(b => b.addEventListener('click', () => this._more(b.dataset.he)));
      }
    }
    (this._acts || []).forEach((a, i) => {
      const st = h.states[a.entity], sub = R.querySelector(`[data-as="${i}"]`), btn = sub?.parentElement; if (!btn || btn.classList.contains('primary')) return;
      let txt = '', on = false;
      if (st && ['lock', 'switch', 'input_boolean', 'automation', 'fan', 'light'].includes(a.entity.split('.')[0])) { txt = nice(st.state === 'locked' ? 'Locked' : st.state === 'unlocked' ? 'Unlocked' : st.state); on = ['on', 'locked'].includes(st.state); }
      else if (a.show_last && st && a.entity.startsWith('button.')) txt = ago(st.state);
      if (sub.textContent !== txt) sub.textContent = txt;
      btn.classList.toggle('on', on);
    });
    const upd = R.querySelector('[data-upd]');
    if (upd) { const ent = c.updated_entity && h.states[c.updated_entity]; const t = ent ? (Date.parse(ent.state) ? ent.state : ent.last_changed) : null; upd.textContent = t ? `Updated ${ago(t)}` : ''; }
    const sw = R.querySelector('[data-sw]'); if (sw) sw.classList.toggle('on', h.states[c.schedule_switch]?.state === 'on');
    const tm = R.querySelector('[data-stv]'); if (tm) { const st = h.states[c.schedule_time], on = !c.schedule_switch || h.states[c.schedule_switch]?.state === 'on'; tm.textContent = (dead(st) ? '—' : this._time(st)) + (on ? '' : ' · off'); tm.style.opacity = on ? 1 : .55; }
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
  schedule_switch: 'Scheduled start on/off (automation or switch)', tire_front_left: 'Front left', tire_front_right: 'Front right', tire_rear_left: 'Rear left', tire_rear_right: 'Rear right', tire_low: 'Warn below', tires_title: 'Heading', health: 'Warning sensors (shown only when something is wrong)', health_ok: 'State that means OK', health_title: 'Heading', schedule_time: 'Scheduled start time',
};
class OneStopVehicleCardEditor extends HTMLElement {
  setConfig(c) { this._config = { ...c }; this._draw(); }
  set hass(h) { this._hass = h; if (this._form) this._form.hass = h; else this._draw(); }
  _flat() {   // lists -> flat keys for ha-form
    const c = { ...DEFAULTS, ...this._config }, d = { ...c }; delete d.actions; delete d.stats; delete d.type;
    (c.actions || []).forEach((a, i) => { for (const k of ['name', 'icon', 'entity', 'color', 'confirm', 'show_last', 'primary']) if (a[k] != null) d[`a${i}_${k}`] = a[k]; });
    (c.stats || []).forEach((s, i) => { for (const k of ['name', 'icon', 'entity', 'color', 'attribute', 'hide_state', 'section', 'wide']) if (s[k] != null) d[`s${i}_${k}`] = s[k]; });
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
      this._form.computeLabel = s => LABELS[s.name] ?? { name: 'Label', icon: 'Icon', entity: 'Entity', color: 'Icon colour', confirm: 'Ask "are you sure?" first', show_last: 'Show when it was last pressed', attribute: 'Show an attribute instead (optional)', hide_state: 'Hide this tile when the state is (e.g. NO_ACTION_REQUIRED)', primary: 'Big main button (full width)', section: 'Start a new group with this heading', wide: 'Full width' }[s.name.replace(/^[as]\d+_/, '')] ?? s.name;
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
      grid([{ name: `a${i}_show_last`, selector: { boolean: {} } }, { name: `a${i}_primary`, selector: { boolean: {} } }]),
    ] }));
    const stats = Array.from({ length: ns }, (_, i) => ({ type: 'expandable', name: '', title: title(c.stats, i, 'Info tile'), icon: (c.stats || [])[i]?.icon || 'mdi:information-outline', schema: [
      { name: `s${i}_entity`, selector: { entity: {} } },
      grid([{ name: `s${i}_name`, selector: { text: {} } }, { name: `s${i}_icon`, selector: { icon: {} } }]),
      grid([{ name: `s${i}_color`, selector: colorSel }, { name: `s${i}_attribute`, selector: { text: {} } }]),
      { name: `s${i}_section`, selector: { text: {} } },
      grid([{ name: `s${i}_hide_state`, selector: { text: {} } }, { name: `s${i}_wide`, selector: { boolean: {} } }]),
    ] }));
    this._form.schema = [
      grid([{ name: 'name', selector: { text: {} } }, { name: 'stats_title', selector: { text: {} } }]),
      { type: 'expandable', name: '', title: 'Picture', icon: 'mdi:image-outline', schema: [{ name: 'image', selector: { text: {} } }, { name: 'image_entity', selector: { entity: { filter: { domain: 'image' } } } }] },
      { type: 'expandable', name: '', title: `Buttons (${(c.actions || []).length})`, icon: 'mdi:gesture-tap-button', schema: acts },
      { type: 'expandable', name: '', title: `Info tiles (${(c.stats || []).length})`, icon: 'mdi:view-grid-outline', schema: stats },
      { type: 'expandable', name: '', title: 'Tires', icon: 'mdi:tire', schema: [
        grid([{ name: 'tire_front_left', selector: { entity: { filter: { domain: 'sensor' } } } }, { name: 'tire_front_right', selector: { entity: { filter: { domain: 'sensor' } } } }]),
        grid([{ name: 'tire_rear_left', selector: { entity: { filter: { domain: 'sensor' } } } }, { name: 'tire_rear_right', selector: { entity: { filter: { domain: 'sensor' } } } }]),
        grid([{ name: 'tire_low', selector: { number: { min: 10, max: 80, mode: 'box', unit_of_measurement: 'psi' } } }, { name: 'tires_title', selector: { text: {} } }])] },
      { type: 'expandable', name: '', title: 'Health checks', icon: 'mdi:shield-check-outline', schema: [
        { name: 'health', selector: { entity: { multiple: true, filter: { domain: 'sensor' } } } },
        grid([{ name: 'health_ok', selector: { text: {} } }, { name: 'health_title', selector: { text: {} } }])] },
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
