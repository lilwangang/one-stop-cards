/*!
 * One Stop – Roller Shade card
 * A room's shades in one card: drag the shade bar to any position, Close / Stop / Open,
 * room temperature and humidity, and a fold-out list of the individual shades.
 */
(() => {
'use strict';
const VERSION = '1.2.0';
const TAG = 'one-stop-roller-shade-card';
const EDITOR_TAG = TAG + '-editor';

const DEFAULTS = {
  name: '', icon: 'mdi:roller-shade', show_climate: true, show_buttons: true, show_stop: true,
  show_percent: true, right_closes: true, start_open: false, haptics: true, accent_color: [255, 183, 77],
};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const okRgb = v => Array.isArray(v) && v.length === 3 && v.every(n => Number.isFinite(+n));
const dead = st => !st || ['unknown', 'unavailable'].includes(st.state);
const pos = st => { const p = st?.attributes?.current_position; return typeof p === 'number' ? Math.round(p) : (st?.state === 'open' ? 100 : st?.state === 'closed' ? 0 : null); };
const status = (st, p) => dead(st) ? 'Unavailable' : st.state === 'opening' ? 'Opening…' : st.state === 'closing' ? 'Closing…'
  : p === 0 ? 'Closed' : p === 100 ? 'Fully open' : p == null ? 'Position unknown' : `${p}% open`;
const fmt = (st, unit) => dead(st) ? '—' : `${Number(st.state).toFixed(1).replace(/\.0$/, '.0')}${unit}`;

const CSS = `
:host{display:block;--ac:255,183,77;container-type:inline-size}
ha-card{position:relative;overflow:hidden;padding:16px;border-radius:24px;color:#f7f9fc;
  background:linear-gradient(160deg,rgba(255,255,255,.07),rgba(255,255,255,.015)),var(--ha-card-background,var(--card-background-color,rgba(28,31,38,.7)));
  border:1px solid rgba(255,255,255,.10);box-shadow:0 18px 40px rgba(0,0,0,.25);font-family:var(--ha-font-family-body,-apple-system,"SF Pro Text",Roboto,sans-serif)}
ha-card::after{content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;
  background:radial-gradient(120% 70% at 50% 0%,rgba(var(--ac),calc(.18 * var(--glow,0))),transparent 70%);transition:opacity .4s}
button{font:inherit;color:inherit;border:0;background:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
.head{display:flex;align-items:center;gap:12px;min-height:56px}
.ttl{flex:1;min-width:0;display:flex;align-items:center;gap:12px;text-align:left}
.ico{width:46px;height:46px;flex:none;display:grid;place-items:center;border-radius:15px;background:rgba(255,255,255,.07);
  border:1px solid rgba(255,255,255,.10);--mdc-icon-size:26px;transition:background .3s,color .3s}
.ico.on{background:rgba(var(--ac),.20);border-color:rgba(var(--ac),.45);color:rgb(var(--ac))}
.ttl b{display:flex;align-items:center;gap:2px;font-size:20px;font-weight:650;letter-spacing:-.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ttl small{display:block;font-size:13.5px;color:#cfd8e3;margin-top:2px}
.chev{--mdc-icon-size:22px;opacity:.85;transition:transform .25s}
.open .chev{transform:rotate(180deg)}
.chips{display:flex;gap:6px;flex:none}
.chip{display:flex;align-items:center;gap:4px;height:34px;padding:0 10px;border-radius:999px;font-weight:650;font-size:14px;--mdc-icon-size:16px}
.ttl>span:last-child{min-width:0;overflow:hidden}.ttl b span{overflow:hidden;text-overflow:ellipsis}
@container (max-width:470px){.head{flex-wrap:wrap}.chips{width:100%;padding-left:58px;margin-top:-4px}}
.chip.t{background:rgba(214,69,80,.32);border:1px solid rgba(240,120,128,.55)}
.chip.h{background:rgba(64,120,214,.32);border:1px solid rgba(120,170,240,.55)}
.bar{position:relative;height:74px;margin-top:14px;border-radius:22px;overflow:hidden;touch-action:pan-y;user-select:none;cursor:grab;
  background:rgba(8,10,14,.55);border:1px solid rgba(255,255,255,.08);box-shadow:inset 0 2px 8px rgba(0,0,0,.35)}
.bar.dead{opacity:.5;pointer-events:none}
.bar.drag{cursor:grabbing}
.fill{position:absolute;inset:0 auto 0 0;width:var(--p,0%);transition:width .35s cubic-bezier(.2,.8,.2,1);
  background:linear-gradient(90deg,rgba(var(--ac),.30),rgba(var(--ac),.55));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.18)}
.fill::before{content:"";position:absolute;inset:0;opacity:.35;
  background:repeating-linear-gradient(90deg,transparent 0 11px,rgba(255,255,255,.10) 11px 12px)}
.fill::after{content:"";position:absolute;top:8px;bottom:8px;right:5px;width:4px;border-radius:3px;background:rgba(255,255,255,.8);
  box-shadow:0 0 10px rgba(var(--ac),.9);opacity:var(--hem,1)}
.bar.drag .fill{transition:none}
.rev .fill{background:linear-gradient(90deg,rgba(120,132,150,.42),rgba(150,162,180,.55))}
.rev .fill::after{box-shadow:0 0 8px rgba(255,255,255,.5)}
.lab{position:absolute;inset:0;display:flex;align-items:center;justify-content:space-between;padding:0 18px;pointer-events:none}
.lab ha-icon{--mdc-icon-size:24px;opacity:.9}
.mid{text-align:center;line-height:1.2}
.mid b{display:block;font-size:17px;font-weight:650}
.mid{position:relative;z-index:1;text-shadow:0 1px 6px rgba(0,0,0,.75)}
.mid span{font-size:14.5px;color:#dbe3ec}
.btns{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:10px;margin-top:12px}
.btn{height:50px;border-radius:16px;display:flex;align-items:center;justify-content:center;gap:7px;font-size:16px;font-weight:600;
  background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);transition:transform .12s,background .2s;--mdc-icon-size:20px}
.btn:active{transform:scale(.96);background:rgba(255,255,255,.14)}
.btn.lit{background:rgba(var(--ac),.22);border-color:rgba(var(--ac),.5)}
.more{display:grid;grid-template-rows:0fr;transition:grid-template-rows .3s ease}
.open .more{grid-template-rows:1fr}
.more>div{overflow:hidden}
.sub{font-size:13px;font-weight:600;letter-spacing:.3px;text-transform:uppercase;color:#aeb9c6;margin:16px 4px 2px}
.more .bar{height:62px;margin-top:10px;border-radius:19px}
.more .mid b{font-size:15.5px}.more .mid span{font-size:13.5px}
@media (prefers-reduced-motion:reduce){.fill,.more,.chev{transition:none}}
`;

class OneStopRollerShadeCard extends HTMLElement {
  static getConfigElement() { return document.createElement(EDITOR_TAG); }
  static getStubConfig(hass) {
    const c = Object.keys(hass?.states || {}).filter(e => e.startsWith('cover.'));
    return { entity: c[0] || '', shades: c.slice(1, 3) };
  }
  constructor() { super(); this.attachShadow({ mode: 'open' }); this._open = null; }
  setConfig(config) {
    if (!config || !config.entity) throw new Error('Pick the main shade (or shade group)');
    this._cfg = { ...DEFAULTS, ...config };
    if (this._open == null) this._open = !!this._cfg.start_open;
    this._built = false; if (this._hass) this._render();
  }
  set hass(h) { this._hass = h; this._built ? this._update() : this._render(); }
  getCardSize() { return 4; }
  getGridOptions() { return { columns: 12, min_columns: 12, rows: 'auto' }; }

  _render() {
    const c = this._cfg, h = this._hass; if (!c || !h) return;
    const ac = okRgb(c.accent_color) ? c.accent_color : DEFAULTS.accent_color;
    const shades = (c.shades || []).filter(Boolean);
    const name = c.name || h.states[c.entity]?.attributes?.friendly_name || 'Shades';
    const rev = c.right_closes !== false, [iL, iR] = rev ? ['mdi:roller-shade', 'mdi:roller-shade-closed'] : ['mdi:roller-shade-closed', 'mdi:roller-shade'];
    const bar = (id, label) => `<div class="bar${rev ? ' rev' : ''}" data-hold-slide data-bar="${esc(id)}"><div class="fill"></div><div class="lab"><ha-icon icon="${iL}"></ha-icon>
      <div class="mid"><b>${esc(label)}</b><span data-st></span></div><ha-icon icon="${iR}"></ha-icon></div></div>`;
    const btn = (a, icon, word) => `<button class="btn" data-a="${a}" aria-label="${word}"><ha-icon icon="${icon}"></ha-icon>${word}</button>`;
    this.shadowRoot.innerHTML = `<style>${CSS}</style><ha-card class="${this._open ? 'open' : ''}" style="--ac:${ac.join(',')}">
      <div class="head">
        <button class="ttl" data-toggle ${shades.length ? '' : 'disabled'} aria-expanded="${this._open}">
          <span class="ico"><ha-icon icon="${esc(c.icon)}"></ha-icon></span>
          <span style="min-width:0"><b><span>${esc(name)}</span>${shades.length ? '<ha-icon class="chev" icon="mdi:chevron-down"></ha-icon>' : ''}</b><small data-sum></small></span>
        </button>
        ${c.show_climate && (c.temperature || c.humidity) ? `<div class="chips">
          ${c.temperature ? `<div class="chip t" data-t><ha-icon icon="mdi:thermometer"></ha-icon><span></span></div>` : ''}
          ${c.humidity ? `<div class="chip h" data-h><ha-icon icon="mdi:water-percent"></ha-icon><span></span></div>` : ''}</div>` : ''}
      </div>
      ${bar(c.entity, c.bar_name || 'All shades')}
      ${c.show_buttons ? `<div class="btns">${(rev ? ['open', 'stop', 'close'] : ['close', 'stop', 'open']).filter(a => a !== 'stop' || c.show_stop).map(a => btn(a, { open: 'mdi:arrow-collapse-up', stop: 'mdi:pause', close: 'mdi:arrow-collapse-down' }[a], { open: 'Open', stop: 'Stop', close: 'Close' }[a])).join('')}</div>` : ''}
      ${shades.length ? `<div class="more"><div><div class="sub">Individual shades</div>${shades.map(e => bar(e, h.states[e]?.attributes?.friendly_name || e)).join('')}</div></div>` : ''}
    </ha-card>`;
    const R = this.shadowRoot;
    R.querySelector('[data-toggle]')?.addEventListener('click', () => {
      if (!shades.length) return; this._buzz(); this._open = !this._open;
      R.querySelector('ha-card').classList.toggle('open', this._open);
      R.querySelector('[data-toggle]').setAttribute('aria-expanded', this._open);
    });
    R.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => {
      this._buzz(); const svc = { open: 'open_cover', close: 'close_cover', stop: 'stop_cover' }[b.dataset.a];
      this._hass.callService('cover', svc, { entity_id: c.entity });
    }));
    R.querySelectorAll('[data-bar]').forEach(el => this._wireBar(el));
    this._built = true; this._update();
  }

  _wireBar(el) {
    const id = el.dataset.bar; let start = null;
    const at = e => { const r = el.getBoundingClientRect(); const x = Math.max(0, Math.min(100, Math.round((e.clientX - r.left) / r.width * 100))); return this._cfg.right_closes !== false ? 100 - x : x; };
    el.addEventListener('pointerdown', e => {
      if (e.button) return; start = { x: e.clientX, y: e.clientY, moved: false }; el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', e => {
      if (!start) return;
      if (!start.moved && Math.abs(e.clientX - start.x) < 6) return;
      start.moved = true; el.classList.add('drag'); this._show(el, at(e), this._hass.states[id], true);
    });
    const end = e => {
      if (!start) return; const moved = start.moved; start = null; el.classList.remove('drag');
      if (!moved) return;                                     // a tap does nothing: no accidental moves while scrolling
      let p = at(e); if (p < 3) p = 0; if (p > 97) p = 100;
      this._buzz(); this._hold = { id, p, t: Date.now() };
      this._show(el, p, this._hass.states[id], true);
      this._hass.callService('cover', 'set_cover_position', { entity_id: id, position: p });
    };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', () => { start = null; el.classList.remove('drag'); this._update(); });
  }
  _show(el, p, st, target) {
    el.style.setProperty('--p', `${this._cfg.right_closes !== false ? 100 - (p ?? 0) : (p ?? 0)}%`); el.style.setProperty('--hem', p > 2 && p < 100 ? 1 : 0);
    el.classList.toggle('dead', dead(st));
    const s = el.querySelector('[data-st]');
    if (s) s.textContent = target ? `${p === 0 ? 'Close' : p === 100 ? 'Open fully' : 'Move to ' + p + '%'}` : (this._cfg.show_percent ? status(st, p) : status(st, p).replace(/\d+% open/, 'Partly open'));
  }
  _update() {
    const c = this._cfg, h = this._hass, R = this.shadowRoot; if (!R || !h) return;
    const main = h.states[c.entity], mp = pos(main);
    const hold = this._hold && Date.now() - this._hold.t < 20000 ? this._hold : null;
    R.querySelectorAll('[data-bar]').forEach(el => {
      if (el.classList.contains('drag')) return;
      const st = h.states[el.dataset.bar]; let p = pos(st);
      if (hold && hold.id === el.dataset.bar && st && !['opening', 'closing'].includes(st.state) && p !== hold.p && Date.now() - hold.t < 4000) p = hold.p;
      this._show(el, p, st, false);
    });
    const all = [c.entity, ...(c.shades || [])].map(e => h.states[e]).filter(s => !dead(s));
    const openCount = all.filter(s => (pos(s) || 0) > 0).length;
    const sum = R.querySelector('[data-sum]');
    if (sum) sum.textContent = dead(main) ? 'Unavailable' : (c.shades || []).length
      ? (openCount === 0 ? 'All closed' : openCount === all.length ? (all.every(s => pos(s) === 100) ? 'All open' : 'All partly open') : `${openCount} of ${all.length} open`)
      : status(main, mp);
    R.querySelector('.ico')?.classList.toggle('on', (mp || 0) > 0);
    R.querySelector('ha-card')?.style.setProperty('--glow', Math.min(1, (mp || 0) / 100));
    const moving = main?.state;
    R.querySelectorAll('[data-a]').forEach(b => b.classList.toggle('lit', (b.dataset.a === 'open' && moving === 'opening') || (b.dataset.a === 'close' && moving === 'closing')));
    const t = R.querySelector('[data-t] span'); if (t) t.textContent = fmt(h.states[c.temperature], h.states[c.temperature]?.attributes?.unit_of_measurement || '°');
    const hu = R.querySelector('[data-h] span'); if (hu) hu.textContent = dead(h.states[c.humidity]) ? '—' : `${Number(h.states[c.humidity].state).toFixed(1)}%`;
  }
  _buzz() { if (this._cfg.haptics) { try { navigator.vibrate?.(10); } catch (e) {} } }
}

