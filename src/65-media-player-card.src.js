/*!
 * One Stop – Media Player card
 * Room player in the One Stop glass style: room name + status, artwork, now playing, controls, volume.
 * Two buttons open built-in pop-ups: "Choose music" (sources / saved playlists & favourites, with search)
 * and "Group speakers" (tap rooms to listen together). No other add-ons needed.
 */
(() => {
'use strict';
const VERSION = '2.0.0';
const TAG = 'one-stop-media-player-card';
const EDITOR_TAG = TAG + '-editor';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const F = { PAUSE: 1, VOL_SET: 4, VOL_MUTE: 8, PREV: 16, NEXT: 32, TURN_ON: 128, TURN_OFF: 256, SELECT_SOURCE: 2048, PLAY: 16384, GROUPING: 524288 };
const OFFISH = ['off', 'unavailable', 'unknown'];
const ACCENT = { slate: '169,191,210', blue: '96,165,250', green: '94,214,140', purple: '167,139,250', yellow: '250,204,21', teal: '45,212,191', red: '248,113,113', orange: '251,146,60' };
const fmtT = s => { s = Math.max(0, Math.floor(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

const CSS = `
:host{display:block}
button{all:unset;box-sizing:border-box;cursor:pointer;-webkit-tap-highlight-color:transparent}
ha-card{position:relative;overflow:hidden;padding:10px 18px 16px;border-radius:var(--mp-r,18px);color:var(--primary-text-color,#f2f6fa);
  background:linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.015)),var(--bubble-main-background-color,var(--secondary-background-color,#1f2329));
  border:1px solid rgba(255,255,255,.12);box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 10px 24px rgba(0,0,0,.10);
  -webkit-backdrop-filter:blur(18px) saturate(1.1);backdrop-filter:blur(18px) saturate(1.1)}
.hd{display:grid;grid-template-columns:minmax(0,1fr) 44px 44px;column-gap:8px;align-items:center;min-height:44px;margin-bottom:6px}
.hd h2{margin:0;font-size:22px;line-height:27px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hd p{margin:1px 0 0;font-size:12.5px;color:#aebdcb;display:flex;align-items:center;gap:6px}
.dot{width:7px;height:7px;border-radius:50%;background:#8796a6}
.dot.on{background:#5ed68c;box-shadow:0 0 8px rgba(94,214,140,.8)}
.sq{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;border:1px solid rgba(211,224,238,.16);background:rgba(66,70,76,.42);position:relative}
.sq ha-icon{--mdc-icon-size:23px}
.sq.act{background:rgba(var(--mp-ac),.28);border-color:rgba(var(--mp-ac),.55)}
.sq .n{position:absolute;top:-5px;right:-5px;min-width:18px;height:18px;padding:0 4px;box-sizing:border-box;border-radius:9px;background:rgb(var(--mp-ac));color:#0b1220;font-size:11px;font-weight:800;display:grid;place-items:center}
.pl{border-radius:14px;padding:2px 0 0;display:flex;flex-direction:column;gap:10px}
.core{display:grid;grid-template-columns:var(--mp-art,129px) minmax(0,1fr);column-gap:24px;align-items:center;min-height:var(--mp-art,129px)}
.art{width:var(--mp-art,129px);height:var(--mp-art,129px);border-radius:18px;overflow:hidden;display:grid;place-items:center;background:linear-gradient(145deg,rgba(156,180,203,.13),rgba(255,255,255,.025)) center/cover no-repeat;border:1px solid rgba(211,224,238,.12);color:#b9cadb}
.art ha-icon{--mdc-icon-size:60px}
.art.has{border-color:transparent;box-shadow:0 8px 22px rgba(0,0,0,.3)}.art.has ha-icon{display:none}
.info{min-width:0}
.lab{font-size:11px;line-height:16px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#aebdcb;margin-bottom:7px}
.ttl{font-size:20px;line-height:24px;font-weight:600;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.art2{font-size:14px;line-height:19px;color:#b8c6d4;margin-top:4px;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.prog{display:flex;align-items:center;gap:10px;font-size:11.5px;color:#9fb0c0;font-variant-numeric:tabular-nums;font-weight:600}
.bar{flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,.14);overflow:hidden}.bar i{display:block;height:100%;width:0;background:rgb(var(--mp-ac));transition:width .5s linear}
.tr{display:flex;justify-content:center;align-items:center;gap:12px}
.b{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;border:1px solid rgba(211,224,238,.16);background:rgba(66,70,76,.42);transition:transform .1s}
.b:active,.sq:active{transform:scale(.93)}
.b ha-icon{--mdc-icon-size:27px}
.b.main{width:56px;height:56px;border-radius:18px;background:rgba(100,128,153,.35);border-color:rgba(177,201,222,.38)}
.b.main ha-icon{--mdc-icon-size:30px}
.vol{display:flex;align-items:center;gap:8px}
.vol .b{width:44px;height:44px;border:0;background:none}.vol .b ha-icon{--mdc-icon-size:24px}
.vol .b.muted ha-icon{color:#f87171}
input[type=range]{-webkit-appearance:none;appearance:none;flex:1;min-width:0;height:34px;background:transparent;margin:0;touch-action:pan-y}
input[type=range]::-webkit-slider-runnable-track{height:6px;border-radius:3px;background:linear-gradient(90deg,rgb(var(--mp-ac)) var(--p,0%),rgba(255,255,255,.16) var(--p,0%))}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;margin-top:-7px;border-radius:50%;background:#d7e1eb;box-shadow:0 2px 6px rgba(0,0,0,.4)}
input[type=range]::-moz-range-track{height:6px;border-radius:3px;background:rgba(255,255,255,.16)}
input[type=range]::-moz-range-progress{height:6px;border-radius:3px;background:rgb(var(--mp-ac))}
input[type=range]::-moz-range-thumb{width:20px;height:20px;border:0;border-radius:50%;background:#d7e1eb}
.dead{opacity:.5;pointer-events:none}
.hide{display:none!important}
`;

/* pop-up sheet, mounted on document.body so dashboards/transforms never clip it */
const SHEET_CSS = `
:host{all:initial;position:fixed;inset:0;z-index:2147483000;font-family:var(--ha-font-family-body,Roboto,system-ui,sans-serif);color:#eef3f8}
button,input{font:inherit;color:inherit}
button{all:unset;box-sizing:border-box;cursor:pointer;-webkit-tap-highlight-color:transparent}
.bg{position:absolute;inset:0;background:rgba(0,0,0,.55);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);animation:fade .18s ease-out}
.sh{position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:min(100%,560px);max-height:86vh;box-sizing:border-box;display:flex;flex-direction:column;
  background:rgba(30,34,41,.98);border:1px solid rgba(255,255,255,.12);border-bottom:0;border-radius:26px 26px 0 0;box-shadow:0 -18px 48px rgba(0,0,0,.5);
  padding:10px 18px calc(18px + env(safe-area-inset-bottom));animation:up .24s cubic-bezier(.2,.9,.3,1)}
@media(min-width:700px){.sh{bottom:auto;top:50%;transform:translate(-50%,-50%);border-radius:26px;border-bottom:1px solid rgba(255,255,255,.12);animation:pop .2s ease-out;padding-bottom:20px}}
@keyframes fade{from{opacity:0}}@keyframes up{from{transform:translate(-50%,100%)}}@keyframes pop{from{opacity:0;transform:translate(-50%,-48%) scale(.97)}}
.grab{width:40px;height:5px;border-radius:3px;background:rgba(255,255,255,.25);margin:0 auto 10px}
@media(min-width:700px){.grab{display:none}}
.top{display:flex;align-items:center;gap:12px;margin-bottom:4px}
.top .ic{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:rgba(var(--mp-ac),.2);color:rgb(var(--mp-ac))}
.top .ic ha-icon{--mdc-icon-size:22px}
.top h3{flex:1;margin:0;font-size:21px;font-weight:650;line-height:1.2}
.top h3 small{display:block;font-size:12.5px;font-weight:500;color:#aebdcb;margin-top:2px}
.x{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.08)}.x ha-icon{--mdc-icon-size:20px}
.intro{margin:8px 2px 12px;font-size:13px;color:#b4c3d3;line-height:1.4}
.search{box-sizing:border-box;width:100%;height:44px;border-radius:14px;border:1px solid rgba(211,224,238,.16);background:rgba(66,70,76,.35);padding:0 14px;font-size:15px;outline:none;margin-bottom:12px}
.search:focus{border-color:rgba(var(--mp-ac),.6)}
.body{overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;margin:0 -4px;padding:2px 4px 4px}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.opt{display:flex;align-items:center;gap:12px;min-height:64px;padding:12px 14px;border-radius:16px;border:1px solid rgba(211,224,238,.16);background:rgba(66,70,76,.30);transition:background .15s,border-color .15s}
.opt:active{transform:scale(.98)}
.opt ha-icon{flex:none;--mdc-icon-size:24px;color:#adbdcd}
.opt .t{min-width:0;font-size:15px;line-height:19px;font-weight:600;overflow-wrap:anywhere}
.opt .t small{display:block;font-size:11.5px;font-weight:400;color:#aab9c9;margin-top:3px}
.opt.sel{background:rgba(var(--mp-ac),.2);border-color:rgba(var(--mp-ac),.55)}
.opt.sel ha-icon{color:rgb(var(--mp-ac))}
.opt.lead{opacity:.75;cursor:default}
.opt.busy{opacity:.55;pointer-events:none}
.empty{grid-column:1/-1;padding:18px 4px;text-align:center;color:#aab9c9;font-size:14px}
.foot{display:flex;gap:8px;margin-top:12px}
.foot button{flex:1;height:46px;border-radius:14px;display:grid;place-items:center;font-size:14.5px;font-weight:600;background:rgba(255,255,255,.08)}
`;

class Sheet {
  constructor(card, kind) {
    this.card = card; this.kind = kind; this.q = '';
    this.host = document.createElement('div'); this.host.className = 'one-stop-mp-sheet';
    this.root = this.host.attachShadow({ mode: 'open' });
    const ac = ACCENT[card._cfg.color] || ACCENT.slate;
    const t = kind === 'src' ? ['mdi:playlist-music', 'Choose music'] : ['mdi:speaker-multiple', 'Group speakers'];
    this.root.innerHTML = `<style>${SHEET_CSS}</style><div class="bg"></div><div class="sh" style="--mp-ac:${ac}" role="dialog" aria-modal="true" aria-label="${esc(t[1])}">
      <div class="grab"></div>
      <div class="top"><span class="ic"><ha-icon icon="${t[0]}"></ha-icon></span><h3>${esc(t[1])}<small>${esc(card._name())}</small></h3><button class="x" aria-label="Close"><ha-icon icon="mdi:close"></ha-icon></button></div>
      ${kind === 'src' ? `<p class="intro">Choose one of your saved playlists, favourites or an input.</p><input class="search" type="search" placeholder="Search…" aria-label="Search music">`
        : `<p class="intro">Tap a speaker to add or remove it. Everything in the group plays the same music.</p>`}
      <div class="body"><div class="grid"></div></div>
      ${kind === 'grp' ? `<div class="foot"><button data-f="all">Add all</button><button data-f="none">Just this room</button></div>` : ''}
    </div>`;
    const close = () => this.close();
    this.root.querySelector('.bg').addEventListener('click', close);
    this.root.querySelector('.x').addEventListener('click', close);
    this._key = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', this._key);
    const s = this.root.querySelector('.search');
    if (s) s.addEventListener('input', () => { this.q = s.value.trim().toLowerCase(); this.sig = null; this.update(); });
    this.root.querySelector('.grid').addEventListener('click', e => { const o = e.target.closest('.opt'); if (o) this.pick(o); });
    this.root.querySelectorAll('[data-f]').forEach(b => b.addEventListener('click', () => this.bulk(b.dataset.f)));
    document.body.appendChild(this.host);
    this._ov = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden';
    this.update();
  }
  close() { document.removeEventListener('keydown', this._key); document.documentElement.style.overflow = this._ov || ''; this.host.remove(); if (this.card._sheet === this) this.card._sheet = null; }
  update() {
    const c = this.card, h = c._hass, st = c._st(), grid = this.root.querySelector('.grid'); if (!st) return;
    if (this.kind === 'src') {
      const list = c._sources(), cur = st.attributes.source;
      const shown = list.filter(n => String(n).toLowerCase().includes(this.q));
      const sig = shown.join('|') + '#' + cur + '#' + (this.busy || '');
      if (sig === this.sig) return; this.sig = sig;
      grid.innerHTML = shown.length ? shown.map(n => {
        const tv = /^(tv|hdmi|line|line-in|optical)\b/i.test(n);
        return `<button class="opt${n === cur ? ' sel' : ''}${this.busy === n ? ' busy' : ''}" data-v="${esc(n)}"><ha-icon icon="${tv ? 'mdi:television' : n === cur ? 'mdi:music-circle' : 'mdi:playlist-music-outline'}"></ha-icon><span class="t">${esc(n)}${n === cur ? '<small>Playing now</small>' : ''}</span></button>`;
      }).join('') : `<div class="empty">${list.length ? 'Nothing matches.' : st.state === 'unavailable' ? 'This speaker is offline.' : 'No saved music found.'}</div>`;
    } else {
      const rooms = c._groupable(), mem = c._members(), lead = mem[0] || c._cfg.entity;
      const sig = rooms.join('|') + '#' + mem.join('|') + '#' + (this.busy || '');
      if (sig === this.sig) return; this.sig = sig;
      grid.innerHTML = rooms.map(id => {
        const s = h.states[id], nm = c._roomName(id), inG = mem.length > 1 && mem.includes(id), isLead = inG && id === lead, self = id === c._cfg.entity;
        const off = !s || s.state === 'unavailable';
        const sub = off ? 'Offline' : isLead ? 'Group leader' : inG ? (self ? 'This room · in group' : 'In this group') : self ? 'This room' : 'Tap to add';
        const locked = isLead || (self && !inG);
        return `<button class="opt${inG || self ? ' sel' : ''}${locked ? ' lead' : ''}${off || this.busy === id ? ' busy' : ''}" data-v="${esc(id)}"><ha-icon icon="${inG || self ? 'mdi:speaker-wireless' : 'mdi:speaker'}"></ha-icon><span class="t">${esc(nm)}<small>${sub}</small></span></button>`;
      }).join('') || '<div class="empty">No other speakers can be grouped with this one.</div>';
    }
  }
  async pick(o) {
    const c = this.card, v = o.dataset.v;
    if (this.kind === 'src') {
      this.busy = v; this.sig = null; this.update();
      try { await c._hass.callService('media_player', 'select_source', { entity_id: c._cfg.entity, source: v }); } catch (e) { console.warn('One Stop media player: source failed', e); }
      this.busy = null; if (c._cfg.close_after_pick !== false) this.close(); else { this.sig = null; this.update(); }
      return;
    }
    if (o.classList.contains('lead')) return;
    const mem = c._members(), lead = mem[0] || c._cfg.entity, inG = mem.length > 1 && mem.includes(v);
    this.busy = v; this.sig = null; this.update();
    try {
      if (inG) await c._hass.callService('media_player', 'unjoin', { entity_id: v });
      else await c._hass.callService('media_player', 'join', { entity_id: lead, group_members: [v] });
    } catch (e) { console.warn('One Stop media player: grouping failed', e); }
    setTimeout(() => { this.busy = null; this.sig = null; this.update(); }, 1200);
  }
  async bulk(f) {
    const c = this.card, mem = c._members(), lead = mem[0] || c._cfg.entity, me = c._cfg.entity;
    try {
      if (f === 'all') {
        const add = c._groupable().filter(id => id !== lead && !mem.includes(id) && c._hass.states[id]?.state !== 'unavailable');
        if (add.length) await c._hass.callService('media_player', 'join', { entity_id: lead, group_members: add });
      } else if (mem.length > 1) {
        // leave this room playing on its own
        const drop = lead === me ? mem.filter(id => id !== me) : [me];
        await c._hass.callService('media_player', 'unjoin', { entity_id: drop });
      }
    } catch (e) { console.warn(e); }
  }
}

class OneStopMediaPlayerCard extends HTMLElement {
  static getConfigElement() { return document.createElement(EDITOR_TAG); }
  static getStubConfig(hass) { const ids = Object.keys(hass?.states || {}).filter(x => x.startsWith('media_player.')); return { entity: ids.find(x => hass.states[x].attributes.supported_features & F.GROUPING) || ids[0] || '' }; }
  setConfig(c) { if (!c || !c.entity) throw new Error('Pick a media player'); this._cfg = { ...c }; if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._built = false; if (this._hass) this._render(); }
  set hass(h) { this._hass = h; if (!this._built) this._render(); else this._update(); if (this._sheet) this._sheet.update(); }
  getCardSize() { return 5; }
  getGridOptions() { return { columns: 12, rows: 'auto', min_columns: 12 }; }
  _st() { return this._hass?.states?.[this._cfg.entity]; }
  _call(s, d = {}) { this._hass.callService('media_player', s, { entity_id: this._cfg.entity, ...d }); }
  _roomName(id) {
    const h = this._hass, s = h.states[id], e = h.entities?.[id], a = e?.area_id || (e?.device_id && h.devices?.[e.device_id]?.area_id);
    return (a && h.areas?.[a]?.name) || s?.attributes?.friendly_name || id;
  }
  _name() { return this._cfg.name || this._roomName(this._cfg.entity); }
  _sources() { const all = this._st()?.attributes?.source_list || []; return this._cfg.sources && this._cfg.sources.length ? this._cfg.sources : all; }
  _members() { const g = this._st()?.attributes?.group_members; return Array.isArray(g) ? g : []; }
  _groupable() {
    const me = this._cfg.entity;
    if (this._cfg.group_speakers && this._cfg.group_speakers.length) return [me, ...this._cfg.group_speakers.filter(x => x !== me)];
    const h = this._hass, plat = h.entities?.[me]?.platform;
    const ids = Object.keys(h.states).filter(id => id.startsWith('media_player.') && (h.states[id].attributes.supported_features & F.GROUPING)
      && (!plat || h.entities?.[id]?.platform === plat) && !h.entities?.[id]?.hidden && (id === me || h.states[id].state !== 'unavailable'));
    ids.sort((a, b) => (a === me ? -1 : b === me ? 1 : this._roomName(a).localeCompare(this._roomName(b))));
    return ids;
  }
  _brand() {
    if (this._cfg.subtitle) return this._cfg.subtitle;
    const p = this._hass.entities?.[this._cfg.entity]?.platform;
    return ({ sonos: 'Sonos', music_assistant: 'Music', apple_tv: 'Apple TV', cast: 'Speaker', samsungtv: 'TV', samsungtv_smart: 'TV', webostv: 'TV', plex: 'Plex', heos: 'HEOS', bluesound: 'Bluesound' })[p] || 'Music';
  }
  _render() {
    const c = this._cfg, R = this.shadowRoot; if (!R || !this._hass) return;
    R.innerHTML = `<style>${CSS}</style><ha-card style="--mp-ac:${ACCENT[c.color] || ACCENT.slate};${c.art_size ? `--mp-art:${+c.art_size}px;` : ''}">
      <div class="hd"><div style="min-width:0"><h2></h2><p><span class="dot"></span><span data-status></span></p></div>
        <button class="sq" data-a="src" aria-label="Choose music"><ha-icon icon="mdi:playlist-music"></ha-icon></button>
        <button class="sq" data-a="grp" aria-label="Group speakers"><ha-icon icon="mdi:speaker-multiple"></ha-icon><span class="n hide"></span></button>
      </div>
      <div class="pl">
        <div class="core"><div class="art"><ha-icon icon="${esc(c.icon || 'mdi:speaker')}"></ha-icon></div>
          <div class="info"><div class="lab"></div><div class="ttl"></div><div class="art2"></div></div></div>
        <div class="prog hide"><span data-cur>0:00</span><div class="bar"><i></i></div><span data-dur>0:00</span></div>
        <div class="tr">
          <button class="b" data-a="prev" aria-label="Previous"><ha-icon icon="mdi:skip-previous"></ha-icon></button>
          <button class="b main" data-a="play" aria-label="Play or pause"><ha-icon icon="mdi:play"></ha-icon></button>
          <button class="b" data-a="next" aria-label="Next"><ha-icon icon="mdi:skip-next"></ha-icon></button>
          <button class="b" data-a="power" aria-label="Power"><ha-icon icon="mdi:power"></ha-icon></button>
        </div>
        <div class="vol"><button class="b" data-a="mute" aria-label="Mute"><ha-icon icon="mdi:volume-high"></ha-icon></button><input type="range" min="0" max="100" step="1" value="0" aria-label="Volume"></div>
      </div></ha-card>`;
    this._built = true; this._pic = undefined;
    R.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); this._act(b.dataset.a); }));
    const r = R.querySelector('input[type=range]');
    r.addEventListener('input', () => { this._drag = Date.now(); r.style.setProperty('--p', r.value + '%'); });
    r.addEventListener('change', () => { this._call('volume_set', { volume_level: r.value / 100 }); this._drag = Date.now(); });
    this._update();
    clearInterval(this._t); this._t = setInterval(() => this._tick(), 1000);
  }
  _act(a) {
    const st = this._st(); if (!st) return; const on = !OFFISH.includes(st.state), f = st.attributes.supported_features || 0;
    if (a === 'src' || a === 'grp') { if (this._sheet) this._sheet.close(); this._sheet = new Sheet(this, a); return; }
    if (a === 'power') this._call(on ? 'turn_off' : 'turn_on');
    else if (a === 'play') this._call(st.state === 'playing' ? ((f & F.PAUSE) ? 'media_pause' : 'media_stop') : 'media_play');
    else if (a === 'prev') this._call('media_previous_track');
    else if (a === 'next') this._call('media_next_track');
    else if (a === 'mute') this._call('volume_mute', { is_volume_muted: !st.attributes.is_volume_muted });
  }
  _pos() {
    const st = this._st(), a = st?.attributes; if (!a || !a.media_duration) return null;
    let p = a.media_position || 0;
    if (st.state === 'playing' && a.media_position_updated_at) p += (Date.now() - new Date(a.media_position_updated_at).getTime()) / 1000;
    return [Math.max(0, Math.min(a.media_duration, p)), a.media_duration];
  }
  _tick() {
    const R = this.shadowRoot, p = this._pos(); if (!R || !p) return;
    const b = R.querySelector('.bar i'); if (b) b.style.width = (p[0] / p[1] * 100).toFixed(2) + '%';
    const cu = R.querySelector('[data-cur]'); if (cu) cu.textContent = fmtT(p[0]);
    const du = R.querySelector('[data-dur]'); if (du) du.textContent = fmtT(p[1]);
  }
  _update() {
    if (!this._built) return;
    const R = this.shadowRoot, c = this._cfg, st = this._st(), q = s => R.querySelector(s);
    q('h2').textContent = this._name();
    if (!st) { q('[data-status]').textContent = 'Not found'; q('.ttl').textContent = c.entity; return; }
    const a = st.attributes, f = a.supported_features || 0, on = !OFFISH.includes(st.state), playing = st.state === 'playing', active = playing || st.state === 'paused';
    const label = playing ? 'Playing' : st.state === 'paused' ? 'Paused' : ['unknown', 'unavailable'].includes(st.state) ? 'Offline' : st.state === 'off' ? 'Off' : 'Ready';
    const mem = this._members(), others = mem.filter(id => id !== c.entity);
    q('[data-status]').textContent = `${this._brand()} · ${label}${mem.length > 1 ? ` · with ${others.map(id => this._roomName(id)).join(', ')}` : ''}`;
    q('.dot').classList.toggle('on', playing);
    q('ha-card').classList.toggle('dead', st.state === 'unavailable');
    q('.lab').textContent = active ? 'Now playing' : 'Ready to play';
    q('.ttl').textContent = active ? (a.media_title || a.source || 'Music') : (a.source || (st.state === 'off' ? 'Off' : 'Nothing playing'));
    q('.art2').textContent = active ? [a.media_artist || a.media_series_title, a.media_album_name && a.media_album_name !== a.media_title ? a.media_album_name : ''].filter(Boolean).join(' · ') : (this._sources().length ? 'Tap the list button to choose music' : '');
    const pic = active && a.entity_picture ? a.entity_picture : '';
    if (pic !== this._pic) { this._pic = pic; const art = q('.art'); art.style.backgroundImage = pic ? `url("${pic}")` : ''; art.classList.toggle('has', !!pic); }
    // header buttons
    q('[data-a=src]').classList.toggle('hide', !(f & F.SELECT_SOURCE) || c.show_sources === false);
    const grpOk = (f & F.GROUPING) && c.show_group !== false && this._groupable().length > 1;
    q('[data-a=grp]').classList.toggle('hide', !grpOk); q('[data-a=grp]').classList.toggle('act', mem.length > 1);
    const n = q('.sq .n'); n.classList.toggle('hide', mem.length < 2); n.textContent = mem.length;
    // transport
    q('[data-a=play] ha-icon').setAttribute('icon', playing ? ((f & F.PAUSE) ? 'mdi:pause' : 'mdi:stop') : 'mdi:play');
    q('[data-a=prev]').classList.toggle('hide', !(f & F.PREV)); q('[data-a=next]').classList.toggle('hide', !(f & F.NEXT));
    q('[data-a=power]').classList.toggle('hide', !(f & (F.TURN_ON | F.TURN_OFF)) || c.show_power === false);
    q('.tr').classList.toggle('hide', c.show_controls === false);
    q('.prog').classList.toggle('hide', !(active && this._pos() && c.show_progress !== false)); this._tick();
    // volume
    const r = q('input[type=range]'), canVol = (f & F.VOL_SET) && a.volume_level != null;
    q('.vol').classList.toggle('hide', !on || !canVol || c.show_volume === false);
    if (canVol && Date.now() - (this._drag || 0) > 1500) { const v = Math.round(a.volume_level * 100); r.value = v; r.style.setProperty('--p', v + '%'); }
    const mu = q('[data-a=mute]'); mu.classList.toggle('muted', !!a.is_volume_muted); mu.classList.toggle('hide', !(f & F.VOL_MUTE));
    mu.querySelector('ha-icon').setAttribute('icon', a.is_volume_muted ? 'mdi:volume-off' : a.volume_level < .34 ? 'mdi:volume-low' : a.volume_level < .67 ? 'mdi:volume-medium' : 'mdi:volume-high');
  }
  disconnectedCallback() { clearInterval(this._t); if (this._sheet) this._sheet.close(); }
  connectedCallback() { if (this._built) { clearInterval(this._t); this._t = setInterval(() => this._tick(), 1000); } }
}

class OneStopMediaPlayerCardEditor extends HTMLElement {
  setConfig(c) { this._config = { ...c }; this._draw(); }
  set hass(h) { this._hass = h; if (this._form) this._form.hass = h; else this._draw(); }
  _draw() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement('ha-form');
      this._form.computeLabel = s => ({ entity: 'Speaker or player', name: 'Name (blank = room name)', subtitle: 'Label before the status (default: brand, e.g. Sonos)', icon: 'Icon when nothing is playing', color: 'Accent colour', art_size: 'Artwork size (default 129)',
        show_sources: 'Show "Choose music" button', show_group: 'Show "Group speakers" button', show_controls: 'Show play / skip buttons', show_progress: 'Show song progress', show_volume: 'Show volume', show_power: 'Show power button (when supported)', close_after_pick: 'Close the music pop-up after picking',
        sources_text: 'Only list these in "Choose music" (one per line, blank = all)', group_speakers: 'Speakers you can group with (blank = find them automatically)' }[s.name] || s.name);
      this._form.addEventListener('value-changed', e => {
        const v = { ...e.detail.value }, out = { type: this._config.type };
        for (const [k, x] of Object.entries(v)) if (k !== 'sources_text' && x !== '' && x != null && !(Array.isArray(x) && !x.length)) out[k] = x;
        const src = String(v.sources_text || '').split('\n').map(l => l.trim()).filter(Boolean); if (src.length) out.sources = src;
        this._config = out; this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: out }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._form.schema = [
      { name: 'entity', selector: { entity: { domain: 'media_player' } } },
      { type: 'grid', name: '', schema: [{ name: 'name', selector: { text: {} } }, { name: 'subtitle', selector: { text: {} } }] },
      { type: 'grid', name: '', schema: [{ name: 'color', selector: { select: { mode: 'dropdown', options: Object.keys(ACCENT) } } }, { name: 'art_size', selector: { number: { min: 64, max: 180, mode: 'box' } } }] },
      { name: 'icon', selector: { icon: {} } },
      { type: 'grid', name: '', schema: ['show_sources', 'show_group', 'show_controls', 'show_progress', 'show_volume', 'show_power', 'close_after_pick'].map(n => ({ name: n, selector: { boolean: {} } })) },
      { name: 'sources_text', selector: { text: { multiline: true } } },
      { name: 'group_speakers', selector: { entity: { domain: 'media_player', multiple: true } } },
    ];
    const c = this._config;
    this._form.data = { show_sources: true, show_group: true, show_controls: true, show_progress: true, show_volume: true, show_power: true, close_after_pick: true, ...c, sources_text: (c.sources || []).join('\n') };
  }
}
if (!customElements.get(TAG)) customElements.define(TAG, OneStopMediaPlayerCard);
if (!customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, OneStopMediaPlayerCardEditor);
window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === TAG)) window.customCards.push({ type: TAG, name: 'One Stop - Media Player', description: 'Room player with now playing, controls, volume, a "Choose music" pop-up and speaker grouping.', preview: true });
console.info(`%c ONE STOP MEDIA PLAYER %c ${VERSION} `, 'color:#fff;background:#3b82f6;font-weight:700', 'color:#3b82f6;background:#fff');
})();
