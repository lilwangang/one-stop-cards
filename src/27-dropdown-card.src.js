/*!
 * One Stop – Dropdown card
 * A bubble-style pill that opens a tidy option list. Works with select / input_select entities,
 * or any attribute list (e.g. a vacuum's suction levels). Pick which options show and rename them.
 */
(() => {
'use strict';
const VERSION = '1.0.0';
const TAG = 'one-stop-dropdown-card';
const EDITOR_TAG = TAG + '-editor';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pretty = v => String(v).replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());
// attribute that holds the current value, for each list attribute
const CUR = { fan_speed_list: 'fan_speed', preset_modes: 'preset_mode', source_list: 'source', sound_mode_list: 'sound_mode', effect_list: 'effect', hvac_modes: null, fan_modes: 'fan_mode', swing_modes: 'swing_mode' };

const CSS = `
:host{display:block;position:relative}
button{all:unset;box-sizing:border-box;cursor:pointer;-webkit-tap-highlight-color:transparent}
.pill{display:flex;align-items:center;gap:12px;width:100%;height:var(--dd-h,52px);padding:0 8px 0 6px;border-radius:999px;
  background:var(--dd-bg,rgba(255,255,255,.07));border:1px solid rgba(255,255,255,.10);color:var(--primary-text-color,#f2f6fa);transition:background .15s,transform .1s}
.pill:active{transform:scale(.985)}
.pill.open{background:rgba(255,255,255,.12)}
.ic{flex:none;width:calc(var(--dd-h,52px) - 12px);height:calc(var(--dd-h,52px) - 12px);border-radius:50%;display:grid;place-items:center;background:rgba(var(--dd-ac),.18)}
.ic ha-icon{--mdc-icon-size:22px;color:rgb(var(--dd-ac))}
.tx{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.2}
.tx small{font-size:12.5px;font-weight:500;color:#b6c2d0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tx b{font-size:15.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chev{flex:none;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.08);transition:transform .2s}
.chev ha-icon{--mdc-icon-size:20px;color:#dbe3ec}
.pill.open .chev{transform:rotate(180deg)}
.menu{position:fixed;z-index:9999;min-width:180px;padding:6px;border-radius:20px;background:rgba(28,34,46,.97);border:1px solid rgba(255,255,255,.12);
  box-shadow:0 18px 40px rgba(0,0,0,.5);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);animation:pop .14s ease-out;max-height:60vh;overflow:auto}
@keyframes pop{from{opacity:0;transform:translateY(-6px) scale(.98)}}
.opt{display:flex;align-items:center;gap:10px;width:100%;padding:12px 14px;border-radius:14px;font-size:15.5px;font-weight:600;color:#e8eef5}
.opt:active{background:rgba(255,255,255,.08)}
.opt.sel{background:rgba(var(--dd-ac),.18);color:#fff}
.opt .ck{margin-left:auto;--mdc-icon-size:20px;color:rgb(var(--dd-ac));visibility:hidden}
.opt.sel .ck{visibility:visible}
.dead{opacity:.5;pointer-events:none}
`;
const COLORS = { blue: '96,165,250', green: '94,214,140', purple: '167,139,250', yellow: '250,204,21', teal: '45,212,191', red: '248,113,113', orange: '251,146,60', grey: '170,180,195', slate: '169,191,210' };

class OneStopDropdownCard extends HTMLElement {
  static getConfigElement() { return document.createElement(EDITOR_TAG); }
  static getStubConfig(hass) { const e = Object.keys(hass?.states || {}).find(x => x.startsWith('select.') || x.startsWith('input_select.')); return { entity: e || '' }; }
  setConfig(c) { if (!c) throw new Error('Invalid configuration'); this._cfg = { ...c }; if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._built = false; if (this._hass) this._render(); }
  set hass(h) { this._hass = h; if (!this._built) this._render(); else this._update(); }
  getCardSize() { return 1; }
  getGridOptions() { return { columns: 12, rows: 1, min_columns: 4 }; }
  _list() {   // [{value,label}] after filtering/renaming
    const c = this._cfg, st = this._hass.states[c.entity]; if (!st) return [];
    const raw = c.attribute ? (st.attributes[c.attribute] || []) : (st.attributes.options || []);
    const map = {}; (c.options || []).forEach(o => { if (typeof o === 'string') map[o] = null; else if (o && o.value != null) map[o.value] = o.label ?? null; });
    const keys = c.options && c.options.length ? (c.options.map(o => (typeof o === 'string' ? o : o.value)).filter(v => raw.includes(v))) : raw;
    return keys.map(v => ({ value: v, label: map[v] || this._fmt(st, v) }));
  }
  _fmt(st, v) {
    try { if (this._cfg.attribute && this._hass.formatEntityAttributeValue) return this._hass.formatEntityAttributeValue(st, CUR[this._cfg.attribute] || this._cfg.attribute, v); if (!this._cfg.attribute && this._hass.formatEntityState) return this._hass.formatEntityState(st, v); } catch (e) {}
    return pretty(v);
  }
  _cur() { const c = this._cfg, st = this._hass.states[c.entity]; if (!st) return null; return c.attribute ? st.attributes[c.current_attribute || CUR[c.attribute] || c.attribute.replace(/_list$|s$/, '')] : st.state; }
  _render() {
    const c = this._cfg, R = this.shadowRoot; if (!R || !this._hass) return;
    const st = this._hass.states[c.entity];
    R.innerHTML = `<style>${CSS}</style><div style="--dd-ac:${COLORS[c.color] || COLORS.slate};${c.height ? `--dd-h:${+c.height}px;` : ''}">
      <button class="pill" aria-haspopup="listbox"><span class="ic"><ha-icon icon="${esc(c.icon || st?.attributes?.icon || 'mdi:format-list-bulleted')}"></ha-icon></span>
      <span class="tx"><small>${esc(c.name ?? st?.attributes?.friendly_name ?? c.entity ?? '')}</small><b data-v></b></span><span class="chev"><ha-icon icon="mdi:chevron-down"></ha-icon></span></button></div>`;
    this._pill = R.querySelector('.pill'); this._built = true;
    this._pill.addEventListener('click', e => { e.stopPropagation(); this._menu ? this._close() : this._open(); });
    this._update();
  }
  _update() {
    if (!this._built) return; const v = this._cur(), it = this._list().find(o => o.value === v);
    const txt = it ? it.label : (v == null ? '—' : this._fmt(this._hass.states[this._cfg.entity], v));
    const b = this.shadowRoot.querySelector('[data-v]'); if (b.textContent !== txt) b.textContent = txt;
    this._pill.classList.toggle('dead', !this._hass.states[this._cfg.entity] || this._hass.states[this._cfg.entity].state === 'unavailable');
    if (this._menu) this._menu.querySelectorAll('.opt').forEach(o => o.classList.toggle('sel', o.dataset.v === String(v)));
  }
  _open() {
    const list = this._list(); if (!list.length) return; const cur = String(this._cur());
    const m = document.createElement('div'); m.className = 'menu'; m.setAttribute('role', 'listbox');
    m.innerHTML = list.map(o => `<button class="opt ${String(o.value) === cur ? 'sel' : ''}" data-v="${esc(o.value)}" role="option">${esc(o.label)}<ha-icon class="ck" icon="mdi:check"></ha-icon></button>`).join('');
    m.style.setProperty('--dd-ac', COLORS[this._cfg.color] || COLORS.slate);
    // live on <body> so card clipping, blur and transforms can't hide or shift it
    const host = document.createElement('div'); host.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none';
    const sr = host.attachShadow({ mode: 'open' }); sr.innerHTML = `<style>${CSS}.menu{pointer-events:auto}</style>`; sr.appendChild(m);
    document.body.appendChild(host); this._host = host; this._menu = m; this._pill.classList.add('open');
    const r = this._pill.getBoundingClientRect(), h = m.offsetHeight, below = window.innerHeight - r.bottom - 12;
    m.style.left = `${Math.max(8, r.left)}px`; m.style.width = `${r.width}px`;
    m.style.top = below >= h || below > r.top ? `${r.bottom + 6}px` : `${Math.max(8, r.top - h - 6)}px`;
    m.addEventListener('click', e => { const b = e.target.closest('.opt'); if (!b) return; e.stopPropagation(); this._choose(b.dataset.v); });
    this._off = e => { const p = e.composedPath(); if (!p.includes(this) && !p.includes(this._host)) this._close(); };
    this._scr = e => { if (e && e.composedPath && this._menu && e.composedPath().includes(this._menu)) return; this._close(); };
    setTimeout(() => { document.addEventListener('click', this._off, true); window.addEventListener('scroll', this._scr, true); window.addEventListener('resize', this._scr); }, 0);
    try { navigator.vibrate?.(8); } catch (e) {}
  }
  _close() {
    this._host?.remove(); this._host = null; this._menu = null; this._pill?.classList.remove('open');
    document.removeEventListener('click', this._off, true); window.removeEventListener('scroll', this._scr, true); window.removeEventListener('resize', this._scr);
  }
  _choose(v) {
    const c = this._cfg, d = c.entity.split('.')[0], h = this._hass; this._close();
    if (c.attribute === 'fan_speed_list' && d === 'vacuum') h.callService('vacuum', 'set_fan_speed', { entity_id: c.entity, fan_speed: v });
    else if (c.attribute === 'preset_modes') h.callService(d, 'set_preset_mode', { entity_id: c.entity, preset_mode: v });
    else if (c.attribute === 'fan_modes') h.callService('climate', 'set_fan_mode', { entity_id: c.entity, fan_mode: v });
    else if (c.attribute === 'hvac_modes') h.callService('climate', 'set_hvac_mode', { entity_id: c.entity, hvac_mode: v });
    else if (c.attribute === 'source_list') h.callService('media_player', 'select_source', { entity_id: c.entity, source: v });
    else if (c.attribute === 'effect_list') h.callService('light', 'turn_on', { entity_id: c.entity, effect: v });
    else h.callService(d === 'input_select' ? 'input_select' : 'select', 'select_option', { entity_id: c.entity, option: v });
    const b = this.shadowRoot.querySelector('[data-v]'); const it = this._list().find(o => o.value === v); if (b && it) b.textContent = it.label;   // instant feedback
  }
  disconnectedCallback() { this._close(); }
}

/* visual editor */
class OneStopDropdownCardEditor extends HTMLElement {
  setConfig(c) { this._config = { ...c }; this._draw(); }
  set hass(h) { this._hass = h; if (this._form) this._form.hass = h; else this._draw(); }
  _draw() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement('ha-form');
      this._form.computeLabel = s => ({ entity: 'Entity', name: 'Label', icon: 'Icon', color: 'Colour', attribute: 'Use a list attribute instead (e.g. fan_speed_list)', options_text: 'Options to show, one per line as value = Label (empty = all)', height: 'Height (default 52)' }[s.name] || s.name);
      this._form.addEventListener('value-changed', e => {
        const v = { ...e.detail.value }, out = { type: this._config.type };
        for (const [k, x] of Object.entries(v)) if (k !== 'options_text' && x !== '' && x != null) out[k] = x;
        const lines = String(v.options_text || '').split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length) out.options = lines.map(l => { const [a, ...b] = l.split('='); return b.length ? { value: a.trim(), label: b.join('=').trim() } : a.trim(); });
        this._config = out; this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: out }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._form.schema = [
      { name: 'entity', selector: { entity: {} } },
      { type: 'grid', name: '', schema: [{ name: 'name', selector: { text: {} } }, { name: 'icon', selector: { icon: {} } }] },
      { type: 'grid', name: '', schema: [{ name: 'color', selector: { select: { mode: 'dropdown', options: Object.keys(COLORS) } } }, { name: 'height', selector: { number: { min: 36, max: 80, mode: 'box' } } }] },
      { name: 'attribute', selector: { text: {} } },
      { name: 'options_text', selector: { text: { multiline: true } } },
    ];
    const c = this._config;
    this._form.data = { ...c, options_text: (c.options || []).map(o => (typeof o === 'string' ? o : `${o.value} = ${o.label}`)).join('\n') };
  }
}
if (!customElements.get(TAG)) customElements.define(TAG, OneStopDropdownCard);
if (!customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, OneStopDropdownCardEditor);
window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === TAG)) window.customCards.push({ type: TAG, name: 'One Stop - Dropdown', description: 'Bubble-style dropdown for a select, input_select or an attribute list (e.g. vacuum suction).', preview: true });
console.info(`%c ONE STOP DROPDOWN %c ${VERSION} `, 'color:#fff;background:#475569;font-weight:700', 'color:#475569;background:#fff');
})();
