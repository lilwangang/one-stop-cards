/*!
 * One Stop – Media Player card
 * One tidy player for any media_player (TV, Apple TV, Sonos, speaker): artwork, title, transport,
 * volume, mute, power and a source picker. Glows from the app colour; works with no add-ons.
 */
(() => {
'use strict';
const VERSION = '1.0.0';
const TAG = 'one-stop-media-player-card';
const EDITOR_TAG = TAG + '-editor';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const COLORS = { blue: '96,165,250', green: '94,214,140', purple: '167,139,250', yellow: '250,204,21', teal: '45,212,191', red: '248,113,113', orange: '251,146,60', slate: '169,191,210' };
const F = { PAUSE: 1, VOL_SET: 4, VOL_MUTE: 8, PREV: 16, NEXT: 32, TURN_ON: 128, TURN_OFF: 256, VOL_STEP: 1024, SELECT_SOURCE: 2048, STOP: 4096, PLAY: 16384 };
const OFFISH = ['off', 'unavailable', 'unknown'];

const CSS = `
:host{display:block}
button{all:unset;box-sizing:border-box;cursor:pointer;-webkit-tap-highlight-color:transparent}
ha-card{position:relative;overflow:hidden;border-radius:var(--mp-r,24px);color:var(--primary-text-color,#f2f6fa);background:var(--mp-bg,rgba(255,255,255,.06));border:1px solid rgba(255,255,255,.08)}
.bd{position:absolute;inset:-30px;background-size:cover;background-position:center;filter:blur(40px) saturate(1.3);opacity:.35;transition:opacity .4s}
.in{position:relative;padding:16px;display:flex;flex-direction:column;gap:14px}
.top{display:flex;gap:14px;align-items:center}
.art{flex:none;width:var(--mp-art,92px);height:var(--mp-art,92px);border-radius:16px;background:rgba(var(--mp-ac),.18) center/cover no-repeat;display:grid;place-items:center;box-shadow:0 8px 22px rgba(0,0,0,.35)}
.art ha-icon{--mdc-icon-size:38px;color:rgb(var(--mp-ac))}
.art.has ha-icon{display:none}
.tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.room{font-size:12.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#b6c2d0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ttl{font-size:18px;font-weight:700;line-height:1.2;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.sub{font-size:14px;color:#c9d3df;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pw{flex:none;align-self:flex-start;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.08)}
.pw.on{background:rgba(var(--mp-ac),.25)}.pw.on ha-icon{color:rgb(var(--mp-ac))}
.pw ha-icon{--mdc-icon-size:22px}
.bar{height:5px;border-radius:3px;background:rgba(255,255,255,.12);overflow:hidden}
.bar i{display:block;height:100%;width:0;background:rgb(var(--mp-ac));transition:width .5s linear}
.tr{display:flex;align-items:center;justify-content:center;gap:14px}
.b{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.08);transition:transform .1s,background .15s}
.b:active{transform:scale(.92)}
.b ha-icon{--mdc-icon-size:24px}
.b.main{width:60px;height:60px;background:rgb(var(--mp-ac))}.b.main ha-icon{--mdc-icon-size:32px;color:#0b1220}
.vol{display:flex;align-items:center;gap:10px}
.vol .b{width:40px;height:40px}.vol .b ha-icon{--mdc-icon-size:21px}
.vol .b.muted{background:rgba(248,113,113,.25)}
input[type=range]{-webkit-appearance:none;appearance:none;flex:1;height:34px;background:transparent;margin:0;touch-action:pan-y}
input[type=range]::-webkit-slider-runnable-track{height:10px;border-radius:5px;background:linear-gradient(90deg,rgb(var(--mp-ac)) var(--p,0%),rgba(255,255,255,.14) var(--p,0%))}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;margin-top:-7px;border-radius:50%;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.4)}
input[type=range]::-moz-range-track{height:10px;border-radius:5px;background:rgba(255,255,255,.14)}
input[type=range]::-moz-range-progress{height:10px;border-radius:5px;background:rgb(var(--mp-ac))}
input[type=range]::-moz-range-thumb{width:24px;height:24px;border:0;border-radius:50%;background:#fff}
.src{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}
.src::-webkit-scrollbar{display:none}
.chip{flex:none;padding:9px 15px;border-radius:999px;font-size:14px;font-weight:600;background:rgba(255,255,255,.08);white-space:nowrap}
.chip.sel{background:rgba(var(--mp-ac),.28);color:#fff;box-shadow:inset 0 0 0 1.5px rgb(var(--mp-ac))}
.dead{opacity:.5;pointer-events:none}
.hide{display:none!important}
`;

class OneStopMediaPlayerCard extends HTMLElement {
  static getConfigElement() { return document.createElement(EDITOR_TAG); }
  static getStubConfig(hass) { const e = Object.keys(hass?.states || {}).find(x => x.startsWith('media_player.')); return { entity: e || '' }; }
  setConfig(c) { if (!c || !c.entity) throw new Error('Pick a media player'); this._cfg = { ...c }; if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._built = false; if (this._hass) this._render(); }
  set hass(h) { this._hass = h; if (!this._built) this._render(); else this._update(); }
  getCardSize() { return 4; }
  getGridOptions() { return { columns: 12, rows: 'auto', min_columns: 6 }; }
  _st() { return this._hass?.states?.[this._cfg.entity]; }
  _call(s, d = {}) { this._hass.callService('media_player', s, { entity_id: this._cfg.entity, ...d }); }
  _render() {
    const c = this._cfg, R = this.shadowRoot; if (!R || !this._hass) return;
    const st = this._st();
    R.innerHTML = `<style>${CSS}</style><ha-card style="--mp-ac:${COLORS[c.color] || COLORS.blue};${c.art_size ? `--mp-art:${+c.art_size}px;` : ''}">
      <div class="bd"></div>
      <div class="in">
        <div class="top">
          <div class="art"><ha-icon icon="${esc(c.icon || 'mdi:speaker-wireless')}"></ha-icon></div>
          <div class="tx"><div class="room"></div><div class="ttl"></div><div class="sub"></div></div>
          <button class="pw" data-a="power" aria-label="Power"><ha-icon icon="mdi:power"></ha-icon></button>
        </div>
        <div class="bar hide"><i></i></div>
        <div class="tr">
          <button class="b" data-a="prev" aria-label="Previous"><ha-icon icon="mdi:skip-previous"></ha-icon></button>
          <button class="b main" data-a="play" aria-label="Play or pause"><ha-icon icon="mdi:play"></ha-icon></button>
          <button class="b" data-a="next" aria-label="Next"><ha-icon icon="mdi:skip-next"></ha-icon></button>
        </div>
        <div class="vol">
          <button class="b" data-a="mute" aria-label="Mute"><ha-icon icon="mdi:volume-high"></ha-icon></button>
          <input type="range" min="0" max="100" step="1" value="0">
        </div>
        <div class="src hide"></div>
      </div></ha-card>`;
    this._built = true;
    R.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); this._act(b.dataset.a); }));
    const r = R.querySelector('input[type=range]');
    r.addEventListener('input', () => { this._drag = Date.now(); r.style.setProperty('--p', r.value + '%'); });
    r.addEventListener('change', () => { this._call('volume_set', { volume_level: r.value / 100 }); this._drag = Date.now(); });
    R.querySelector('.src').addEventListener('click', e => { const ch = e.target.closest('.chip'); if (ch) { e.stopPropagation(); this._call('select_source', { source: ch.dataset.s }); } });
    this._srcKey = null; this._update();
    clearInterval(this._t); this._t = setInterval(() => this._tick(), 1000);
  }
  _act(a) {
    const st = this._st(); if (!st) return; const on = !OFFISH.includes(st.state), f = st.attributes.supported_features || 0;
    if (a === 'power') this._call(on ? 'turn_off' : 'turn_on');
    else if (a === 'play') this._call(st.state === 'playing' ? ((f & F.PAUSE) ? 'media_pause' : 'media_stop') : 'media_play');
    else if (a === 'prev') this._call('media_previous_track');
    else if (a === 'next') this._call('media_next_track');
    else if (a === 'mute') this._call('volume_mute', { is_volume_muted: !st.attributes.is_volume_muted });
  }
  _pos() {
    const a = this._st()?.attributes; if (!a || !a.media_duration) return null;
    let p = a.media_position || 0;
    if (this._st().state === 'playing' && a.media_position_updated_at) p += (Date.now() - new Date(a.media_position_updated_at).getTime()) / 1000;
    return Math.max(0, Math.min(a.media_duration, p)) / a.media_duration;
  }
  _tick() { const b = this.shadowRoot?.querySelector('.bar i'); const p = this._pos(); if (b && p != null) b.style.width = (p * 100).toFixed(1) + '%'; }
  _update() {
    if (!this._built) return;
    const R = this.shadowRoot, c = this._cfg, st = this._st(), q = s => R.querySelector(s);
    if (!st) { q('.ttl').textContent = 'Not found'; q('.sub').textContent = c.entity; return; }
    const a = st.attributes, f = a.supported_features || 0, on = !OFFISH.includes(st.state), playing = st.state === 'playing';
    R.querySelector('ha-card').classList.toggle('dead', st.state === 'unavailable');
    q('.room').textContent = c.name ?? a.friendly_name ?? '';
    const title = on ? (a.media_title || a.app_name || (st.state === 'idle' ? 'Idle' : st.state === 'standby' ? 'Standby' : 'On')) : 'Off';
    const sub = on ? [a.media_artist || a.media_series_title, a.media_album_name].filter(Boolean).join(' · ') || (a.source && a.source !== title ? a.source : '') : '';
    q('.ttl').textContent = title; q('.sub').textContent = sub;
    const pic = on && a.entity_picture ? a.entity_picture : '', art = q('.art'), bd = q('.bd');
    if (pic !== this._pic) { this._pic = pic; art.style.backgroundImage = pic ? `url("${pic}")` : ''; art.classList.toggle('has', !!pic); bd.style.backgroundImage = pic ? `url("${pic}")` : ''; bd.style.opacity = pic ? '.35' : '0'; }
    const pw = q('.pw'); pw.classList.toggle('on', on); pw.classList.toggle('hide', !(f & (F.TURN_ON | F.TURN_OFF)) || c.show_power === false);
    q('[data-a=play] ha-icon').setAttribute('icon', playing ? ((f & F.PAUSE) ? 'mdi:pause' : 'mdi:stop') : 'mdi:play');
    q('[data-a=prev]').classList.toggle('hide', !(f & F.PREV)); q('[data-a=next]').classList.toggle('hide', !(f & F.NEXT));
    q('.tr').classList.toggle('hide', !on || c.show_controls === false);
    const bar = q('.bar'); const p = this._pos(); bar.classList.toggle('hide', !(on && p != null && c.show_progress !== false)); this._tick();
    // volume
    const vol = q('.vol'), r = q('input[type=range]'), canVol = (f & F.VOL_SET) && a.volume_level != null;
    vol.classList.toggle('hide', !on || !canVol || c.show_volume === false);
    if (canVol && Date.now() - (this._drag || 0) > 1500) { const v = Math.round(a.volume_level * 100); r.value = v; r.style.setProperty('--p', v + '%'); }
    const mu = q('[data-a=mute]'); mu.classList.toggle('muted', !!a.is_volume_muted); mu.classList.toggle('hide', !(f & F.VOL_MUTE));
    mu.querySelector('ha-icon').setAttribute('icon', a.is_volume_muted ? 'mdi:volume-off' : a.volume_level < .34 ? 'mdi:volume-low' : 'mdi:volume-high');
    // sources
    const list = on && (f & F.SELECT_SOURCE) && c.show_sources !== false ? (c.sources && c.sources.length ? c.sources : (a.source_list || [])) : [];
    const key = list.join('|'); const sb = q('.src'); sb.classList.toggle('hide', !list.length);
    if (key !== this._srcKey) { this._srcKey = key; sb.innerHTML = list.map(s => `<button class="chip" data-s="${esc(s)}">${esc(s)}</button>`).join(''); }
    sb.querySelectorAll('.chip').forEach(ch => ch.classList.toggle('sel', ch.dataset.s === a.source));
  }
  disconnectedCallback() { clearInterval(this._t); }
  connectedCallback() { if (this._built) { clearInterval(this._t); this._t = setInterval(() => this._tick(), 1000); } }
}

