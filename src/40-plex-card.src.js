/*!
 * One Stop – Plex card
 * One Stop Smart Homes · standalone Home Assistant dashboard card (no other add-ons needed)
 * Continue Watching, Recently Added, Now Playing, full library browse + search, one-tap resume.
 */
(() => {
'use strict';
const VERSION = '1.1.0';
const TAG = 'one-stop-plex-card';
const EDITOR_TAG = TAG + '-editor';
const SECTION = 'plex', STYLE_DASH = 'one-stop-cards';

const DEFAULTS = {
  room_name: '', play_script: 'script.one_stop_plex_play',
  show_now_playing: true, show_continue: true, show_recent_movies: true, show_recent_tv: true, show_library: true, show_search: true,
  continue_title: 'Continue Watching', recent_movies_title: 'Recently Added Movies', recent_tv_title: 'Recently Added TV', library_title: 'Library',
  row_count: 20, hide_libraries: ['Music', 'Playlists'], default_library: '', default_sort: 'az',
  poster_size: 'medium', poster_shape: 'rounded', show_titles: true, show_progress: true,
  show_start_over: true, show_next_episode: true, confirm_play: true, skip_seconds: '10',
  card_spacing: 'standard', corners: 'rounded', font: 'classic', title_size: 'medium',
  off_background: 'theme', off_custom_color: [40, 44, 52], accent_color: [229, 160, 13], playing_glow: true, animations: true, haptics: true,
};
const ROOM_KEYS = ['type', 'room_name', 'apple_tv', 'remote', 'plex_client', 'open_script', 'play_script', 'browse_entity'];

/* ---------------- helpers ---------------- */
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const okRgb = v => Array.isArray(v) && v.length === 3 && v.every(n => Number.isFinite(+n));
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const live = st => st && !['unavailable', 'unknown'].includes(st.state);
const parseId = id => { const m = /^plex:\/\/([^/]+)\/([^?]+)(\?.*)?$/.exec(id || ''); return m ? { server: m[1], key: m[2], resume: /resume=1/.test(m[3] || '') } : null; };
const yearOf = t => { const m = /\((\d{4})\)\s*$/.exec(t || ''); return m ? +m[1] : 0; };
const splitEp = t => { const m = /^(.*?) - S(\d+)E(\d+) - (.*)$/.exec(t || ''); return m ? { show: m[1], s: +m[2], e: +m[3], name: m[4] } : null; };
const thumb = (url, w = 300, h = 450) => {
  try { const u = new URL(url); const t = u.searchParams.get('X-Plex-Token'); if (!t || !/\/library\/metadata\//.test(u.pathname)) return url;
    return `${u.origin}/photo/:/transcode?width=${w}&height=${h}&minSize=1&upscale=1&url=${encodeURIComponent(u.pathname)}&X-Plex-Token=${t}`; } catch (e) { return url; }
};
const fmtTime = s => { s = Math.max(0, Math.round(s || 0)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };

/* ---------------- Plex data (via Home Assistant's media browser) ---------------- */
const DIRECT = '__one_stop_plex__';
const Plex = {
  cache: new Map(),
  async browse(hass, entity, id, type, ttl = 60000) {
    const k = id + '|' + type, hit = this.cache.get(k);
    if (hit && Date.now() - hit.t < ttl) return hit.v;
    const q = id ? { media_content_id: id, media_content_type: type } : {};
    let v;
    // Plex player entities only exist while a Plex app is open, so read the server directly when we can
    if (entity === DIRECT || !live(hass.states[entity])) {
      try { v = await hass.callWS({ type: 'one_stop/plex_browse', ...q }); } catch (e) { if (entity === DIRECT) throw e; }
    }
    if (!v) v = await hass.callWS({ type: 'media_player/browse_media', entity_id: entity, ...q });
    this.cache.set(k, { t: Date.now(), v }); return v;
  },
};

/* ---------------- shared house style ---------------- */
const Shared = {
  data: null, loading: null, listeners: new Set(), subscribed: false,
  _cache() { try { localStorage.setItem('one-stop-cards-style', JSON.stringify(this.data || {})); } catch (e) {} },
  _readCache() { if (!this.data) { try { const c = JSON.parse(localStorage.getItem('one-stop-cards-style') || 'null'); if (c) this.data = c; } catch (e) {} } },
  get(hass) {
    this._readCache();
    if (!this.loading) this.loading = (async () => {
      let d = {}; try { d = (await hass.callWS({ type: 'lovelace/config', url_path: STYLE_DASH, force: true }))?.one_stop || {}; } catch (e) {}
      const changed = !same(d, this.data); this.data = d; this._cache(); if (changed) this.listeners.forEach(fn => fn(d)); return d;
    })();
    return this.loading;
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
:host{display:block;--ac:229,160,13}
ha-card{position:relative;box-sizing:border-box;padding:var(--pad,18px);border-radius:var(--radius,22px);color:#f7f9fc;font-family:var(--font);container:osp/inline-size;
  background:linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.015)),var(--off-bg);border:1px solid rgba(255,255,255,.12);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 10px 24px rgba(0,0,0,.10);backdrop-filter:blur(18px) saturate(1.1);-webkit-backdrop-filter:blur(18px) saturate(1.1);-webkit-tap-highlight-color:transparent}
button{all:unset;box-sizing:border-box;cursor:pointer;-webkit-tap-highlight-color:transparent}
button:focus-visible{outline:2px solid #fff;outline-offset:2px}
button:active:not([disabled]){transform:scale(.96)} button[disabled]{opacity:.4;cursor:default}
.hide{display:none!important}
.sec{margin-top:20px}.sec:first-child{margin-top:0}
.sh{display:flex;align-items:center;gap:10px;margin:0 0 10px}
.sh h2{margin:0;font-size:var(--title,20px);font-weight:650;letter-spacing:-.3px;line-height:1.2}
.sh .ct{margin-left:auto;font-size:13px;opacity:.65}
/* now playing */
.np{position:relative;display:grid;grid-template-columns:auto minmax(0,1fr);gap:14px;align-items:center;padding:14px;border-radius:calc(var(--radius,22px) - 6px);overflow:hidden;
  background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)}
.np.glow{background:linear-gradient(145deg,rgba(255,255,255,.12),rgba(255,255,255,.03)),linear-gradient(rgba(var(--ac),.22),rgba(var(--ac),.08));border-color:rgba(var(--ac),.4)}
.np img{width:92px;aspect-ratio:2/3;object-fit:cover;border-radius:10px;box-shadow:0 6px 16px rgba(0,0,0,.35);background:rgba(255,255,255,.08)}
.np .t1{font-size:12px;font-weight:650;letter-spacing:.6px;text-transform:uppercase;opacity:.7}
.np .t2{font-size:20px;font-weight:650;line-height:1.2;margin-top:2px;overflow-wrap:anywhere}
.np .t3{font-size:14px;opacity:.8;margin-top:2px}
.bar{position:relative;height:6px;border-radius:3px;background:rgba(255,255,255,.14);margin-top:10px;overflow:hidden;cursor:pointer}
.bar i{position:absolute;inset:0 auto 0 0;width:var(--p,0%);background:rgb(var(--ac));border-radius:3px}
.times{display:flex;justify-content:space-between;font-size:12px;opacity:.7;margin-top:4px;font-variant-numeric:tabular-nums}
.ctl{display:flex;gap:8px;margin-top:10px}
.ctl button{flex:1;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2)}
.ctl button.main{background:rgba(var(--ac),.28);border-color:rgba(var(--ac),.65)}
.ctl ha-icon{--mdc-icon-size:28px}
.npidle{display:flex;align-items:center;gap:10px;font-size:15px;opacity:.75}
/* rows */
.row{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x proximity;padding:2px 2px 8px;margin:0 -2px;scrollbar-width:thin;-webkit-overflow-scrolling:touch}
.row::-webkit-scrollbar{height:6px}.row::-webkit-scrollbar-thumb{background:rgba(255,255,255,.2);border-radius:3px}
.it{flex:none;width:var(--pw,128px);scroll-snap-align:start;text-align:left;display:flex;flex-direction:column;gap:6px;min-width:0}
.it.wide{width:calc(var(--pw,128px) * 1.65)}
.ph{position:relative;width:100%;aspect-ratio:2/3;border-radius:var(--pr,12px);overflow:hidden;background:rgba(255,255,255,.08);box-shadow:0 4px 12px rgba(0,0,0,.3)}
.it.wide .ph{aspect-ratio:16/10}
.ph img{width:100%;height:100%;object-fit:cover;display:block}
.ph .fb{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:8px;text-align:center;font-size:13px;font-weight:600;opacity:.8}
.ph .pg{position:absolute;left:0;right:0;bottom:0;height:5px;background:rgba(0,0,0,.45)}
.ph .pg i{display:block;height:100%;width:var(--p,0%);background:rgb(var(--ac))}
.ph .badge{position:absolute;top:6px;left:6px;padding:2px 7px;border-radius:999px;font-size:11px;font-weight:700;background:rgba(0,0,0,.6)}
.it .nm{font-size:14px;font-weight:600;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.it .sb{font-size:12px;opacity:.7;margin-top:-4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.notitles .it .nm,.notitles .it .sb{display:none}
.empty{font-size:14px;opacity:.7;padding:6px 0}
/* library */
.tools{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
.tabs{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;flex:1 1 100%}
.tabs::-webkit-scrollbar{display:none}
.tab{flex:none;height:40px;padding:0 16px;border-radius:999px;display:flex;align-items:center;font-weight:600;font-size:14px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16);white-space:nowrap}
.tab.on{background:rgba(var(--ac),.3);border-color:rgba(var(--ac),.7)}
.search{flex:1 1 200px;display:flex;align-items:center;gap:8px;height:44px;padding:0 14px;border-radius:14px;background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.14)}
.search ha-icon{--mdc-icon-size:20px;opacity:.7}
.search input{all:unset;flex:1;min-width:0;font-size:16px;color:#f7f9fc}
.search input::placeholder{color:rgba(235,241,248,.55)}
select.sort{all:unset;box-sizing:border-box;height:44px;line-height:42px;padding:0 14px;border-radius:14px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16);font-size:14px;font-weight:600;cursor:pointer;color:#f7f9fc}
.crumbs{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:10px;font-size:14px}
.crumbs button{display:flex;align-items:center;gap:4px;height:36px;padding:0 12px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);font-weight:600}
.crumbs span{opacity:.75}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(calc(var(--pw,128px) * .8),1fr));gap:14px 10px}
.grid .it{width:auto}
.eps{display:flex;flex-direction:column;gap:8px}
.ep{display:grid;grid-template-columns:120px minmax(0,1fr);gap:12px;align-items:center;text-align:left;padding:6px;border-radius:14px;background:rgba(255,255,255,.04)}
.ep .ph{aspect-ratio:16/9;border-radius:10px}
.ep .nm{font-size:15px;font-weight:600}.ep .sb{font-size:13px;opacity:.7}
.more{width:100%;height:46px;margin-top:12px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-weight:600;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16)}
/* pop-up */
.pop{position:fixed;inset:0;z-index:10;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
@media (min-width:700px){.pop{align-items:center}}
.sheet{width:min(560px,100%);max-height:88vh;overflow:auto;box-sizing:border-box;padding:18px;border-radius:24px 24px 0 0;background:rgba(30,33,40,.96);border:1px solid rgba(255,255,255,.12);box-shadow:0 -10px 40px rgba(0,0,0,.5)}
@media (min-width:700px){.sheet{border-radius:24px}}
.sheet .top{display:grid;grid-template-columns:110px minmax(0,1fr);gap:14px;align-items:start}
.sheet .top .ph{box-shadow:0 6px 18px rgba(0,0,0,.4)}
.sheet h3{margin:0;font-size:21px;line-height:1.2}
.sheet .sub{font-size:14px;opacity:.75;margin-top:4px}
.sheet .room{display:inline-flex;align-items:center;gap:6px;margin-top:10px;font-size:13px;font-weight:600;padding:4px 10px;border-radius:999px;background:rgba(var(--ac),.2);border:1px solid rgba(var(--ac),.5)}
.sheet .room ha-icon{--mdc-icon-size:16px}
.acts{display:flex;flex-direction:column;gap:8px;margin-top:16px}
.act{height:56px;border-radius:16px;display:flex;align-items:center;gap:12px;padding:0 16px;font-weight:650;font-size:16px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18)}
.act.main{background:rgba(var(--ac),.32);border-color:rgba(var(--ac),.75)}
.act ha-icon{--mdc-icon-size:26px}
.act small{margin-left:auto;font-weight:500;opacity:.7;font-size:13px}
.close{width:100%;height:48px;margin-top:10px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-weight:600;opacity:.8}
.toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:11;padding:12px 18px;border-radius:14px;background:rgba(20,22,28,.95);border:1px solid rgba(var(--ac),.6);font-weight:600;font-size:15px;box-shadow:0 8px 24px rgba(0,0,0,.4);max-width:90vw;text-align:center}
.sz-small{--pw:104px}.sz-medium{--pw:128px}.sz-large{--pw:156px}.sz-extra_large{--pw:188px}
@container osp (max-width:420px){.sz-medium{--pw:112px}.sz-large{--pw:136px}.sz-extra_large{--pw:160px}.np img{width:76px}}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
`;

/* ---------------- the card ---------------- */
class OneStopPlexCard extends HTMLElement {
  static getConfigElement() { return document.createElement(EDITOR_TAG); }
  static getStubConfig(hass) {
    const s = hass?.states || {};
    const atv = Object.keys(s).find(e => e.startsWith('media_player.') && hass.entities?.[e]?.platform === 'apple_tv');
    const plex = Object.keys(s).find(e => e.startsWith('media_player.') && hass.entities?.[e]?.platform === 'plex');
    return { apple_tv: atv, plex_client: plex, remote: atv ? atv.replace('media_player.', 'remote.') : undefined };
  }
  setConfig(config) {
    if (!config) throw new Error('Invalid configuration');
    this._raw = { ...config }; this._merge();
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._built = false; if (this._hass) this._build();
  }
  _merge() { Shared._readCache(); this._cfg = { ...DEFAULTS, ...((Shared.data || {})[SECTION] || {}), ...this._raw }; }
  connectedCallback() { this._onShared = () => { this._merge(); this._built = false; if (this._hass) this._build(); }; Shared.listeners.add(this._onShared); this._tick = setInterval(() => this._npTick(), 1000); }
  disconnectedCallback() { Shared.listeners.delete(this._onShared); clearInterval(this._tick); }
  set hass(hass) {
    const first = !this._hass; this._hass = hass; if (first) Shared.get(hass);
    if (!this._built) this._build(); else this._updateNow();
  }
  getCardSize() { return 12; }
  getGridOptions() { return { columns: 12, rows: 'auto', min_columns: 12 }; }

  _browseEntity() {
    const c = this._cfg, s = this._hass.states;
    if (c.browse_entity && live(s[c.browse_entity])) return c.browse_entity;
    if (c.plex_client && live(s[c.plex_client])) return c.plex_client;
    return Object.keys(s).find(e => e.startsWith('media_player.') && this._hass.entities?.[e]?.platform === 'plex' && live(s[e])) || DIRECT;
  }
  _buzz() { if (this._cfg.haptics) { try { navigator.vibrate?.(12); } catch (e) {} } }
  _toast(msg) {
    const R = this.shadowRoot; R.querySelector('.toast')?.remove();
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; R.appendChild(t);
    clearTimeout(this._tt); this._tt = setTimeout(() => t.remove(), 3500);
  }

  _build() {
    const c = this._cfg, R = this.shadowRoot; if (!R || !this._hass) return;
    if (!c.apple_tv) { R.innerHTML = `<style>${CSS}</style><ha-card>Pick the Apple TV in the card editor.</ha-card>`; return; }
    const font = { classic: 'Arial,Helvetica,sans-serif', theme: 'var(--ha-font-family-body,var(--paper-font-body1_-_font-family,Roboto,sans-serif))', rounded: "ui-rounded,'SF Pro Rounded','Nunito','Varela Round',system-ui,sans-serif" }[c.font] || 'Arial,Helvetica,sans-serif';
    const offBg = { theme: 'var(--bubble-button-main-background-color,var(--bubble-main-background-color,var(--background-color-2,var(--ha-card-background,var(--card-background-color,var(--secondary-background-color))))))', darker: 'rgba(14,16,21,.50)', lighter: 'rgba(120,128,142,.30)', custom: okRgb(c.off_custom_color) ? rgba(c.off_custom_color, .55) : 'var(--secondary-background-color)' }[c.off_background] || 'var(--secondary-background-color)';
    const ac = okRgb(c.accent_color) ? c.accent_color : DEFAULTS.accent_color;
    const vars = [`--ac:${ac.join(',')}`, `--pad:${{ compact: 12, standard: 18, roomy: 24 }[c.card_spacing] || 18}px`, `--radius:${{ square: '8px', rounded: '22px', extra_round: '32px' }[c.corners] || '22px'}`,
      `--font:${font}`, `--off-bg:${offBg}`, `--title:${{ small: '16px', medium: '20px', large: '24px', extra_large: '28px' }[c.title_size] || '20px'}`,
      `--pr:${{ square: '4px', rounded: '12px', extra_round: '20px' }[c.poster_shape] || '12px'}`].join(';');
    const sec = (key, title, extra = '') => `<div class="sec" data-sec="${key}"><div class="sh"><h2>${esc(title)}</h2><span class="ct" data-ct></span>${extra}</div><div data-body><div class="empty">Loading…</div></div></div>`;
    R.innerHTML = `<style>${CSS}</style><ha-card class="sz-${esc(c.poster_size)} ${c.show_titles ? '' : 'notitles'}" style="${vars}">
      ${c.show_now_playing ? `<div class="sec" data-sec="now"><div class="sh"><h2>Now playing${c.room_name ? ' · ' + esc(c.room_name) : ''}</h2></div><div data-np></div></div>` : ''}
      ${c.show_continue ? sec('continue', c.continue_title) : ''}
      ${c.show_recent_movies ? sec('movies', c.recent_movies_title) : ''}
      ${c.show_recent_tv ? sec('tv', c.recent_tv_title) : ''}
      ${c.show_library ? `<div class="sec" data-sec="lib"><div class="sh"><h2>${esc(c.library_title)}</h2><span class="ct" data-lct></span></div>
        <div class="tools"><div class="tabs" data-tabs></div>${c.show_search ? `<label class="search"><ha-icon icon="mdi:magnify"></ha-icon><input type="search" placeholder="Search movies and shows" data-q enterkeyhint="search"></label>` : ''}
        <select class="sort" data-sort aria-label="Sort"><option value="az">A → Z</option><option value="za">Z → A</option><option value="new">Newest year</option><option value="old">Oldest year</option></select></div>
        <div class="crumbs hide" data-crumbs></div><div data-lib><div class="empty">Loading…</div></div></div>` : ''}
    </ha-card>`;
    this._built = true; this._npSig = null;
    this._lib = this._lib || { tab: null, stack: [], q: '', sort: c.default_sort, shown: 60 };
    const sortSel = R.querySelector('[data-sort]'); if (sortSel) { sortSel.value = this._lib.sort; sortSel.addEventListener('change', () => { this._lib.sort = sortSel.value; this._lib.shown = 60; this._renderLib(); }); }
    const q = R.querySelector('[data-q]'); if (q) { q.value = this._lib.q; q.addEventListener('input', () => { clearTimeout(this._qt); this._qt = setTimeout(() => { this._lib.q = q.value.trim(); this._lib.shown = 60; this._lib.stack = []; this._renderLib(); }, 200); }); }
    this._updateNow(); this._loadRows();
  }

  async _loadRows() {
    const h = this._hass, c = this._cfg, ent = this._browseEntity(); if (!ent) { this.shadowRoot.querySelectorAll('[data-body],[data-lib]').forEach(b => b.innerHTML = '<div class="empty">No Plex found in Home Assistant.</div>'); return; }
    try {
      const root = await Plex.browse(h, ent, null, null, 300000);
      const server = root.children.find(x => /server\/Recommended/.test(x.media_content_id));
      this._server = parseId(server?.media_content_id || root.children[0]?.media_content_id)?.server;
      this._libs = root.children.filter(x => !/Recommended|\/all$/.test(x.media_content_id) && !(c.hide_libraries || []).some(n => n.toLowerCase() === x.title.toLowerCase()));
      const hub = k => Plex.browse(h, ent, `plex://${this._server}/server/${k}`, 'hub', 30000).then(r => r.children).catch(() => []);
      const n = +c.row_count || 20;
      if (c.show_continue) hub('home.continue').then(list => this._fillRow('continue', list.slice(0, n), true));
      if (c.show_recent_movies) hub('home.movies.recent').then(list => this._fillRow('movies', list.slice(0, n)));
      if (c.show_recent_tv) hub('home.television.recent').then(list => this._fillRow('tv', list.slice(0, n)));
      if (c.show_library) this._renderTabs();
    } catch (e) { this.shadowRoot.querySelectorAll('[data-body]').forEach(b => b.innerHTML = `<div class="empty">Couldn’t reach Plex (${esc(e.message || e)}).</div>`); }
  }
  _poster(item, wide = false, progress = null) {
    const ep = splitEp(item.title);
    const name = ep ? ep.show : item.title.replace(/\s*\(\d{4}\)\s*$/, '');
    const sub = ep ? `S${ep.s} · E${ep.e} · ${ep.name}` : yearOf(item.title) || (item.media_class === 'tv_show' ? 'TV show' : '');
    return `<button class="it ${wide ? 'wide' : ''}" data-id="${esc(item.media_content_id)}" data-type="${esc(item.media_content_type)}" data-title="${esc(item.title)}" aria-label="${esc(item.title)}">
      <div class="ph">${item.thumbnail ? `<img loading="lazy" decoding="async" src="${esc(thumb(item.thumbnail))}" data-full="${esc(item.thumbnail)}" alt="">` : ''}<div class="fb ${item.thumbnail ? 'hide' : ''}">${esc(name)}</div>
      ${progress && this._cfg.show_progress ? `<div class="pg"><i style="--p:${progress}%"></i></div>` : ''}${ep && !wide ? `<span class="badge">S${ep.s}E${ep.e}</span>` : ''}</div>
      <div class="nm">${esc(name)}</div>${sub ? `<div class="sb">${esc(sub)}</div>` : ''}</button>`;
  }
  _wireItems(root) {
    root.querySelectorAll('img').forEach(i => i.addEventListener('error', function f() { if (i.dataset.full && i.src !== i.dataset.full) { i.src = i.dataset.full; return; } i.removeEventListener('error', f); i.parentElement?.querySelector('.fb')?.classList.remove('hide'); i.remove(); }));
    root.querySelectorAll('.it[data-id],.ep[data-id]').forEach(b => b.addEventListener('click', () => this._open({ id: b.dataset.id, type: b.dataset.type, title: b.dataset.title, thumb: b.querySelector('img')?.dataset.full || b.querySelector('img')?.src })));
  }
  _fillRow(key, list, isContinue = false) {
    const s = this.shadowRoot.querySelector(`[data-sec="${key}"]`); if (!s) return;
    this._rows = this._rows || {}; this._rows[key] = list;
    const body = s.querySelector('[data-body]');
    body.innerHTML = list.length ? `<div class="row">${list.map(x => this._poster(x, false, isContinue ? 50 : null)).join('')}</div>` : '<div class="empty">Nothing here yet.</div>';
    s.querySelector('[data-ct]').textContent = list.length ? `${list.length}` : '';
    if (isContinue) body.querySelectorAll('.pg').forEach(p => p.remove()); // HA does not share watch progress; show a "resume" badge instead
    if (isContinue) body.querySelectorAll('.ph').forEach(p => { if (!p.querySelector('.badge')) p.insertAdjacentHTML('beforeend', '<span class="badge">Resume</span>'); });
    this._wireItems(body);
  }

  /* ---- library ---- */
  _renderTabs() {
    const R = this.shadowRoot, tabs = R.querySelector('[data-tabs]'); if (!tabs || !this._libs) return;
    if (!this._lib.tab) this._lib.tab = (this._libs.find(l => l.title.toLowerCase() === String(this._cfg.default_library || '').toLowerCase()) || this._libs[0])?.media_content_id;
    tabs.innerHTML = this._libs.map(l => `<button class="tab ${l.media_content_id === this._lib.tab ? 'on' : ''}" data-tab="${esc(l.media_content_id)}">${esc(l.title)}</button>`).join('');
    tabs.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { this._buzz(); this._lib.tab = b.dataset.tab; this._lib.stack = []; this._lib.shown = 60; tabs.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t === b)); this._renderLib(); }));
    this._renderLib();
  }
  async _renderLib() {
    const R = this.shadowRoot, box = R.querySelector('[data-lib]'), crumbs = R.querySelector('[data-crumbs]'), cnt = R.querySelector('[data-lct]'); if (!box) return;
    const h = this._hass, ent = this._browseEntity(), L = this._lib, token = this._libTok = (this._libTok || 0) + 1;
    try {
      // inside a show / season
      if (L.stack.length) {
        const cur = L.stack[L.stack.length - 1];
        crumbs.classList.remove('hide');
        crumbs.innerHTML = `<button data-back><ha-icon icon="mdi:chevron-left"></ha-icon>Back</button>${L.stack.map(s => `<span>${esc(s.title)}</span>`).join('<span>›</span>')}`;
        crumbs.querySelector('[data-back]').addEventListener('click', () => { L.stack.pop(); this._renderLib(); });
        box.innerHTML = '<div class="empty">Loading…</div>';
        const r = await Plex.browse(h, ent, cur.id, cur.type, 300000); if (token !== this._libTok) return;
        const kids = r.children || [];
        cnt.textContent = `${kids.length}`;
        if (cur.type === 'season') {
          box.innerHTML = `<div class="eps">${kids.map(x => `<button class="ep" data-id="${esc(x.media_content_id)}" data-type="episode" data-title="${esc(cur.show + ' - ' + x.title)}"><div class="ph">${x.thumbnail ? `<img loading="lazy" decoding="async" src="${esc(thumb(x.thumbnail, 320, 180))}" data-full="${esc(x.thumbnail)}" alt="">` : ''}<div class="fb ${x.thumbnail ? 'hide' : ''}">${esc(x.title)}</div></div><div><div class="nm">${esc(x.title.replace(/^S\d+E(\d+) - /, '$1. '))}</div><div class="sb">${esc(cur.title)}</div></div></button>`).join('')}</div>`;
          this._wireItems(box);
        } else {
          box.innerHTML = `<div class="grid">${kids.map(x => `<button class="it" data-sid="${esc(x.media_content_id)}" data-stype="${esc(x.media_content_type)}" data-stitle="${esc(x.title)}"><div class="ph">${x.thumbnail ? `<img loading="lazy" decoding="async" src="${esc(thumb(x.thumbnail))}" data-full="${esc(x.thumbnail)}" alt="">` : ''}<div class="fb ${x.thumbnail ? 'hide' : ''}">${esc(x.title)}</div></div><div class="nm">${esc(x.title)}</div></button>`).join('')}</div>`;
          box.querySelectorAll('img').forEach(i => i.addEventListener('error', function f() { if (i.dataset.full && i.src !== i.dataset.full) { i.src = i.dataset.full; return; } i.removeEventListener('error', f); i.parentElement?.querySelector('.fb')?.classList.remove('hide'); i.remove(); }));
          box.querySelectorAll('[data-sid]').forEach(b => b.addEventListener('click', () => { this._buzz(); L.stack.push({ id: b.dataset.sid, type: b.dataset.stype, title: b.dataset.stitle, show: cur.show || cur.title }); this._renderLib(); }));
        }
        return;
      }
      crumbs.classList.add('hide');
      // search across all libraries, or list the chosen one
      let items;
      if (L.q) {
        box.innerHTML = '<div class="empty">Searching…</div>';
        const all = await Promise.all((this._libs || []).map(l => Plex.browse(h, ent, l.media_content_id, l.media_content_type, 300000).then(r => r.children).catch(() => [])));
        if (token !== this._libTok) return;
        const q = L.q.toLowerCase(), seen = new Set();
        items = all.flat().filter(x => !/Recommended/.test(x.media_content_id) && x.title.toLowerCase().includes(q) && !seen.has(x.media_content_id) && seen.add(x.media_content_id));
      } else {
        const lib = (this._libs || []).find(l => l.media_content_id === L.tab); if (!lib) { box.innerHTML = '<div class="empty">No libraries.</div>'; return; }
        box.innerHTML = '<div class="empty">Loading…</div>';
        const r = await Plex.browse(h, ent, lib.media_content_id, lib.media_content_type, 300000); if (token !== this._libTok) return;
        items = (r.children || []).filter(x => !/Recommended/.test(x.media_content_id));
      }
      const by = { az: (a, b) => a.title.localeCompare(b.title), za: (a, b) => b.title.localeCompare(a.title), new: (a, b) => yearOf(b.title) - yearOf(a.title), old: (a, b) => (yearOf(a.title) || 9999) - (yearOf(b.title) || 9999) }[L.sort] || null;
      if (by) items = [...items].sort(by);
      cnt.textContent = `${items.length}`;
      const page = items.slice(0, L.shown);
      box.innerHTML = items.length ? `<div class="grid">${page.map(x => this._poster(x)).join('')}</div>${items.length > L.shown ? `<button class="more" data-more>Show more (${items.length - L.shown} left)</button>` : ''}` : `<div class="empty">${L.q ? 'Nothing matches “' + esc(L.q) + '”.' : 'This library is empty.'}</div>`;
      this._wireItems(box);
      box.querySelectorAll('.it[data-type="show"]').forEach(b => { const n = b.cloneNode(true); b.replaceWith(n); n.addEventListener('click', () => { this._buzz(); L.stack = [{ id: n.dataset.id, type: 'show', title: n.dataset.title, show: n.dataset.title }]; this._renderLib(); }); });
      box.querySelector('[data-more]')?.addEventListener('click', () => { L.shown += 120; this._renderLib(); });
    } catch (e) { box.innerHTML = `<div class="empty">Couldn’t load (${esc(e.message || e)}).</div>`; }
  }

  /* ---- play pop-up ---- */
  async _nextEpisode(title) {
    const ep = splitEp(title); if (!ep) return null;
    const h = this._hass, ent = this._browseEntity();
    for (const lib of (this._libs || []).filter(l => /plex:\/\/[^/]+\/\d+$/.test(l.media_content_id))) {
      let r; try { r = await Plex.browse(h, ent, lib.media_content_id, lib.media_content_type, 300000); } catch (e) { continue; }
      const show = (r.children || []).find(x => x.media_content_type === 'show' && x.title === ep.show); if (!show) continue;
      const seasons = (await Plex.browse(h, ent, show.media_content_id, 'show', 300000)).children || [];
      const sn = s => +(/(\d+)/.exec(s.title) || [0, 0])[1];
      for (const s of seasons.filter(s => sn(s) >= ep.s).sort((a, b) => sn(a) - sn(b))) {
        const eps = (await Plex.browse(h, ent, s.media_content_id, 'season', 300000)).children || [];
        const nx = eps.find(x => { const m = /^S(\d+)E(\d+)/.exec(x.title); return m && (+m[1] > ep.s || (+m[1] === ep.s && +m[2] > ep.e)); });
        if (nx) return { id: nx.media_content_id, type: 'episode', title: `${ep.show} - ${nx.title}`, thumb: nx.thumbnail };
      }
    }
    return null;
  }
  _open(item) {
    this._buzz();
    const c = this._cfg, R = this.shadowRoot, p = parseId(item.id); if (!p) return;
    const ep = splitEp(item.title), inCont = (this._rows?.continue || []).some(x => parseId(x.media_content_id)?.key === p.key);
    const name = ep ? ep.show : item.title.replace(/\s*\(\d{4}\)\s*$/, ''), sub = ep ? `Season ${ep.s} · Episode ${ep.e} · ${ep.name}` : (yearOf(item.title) || '');
    if (!c.confirm_play) return this._play(p.key, item.type, inCont ? 'resume' : 'resume', item.title);
    const wrap = document.createElement('div'); wrap.className = 'pop';
    wrap.innerHTML = `<div class="sheet" role="dialog" aria-label="${esc(name)}"><div class="top"><div class="ph">${item.thumb ? `<img src="${esc(thumb(item.thumb))}" alt="">` : ''}<div class="fb ${item.thumb ? 'hide' : ''}">${esc(name)}</div></div>
      <div><h3>${esc(name)}</h3>${sub ? `<div class="sub">${esc(sub)}</div>` : ''}<div class="room"><ha-icon icon="mdi:television"></ha-icon>Plays on ${esc(c.room_name || this._hass.states[c.apple_tv]?.attributes?.friendly_name || 'TV')}</div></div></div>
      <div class="acts">
        <button class="act main" data-a="resume"><ha-icon icon="mdi:play"></ha-icon>${inCont ? 'Resume' : 'Play'}<small>${inCont ? 'from where you stopped' : ''}</small></button>
        ${c.show_start_over && inCont ? '<button class="act" data-a="start_over"><ha-icon icon="mdi:restart"></ha-icon>Start over</button>' : ''}
        ${c.show_next_episode && ep ? '<button class="act" data-a="next"><ha-icon icon="mdi:skip-next"></ha-icon>Next episode<small data-nx>finding…</small></button>' : ''}
      </div><button class="close" data-a="close">Close</button></div>`;
    R.appendChild(wrap);
    const close = () => wrap.remove();
    wrap.addEventListener('click', e => { if (e.target === wrap) close(); });
    let next = null;
    if (c.show_next_episode && ep) this._nextEpisode(item.title).then(n => { next = n; const s = wrap.querySelector('[data-nx]'); if (s) s.textContent = n ? splitEp(n.title)?.name ? `S${splitEp(n.title).s}E${splitEp(n.title).e} · ${splitEp(n.title).name}` : '' : 'none'; if (!n) wrap.querySelector('[data-a="next"]')?.setAttribute('disabled', ''); });
    wrap.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', async () => {
      const a = b.dataset.a; if (a === 'close') return close();
      if (a === 'next') { if (!next) return; close(); return this._play(parseId(next.id).key, 'episode', 'start_over', next.title); }
      close(); this._play(p.key, item.type === 'episode' ? 'episode' : 'movie', a, item.title);
    }));
  }
  async _play(key, type, mode, title) {
    const c = this._cfg, h = this._hass; this._buzz();
    const ep = splitEp(title), nice = ep ? `${ep.show} S${ep.s}E${ep.e}` : title.replace(/\s*\(\d{4}\)\s*$/, '');
    const script = c.play_script || DEFAULTS.play_script;
    if (!h.states[script]) { this._toast(`The play script (${script}) is missing.`); return; }
    const variables = { apple_tv: c.apple_tv, remote: c.remote || c.apple_tv.replace('media_player.', 'remote.'), plex_client: c.plex_client || '', open_script: c.open_script || '', server_id: this._server, media_key: String(key), media_type: type === 'movie' ? 'movie' : 'episode', mode: mode === 'start_over' ? 'start_over' : 'resume' };
    try { await h.callService('script', 'turn_on', { entity_id: script, variables }); this._toast(`${mode === 'start_over' ? 'Starting' : 'Playing'} ${nice} on ${c.room_name || 'the TV'}…`); }
    catch (e) { this._toast('Couldn’t start: ' + (e.message || e)); }
  }

  /* ---- now playing ---- */
  _updateNow() {
    const R = this.shadowRoot, box = R?.querySelector('[data-np]'); if (!box) return;
    const c = this._cfg, st = this._hass.states[c.apple_tv];
    const px = c.plex_client ? this._hass.states[c.plex_client] : null, pa = px && ['playing', 'paused'].includes(px.state) ? px.attributes : {};
    let a = { ...(st?.attributes || {}) }; for (const k of ['media_series_title', 'media_season', 'media_episode']) if (a[k] == null && pa[k] != null && (!a.media_title || pa.media_title === a.media_title)) a[k] = pa[k];
    // Apple TV not reporting what's on (e.g. AirPlay link down)? Use the Plex app's own report instead.
    const atvKnows = st && ['playing', 'paused'].includes(st.state) && (a.media_title || a.media_series_title);
    this._src = atvKnows || !pa.media_title ? c.apple_tv : c.plex_client;
    if (!atvKnows && pa.media_title) a = { ...pa, app_name: 'Plex' };
    const curState = this._src === c.apple_tv ? st?.state : px.state;
    const playing = ['playing', 'paused'].includes(curState) && (a.media_title || a.media_series_title);
    const sig = JSON.stringify([curState, this._src, a.media_title, a.media_series_title, a.media_season, a.entity_picture, a.media_duration]);
    if (sig === this._npSig) return this._npTick(); this._npSig = sig;
    if (!playing) { box.innerHTML = `<div class="npidle"><ha-icon icon="mdi:television-off"></ha-icon>${st ? (st.state === 'off' || st.state === 'standby' ? 'The TV is off.' : 'Nothing is playing.') : 'Apple TV not found.'}</div>`; return; }
    const sk = c.skip_seconds;
    box.innerHTML = `<div class="np ${c.playing_glow && curState === 'playing' ? 'glow' : ''}">${a.entity_picture ? `<img src="${esc(a.entity_picture)}" alt="">` : '<div></div>'}<div style="min-width:0">
      <div class="t1">${esc(a.app_name || 'Playing')} · ${curState === 'paused' ? 'Paused' : 'Playing'}</div>
      <div class="t2">${esc(a.media_series_title || a.media_title)}</div>${a.media_series_title ? `<div class="t3">${a.media_season ? `S${a.media_season} · E${a.media_episode} · ` : ''}${esc(a.media_title || '')}</div>` : ''}
      ${a.media_duration ? '<div class="bar" data-seek><i></i></div><div class="times"><span data-pos></span><span data-dur></span></div>' : ''}</div></div>
      <div class="ctl"><button data-c="back" aria-label="Back ${sk} seconds"><ha-icon icon="mdi:rewind-${sk}"></ha-icon></button><button class="main" data-c="pp" aria-label="Play or pause"><ha-icon icon="${curState === 'playing' ? 'mdi:pause' : 'mdi:play'}"></ha-icon></button><button data-c="fwd" aria-label="Forward ${sk} seconds"><ha-icon icon="mdi:fast-forward-${sk}"></ha-icon></button><button data-c="stop" aria-label="Stop"><ha-icon icon="mdi:stop"></ha-icon></button></div>`;
    box.querySelector('img')?.addEventListener('error', e => e.target.remove(), { once: true });
    box.querySelectorAll('[data-c]').forEach(b => b.addEventListener('click', () => this._ctl(b.dataset.c)));
    box.querySelector('[data-seek]')?.addEventListener('click', e => { const r = e.currentTarget.getBoundingClientRect(); this._seek(((e.clientX - r.left) / r.width) * (a.media_duration || 0)); });
    this._npTick();
  }
  _pos() { const st = this._hass?.states[this._src || this._cfg.apple_tv], a = st?.attributes || {}; if (a.media_position == null) return null; let p = a.media_position; if (st.state === 'playing' && a.media_position_updated_at) p += (Date.now() - new Date(a.media_position_updated_at).getTime()) / 1000; return Math.min(p, a.media_duration || p); }
  _npTick() {
    const R = this.shadowRoot, st = this._hass?.states[this._src || this._cfg?.apple_tv]; if (!R || !st) return;
    const d = st.attributes?.media_duration, p = this._pos(); if (!d || p == null) return;
    const i = R.querySelector('[data-seek] i'); if (i) i.style.setProperty('--p', (p / d * 100) + '%');
    const a = R.querySelector('[data-pos]'), b = R.querySelector('[data-dur]'); if (a) a.textContent = fmtTime(p); if (b) b.textContent = '-' + fmtTime(d - p);
  }
  _seek(sec) { this._buzz(); this._hass.callService('media_player', 'media_seek', { entity_id: this._src || this._cfg.apple_tv, seek_position: Math.max(0, Math.round(sec)) }).catch(() => {}); }
  _ctl(k) {
    this._buzz(); const c = this._cfg, sk = +c.skip_seconds || 10, p = this._pos();
    const tgt = this._src || c.apple_tv;
    if (k === 'pp') return this._hass.callService('media_player', 'media_play_pause', { entity_id: tgt });
    if (k === 'stop') return this._hass.callService('media_player', 'media_stop', { entity_id: tgt });
    if (p != null) return this._seek(p + (k === 'fwd' ? sk : -sk));
    const remote = c.remote || c.apple_tv.replace('media_player.', 'remote.');
    this._hass.callService('remote', 'send_command', { entity_id: remote, command: k === 'fwd' ? 'skip_forward' : 'skip_backward' });
  }
}

