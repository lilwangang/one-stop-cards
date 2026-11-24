/*!
 * One Stop – Music card
 * One Stop Smart Homes · standalone Home Assistant dashboard card
 * A full-page, app-style player for Music Assistant speakers (Sonos etc.):
 * Listen Now, Search, Library, Rooms, a mini player that opens a full Now Playing screen,
 * and playlist / album / artist pages.
 */
(() => {
'use strict';
const VERSION = '2.1.1';
const TAG = 'one-stop-music-card';
const EDITOR_TAG = TAG + '-editor';

const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const fmt = t => { t = Math.max(0, Math.floor(t || 0)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
const ACTIVE = ['playing', 'paused', 'buffering'];
const ic = (n, cls = '') => `<ha-icon class="${cls}" icon="mdi:${n}"></ha-icon>`;
const small = (u, px = 300) => (u ? String(u).replace(/\/\d{2,4}x\d{2,4}(?=[a-z]{0,2}[.\-])/i, `/${px}x${px}`) : '');
const AUTO_LISTS = /random|recently added|all favou?rited/i;
const ACCENTS = { red: '250,45,85', pink: '255,55,135', blue: '10,132,255', green: '48,209,88', purple: '191,90,242', orange: '255,159,10', white: '255,255,255' };
const KIND = { playlist: 'Playlist', album: 'Album', track: 'Song', artist: 'Artist', radio: 'Radio' };
const PH = { playlist: 'playlist-music', album: 'album', track: 'music-note', artist: 'account-music', radio: 'radio' };
const DEFAULTS = { title: 'Music', accent: 'red', start_tab: 'home', rows: ['recent', 'playlists', 'favourite_tracks', 'albums'] };
const ROWS = {
  recent: { title: 'Recently played', fetch: [['playlist', { order_by: 'last_played', limit: 14 }], ['album', { order_by: 'last_played', limit: 14 }]] },
  playlists: { title: 'Your playlists', fetch: [['playlist', { order_by: 'name', limit: 40 }]] },
  favourite_tracks: { title: 'Favourite songs', fetch: [['track', { favorite: true, order_by: 'timestamp_added_desc', limit: 24 }]], list: true },
  albums: { title: 'Albums', fetch: [['album', { order_by: 'last_played', limit: 24 }]] },
  artists: { title: 'Artists', fetch: [['artist', { order_by: 'last_played', limit: 24 }]] },
  radio: { title: 'Radio', fetch: [['radio', { limit: 24 }]] },
};
const LIB_KINDS = [['playlist', 'Playlists'], ['album', 'Albums'], ['artist', 'Artists'], ['track', 'Songs'], ['radio', 'Radio']];

/* -------- shared styles (card + overlays) -------- */
const BASE = `
*{box-sizing:border-box}
:host{--t:#fff;--s:rgba(235,238,245,.72);--f:rgba(235,238,245,.45);--line:rgba(255,255,255,.09);--fill:rgba(255,255,255,.07);--ac:250,45,85;
  font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Inter",var(--primary-font-family,Arial),sans-serif;color:var(--t);-webkit-font-smoothing:antialiased}
button{font:inherit;color:inherit;background:none;border:none;padding:0;margin:0;cursor:pointer;-webkit-tap-highlight-color:transparent;text-align:left}
ha-icon{display:inline-flex}
.h1{font-size:calc(32px * var(--z,1));font-weight:800;letter-spacing:-.6px;line-height:1.1}
.h2{font-size:calc(21px * var(--z,1));font-weight:750;letter-spacing:-.35px;margin:26px 2px 12px;display:flex;align-items:center;justify-content:space-between}
.strip{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x proximity;padding:0 2px 6px;margin:0 -2px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.strip::-webkit-scrollbar{display:none}
.tile{flex:0 0 calc(152px * var(--z,1));scroll-snap-align:start;min-width:0;display:block}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(calc(150px * var(--z,1)),1fr));gap:18px 14px}
.grid .tile{flex:none}
.cover{position:relative;width:100%;aspect-ratio:1;border-radius:12px;background:var(--fill);display:grid;place-items:center;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,.28);transition:transform .12s}
.cover img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.cover>ha-icon{--mdc-icon-size:44px;color:var(--f)}
.tile.artist .cover{border-radius:50%}
.qp{position:absolute;right:8px;bottom:8px;width:34px;height:34px;border-radius:50%;background:rgba(20,20,24,.62);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);display:grid;place-items:center;z-index:2}
.qp ha-icon{--mdc-icon-size:20px;color:#fff}
.tile b{display:block;font-size:calc(14.5px * var(--z,1));font-weight:600;margin-top:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tile span{display:block;font-size:calc(13px * var(--z,1));color:var(--s);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}
.tile.artist b,.tile.artist span{text-align:center}
.tile:active .cover{transform:scale(.97)}
.list{display:flex;flex-direction:column}
.song{display:grid;grid-template-columns:calc(50px * var(--z,1)) minmax(0,1fr) auto;gap:12px;align-items:center;padding:7px 2px;border-bottom:1px solid var(--line);width:100%}
.song .cover{border-radius:8px;box-shadow:none}
.song .cover>ha-icon{--mdc-icon-size:22px}
.song b{display:block;font-size:calc(15.5px * var(--z,1));font-weight:550;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.song span{display:block;font-size:calc(13.5px * var(--z,1));color:var(--s);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}
.song .n{font-size:13px;color:var(--f);font-variant-numeric:tabular-nums;width:22px;text-align:center}
.song.num{grid-template-columns:22px minmax(0,1fr) auto}
.song .dur{font-size:13px;color:var(--f);font-variant-numeric:tabular-nums}
.song.now b{color:rgb(var(--ac))}
.empty{font-size:15px;color:var(--s);padding:18px 4px;text-align:center}
.spin{width:26px;height:26px;margin:30px auto;border-radius:50%;border:3px solid rgba(255,255,255,.15);border-top-color:rgb(var(--ac));animation:sp .8s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
.pill{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:calc(46px * var(--z,1));padding:0 20px;border-radius:12px;background:var(--fill);font-size:calc(16px * var(--z,1));font-weight:650;color:rgb(var(--ac))}
.pill ha-icon{--mdc-icon-size:22px}
input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:28px;background:transparent;margin:0;--p:0%;touch-action:pan-y}
input[type=range]::-webkit-slider-runnable-track{height:7px;border-radius:4px;background:linear-gradient(90deg,rgba(255,255,255,.9) var(--p),rgba(255,255,255,.2) var(--p))}
input[type=range]::-moz-range-track{height:7px;border-radius:4px;background:linear-gradient(90deg,rgba(255,255,255,.9) var(--p),rgba(255,255,255,.2) var(--p))}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:#fff;margin-top:-6.5px;box-shadow:0 1px 5px rgba(0,0,0,.45)}
input[type=range]::-moz-range-thumb{width:20px;height:20px;border:none;border-radius:50%;background:#fff}
.eq{display:inline-flex;align-items:flex-end;gap:2px;height:12px;flex:none}
.eq i{width:3px;border-radius:1px;background:rgb(var(--ac));animation:eq 1s ease-in-out infinite}
.eq i:nth-child(1){height:6px}.eq i:nth-child(2){height:12px;animation-delay:.2s}.eq i:nth-child(3){height:8px;animation-delay:.4s}
.eq.still i{animation:none;transform:scaleY(.45)}
@keyframes eq{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)}}
`;

const CARD_CSS = `
:host{display:block}
ha-card{position:relative;display:flex;flex-direction:column;min-height:calc(100dvh - var(--header-height,56px) - env(safe-area-inset-top) - 16px);border-radius:var(--om-radius,28px);padding:18px 16px 0;overflow:visible;border:1px solid rgba(255,255,255,.08);
  background:linear-gradient(180deg,rgba(28,28,34,.94),rgba(16,16,20,.97));box-shadow:0 20px 50px rgba(0,0,0,.35)}
ha-card.bg-none{background:transparent;border:none;box-shadow:none;padding-left:4px;padding-right:4px}
ha-card.bg-glass{background:rgba(24,24,30,.45);-webkit-backdrop-filter:blur(24px);backdrop-filter:blur(24px)}
.head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin:2px 2px 16px}
.roomsel{display:flex;align-items:center;gap:8px;height:calc(46px * var(--z,1));padding:0 14px 0 6px;border-radius:999px;background:rgba(var(--ac),.16);border:1.5px solid rgba(var(--ac),.55);font-size:calc(16px * var(--z,1));font-weight:700;max-width:64%;box-shadow:0 6px 18px rgba(var(--ac),.18)}
.roomsel span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.roomsel .ri{flex:none;width:calc(34px * var(--z,1));height:calc(34px * var(--z,1));border-radius:50%;background:rgb(var(--ac));display:grid;place-items:center}
.roomsel .ri ha-icon{--mdc-icon-size:20px;color:#fff}
.roomsel .chev{--mdc-icon-size:20px;color:var(--t);flex:none}
.roomsel.on{background:rgb(var(--ac));border-color:rgb(var(--ac))}.roomsel.on .ri{background:rgba(255,255,255,.25)}
.view{flex:1;min-height:340px;padding-bottom:22px}
.search-empty{display:flex;flex-direction:column;align-items:center;gap:10px;padding:60px 10px 20px;color:var(--s);font-size:15px;text-align:center}
.search-empty ha-icon{--mdc-icon-size:54px;color:rgba(var(--ac),.8)}
.search-empty b{color:var(--t);font-size:19px;font-weight:700}
.search{display:flex;align-items:center;gap:10px;padding:0 14px;height:calc(48px * var(--z,1));border-radius:14px;background:var(--fill)}
.search ha-icon{--mdc-icon-size:22px;color:var(--s)}
.search input{flex:1;min-width:0;background:none;border:none;outline:none;color:var(--t);font:inherit;font-size:17px}
.search input::placeholder{color:var(--f)}
.seg{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin:2px -2px 18px;padding:0 2px}
.seg::-webkit-scrollbar{display:none}
.seg button{flex:none;height:38px;padding:0 16px;border-radius:999px;background:var(--fill);font-size:calc(15px * var(--z,1));font-weight:600;color:var(--s)}
.seg button.on{background:#fff;color:#111}
.top{display:grid;grid-template-columns:96px minmax(0,1fr);gap:16px;align-items:center;padding:14px;border-radius:16px;background:var(--fill);width:100%}
.top .cover{border-radius:10px}
.top b{display:block;font-size:20px;font-weight:750;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.top span{display:block;color:var(--s);font-size:14.5px;margin-top:2px}
/* rooms */
.rtools{display:flex;gap:10px;margin:0 0 6px}
.rtools .pill{flex:1;height:44px;font-size:15px;padding:0 10px}
.room{display:grid;grid-template-columns:56px minmax(0,1fr) auto;gap:6px 14px;align-items:center;padding:14px;border-radius:18px;background:var(--fill);margin-top:12px;border:1.5px solid transparent}
.room.sel{border-color:rgba(var(--ac),.8);background:rgba(var(--ac),.10)}
.room .pk{display:contents}
.room .cover{border-radius:10px;box-shadow:none}
.room .cover>ha-icon{--mdc-icon-size:26px}
.room .nm{font-size:calc(17px * var(--z,1));font-weight:700;display:flex;align-items:center;gap:8px}
.room .np{display:block;font-size:calc(14px * var(--z,1));color:var(--s);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
.room .rb{width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.12);display:grid;place-items:center}
.room .rb ha-icon{--mdc-icon-size:24px}
.room .vrow{grid-column:1/-1;display:flex;align-items:center;gap:12px;margin-top:4px}
.room .vrow ha-icon{--mdc-icon-size:20px;color:var(--s)}
.room .grp{grid-column:1/-1}
.chip{height:36px;padding:0 14px;border-radius:999px;background:rgba(255,255,255,.1);font-size:14px;font-weight:600;display:inline-flex;align-items:center;gap:6px}
.chip ha-icon{--mdc-icon-size:18px}
.chip.on{background:rgba(var(--ac),.9);color:#fff}
.room.off{opacity:.45}
/* dock */
.dock{position:sticky;bottom:0;margin-top:auto!important;z-index:5;margin:0 -16px;padding:0 10px calc(8px + env(safe-area-inset-bottom));border-radius:0 0 var(--om-radius,28px) var(--om-radius,28px);
  background:rgba(24,24,28,.88);-webkit-backdrop-filter:blur(24px) saturate(1.6);backdrop-filter:blur(24px) saturate(1.6);border-top:1px solid var(--line)}
ha-card.bg-none .dock{margin:0 -4px;border-radius:20px}
.mini{display:grid;grid-template-columns:52px minmax(0,1fr) 44px 44px;gap:12px;align-items:center;padding:10px 6px 8px;width:100%}
.mini .cover{border-radius:9px}
.mini .cover>ha-icon{--mdc-icon-size:24px}
.mini b{display:block;font-size:calc(16px * var(--z,1));font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mini .ml{display:flex;align-items:center;gap:6px;font-size:calc(13.5px * var(--z,1));color:var(--s);white-space:nowrap;overflow:hidden;margin-top:1px}
.mini .ml em{font-style:normal;overflow:hidden;text-overflow:ellipsis}
.mini .mb{width:44px;height:44px;display:grid;place-items:center;border-radius:50%}
.mini .mb ha-icon{--mdc-icon-size:32px}
.mini .mb:active{background:rgba(255,255,255,.1)}
.mprog{height:3px;border-radius:2px;background:rgba(255,255,255,.12);margin:0 6px;overflow:hidden}
.mprog i{display:block;height:100%;width:0;background:rgba(255,255,255,.75)}
.tabs{display:grid;grid-template-columns:repeat(3,1fr);padding-top:6px;padding-right:56px}
.tabs button{display:flex;flex-direction:column;align-items:center;gap:3px;padding:4px 0;font-size:calc(11.5px * var(--z,1));font-weight:600;color:var(--f);text-align:center}
.tabs ha-icon{--mdc-icon-size:26px}
.tabs button.on{color:rgb(var(--ac))}
.toast{position:fixed;left:50%;bottom:120px;transform:translate(-50%,16px);padding:11px 18px;border-radius:999px;background:rgba(40,40,46,.96);color:#fff;font-size:14.5px;font-weight:600;opacity:0;transition:all .25s;pointer-events:none;z-index:20;white-space:nowrap}
.toast.show{opacity:1;transform:translate(-50%,0)}
`;

const OV_CSS = `
.layer{position:fixed;inset:0;z-index:9000;display:flex;flex-direction:column;background:#111114;animation:up .28s cubic-bezier(.2,.8,.2,1);overflow:hidden}
.layer.push{animation:in .26s cubic-bezier(.2,.8,.2,1)}
@keyframes up{from{transform:translateY(100%)}}
@keyframes in{from{transform:translateX(100%)}}
.scroll{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:0 18px calc(40px + env(safe-area-inset-bottom));max-width:720px;width:100%;margin:0 auto}
.bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:calc(10px + env(safe-area-inset-top)) 12px 8px;max-width:720px;width:100%;margin:0 auto;position:relative;z-index:2}
.ib{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.1);flex:none}
.ib ha-icon{--mdc-icon-size:26px}
.ib.ac ha-icon{color:rgb(var(--ac))}
.dhead{display:flex;flex-direction:column;align-items:center;text-align:center;padding:6px 0 10px}
.dhead .cover{width:min(62vw,250px);border-radius:14px;box-shadow:0 18px 40px rgba(0,0,0,.5)}
.dhead.artist .cover{border-radius:50%}
.dhead h1{font-size:24px;font-weight:800;letter-spacing:-.4px;margin:18px 0 2px;line-height:1.15}
.dhead p{margin:0;font-size:16px;color:rgb(var(--ac));font-weight:600}
.dhead small{font-size:13.5px;color:var(--s);margin-top:4px}
.dact{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:18px 0 8px}
.np{background:#16161a}
.npbg{position:absolute;inset:-60px;background-size:cover;background-position:center;filter:blur(60px) saturate(1.6) brightness(.55);transform:scale(1.2);z-index:0}
.np .scroll,.np .bar{position:relative;z-index:1}
.np .scroll{display:flex;flex-direction:column;padding-top:4px}
.where{display:flex;align-items:center;gap:6px;height:36px;padding:0 12px;border-radius:999px;background:rgba(255,255,255,.12);font-size:14px;font-weight:650;max-width:62%}
.where span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.where ha-icon{--mdc-icon-size:18px;color:rgb(var(--ac));flex:none}
.big{flex:none;width:min(84vw,420px);height:min(84vw,420px);margin:14px auto 0;border-radius:14px;background:rgba(255,255,255,.08);box-shadow:0 26px 60px rgba(0,0,0,.5);display:grid;place-items:center;overflow:hidden;position:relative;transition:transform .4s cubic-bezier(.2,.8,.2,1)}
.big.paused{transform:scale(.86)}
.big img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.big>ha-icon{--mdc-icon-size:90px;color:var(--f)}
.npw{max-width:min(84vw,420px);width:100%;align-self:center}
.meta{margin-top:28px}
.meta b{display:block;font-size:22px;font-weight:750;letter-spacing:-.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.meta span{display:block;font-size:18px;color:var(--s);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
.times{display:flex;justify-content:space-between;font-size:12.5px;color:var(--f);font-weight:600;font-variant-numeric:tabular-nums;margin-top:2px}
.ctl{display:flex;align-items:center;justify-content:space-between;margin:14px 0 10px}
.ctl button{display:grid;place-items:center;border-radius:50%}
.ctl button:active{transform:scale(.88)}
.ctl .s{width:46px;height:46px}.ctl .s ha-icon{--mdc-icon-size:24px;color:var(--s)}
.ctl .s.on ha-icon{color:rgb(var(--ac))}
.ctl .m{width:64px;height:64px}.ctl .m ha-icon{--mdc-icon-size:46px}
.ctl .l{width:80px;height:80px}.ctl .l ha-icon{--mdc-icon-size:64px}
.ctl button[disabled]{opacity:.3;pointer-events:none}
.vol{display:flex;align-items:center;gap:12px}
.vol ha-icon{--mdc-icon-size:20px;color:var(--s)}
.nprow{display:flex;justify-content:space-around;margin:20px 0 4px}
.nprow button{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:12.5px;font-weight:600;color:var(--s)}
.nprow ha-icon{--mdc-icon-size:24px}
.upnext{margin-top:18px;padding:14px;border-radius:16px;background:rgba(0,0,0,.22)}
.upnext h3{margin:0 0 6px;font-size:15px;font-weight:700;color:var(--s)}
.upnext .song{border:none}
`;

class OneStopMusicCard extends HTMLElement {
  static getConfigElement() { return document.createElement(EDITOR_TAG); }
  static getStubConfig(hass) {
    const ents = hass?.entities || {};
    const players = Object.keys(hass?.states || {}).filter(e => e.startsWith('media_player.') && (ents[e]?.platform === 'music_assistant' || hass.states[e].attributes.mass_player_type));
    return { players: players.slice(0, 4) };
  }
  setConfig(config) {
    const players = (config.players || []).map(p => (typeof p === 'string' ? { entity: p } : p)).filter(p => p && p.entity);
    if (!players.length) throw new Error('Pick at least one Music Assistant speaker');
    this._cfg = { ...DEFAULTS, ...config, players };
    this._tab = this._tab || this._cfg.start_tab || 'home';
    this._libKind = this._libKind || 'playlist';
    this._cache = this._cache || {};
    if (this._root) { this._shell(); this._paint(); }
  }
  getCardSize() { return 14; }
  getGridOptions() { return { columns: 12, min_columns: 12 }; }
  set hass(h) {
    const first = !this._hass; this._hass = h;
    if (!this._root) this._shell();
    if (first) this._paint();
    this._live();
  }
  connectedCallback() { clearInterval(this._tick); this._tick = setInterval(() => this._progress(), 1000); }
  disconnectedCallback() { clearInterval(this._tick); this._closeAll(); }

  /* ---------- helpers ---------- */
  _vars() {
    const c = this._cfg, ac = ACCENTS[c.accent] || ACCENTS.red;
    return `--ac:${ac};--z:${(+c.text_scale || 100) / 100};${c.corner_radius != null ? `--om-radius:${+c.corner_radius}px;` : ''}`;
  }
  _players() { return this._cfg.players.map(p => ({ ...p, st: this._hass?.states[p.entity], name: p.name || this._hass?.states[p.entity]?.attributes.friendly_name || p.entity })); }
  _activeId() {
    const ps = this._players();
    if (this._active && ps.some(p => p.entity === this._active)) return this._active;
    const real = p => ACTIVE.includes(p.st?.state) && p.st.attributes.media_title;
    const pick = ps.find(p => p.st?.state === 'playing' && real(p)) || ps.find(real) || ps.find(p => p.st && p.st.state !== 'unavailable') || ps[0];
    return pick.entity;
  }
  _me() { return this._players().find(p => p.entity === this._activeId()); }
  _st() { return this._hass?.states[this._activeId()]; }
  _isActive(st) { return ACTIVE.includes(st?.state) && !!st.attributes.media_title; }
  _call(d, s, data) { return this._hass.callService(d, s, data).catch(e => { this._toast(e?.message || 'That didn’t work'); throw e; }); }
  _toast(m) { const t = this._root?.querySelector('.toast'); if (!t) return; t.textContent = m; t.classList.add('show'); clearTimeout(this._tt); this._tt = setTimeout(() => t.classList.remove('show'), 2200); }
  async _entry() {
    if (this._cfg.config_entry_id) return this._cfg.config_entry_id;
    if (this._ent) return this._ent;
    const es = await this._hass.callWS({ type: 'config_entries/get', domain: 'music_assistant' });
    return (this._ent = (es.find(e => e.state === 'loaded') || es[0])?.entry_id);
  }
  async _ma(service, data) {
    const config_entry_id = await this._entry();
    const r = await this._hass.callWS({ type: 'call_service', domain: 'music_assistant', service, service_data: { config_entry_id, ...data }, return_response: true });
    return r.response;
  }
  async _cached(key, fn, ttl = 300000) {
    const c = this._cache[key]; if (c && Date.now() - c.t < ttl) return c.v;
    const v = await fn(); this._cache[key] = { v, t: Date.now() }; return v;
  }
  _clean(items) {
    const seen = new Set();
    return (items || []).filter(i => {
      if (!i || AUTO_LISTS.test(i.name || '')) return false;
      const k1 = i.uri, k2 = (i.media_type || '') + '|' + (i.name || '').toLowerCase() + '|' + ((i.artists || [])[0]?.name || '').toLowerCase();
      if (seen.has(k1) || seen.has(k2)) return false; seen.add(k1); seen.add(k2); return true;
    });
  }
  _cover(url, kind, px = 300, extra = '') {
    const u = small(url, px);
    return `<div class="cover">${ic(PH[kind] || 'music')}${u ? `<img loading="lazy" src="${esc(u)}" alt="" onerror="this.remove()">` : ''}${extra}</div>`;
  }
  _sub(it) {
    const artists = (it.artists || []).map(x => x.name).join(', ');
    if (it.media_type === 'album') return artists || 'Album';
    if (it.media_type === 'track') return artists || (it.album?.name ?? 'Song');
    if (it.media_type === 'playlist') return it.owner && !/^library$/i.test(it.owner) ? `Playlist · ${it.owner}` : 'Playlist';
    return KIND[it.media_type] || '';
  }
  _tileHTML(it) {
    const play = it.media_type !== 'artist' ? `<span class="qp" data-act="quickplay">${ic('play')}</span>` : '';
    const img = it.image || it.album?.image || '';
    return `<button class="tile ${esc(it.media_type)}" data-act="open" data-uri="${esc(it.uri)}" data-type="${esc(it.media_type)}" data-name="${esc(it.name)}" data-img="${esc(img)}" data-sub="${esc(this._sub(it))}">
      ${this._cover(img, it.media_type, 300, play)}<b>${esc(it.name)}</b><span>${esc(this._sub(it))}</span></button>`;
  }
  _songHTML(it, n) {
    const cur = this._st()?.attributes?.media_title === it.name;
    return `<button class="song ${n ? 'num' : ''} ${cur ? 'now' : ''}" data-act="play" data-uri="${esc(it.uri)}" data-type="track" data-name="${esc(it.name)}">
      ${n ? `<span class="n">${n}</span>` : this._cover(it.image || it.album?.image, 'track', 120)}
      <div style="min-width:0"><b>${esc(it.name)}</b><span>${esc((it.artists || []).map(x => x.name).join(', ') || it.album?.name || '')}</span></div>
      <span class="dur">${it.duration ? fmt(it.duration) : ''}</span></button>`;
  }

  /* ---------- shell ---------- */
  _shell() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._root = this.shadowRoot;
    const bg = this._cfg.background || 'default';
    this._root.innerHTML = `<style>${BASE}${CARD_CSS}</style><ha-card class="bg-${esc(bg)}" style="${this._vars()}">
      <div class="head"><div class="h1">${esc(this._cfg.title)}</div>
        <button class="roomsel" data-act="tab" data-tab="rooms"><span class="ri">${ic('speaker-multiple')}</span><span class="rs"></span>${ic('chevron-down', 'chev')}</button></div>
      <div class="view"></div>
      <div class="dock">
        <button class="mini" data-act="np"><span class="mc"></span><div style="min-width:0"><b class="mt"></b><div class="ml"><span class="eq"><i></i><i></i><i></i></span><em class="ms"></em></div></div>
          <span class="mb" data-act="pp">${ic('play')}</span><span class="mb" data-act="next">${ic('skip-next')}</span></button>
        <div class="mprog"><i></i></div>
        <nav class="tabs">${[['home', 'home-variant', 'Listen Now'], ['search', 'magnify', 'Search'], ['library', 'music-box-multiple', 'Library']]
          .map(([k, i, l]) => `<button data-act="tab" data-tab="${k}">${ic(i)}${l}</button>`).join('')}</nav>
      </div><div class="toast"></div></ha-card>`;
    if (!this._wired) {
      this._wired = true;
      this._root.addEventListener('click', e => this._click(e));
      this._root.addEventListener('input', e => this._input(e));
      this._root.addEventListener('change', e => this._input(e, true));
    }
  }
  _paint() {
    if (!this._root || !this._hass) return;
    this._root.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === this._tab));
    this._root.querySelector('.roomsel')?.classList.toggle('on', this._tab === 'rooms');
    const v = this._root.querySelector('.view');
    if (this._tab === 'home') this._home(v);
    else if (this._tab === 'search') this._searchView(v);
    else if (this._tab === 'library') this._libView(v);
    else this._roomsView(v);
    this._live();
  }

  /* ---------- tabs ---------- */
  async _home(v) {
    v.innerHTML = '<div class="spin"></div>';
    const t = this._ticket = (this._ticket || 0) + 1;
    try {
      const rows = await Promise.all(this._cfg.rows.filter(k => ROWS[k]).map(k => this._cached('row:' + k, async () => {
        const parts = await Promise.all(ROWS[k].fetch.map(([media_type, o]) => this._ma('get_library', { media_type, ...o }).then(r => r?.items || []).catch(() => [])));
        return this._clean(parts.flat()).slice(0, 20);
      }).then(items => [k, items])));
      if (t !== this._ticket || this._tab !== 'home') return;
      const html = rows.filter(([, items]) => items.length).map(([k, items], i) => `<div class="h2" ${i ? '' : 'style="margin-top:4px"'}>${esc(ROWS[k].title)}</div>` + (ROWS[k].list
        ? `<div class="list">${items.slice(0, 8).map(it => this._songHTML(it)).join('')}</div>`
        : `<div class="strip">${items.map(it => this._tileHTML(it)).join('')}</div>`)).join('');
      v.innerHTML = html || '<div class="empty">Your library is empty.</div>';
    } catch (e) { if (t === this._ticket) v.innerHTML = `<div class="empty">Couldn’t load your music (${esc(e?.message || e)}).</div>`; }
  }
  _searchView(v) {
    v.innerHTML = `<div class="search">${ic('magnify')}<input type="search" placeholder="Artists, songs, albums, playlists" value="${esc(this._q || '')}" enterkeyhint="search"></div><div class="res"></div>`;
    if (this._q) this._runSearch(this._q); else v.querySelector('.res').innerHTML = `<div class="search-empty">${ic('music-circle-outline')}<b>Find any song</b>Search Apple Music and your library for artists, songs, albums and playlists.</div>`;
    setTimeout(() => { if (!this._q) v.querySelector('input')?.focus({ preventScroll: true }); }, 50);
  }
  async _runSearch(term) {
    const box = this._root.querySelector('.res'); if (!box) return;
    if (!term) { box.innerHTML = `<div class="search-empty">${ic('music-circle-outline')}<b>Find any song</b>Search Apple Music and your library for artists, songs, albums and playlists.</div>`; return; }
    const t = this._sTicket = (this._sTicket || 0) + 1;
    box.innerHTML = '<div class="spin"></div>';
    try {
      const r = await this._cached('s:' + term.toLowerCase(), () => this._ma('search', { name: term, limit: 16 }), 600000);
      if (t !== this._sTicket) return;
      const tracks = this._clean(r.tracks), artists = this._clean(r.artists), albums = this._clean(r.albums), lists = this._clean(r.playlists), radio = this._clean(r.radio);
      const best = artists.find(a => a.name.toLowerCase() === term.toLowerCase()) || albums[0] || artists[0] || lists[0];
      let html = '';
      if (best) html += `<div class="h2" style="margin-top:20px">Top result</div><button class="top" data-act="open" data-uri="${esc(best.uri)}" data-type="${esc(best.media_type)}" data-name="${esc(best.name)}" data-img="${esc(best.image || '')}" data-sub="${esc(this._sub(best))}">
        ${this._cover(best.image, best.media_type).replace('class="cover"', `class="cover" style="${best.media_type === 'artist' ? 'border-radius:50%' : ''}"`)}<div style="min-width:0"><b>${esc(best.name)}</b><span>${esc(KIND[best.media_type] || '')}${best.media_type !== 'artist' && this._sub(best) ? ' · ' + esc(this._sub(best)) : ''}</span></div></button>`;
      if (tracks.length) html += `<div class="h2">Songs</div><div class="list">${tracks.slice(0, 6).map(i => this._songHTML(i)).join('')}</div>`;
      for (const [title, items] of [['Artists', artists], ['Albums', albums], ['Playlists', lists], ['Radio', radio]])
        if (items.length) html += `<div class="h2">${title}</div><div class="strip">${items.map(i => this._tileHTML(i)).join('')}</div>`;
      box.innerHTML = html || `<div class="empty">No results for “${esc(term)}”.</div>`;
    } catch (e) { if (t === this._sTicket) box.innerHTML = `<div class="empty">Search didn’t work (${esc(e?.message || e)}).</div>`; }
  }
  async _libView(v) {
    v.innerHTML = `<div class="seg">${LIB_KINDS.map(([k, l]) => `<button data-act="lib" data-kind="${k}" class="${k === this._libKind ? 'on' : ''}">${l}</button>`).join('')}</div><div class="lb"><div class="spin"></div></div>`;
    const kind = this._libKind, t = this._lTicket = (this._lTicket || 0) + 1;
    try {
      const opts = { playlist: { order_by: 'name', limit: 200 }, album: { order_by: 'name', limit: 300 }, artist: { order_by: 'name', limit: 300 }, track: { favorite: true, order_by: 'timestamp_added_desc', limit: 200 }, radio: { limit: 100 } }[kind];
      const items = await this._cached('lib:' + kind, async () => this._clean((await this._ma('get_library', { media_type: kind, ...opts }))?.items));
      if (t !== this._lTicket) return;
      const box = v.querySelector('.lb');
      box.innerHTML = !items.length ? '<div class="empty">Nothing here yet.</div>'
        : kind === 'track' ? `<div class="list">${items.map(i => this._songHTML(i)).join('')}</div>` : `<div class="grid">${items.map(i => this._tileHTML(i)).join('')}</div>`;
    } catch (e) { if (t === this._lTicket) v.querySelector('.lb').innerHTML = `<div class="empty">Couldn’t load (${esc(e?.message || e)}).</div>`; }
  }
  _roomsView(v) {
    v.innerHTML = `<div class="rtools"><button class="pill" data-act="groupall">${ic('speaker-multiple')}Play everywhere</button><button class="pill" data-act="ungroupall">${ic('link-variant-off')}Ungroup all</button></div><div class="rlist"></div>`;
    this._rSig = ''; this._rooms();
  }
  _rooms() {
    const box = this._root.querySelector('.rlist'); if (!box) return;
    const ps = this._players(), id = this._activeId(), lead = this._hass.states[id];
    const members = new Set(lead?.attributes?.group_members || []);
    const sig = ps.map(p => [p.entity, p.st?.state, p.st?.attributes?.media_title, (p.st?.attributes?.group_members || []).join('+'), Math.round((p.st?.attributes?.volume_level || 0) * 100)].join('|')).join() + id;
    if (sig === this._rSig || this._dragging) return; this._rSig = sig;
    const meName = esc(this._me()?.name || '');
    box.innerHTML = ps.map(p => {
      const a = p.st?.attributes || {}, off = !p.st || p.st.state === 'unavailable', live = this._isActive(p.st);
      const vol = Math.round((a.volume_level || 0) * 100), inGrp = p.entity !== id && members.has(p.entity);
      const leadOf = (a.group_members || []).length > 1 && a.group_members[0] === p.entity ? ` · ${a.group_members.length} rooms` : '';
      return `<div class="room ${p.entity === id ? 'sel' : ''} ${off ? 'off' : ''}">
        <button class="pk" data-act="pick" data-e="${esc(p.entity)}">${live ? this._cover(a.entity_picture, 'track', 120) : `<div class="cover">${ic((p.icon || 'mdi:speaker').replace('mdi:', ''))}</div>`}
        <div style="min-width:0"><div class="nm">${esc(p.name)}${p.st?.state === 'playing' ? '<span class="eq"><i></i><i></i><i></i></span>' : ''}</div>
          <span class="np">${off ? 'Offline' : live ? esc([a.media_title, a.media_artist].filter(Boolean).join(' · ')) + leadOf : 'Not playing'}</span></div></button>
        ${off ? '<span></span>' : `<button class="rb" data-act="rpp" data-e="${esc(p.entity)}">${ic(p.st?.state === 'playing' ? 'pause' : 'play')}</button>`}
        ${off ? '' : `<div class="vrow">${ic('volume-low')}<input type="range" min="0" max="100" value="${vol}" style="--p:${vol}%" data-vol="${esc(p.entity)}">${ic('volume-high')}</div>`}
        ${off || p.entity === id ? '' : `<div class="grp"><button class="chip ${inGrp ? 'on' : ''}" data-act="${inGrp ? 'leave' : 'join'}" data-e="${esc(p.entity)}">${ic(inGrp ? 'link-variant' : 'plus')}${inGrp ? `Playing with ${meName}` : `Add to ${meName}`}</button></div>`}
      </div>`;
    }).join('');
  }

  /* ---------- live bits ---------- */
  _live() {
    if (!this._root || !this._hass) return;
    const st = this._st(), a = st?.attributes || {}, live = this._isActive(st), me = this._me();
    const n = (a.group_members || []).length;
    this._root.querySelector('.rs').textContent = (me?.name || '') + (n > 1 ? ` +${n - 1}` : '');
    const pic = live ? (a.entity_picture || '') : '';
    const mc = this._root.querySelector('.mc');
    if (mc.dataset.p !== pic || !mc.innerHTML) { mc.dataset.p = pic; mc.innerHTML = this._cover(pic, 'track', 120); }
    this._root.querySelector('.mt').textContent = live ? a.media_title : 'Not playing';
    this._root.querySelector('.ms').textContent = live ? (a.media_artist || me?.name || '') : 'Tap any song to play it';
    const eq = this._root.querySelector('.mini .eq'); eq.style.display = live ? '' : 'none'; eq.classList.toggle('still', st?.state !== 'playing');
    this._root.querySelector('.mini [data-act=pp] ha-icon').setAttribute('icon', st?.state === 'playing' ? 'mdi:pause' : 'mdi:play');
    this._root.querySelector('.mini [data-act=next]').style.visibility = live ? '' : 'hidden';
    if (this._tab === 'rooms') this._rooms();
    this._npLive();
    this._progress();
  }
  _pos(st) {
    const a = st?.attributes || {}, dur = a.media_duration || 0;
    let pos = a.media_position || 0;
    if (st?.state === 'playing' && a.media_position_updated_at) pos += (Date.now() - new Date(a.media_position_updated_at).getTime()) / 1000;
    return [Math.min(pos, dur || pos), dur];
  }
  _progress() {
    if (!this._root || !this._hass) return;
    const st = this._st(), [pos, dur] = this._pos(st), pct = dur && this._isActive(st) ? pos / dur * 100 : 0;
    const bar = this._root.querySelector('.mprog i'); if (bar) bar.style.width = pct + '%';
    const L = this._np; if (!L || this._seeking) return;
    const sk = L.querySelector('.seek'); sk.value = pct; sk.style.setProperty('--p', pct + '%');
    L.querySelector('.pos').textContent = dur ? fmt(pos) : '0:00';
    L.querySelector('.dur').textContent = dur && this._isActive(st) ? '-' + fmt(dur - pos) : '';
  }

  /* ---------- overlays (mounted on <body> so nothing clips them) ---------- */
  _layerRoot() {
    if (!this._ovHost || !this._ovHost.isConnected) {
      this._ovHost = document.createElement('div');
      this._ovHost.style.cssText = 'position:fixed;inset:0;z-index:8999;pointer-events:none';
      const sr = this._ovHost.attachShadow({ mode: 'open' });
      sr.innerHTML = `<style>${BASE}${OV_CSS}:host{${this._vars()}}.layer{pointer-events:auto}</style>`;
      sr.addEventListener('click', e => this._click(e));
      sr.addEventListener('input', e => this._input(e));
      sr.addEventListener('change', e => this._input(e, true));
      document.body.appendChild(this._ovHost);
    }
    return this._ovHost.shadowRoot;
  }
  _layer(cls, html) {
    const L = document.createElement('div'); L.className = 'layer ' + cls; L.innerHTML = html;
    this._layerRoot().appendChild(L); this._stack = [...(this._stack || []), L];
    if (!this._esc) { this._esc = e => { if (e.key === 'Escape') this._pop(); }; window.addEventListener('keydown', this._esc); }
    return L;
  }
  _pop() {
    const L = (this._stack || []).pop(); if (!L) return;
    if (L === this._np) this._np = null;
    L.remove();
    if (!this._stack.length) this._closeAll();
  }
  _closeAll() {
    (this._stack || []).forEach(L => L.remove()); this._stack = []; this._np = null;
    this._ovHost?.remove(); this._ovHost = null;
    if (this._esc) { window.removeEventListener('keydown', this._esc); this._esc = null; }
  }

  async _detail(d) {
    const L = this._layer('push', `<div class="bar"><button class="ib ac" data-act="back">${ic('chevron-left')}</button><span></span></div>
      <div class="scroll"><div class="dhead ${esc(d.type)}">${this._cover(d.img, d.type, 600)}<h1>${esc(d.name)}</h1>${d.sub ? `<p>${esc(d.sub)}</p>` : ''}<small class="cnt"></small></div>
      ${d.type === 'artist' ? '' : `<div class="dact"><button class="pill" data-act="playall" data-uri="${esc(d.uri)}" data-type="${esc(d.type)}" data-name="${esc(d.name)}">${ic('play')}Play</button>
        <button class="pill" data-act="shuffleall" data-uri="${esc(d.uri)}" data-type="${esc(d.type)}" data-name="${esc(d.name)}">${ic('shuffle-variant')}Shuffle</button></div>`}
      <div class="body"><div class="spin"></div></div></div>`);
    try {
      const res = await this._cached('b:' + d.uri, () => this._hass.callWS({ type: 'media_player/browse_media', entity_id: this._activeId(), media_content_id: d.uri, media_content_type: d.type }));
      const kids = res?.children || [], body = L.querySelector('.body');
      const tracks = kids.filter(k => k.media_class === 'track');
      const others = kids.filter(k => k.media_class !== 'track');
      const asItem = k => {
        const m = /^(.*?) - (.*)$/.exec(k.title || ''), isTrack = k.media_class === 'track';
        const name = isTrack && m ? m[2] : k.title, artist = isTrack && m && d.type !== 'album' ? m[1] : '';
        return { name, uri: k.media_content_id, media_type: isTrack ? 'track' : (k.media_class || 'album'), image: k.thumbnail, artists: artist ? [{ name: artist }] : [] };
      };
      let html = '';
      if (tracks.length) html += `<div class="list">${tracks.map((k, i) => this._songHTML(asItem(k), d.type === 'album' ? i + 1 : 0)).join('')}</div>`;
      if (others.length) html += `<div class="h2">${d.type === 'artist' ? 'Albums' : 'More'}</div><div class="grid">${others.map(k => this._tileHTML(asItem(k))).join('')}</div>`;
      body.innerHTML = html || '<div class="empty">Nothing to show.</div>';
      L.querySelector('.cnt').textContent = tracks.length ? `${tracks.length} song${tracks.length > 1 ? 's' : ''}` : '';
    } catch (e) { L.querySelector('.body').innerHTML = `<div class="empty">Couldn’t open this (${esc(e?.message || e)}).</div>`; }
  }

  _openNP() {
    if (this._np) return;
    this._np = this._layer('np', `<div class="npbg"></div><div class="bar"><button class="ib" data-act="back">${ic('chevron-down')}</button>
      <button class="where" data-act="roomsfromnp">${ic('speaker')}<span class="wn"></span></button><span style="width:42px"></span></div>
      <div class="scroll"><div class="big"></div>
        <div class="npw"><div class="meta"><b class="nt"></b><span class="na"></span></div>
        <div style="margin-top:16px"><input class="seek" type="range" min="0" max="100" step="0.1" value="0" aria-label="Position"><div class="times"><span class="pos">0:00</span><span class="dur"></span></div></div>
        <div class="ctl"><button class="s" data-act="shuffle">${ic('shuffle-variant')}</button><button class="m" data-act="prev">${ic('rewind')}</button>
          <button class="l" data-act="pp">${ic('play')}</button><button class="m" data-act="next">${ic('fast-forward')}</button><button class="s" data-act="repeat">${ic('repeat')}</button></div>
        <div class="vol">${ic('volume-low')}<input class="nvol" type="range" min="0" max="100" value="0" aria-label="Volume">${ic('volume-high')}</div>
        <div class="nprow"><button data-act="roomsfromnp">${ic('speaker-multiple')}Rooms</button><button data-act="mute">${ic('volume-off')}Mute</button></div>
        <div class="upnext" hidden><h3>Up next</h3><div class="un"></div></div></div></div>`);
    this._npLive(); this._progress(); this._loadQueue();
  }
  async _loadQueue() {
    if (!this._np) return;
    try {
      const r = await this._hass.callWS({ type: 'call_service', domain: 'music_assistant', service: 'get_queue', service_data: {}, target: { entity_id: this._activeId() }, return_response: true });
      const q = Object.values(r.response || {})[0], n = q?.next_item?.media_item;
      if (!this._np) return;
      this._np.querySelector('.upnext').hidden = !n || !this._isActive(this._st());
      if (n) this._np.querySelector('.un').innerHTML = this._songHTML(n).replace('data-act="play"', 'data-act="next"');
    } catch (e) { /* queue is optional */ }
  }
  _npLive() {
    const L = this._np; if (!L) return;
    const st = this._st(), a = st?.attributes || {}, live = this._isActive(st), me = this._me(), n = (a.group_members || []).length;
    L.querySelector('.wn').textContent = (me?.name || '') + (n > 1 ? ` + ${n - 1} more` : '');
    const pic = live ? (a.entity_picture || '') : '';
    if (L.dataset.p !== pic || !L.querySelector('.big').innerHTML) {
      L.dataset.p = pic;
      L.querySelector('.big').innerHTML = pic ? `<img src="${esc(pic)}" alt="">` : ic('music-note');
      L.querySelector('.npbg').style.backgroundImage = pic ? `url("${pic}")` : '';
    }
    if (this._lastTitle !== a.media_title) { this._lastTitle = a.media_title; this._loadQueue(); }
    L.querySelector('.big').classList.toggle('paused', st?.state !== 'playing');
    L.querySelector('.nt').textContent = live ? a.media_title : 'Not playing';
    L.querySelector('.na').textContent = live ? [a.media_artist, a.media_album_name].filter(Boolean).join(' — ') : 'Pick something to play';
    L.querySelector('.ctl [data-act=pp] ha-icon').setAttribute('icon', st?.state === 'playing' ? 'mdi:pause' : 'mdi:play');
    L.querySelector('[data-act=shuffle]').classList.toggle('on', !!a.shuffle);
    const rp = L.querySelector('[data-act=repeat]'); rp.classList.toggle('on', ['all', 'one'].includes(a.repeat)); rp.querySelector('ha-icon').setAttribute('icon', a.repeat === 'one' ? 'mdi:repeat-once' : 'mdi:repeat');
    L.querySelector('.nprow [data-act=mute] ha-icon').setAttribute('icon', a.is_volume_muted ? 'mdi:volume-off' : 'mdi:volume-high');
    ['prev', 'next', 'shuffle', 'repeat'].forEach(k => L.querySelector(`.ctl [data-act=${k}]`).toggleAttribute('disabled', !live));
    if (!this._dragging) { const v = Math.round((a.volume_level || 0) * 100), el = L.querySelector('.nvol'); el.value = v; el.style.setProperty('--p', v + '%'); }
  }

  /* ---------- events ---------- */
  _click(e) {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const act = el.dataset.act, id = this._activeId(), d = el.dataset;
    if (act === 'quickplay') { e.stopPropagation(); const t = el.closest('[data-uri]'); return this._play(t.dataset); }
    if (act === 'np' && e.target.closest('.mb')) return;
    switch (act) {
      case 'tab': this._tab = d.tab; this._paint(); break;
      case 'lib': this._libKind = d.kind; this._paint(); break;
      case 'open': if (['track', 'radio'].includes(d.type)) this._play(d); else this._detail(d); break;
      case 'play': case 'playall': this._play(d); break;
      case 'shuffleall': this._call('media_player', 'shuffle_set', { entity_id: id, shuffle: true }).then(() => this._play(d)).catch(() => {}); break;
      case 'back': this._pop(); break;
      case 'np': this._openNP(); break;
      case 'pp': e.stopPropagation(); this._call('media_player', 'media_play_pause', { entity_id: id }).catch(() => {}); break;
      case 'next': e.stopPropagation(); this._call('media_player', 'media_next_track', { entity_id: id }).catch(() => {}); break;
      case 'prev': this._call('media_player', 'media_previous_track', { entity_id: id }).catch(() => {}); break;
      case 'shuffle': this._call('media_player', 'shuffle_set', { entity_id: id, shuffle: !this._st()?.attributes.shuffle }).catch(() => {}); break;
      case 'repeat': { const r = this._st()?.attributes.repeat; this._call('media_player', 'repeat_set', { entity_id: id, repeat: r === 'off' ? 'all' : r === 'all' ? 'one' : 'off' }).catch(() => {}); break; }
      case 'mute': this._call('media_player', 'volume_mute', { entity_id: id, is_volume_muted: !this._st()?.attributes.is_volume_muted }).catch(() => {}); break;
      case 'roomsfromnp': this._closeAll(); this._tab = 'rooms'; this._paint(); break;
      case 'pick': this._active = d.e; this._rSig = ''; this._live(); this._toast(`Now controlling ${this._me()?.name}`); break;
      case 'rpp': this._call('media_player', 'media_play_pause', { entity_id: d.e }).catch(() => {}); break;
      case 'join': this._call('media_player', 'join', { entity_id: id, group_members: [d.e] }).catch(() => {}); break;
      case 'leave': this._call('media_player', 'unjoin', { entity_id: d.e }).catch(() => {}); break;
      case 'groupall': {
        const others = this._players().filter(p => p.entity !== id && p.st && p.st.state !== 'unavailable').map(p => p.entity);
        if (others.length) this._call('media_player', 'join', { entity_id: id, group_members: others }).then(() => this._toast('Playing everywhere')).catch(() => {});
        break;
      }
      case 'ungroupall':
        this._players().forEach(p => { const g = p.st?.attributes?.group_members || []; if (g.length > 1 && g[0] !== p.entity) this._call('media_player', 'unjoin', { entity_id: p.entity }).catch(() => {}); });
        this._toast('Rooms ungrouped'); break;
    }
  }
  _input(e, commit) {
    const el = e.composedPath ? e.composedPath()[0] : e.target;
    if (el.matches?.('.search input')) { if (commit) return; this._q = el.value.trim(); clearTimeout(this._sT); this._sT = setTimeout(() => this._runSearch(this._q), 380); return; }
    if (el.type !== 'range') return;
    el.style.setProperty('--p', el.value + '%');
    const id = el.dataset.vol || this._activeId();
    if (el.matches('.seek')) {
      this._seeking = true;
      if (commit) { const dur = this._st()?.attributes.media_duration; if (dur) this._call('media_player', 'media_seek', { entity_id: id, seek_position: Math.round(el.value / 100 * dur) }).catch(() => {}); setTimeout(() => (this._seeking = false), 1500); }
      return;
    }
    this._dragging = true; clearTimeout(this._dT); this._dT = setTimeout(() => { this._dragging = false; this._rSig = ''; }, 1500);
    clearTimeout(el._t); el._t = setTimeout(() => this._call('media_player', 'volume_set', { entity_id: id, volume_level: el.value / 100 }).catch(() => {}), commit ? 0 : 150);
  }
  _play(d) {
    const id = this._activeId(), me = this._me();
    this._call('music_assistant', 'play_media', { entity_id: id, media_id: d.uri, media_type: d.type, enqueue: 'replace' })
      .then(() => this._toast(`Playing ${d.name} in ${me?.name || 'speaker'}`)).catch(() => {});
  }
}

/* ---------- visual editor ---------- */
const LABELS = {
  players: 'Speakers (Music Assistant players)', title: 'Page title', start_tab: 'Open on', rows: 'Rows on Listen Now', accent: 'Accent colour',
  background: 'Background', text_scale: 'Text size', corner_radius: 'Corner rounding',
};
const HELPERS = { players: 'Pick the Music Assistant versions of your speakers.', rows: 'Shown in this order.' };
class OneStopMusicCardEditor extends HTMLElement {
  setConfig(c) { this._config = { ...c }; this._render(); }
  set hass(h) { this._hass = h; this._render(); }
  _render() {
    if (!this._config || !this._hass) return;
    if (!this._form) {
      this._form = document.createElement('ha-form');
      this._form.computeLabel = s => LABELS[s.name] ?? s.name;
      this._form.computeHelper = s => HELPERS[s.name];
      this._form.addEventListener('value-changed', ev => {
        ev.stopPropagation();
        const v = { ...ev.detail.value }; for (const k of Object.keys(v)) if (v[k] === '' || v[k] == null) delete v[k];
        this._config = { type: this._config.type || 'custom:' + TAG, ...v };
        this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    const sel = opts => ({ select: { mode: 'dropdown', options: opts } });
    this._form.schema = [
      { name: 'players', required: true, selector: { entity: { multiple: true, filter: { domain: 'media_player', integration: 'music_assistant' } } } },
      { type: 'grid', name: '', schema: [{ name: 'title', selector: { text: {} } }, { name: 'start_tab', selector: sel([{ value: 'home', label: 'Listen Now' }, { value: 'search', label: 'Search' }, { value: 'library', label: 'Library' }, { value: 'rooms', label: 'Rooms (speaker button)' }]) }] },
      { name: 'rows', selector: { select: { multiple: true, mode: 'list', options: Object.entries(ROWS).map(([value, r]) => ({ value, label: r.title })) } } },
      { type: 'expandable', name: '', title: 'Look', icon: 'mdi:palette-outline', schema: [
        { type: 'grid', name: '', schema: [{ name: 'accent', selector: sel(Object.keys(ACCENTS).map(k => ({ value: k, label: k[0].toUpperCase() + k.slice(1) }))) },
          { name: 'background', selector: sel([{ value: 'default', label: 'Dark (default)' }, { value: 'glass', label: 'Frosted glass' }, { value: 'none', label: 'No background' }]) }] },
        { name: 'text_scale', selector: { number: { min: 80, max: 130, step: 5, mode: 'slider', unit_of_measurement: '%' } } },
        { name: 'corner_radius', selector: { number: { min: 0, max: 40, step: 2, mode: 'slider', unit_of_measurement: 'px' } } }] },
    ];
    const players = (this._config.players || []).map(p => (typeof p === 'string' ? p : p.entity));
    this._form.data = { ...DEFAULTS, ...this._config, players };
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, OneStopMusicCard);
if (!customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, OneStopMusicCardEditor);
window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === TAG)) window.customCards.push({ type: TAG, name: 'One Stop - Music card', description: 'Full-page music app for Music Assistant speakers: Listen Now, Search, Library, Rooms and a Now Playing screen.', preview: false });
console.info(`%c ONE STOP %c Music card ${VERSION} `, 'background:#375374;color:#fff;border-radius:3px 0 0 3px;padding:2px 4px', 'background:#e9eef5;color:#375374;border-radius:0 3px 3px 0;padding:2px 4px');
})();
