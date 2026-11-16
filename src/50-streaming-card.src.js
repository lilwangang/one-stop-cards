/*!
 * One Stop – Streaming card
 * One Stop Smart Homes · standalone Home Assistant dashboard card (no other add-ons needed)
 * Browse and search what's on each streaming service (via JustWatch, by country and plan) and open it on a room's TV.
 */
(() => {
'use strict';
const VERSION = '1.0.0';
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
  show_tabs: true, show_search: true, show_trending: true, show_shows: true, show_movies: true, show_new: true, row_count: 20,
  poster_size: 'medium', poster_shape: 'rounded', show_titles: true, use_brand_colour: true, confirm_open: true,
  card_spacing: 'standard', corners: 'rounded', font: 'classic', title_size: 'medium', off_background: 'theme', off_custom_color: [40, 44, 52], haptics: true,
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
  async q(query, variables, ttl = 600000) {
    const k = query + JSON.stringify(variables), hit = this.cache.get(k);
    if (hit && Date.now() - hit.t < ttl) return hit.v;
    const r = await fetch(JW, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, variables }) });
    const d = await r.json(); if (d.errors) throw new Error(d.errors[0].message);
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
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
`;

/* ---------------- the card ---------------- */
class OneStopStreamingCard extends HTMLElement {
  static getConfigElement() { return document.createElement(EDITOR_TAG); }
  static getStubConfig(hass) { const atv = Object.keys(hass?.states || {}).find(e => e.startsWith('media_player.') && hass.entities?.[e]?.platform === 'apple_tv'); return { apple_tv: atv, remote: atv ? atv.replace('media_player.', 'remote.') : undefined }; }
  setConfig(config) { if (!config) throw new Error('Invalid configuration'); this._raw = { ...config }; this._merge(); if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._built = false; if (this._hass) this._build(); }
  _merge() { Shared._readCache(); this._cfg = { ...DEFAULTS, ...((Shared.data || {})[SECTION] || {}), ...this._raw }; }
  connectedCallback() {
    this._onShared = () => { this._merge(); this._built = false; if (this._hass) this._build(); }; Shared.listeners.add(this._onShared);
    this._onLoc = () => { const s = this._urlService(); if (s && s !== this._svc) { this._svc = s; this._q = ''; if (this._hass) this._build(); } };
    window.addEventListener('location-changed', this._onLoc); window.addEventListener('popstate', this._onLoc);
  }
  disconnectedCallback() { Shared.listeners.delete(this._onShared); window.removeEventListener('location-changed', this._onLoc); window.removeEventListener('popstate', this._onLoc); }
  set hass(hass) { const first = !this._hass; this._hass = hass; if (first) Shared.get(hass); if (!this._built) this._build(); }
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
    const planWord = this._svc === 'netflix' ? (c.netflix_plan === 'ads' ? 'Standard with Ads plan' : 'Standard / Premium plan') : '';
    const tabs = c.show_tabs && list.length > 1 ? `<div class="tabs">${list.map(s => `<button class="tab ${s === this._svc ? 'on' : ''}" data-svc="${s}" style="--tc:${SERVICES[s].color.join(',')}">${esc(SERVICES[s].name)}</button>`).join('')}</div>` : '';
    const sec = (k, t) => `<div class="sec" data-sec="${k}"><div class="sh"><h2>${esc(t)}</h2><span class="ct" data-ct></span></div><div data-body><div class="empty">Loading…</div></div></div>`;
    const body = !pkg
      ? `<div class="apponly">${esc(S.name)} doesn’t share its catalogue, so it opens straight in the app.<button class="openapp" data-open><ha-icon icon="mdi:open-in-app"></ha-icon>Open ${esc(S.name)} on ${esc(room)}</button></div>`
      : `${c.show_search ? `<label class="search"><ha-icon icon="mdi:magnify"></ha-icon><input type="search" placeholder="Search ${esc(S.name)}" data-q enterkeyhint="search" value="${esc(this._q || '')}"></label>` : ''}
        <div data-results class="hide">${sec('results', 'Results')}</div>
        <div data-rows>${c.show_trending ? sec('trending', `Trending on ${S.name}`) : ''}${c.show_new ? sec('new', `New on ${S.name}`) : ''}${c.show_shows ? sec('shows', 'Popular shows') : ''}${c.show_movies ? sec('movies', 'Popular movies') : ''}</div>`;
    R.innerHTML = `<style>${CSS}</style><ha-card class="sz-${esc(c.poster_size)} ${c.show_titles ? '' : 'notitles'} ${c.use_brand_colour ? 'brand' : ''}" style="${vars}">${tabs}
      <div class="hero"><h1>${esc(S.name)}<span class="sub">${esc([room, planWord].filter(Boolean).join(' · '))}</span></h1>${pkg ? `<button class="openapp" data-open><ha-icon icon="mdi:open-in-app"></ha-icon>Open app</button>` : ''}</div>${body}</ha-card>`;
    this._built = true;
    R.querySelectorAll('[data-svc]').forEach(b => b.addEventListener('click', () => { this._buzz(); this._svc = b.dataset.svc; this._q = ''; this._build(); }));
    R.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => this._openApp()));
    const q = R.querySelector('[data-q]'); if (q) q.addEventListener('input', () => { clearTimeout(this._qt); this._qt = setTimeout(() => { this._q = q.value.trim(); this._search(); }, 350); });
    if (pkg) { this._loadRows(pkg); if (this._q) this._search(); }
  }
  async _loadRows(pkg) {
    const c = this._cfg, n = +c.row_count || 20, cc = c.country || 'CA', svc = this._svc;
    const fill = (k, p) => p.then(l => { if (this._svc === svc) this._fill(k, l); }).catch(e => { if (this._svc === svc) this._fill(k, null, e); });
    if (c.show_trending) fill('trending', JWQ.list(cc, pkg, { sort: 'TRENDING', first: n }));
    if (c.show_new) fill('new', JWQ.fresh(cc, pkg, n));
    if (c.show_shows) fill('shows', JWQ.list(cc, pkg, { type: 'SHOW', first: n }));
    if (c.show_movies) fill('movies', JWQ.list(cc, pkg, { type: 'MOVIE', first: n }));
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
    if (!c.confirm_open) return this._play(url, ct.title);
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
    w.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => { const a = b.dataset.a; w.remove(); if (a === 'play') this._play(url, ct.title); if (a === 'app') this._openApp(); }));
  }
  async _wake() {
    const c = this._cfg, h = this._hass, st = h.states[c.apple_tv]?.state;
    if (['off', 'standby', 'unavailable', 'unknown'].includes(st)) { await h.callService('media_player', 'turn_on', { entity_id: c.apple_tv }).catch(() => {}); await new Promise(r => setTimeout(r, 2500)); }
  }
  async _openApp() {
    const c = this._cfg, S = SERVICES[this._svc]; this._buzz();
    try { await this._wake(); await this._hass.callService('media_player', 'select_source', { entity_id: c.apple_tv, source: S.app }); this._toast(`Opening ${S.name} on ${c.room_name || 'the TV'}…`); }
    catch (e) { this._toast('Couldn’t open: ' + (e.message || e)); }
  }
  async _play(url, title) {
    const c = this._cfg, S = SERVICES[this._svc]; this._buzz();
    if (!url) return this._openApp();
    try { await this._wake(); await this._hass.callService('media_player', 'play_media', { entity_id: c.apple_tv, media_content_type: 'url', media_content_id: url }); this._toast(`Opening ${title} in ${S.name}…`); }
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
        { name: 'netflix_plan', selector: sel([['standard', 'Standard or Premium'], ['ads', 'Standard with Ads']]) },
        { name: 'paramount_plan', selector: sel([['standard', 'Standard'], ['premium', 'Premium'], ['ads', 'Basic with Ads']]) },
        { name: 'default_service', selector: sel(Object.entries(SERVICES).map(([k, s]) => [k, s.name])) },
      ]),
    ]),
    section('g_show', 'What to show', 'mdi:eye-outline', [grid([
      { name: 'show_tabs', selector: toggle }, { name: 'show_search', selector: toggle },
      { name: 'show_trending', selector: toggle }, { name: 'show_new', selector: toggle },
      { name: 'show_shows', selector: toggle }, { name: 'show_movies', selector: toggle },
      { name: 'row_count', selector: { number: { min: 5, max: 40, step: 5, mode: 'slider' } } },
    ])]),
    section('g_posters', 'Posters and opening', 'mdi:image-multiple-outline', [grid([
      { name: 'poster_size', selector: size4 },
      { name: 'poster_shape', selector: sel([['square', 'Square corners'], ['rounded', 'Rounded'], ['extra_round', 'Extra round']]) },
      { name: 'show_titles', selector: toggle }, { name: 'confirm_open', selector: toggle },
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
  show_tabs: 'Service buttons at the top', show_search: 'Search box', show_trending: 'Trending', show_new: 'New this week', show_shows: 'Popular shows', show_movies: 'Popular movies', row_count: 'Titles in each row',
  poster_size: 'Poster size', poster_shape: 'Poster corners', show_titles: 'Names under posters', confirm_open: 'Show a pop-up before opening',
  use_brand_colour: 'Tint the card in the service’s colour', off_background: 'Background', off_custom_color: 'Your background colour', card_spacing: 'Spacing inside the card', corners: 'Card corners', font: 'Lettering style', title_size: 'Title size', haptics: 'Vibrate on press (phones)',
};
const HELPERS = {
  services: 'Only titles on these services are shown, so everything listed is something this home can watch.',
  netflix_plan: 'The ads plan is missing some titles; this keeps the list accurate.',
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
window.__oneStopStreaming = { SERVICES, JWQ };
})();
