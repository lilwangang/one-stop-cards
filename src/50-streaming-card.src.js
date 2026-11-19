/*!
 * One Stop – Streaming card
 * One Stop Smart Homes · standalone Home Assistant dashboard card (no other add-ons needed)
 * Browse and search what's on each streaming service (via JustWatch, by country and plan) and open it on a room's TV.
 */
(() => {
'use strict';
const VERSION = '1.11.1';
const TAG = 'one-stop-streaming-card';
const EDITOR_TAG = TAG + '-editor';
const SECTION = 'streaming', STYLE_DASH = 'one-stop-cards';
const JW = 'https://apis.justwatch.com/graphql', IMG = 'https://images.justwatch.com';

// app = Apple TV app name, pkg = JustWatch package, color = brand colour
const SERVICES = {
  netflix: { name: 'Netflix', app: 'Netflix', pkg: { standard: 'nfx', ads: 'nfa' }, color: [229, 9, 20] },
  disney: { name: 'Disney+', app: 'Disney+', pkg: 'dnp', color: [17, 60, 207] },
  prime: { name: 'Prime Video', app: 'Prime Video', pkg: 'prv', color: [0, 168, 225] },
  crave: { name: 'Crave', app: 'Crave', pkg: 'crv', color: [0, 102, 255] },
  appletv: { name: 'Apple TV', app: 'TV', pkg: 'atp', color: [140, 140, 150] },
  paramount: { name: 'Paramount+', app: 'Paramount+', pkg: 'pmp', color: [0, 100, 255] },
  hayu: { name: 'Hayu', app: 'Hayu', pkg: 'hay', color: [120, 40, 200] },
  youtube: { name: 'YouTube', app: 'YouTube', pkg: null, color: [255, 0, 0] },
  cbc: { name: 'CBC Gem', app: 'CBC Gem', pkg: null, color: [200, 30, 40] },
  telus: { name: 'TELUS TV+', app: 'TELUS TV+', pkg: null, color: [75, 40, 109] },
};
const DEFAULTS = {
  room_name: '', country: 'CA', netflix_plan: 'standard', paramount_plan: 'standard',
  services: ['netflix', 'disney', 'prime', 'crave', 'appletv', 'paramount', 'hayu', 'youtube', 'cbc', 'telus'], default_service: 'netflix',
  show_tabs: true, show_search: true, show_recent: true, show_trending: true, show_shows: true, show_movies: true, show_new: true, row_count: 20,
  poster_size: 'medium', poster_shape: 'rounded', show_titles: true, use_brand_colour: true, confirm_open: true,
  card_spacing: 'standard', corners: 'rounded', font: 'classic', title_size: 'medium', off_background: 'theme', off_custom_color: [40, 44, 52], haptics: true, auto_play: true, netflix_row: 'continue', profile_gate: true,
};
const ROOM_KEYS = ['type', 'room_name', 'apple_tv', 'remote', 'country', 'services', 'netflix_plan', 'paramount_plan', 'default_service'];

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const okRgb = v => Array.isArray(v) && v.length === 3 && v.every(n => Number.isFinite(+n));
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const poster = p => p ? IMG + p.replace('{profile}', 's276').replace('{format}', 'webp') : '';
const big = p => p ? IMG + p.replace('{profile}', 's592').replace('{format}', 'webp') : '';

/* ---------------- JustWatch ---------------- */
const JWQ = {
  cache: new Map(),
  hass: null,
  // Browsers (iOS app, remote URLs) are often refused by JustWatch CORS, so when Home Assistant
  // has rest_command.justwatch_graphql the request goes server-side; direct fetch is the fallback.
  async _viaHass(body) {
    const h = this.hass;
    if (!h?.services?.rest_command?.justwatch_graphql) return null;
    const r = await h.callWS({ type: 'call_service', domain: 'rest_command', service: 'justwatch_graphql', service_data: { body }, return_response: true });
    const res = r?.response || {};
    if (res.status !== 200) throw new Error('Catalogue server returned ' + res.status);
    return typeof res.content === 'string' ? JSON.parse(res.content) : res.content;
  },
  async _direct(body) {
    const r = await fetch(JW, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    return r.json();
  },
  async q(query, variables, ttl = 600000) {
    const k = query + JSON.stringify(variables), hit = this.cache.get(k);
    if (hit && Date.now() - hit.t < ttl) return hit.v;
    const body = JSON.stringify({ query, variables });
    let d, err;
    for (let attempt = 0; attempt < 3 && !d; attempt++) {
      try { d = await this._viaHass(body) || await this._direct(body); }
      catch (e) { err = e; await new Promise(r => setTimeout(r, 400 * (attempt + 1))); }
    }
    if (!d) { if (hit) return hit.v; throw err || new Error('Load failed'); }
    if (d.errors) throw new Error(d.errors[0].message);
    this.cache.set(k, { t: Date.now(), v: d.data }); return d.data;
  },
  F: 'id objectType content(country:$c,language:$l){title originalReleaseYear posterUrl shortDescription runtime genres{shortName} scoring{imdbScore}} offers(country:$c,platform:WEB,filter:{packages:$p}){standardWebURL monetizationType}',
  async list(country, pkg, opts = {}) {
    const n = opts.first || 20;
    const filt = ['packages:$p', opts.type ? `objectTypes:[${opts.type}]` : '', opts.search ? 'searchQuery:$s' : ''].filter(Boolean).join(',');
    const q = `query($c:Country!,$l:Language!,$p:[String!]${opts.search ? ',$s:String!' : ''}){popularTitles(country:$c,first:${n},sortBy:${opts.sort || 'POPULAR'},filter:{${filt}}){edges{node{${this.F}}}}}`;
    const d = await this.q(q, opts.search ? { c: country, l: 'en', p: [pkg], s: opts.search } : { c: country, l: 'en', p: [pkg] });
    return d.popularTitles.edges.map(e => e.node).filter(x => x.offers?.length);
  },
  async fresh(country, pkg, n = 20) {
    const days = [0, 1, 2, 3, 4, 5, 6, 7, 10, 14].map(d => new Date(Date.now() - d * 864e5).toISOString().slice(0, 10)), out = [], seen = new Set();
    for (const date of days) {
      if (out.length >= n) break;
      const q = `query($c:Country!,$l:Language!,$p:[String!]){newTitles(country:$c,first:30,date:"${date}",filter:{packages:$p}){edges{node{... on MovieOrSeason{${this.F} ... on Season{show{id objectType content(country:$c,language:$l){title posterUrl originalReleaseYear shortDescription}}}}}}}}`;
      let d; try { d = await this.q(q, { c: country, l: 'en', p: [pkg] }); } catch (e) { continue; }
      for (const e of d.newTitles.edges) {
        let x = e.node; if (!x?.offers?.length) continue;
        if (x.objectType === 'SHOW_SEASON' && x.show) x = { ...x, objectType: 'SHOW', id: x.show.id, content: { ...x.show.content, seasonLabel: x.content.title } };
        if (seen.has(x.id)) continue; seen.add(x.id); out.push(x);
      }
    }
    return out.slice(0, n);
  },
};

/* ---------------- shared house style ---------------- */
const Shared = {
  data: null, loading: null, listeners: new Set(),
  _cache() { try { localStorage.setItem('one-stop-cards-style', JSON.stringify(this.data || {})); } catch (e) {} },
  _readCache() { if (!this.data) { try { const c = JSON.parse(localStorage.getItem('one-stop-cards-style') || 'null'); if (c) this.data = c; } catch (e) {} } },
  get(hass) {
    this._readCache();
    if (!this.loading) this.loading = (async () => { let d = {}; try { d = (await hass.callWS({ type: 'lovelace/config', url_path: STYLE_DASH, force: true }))?.one_stop || {}; } catch (e) {}
      const ch = !same(d, this.data); this.data = d; this._cache(); if (ch) this.listeners.forEach(fn => fn(d)); return d; })();
    return this.loading;
  },
  async save(hass, values) {
    const list = await hass.callWS({ type: 'lovelace/dashboards/list' });
    if (!list.some(d => d.url_path === STYLE_DASH)) await hass.callWS({ type: 'lovelace/dashboards/create', url_path: STYLE_DASH, title: 'One Stop Cards', icon: 'mdi:palette-swatch-outline', show_in_sidebar: false, require_admin: false, mode: 'storage' });
    let cfg; try { cfg = await hass.callWS({ type: 'lovelace/config', url_path: STYLE_DASH, force: true }); } catch (e) { cfg = null; }
    cfg = cfg && cfg.views ? cfg : { views: [{ title: 'One Stop Cards', cards: [{ type: 'markdown', content: '## One Stop Cards' }] }] };
    cfg.one_stop = { ...(cfg.one_stop || {}), [SECTION]: values };
    await hass.callWS({ type: 'lovelace/config/save', url_path: STYLE_DASH, config: cfg });
    this.data = cfg.one_stop; this._cache(); this.listeners.forEach(fn => fn(this.data));
  },
};

/* ---------------- recently played ----------------
 * Two sources, merged newest first:
 *  1. Titles opened from any Streaming card (saved for the whole home on the hidden One Stop Cards dashboard).
 *  2. What the home's Apple TVs reported playing in each app (Home Assistant history). Apps that don't
 *     report titles (Netflix) only show up through source 1.
 */
// Services whose own account history can be connected (via One Stop streaming history + Sign-in Helper)
const ACCT = {
  netflix: { name: 'Netflix', icon: 'mdi:netflix', step: 'email', color: '229,9,20', go: 'Send me a code', lead: 'Sign in once and Recently played shows each profile’s history from every device.' },
  disney: { name: 'Disney+', icon: 'mdi:play-circle-outline', step: 'disney', color: '17,60,207', go: 'Continue', lead: 'Sign in once and Recently played shows what each profile is in the middle of watching, on any device.' },
};
const RECENT_MAX = 30, RECENT_LS = 'one-stop-streaming-recent';
const Recent = {
  local() { try { return JSON.parse(localStorage.getItem(RECENT_LS) || '{}') || {}; } catch (e) { return {}; } },
  saved(svc) { const a = ((Shared.data || {}).recent || {})[svc] || [], b = this.local()[svc] || [], m = new Map();
    for (const x of [...a, ...b]) { const k = x.id || x.t; if (!m.has(k) || m.get(k).ts < x.ts) m.set(k, x); } return [...m.values()]; },
  async add(hass, svc, item) {
    const l = this.local(); l[svc] = [item, ...(l[svc] || []).filter(x => (x.id || x.t) !== (item.id || item.t))].slice(0, RECENT_MAX);
    try { localStorage.setItem(RECENT_LS, JSON.stringify(l)); } catch (e) {}
    try {
      let cfg; try { cfg = await hass.callWS({ type: 'lovelace/config', url_path: STYLE_DASH, force: true }); } catch (e) { cfg = null; }
      if (!cfg || !cfg.views) { await Shared.save(hass, ((Shared.data || {})[SECTION]) || {}); cfg = await hass.callWS({ type: 'lovelace/config', url_path: STYLE_DASH, force: true }); }
      const os = cfg.one_stop = cfg.one_stop || {}, r = os.recent = os.recent || {};
      r[svc] = [item, ...(r[svc] || []).filter(x => (x.id || x.t) !== (item.id || item.t))].slice(0, RECENT_MAX);
      await hass.callWS({ type: 'lovelace/config/save', url_path: STYLE_DASH, config: cfg });
      Shared.data = { ...(Shared.data || {}), recent: r }; Shared._cache();
    } catch (e) { /* not an admin or offline: this device still remembers it */ }
  },
  _hist: null, _histT: 0,
  async tv(hass) {                                   // [{app, t, ts, room}] newest first, cached 2 min
    if (this._hist && Date.now() - this._histT < 120000) return this._hist;
    const ids = Object.keys(hass.states).filter(e => e.startsWith('media_player.') && hass.entities?.[e]?.platform === 'apple_tv');
    if (!ids.length) return [];
    const start = new Date(Date.now() - 30 * 864e5).toISOString();
    const r = await hass.callWS({ type: 'history/history_during_period', start_time: start, entity_ids: ids, minimal_response: false, no_attributes: false, significant_changes_only: false });
    const out = [];
    for (const [id, rows] of Object.entries(r || {})) {
      const room = hass.states[id]?.attributes?.friendly_name || '';
      for (const x of rows) {
        const a = x.a || x.attributes || {}, st = x.s ?? x.state, t = a.media_series_title || a.media_title;
        if (!t || !['playing', 'paused'].includes(st) || /^loading/i.test(t)) continue;
        out.push({ app: a.app_name || a.app_id || '', t: String(t), ep: a.media_series_title ? a.media_title : '', ts: Math.round(1000 * (x.lu ?? (Date.parse(x.last_updated || x.last_changed) / 1000))), room });
      }
    }
    out.sort((a, b) => b.ts - a.ts); this._hist = out; this._histT = Date.now(); return out;
  },
  _acc: {}, prof: {}, act: {}, conn: {},
  pKey(svc) { return `one-stop-${svc}-profile`; },
  profileOf(svc) { try { return localStorage.getItem(this.pKey(svc)) || ''; } catch (e) { return ''; } },
  setProfile(svc, g) { try { localStorage.setItem(this.pKey(svc), g); } catch (e) {} },
  forget(svc) { for (const k of Object.keys(this._acc)) if (k.startsWith(svc + '|')) delete this._acc[k]; delete this.conn[svc]; },
  _ls() { try { return JSON.parse(localStorage.getItem('one-stop-acct-cache') || '{}') || {}; } catch (e) { return {}; } },
  _lsPut(k, v) { try { const c = this._ls(); c[k] = v; localStorage.setItem('one-stop-acct-cache', JSON.stringify(c)); } catch (e) {} },
  cached(svc, kind) {                               // last list this phone saw for the chosen profile (instant paint)
    const c = this._ls(), want = this.profileOf(svc), p = c['p|' + svc];
    if (p && !this.prof[svc]?.length) { this.prof[svc] = p.profiles || []; this.act[svc] = this.act[svc] || p.active; this.conn[svc] = true; }
    const hit = c[svc + '|' + (want || (p && p.active) || '') + '|' + kind]; return hit ? hit.v : null;
  },
  profilesOf(svc) { if (!this.prof[svc]?.length) this.cached(svc, 'continue'); return this.prof[svc] || []; },
  async account(hass, svc, kind = 'history', prof) {                   // the service's own account history (null = not connected)
    if (!ACCT[svc] || !hass?.services?.one_stop_netflix?.get_history) { this.conn[svc] = false; return null; }
    const want = prof ?? this.profileOf(svc), key = svc + '|' + want + '|' + kind, hit = this._acc[key];
    if (hit && Date.now() - hit.t < 60000) return hit.v;
    const data = { limit: 40, service: svc, kind }; if (want) data.profile = want;
    const r = await hass.callWS({ type: 'call_service', domain: 'one_stop_netflix', service: 'get_history', service_data: data, return_response: true });
    const res = r?.response || {};
    if (res.connected === false) { this.conn[svc] = false; return null; }
    this.conn[svc] = true; this.prof[svc] = res.profiles || []; if (prof === undefined) this.act[svc] = res.profile || want;
    const v = (res.items || []).map(x => ({ ...x, src: 'acct', room: '' }));
    this._acc[key] = { t: Date.now(), v };
    this._lsPut('p|' + svc, { profiles: this.prof[svc], active: this.act[svc] || res.profile });
    this._lsPut(svc + '|' + (want || res.profile || '') + '|' + kind, { t: Date.now(), v: v.slice(0, 40) });
    return v;
  },
  _match: new Map(),
  async resolve(cc, pkg, title) {                   // find the JustWatch title for something the TV reported
    const k = cc + pkg + title.toLowerCase(); if (this._match.has(k)) return this._match.get(k);
    let hit = null;
    try { const l = await JWQ.list(cc, pkg, { search: title, first: 5 }), n = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      hit = l.find(x => n(x.content?.title) === n(title)) || null; } catch (e) {}
    this._match.set(k, hit); return hit;
  },
};
const ago = ts => { const m = Math.round((Date.now() - ts) / 60000); if (m < 60) return m <= 1 ? 'Just now' : `${m} min ago`; const h = Math.round(m / 60); if (h < 24) return `${h} h ago`; const d = Math.round(h / 24); return d === 1 ? 'Yesterday' : `${d} days ago`; };

/* ---------------- styles ---------------- */
const CSS = `
:host{display:block;--ac:229,9,20}
ha-card{position:relative;box-sizing:border-box;padding:var(--pad,18px);border-radius:var(--radius,22px);color:#f7f9fc;font-family:var(--font);container:oss/inline-size;
  background:linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.015)),var(--off-bg);border:1px solid rgba(255,255,255,.12);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 10px 24px rgba(0,0,0,.10);backdrop-filter:blur(18px) saturate(1.1);-webkit-backdrop-filter:blur(18px) saturate(1.1);-webkit-tap-highlight-color:transparent}
ha-card.brand{background:linear-gradient(145deg,rgba(255,255,255,.1),rgba(255,255,255,.02)),linear-gradient(rgba(var(--ac),.16),rgba(var(--ac),.04) 40%,transparent),var(--off-bg);border-color:rgba(var(--ac),.3)}
button{all:unset;box-sizing:border-box;cursor:pointer;-webkit-tap-highlight-color:transparent}
button:focus-visible{outline:2px solid #fff;outline-offset:2px}
button:active:not([disabled]){transform:scale(.96)} button[disabled]{opacity:.4;cursor:default}
.hide{display:none!important}
.tabs{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin-bottom:14px}
.tabs::-webkit-scrollbar{display:none}
.tab{flex:none;height:42px;padding:0 16px;border-radius:999px;display:flex;align-items:center;font-weight:650;font-size:14px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16);white-space:nowrap}
.tab.on{background:rgba(var(--tc),.85);border-color:rgba(var(--tc),1);color:#fff}
.hero{display:flex;align-items:center;gap:12px;margin-bottom:14px}
.hero h1{margin:0;font-size:calc(var(--title,20px) + 6px);font-weight:750;letter-spacing:-.5px;flex:1;min-width:0}
.hero .sub{font-size:13px;opacity:.7;font-weight:500;letter-spacing:0;display:block;margin-top:2px}
.openapp{flex:none;height:44px;padding:0 16px;border-radius:14px;display:flex;align-items:center;gap:6px;font-weight:650;font-size:15px;background:rgba(var(--ac),.85);border:1px solid rgba(var(--ac),1)}
.openapp ha-icon{--mdc-icon-size:20px}
.search{display:flex;align-items:center;gap:8px;height:46px;padding:0 14px;border-radius:14px;background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.14);margin-bottom:6px}
.search ha-icon{--mdc-icon-size:20px;opacity:.7}
.search input{all:unset;flex:1;min-width:0;font-size:16px;color:#f7f9fc}
.search input::placeholder{color:rgba(235,241,248,.55)}
.sec{margin-top:18px}
.sh{display:flex;align-items:center;gap:10px;margin:0 0 10px}
.sh h2{margin:0;font-size:var(--title,20px);font-weight:650;letter-spacing:-.3px}
.sh .ct{margin-left:auto;font-size:13px;opacity:.65}
.row{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x proximity;padding:2px 2px 8px;margin:0 -2px;scrollbar-width:thin;-webkit-overflow-scrolling:touch}
.row::-webkit-scrollbar{height:6px}.row::-webkit-scrollbar-thumb{background:rgba(255,255,255,.2);border-radius:3px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(calc(var(--pw,128px) * .8),1fr));gap:14px 10px}
.it{flex:none;width:var(--pw,128px);scroll-snap-align:start;text-align:left;display:flex;flex-direction:column;gap:6px;min-width:0}
.grid .it{width:auto}
.ph{position:relative;width:100%;aspect-ratio:2/3;border-radius:var(--pr,12px);overflow:hidden;background:rgba(255,255,255,.08);box-shadow:0 4px 12px rgba(0,0,0,.3)}
.ph img{width:100%;height:100%;object-fit:cover;display:block}
.ph .fb{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:8px;text-align:center;font-size:13px;font-weight:600;opacity:.8}
.ph .badge{position:absolute;top:6px;left:6px;padding:2px 7px;border-radius:999px;font-size:11px;font-weight:700;background:rgba(0,0,0,.6)}
.it .nm{font-size:14px;font-weight:600;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.it .sb{font-size:12px;opacity:.7;margin-top:-4px}
.notitles .it .nm,.notitles .it .sb{display:none}
.empty{font-size:14px;opacity:.7;padding:6px 0}
.apponly{display:flex;flex-direction:column;align-items:center;gap:14px;padding:28px 10px;text-align:center;font-size:15px;opacity:.9}
.apponly .openapp{height:56px;padding:0 26px;font-size:17px}
.pop{position:fixed;inset:0;z-index:10;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
@media (min-width:700px){.pop{align-items:center}}
.sheet{width:min(560px,100%);max-height:88vh;overflow:auto;box-sizing:border-box;padding:18px;border-radius:24px 24px 0 0;background:rgba(30,33,40,.97);border:1px solid rgba(255,255,255,.12);box-shadow:0 -10px 40px rgba(0,0,0,.5)}
@media (min-width:700px){.sheet{border-radius:24px}}
.sheet .top{display:grid;grid-template-columns:120px minmax(0,1fr);gap:14px;align-items:start}
.sheet h3{margin:0;font-size:21px;line-height:1.2}
.sheet .meta{font-size:13px;opacity:.75;margin-top:4px}
.sheet .desc{font-size:14px;line-height:1.45;opacity:.85;margin-top:12px}
.sheet .room{display:inline-flex;align-items:center;gap:6px;margin-top:10px;font-size:13px;font-weight:600;padding:4px 10px;border-radius:999px;background:rgba(var(--ac),.2);border:1px solid rgba(var(--ac),.55)}
.sheet .room ha-icon{--mdc-icon-size:16px}
.acts{display:flex;flex-direction:column;gap:8px;margin-top:16px}
.act{height:56px;border-radius:16px;display:flex;align-items:center;gap:12px;padding:0 16px;font-weight:650;font-size:16px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18)}
.act.main{background:rgba(var(--ac),.75);border-color:rgba(var(--ac),1)}
.act ha-icon{--mdc-icon-size:26px}
.act small{margin-left:auto;font-weight:500;opacity:.75;font-size:13px}
.close{width:100%;height:48px;margin-top:10px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-weight:600;opacity:.8}
.toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:11;padding:12px 18px;border-radius:14px;background:rgba(20,22,28,.95);border:1px solid rgba(var(--ac),.6);font-weight:600;font-size:15px;box-shadow:0 8px 24px rgba(0,0,0,.4);max-width:90vw;text-align:center}
.sz-small{--pw:104px}.sz-medium{--pw:128px}.sz-large{--pw:156px}.sz-extra_large{--pw:188px}
@container oss (max-width:420px){.sz-medium{--pw:112px}.sz-large{--pw:136px}}
.np{display:flex;align-items:center;gap:12px;margin:-4px 0 14px;padding:12px 14px;border-radius:16px;background:rgba(229,9,20,.14);border:1px solid rgba(229,9,20,.4)}.np b{display:block;font-size:17px;line-height:1.25}.np small{display:block;font-size:12.5px;opacity:.75}
.np .dot{width:10px;height:10px;border-radius:50%;background:#e50914;flex:none;box-shadow:0 0 0 0 rgba(229,9,20,.6);animation:npd 1.6s infinite}@keyframes npd{70%{box-shadow:0 0 0 8px rgba(229,9,20,0)}100%{box-shadow:0 0 0 0 rgba(229,9,20,0)}}
.nfp{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin:0 0 12px}.nfp::-webkit-scrollbar{display:none}
.nfp button{flex:none;height:40px;padding:0 14px 0 6px;border-radius:999px;display:flex;align-items:center;gap:8px;font-weight:600;font-size:14px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16)}
.nfp button span{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-size:13px;font-weight:700;background:rgba(255,255,255,.15)}
.nfp button.on{background:rgba(var(--ac),.85);border-color:rgb(var(--ac))}.nfp button.on span{background:rgba(0,0,0,.25)}
.nfc{--bc:229,9,20;margin:0 0 12px;padding:14px;border-radius:16px;background:rgba(var(--bc),.12);border:1px solid rgba(var(--bc),.5);display:flex;flex-direction:column;gap:10px}
.nfc .r{display:flex;align-items:center;gap:10px}.nfc .r ha-icon{color:rgb(var(--bc));--mdc-icon-size:26px;flex:none}
.nfc b{font-size:15px}.nfc p{margin:0;font-size:13px;opacity:.8;line-height:1.4}
.nfc input{all:unset;box-sizing:border-box;width:100%;height:48px;padding:0 14px;border-radius:12px;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.2);font-size:17px;color:#fff}
.nfc input.code{letter-spacing:6px;text-align:center;font-size:22px}
.nfc .go{height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:8px;font-weight:650;font-size:16px;background:rgb(var(--bc));color:#fff}
.nfc .lnk{font-size:13px;opacity:.75;text-align:center;padding:4px}
.nfc .err{font-size:13px;color:#ffb4b4}.nfc .pf{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px}
.nfc .pf button{height:48px;border-radius:12px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-weight:600}
.gate{display:flex;flex-direction:column;align-items:center;padding:18px 4px 26px;animation:gfade .25s ease-out}
@keyframes gfade{from{opacity:0;transform:scale(.98)}to{opacity:1;transform:none}}
.gate .nlogo{font:900 30px/1 'Bebas Neue',Impact,'Arial Black',sans-serif;letter-spacing:1px;color:#e50914;margin-bottom:22px}
.gate h2{margin:0 0 22px;font-size:22px;font-weight:600;letter-spacing:-.2px}
.gate .pg{display:grid;grid-template-columns:repeat(2,minmax(0,128px));gap:22px 26px;justify-content:center}
@container oss (min-width:560px){.gate .pg{grid-template-columns:repeat(auto-fit,minmax(0,128px))}}
.gate .pf{display:flex;flex-direction:column;align-items:center;gap:10px;font-size:15px;font-weight:500;opacity:.92}
.gate .av{width:112px;height:112px;border-radius:10px;overflow:hidden;display:grid;place-items:center;font-size:46px;font-weight:800;color:#fff;box-shadow:0 6px 18px rgba(0,0,0,.35);border:2px solid transparent;transition:border-color .15s,transform .15s}
.gate .av img{width:100%;height:100%;object-fit:cover;display:block}
.gate .pf:hover .av,.gate .pf:focus-visible .av{border-color:#fff}
.gate .pf:active .av{transform:scale(.95)}
.gate .pf.last .av{border-color:rgba(255,255,255,.55)}
.who{flex:none;width:44px;height:44px;border-radius:8px;overflow:hidden;display:grid;place-items:center;font-weight:800;font-size:18px;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.35)}
.who img{width:100%;height:100%;object-fit:cover}
.spin{width:18px;height:18px;border-radius:50%;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;animation:sp 1s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
`;

const nowPlayingFor = (hass, ids) => {        // One Stop 'now playing' sensors (Netflix etc. on an Apple TV in the same device/room)
  if (!hass) return null;
  const dev = id => hass.entities?.[id]?.device_id;
  const want = new Set(ids.filter(Boolean)), devs = new Set([...want].map(dev).filter(Boolean));
  for (const st of Object.values(hass.states)) {
    const a = st.attributes; if (!a?.one_stop_now_playing || !st.state || ['unknown', 'unavailable', ''].includes(st.state)) continue;
    if (want.has(a.media_player) || devs.has(dev(a.media_player))) return { title: st.state, ep: a.episode, profile: a.profile, service: a.service, sure: a.confidence === 'confirmed' };
  }
  return null;
};
/* ---------------- the card ---------------- */
class OneStopStreamingCard extends HTMLElement {
  static getConfigElement() { return document.createElement(EDITOR_TAG); }
  static getStubConfig(hass) { const atv = Object.keys(hass?.states || {}).find(e => e.startsWith('media_player.') && hass.entities?.[e]?.platform === 'apple_tv'); return { apple_tv: atv, remote: atv ? atv.replace('media_player.', 'remote.') : undefined }; }
  setConfig(config) { if (!config) throw new Error('Invalid configuration'); if (this._gate === undefined) this._gate = true; this._raw = { ...config }; this._merge(); if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._built = false; if (this._hass) this._build(); }
  _merge() { Shared._readCache(); this._cfg = { ...DEFAULTS, ...((Shared.data || {})[SECTION] || {}), ...this._raw }; }
  _gateOn() { return this._svc === 'netflix' && this._cfg.profile_gate !== false && Recent.profilesOf('netflix').length > 1; }
  _arm() { this._gate = true; if (this._built && this._gateOn()) this._build(); }
  connectedCallback() {
    if (!this._io && window.IntersectionObserver) {      // show "Who's watching?" each time the card is opened, like the Netflix app
      this._io = new IntersectionObserver(es => { for (const e of es) { if (e.isIntersecting) { if (this._hiddenAt && Date.now() - this._hiddenAt > 20000) this._arm(); this._hiddenAt = 0; } else if (!this._hiddenAt) this._hiddenAt = Date.now(); } });
      this._io.observe(this);
    }
    if (this._wasOff) this._arm(); this._wasOff = false;
    this._onShared = () => { this._merge(); this._built = false; if (this._hass) this._build(); }; Shared.listeners.add(this._onShared);
    this._onLoc = () => { const s = this._urlService(); if (s && s !== this._svc) { this._svc = s; this._q = ''; if (this._hass) this._build(); } };
    window.addEventListener('location-changed', this._onLoc); window.addEventListener('popstate', this._onLoc);
  }
  disconnectedCallback() { this._wasOff = true; Shared.listeners.delete(this._onShared); window.removeEventListener('location-changed', this._onLoc); window.removeEventListener('popstate', this._onLoc); }
  set hass(hass) { const first = !this._hass; this._hass = hass; JWQ.hass = hass; if (first) Shared.get(hass); if (!this._built) this._build(); else this._np(); }
  _np() {                                          // 'Now playing on <room>' for apps that don't tell the TV (Netflix)
    const card = this.shadowRoot?.querySelector('ha-card'), hero = card?.querySelector('.hero'); if (!hero) return;
    const np = nowPlayingFor(this._hass, [this._cfg.apple_tv, this._cfg.remote]);
    let el = card.querySelector('.np');
    if (!np) { el?.remove(); return; }
    if (!el) { el = document.createElement('div'); el.className = 'np'; hero.after(el); }
    const key = JSON.stringify(np); if (el.dataset.k === key) return; el.dataset.k = key;
    el.innerHTML = `<span class="dot"></span><div><small>Now playing on ${esc(this._cfg.room_name || 'the TV')}${np.service === 'netflix' ? ' · Netflix' : ''}</small><b>${esc(np.title)}</b>${np.ep || np.profile ? `<small>${esc([np.ep, np.profile ? (np.sure ? '' : 'probably ') + np.profile + '’s profile' : ''].filter(Boolean).join(' · '))}</small>` : ''}</div>`;
  }
  getCardSize() { return 12; }
  getGridOptions() { return { columns: 12, rows: 'auto', min_columns: 12 }; }
  _urlService() { const s = new URLSearchParams(location.search).get('service'); return s && SERVICES[s] ? s : null; }
  _services() { return (this._cfg.services || []).filter(s => SERVICES[s]); }
  _pkg(s) { const p = SERVICES[s].pkg; if (!p) return null; if (s === 'netflix') return p[this._cfg.netflix_plan === 'ads' ? 'ads' : 'standard']; if (s === 'paramount') return this._cfg.paramount_plan === 'premium' ? 'ppp' : this._cfg.paramount_plan === 'ads' ? 'pba' : 'pmp'; return p; }
  _buzz() { if (this._cfg.haptics) { try { navigator.vibrate?.(12); } catch (e) {} } }
  _toast(msg) { const R = this.shadowRoot; R.querySelector('.toast')?.remove(); const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; R.appendChild(t); clearTimeout(this._tt); this._tt = setTimeout(() => t.remove(), 3500); }

  _build() {
    const c = this._cfg, R = this.shadowRoot; if (!R || !this._hass) return;
    if (!c.apple_tv) { R.innerHTML = `<style>${CSS}</style><ha-card>Pick the Apple TV in the card editor.</ha-card>`; return; }
    const list = this._services(); if (!list.length) { R.innerHTML = `<style>${CSS}</style><ha-card>Pick at least one service in the card editor.</ha-card>`; return; }
    this._svc = this._svc && list.includes(this._svc) ? this._svc : (this._urlService() && list.includes(this._urlService()) ? this._urlService() : (list.includes(c.default_service) ? c.default_service : list[0]));
    const S = SERVICES[this._svc], col = S.color;
    const font = { classic: 'Arial,Helvetica,sans-serif', theme: 'var(--ha-font-family-body,var(--paper-font-body1_-_font-family,Roboto,sans-serif))', rounded: "ui-rounded,'SF Pro Rounded','Nunito','Varela Round',system-ui,sans-serif" }[c.font] || 'Arial,Helvetica,sans-serif';
    const offBg = { theme: 'var(--bubble-button-main-background-color,var(--bubble-main-background-color,var(--background-color-2,var(--ha-card-background,var(--card-background-color,var(--secondary-background-color))))))', darker: 'rgba(14,16,21,.50)', lighter: 'rgba(120,128,142,.30)', custom: okRgb(c.off_custom_color) ? rgba(c.off_custom_color, .55) : 'var(--secondary-background-color)' }[c.off_background] || 'var(--secondary-background-color)';
    const vars = [`--ac:${col.join(',')}`, `--pad:${{ compact: 12, standard: 18, roomy: 24 }[c.card_spacing] || 18}px`, `--radius:${{ square: '8px', rounded: '22px', extra_round: '32px' }[c.corners] || '22px'}`,
      `--font:${font}`, `--off-bg:${offBg}`, `--title:${{ small: '16px', medium: '20px', large: '24px', extra_large: '28px' }[c.title_size] || '20px'}`, `--pr:${{ square: '4px', rounded: '12px', extra_round: '20px' }[c.poster_shape] || '12px'}`].join(';');
    const pkg = this._pkg(this._svc), room = c.room_name || this._hass.states[c.apple_tv]?.attributes?.friendly_name || 'TV';
    const planWord = this._svc === 'netflix' ? ({ ads: 'Standard with Ads plan', premium: 'Premium plan' }[c.netflix_plan] || 'Standard plan') : '';
    const tabs = c.show_tabs && list.length > 1 ? `<div class="tabs">${list.map(s => `<button class="tab ${s === this._svc ? 'on' : ''}" data-svc="${s}" style="--tc:${SERVICES[s].color.join(',')}">${esc(SERVICES[s].name)}</button>`).join('')}</div>` : '';
    const sec = (k, t) => `<div class="sec" data-sec="${k}"><div class="sh"><h2>${esc(t)}</h2><span class="ct" data-ct></span></div><div data-body><div class="empty">Loading…</div></div></div>`;
    const body = !pkg
      ? `${c.show_recent ? sec('recent', 'Recently played') : ''}<div class="apponly">${esc(S.name)} doesn’t share its catalogue, so it opens straight in the app.<button class="openapp" data-open><ha-icon icon="mdi:open-in-app"></ha-icon>Open ${esc(S.name)} on ${esc(room)}</button></div>`
      : `${c.show_search ? `<label class="search"><ha-icon icon="mdi:magnify"></ha-icon><input type="search" placeholder="Search ${esc(S.name)}" data-q enterkeyhint="search" value="${esc(this._q || '')}"></label>` : ''}
        <div data-results class="hide">${sec('results', 'Results')}</div>
        <div data-rows>${c.show_recent ? sec('recent', 'Recently played') : ''}${c.show_trending ? sec('trending', `Trending on ${S.name}`) : ''}${c.show_new ? sec('new', `New on ${S.name}`) : ''}${c.show_shows ? sec('shows', 'Popular shows') : ''}${c.show_movies ? sec('movies', 'Popular movies') : ''}</div>`;
    if (this._gate && this._gateOn()) return this._buildGate(vars, tabs);
    this._gate = false;
    const who = this._svc === 'netflix' && this._gateOn() ? this._whoBtn() : '';
    R.innerHTML = `<style>${CSS}</style><ha-card class="sz-${esc(c.poster_size)} ${c.show_titles ? '' : 'notitles'} ${c.use_brand_colour ? 'brand' : ''}" style="${vars}">${tabs}
      <div class="hero"><h1>${esc(S.name)}<span class="sub">${esc([room, planWord].filter(Boolean).join(' · '))}</span></h1>${who}${pkg ? `<button class="openapp" data-open><ha-icon icon="mdi:open-in-app"></ha-icon>Open app</button>` : ''}</div>${body}</ha-card>`;
    this._built = true;
    this._np();
    R.querySelectorAll('[data-svc]').forEach(b => b.addEventListener('click', () => { this._buzz(); this._svc = b.dataset.svc; this._q = ''; this._build(); }));
    R.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => this._openApp()));
    R.querySelector('[data-who]')?.addEventListener('click', () => { this._buzz(); this._gate = true; this._build(); });
    const q = R.querySelector('[data-q]'); if (q) q.addEventListener('input', () => { clearTimeout(this._qt); this._qt = setTimeout(() => { this._q = q.value.trim(); this._search(); }, 350); });
    if (pkg) { this._loadRows(pkg); if (this._q) this._search(); } else if (c.show_recent) this._loadRecent(null);
  }
  _avatar(p, i) {
    const cols = ['229,9,20', '0,113,235', '230,176,0', '0,160,90', '140,60,210'];
    return p.avatar ? `<img src="${esc(p.avatar)}" alt="" referrerpolicy="no-referrer" data-fb="${esc((p.name || '?')[0].toUpperCase())}">` : `<span style="display:contents">${esc((p.name || '?')[0].toUpperCase())}</span>`;
  }
  _avBg(i) { return ['rgb(229,9,20)', 'rgb(0,113,235)', 'rgb(230,176,0)', 'rgb(0,160,90)', 'rgb(140,60,210)'][i % 5]; }
  _whoBtn() {
    const ps = Recent.profilesOf('netflix'), on = Recent.profileOf('netflix') || Recent.act.netflix, i = Math.max(0, ps.findIndex(p => p.guid === on)), p = ps[i] || {};
    return `<button class="who" data-who aria-label="Switch profile (${esc(p.name || '')})" title="Switch profile" style="background:${this._avBg(i)}">${this._avatar(p, i)}</button>`;
  }
  _buildGate(vars, tabs) {
    const R = this.shadowRoot, c = this._cfg, ps = Recent.profilesOf('netflix'), last = Recent.profileOf('netflix') || Recent.act.netflix;
    R.innerHTML = `<style>${CSS}</style><ha-card class="${c.use_brand_colour ? 'brand' : ''}" style="${vars}">${tabs}<div class="gate"><div class="nlogo">NETFLIX</div><h2>Who’s watching?</h2>
      <div class="pg">${ps.map((p, i) => `<button class="pf ${p.guid === last ? 'last' : ''}" data-pg="${esc(p.guid)}"><span class="av" style="background:${this._avBg(i)}">${this._avatar(p, i)}</span>${esc(p.name)}</button>`).join('')}</div></div></ha-card>`;
    this._built = true;
    R.querySelectorAll('[data-svc]').forEach(b => b.addEventListener('click', () => { this._buzz(); this._svc = b.dataset.svc; this._q = ''; this._build(); }));
    R.querySelectorAll('img[data-fb]').forEach(im => im.addEventListener('error', () => { const s = document.createElement('span'); s.textContent = im.dataset.fb; im.replaceWith(s); }, { once: true }));
    R.querySelectorAll('[data-pg]').forEach(b => b.addEventListener('click', () => {
      this._buzz(); const g = b.dataset.pg;
      if (g !== (Recent.profileOf('netflix') || Recent.act.netflix)) { Recent.setProfile('netflix', g); this._recentKey = null; }
      this._gate = false; this._build();
    }));
    // warm every profile's row while they choose
    if (!this._warmed && this._hass) { this._warmed = true; const kind = this._cfg.netflix_row !== 'history' ? 'continue' : 'history';
      (async () => { for (const p of ps) { try { await Recent.account(this._hass, 'netflix', kind, p.guid); } catch (e) {} } })(); }
  }
  async _loadRows(pkg) {
    const c = this._cfg, n = +c.row_count || 20, cc = c.country || 'CA', svc = this._svc;
    const fill = (k, p) => p.then(l => { if (this._svc === svc) this._fill(k, l); }).catch(e => { if (this._svc === svc) this._fill(k, null, e); });
    if (c.show_recent) this._loadRecent(pkg);
    if (c.show_trending) fill('trending', JWQ.list(cc, pkg, { sort: 'TRENDING', first: n }));
    if (c.show_new) fill('new', JWQ.fresh(cc, pkg, n));
    if (c.show_shows) fill('shows', JWQ.list(cc, pkg, { type: 'SHOW', first: n }));
    if (c.show_movies) fill('movies', JWQ.list(cc, pkg, { type: 'MOVIE', first: n }));
  }
  _recentTitle(t) { const h = this.shadowRoot?.querySelector('[data-sec="recent"] h2'); if (h && h.textContent !== t) h.textContent = t; }
  async _loadRecent(pkg) {
    const svc = this._svc, S = SERVICES[svc], cc = this._cfg.country || 'CA', n = +this._cfg.row_count || 20;
    const paint = list => { if (this._svc !== svc) return; const k = JSON.stringify(list.map(x => [x.t, x.ep, x.p, x.img, x.progress])); if (k === this._recentKey && this.shadowRoot.querySelector('[data-sec="recent"] [data-ri]')) return; this._recentKey = k; this._fillRecent(list); };
    let saved = Recent.saved(svc).map(x => ({ ...x, src: 'card' }));
    let tv = null;
    const kind = svc === 'netflix' && this._cfg.netflix_row !== 'history' ? 'continue' : 'history';
    if (ACCT[svc]) {
      const quick = Recent.cached(svc, kind);
      if (quick) { if (kind === 'continue') this._recentTitle('Continue watching'); paint(quick.slice(0, n)); }
      try { tv = await Recent.account(this._hass, svc, kind); if (tv && kind === 'continue') this._recentTitle('Continue watching'); } catch (e) { this._nfErr = e.message || String(e); }
      if (tv && !tv.length && kind === 'continue') { try { const h = await Recent.account(this._hass, svc, 'history'); if (h?.length) { tv = h; this._recentTitle('Recently watched'); } } catch (e) {} }   // e.g. Kids profiles have no Continue watching row
      if (!tv && quick) return;
    }
    if (tv) saved = [];                   // connected: show exactly what the chosen profile watched
    else {
      paint(saved.sort((a, b) => b.ts - a.ts).slice(0, n));
      try { tv = (await Recent.tv(this._hass)).filter(x => x.app === S.app); } catch (e) { tv = []; }
    }
    const seen = new Set(saved.map(x => (x.t || '').toLowerCase())), fromTv = [];
    for (const x of tv) { const k = x.t.toLowerCase(); if (seen.has(k)) { const s = saved.find(y => (y.t || '').toLowerCase() === k); if (s && x.ts > s.ts) s.ts = x.ts; continue; } seen.add(k); fromTv.push({ t: x.t, ep: x.ep, ts: x.ts, room: x.room, url: x.url, progress: x.progress, img: x.image, nodate: x.nodate, src: 'tv' }); }
    let all = [...saved, ...fromTv].sort((a, b) => b.ts - a.ts).slice(0, n);
    paint(all);
    if (!pkg) return;
    for (const x of all.filter(y => y.src === 'tv')) {           // add posters for what the TV reported
      const hit = await Recent.resolve(cc, pkg, x.t); if (this._svc !== svc) return;
      if (!hit && x.url) { x.o = x.o || 'SHOW'; }
      if (hit) { x.id = hit.id; x.p = hit.content?.posterUrl; x.y = hit.content?.originalReleaseYear; x.o = hit.objectType; this._items = this._items || new Map(); this._items.set(hit.id, hit); }
    }
    paint(all);
  }
  _fillRecent(list) {
    const s = this.shadowRoot.querySelector('[data-sec="recent"]'); if (!s) return;
    let b = s.querySelector('[data-body]');
    if (ACCT[this._svc]) {
      let box = s.querySelector('[data-nfc]');
      if (this._nfc && this._nfc.svc !== this._svc) this._nfc = null;
      const show = this._hass?.user?.is_admin && (Recent.conn[this._svc] !== true || this._nfc);
      if (show) { if (!box) { box = document.createElement('div'); box.dataset.nfc = ''; s.insertBefore(box, b); } this._nfcRender(box); }
      else if (box) box.remove();
    }
    if (!list.length) { this._nfChips(s); b.innerHTML = `<div class="empty">Nothing yet. Titles you open here, and anything the Apple TV reports playing in ${esc(SERVICES[this._svc].name)}, will show up here.</div>`; s.querySelector('[data-ct]').textContent = ''; return; }
    this._recent = list;
    this._nfChips(s);
    b.innerHTML = `<div class="row">${list.map((x, i) => { const src = poster(x.p) || x.img || '';
      return `<button class="it" data-ri="${i}" aria-label="${esc(x.t)}"><div class="ph">${src ? `<img loading="lazy" decoding="async" src="${esc(src)}" alt="">` : ''}<div class="fb ${src ? 'hide' : ''}">${esc(x.t)}</div><span class="badge">${esc(x.nodate ? 'In progress' : ago(x.ts))}</span></div><div class="nm">${esc(x.t)}</div><div class="sb">${esc(x.ep || x.room || (x.o === 'SHOW' ? 'Series' : x.y ? 'Movie · ' + x.y : ''))}</div></button>`; }).join('')}</div>`;
    s.querySelector('[data-ct]').textContent = String(list.length);
    b.querySelectorAll('img').forEach(i => i.addEventListener('error', () => { i.parentElement?.querySelector('.fb')?.classList.remove('hide'); i.remove(); }, { once: true }));
    b.querySelectorAll('[data-ri]').forEach(el => el.addEventListener('click', () => {
      const x = this._recent[+el.dataset.ri]; const full = x.id && this._items?.get(x.id);
      if (full) return this._open(full);
      if (!x.id && x.url) { this._buzz(); return this._play(x.url, x.t); }
      if (x.id && x.url) return this._open({ id: x.id, objectType: x.o, content: { title: x.t, posterUrl: x.p, originalReleaseYear: x.y }, offers: [{ standardWebURL: x.url }] });
      this._buzz(); this._openApp();
    }));
  }
  _nfChips(s) {                                   // "Whose history?" profile buttons (remembered on this phone/tablet)
    let bar = s.querySelector('[data-nfp]');
    const svc = this._svc, ps = ACCT[svc] ? (Recent.prof[svc] || []) : [];
    if (ps.length < 2 || this._gateOn()) { bar?.remove(); return; }
    if (!bar) { bar = document.createElement('div'); bar.dataset.nfp = ''; bar.className = 'nfp'; s.insertBefore(bar, s.querySelector('[data-body]')); }
    const on = Recent.profileOf(svc) || Recent.act[svc];
    bar.innerHTML = ps.map(p => `<button class="${p.guid === on ? 'on' : ''}" data-g="${esc(p.guid)}"><span>${esc((p.name || '?')[0].toUpperCase())}</span>${esc(p.name)}</button>`).join('');
    bar.querySelectorAll('[data-g]').forEach(el => el.addEventListener('click', () => {
      if (el.dataset.g === on) return; this._buzz(); Recent.setProfile(svc, el.dataset.g);
      bar.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === el));
      const body = s.querySelector('[data-body]'); if (body) body.innerHTML = '<div class="empty">Loading ' + esc(el.textContent.slice(1)) + '’s history…</div>';
      this._loadRecent(this._pkg(svc));
    }));
  }
  /* ---- connect Netflix right from the card (admin only) ---- */
  _nfcRender(box) {
    const A = ACCT[this._svc], N = esc(A.name), I = A.icon;
    const st = this._nfc || { step: 'intro' }, m = st.msg ? `<div class="err">${esc(st.msg)}</div>` : '';
    const busy = t => `<div class="r"><div class="spin"></div><p>${esc(t)}</p></div>`;
    const head = `<div class="r"><ha-icon icon="${I}"></ha-icon><div><b>See what you really watched on ${N}</b><p>${esc(A.lead)}</p></div></div>`;
    let h;
    switch (st.step) {
      case 'intro': h = `${head}<button class="go" data-n="begin">Connect ${N}</button>`; break;
      case 'busy': h = busy(st.text || 'Working…'); break;
      case 'email': h = `<div class="r"><ha-icon icon="${I}"></ha-icon><b>${N} email${this._svc === 'netflix' ? ' or phone number' : ''}</b></div><input type="email" autocomplete="username" inputmode="email" data-in placeholder="name@example.com" value="${esc(st.email || '')}">${m}<button class="go" data-n="email">${esc(A.go)}</button><button class="lnk" data-n="cancel">Cancel</button>`; break;
      case 'code': h = `<div class="r"><ha-icon icon="mdi:email-fast-outline"></ha-icon><div><b>Enter the code ${N} sent</b><p>Check ${esc(st.email || 'your email')}. It expires in 15 minutes.</p></div></div><input class="code" inputmode="numeric" autocomplete="one-time-code" maxlength="8" data-in>${m}<button class="go" data-n="code">Sign in</button><button class="lnk" data-n="restart">Send a new code</button>`; break;
      case 'password': h = `<div class="r"><ha-icon icon="mdi:lock-outline"></ha-icon><b>Enter your ${N} password</b></div><input type="password" autocomplete="current-password" data-in>${m}<button class="go" data-n="password">Sign in</button><button class="lnk" data-n="cancel">Cancel</button>`; break;
      case 'profile': h = `<div class="r"><ha-icon icon="mdi:account-multiple"></ha-icon><b>Whose history should show here?</b></div><div class="pf">${(st.options || []).map(o => `<button data-n="profile" data-v="${esc(o.value)}">${esc(o.label)}</button>`).join('')}</div>${m}`; break;
      case 'done': h = `<div class="r"><ha-icon icon="mdi:check-circle" style="color:#4caf50"></ha-icon><div><b>${N} connected</b><p>${esc(st.text || '')}</p></div></div>`; break;
      default: h = `${head}${m}<button class="go" data-n="begin">Try again</button>`;
    }
    box.className = 'nfc'; box.style.setProperty('--bc', A.color); box.innerHTML = h;
    const inp = box.querySelector('[data-in]'); if (inp) { setTimeout(() => inp.focus(), 50); inp.addEventListener('keydown', e => { if (e.key === 'Enter') box.querySelector('.go')?.click(); }); }
    box.querySelectorAll('[data-n]').forEach(el => el.addEventListener('click', () => this._nfcAct(el.dataset.n, inp?.value?.trim(), el.dataset.v)));
  }
  _nfcSet(v) { this._nfc = v; const box = this.shadowRoot.querySelector('[data-nfc]'); if (box) this._nfcRender(box); else this._loadRecent(this._pkg(this._svc)); }
  async _nfcAct(a, val, v) {
    const h = this._hass, st = this._nfc || {};
    const flow = async (data) => this._hass.callApi('POST', `config/config_entries/flow/${(this._nfc || st).flow}`, data);
    const handle = r => {
      if (r.type === 'create_entry' || (r.type === 'abort' && ['already_configured', 'reauth_successful'].includes(r.reason))) {
        const svc = this._svc; Recent.forget(svc); this._nfcSet({ svc, step: 'done', text: `Your ${ACCT[svc].name} history will appear here in a moment.` });
        const wait = () => { if (this._hass.services?.one_stop_netflix?.get_history) { setTimeout(() => { this._nfc = null; Recent.forget(svc); this._loadRecent(this._pkg(svc)); }, 2500); } else setTimeout(wait, 1000); }; wait(); return;
      }
      if (r.type === 'abort') return this._nfcSet({ svc: this._svc, step: 'error', msg: ({ signed_out: 'Signed in, but the history request was refused. Try again.', cannot_read: 'Signed in, but the service answered in a way this card doesn’t understand yet.' })[r.reason] || 'The sign-in stopped (' + r.reason + ').' });
      const msg = r.errors?.base ? (r.description_placeholders?.message || ({ wrong_code: 'That code didn’t work. Check it, or send a new one.', wrong_password: 'That password didn’t work.' })[r.errors.base] || r.errors.base) : '';
      const cur = this._nfc || st;
      if (r.step_id === 'profile') { const opts = r.data_schema?.[0]?.selector?.select?.options || []; return this._nfcSet({ ...cur, flow: r.flow_id, step: 'profile', options: opts, msg }); }
      if (['email', 'disney', 'code', 'password'].includes(r.step_id)) return this._nfcSet({ ...cur, svc: this._svc, flow: r.flow_id, step: r.step_id === 'disney' ? 'email' : r.step_id, msg });
      if (r.step_id === 'cookies') return this._nfcSet({ step: 'error', msg: 'The sign-in helper isn’t running in Home Assistant. Start “One Stop Sign-in Helper” in Settings → Add-ons, then try again.' });
      this._nfcSet({ step: 'error', msg: 'Unexpected step: ' + (r.step_id || r.type) });
    };
    try {
      if (a === 'cancel') { if (st.flow) h.callApi('DELETE', `config/config_entries/flow/${st.flow}`).catch(() => {}); return this._nfcSet(null); }
      if (a === 'begin' || a === 'restart') {
        if (st.flow) h.callApi('DELETE', `config/config_entries/flow/${st.flow}`).catch(() => {});
        const A = ACCT[this._svc];
        this._nfcSet({ svc: this._svc, step: 'busy', text: `Opening ${A.name} sign-in…` });
        const open = () => this._hass.callApi('POST', 'config/config_entries/flow', { handler: 'one_stop_netflix', show_advanced_options: false });
        let r;
        try { r = await open(); }
        catch (e) {                                   // integration not installed on this home yet
          if (!/handler|not found|invalid/i.test(e?.body?.message || e?.message || '')) throw e;
          if (!(await this._nfcInstall())) return;
          this._nfcSet({ svc: this._svc, step: 'busy', text: `Opening ${A.name} sign-in…` }); r = await open();
        }
        if (r.type === 'menu') r = await this._hass.callApi('POST', `config/config_entries/flow/${r.flow_id}`, { next_step_id: A.step });
        this._nfc = { svc: this._svc, flow: r.flow_id, email: st.email };
        if (a === 'restart' && st.email) { this._nfcSet({ ...this._nfc, step: 'busy', text: `Asking ${A.name} for a new code…` }); return handle(await this._hass.callApi('POST', `config/config_entries/flow/${r.flow_id}`, { email: st.email })); }
        return handle(r);
      }
      if (!val && a !== 'profile') return this._nfcSet({ ...st, msg: 'Fill this in first.' });
      const nm = ACCT[this._svc].name;
      if (a === 'email') { this._nfcSet({ ...st, email: val, step: 'busy', text: `Contacting ${nm}…` }); return handle(await flow({ email: val })); }
      if (a === 'code') { this._nfcSet({ ...st, step: 'busy', text: `Signing in to ${nm}…` }); return handle(await flow({ code: val })); }
      if (a === 'password') { this._nfcSet({ ...st, step: 'busy', text: `Signing in to ${nm}…` }); return handle(await flow({ password: val })); }
      if (a === 'profile') { this._nfcSet({ ...st, step: 'busy', text: 'Opening that profile…' }); return handle(await flow({ profile: v })); }
    } catch (e) { this._nfcSet({ svc: this._svc, step: 'error', msg: (e?.body?.message || e?.message || String(e)).slice(0, 200) }); }
  }
  async _nfcInstall() {                         // first time on a home: install the helper add-on + integration, then restart
    const h = this._hass, sv = (endpoint, method = 'get', data) => h.callWS({ type: 'supervisor/api', endpoint, method, data, timeout: null });
    try {
      if (!h.config.components.includes('hassio')) { this._nfcSet({ step: 'error', msg: 'This Home Assistant can’t run add-ons, so Netflix sign-in has to be done from a computer (Settings → Devices & services → One Stop Netflix history).' }); return false; }
      this._nfcSet({ step: 'busy', text: 'Installing the sign-in helper (first time only, a few minutes)…' });
      await sv('/store/repositories', 'post', { repository: 'https://github.com/lilwangang/one-stop-addons' }).catch(() => {});
      let store = await sv('/store/addons'); let ad = (store.addons || store).find(x => x.slug.endsWith('one_stop_signin'));
      if (!ad) { await sv('/store/reload', 'post'); store = await sv('/store/addons'); ad = (store.addons || store).find(x => x.slug.endsWith('one_stop_signin')); }
      if (!ad) throw new Error('Couldn’t find the sign-in helper in the add-on store');
      if (!ad.installed) await sv(`/store/addons/${ad.slug}/install`, 'post');
      const info = await sv(`/addons/${ad.slug}/info`); if (info.state !== 'started') await sv(`/addons/${ad.slug}/start`, 'post');
      this._nfcSet({ step: 'busy', text: 'Installing Netflix history…' });
      // HACS, or Home Assistant's built-in Marketplace (HACS's successor)
      let P = 'hacs', list;
      try { list = await h.callWS({ type: 'hacs/repositories/list' }); } catch (e) { P = 'marketplace'; list = await h.callWS({ type: 'marketplace/repositories/list' }); }
      const REPO = 'lilwangang/one-stop-netflix'; let rp = list.find(x => x.full_name === REPO);
      if (!rp) { await h.callWS({ type: P + '/repositories/add', repository: REPO, category: 'integration' }); for (let i = 0; i < 15 && !rp; i++) { await new Promise(r => setTimeout(r, 2000)); list = await h.callWS({ type: P + '/repositories/list' }); rp = list.find(x => x.full_name === REPO); } }
      if (!rp) throw new Error('Couldn’t add the streaming history integration');
      if (!rp.installed) {
        try { await h.callWS(P === 'hacs' ? { type: 'hacs/repository/download', repository: rp.id } : { type: 'marketplace/repository/install', repository: rp.id }); }
        catch (e) { if (/warning/i.test(e?.code || e?.message || '')) throw new Error('Open Settings → Marketplace once and accept its warning, then press Connect again'); throw e; }
      }
      this._nfcSet({ step: 'busy', text: 'Restarting Home Assistant to finish (about a minute)…' });
      await h.callService('homeassistant', 'restart', {}).catch(() => {});
      await new Promise(r => setTimeout(r, 20000));
      for (let i = 0; i < 90; i++) {
        await new Promise(r => setTimeout(r, 2000));
        try { const f = await this._hass.callApi('POST', 'config/config_entries/flow', { handler: 'one_stop_netflix', show_advanced_options: false }); this._hass.callApi('DELETE', `config/config_entries/flow/${f.flow_id}`).catch(() => {}); return true; } catch (e) {}
      }
      throw new Error('Home Assistant restarted but Netflix history didn’t load. Refresh the page and press Connect again.');
    } catch (e) { this._nfcSet({ step: 'error', msg: 'Setup didn’t finish: ' + (e?.message || e?.error || JSON.stringify(e)).slice(0, 180) }); return false; }
  }
  _remember(x) {
    if (!x) return; const ct = x.content || {};
    Recent.add(this._hass, this._svc, { id: x.id, t: ct.title, p: ct.posterUrl, y: ct.originalReleaseYear, o: x.objectType, url: x.offers?.[0]?.standardWebURL, ts: Date.now(), room: this._cfg.room_name || '' })
      .then(() => { if (this._cfg.show_recent) this._loadRecent(this._pkg(this._svc)); });
  }
  async _search() {
    const R = this.shadowRoot, res = R.querySelector('[data-results]'), rows = R.querySelector('[data-rows]'); if (!res) return;
    if (!this._q) { res.classList.add('hide'); rows.classList.remove('hide'); return; }
    res.classList.remove('hide'); rows.classList.add('hide');
    const svc = this._svc, q = this._q; res.querySelector('[data-body]').innerHTML = '<div class="empty">Searching…</div>';
    try { const l = await JWQ.list(this._cfg.country || 'CA', this._pkg(svc), { search: q, first: 40 }); if (this._svc === svc && this._q === q) this._fill('results', l, null, true); }
    catch (e) { this._fill('results', null, e, true); }
  }
  _item(x) {
    const c = x.content || {}, src = poster(c.posterUrl);
    const sub = [x.objectType === 'SHOW' ? (c.seasonLabel || 'Series') : 'Movie', c.originalReleaseYear].filter(Boolean).join(' · ');
    return `<button class="it" data-id="${esc(x.id)}" aria-label="${esc(c.title)}"><div class="ph">${src ? `<img loading="lazy" decoding="async" src="${esc(src)}" alt="">` : ''}<div class="fb ${src ? 'hide' : ''}">${esc(c.title)}</div>${c.seasonLabel ? `<span class="badge">New ${esc(c.seasonLabel)}</span>` : ''}</div><div class="nm">${esc(c.title)}</div><div class="sb">${esc(sub)}</div></button>`;
  }
  _fill(k, list, err, grid = false) {
    const s = this.shadowRoot.querySelector(`[data-sec="${k}"]`); if (!s) return;
    const b = s.querySelector('[data-body]');
    this._items = this._items || new Map(); (list || []).forEach(x => this._items.set(x.id, x));
    b.innerHTML = err ? `<div class="empty">Couldn’t load (${esc(err.message || err)}).</div>` : !list.length ? `<div class="empty">${k === 'results' ? 'Nothing matches “' + esc(this._q) + '”.' : 'Nothing here right now.'}</div>`
      : `<div class="${grid ? 'grid' : 'row'}">${list.map(x => this._item(x)).join('')}</div>`;
    s.querySelector('[data-ct]').textContent = list?.length ? `${list.length}` : '';
    b.querySelectorAll('img').forEach(i => i.addEventListener('error', () => { i.parentElement?.querySelector('.fb')?.classList.remove('hide'); i.remove(); }, { once: true }));
    b.querySelectorAll('.it[data-id]').forEach(el => el.addEventListener('click', () => this._open(this._items.get(el.dataset.id))));
  }
  _open(x) {
    if (!x) return; this._buzz();
    const c = this._cfg, ct = x.content || {}, S = SERVICES[this._svc], url = x.offers?.[0]?.standardWebURL, room = c.room_name || 'the TV';
    if (!c.confirm_open) { this._remember(x); return this._play(url, ct.title); }
    const meta = [x.objectType === 'SHOW' ? 'Series' : 'Movie', ct.originalReleaseYear, ct.runtime ? `${ct.runtime} min` : '', ct.scoring?.imdbScore ? `IMDb ${ct.scoring.imdbScore}` : ''].filter(Boolean).join(' · ');
    const w = document.createElement('div'); w.className = 'pop';
    w.innerHTML = `<div class="sheet" role="dialog" aria-label="${esc(ct.title)}"><div class="top"><div class="ph">${ct.posterUrl ? `<img src="${esc(big(ct.posterUrl))}" alt="">` : ''}</div>
      <div><h3>${esc(ct.title)}</h3><div class="meta">${esc(meta)}</div><div class="room"><ha-icon icon="mdi:television"></ha-icon>${esc(S.name)} · ${esc(room)}</div></div></div>
      ${ct.shortDescription ? `<div class="desc">${esc(ct.shortDescription)}</div>` : ''}
      <div class="acts"><button class="act main" data-a="play"><ha-icon icon="mdi:play"></ha-icon>Watch on ${esc(room)}<small>opens in ${esc(S.name)}</small></button>
      <button class="act" data-a="app"><ha-icon icon="mdi:open-in-app"></ha-icon>Just open ${esc(S.name)}</button></div>
      <button class="close" data-a="close">Close</button></div>`;
    this.shadowRoot.appendChild(w);
    w.addEventListener('click', e => { if (e.target === w) w.remove(); });
    w.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => { const a = b.dataset.a; w.remove(); if (a === 'play') { this._remember(x); this._play(url, ct.title); } if (a === 'app') this._openApp(); }));
  }
  async _wake() {
    const c = this._cfg, h = this._hass, st = h.states[c.apple_tv]?.state;
    if (['off', 'standby', 'unavailable', 'unknown'].includes(st)) { await h.callService('media_player', 'turn_on', { entity_id: c.apple_tv }).catch(() => {}); await new Promise(r => setTimeout(r, 4000)); }
  }
  async _autoStart() {                              // most apps open the title's page; press Select so it starts playing
    const c = this._cfg; if (c.auto_play === false || !c.remote) return;
    for (const wait of [5000, 4000]) {
      await new Promise(r => setTimeout(r, wait));
      if (this._hass.states[c.apple_tv]?.state === 'playing') return;
      await this._hass.callService('remote', 'send_command', { entity_id: c.remote, command: 'select' }).catch(() => {});
      await new Promise(r => setTimeout(r, 2500));
      if (this._hass.states[c.apple_tv]?.state === 'playing') return;
    }
  }
  async _openApp() {
    const c = this._cfg, S = SERVICES[this._svc]; this._buzz();
    try { await this._wake(); await this._hass.callService('media_player', 'select_source', { entity_id: c.apple_tv, source: S.app }); this._toast(`Opening ${S.name} on ${c.room_name || 'the TV'}…`); }
    catch (e) { this._toast('Couldn’t open: ' + (e.message || e)); }
  }
  async _play(url, title) {
    const c = this._cfg, S = SERVICES[this._svc]; this._buzz();
    if (!url) return this._openApp();
    const open = () => this._hass.callService('media_player', 'play_media', { entity_id: c.apple_tv, media_content_type: 'url', media_content_id: url });
    try { await this._wake(); try { await open(); } catch (e) { await new Promise(r => setTimeout(r, 2500)); await open(); } this._toast(`Opening ${title} in ${S.name}…`); this._autoStart(); }
    catch (e) { this._toast('That title couldn’t open directly, opening the app instead.'); this._openApp(); }
  }
}

