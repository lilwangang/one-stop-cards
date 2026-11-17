/*!
 * One Stop – Music card
 * One Stop Smart Homes · standalone Home Assistant dashboard card
 * A Sonos / Apple Music style player for Music Assistant speakers: now playing, rooms and grouping, your library and search.
 */
(() => {
'use strict';
const VERSION = '1.1.0';
const TAG = 'one-stop-music-card';
const EDITOR_TAG = TAG + '-editor';

const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const fmt = t => { t = Math.max(0, Math.floor(t || 0)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
const ACTIVE = ['playing', 'paused', 'buffering'];
const icon = (n, cls = '') => `<ha-icon class="${cls}" icon="mdi:${n}"></ha-icon>`;

const DEFAULTS = { title: 'Music', rows: ['recent', 'playlists', 'favourite_tracks'], row_size: 20 };
const ROWS = {
  recent: { title: 'Recently played', fetch: [['playlist', { order_by: 'last_played', limit: 12 }], ['album', { order_by: 'last_played', limit: 12 }]] },
  playlists: { title: 'Your playlists', fetch: [['playlist', { order_by: 'name', limit: 40 }]] },
  favourite_tracks: { title: 'Favourite songs', fetch: [['track', { favorite: true, order_by: 'timestamp_added_desc', limit: 30 }]] },
  albums: { title: 'Albums', fetch: [['album', { order_by: 'last_played', limit: 30 }]] },
  artists: { title: 'Artists', fetch: [['artist', { order_by: 'last_played', limit: 30 }]] },
  radio: { title: 'Radio', fetch: [['radio', { limit: 30 }]] },
};

const CSS = `
:host{display:block;--om-text:#f5f7fa;--om-sub:rgba(235,240,245,.62);--om-faint:rgba(235,240,245,.38);--om-line:rgba(255,255,255,.10);--om-accent:#ffffff}
*{box-sizing:border-box}
ha-card{background:transparent;border:none;box-shadow:none;overflow:visible;color:var(--om-text);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Inter",var(--primary-font-family,Arial),sans-serif}
ha-card::before,ha-card::after{display:none!important}
.wrap{display:grid;gap:18px;grid-template-columns:minmax(0,1fr);align-items:start}
@media(min-width:900px){.wrap.wide{grid-template-columns:minmax(340px,420px) minmax(0,1fr);align-items:start}.wrap.wide .hero{position:sticky;top:12px}}
button{font:inherit;color:inherit;background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
.glass{position:relative;border-radius:26px;overflow:hidden;overflow:clip;border:1px solid rgba(255,255,255,.10);background:rgba(22,24,30,.55);box-shadow:0 20px 50px rgba(0,0,0,.30)}
/* hero */
.hero{padding:18px 20px 16px;isolation:isolate}
.bg{position:absolute;inset:-40px;background-size:cover;background-position:center;filter:blur(48px) saturate(1.4);opacity:.55;transform:scale(1.2);z-index:-2;transition:background-image .6s}
.hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,12,16,.15),rgba(10,12,16,.55));z-index:-1}
.top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:16px}
.eyebrow{font-size:12px;font-weight:600;letter-spacing:.4px;color:var(--om-sub);text-transform:uppercase}
.room-btn{display:flex;align-items:center;gap:6px;padding:7px 12px 7px 10px;border-radius:999px;background:rgba(255,255,255,.14);font-size:13.5px;font-weight:600;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);max-width:70%}
.room-btn span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.room-btn ha-icon{--mdc-icon-size:18px;flex:none}
.room-btn small{font-size:12px;color:var(--om-sub);font-weight:600;flex:none}
.art{width:100%;max-width:360px;aspect-ratio:1;margin:0 auto;border-radius:16px;background:rgba(255,255,255,.06) center/cover no-repeat;box-shadow:0 24px 50px rgba(0,0,0,.45);display:grid;place-items:center;transition:transform .35s cubic-bezier(.2,.8,.2,1)}
.art.paused{transform:scale(.88);box-shadow:0 14px 30px rgba(0,0,0,.35)}
.art ha-icon{--mdc-icon-size:76px;color:var(--om-faint)}
.meta{margin-top:22px;min-width:0}
.title{font-size:21px;line-height:26px;font-weight:700;letter-spacing:-.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.artist{font-size:17px;line-height:22px;color:var(--om-sub);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.scrub{margin-top:18px}
.times{display:flex;justify-content:space-between;font-size:11.5px;color:var(--om-faint);margin-top:6px;font-variant-numeric:tabular-nums;font-weight:600}
input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:22px;background:transparent;margin:0;--p:0%;touch-action:none}
input[type=range]::-webkit-slider-runnable-track{height:6px;border-radius:3px;background:linear-gradient(90deg,rgba(255,255,255,.85) var(--p),rgba(255,255,255,.18) var(--p))}
input[type=range]::-moz-range-track{height:6px;border-radius:3px;background:linear-gradient(90deg,rgba(255,255,255,.85) var(--p),rgba(255,255,255,.18) var(--p))}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#fff;margin-top:-4px;box-shadow:0 1px 4px rgba(0,0,0,.4);opacity:0;transition:opacity .15s}
input[type=range]:active::-webkit-slider-thumb,input[type=range]:hover::-webkit-slider-thumb{opacity:1}
input[type=range]::-moz-range-thumb{width:14px;height:14px;border:none;border-radius:50%;background:#fff}
.ctrl{display:flex;align-items:center;justify-content:space-between;margin:14px 2px 6px}
.ctrl button{display:grid;place-items:center;border-radius:50%;transition:transform .12s,background .15s}
.ctrl button:active{transform:scale(.88)}
.ctrl .sm{width:42px;height:42px}.ctrl .sm ha-icon{--mdc-icon-size:22px;color:var(--om-sub)}
.ctrl .sm.on ha-icon{color:#fff}.ctrl .sm.on{background:rgba(255,255,255,.14)}
.ctrl .md{width:58px;height:58px}.ctrl .md ha-icon{--mdc-icon-size:40px}
.ctrl .lg{width:74px;height:74px}.ctrl .lg ha-icon{--mdc-icon-size:56px}
.vol{display:flex;align-items:center;gap:12px;margin-top:8px}
.vol ha-icon{--mdc-icon-size:18px;color:var(--om-sub);flex:none}
.vol button ha-icon{--mdc-icon-size:18px}
/* rooms sheet */
.rooms{padding:6px 16px 12px;margin-top:14px;border-top:1px solid var(--om-line);display:none}
.rooms.open{display:block}
.rooms h4{font-size:12px;font-weight:600;letter-spacing:.4px;text-transform:uppercase;color:var(--om-sub);margin:12px 4px 8px}
.room{display:grid;grid-template-columns:44px minmax(0,1fr) 78px;gap:12px;align-items:center;padding:8px 4px}
.room .thumb{width:44px;height:44px;border-radius:9px;background:rgba(255,255,255,.08) center/cover;display:grid;place-items:center}
.room .thumb ha-icon{--mdc-icon-size:22px;color:var(--om-sub)}
.room .info{min-width:0;text-align:left}
.room .info b{display:block;font-size:15px;font-weight:600}
.room .info span{display:block;font-size:12.5px;color:var(--om-sub);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.room .rv{grid-column:2/4;margin-top:-2px}
.gbtn{height:34px;border-radius:999px;background:rgba(255,255,255,.16);font-size:13px;font-weight:650}.gbtn.on{background:transparent;border:1px solid rgba(255,255,255,.3);color:var(--om-sub)}.chk{width:30px;height:30px;border-radius:50%;border:1.5px solid rgba(255,255,255,.35);display:grid;place-items:center}
.chk.on{background:#fff;border-color:#fff}.chk.on ha-icon{color:#111}
.chk ha-icon{--mdc-icon-size:18px;color:transparent}
.room .info b .here{display:inline-block;color:var(--om-text);margin-left:6px;padding:1px 7px;border-radius:999px;background:rgba(255,255,255,.16);font-size:11px;font-weight:600;vertical-align:2px}
/* library */
.lib{min-width:0}
.search{display:flex;align-items:center;gap:10px;padding:0 14px;height:46px;border-radius:14px;background:rgba(255,255,255,.08);border:1px solid var(--om-line)}
.search ha-icon{--mdc-icon-size:20px;color:var(--om-sub)}
.search input{flex:1;min-width:0;background:none;border:none;outline:none;color:var(--om-text);font:inherit;font-size:16px}
.search input::placeholder{color:var(--om-faint)}
.search button ha-icon{color:var(--om-faint)}
.row{margin-top:22px}
.row h3{font-size:21px;line-height:26px;font-weight:700;letter-spacing:-.3px;margin:0 2px 10px}
.strip{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;padding:2px 2px 8px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.strip::-webkit-scrollbar{display:none}
.tile{flex:0 0 148px;scroll-snap-align:start;text-align:left;min-width:0}
.tile .img{width:148px;height:148px;border-radius:12px;background:rgba(255,255,255,.07) center/cover;box-shadow:0 8px 20px rgba(0,0,0,.25);display:grid;place-items:center;position:relative;overflow:hidden}
.tile.artist .img{border-radius:50%}
.tile .img ha-icon{--mdc-icon-size:42px;color:var(--om-faint)}
.tile .play{position:absolute;right:8px;bottom:8px;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.92);display:grid;place-items:center;opacity:0;transform:translateY(4px);transition:all .18s}
.tile .play ha-icon{--mdc-icon-size:22px;color:#111}
.tile:hover .play,.tile:focus-visible .play{opacity:1;transform:none}
.tile b{display:block;font-size:13.5px;font-weight:600;margin-top:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tile span{display:block;font-size:12.5px;color:var(--om-sub);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tile.busy .img{outline:2px solid #fff;outline-offset:2px}
.empty{font-size:13.5px;color:var(--om-sub);padding:6px 2px}
.toast{position:fixed;left:50%;bottom:28px;transform:translate(-50%,20px);padding:10px 16px;border-radius:999px;background:rgba(30,32,38,.92);color:#fff;font-size:13.5px;font-weight:600;opacity:0;transition:all .25s;pointer-events:none;z-index:10;backdrop-filter:blur(12px)}
.toast.show{opacity:1;transform:translate(-50%,0)}
/* room bar */
.roombar{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:2px 2px 14px;margin:0 -2px}
.roombar::-webkit-scrollbar{display:none}
.rchip{flex:0 0 auto;display:flex;align-items:center;gap:8px;height:44px;padding:0 16px 0 12px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid var(--om-line);font-size:14.5px;font-weight:600;color:var(--om-text);transition:background .15s,color .15s}
.rchip ha-icon{--mdc-icon-size:20px;color:var(--om-sub)}
.rchip.on{background:#fff;color:#111;border-color:#fff}.rchip.on ha-icon{color:#111}
.rchip .eq{display:none;align-items:flex-end;gap:2px;height:12px}
.rchip.playing .eq{display:flex}
.rchip .eq i{width:3px;border-radius:1px;background:#4cd471;animation:eq 1s ease-in-out infinite}
.rchip.on .eq i{background:#1a9c46}
.rchip .eq i:nth-child(1){height:6px}.rchip .eq i:nth-child(2){height:12px;animation-delay:.2s}.rchip .eq i:nth-child(3){height:8px;animation-delay:.4s}
@keyframes eq{0%,100%{transform:scaleY(.4)}50%{transform:scaleY(1)}}
.rchip.off{opacity:.45}
/* mini player (phones) */
.mini{display:none;align-items:center;gap:12px;padding:10px 12px 10px 10px;cursor:pointer;text-align:left;width:100%}
.mini .mart{width:56px;height:56px;border-radius:10px;flex:none;background:rgba(255,255,255,.08) center/cover;display:grid;place-items:center;box-shadow:0 6px 16px rgba(0,0,0,.35)}
.mini .mart ha-icon{--mdc-icon-size:26px;color:var(--om-faint)}
.mini .mtxt{flex:1;min-width:0}
.mini .mtxt b{display:block;font-size:15.5px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mini .mtxt span{display:block;font-size:13px;color:var(--om-sub);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mini .mbtn{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;flex:none}
.mini .mbtn ha-icon{--mdc-icon-size:30px}
.mini .mexp ha-icon{--mdc-icon-size:22px;color:var(--om-sub)}
.collapse{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.12)}
.collapse ha-icon{--mdc-icon-size:22px}
@media(max-width:899px){
  .hero.small{padding:0}
  .hero.small .mini{display:flex}
  .hero.small .full{display:none}
}
@media(min-width:900px){.collapse{display:none}}
/* play prompts */
.libhead{font-size:13px;color:var(--om-sub);margin:0 2px 10px;font-weight:600}
.libhead b{color:var(--om-text)}
.tile .play{opacity:1;transform:none;width:30px;height:30px}
.tile .play ha-icon{--mdc-icon-size:20px}
.idle-hint{margin-top:10px;font-size:13.5px;color:var(--om-sub);text-align:center}
`;

class OneStopMusicCard extends HTMLElement {
  static getConfigElement() { return document.createElement(EDITOR_TAG); }
  static getStubConfig(hass) {
    const players = Object.keys(hass?.states || {}).filter(e => e.startsWith('media_player.') && hass.states[e].attributes.mass_player_type);
    return { players: players.slice(0, 4) };
  }
  setConfig(config) {
    const players = (config.players || []).map(p => typeof p === 'string' ? { entity: p } : p).filter(p => p && p.entity);
    if (!players.length) throw new Error('Pick at least one Music Assistant speaker');
    this._cfg = { ...DEFAULTS, ...config, players };
    if (this._root) { this._libLoaded = false; this._renderShell(); this._update(); this._loadLibrary(); }
  }
  getCardSize() { return 14; }
  getGridOptions() { return { columns: 'full', min_columns: 6 }; }
  set hass(hass) {
    const first = !this._hass; this._hass = hass;
    if (!this._root) this._renderShell();
    if (first) this._loadLibrary();
    this._update();
  }
  connectedCallback() { this._tick = setInterval(() => this._progress(), 1000); }
  disconnectedCallback() { clearInterval(this._tick); }

  /* ---------- helpers ---------- */
  _players() { return this._cfg.players.map(p => ({ ...p, st: this._hass?.states[p.entity], name: p.name || this._hass?.states[p.entity]?.attributes.friendly_name || p.entity })); }
  _activeId() {
    const ps = this._players();
    if (this._active && ps.some(p => p.entity === this._active)) return this._active;
    const real = p => ACTIVE.includes(p.st?.state) && p.st.attributes.media_title;
    const playing = ps.find(p => p.st?.state === 'playing' && real(p)) || ps.find(real);
    return (playing || ps[0]).entity;
  }
  _st() { return this._hass?.states[this._activeId()]; }
  _call(domain, service, data) {
    return this._hass.callService(domain, service, data).catch(e => this._toast(e?.message || 'That didn’t work'));
  }
  _toast(msg) { const t = this._q('.toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(this._tt); this._tt = setTimeout(() => t.classList.remove('show'), 2400); }
  _q(s) { return this._root.querySelector(s); }
  async _entryId() {
    if (this._cfg.config_entry_id) return this._cfg.config_entry_id;
    if (this._entry) return this._entry;
    const entries = await this._hass.callWS({ type: 'config_entries/get', domain: 'music_assistant' });
    this._entry = (entries.find(e => e.state === 'loaded') || entries[0])?.entry_id;
    return this._entry;
  }
  async _ma(service, data) {
    const config_entry_id = await this._entryId();
    const r = await this._hass.callWS({ type: 'call_service', domain: 'music_assistant', service, service_data: { config_entry_id, ...data }, return_response: true });
    return r.response;
  }

  /* ---------- shell ---------- */
  _renderShell() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._root = this.shadowRoot;
    const wide = this._cfg.layout !== 'stacked';
    this._root.innerHTML = `<style>${CSS}</style><ha-card><nav class="roombar" aria-label="Rooms"></nav><div class="wrap ${wide ? 'wide' : ''}">
      <section class="glass hero small">
        <div class="bg"></div>
        <button class="mini" aria-label="Open player"><div class="mart"></div><div class="mtxt"><b class="mtitle"></b><span class="msub"></span></div>
          <span class="mbtn mplay" role="button" aria-label="Play or pause">${icon('play')}</span><span class="mbtn mnext" role="button" aria-label="Next">${icon('skip-next')}</span></button>
        <div class="full">
        <div class="top"><button class="collapse" aria-label="Shrink player">${icon('chevron-down')}</button><div class="eyebrow nowin"></div>
          <button class="room-btn" aria-label="Group speakers">${icon('speaker-multiple')}<span class="rname">Group</span><small class="rplus"></small></button></div>
        <div class="art"></div>
        <div class="meta"><div class="title"></div><div class="artist"></div></div>
        <div class="scrub"><input class="seek" type="range" min="0" max="100" step="1" value="0" aria-label="Position"><div class="times"><span class="pos">0:00</span><span class="dur">-0:00</span></div></div>
        <div class="ctrl">
          <button class="sm shuffle" aria-label="Shuffle">${icon('shuffle-variant')}</button>
          <button class="md prev" aria-label="Previous">${icon('skip-previous')}</button>
          <button class="lg play" aria-label="Play or pause">${icon('play')}</button>
          <button class="md next" aria-label="Next">${icon('skip-next')}</button>
          <button class="sm repeat" aria-label="Repeat">${icon('repeat')}</button>
        </div>
        <div class="vol"><button class="mute" aria-label="Mute">${icon('volume-low')}</button><input class="volume" type="range" min="0" max="100" step="1" value="0" aria-label="Volume">${icon('volume-high')}</div>
        <div class="idle-hint" hidden>Pick something below to play it here</div>
        <div class="rooms"><h4 class="rtitle">Group speakers</h4><div class="rlist"></div></div>
        </div>
      </section>
      <section class="lib">
        <div class="libhead"></div>
        <div class="search">${icon('magnify')}<input type="search" placeholder="Artists, songs, albums, playlists" aria-label="Search music"><button class="clear" hidden aria-label="Clear search">${icon('close-circle')}</button></div>
        <div class="results"></div>
        <div class="rows"></div>
      </section>
    </div><div class="toast"></div></ha-card>`;
    const q = s => this._q(s);
    q('.room-btn').addEventListener('click', () => { q('.rooms').classList.toggle('open'); this._renderRooms(); });
    q('.mini').addEventListener('click', e => {
      if (e.target.closest('.mplay')) return this._call('media_player', 'media_play_pause', { entity_id: this._activeId() });
      if (e.target.closest('.mnext')) return this._call('media_player', 'media_next_track', { entity_id: this._activeId() });
      q('.hero').classList.remove('small');
    });
    q('.collapse').addEventListener('click', () => { q('.hero').classList.add('small'); q('.rooms').classList.remove('open'); });
    q('.roombar').addEventListener('click', e => { const c = e.target.closest('.rchip'); if (!c) return; this._active = c.dataset.e; this._pic = undefined; q('.rooms').classList.remove('open'); this._update(); });
    q('.play').addEventListener('click', () => this._call('media_player', 'media_play_pause', { entity_id: this._activeId() }));
    q('.prev').addEventListener('click', () => this._call('media_player', 'media_previous_track', { entity_id: this._activeId() }));
    q('.next').addEventListener('click', () => this._call('media_player', 'media_next_track', { entity_id: this._activeId() }));
    q('.shuffle').addEventListener('click', () => this._call('media_player', 'shuffle_set', { entity_id: this._activeId(), shuffle: !this._st()?.attributes.shuffle }));
    q('.repeat').addEventListener('click', () => { const r = this._st()?.attributes.repeat; this._call('media_player', 'repeat_set', { entity_id: this._activeId(), repeat: r === 'off' ? 'all' : r === 'all' ? 'one' : 'off' }); });
    q('.mute').addEventListener('click', () => this._call('media_player', 'volume_mute', { entity_id: this._activeId(), is_volume_muted: !this._st()?.attributes.is_volume_muted }));
    this._slider(q('.volume'), v => this._call('media_player', 'volume_set', { entity_id: this._activeId(), volume_level: v / 100 }), () => this._volDrag = true, () => this._volDrag = false);
    this._slider(q('.seek'), v => { const d = this._st()?.attributes.media_duration; if (d) this._call('media_player', 'media_seek', { entity_id: this._activeId(), seek_position: Math.round(v / 100 * d) }); }, () => this._seekDrag = true, () => this._seekDrag = false, true);
    const input = q('.search input');
    input.addEventListener('input', () => { q('.clear').hidden = !input.value; clearTimeout(this._st_t); this._st_t = setTimeout(() => this._search(input.value.trim()), 350); });
    q('.clear').addEventListener('click', () => { input.value = ''; q('.clear').hidden = true; this._search(''); });
    this._root.addEventListener('click', e => { const t = e.target.closest('.tile'); if (t) this._playItem(t); });
  }
  _slider(el, commit, start, end, onRelease) {
    const paint = () => el.style.setProperty('--p', el.value + '%');
    el.addEventListener('pointerdown', start); el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('input', () => { paint(); if (!onRelease) { clearTimeout(el._t); el._t = setTimeout(() => commit(+el.value), 120); } });
    el.addEventListener('change', () => { commit(+el.value); setTimeout(end, 600); });
  }

  /* ---------- live state ---------- */
  _update() {
    if (!this._root || !this._hass) return;
    const q = s => this._q(s), st = this._st(), a = st?.attributes || {};
    const active = ACTIVE.includes(st?.state) && !!st.attributes.media_title;
    const players = this._players(), me = players.find(p => p.entity === this._activeId());
    const others = (a.group_members || []).filter(e => e !== this._activeId()).length;
    q('.rplus').textContent = '';
    q('.rname').textContent = others ? `${others + 1} rooms` : 'Group';
    q('.nowin').textContent = (active ? (st.state === 'paused' ? 'Paused in ' : 'Playing in ') : '') + (me?.name || '');
    q('.libhead').innerHTML = `Tap anything to play it in <b>${esc(me?.name || '')}</b>${others ? ` and ${others} more` : ''}`;
    q('.idle-hint').hidden = active;
    q('.mtitle').textContent = active ? (a.media_title || 'Unknown') : `Nothing playing in ${me?.name || ''}`;
    q('.msub').textContent = active ? [a.media_artist, others ? `${others + 1} rooms` : me?.name].filter(Boolean).join(' · ') : 'Pick something below';
    q('.mplay ha-icon').setAttribute('icon', st?.state === 'playing' ? 'mdi:pause' : 'mdi:play');
    q('.mnext').style.visibility = active ? '' : 'hidden';
    q('.mplay').style.visibility = active ? '' : 'hidden';
    this._renderRoomBar(players);
    const pic = active ? a.entity_picture : '';
    if (pic !== this._pic) {
      this._pic = pic;
      q('.art').style.backgroundImage = pic ? `url("${pic}")` : '';
      q('.art').innerHTML = pic ? '' : icon('music-note');
      q('.bg').style.backgroundImage = pic ? `url("${pic}")` : '';
      q('.mart').style.backgroundImage = pic ? `url("${pic}")` : '';
      q('.mart').innerHTML = pic ? '' : icon('music-note');
    }
    q('.art').classList.toggle('paused', st?.state === 'paused');
    q('.title').textContent = active ? (a.media_title || 'Unknown') : 'Not playing';
    q('.artist').textContent = active ? [a.media_artist, a.media_album_name].filter(Boolean).join(' — ') : 'Choose something below';
    q('.play ha-icon').setAttribute('icon', st?.state === 'playing' ? 'mdi:pause' : 'mdi:play');
    q('.shuffle').classList.toggle('on', !!a.shuffle);
    q('.repeat').classList.toggle('on', ['all', 'one'].includes(a.repeat));
    q('.repeat ha-icon').setAttribute('icon', a.repeat === 'one' ? 'mdi:repeat-once' : 'mdi:repeat');
    q('.mute ha-icon').setAttribute('icon', a.is_volume_muted ? 'mdi:volume-off' : 'mdi:volume-low');
    if (!this._volDrag) { const v = Math.round((a.volume_level || 0) * 100); q('.volume').value = v; q('.volume').style.setProperty('--p', v + '%'); }
    ['.prev', '.next', '.shuffle', '.repeat', '.seek'].forEach(s => q(s).toggleAttribute('disabled', !active));
    this._progress();
    if (q('.rooms').classList.contains('open')) this._renderRooms();
  }
  _progress() {
    if (!this._root || !this._hass || this._seekDrag) return;
    const st = this._st(), a = st?.attributes || {};
    const dur = a.media_duration || 0;
    let pos = a.media_position || 0;
    if (st?.state === 'playing' && a.media_position_updated_at) pos += (Date.now() - new Date(a.media_position_updated_at).getTime()) / 1000;
    pos = Math.min(pos, dur || pos);
    const pct = dur ? pos / dur * 100 : 0;
    const seek = this._q('.seek'); seek.value = pct; seek.style.setProperty('--p', pct + '%');
    this._q('.pos').textContent = ACTIVE.includes(st?.state) && dur ? fmt(pos) : '0:00';
    this._q('.dur').textContent = ACTIVE.includes(st?.state) && dur ? '-' + fmt(dur - pos) : '-0:00';
  }
  _renderRoomBar(players) {
    const id = this._activeId();
    const sig = players.map(p => p.entity + p.st?.state).join() + id;
    if (sig === this._rbSig) return; this._rbSig = sig;
    this._q('.roombar').innerHTML = players.map(p => {
      const off = !p.st || p.st.state === 'unavailable';
      return `<button class="rchip ${p.entity === id ? 'on' : ''} ${p.st?.state === 'playing' ? 'playing' : ''} ${off ? 'off' : ''}" data-e="${esc(p.entity)}" aria-pressed="${p.entity === id}">
        ${icon((p.icon || 'mdi:speaker').replace('mdi:', ''))}<span>${esc(p.name)}</span><span class="eq"><i></i><i></i><i></i></span></button>`;
    }).join('');
    const on = this._q('.rchip.on'); if (on) { const bar = this._q('.roombar'); bar.scrollTo({ left: Math.max(0, on.offsetLeft - 8), behavior: 'smooth' }); }
  }
  _renderRooms() {
    const list = this._q('.rlist'), activeId = this._activeId(), st = this._st();
    const members = new Set([activeId, ...(st?.attributes.group_members || [])]);
    const ordered = this._players().sort((x, y) => (y.entity === activeId) - (x.entity === activeId));
    list.innerHTML = ordered.map(p => {
      const a = p.st?.attributes || {}, playing = ACTIVE.includes(p.st?.state) && !!a.media_title;
      const sub = p.st?.state === 'unavailable' ? 'Offline' : playing ? [a.media_title, a.media_artist].filter(Boolean).join(' · ') : 'Not playing';
      const pic = playing ? a.entity_picture : '';
      const inGroup = members.has(p.entity), cur = p.entity === activeId;
      return `<div class="room ${cur ? 'current' : ''}" data-e="${esc(p.entity)}">
        <div class="thumb" style="${pic ? `background-image:url('${esc(pic)}')` : ''}">${pic ? '' : icon(p.icon?.replace('mdi:', '') || 'speaker')}</div>
        <div class="info"><b>${esc(p.name)}${cur ? '<span class="here">Main</span>' : ''}</b><span>${esc(sub)}</span></div>
        ${cur ? '<span></span>' : `<button class="gbtn ${inGroup ? 'on' : ''}">${inGroup ? 'Remove' : 'Add'}</button>`}
        <input class="rv" type="range" min="0" max="100" step="1" value="${Math.round((a.volume_level || 0) * 100)}" style="--p:${Math.round((a.volume_level || 0) * 100)}%" aria-label="${esc(p.name)} volume">
      </div>`;
    }).join('');
    list.querySelectorAll('.room').forEach(row => {
      const e = row.dataset.e;

      row.querySelector('.gbtn')?.addEventListener('click', ev => {
        const on = ev.currentTarget.classList.contains('on');
        if (on) this._call('media_player', 'unjoin', { entity_id: e });
        else this._call('media_player', 'join', { entity_id: this._activeId(), group_members: [e] });
      });
      const rv = row.querySelector('.rv');
      rv.addEventListener('input', () => { rv.style.setProperty('--p', rv.value + '%'); clearTimeout(rv._t); rv._t = setTimeout(() => this._call('media_player', 'volume_set', { entity_id: e, volume_level: +rv.value / 100 }), 150); });
    });
  }

  /* ---------- library ---------- */
  _tile(it) {
    const artists = (it.artists || []).map(x => x.name).join(', ');
    const kind = { playlist: 'Playlist', album: artists ? 'Album · ' + artists : 'Album', track: artists || 'Song', artist: 'Artist', radio: 'Radio' }[it.media_type] || '';
    const img = it.image || it.album?.image || '';
    const ph = { playlist: 'playlist-music', album: 'album', track: 'music-note', artist: 'account-music', radio: 'radio' }[it.media_type] || 'music';
    return `<button class="tile ${esc(it.media_type)}" data-uri="${esc(it.uri)}" data-type="${esc(it.media_type)}" data-name="${esc(it.name)}">
      <div class="img" style="${img ? `background-image:url('${esc(img)}')` : ''}">${img ? '' : icon(ph)}<span class="play">${icon('play')}</span></div>
      <b>${esc(it.name)}</b><span>${esc(kind)}</span></button>`;
  }
  _row(title, items) {
    if (!items.length) return '';
    return `<div class="row"><h3>${esc(title)}</h3><div class="strip">${items.map(i => this._tile(i)).join('')}</div></div>`;
  }
  async _loadLibrary() {
    if (!this._hass || this._libLoading) return;
    this._libLoading = true;
    const box = this._q('.rows');
    try {
      const out = [];
      for (const key of this._cfg.rows) {
        const def = ROWS[key]; if (!def) continue;
        const parts = await Promise.all(def.fetch.map(([media_type, opts]) => this._ma('get_library', { media_type, ...opts }).then(r => r?.items || []).catch(() => [])));
        let items = parts.flat();
        if (key === 'recent') items = items.filter(i => !/random|recently added|all favorited/i.test(i.name));
        const seen = new Set(); items = items.filter(i => { const k = i.uri + '|' + (i.name || '').toLowerCase(), n = 'n|' + (i.name || '').toLowerCase() + '|' + (i.image || ''); if (seen.has(i.uri) || seen.has(n)) return false; seen.add(i.uri); seen.add(n); return true; });
        out.push(this._row(def.title, items.slice(0, this._cfg.row_size)));
      }
      box.innerHTML = out.join('') || '<div class="empty">Nothing in your library yet.</div>';
    } catch (e) {
      box.innerHTML = `<div class="empty">Couldn’t load your library (${esc(e?.message || e)}).</div>`;
    } finally { this._libLoading = false; }
  }
  async _search(term) {
    const box = this._q('.results');
    this._q('.rows').style.display = term ? 'none' : '';
    if (!term) { box.innerHTML = ''; return; }
    const ticket = this._searchTicket = (this._searchTicket || 0) + 1;
    box.innerHTML = '<div class="empty">Searching…</div>';
    try {
      const r = await this._ma('search', { name: term, limit: 12 });
      if (ticket !== this._searchTicket) return;
      const html = [['Top songs', r.tracks], ['Artists', r.artists], ['Albums', r.albums], ['Playlists', r.playlists], ['Radio', r.radio]]
        .map(([t, items]) => this._row(t, items || [])).join('');
      box.innerHTML = html || `<div class="empty">No results for “${esc(term)}”.</div>`;
    } catch (e) { if (ticket === this._searchTicket) box.innerHTML = `<div class="empty">Search didn’t work (${esc(e?.message || e)}).</div>`; }
  }
  _playItem(tile) {
    const { uri, type, name } = tile.dataset;
    tile.classList.add('busy'); setTimeout(() => tile.classList.remove('busy'), 1500);
    const players = this._players(), me = players.find(p => p.entity === this._activeId());
    this._call('music_assistant', 'play_media', { entity_id: this._activeId(), media_id: uri, media_type: type, enqueue: 'replace' })
      .then(() => this._toast(`Playing ${name} on ${me?.name || 'speaker'}`));
  }
}

/* ---------- visual editor ---------- */
const LABELS = { players: 'Speakers (Music Assistant players)', title: 'Card title', rows: 'Rows to show under the search box', layout: 'Layout on wide screens', row_size: 'Items per row' };
const HELPERS = { players: 'Pick the Music Assistant versions of your speakers. The first one is shown first when nothing is playing.', rows: 'Shown in this order.' };
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
    this._form.schema = [
      { name: 'players', required: true, selector: { entity: { multiple: true, filter: { domain: 'media_player', integration: 'music_assistant' } } } },
      { name: 'rows', selector: { select: { multiple: true, mode: 'list', options: Object.entries(ROWS).map(([value, r]) => ({ value, label: r.title })) } } },
      { name: 'layout', selector: { select: { mode: 'dropdown', options: [{ value: 'wide', label: 'Player beside the library' }, { value: 'stacked', label: 'Player above the library' }] } } },
    ];
    const players = (this._config.players || []).map(p => typeof p === 'string' ? p : p.entity);
    this._form.data = { rows: DEFAULTS.rows, layout: 'wide', ...this._config, players };
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, OneStopMusicCard);
if (!customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, OneStopMusicCardEditor);
window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === TAG)) window.customCards.push({ type: TAG, name: 'One Stop - Music card', description: 'Sonos / Apple Music style player for Music Assistant speakers: now playing, rooms, library and search.', preview: false });
console.info(`%c ONE STOP %c Music card ${VERSION} `, 'background:#375374;color:#fff;border-radius:3px 0 0 3px;padding:2px 4px', 'background:#e9eef5;color:#375374;border-radius:0 3px 3px 0;padding:2px 4px');
})();