const LABELS = {
  entity: 'Main shade (or the group that moves them all)', name: 'Card title (leave empty to use the shade name)', icon: 'Icon',
  bar_name: 'Label on the main bar', shades: 'Individual shades (shown when you tap the title)',
  temperature: 'Temperature sensor', humidity: 'Humidity sensor', show_climate: 'Show temperature and humidity',
  show_buttons: 'Show Close / Open buttons', show_stop: 'Show the Stop button', show_percent: 'Show exact position (e.g. 40% open)', right_closes: 'Drag right to close (off: drag right to open)',
  start_open: 'Show the individual shades when the page opens', haptics: 'Vibrate on press (phones)', accent_color: 'Accent colour',
};
const HELP = {
  entity: 'Dragging the bar moves this shade. Use a group to move every shade in the room together.',
  shades: 'Each one gets its own bar so it can be moved on its own.',
};
class OneStopRollerShadeCardEditor extends HTMLElement {
  setConfig(c) { this._config = c; this._draw(); }
  set hass(h) { this._hass = h; if (this._form) this._form.hass = h; else this._draw(); }
  _draw() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement('ha-form');
      this._form.computeLabel = s => LABELS[s.name] ?? s.name;
      this._form.computeHelper = s => HELP[s.name];
      this._form.addEventListener('value-changed', e => {
        this._config = e.detail.value;
        this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    const cover = { entity: { filter: { domain: 'cover' } } }, toggle = { boolean: {} };
    this._form.hass = this._hass;
    this._form.schema = [
      { name: 'entity', required: true, selector: cover },
      { name: 'shades', selector: { entity: { multiple: true, filter: { domain: 'cover' } } } },
      { type: 'grid', name: '', schema: [{ name: 'name', selector: { text: {} } }, { name: 'icon', selector: { icon: {} } }] },
      { name: 'bar_name', selector: { text: {} } },
      { type: 'expandable', name: '', title: 'Temperature and humidity', icon: 'mdi:thermometer', schema: [
        { name: 'show_climate', selector: toggle },
        { name: 'temperature', selector: { entity: { filter: { domain: 'sensor', device_class: 'temperature' } } } },
        { name: 'humidity', selector: { entity: { filter: { domain: 'sensor', device_class: 'humidity' } } } },
      ] },
      { type: 'expandable', name: '', title: 'Buttons and look', icon: 'mdi:palette-outline', schema: [
        { name: 'show_buttons', selector: toggle }, { name: 'show_stop', selector: toggle }, { name: 'show_percent', selector: toggle }, { name: 'right_closes', selector: toggle },
        { name: 'start_open', selector: toggle }, { name: 'haptics', selector: toggle }, { name: 'accent_color', selector: { color_rgb: {} } },
      ] },
    ];
    this._form.data = { ...DEFAULTS, ...this._config };
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, OneStopRollerShadeCard);
if (!customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, OneStopRollerShadeCardEditor);
window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === TAG)) window.customCards.push({ type: TAG, name: 'One Stop - Roller Shade card', description: 'A room\'s roller shades: drag to any position, Close / Stop / Open, temperature and humidity, and each shade on its own.', preview: true });
console.info(`%c ONE STOP %c Roller Shade card ${VERSION} `, 'background:#375374;color:#fff;border-radius:3px 0 0 3px;padding:2px 4px', 'background:#e9eef5;color:#375374;border-radius:0 3px 3px 0;padding:2px 4px');
})();