class OneStopMediaPlayerCardEditor extends HTMLElement {
  setConfig(c) { this._config = { ...c }; this._draw(); }
  set hass(h) { this._hass = h; if (this._form) this._form.hass = h; else this._draw(); }
  _draw() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement('ha-form');
      this._form.computeLabel = s => ({ entity: 'Media player', name: 'Name', icon: 'Icon (when no artwork)', color: 'Colour', art_size: 'Artwork size (default 92)', show_power: 'Show power button', show_controls: 'Show play / skip buttons', show_progress: 'Show progress bar', show_volume: 'Show volume', show_sources: 'Show sources / apps', sources_text: 'Only show these sources (one per line, blank = all)' }[s.name] || s.name);
      this._form.addEventListener('value-changed', e => {
        const v = { ...e.detail.value }, out = { type: this._config.type };
        for (const [k, x] of Object.entries(v)) if (k !== 'sources_text' && x !== '' && x != null) out[k] = x;
        const src = String(v.sources_text || '').split('\n').map(l => l.trim()).filter(Boolean); if (src.length) out.sources = src;
        this._config = out; this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: out }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._form.schema = [
      { name: 'entity', selector: { entity: { domain: 'media_player' } } },
      { type: 'grid', name: '', schema: [{ name: 'name', selector: { text: {} } }, { name: 'icon', selector: { icon: {} } }] },
      { type: 'grid', name: '', schema: [{ name: 'color', selector: { select: { mode: 'dropdown', options: Object.keys(COLORS) } } }, { name: 'art_size', selector: { number: { min: 56, max: 160, mode: 'box' } } }] },
      { type: 'grid', name: '', schema: ['show_power', 'show_controls', 'show_progress', 'show_volume', 'show_sources'].map(n => ({ name: n, selector: { boolean: {} } })) },
      { name: 'sources_text', selector: { text: { multiline: true } } },
    ];
    const c = this._config;
    this._form.data = { show_power: true, show_controls: true, show_progress: true, show_volume: true, show_sources: true, ...c, sources_text: (c.sources || []).join('\n') };
  }
}
if (!customElements.get(TAG)) customElements.define(TAG, OneStopMediaPlayerCard);
if (!customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, OneStopMediaPlayerCardEditor);
window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === TAG)) window.customCards.push({ type: TAG, name: 'One Stop - Media Player', description: 'Artwork, now playing, transport, volume and sources for any media player (TV, Apple TV, speaker).', preview: true });
console.info(`%c ONE STOP MEDIA PLAYER %c ${VERSION} `, 'color:#fff;background:#3b82f6;font-weight:700', 'color:#3b82f6;background:#fff');
})();