/* ---------------- visual editor ---------------- */
const sel = opts => ({ select: { mode: 'dropdown', options: opts.map(([value, label]) => ({ value, label })) } });
const toggle = { boolean: {} };
const size4 = sel([['small', 'Small'], ['medium', 'Medium'], ['large', 'Large'], ['extra_large', 'Extra large']]);
const COUNTRIES = [['CA', 'Canada'], ['US', 'United States'], ['GB', 'United Kingdom'], ['AU', 'Australia'], ['NZ', 'New Zealand'], ['IE', 'Ireland'], ['FR', 'France'], ['DE', 'Germany'], ['IN', 'India'], ['MX', 'Mexico']];
const schema = d => {
  const grid = items => ({ type: 'grid', name: '', flatten: true, schema: items });
  const section = (name, title, icon, items) => ({ name, type: 'expandable', flatten: true, title, icon, schema: items });
  return [
    { name: 'room_name', selector: { text: {} } },
    section('g_tv', 'Which TV opens it', 'mdi:television', [
      { name: 'apple_tv', selector: { entity: { filter: { domain: 'media_player', integration: 'apple_tv' } } } },
      { name: 'remote', selector: { entity: { filter: { domain: 'remote' } } } },
    ]),
    section('g_subs', 'Subscriptions', 'mdi:account-credit-card-outline', [
      { name: 'country', selector: sel(COUNTRIES) },
      { name: 'services', selector: { select: { multiple: true, mode: 'list', options: Object.entries(SERVICES).map(([value, s]) => ({ value, label: s.name + (s.pkg ? '' : ' (opens the app only)') })) } } },
      grid([
        { name: 'netflix_plan', selector: sel([['ads', 'Standard with Ads'], ['standard', 'Standard'], ['premium', 'Premium']]) },
        { name: 'paramount_plan', selector: sel([['standard', 'Standard'], ['premium', 'Premium'], ['ads', 'Basic with Ads']]) },
        { name: 'default_service', selector: sel(Object.entries(SERVICES).map(([k, s]) => [k, s.name])) },
      ]),
    ]),
    section('g_show', 'What to show', 'mdi:eye-outline', [grid([
      { name: 'show_tabs', selector: toggle }, { name: 'show_search', selector: toggle }, { name: 'show_recent', selector: toggle },
      { name: 'show_trending', selector: toggle }, { name: 'show_new', selector: toggle },
      { name: 'show_shows', selector: toggle }, { name: 'show_movies', selector: toggle },
      { name: 'row_count', selector: { number: { min: 5, max: 40, step: 5, mode: 'slider' } } },
    ])]),
    section('g_posters', 'Posters and opening', 'mdi:image-multiple-outline', [grid([
      { name: 'poster_size', selector: size4 },
      { name: 'poster_shape', selector: sel([['square', 'Square corners'], ['rounded', 'Rounded'], ['extra_round', 'Extra round']]) },
      { name: 'show_titles', selector: toggle }, { name: 'confirm_open', selector: toggle }, { name: 'auto_play', selector: toggle }, { name: 'profile_gate', selector: toggle }, { name: 'netflix_row', selector: { select: { mode: 'dropdown', options: [{ value: 'continue', label: 'Continue watching' }, { value: 'history', label: 'Everything watched' }] } } },
    ])]),
    section('g_look', 'Look', 'mdi:palette-outline', [grid([
      { name: 'use_brand_colour', selector: toggle },
      { name: 'off_background', selector: sel([['theme', 'Clear frosted glass'], ['darker', 'Darker frosted glass'], ['lighter', 'Lighter frosted glass'], ['custom', 'Frosted glass in my own colour']]) },
      ...(d.off_background === 'custom' ? [{ name: 'off_custom_color', selector: { color_rgb: {} } }] : []),
      { name: 'card_spacing', selector: sel([['compact', 'Compact'], ['standard', 'Standard'], ['roomy', 'Roomy']]) },
      { name: 'corners', selector: sel([['square', 'Square'], ['rounded', 'Rounded'], ['extra_round', 'Extra round']]) },
      { name: 'font', selector: sel([['classic', 'Classic'], ['theme', 'Same as Home Assistant'], ['rounded', 'Rounded']]) },
      { name: 'title_size', selector: size4 }, { name: 'haptics', selector: toggle },
    ])]),
  ];
};
const LABELS = {
  edit_all: 'Master edit – change all Streaming cards at once', reset_style: 'Use the shared style on this card (clear its own changes)',
  room_name: 'Room name (shown on the card)', apple_tv: 'Apple TV', remote: 'Apple TV remote',
  country: 'Country (each country has a different catalogue)', services: 'Services this home subscribes to', netflix_plan: 'Netflix plan', paramount_plan: 'Paramount+ plan', default_service: 'Service shown first',
  show_tabs: 'Service buttons at the top', show_search: 'Search box', show_recent: 'Recently played', show_trending: 'Trending', show_new: 'New this week', show_shows: 'Popular shows', show_movies: 'Popular movies', row_count: 'Titles in each row',
  poster_size: 'Poster size', poster_shape: 'Poster corners', show_titles: 'Names under posters', confirm_open: 'Show a pop-up before opening', auto_play: 'Start playing automatically (presses Select for you)', netflix_row: 'Netflix row shows', profile_gate: 'Ask “Who’s watching?” when Netflix opens',
  use_brand_colour: 'Tint the card in the service’s colour', off_background: 'Background', off_custom_color: 'Your background colour', card_spacing: 'Spacing inside the card', corners: 'Card corners', font: 'Lettering style', title_size: 'Title size', haptics: 'Vibrate on press (phones)',
};
const HELPERS = {
  services: 'Only titles on these services are shown, so everything listed is something this home can watch.',
  show_recent: 'Titles opened from this card, plus what the Apple TVs report playing in each app. For Netflix, connect the account (button above) to see real watch history.',
  netflix_plan: 'Standard with Ads is missing some titles, so they are left out. Standard and Premium have the same titles.',
};
class OneStopStreamingCardEditor extends HTMLElement {
  setConfig(config) { this._config = { ...config }; this._render(); }
  set hass(hass) { const first = !this._hass; this._hass = hass; if (first) Shared.get(hass).then(() => this._render()); this._render(); }
  _inherited() { Shared._readCache(); return { ...DEFAULTS, ...((Shared.data || {})[SECTION] || {}) }; }
  _ownStyle() { return Object.keys(this._config || {}).filter(k => !ROOM_KEYS.includes(k)); }
  _emit(cfg) { this._config = cfg; this._render(); this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: cfg }, bubbles: true, composed: true })); }
  _onChange(v) {
    if (!!v.edit_all !== !!this._all) { this._all = !!v.edit_all; this._render(); return; }
    const type = this._config.type || 'custom:' + TAG;
    if (v.reset_style) { const cfg = { type }; for (const k of ROOM_KEYS) if (k in this._config && k !== 'type') cfg[k] = this._config[k]; return this._emit(cfg); }
    const dep = { off_custom_color: v.off_background === 'custom' }, clean = {};
    for (const [k, val] of Object.entries(v)) { if (['type', 'edit_all', 'reset_style'].includes(k) || val === '' || val == null || dep[k] === false) continue; clean[k] = val; }
    const inherited = this._inherited(), cfg = { type };
    for (const k of ROOM_KEYS) if (k !== 'type' && k in clean && !(k in DEFAULTS && same(clean[k], DEFAULTS[k]))) cfg[k] = clean[k];
    if (this._all) {
      const shared = {}; for (const [k, val] of Object.entries(clean)) if (!ROOM_KEYS.includes(k) && !(k in DEFAULTS && same(val, DEFAULTS[k]))) shared[k] = val;
      for (const k of this._ownStyle()) if (same(clean[k], this._shown?.[k])) cfg[k] = this._config[k];
      for (const k of Object.keys(clean)) if (!ROOM_KEYS.includes(k) && !same(clean[k], this._shown?.[k])) delete cfg[k];
      if (!same(shared, (Shared.data || {})[SECTION] || {})) { Shared.data = { ...(Shared.data || {}), [SECTION]: shared }; Shared.listeners.forEach(fn => fn(Shared.data)); clearTimeout(this._t); this._t = setTimeout(() => Shared.save(this._hass, shared).catch(() => {}), 500); }
    } else for (const [k, val] of Object.entries(clean)) if (!ROOM_KEYS.includes(k) && !same(val, inherited[k])) cfg[k] = val;
    this._emit(cfg);
  }
  _netflixPanel(data) {
    if (!this._nfBox) { this._nfBox = document.createElement('div'); this.insertBefore(this._nfBox, this._form); }
    const on = (data.services || []).includes('netflix') && data.show_recent !== false, linked = !!this._hass?.services?.one_stop_netflix?.get_history;
    this._nfBox.style.cssText = on ? 'margin:0 0 12px;padding:12px;border-radius:12px;font-size:14px;line-height:1.4;display:flex;gap:12px;align-items:center;border:1px solid rgba(229,9,20,.45);background:rgba(229,9,20,.08)' : 'display:none';
    if (!on) return;
    const key = String(linked); if (this._nfKey === key) return; this._nfKey = key;
    this._nfBox.innerHTML = linked
      ? '<ha-icon icon="mdi:check-circle" style="color:#4caf50"></ha-icon><div style="flex:1"><b>Netflix account connected.</b> Recently played shows what was really watched on Netflix.</div><button data-nf style="all:unset;cursor:pointer;padding:8px 12px;border-radius:10px;background:rgba(255,255,255,.1);white-space:nowrap">Add a profile</button>'
      : '<ha-icon icon="mdi:netflix" style="color:#e50914"></ha-icon><div style="flex:1"><b>Show real Netflix history?</b> Netflix doesn’t tell the TV what’s playing, so connect the Netflix account to fill Recently played.</div><button data-nf style="all:unset;cursor:pointer;padding:8px 12px;border-radius:10px;background:#e50914;color:#fff;font-weight:600;white-space:nowrap">Connect Netflix</button>';
    this._nfBox.querySelector('[data-nf]').addEventListener('click', () => {
      if (!linked && !Object.keys(this._hass?.config?.components || {}).length) return;
      const url = '/config/integrations/dashboard/add?domain=one_stop_netflix';
      history.pushState(null, '', url); window.dispatchEvent(new CustomEvent('location-changed', { detail: { replace: false } }));
    });
  }
  _render() {
    if (!this._config) return;
    if (!this._form) {
      this._note = document.createElement('div'); this._note.style.cssText = 'margin:0 0 12px;padding:10px 12px;border-radius:12px;font-size:14px;line-height:1.4;background:rgba(var(--rgb-primary-color,3,169,244),.12)'; this.appendChild(this._note);
      this._form = document.createElement('ha-form'); this._form.computeLabel = s => LABELS[s.name] ?? s.title ?? s.name; this._form.computeHelper = s => HELPERS[s.name];
      this._form.addEventListener('value-changed', ev => { ev.stopPropagation(); this._onChange(ev.detail.value); }); this.appendChild(this._form);
    }
    const inh = this._inherited(), own = this._ownStyle(), room = Object.fromEntries(Object.entries(this._config).filter(([k]) => ROOM_KEYS.includes(k)));
    const data = this._all ? { ...inh, ...room } : { ...inh, ...this._config }; data.edit_all = !!this._all; data.reset_style = false; this._shown = data;
    this._note.textContent = this._all ? 'Master edit is on: look changes apply to every Streaming card. TV and subscriptions still apply to this card only.' : 'Pick the country and the services this home pays for so every title shown is one they can watch.';
    this._netflixPanel(data);
    this._form.hass = this._hass;
    this._form.schema = [{ name: 'edit_all', selector: toggle }, ...(!this._all && own.length ? [{ name: 'reset_style', selector: toggle }] : []), ...schema(data)];
    this._form.data = data;
  }
}
if (!customElements.get(TAG)) customElements.define(TAG, OneStopStreamingCard);
if (!customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, OneStopStreamingCardEditor);
window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === TAG)) window.customCards.push({ type: TAG, name: 'One Stop - Streaming card', description: 'Browse and search Netflix, Disney+, Prime Video and more (only what this home subscribes to) and open a title on the room’s TV.', preview: false });
console.info(`%c ONE STOP %c Streaming card ${VERSION} `, 'background:#375374;color:#fff;border-radius:3px 0 0 3px;padding:2px 4px', 'background:#e9eef5;color:#375374;border-radius:0 3px 3px 0;padding:2px 4px');
window.__oneStopStreaming = { SERVICES, JWQ, Recent };
})();