/* ---------------- visual editor ---------------- */
const sel = opts => ({ select: { mode: 'dropdown', options: opts.map(([value, label]) => ({ value, label })) } });
const toggle = { boolean: {} };
const size4 = sel([['small', 'Small'], ['medium', 'Medium'], ['large', 'Large'], ['extra_large', 'Extra large']]);
const schema = d => {
  const grid = items => ({ type: 'grid', name: '', flatten: true, schema: items });
  const section = (name, title, icon, items) => ({ name, type: 'expandable', flatten: true, title, icon, schema: items });
  return [
    { name: 'room_name', selector: { text: {} } },
    section('g_tv', 'Which TV plays it', 'mdi:television', [
      { name: 'apple_tv', selector: { entity: { filter: { domain: 'media_player' } } } },
      { name: 'remote', selector: { entity: { filter: { domain: 'remote' } } } },
      { name: 'plex_client', selector: { entity: { filter: { domain: 'media_player', integration: 'plex' } } } },
      { name: 'open_script', selector: { entity: { filter: { domain: 'script' } } } },
      { name: 'play_script', selector: { entity: { filter: { domain: 'script' } } } },
      { name: 'browse_entity', selector: { entity: { filter: { domain: 'media_player', integration: 'plex' } } } },
    ]),
    section('g_show', 'What to show', 'mdi:eye-outline', [grid([
      { name: 'show_now_playing', selector: toggle }, { name: 'show_continue', selector: toggle },
      { name: 'show_recent_movies', selector: toggle }, { name: 'show_recent_tv', selector: toggle },
      { name: 'show_library', selector: toggle }, { name: 'show_search', selector: toggle },
    ])]),
    section('g_words', 'Section titles', 'mdi:format-title', [grid([
      { name: 'continue_title', selector: { text: {} } }, { name: 'recent_movies_title', selector: { text: {} } },
      { name: 'recent_tv_title', selector: { text: {} } }, { name: 'library_title', selector: { text: {} } },
    ])]),
    section('g_library', 'Library', 'mdi:filmstrip-box-multiple', [grid([
      { name: 'hide_libraries', selector: { text: { multiple: true } } },
      { name: 'default_library', selector: { text: {} } },
      { name: 'default_sort', selector: sel([['az', 'A → Z'], ['za', 'Z → A'], ['new', 'Newest year'], ['old', 'Oldest year']]) },
      { name: 'row_count', selector: { number: { min: 5, max: 50, step: 5, mode: 'slider' } } },
    ])]),
    section('g_posters', 'Posters', 'mdi:image-multiple-outline', [grid([
      { name: 'poster_size', selector: size4 },
      { name: 'poster_shape', selector: sel([['square', 'Square corners'], ['rounded', 'Rounded'], ['extra_round', 'Extra round']]) },
      { name: 'show_titles', selector: toggle }, { name: 'show_progress', selector: toggle },
    ])]),
    section('g_play', 'When you tap a title', 'mdi:play-circle-outline', [grid([
      { name: 'confirm_play', selector: toggle }, { name: 'show_start_over', selector: toggle },
      { name: 'show_next_episode', selector: toggle },
      { name: 'skip_seconds', selector: sel([['5', '5 seconds'], ['10', '10 seconds'], ['15', '15 seconds'], ['30', '30 seconds']]) },
    ])]),
    section('g_look', 'Look', 'mdi:palette-outline', [grid([
      { name: 'accent_color', selector: { color_rgb: {} } }, { name: 'playing_glow', selector: toggle },
      { name: 'off_background', selector: sel([['theme', 'Clear frosted glass'], ['darker', 'Darker frosted glass'], ['lighter', 'Lighter frosted glass'], ['custom', 'Frosted glass in my own colour']]) },
      ...(d.off_background === 'custom' ? [{ name: 'off_custom_color', selector: { color_rgb: {} } }] : []),
      { name: 'card_spacing', selector: sel([['compact', 'Compact'], ['standard', 'Standard'], ['roomy', 'Roomy']]) },
      { name: 'corners', selector: sel([['square', 'Square'], ['rounded', 'Rounded'], ['extra_round', 'Extra round']]) },
      { name: 'font', selector: sel([['classic', 'Classic'], ['theme', 'Same as Home Assistant'], ['rounded', 'Rounded']]) },
      { name: 'title_size', selector: size4 },
      { name: 'animations', selector: toggle }, { name: 'haptics', selector: toggle },
    ])]),
  ];
};
const LABELS = {
  edit_all: 'Master edit – change all Plex cards at once', reset_style: 'Use the shared style on this card (clear its own changes)',
  room_name: 'Room name (shown on the card)', apple_tv: 'Apple TV', remote: 'Apple TV remote', plex_client: 'Plex app on that Apple TV', open_script: 'Script that turns the TV on (optional)',
  play_script: 'Play script', browse_entity: 'Plex player used to read your library (optional)',
  show_now_playing: 'Now playing', show_continue: 'Continue Watching', show_recent_movies: 'Recently added movies', show_recent_tv: 'Recently added TV', show_library: 'All movies and TV', show_search: 'Search box',
  continue_title: 'Continue Watching title', recent_movies_title: 'Recent movies title', recent_tv_title: 'Recent TV title', library_title: 'Library title',
  hide_libraries: 'Hide these libraries', default_library: 'Library to show first', default_sort: 'Sort order', row_count: 'Titles in each row',
  poster_size: 'Poster size', poster_shape: 'Poster corners', show_titles: 'Names under posters', show_progress: 'Resume badge',
  confirm_play: 'Show a pop-up before playing', show_start_over: 'Start over button', show_next_episode: 'Next episode button', skip_seconds: 'Skip back / forward by',
  accent_color: 'Accent colour', playing_glow: 'Glow while playing', off_background: 'Background', off_custom_color: 'Your background colour',
  card_spacing: 'Spacing inside the card', corners: 'Card corners', font: 'Lettering style', title_size: 'Section title size', animations: 'Gentle animations', haptics: 'Vibrate on press (phones)',
};
const HELPERS = {
  plex_client: 'Lets Plex start the show directly (fastest). Leave empty to use the remote instead.',
  open_script: 'Only runs when the Apple TV is off, e.g. to switch the TV to the Apple TV input.',
  play_script: 'Leave as script.one_stop_plex_play unless you made your own.',
  hide_libraries: 'Type a library name, e.g. Music.',
};

