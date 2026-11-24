/*!
 * One Stop – Smoker card
 * A smoker / pellet grill (Traeger and others with a climate entity) with optional MEATER-style probes.
 * Idle: a calm "ready for your next cook" scene. Cooking: big grill temperature, target with − / +,
 * ambient, pellets, active probes, and a Shut down button that asks first.
 */
(() => {
'use strict';
const VERSION = '1.0.0';
const TAG = 'one-stop-smoker-card';
const EDITOR_TAG = TAG + '-editor';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ic = n => `<ha-icon icon="mdi:${n}"></ha-icon>`;
const PROBE_COLORS = ['210,165,116', '126,187,182', '170,162,213', '206,156,187'];
const OFF = ['unknown', 'unavailable', '', undefined, null];

const GRILL_SVG = `<svg viewBox="0 0 160 140" fill="none" aria-hidden="true"><ellipse cx="84" cy="128" rx="65" ry="6" fill="black" opacity=".17"/><g stroke="#aeb7c2" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M109 40V17h9v33" fill="rgba(100,112,128,.24)"/><path d="M105 17h17M107 12h13"/><path d="M25 57c0-18 13-28 35-28h28c20 0 31 11 31 28v22c0 7-6 12-13 12H38c-8 0-13-5-13-12Z" fill="rgba(109,121,137,.22)"/><path d="M27 57h90" stroke="#c7b59d" opacity=".7"/><path d="M65 38h20M64 38v5m22-5v5" stroke="#d0c3b2"/><rect x="123" y="55" width="25" height="28" rx="3" fill="rgba(110,120,135,.2)"/><path d="M121 53h29M135 85v34M46 92l-9 30M99 92l10 30M41 109h62M16 67h8M15 63v13"/><circle cx="36" cy="123" r="6" fill="#343c47"/><circle cx="110" cy="123" r="6" fill="#343c47"/></g><g class="smoke" stroke="#c9b59f" stroke-width="2" stroke-linecap="round" opacity="0"><path d="M113 8c-4-4 4-6 0-10"/><path d="M119 6c-4-4 4-6 0-10"/></g></svg>`;

const CSS = `
:host{display:block}*{box-sizing:border-box}
button{all:unset;box-sizing:border-box;cursor:pointer;-webkit-tap-highlight-color:transparent}
ha-card{position:relative;overflow:hidden;padding:12px 18px 18px;border-radius:18px;color:var(--primary-text-color,#f2f6fa);
  background:linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.015)),var(--bubble-main-background-color,var(--secondary-background-color,#1f2329));
  border:1px solid rgba(255,255,255,.12);box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 10px 24px rgba(0,0,0,.10);-webkit-backdrop-filter:blur(18px) saturate(1.1);backdrop-filter:blur(18px) saturate(1.1)}
ha-card.hot{background:radial-gradient(120% 80% at 100% 0%,rgba(233,155,85,.16),transparent 60%),linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.015)),var(--bubble-main-background-color,var(--secondary-background-color,#1f2329))}
.hd{display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:8px;align-items:center;min-height:44px;margin-bottom:12px}
.hd h2{margin:0;font-size:22px;line-height:27px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hd p{margin:1px 0 0;font-size:12.5px;color:#aebdcb;display:flex;align-items:center;gap:6px;white-space:nowrap;overflow:hidden}
.dot{flex:none;width:7px;height:7px;border-radius:50%;background:#8796a6}.dot.on{background:#e9a060;box-shadow:0 0 8px rgba(233,160,96,.9)}.dot.off{background:#f87171}
.pill{height:44px;padding:0 14px;border-radius:14px;display:flex;align-items:center;gap:8px;border:1px solid rgba(211,224,238,.16);background:rgba(66,70,76,.42);font-size:14.5px;font-weight:650}
.pill ha-icon{--mdc-icon-size:22px}.pill.hot{background:rgba(233,155,85,.2);border-color:rgba(233,155,85,.5)}.pill.dead{opacity:.55;pointer-events:none}
.idle{display:grid;grid-template-columns:minmax(0,1fr) 128px;align-items:center;gap:10px;min-height:128px;border-top:1px solid rgba(255,255,255,.08);padding-top:14px}
.idle small{font-size:11px;line-height:16px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#c9b59f}
.idle h3{font-size:20px;font-weight:600;line-height:25px;margin:6px 0 10px}
.facts{display:flex;flex-wrap:wrap;gap:5px}.facts span{font-size:11.5px;padding:4px 8px;border-radius:8px;background:rgba(255,255,255,.07);color:#cdd7e2}
.grill{width:128px;height:112px;position:relative;display:grid;place-items:center}
.grill:before{content:'';position:absolute;inset:0;border-radius:50%;background:radial-gradient(ellipse,rgba(185,151,112,.12),transparent 70%)}
.grill svg{position:relative;width:128px;height:112px;filter:drop-shadow(0 5px 8px rgba(0,0,0,.2))}
.hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;padding:16px;border-radius:17px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.025)}
.lab{font-size:11px;line-height:16px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#c9b59f}
.big{font-size:54px;line-height:1.05;font-weight:650;letter-spacing:-2px;font-variant-numeric:tabular-nums;margin-top:4px}.big span{font-size:22px;color:#bfcbd9;margin-left:2px;letter-spacing:0}
.bar{height:5px;border-radius:3px;background:rgba(255,255,255,.12);overflow:hidden;margin-top:10px}.bar i{display:block;height:100%;background:linear-gradient(90deg,#e9a060,#f0c27a);transition:width .6s}
.note{font-size:12.5px;color:#aebdce;margin-top:7px}
.side{display:flex;flex-direction:column;gap:12px;padding-left:14px;border-left:1px solid rgba(255,255,255,.1);min-width:92px}
.side div span{display:block;font-size:11.5px;color:#aebdce}.side div b{font-size:21px;font-weight:600;font-variant-numeric:tabular-nums}.side small{font-size:12px;color:#b6c3d3;margin-left:2px;font-weight:500}
.set{display:grid;grid-template-columns:56px minmax(0,1fr) 56px;gap:10px;align-items:center;margin-top:12px}
.sq{height:56px;border-radius:16px;display:grid;place-items:center;border:1px solid rgba(233,155,85,.35);background:rgba(233,155,85,.14)}.sq ha-icon{--mdc-icon-size:28px}
.sq:active,.pill:active,.go:active{transform:scale(.95)}
.setv{text-align:center}.setv span{display:block;font-size:11.5px;color:#aebdce}.setv b{font-size:26px;font-weight:600;font-variant-numeric:tabular-nums}
.sec{display:flex;align-items:center;gap:7px;margin:16px 2px 9px;color:#c4cfdd;font-size:13px;font-weight:600}.sec ha-icon{--mdc-icon-size:19px}
.probes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.probes.one{grid-template-columns:1fr}
.pr{min-width:0;padding:12px;border-radius:14px;border:1px solid rgba(210,220,234,.13);background:rgba(66,70,76,.22)}
.pr .h{display:flex;gap:6px;align-items:center;font-size:12px;color:#cdd7e3}.pr .h i{width:7px;height:7px;border-radius:50%;background:rgb(var(--pc))}.pr .h em{margin-left:auto;font-style:normal;font-size:10.5px;color:#94a0af}
.pr .v{font-size:28px;line-height:34px;font-weight:600;color:rgb(var(--pc));font-variant-numeric:tabular-nums;margin-top:4px}.pr .v small{font-size:13px;margin-left:2px}
.pr .t{font-size:11.5px;color:#aebdce;margin-top:2px}.pr .pb{height:4px;border-radius:2px;background:rgba(255,255,255,.1);overflow:hidden;margin-top:8px}.pr .pb i{display:block;height:100%;background:rgb(var(--pc))}
.go{width:100%;height:48px;margin-top:14px;border-radius:14px;display:flex;align-items:center;justify-content:center;gap:8px;font-weight:650;font-size:15px;border:1px solid rgba(220,90,80,.45);background:rgba(220,90,80,.12);color:#f3b1ab}
.go ha-icon{--mdc-icon-size:21px}.go.sure{background:rgba(220,90,80,.38);color:#fff}
.hide{display:none!important}
`;

class OneStopSmokerCard extends HTMLElement {
  static getConfigElement() { return document.createElement(EDITOR_TAG); }
  static getStubConfig(hass) { const c = Object.keys(hass?.states || {}).find(x => x.startsWith('climate.') && /grill|traeger|smoke|pellet/i.test(x + hass.states[x].attributes.friendly_name + (hass.states[x].attributes.icon || ''))); return { climate: c || '' }; }
  setConfig(c) { if (!c || !c.climate) throw new Error('Pick the smoker’s climate entity'); this._cfg = { unit: 'F', step: 5, min: 165, max: 500, ...c }; if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._sig = null; if (this._hass) this._render(); }
  set hass(h) { this._hass = h; this._render(); }
  getCardSize() { return 5; }
  getGridOptions() { return { columns: 12, rows: 'auto', min_columns: 12 }; }
  _s(id) { return id ? this._hass.states[id] : null; }
  _num(id) { const s = this._s(id); if (!s || OFF.includes(s.state)) return null; const n = Number(s.state); return Number.isFinite(n) ? n : null; }
  _conv(n, from) { const to = this._cfg.unit; if (n == null) return null; if (/C/.test(from || '') && to === 'F') return n * 9 / 5 + 32; if (/F/.test(from || '') && to === 'C') return (n - 32) * 5 / 9; return n; }
  _t(id) { const n = this._num(id); return n == null ? null : this._conv(n, this._s(id).attributes.unit_of_measurement); }
  _fmt(n, d = 0) { return n == null ? '—' : n.toFixed(d); }
  _probes() {
    const P = this._cfg.probes || [];
    return P.map((p, i) => {
      const pre = typeof p === 'string' ? p : p.prefix || '';
      const ent = k => (typeof p === 'object' && p[k]) || (pre ? pre + k + (k === 'cooking' || k === 'cook_state' || k === 'time_remaining' ? '' : '_temperature') : '');
      const internal = this._t(ent('internal')), target = this._t(ent('target')), cooking = String(this._s(ent('cooking'))?.state || '').toLowerCase();
      const remaining = this._s(ent('time_remaining'))?.state;
      const live = internal != null && !['off', 'false', '0', 'idle', 'not cooking', 'not_cooking'].includes(cooking);
      return { i, name: (typeof p === 'object' && p.name) || `Probe ${i + 1}`, internal, target, live, remaining: OFF.includes(remaining) ? null : remaining };
    }).filter(p => p.live);
  }
  _setEnt() { const n = this._cfg.set_temperature; return n && this._s(n) && !OFF.includes(this._s(n).state) ? n : null; }
  _target() {
    if (this._cfg.target_sensor) { const v = this._t(this._cfg.target_sensor); if (v != null) return v; }
    const n = this._setEnt(); if (n) return this._t(n);
    const c = this._s(this._cfg.climate), t = c?.attributes?.temperature; return t == null ? null : this._conv(Number(t), c.attributes.temperature_unit || this._hass.config?.unit_system?.temperature);
  }
  _grill() { const g = this._t(this._cfg.grill_temperature); if (g != null) return g; const c = this._s(this._cfg.climate), t = c?.attributes?.current_temperature; return t == null ? null : this._conv(Number(t), c.attributes.temperature_unit || this._hass.config?.unit_system?.temperature); }
  _render() {
    const R = this.shadowRoot; if (!R || !this._hass || !this._cfg) return;
    const c = this._cfg, cl = this._s(c.climate), avail = cl && !OFF.includes(cl.state), hot = avail && cl.state !== 'off';
    const grill = this._grill(), target = hot ? this._target() : null, ambient = this._t(c.ambient_temperature), pellets = this._num(c.pellet_level), probes = hot ? this._probes() : [];
    const U = '°' + c.unit, state = this._s(c.state_sensor)?.state;
    const mode = !avail ? 'Offline' : hot ? (grill != null && target != null && grill < target - 15 ? 'Heating up' : 'Cooking') : 'Off';
    const sig = JSON.stringify([mode, grill, target, ambient, pellets, probes, state, this._confirm, this._pending]);
    if (sig === this._sig) return; this._sig = sig;
    const pct = grill != null && target ? Math.max(4, Math.min(100, grill / target * 100)) : 0;
    const facts = [state && !OFF.includes(state) ? state.replace(/_/g, ' ').replace(/^./, x => x.toUpperCase()) : '', pellets != null ? `Pellets ${Math.round(pellets)}%` : '', ambient != null ? `Outside ${this._fmt(ambient)}${U}` : ''].filter(Boolean);
    const brand = c.subtitle || 'Traeger';
    R.innerHTML = `<style>${CSS}</style><ha-card class="${hot ? 'hot' : ''}">
      <div class="hd"><div style="min-width:0"><h2>${esc(c.name || 'Smoker')}</h2><p><span class="dot ${hot ? 'on' : !avail ? 'off' : ''}"></span>${esc(brand)} · ${esc(mode)}</p></div>
        ${hot ? '' : `<span class="pill ${avail ? '' : 'dead'}">${ic(avail ? 'power' : 'wifi-off')}${avail ? 'Off' : 'Offline'}</span>`}</div>
      ${!hot ? `<div class="idle"><div><small>${avail ? 'Between cooks' : 'Disconnected'}</small><h3>${avail ? 'Ready for your next cook' : 'Waiting for the smoker to connect'}</h3>${facts.length ? `<div class="facts">${facts.map(f => `<span>${esc(f)}</span>`).join('')}</div>` : ''}</div><div class="grill">${GRILL_SVG}</div></div>` : `
      <div class="hero"><div style="min-width:0"><div class="lab">Grill temperature</div><div class="big">${this._fmt(grill)}<span>${U}</span></div>
          ${target ? `<div class="bar"><i style="width:${pct}%"></i></div><div class="note">${grill != null && grill < target - 15 ? `${Math.round(target - grill)}° to go` : 'Holding steady'}</div>` : ''}</div>
        <div class="side"><div><span>Target</span><b>${this._fmt(target)}<small>${U}</small></b></div>${ambient != null ? `<div><span>Outside</span><b>${this._fmt(ambient)}<small>${U}</small></b></div>` : ''}${pellets != null ? `<div><span>Pellets</span><b>${Math.round(pellets)}<small>%</small></b></div>` : ''}</div></div>
      ${target != null && c.show_controls !== false ? `<div class="set"><button class="sq" data-a="down" aria-label="Lower target">${ic('minus')}</button><div class="setv"><span>Set to</span><b>${this._fmt(this._pending ?? target)}${U}</b></div><button class="sq" data-a="up" aria-label="Raise target">${ic('plus')}</button></div>` : ''}
      ${probes.length ? `<div class="sec">${ic('thermometer-lines')}Probes</div><div class="probes ${probes.length === 1 ? 'one' : ''}">${probes.map(p => `<div class="pr" style="--pc:${PROBE_COLORS[p.i % 4]}"><div class="h"><i></i>${esc(p.name)}<em>${p.remaining ? esc(p.remaining) : 'Live'}</em></div><div class="v">${this._fmt(p.internal)}<small>${U}</small></div><div class="t">${p.target != null ? `Target ${this._fmt(p.target)}${U}` : 'No target set'}</div>${p.target ? `<div class="pb"><i style="width:${Math.min(100, p.internal / p.target * 100)}%"></i></div>` : ''}</div>`).join('')}</div>` : ''}
      ${c.show_shutdown !== false ? `<button class="go ${this._confirm ? 'sure' : ''}" data-a="off">${ic('power')}${this._confirm ? 'Tap again to shut down' : 'Shut down'}</button>` : ''}`}
    </ha-card>`;
    R.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); this._act(b.dataset.a); }));
  }
  _act(a) {
    const c = this._cfg;
    if (a === 'off') {
      if (!this._confirm) { this._confirm = true; this._sig = null; this._render(); clearTimeout(this._ct); this._ct = setTimeout(() => { this._confirm = false; this._sig = null; this._render(); }, 4000); return; }
      this._confirm = false; this._hass.callService('climate', 'set_hvac_mode', { entity_id: c.climate, hvac_mode: 'off' }); this._sig = null; this._render(); return;
    }
    if (a === 'up' || a === 'down') {
      const base = this._pending ?? this._target(); if (base == null) return;
      const v = Math.max(c.min, Math.min(c.max, Math.round((base + (a === 'up' ? c.step : -c.step)) / c.step) * c.step));
      this._pending = v; this._sig = null; this._render();
      clearTimeout(this._pt); this._pt = setTimeout(() => {
        const n = this._setEnt();
        if (n) { const u = this._s(n).attributes.unit_of_measurement; const val = /C/.test(u || '') && c.unit === 'F' ? (v - 32) * 5 / 9 : /F/.test(u || '') && c.unit === 'C' ? v * 9 / 5 + 32 : v; this._hass.callService('number', 'set_value', { entity_id: n, value: Math.round(val) }); }
        else { const cl = this._s(c.climate), u = cl.attributes.temperature_unit || this._hass.config?.unit_system?.temperature; const val = /C/.test(u || '') && c.unit === 'F' ? +((v - 32) * 5 / 9).toFixed(1) : v; this._hass.callService('climate', 'set_temperature', { entity_id: c.climate, temperature: val }); }
        setTimeout(() => { this._pending = null; this._sig = null; this._render(); }, 4000);
      }, 900);
    }
  }
}