class OneStopPlexCardEditor extends HTMLElement {
  setConfig(config) { this._config = { ...config }; this._render(); }
  set hass(hass) { const first = !this._hass; this._hass = hass; if (first) Shared.get(hass).then(() => this._render()); this._render(); }
  _inherited() { Shared._readCache(); return { ...DEFAULTS, ...((Shared.data || {})[SECTION] || {}) }; }
  _ownStyle() { return Object.keys(this._config || {}).filter(k => !ROOM_KEYS.includes(k)); }
  _emit(cfg) { this._config = cfg; this._render(); this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: cfg }, bubbles: true, composed: true })); }
  _onChange(v) {
    if (!!v.edit_all !== !!this._all) { this._all = !!v.edit_all; this._render(); return; }
    const type = this._config.type || 'custom:' + TAG;
    if (v.reset_style) { const cfg = { type }; for (const k of ROOM_KEYS) if (k in this._config && k !== 'type') cfg[k] = this._config[k]; return this._emit(cfg); }
    const dep = { off_custom_color: v.off_background === 'custom' };
    const clean = {};
    for (const [k, val] of Object.entries(v)) { if (['type', 'edit_all', 'reset_style'].includes(k) || val === '' || val == null || dep[k] === false) continue; clean[k] = val; }
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
    this._note.textContent = this._all ? 'Master edit is on: look changes apply to every Plex card. The TV settings still apply to this card only.'
      : own.length ? `This card has ${own.length} setting${own.length > 1 ? 's' : ''} of its own.` : 'Turn on Master edit to change every Plex card at once.';
    this._form.hass = this._hass;
    this._form.schema = [{ name: 'edit_all', selector: toggle }, ...(!this._all && own.length ? [{ name: 'reset_style', selector: toggle }] : []), ...schema(data)];
    this._form.data = data;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, OneStopPlexCard);
if (!customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, OneStopPlexCardEditor);
window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === TAG)) window.customCards.push({ type: TAG, name: 'One Stop - Plex card', description: 'Continue Watching, Recently Added, Now Playing and your full Plex library with search. Tap a title to resume, start over or play the next episode on this room’s TV.', preview: false });
console.info(`%c ONE STOP %c Plex card ${VERSION} `, 'background:#375374;color:#fff;border-radius:3px 0 0 3px;padding:2px 4px', 'background:#e9eef5;color:#375374;border-radius:0 3px 3px 0;padding:2px 4px');
})();