class OneStopSmokerCardEditor extends HTMLElement {
  setConfig(c) { this._config = { ...c }; this._draw(); }
  set hass(h) { this._hass = h; if (this._form) this._form.hass = h; else this._draw(); }
  _draw() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement('ha-form');
      this._form.computeLabel = s => ({ climate: 'Smoker (climate entity)', name: 'Name', subtitle: 'Brand label (default Traeger)', unit: 'Show temperatures in', grill_temperature: 'Grill temperature sensor', target_sensor: 'Target temperature sensor', set_temperature: 'Set temperature (number entity)', ambient_temperature: 'Outside temperature sensor', pellet_level: 'Pellet level sensor', state_sensor: 'Grill status sensor', probes_text: 'Probes, one per line (entity prefix, e.g. sensor.meater_probe_ab12cd34_)', step: 'Step for − / +', min: 'Lowest target', max: 'Highest target', show_controls: 'Show − / + target buttons', show_shutdown: 'Show Shut down button' }[s.name] || s.name);
      this._form.addEventListener('value-changed', e => {
        const v = { ...e.detail.value }, out = { type: this._config.type };
        for (const [k, x] of Object.entries(v)) if (k !== 'probes_text' && x !== '' && x != null) out[k] = x;
        const pr = String(v.probes_text || '').split('\n').map(l => l.trim()).filter(Boolean); if (pr.length) out.probes = pr;
        this._config = out; this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: out }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    const S = d => ({ entity: { domain: d } });
    this._form.schema = [
      { name: 'climate', selector: S('climate') },
      { type: 'grid', name: '', schema: [{ name: 'name', selector: { text: {} } }, { name: 'subtitle', selector: { text: {} } }] },
      { type: 'grid', name: '', schema: [{ name: 'grill_temperature', selector: S('sensor') }, { name: 'target_sensor', selector: S('sensor') }] },
      { type: 'grid', name: '', schema: [{ name: 'set_temperature', selector: S('number') }, { name: 'ambient_temperature', selector: S('sensor') }] },
      { type: 'grid', name: '', schema: [{ name: 'pellet_level', selector: S('sensor') }, { name: 'state_sensor', selector: S('sensor') }] },
      { name: 'probes_text', selector: { text: { multiline: true } } },
      { type: 'grid', name: '', schema: [{ name: 'unit', selector: { select: { mode: 'dropdown', options: ['F', 'C'] } } }, { name: 'step', selector: { number: { min: 1, max: 25, mode: 'box' } } }, { name: 'min', selector: { number: { min: 0, max: 700, mode: 'box' } } }, { name: 'max', selector: { number: { min: 0, max: 700, mode: 'box' } } }] },
      { type: 'grid', name: '', schema: [{ name: 'show_controls', selector: { boolean: {} } }, { name: 'show_shutdown', selector: { boolean: {} } }] },
    ];
    const c = this._config;
    this._form.data = { unit: 'F', step: 5, min: 165, max: 500, show_controls: true, show_shutdown: true, ...c, probes_text: (c.probes || []).map(p => typeof p === 'string' ? p : p.prefix || '').join('\n') };
  }
}
if (!customElements.get(TAG)) customElements.define(TAG, OneStopSmokerCard);
if (!customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, OneStopSmokerCardEditor);
window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === TAG)) window.customCards.push({ type: TAG, name: 'One Stop - Smoker', description: 'Smoker / pellet grill with grill temperature, target − / +, pellets, probes and a safe Shut down.', preview: true });
console.info(`%c ONE STOP SMOKER %c ${VERSION} `, 'color:#fff;background:#b45309;font-weight:700', 'color:#b45309;background:#fff');
})();
