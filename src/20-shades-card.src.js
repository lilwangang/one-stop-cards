/*!
 * One Stop – Shades card
 * One Stop Smart Homes · standalone Home Assistant dashboard card (no other add-ons needed)
 * Six layouts (3 compact, 3 tablet), all set from the visual card editor.
 */
(() => {
'use strict';
const VERSION = '1.4.1';
const TAG = 'one-stop-shades-card';
const EDITOR_TAG = TAG + '-editor';

const LAYOUTS = {
  bar: 'Slim bar', bar_line: 'Slim bar · Position line', bar_fill: 'Slim bar · Filled', bar_pill: 'Slim bar · One-piece buttons', slide: 'Compact · Swipe card', tile: 'Compact · Tile',
  window: 'Tablet · Window', panel: 'Tablet · Control panel', columns: 'Tablet · Shade columns',
};
const DEFAULTS = {
  layout: 'bar', show_climate: true, show_presets: true, show_schedule: true, show_individual: true, show_stop: true,
  preset_1: 25, preset_2: 50, preset_3: 75, open_word: 'Open', close_word: 'Close',
  corners: 'rounded', fill_color: [255, 183, 77], card_spacing: 'standard', size: 'large',
  on_color: [35, 145, 86], off_color: [178, 52, 64], button_tint: 'soft', title_size: 'medium', open_glow: 'normal', button_style: 'tinted', slider_size: 'standard', show_icon: true,
};
const ROOM_KEYS = ['type', 'area', 'name', 'room_icon', 'layout', 'master_shade', 'extra_shades', 'hide_shades', 'temperature_sensor', 'humidity_sensor', 'schedule_automations'];
const SKIP_CLASSES = ['garage', 'door', 'gate', 'damper'];
const shortName = (hass, id, area) => {
  let n = nameOf(hass, id); const a = hass.areas?.[area]?.name;
  if (a) { const re = new RegExp('^' + a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*[-–:]?\\s*', 'i'); const t = n.replace(re, ''); if (t) n = t; }
  return n.charAt(0).toUpperCase() + n.slice(1);
};

/* ---------------- helpers ---------------- */
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const okRgb = v => Array.isArray(v) && v.length === 3 && v.every(n => Number.isFinite(+n));
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const titleCase = s => String(s || '').replace(/_/g, ' ').replace(/\b\w/g, m => m.toUpperCase());
const live = st => st && !['unavailable', 'unknown'].includes(st.state);
const isGroup = st => Array.isArray(st?.attributes?.entity_id);
const posOf = st => { if (!st) return null; const p = st.attributes?.current_position; if (Number.isFinite(p)) return p; return st.state === 'open' ? 100 : st.state === 'closed' ? 0 : null; };
const areaOf = (hass, id) => { const e = hass.entities?.[id]; return e?.area_id || hass.devices?.[e?.device_id]?.area_id || null; };
const nameOf = (hass, id) => (hass.states[id]?.attributes?.friendly_name || id).trim();
const stateWord = (st, cfg) => {
  if (!live(st)) return 'Not responding';
  if (st.state === 'opening') return 'Opening…'; if (st.state === 'closing') return 'Closing…';
  const p = posOf(st); if (p == null) return titleCase(st.state);
  return p === 0 ? 'Closed' : p === 100 ? 'Open' : `${p}% open`;
};
const fmtTime = s => { const m = /^(\d{1,2}):(\d{2})/.exec(s || ''); if (!m) return s; let h = +m[1]; const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${m[2]} ${ap}`; };

function roomShades(hass, cfg) {
  const hide = new Set(cfg.hide_shades || []), out = new Set();
  if (cfg.area) for (const id of Object.keys(hass.states)) {
    if (!id.startsWith('cover.')) continue;
    const st = hass.states[id];
    if (isGroup(st) || SKIP_CLASSES.includes(st.attributes?.device_class)) continue;
    if (hass.entities?.[id]?.entity_category) continue;
    if (areaOf(hass, id) === cfg.area) out.add(id);
  }
  for (const id of cfg.extra_shades || []) if (hass.states[id]) out.add(id);
  for (const id of hide) out.delete(id);
  return [...out].sort((a, b) => nameOf(hass, a).localeCompare(nameOf(hass, b)));
}
function masterShade(hass, cfg, shades) {
  if (cfg.master_shade && hass.states[cfg.master_shade]) return cfg.master_shade;
  const g = Object.keys(hass.states).find(id => id.startsWith('cover.') && isGroup(hass.states[id]) && areaOf(hass, id) === cfg.area);
  return g || null;
}
function sensorFor(hass, cfg, cls) {
  const key = cls === 'temperature' ? 'temperature_sensor' : 'humidity_sensor';
  if (cfg[key]) return hass.states[cfg[key]] ? cfg[key] : null;
  const found = Object.keys(hass.states).filter(id => id.startsWith('sensor.') && hass.states[id].attributes?.device_class === cls && areaOf(hass, id) === cfg.area && live(hass.states[id]));
  return found.sort((a, b) => (/weather|room|ambient/.test(b) - /weather|room|ambient/.test(a)))[0] || null;
}

/* ---------------- schedule: read open/close times from automations ---------------- */
const Schedules = {
  cache: null, loading: null,
  load(hass) {
    if (this.cache) return Promise.resolve(this.cache);
    if (!this.loading) this.loading = (async () => {
      const autos = Object.values(hass.states).filter(s => s.entity_id.startsWith('automation.') && s.attributes?.id);
      const out = [];
      await Promise.all(autos.map(async a => {
        try { const cfg = await hass.callApi('GET', 'config/automation/config/' + a.attributes.id); if (/cover\./.test(JSON.stringify(cfg))) out.push({ entity: a.entity_id, cfg }); } catch (e) { /* not an admin, or not editable */ }
      }));
      this.cache = out; return out;
    })();
    return this.loading;
  },
};
function describeTrigger(hass, t) {
  const kind = t.trigger || t.platform;
  const days = Array.isArray(t.weekday) ? t.weekday : t.weekday ? [t.weekday] : null;
  const dayWord = !days ? 'Every day' : same([...days].sort(), ['fri', 'mon', 'thu', 'tue', 'wed']) ? 'Weekdays' : same([...days].sort(), ['sat', 'sun']) ? 'Weekends' : days.map(d => titleCase(d)).join(', ');
  if (kind === 'time') {
    const at = Array.isArray(t.at) ? t.at[0] : t.at;
    let when = at;
    if (typeof at === 'string' && at.includes('.')) { const st = hass.states[at]; when = st ? (st.attributes?.has_time === false ? null : st.state.split(' ').pop()) : null; }
    if (!when) return null;
    return { sort: when, when: fmtTime(when), days: dayWord };
  }
  if (kind === 'sun') {
    const ev = t.event === 'sunrise' ? 'Sunrise' : 'Sunset';
    let off = t.offset || ''; if (typeof off === 'object') off = `${off.hours ? off.hours + 'h' : ''}${off.minutes ? off.minutes + 'm' : ''}`;
    return { sort: ev === 'Sunrise' ? '06:00' : '19:00', when: ev + (off && off !== '0' && off !== '00:00:00' ? ` ${off}` : ''), days: dayWord };
  }
  if (kind === 'sun.sunset' || kind === 'sun.sunrise') return { sort: kind.endsWith('rise') ? '06:00' : '19:00', when: kind.endsWith('rise') ? 'Sunrise' : 'Sunset', days: dayWord };
  return null;
}
function scheduleFor(hass, cfg, coverIds, deviceIds, shadeIds) {
  if (!Schedules.cache) return null;
  const wanted = cfg.schedule_automations?.length ? new Set(cfg.schedule_automations) : null;
  const floor = hass.areas?.[cfg.area]?.floor_id;
  const rows = [];
  const who = step => {   // which of this room's shades an action moves (null = none)
    const t = { ...(step.target || {}), ...(step.data || {}) };
    const ents = [].concat(t.entity_id || []), devs = [].concat(t.device_id || []), areas = [].concat(t.area_id || []), floors = [].concat(t.floor_id || []);
    if ((cfg.area && areas.includes(cfg.area)) || (floor && floors.includes(floor))) return 'all';
    const hit = shadeIds.filter(id => ents.includes(id) || devs.includes(hass.entities?.[id]?.device_id));
    if (ents.some(e => coverIds.has(e) && !shadeIds.includes(e))) return 'all';      // the room's shade group
    return hit.length ? (hit.length === shadeIds.length ? 'all' : hit) : null;
  };
  const what = step => {
    const svc = step.action || step.service || '';
    if (svc === 'cover.open_cover') return 'Open'; if (svc === 'cover.close_cover') return 'Close';
    if (svc === 'cover.set_cover_position') { const p = step.data?.position; return p === 0 ? 'Close' : p === 100 ? 'Open' : `${p}%`; }
    return null;
  };
  for (const { entity, cfg: a } of Schedules.cache) {
    if (wanted && !wanted.has(entity)) continue;
    const triggers = [].concat(a.triggers || a.trigger || []);
    const enabled = hass.states[entity]?.state === 'on';
    const byId = {}; triggers.forEach((t, i) => { const d = describeTrigger(hass, t); if (d) byId[t.id ?? '#' + i] = d; });
    if (!Object.keys(byId).length) continue;
    const walk = (steps, ids) => {
      for (const s of [].concat(steps || [])) {
        if (!s || typeof s !== 'object') continue;
        if (s.choose) for (const opt of [].concat(s.choose)) { const cond = [].concat(opt.conditions || []).find(c => c.condition === 'trigger'); walk(opt.sequence, cond ? [].concat(cond.id) : ids); }
        for (const k of ['default', 'parallel', 'sequence', 'then', 'else']) if (s[k]) walk(s[k], ids);
        const w = what(s), target = w && who(s);
        if (target) for (const id of (ids || Object.keys(byId))) if (byId[id]) rows.push({ ...byId[id], what: w, target, enabled, automation: entity });
      }
    };
    walk(a.actions || a.action, null);
  }
  // one line per time: "Blackout shades open · Zebra shades 4%"
  const label = r => r.target === 'all' ? (r.what === 'Open' || r.what === 'Close' ? r.what : `Move to ${r.what}`)
    : r.target.map(id => nameOf(hass, id).replace(/^.*? - /, '')).join(' & ') + ' ' + (r.what === 'Open' ? 'open' : r.what === 'Close' ? 'close' : r.what);
  const byTime = new Map();
  for (const r of rows) {
    const k = r.when + '|' + r.days, cur = byTime.get(k) || { ...r, parts: [], kinds: new Set() };
    const l = label(r); if (!cur.parts.includes(l)) cur.parts.push(l); cur.kinds.add(r.what === 'Close' ? 'close' : 'open'); cur.enabled = cur.enabled || r.enabled;
    byTime.set(k, cur);
  }
  let out = [...byTime.values()];
  // same actions on weekdays and weekends -> every day
  const merged = [];
  for (const r of out) {
    const twin = out.find(x => x !== r && x.when === r.when && same(x.parts, r.parts) && [x.days, r.days].sort().join() === 'Weekdays,Weekends');
    if (twin) { if (r.days === 'Weekdays') merged.push({ ...r, days: 'Every day' }); continue; }
    merged.push(r);
  }
  return merged.map(r => ({ ...r, text: r.parts.join(' · '), what: r.kinds.has('close') && !r.kinds.has('open') ? 'Close' : 'Open' })).sort((a, b) => a.sort.localeCompare(b.sort));
}

/* ---------------- shared house style (master edit) ---------------- */
const STYLE_DASH = 'one-stop-cards', SECTION = 'shades';
const Shared = {
  data: null, loading: null, listeners: new Set(), subscribed: false,
  _cache() { try { localStorage.setItem('one-stop-cards-style', JSON.stringify(this.data || {})); } catch (e) {} },
  _readCache() { if (!this.data) { try { const c = JSON.parse(localStorage.getItem('one-stop-cards-style') || 'null'); if (c) this.data = c; } catch (e) {} } },
  get(hass) {
    this._readCache();
    if (!this.loading) this.loading = (async () => {
      let d = {}; try { d = (await hass.callWS({ type: 'lovelace/config', url_path: STYLE_DASH, force: true }))?.one_stop || {}; } catch (e) {}
      const changed = !same(d, this.data); this.data = d; this._cache(); this._subscribe(hass); if (changed) this.listeners.forEach(fn => fn(d)); return d;
    })();
    return this.loading;
  },
  _subscribe(hass) {
    if (this.subscribed || !hass?.connection) return; this.subscribed = true;
    hass.connection.subscribeEvents(async ev => {
      if (ev?.data?.url_path !== STYLE_DASH) return;
      try { this.data = (await hass.callWS({ type: 'lovelace/config', url_path: STYLE_DASH, force: true }))?.one_stop || {}; } catch (e) {}
      this._cache(); this.listeners.forEach(fn => fn(this.data));
    }, 'lovelace_updated').catch(() => {});
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

/* ---------------- icons (inline so nothing extra is needed) ---------------- */
const SHADE_CLOSED = 'M19 2H5a2 2 0 0 0-2 2v2h18V4a2 2 0 0 0-2-2M3 8v12h2V8H3m16 0v12h2V8h-2M7 8v12h10V8H7Z';

/* ---------------- styles ---------------- */
const CSS = `
:host{display:block;--fill:36,111,168}
ha-card{position:relative;overflow:hidden;box-sizing:border-box;padding:var(--pad,18px);border-radius:var(--radius,22px);color:#f7f9fc;font-family:Arial,Helvetica,sans-serif;container:oss/inline-size;
  background:linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.015)),var(--bubble-button-main-background-color,var(--bubble-main-background-color,var(--background-color-2,var(--ha-card-background,var(--card-background-color,var(--secondary-background-color))))));
  border:1px solid rgba(255,255,255,.12);box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 10px 24px rgba(0,0,0,.10);backdrop-filter:blur(18px) saturate(1.1);-webkit-backdrop-filter:blur(18px) saturate(1.1);user-select:none;-webkit-tap-highlight-color:transparent}
ha-card.open{border-color:rgba(var(--fill),.45)}
button{all:unset;box-sizing:border-box;cursor:pointer;-webkit-tap-highlight-color:transparent}
button:focus-visible{outline:2px solid #fff;outline-offset:2px}
button:active{transform:scale(.96)} button[disabled]{opacity:.4;cursor:default}
.hide{display:none!important}
.head{display:flex;align-items:center;flex-wrap:wrap;gap:10px 12px;min-width:0}
.ricon{flex:none;width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:rgba(var(--fill),.18)}
.ricon ha-icon{--mdc-icon-size:28px;color:rgb(var(--fill-light,120,180,230))}
.title{flex:1 1 120px;min-width:0}
.name{font-weight:650;letter-spacing:-.4px;font-size:21px;line-height:1.2;overflow-wrap:anywhere}
.sub{font-size:14px;line-height:18px;color:rgba(235,241,248,.78)}
.chips{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;margin-left:auto}
.chip{display:inline-flex;align-items:center;gap:4px;height:34px;padding:0 10px;border-radius:999px;font-size:15px;font-weight:600;background:rgba(219,93,96,.24);border:1px solid rgba(219,93,96,.45)}
.chip.h{background:rgba(83,145,215,.26);border-color:rgba(83,145,215,.5)}
.chip ha-icon{--mdc-icon-size:18px}
/* generic sliders */
.hs{position:relative;height:var(--h,64px);border-radius:var(--r,18px);overflow:hidden;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.10);cursor:ew-resize;touch-action:none}
.hs .f{position:absolute;inset:0 auto 0 0;width:var(--p,0%);background:rgb(var(--fill));opacity:.9;transition:width .15s}
.hs .l{position:absolute;inset:0;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 16px;pointer-events:none;font-weight:600;font-size:16px;text-shadow:0 1px 2px rgba(0,0,0,.4)}
.hs .l b{font-weight:650}
.vs{position:relative;width:100%;height:var(--vh,220px);border-radius:20px;overflow:hidden;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.10);cursor:ns-resize;touch-action:none}
.vs .f{position:absolute;left:0;right:0;top:0;height:calc(100% - var(--p,0%));background:repeating-linear-gradient(180deg,rgba(220,228,238,.92) 0 14px,rgba(190,200,214,.92) 14px 16px);box-shadow:0 3px 8px rgba(0,0,0,.35);transition:height .15s}
.vs .l{position:absolute;left:0;right:0;bottom:10px;text-align:center;font-weight:650;font-size:18px;pointer-events:none;text-shadow:0 1px 2px rgba(0,0,0,.5)}
.moving .f{transition:none}
/* buttons */
.btns{display:grid;grid-template-columns:repeat(var(--n,3),1fr);gap:8px}
.btn{height:var(--bh,48px);border-radius:16px;display:flex;align-items:center;justify-content:center;gap:6px;font-weight:650;font-size:16px;background:#334b65;border:1px solid #7796b5;box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 2px 5px rgba(0,0,0,.22)}
.btn ha-icon{--mdc-icon-size:22px}
.btn.ghost{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.16)}
.presets{display:grid;grid-template-columns:repeat(var(--pn,3),1fr);gap:8px}
.presets .btn{height:40px;font-size:15px;background:rgba(var(--fill),.22);border-color:rgba(var(--fill),.55)}
.presets .btn.sel{background:rgba(var(--fill),.55)}
/* schedule */
.sched{display:flex;flex-direction:column;gap:6px}
.srow{display:flex;align-items:center;gap:10px;font-size:15px;line-height:19px}
.srow ha-icon{--mdc-icon-size:20px;opacity:.85}
.srow .w{font-weight:650;min-width:72px;white-space:nowrap}
.srow .d{opacity:.72;margin-left:auto;text-align:right;white-space:nowrap}
.srow>span:nth-child(3){flex:1;min-width:0}
.srow.off{opacity:.45}
.stitle{font-size:12px;font-weight:650;letter-spacing:.5px;text-transform:uppercase;opacity:.65}
.timeline{position:relative;height:34px;border-radius:10px;background:linear-gradient(90deg,rgba(20,30,60,.6),rgba(60,110,170,.35) 30%,rgba(120,170,220,.35) 50%,rgba(60,110,170,.35) 70%,rgba(20,30,60,.6));overflow:hidden}
.timeline .mk{position:absolute;top:4px;bottom:4px;width:4px;margin-left:-2px;border-radius:2px;background:#9fd0ff;box-shadow:0 0 6px rgba(160,210,255,.8)}
.timeline .hr{position:absolute;bottom:2px;font-size:10px;opacity:.6;transform:translateX(-50%)}
.timeline .mk.c{background:#ffb36b}
.timeline .tx{position:absolute;top:50%;transform:translate(-50%,-50%);font-size:11px;font-weight:650;padding:2px 5px;border-radius:6px;background:rgba(0,0,0,.45);white-space:nowrap}
.timeline .now{position:absolute;top:0;bottom:0;width:2px;background:rgba(255,80,80,.9)}
.empty{opacity:.7;font-size:14px}
/* ---- layout: bar ---- */
.L-bar .row1{display:flex;align-items:center;gap:10px}
.L-bar .mini{display:flex;gap:6px;flex:none}
.L-bar .mini .btn{width:48px;height:48px;padding:0}
.L-bar .more{margin-top:12px;display:flex;flex-direction:column;gap:8px}
.L-bar .hs{--h:52px}

/* ---- slim bar family ---- */
.SB{position:relative;overflow:hidden}
.SB .row1{position:relative;z-index:1;display:flex;align-items:center;gap:10px}
.SB .title{cursor:pointer}
.SB .name{display:flex;align-items:center;gap:2px}
.SB .name>span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:normal;word-break:normal}
.SB .chev{flex:none;--mdc-icon-size:20px;opacity:.6;transition:transform .2s}
.SB.exp .chev{transform:rotate(180deg)}
.SB [data-nochev] .chev{display:none}
.SB .tmini{flex:none;text-align:right;align-self:center;font-size:13px;line-height:16px;color:rgba(235,241,248,.85);white-space:nowrap}
.SB .tmini b{display:block;font-size:15px;font-weight:650;color:#f7f9fc}
.SB .mini{display:flex;gap:6px;flex:none}
.SB .mini .btn{width:46px;height:46px;padding:0}
.SB .more{position:relative;z-index:1;margin-top:12px;display:flex;flex-direction:column;gap:8px}
.SB .more .hs{--h:52px}
.L-bar_line .pline{position:absolute;left:0;bottom:0;height:5px;width:var(--p,0%);background:rgb(var(--fill));box-shadow:0 0 10px rgba(var(--fill),.8);transition:width .3s}
.L-bar_line .ptrack{position:absolute;left:0;right:0;bottom:0;height:5px;background:rgba(255,255,255,.08)}
.L-bar_fill .bgfill{position:absolute;left:0;top:0;bottom:0;width:var(--p,0%);background:linear-gradient(90deg,rgba(var(--fill),.42),rgba(var(--fill),.62));transition:width .3s}
.L-bar_fill .mini .btn{background:rgba(0,0,0,.25);border-color:rgba(255,255,255,.25)}
.L-bar_pill .seg{flex:none;display:flex;align-items:stretch;height:46px;border-radius:999px;overflow:hidden;background:#334b65;border:1px solid #7796b5;box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 2px 5px rgba(0,0,0,.22)}
.L-bar_pill .seg button{display:flex;align-items:center;justify-content:center;width:46px}
.L-bar_pill .seg button ha-icon{--mdc-icon-size:22px}
.L-bar_pill .seg .mid{width:auto;min-width:62px;padding:0 6px;font-weight:700;font-size:16px;border-left:1px solid rgba(255,255,255,.18);border-right:1px solid rgba(255,255,255,.18);background:linear-gradient(90deg,rgba(var(--fill),.55) var(--p,0%),transparent var(--p,0%))}
@container oss (max-width:420px){.SB.S-standard{--u:.85}.SB.S-large{--u:1.2}.SB.S-extra_large{--u:1.4}}
@container oss (max-width:330px){.SB .tmini span{display:none}}

/* ---- slim bar sizes (scale everything from one variable) ---- */
.SB{--u:1}
.SB.S-standard{--u:1}.SB.S-large{--u:1.35}.SB.S-extra_large{--u:1.7}
.SB.S-large,.SB.S-extra_large{padding:calc(var(--pad,18px) * 1.15)}
.SB .row1{gap:calc(10px * var(--u))}
.SB .ricon{width:calc(44px * var(--u));height:calc(44px * var(--u));border-radius:calc(14px * var(--u))}
.SB .ricon ha-icon{--mdc-icon-size:calc(28px * var(--u))}
.SB .name{font-size:calc(21px * var(--u))}
.SB .sub{font-size:calc(14px * var(--u));line-height:1.3}
.SB .chev{--mdc-icon-size:calc(20px * var(--u))}
.SB .tmini{font-size:calc(13px * var(--u));line-height:1.25}
.SB .tmini b{font-size:calc(15px * var(--u))}
.SB .mini{gap:calc(6px * var(--u))}
.SB .mini .btn{width:calc(46px * var(--u));height:calc(46px * var(--u));border-radius:calc(16px * var(--u))}
.SB .mini .btn ha-icon{--mdc-icon-size:calc(22px * var(--u))}
.SB .more{margin-top:calc(12px * var(--u));gap:calc(8px * var(--u))}
.SB .more .hs{--h:calc(52px * var(--u));--r:calc(16px * var(--u))}
.SB .more .hs .l{font-size:calc(16px * var(--u))}
.L-bar_pill .seg{height:calc(46px * var(--u))}
.L-bar_pill .seg button{width:calc(46px * var(--u))}
.L-bar_pill .seg button ha-icon{--mdc-icon-size:calc(22px * var(--u))}
.L-bar_pill .seg .mid{min-width:calc(62px * var(--u));font-size:calc(16px * var(--u))}
.L-bar_line .pline,.L-bar_line .ptrack{height:calc(5px * var(--u))}

/* Large / Extra large: name + temperature on top, big full-width buttons underneath */
.SB .bigs{position:relative;z-index:1;margin-top:calc(12px * var(--u))}
.SB .bigs .hs{--h:calc(54px * var(--u));--r:calc(18px * var(--u))}
.SB .bigs .hs .l{font-size:calc(17px * var(--u))}
.SB.S-standard .bigs{display:none}
.SB.S-large .row1,.SB.S-extra_large .row1{display:grid;grid-template-columns:auto minmax(0,1fr) auto;grid-template-areas:"i t m" "b b b";row-gap:calc(12px * var(--u))}
.SB.S-large .ricon,.SB.S-extra_large .ricon{grid-area:i}
.SB.S-large .title,.SB.S-extra_large .title{grid-area:t}
.SB.S-large .tmini,.SB.S-extra_large .tmini{grid-area:m}
.SB.S-large .mini,.SB.S-extra_large .mini,.SB.S-large .seg,.SB.S-extra_large .seg{grid-area:b;width:100%}
.SB.S-large .mini,.SB.S-extra_large .mini{display:grid;grid-template-columns:repeat(auto-fit,minmax(0,1fr));gap:calc(8px * var(--u))}
.SB.S-large .mini .btn,.SB.S-extra_large .mini .btn{width:auto;height:calc(70px * var(--u));border-radius:calc(14px * var(--u))}
.SB.S-large .mini .btn ha-icon,.SB.S-extra_large .mini .btn ha-icon{--mdc-icon-size:calc(30px * var(--u))}
.SB.S-large .seg,.SB.S-extra_large .seg{height:calc(70px * var(--u))}
.SB.S-large .seg button ha-icon,.SB.S-extra_large .seg button ha-icon{--mdc-icon-size:calc(30px * var(--u))}
.SB.S-large .seg .mid,.SB.S-extra_large .seg .mid{font-size:calc(20px * var(--u))}
.SB.S-large .seg button,.SB.S-extra_large .seg button{flex:1}
.SB.S-large .seg .mid,.SB.S-extra_large .seg .mid{flex:1.2}

/* ---- light-card look (Large / Extra large slim bar) ---- */
ha-card.SB.LC{transition:background .4s,border-color .4s}
ha-card.SB.LC.open{background:linear-gradient(145deg,rgba(255,255,255,.16),rgba(255,255,255,.035) 48%,rgba(255,255,255,.075)),linear-gradient(rgba(var(--fill),var(--ga,.2)),rgba(var(--fill),calc(var(--ga,.2) * .5))),rgba(28,28,28,.62);
  border-color:rgba(var(--fill),var(--gb,.34));box-shadow:inset 0 1px 0 rgba(255,255,255,.25),inset 0 -1px 0 rgba(255,255,255,.04),0 8px 24px rgba(0,0,0,.16);backdrop-filter:blur(12px) saturate(1.15);-webkit-backdrop-filter:blur(12px) saturate(1.15)}
.SB.LC .ricon{width:44px;height:44px;border-radius:14px;background:rgba(var(--fill),.10)}
.SB.LC .ricon ha-icon{--mdc-icon-size:34px;color:rgb(var(--fill))}
.SB.LC:not(.open) .ricon ha-icon{color:rgba(235,241,248,.7)}
.SB.LC .name{font-size:var(--title,24px)}
.SB.LC .sub{font-size:14px}
.SB.LC .tmini{font-size:14px}.SB.LC .tmini b{font-size:18px}
.SB.LC .row1{row-gap:12px}
.SB.LC .pw{grid-area:b;display:grid;grid-template-columns:repeat(var(--n,3),minmax(0,1fr));gap:8px}
.SB.LC .pbtn{height:var(--bh,76px);border-radius:var(--br,14px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font-weight:650;font-size:17px;line-height:1.2;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.1);transition:transform .12s,filter .12s;background:var(--b-bg);border:var(--b-border);color:#f7f9fc}
.SB.LC .pbtn ha-icon{--mdc-icon-size:30px}
.SB.LC .pbtn.o{--b-bg:var(--on-bg);--b-border:var(--on-border);color:var(--on-fg,#f7f9fc)}
.SB.LC .pbtn.c{--b-bg:var(--off-bg);--b-border:var(--off-border);color:var(--off-fg,#f7f9fc)}
.SB.LC .pbtn.s{--b-bg:rgba(255,255,255,.08);--b-border:1px solid rgba(255,255,255,.2)}
.SB.LC .bigs{margin-top:12px}
.SB.LC .hs{--h:var(--slh,58px);--r:var(--slr,18px);background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.10);box-shadow:inset 0 1px 0 rgba(255,255,255,.05)}
.SB.LC .more .hs{--h:calc(var(--slh,58px) - 4px)}
.SB.LC.noicon .row1{grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"t m" "b b"}
.SB.LC.noicon .ricon{display:none}
.SB.LC .hs .f{background:rgb(var(--fill));opacity:.55;border-radius:inherit;transition:width .12s ease-out}
.SB.LC .hs .l{justify-content:flex-start;gap:10px;padding:0 18px;font-size:16px;text-shadow:0 1px 2px rgba(0,0,0,.35)}
.SB.LC .hs .l ha-icon{--mdc-icon-size:24px}
.SB.LC .hs .l b{margin-left:auto}
.SB.LC .more{margin-top:12px;gap:8px}
/* ---- layout: slide ---- */
.L-slide{padding:0!important}
.L-slide .big{--h:100%;position:relative;border-radius:inherit;border:0;min-height:132px;background:transparent}
.L-slide .big .f{opacity:.55}
.L-slide .over{position:absolute;inset:0;padding:var(--pad,18px);display:flex;flex-direction:column;justify-content:space-between;pointer-events:none}
.L-slide .over .head,.L-slide .over .dots{pointer-events:auto}
.L-slide .pct{font-size:34px;font-weight:700;letter-spacing:-1px}
.L-slide .dots{display:flex;gap:8px;align-items:center}
.L-slide .dot{height:34px;padding:0 12px;border-radius:999px;font-size:14px;font-weight:650;display:flex;align-items:center;background:rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.22)}
.L-slide .drawer{padding:0 var(--pad,18px) var(--pad,18px);display:flex;flex-direction:column;gap:8px}
/* ---- layout: tile ---- */
.L-tile .tilegrid{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;margin-top:10px}
.L-tile .pct{font-size:46px;font-weight:700;letter-spacing:-1.5px;line-height:1}
.L-tile .pct small{font-size:16px;font-weight:600;opacity:.75;letter-spacing:0;display:block;margin-top:4px}
.L-tile .ud{display:flex;flex-direction:column;gap:8px}
.L-tile .ud .btn{width:64px;height:52px}
.L-tile .glass{height:12px;border-radius:6px;background:rgba(255,255,255,.1);overflow:hidden;margin-top:12px}
.L-tile .glass i{display:block;height:100%;width:var(--p,0%);background:rgb(var(--fill));transition:width .2s}
.L-tile .list{margin-top:12px;display:flex;flex-direction:column;gap:8px}
.L-tile .hs{--h:46px}
/* ---- layout: window ---- */
.L-window .wgrid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:18px;margin-top:14px}
@container oss (max-width:560px){.L-window .wgrid{grid-template-columns:1fr}}
.L-window .frame{position:relative;border-radius:18px;padding:12px;background:linear-gradient(#3a4656,#2b3542);box-shadow:inset 0 0 0 3px rgba(255,255,255,.18)}
.L-window .panes{display:grid;grid-template-columns:repeat(var(--panes,1),1fr);gap:10px}
.L-window .pane{position:relative;border-radius:10px;overflow:hidden;height:250px;background:linear-gradient(#8fc3ee,#cfe6f7 55%,#9ccb8a 56%,#7fb06e);cursor:ns-resize;touch-action:none}
.L-window .pane .f{position:absolute;left:0;right:0;top:0;height:calc(100% - var(--p,0%));background:repeating-linear-gradient(180deg,#e9edf2 0 18px,#cfd6df 18px 20px);box-shadow:0 4px 10px rgba(0,0,0,.35);transition:height .2s}
.L-window .pane .f::after{content:'';position:absolute;left:50%;bottom:-14px;width:4px;height:14px;margin-left:-2px;background:#cfd6df}
.L-window .pane .cap{position:absolute;left:8px;right:8px;bottom:8px;text-align:center;font-size:13px;font-weight:650;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.6);pointer-events:none}
.L-window .moving .f{transition:none}
.L-window .side{display:flex;flex-direction:column;gap:14px}
.L-window .big{font-size:52px;font-weight:700;letter-spacing:-1.5px;line-height:1}
/* ---- layout: panel ---- */
.L-panel .body{display:flex;flex-direction:column;gap:12px;margin-top:14px}
.L-panel .hs.master{--h:80px;--r:22px}
.L-panel .hs.master .l{font-size:18px}
.L-panel .sect{display:flex;flex-direction:column;gap:8px;padding-top:4px}
/* ---- layout: columns ---- */
.L-columns .cgrid{display:grid;grid-template-columns:minmax(200px,.9fr) minmax(0,1.6fr);gap:18px;margin-top:14px}
@container oss (max-width:560px){.L-columns .cgrid{grid-template-columns:1fr}}
.L-columns .gauge{position:relative;aspect-ratio:1;max-width:240px;width:100%;margin:0 auto;border-radius:50%;background:conic-gradient(rgb(var(--fill)) var(--deg,0deg),rgba(255,255,255,.09) 0);display:flex;align-items:center;justify-content:center;transition:background .2s}
.L-columns .gauge::before{content:'';position:absolute;inset:16px;border-radius:50%;background:rgba(20,24,30,.92)}
.L-columns .gauge .in{position:relative;text-align:center}
.L-columns .gauge .in b{display:block;font-size:44px;letter-spacing:-1px}
.L-columns .gauge .in span{font-size:14px;opacity:.75}
.L-columns .cols{display:grid;grid-template-columns:repeat(var(--cn,2),minmax(0,1fr));gap:12px}
.L-columns .col{display:flex;flex-direction:column;gap:8px;align-items:stretch;min-width:0}
.L-columns .col .cn{font-size:14px;font-weight:600;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.L-columns .left{display:flex;flex-direction:column;gap:12px}
@container oss (max-width:380px){
  .chips{width:100%;justify-content:flex-start;margin-left:0}
  .srow{flex-wrap:wrap;row-gap:0}.srow .d{width:100%;margin-left:30px;text-align:left;font-size:13px}
  .name{font-size:19px}.L-tile .pct{font-size:40px}.btn{font-size:15px}.btn ha-icon{--mdc-icon-size:20px}
  .btns .btn span{display:none}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
`;

/* ---------------- the card ---------------- */
class OneStopShadesCard extends HTMLElement {
  static getConfigElement() { return document.createElement(EDITOR_TAG); }
  static getStubConfig(hass) {
    const covers = Object.keys(hass?.states || {}).filter(id => id.startsWith('cover.') && !SKIP_CLASSES.includes(hass.states[id].attributes?.device_class));
    const a = covers.map(id => areaOf(hass, id)).find(Boolean);
    return a ? { area: a } : {};
  }
  setConfig(config) {
    if (!config) throw new Error('Invalid configuration');
    this._raw = { ...config }; this._merge();
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._built = false; this._expanded = this._expanded || false;
    if (this._hass) this._render();
  }
  _merge() { Shared._readCache(); const rl = (Shared.data || {}).room_lights || {}, look = {}; for (const k of ['on_color', 'off_color', 'button_tint', 'title_size', 'corners', 'font', 'button_style', 'slider_size', 'show_icon']) if (k in rl) look[k] = rl[k]; this._cfg = { ...DEFAULTS, ...look, ...((Shared.data || {})[SECTION] || {}), ...this._raw }; }
  connectedCallback() {
    this._onShared = () => { const b = JSON.stringify(this._cfg); this._merge(); if (JSON.stringify(this._cfg) === b && this._built) return; this._built = false; if (this._hass) this._render(); };
    Shared.listeners.add(this._onShared);
  }
  disconnectedCallback() { Shared.listeners.delete(this._onShared); }
  set hass(hass) {
    const first = !this._hass; this._hass = hass;
    if (first) { Shared.get(hass); if (this._cfg.show_schedule) Schedules.load(hass).then(() => this._update()); }
    if (!this._built) this._render(); else this._update();
  }
  getCardSize() { return /^bar|slide|tile/.test(this._cfg?.layout || '') ? 2 : 7; }
  getGridOptions() { return { columns: 12, rows: 'auto', min_columns: 12 }; }

  _areaName() { return this._hass?.areas?.[this._cfg.area]?.name || titleCase(this._cfg.area); }
  _title() { return this._cfg.name || this._areaName(); }
  _model() {
    const h = this._hass, c = this._cfg;
    const shades = roomShades(h, c), master = masterShade(h, c, shades);
    const targets = master ? [master] : shades;
    const positions = shades.map(id => posOf(h.states[id])).filter(p => p != null);
    const mpos = master ? posOf(h.states[master]) : positions.length ? Math.round(positions.reduce((a, b) => a + b, 0) / positions.length) : null;
    const moving = [master, ...shades].some(id => ['opening', 'closing'].includes(h.states[id]?.state));
    const devs = new Set([master, ...shades].map(id => h.entities?.[id]?.device_id).filter(Boolean));
    const covers = new Set([master, ...shades].filter(Boolean));
    for (const id of [master].filter(Boolean)) for (const m of h.states[id]?.attributes?.entity_id || []) covers.add(m);
    return { shades, master, targets, mpos, moving, temp: sensorFor(h, c, 'temperature'), hum: sensorFor(h, c, 'humidity'), covers, devs };
  }

  /* ---- shared building blocks ---- */
  _chips(m) {
    if (!this._cfg.show_climate) return '';
    const h = this._hass, out = [];
    const fmt = (id, unit) => { const st = h.states[id]; if (!live(st)) return '—'; const v = parseFloat(st.state); return Number.isFinite(v) ? (Math.round(v * 10) / 10) + (unit || st.attributes.unit_of_measurement || '') : st.state; };
    if (m.temp) out.push(`<span class="chip" data-chip="t"><ha-icon icon="mdi:thermometer"></ha-icon><span>${esc(fmt(m.temp))}</span></span>`);
    if (m.hum) out.push(`<span class="chip h" data-chip="h"><ha-icon icon="mdi:water-percent"></ha-icon><span>${esc(fmt(m.hum, '%'))}</span></span>`);
    return out.length ? `<div class="chips">${out.join('')}</div>` : '';
  }
  _tmini(m) {
    if (!this._cfg.show_climate || (!m.temp && !m.hum)) return '';
    return `<div class="tmini">${m.temp ? '<b data-tm="t"></b>' : ''}${m.hum ? '<span data-tm="h"></span>' : ''}</div>`;
  }
  _head(m, sub = true, extra = '') {
    return `<div class="head"><div class="ricon"><ha-icon icon="${esc(this._cfg.room_icon || 'mdi:roller-shade')}"></ha-icon></div>
      <div class="title"><div class="name">${esc(this._title())}</div>${sub ? '<div class="sub" data-sub></div>' : ''}</div>${extra}${this._chips(m)}</div>`;
  }
  _hslider(id, label, cls = '', icon = '') { return `<div class="hs ${cls}" data-slide="${esc(id)}" data-axis="x"><div class="f"></div><div class="l">${icon ? `<ha-icon icon="${icon}"></ha-icon>` : ''}<span>${esc(label)}</span><b data-pct></b></div></div>`; }
  _buttons(n = 3, ghost = false) {
    const c = this._cfg, parts = [`<button class="btn ${ghost ? 'ghost' : ''}" data-cmd="close"><ha-icon icon="mdi:window-shutter"></ha-icon><span>${esc(c.close_word)}</span></button>`];
    if (c.show_stop) parts.push(`<button class="btn ${ghost ? 'ghost' : ''}" data-cmd="stop"><ha-icon icon="mdi:stop-circle-outline"></ha-icon><span>Stop</span></button>`);
    parts.push(`<button class="btn ${ghost ? 'ghost' : ''}" data-cmd="open"><ha-icon icon="mdi:window-shutter-open"></ha-icon><span>${esc(c.open_word)}</span></button>`);
    return `<div class="btns" style="--n:${parts.length}">${parts.join('')}</div>`;
  }
  _presets() {
    const c = this._cfg; if (!c.show_presets) return '';
    const ps = [c.preset_1, c.preset_2, c.preset_3].map(Number).filter(v => Number.isFinite(v) && v > 0 && v < 100);
    return ps.length ? `<div class="presets" style="--pn:${ps.length}">${ps.map(v => `<button class="btn" data-preset="${v}">${v}%</button>`).join('')}</div>` : '';
  }
  _individual(m, kind = 'h') {
    if (!this._cfg.show_individual || m.shades.length < 2 && m.master == null) return '';
    if (!m.shades.length) return '';
    return m.shades.map(id => kind === 'v'
      ? `<div class="col"><div class="vs" data-slide="${esc(id)}" data-axis="y"><div class="f"></div><div class="l" data-pct></div></div><div class="cn">${esc(nameOf(this._hass, id))}</div></div>`
      : this._hslider(id, shortName(this._hass, id, this._cfg.area))).join('');
  }
  _sched() { return this._cfg.show_schedule ? `<div class="sect" data-sched></div>` : ''; }

  _render() {
    const c = this._cfg, R = this.shadowRoot;
    if (!c.area && !c.master_shade && !(c.extra_shades || []).length) { R.innerHTML = `<style>${CSS}</style><ha-card style="padding:16px">Pick a room in the card editor.</ha-card>`; return; }
    const m = this._model();
    const fill = okRgb(c.fill_color) ? c.fill_color : DEFAULTS.fill_color;
    const vars = [`--fill:${fill.join(',')}`, `--fill-light:${fill.map(v => Math.min(255, v + 90)).join(',')}`,
      `--radius:${{ square: '8px', rounded: '22px', extra_round: '32px' }[c.corners] || '22px'}`,
      `--pad:${{ compact: '12px', standard: '18px', roomy: '24px' }[c.card_spacing] || '18px'}`].join(';');
    const L = c.layout in LAYOUTS ? c.layout : 'bar';
    const lift = (col, n) => col.map(v => Math.min(255, v + n)), tintA = { very_soft: .28, soft: .44, medium: .60, bold: .80 }[c.button_tint] || .44;
    const onC = okRgb(c.on_color) ? c.on_color : DEFAULTS.on_color, offC = okRgb(c.off_color) ? c.off_color : DEFAULTS.off_color;
    const look = (col, a) => ({ tinted: [rgba(col, a), `1px solid ${rgba(lift(col, 60), .7)}`, '#f7f9fc'], solid: [rgba(col, 1), `1px solid ${rgba(lift(col, 40), .9)}`, '#fff'],
      outline: ['transparent', `2px solid ${rgba(lift(col, 70), .95)}`, rgba(lift(col, 90), 1)], glass: ['rgba(255,255,255,.08)', '1px solid rgba(255,255,255,.2)', rgba(lift(col, 90), 1)] }[c.button_style] || [rgba(col, a), `1px solid ${rgba(lift(col, 60), .7)}`, '#f7f9fc']);
    const oL = look(onC, tintA), cL = look(offC, tintA + .02);
    const lcVars = [`--on-bg:${oL[0]}`, `--on-border:${oL[1]}`, `--on-fg:${oL[2]}`, `--off-bg:${cL[0]}`, `--off-border:${cL[1]}`, `--off-fg:${cL[2]}`, `--slh:${{ thin: 46, standard: 58, thick: 72 }[c.slider_size] || 58}px`,
      `--title:${{ small: '17px', medium: '21px', large: '24px', extra_large: '28px' }[c.title_size] || '24px'}`,
      `--bh:${c.size === 'extra_large' ? 88 : 76}px`, `--br:${c.corners === 'extra_round' ? '22px' : c.corners === 'square' ? '6px' : '14px'}`,
      `--slr:${c.corners === 'square' ? '8px' : c.corners === 'extra_round' ? '999px' : '18px'}`].join(';');
    const LCc = L === 'bar' && (c.size || 'large') !== 'standard' ? ' LC' : '';
    let body = '';
    if (L.startsWith('bar')) {
      const tm = this._tmini(m);
      const big = (c.size || 'large') !== 'standard' && L === 'bar';
      const btns = big
        ? `<div class="pw" style="--n:${c.show_stop ? 3 : 2}"><button class="pbtn c" data-cmd="close"><ha-icon icon="mdi:window-shutter"></ha-icon><span>${esc(c.close_word)}</span></button>${c.show_stop ? '<button class="pbtn s" data-cmd="stop"><ha-icon icon="mdi:pause"></ha-icon><span>Stop</span></button>' : ''}<button class="pbtn o" data-cmd="open"><ha-icon icon="mdi:window-shutter-open"></ha-icon><span>${esc(c.open_word)}</span></button></div>`
        : L === 'bar_pill'
        ? `<div class="seg"><button data-cmd="close" aria-label="Close"><ha-icon icon="mdi:arrow-down"></ha-icon></button><button class="mid" data-cmd="stop" aria-label="Stop" data-pct></button><button data-cmd="open" aria-label="Open"><ha-icon icon="mdi:arrow-up"></ha-icon></button></div>`
        : `<div class="mini"><button class="btn" data-cmd="close" aria-label="Close"><ha-icon icon="mdi:arrow-down"></ha-icon></button>${c.show_stop ? '<button class="btn ghost" data-cmd="stop" aria-label="Stop"><ha-icon icon="mdi:stop"></ha-icon></button>' : ''}<button class="btn" data-cmd="open" aria-label="Open"><ha-icon icon="mdi:arrow-up"></ha-icon></button></div>`;
      const inner = m.shades.length > 1 && c.show_individual ? this._individual(m) : this._hslider(m.master || 'all', m.shades.length === 1 ? nameOf(this._hass, m.shades[0]) : 'All shades');
      body = `${L === 'bar_fill' ? '<div class="bgfill"></div>' : ''}${L === 'bar_line' ? '<div class="ptrack"></div><div class="pline"></div>' : ''}
        <div class="row1"><div class="ricon"><ha-icon icon="${esc(c.room_icon || 'mdi:roller-shade')}"></ha-icon></div>
        <div class="title" data-toggle role="button" aria-expanded="${this._expanded}" ${(c.size || 'large') !== 'standard' && !(m.shades.length > 1 && c.show_individual) && !c.show_presets && !c.show_schedule ? 'data-nochev' : ''}><div class="name"><span>${esc(this._title())}</span><ha-icon class="chev" icon="mdi:chevron-down"></ha-icon></div><div class="sub" data-sub></div></div>
        ${tm}${btns}</div>
        <div class="bigs">${this._hslider(m.master || 'all', m.shades.length > 1 ? 'All shades' : 'Shade', '', 'mdi:roller-shade')}</div>
        <div class="more ${this._expanded ? '' : 'hide'}" data-more>${(c.size || 'large') === 'standard' ? inner : (m.shades.length > 1 && c.show_individual ? this._individual(m) : '')}${this._presets()}${this._sched()}</div>`;
    } else if (L === 'slide') {
      body = `<div class="hs big" data-slide="${esc(m.master || 'all')}" data-axis="x"><div class="f"></div></div>
        <div class="over">${this._head(m, false)}<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:10px"><div><div class="pct" data-pct></div><div class="sub" data-sub></div></div>
        <div class="dots">${c.show_presets ? [c.preset_1, c.preset_2, c.preset_3].map(Number).filter(v => v > 0 && v < 100).map(v => `<button class="dot" data-preset="${v}">${v}%</button>`).join('') : ''}<button class="dot" data-toggle aria-label="More"><ha-icon icon="mdi:chevron-down" style="--mdc-icon-size:20px"></ha-icon></button></div></div></div>`;
      body = `<div style="position:relative">${body}</div><div class="drawer ${this._expanded ? '' : 'hide'}" data-more style="padding-top:14px">${this._buttons(3, true)}${this._individual(m)}${this._sched()}</div>`;
    } else if (L === 'tile') {
      body = `${this._head(m, false)}<div class="tilegrid"><div class="pct" data-pct></div><div class="ud"><button class="btn" data-cmd="open" aria-label="Open"><ha-icon icon="mdi:chevron-up"></ha-icon></button><button class="btn" data-cmd="close" aria-label="Close"><ha-icon icon="mdi:chevron-down"></ha-icon></button></div></div>
        <div class="glass"><i data-bar></i></div><div class="sub" data-sub style="margin-top:6px"></div>
        ${this._presets() ? `<div style="margin-top:12px">${this._presets()}</div>` : ''}
        ${m.shades.length > 1 && c.show_individual ? `<button class="btn ghost" data-toggle style="width:100%;margin-top:10px;height:40px">Each shade</button><div class="list ${this._expanded ? '' : 'hide'}" data-more>${this._individual(m)}</div>` : ''}
        ${c.show_schedule ? `<div style="margin-top:12px">${this._sched()}</div>` : ''}`;
    } else if (L === 'window') {
      const panes = m.shades.length ? m.shades : [m.master || 'all'];
      body = `${this._head(m)}<div class="wgrid"><div class="frame"><div class="panes" style="--panes:${panes.length}">${panes.map(id => `<div class="pane" data-slide="${esc(id)}" data-axis="y"><div class="f"></div><div class="cap">${esc(panes.length > 1 ? nameOf(this._hass, id) : 'Drag the shade')}</div></div>`).join('')}</div></div>
        <div class="side"><div><div class="big" data-pct></div><div class="sub" data-sub></div></div>${this._buttons()}${this._presets()}${this._sched()}</div></div>`;
    } else if (L === 'panel') {
      body = `${this._head(m)}<div class="body">${this._hslider(m.master || 'all', m.shades.length > 1 ? 'All shades' : 'Shade', 'master')}${this._buttons()}${this._presets()}
        ${m.shades.length > 1 && c.show_individual ? `<div class="sect"><div class="stitle">Each shade</div>${this._individual(m)}</div>` : ''}${this._sched()}</div>`;
    } else if (L === 'columns') {
      const cols = m.shades.length ? m.shades : [m.master || 'all'];
      body = `${this._head(m)}<div class="cgrid"><div class="left"><div class="gauge" data-gauge><div class="in"><b data-pct></b><span data-sub></span></div></div>${this._buttons(3)}${this._presets()}</div>
        <div class="left"><div class="cols" style="--cn:${Math.min(cols.length, 4)}">${cols.map(id => `<div class="col"><div class="vs" data-slide="${esc(id)}" data-axis="y"><div class="f"></div><div class="l" data-pct-of="${esc(id)}"></div></div><div class="cn">${esc(cols.length > 1 ? nameOf(this._hass, id) : 'All shades')}</div></div>`).join('')}</div>${this._sched()}</div></div>`;
    }
    R.innerHTML = `<style>${CSS}</style><ha-card class="L-${L} ${L.startsWith('bar') ? 'SB S-' + (c.size || 'large') : ''}${LCc}${LCc && c.show_icon === false ? ' noicon' : ''} ${this._expanded ? 'exp' : ''}" style="${vars};${lcVars}">${body}</ha-card>`;
    this._wire();
    this._built = true;
    this._update();
  }

  _wire() {
    const R = this.shadowRoot;
    R.querySelectorAll('[data-cmd]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); this._cmd(b.dataset.cmd); }));
    R.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); this._setPos('all', +b.dataset.preset); }));
    R.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); this._expanded = !this._expanded; R.querySelectorAll('[data-more]').forEach(x => x.classList.toggle('hide', !this._expanded)); R.querySelector('ha-card')?.classList.toggle('exp', this._expanded); b.setAttribute?.('aria-expanded', this._expanded); }));
    R.querySelectorAll('[data-slide]').forEach(el => this._drag(el));
  }
  _drag(el) {
    const id = el.dataset.slide, axis = el.dataset.axis;
    let active = false, val = null;
    const frac = e => { const r = el.getBoundingClientRect(); return axis === 'y' ? 1 - Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)) : Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); };
    const show = v => { el.style.setProperty('--p', v + '%'); const t = el.querySelector('[data-pct]') || this.shadowRoot.querySelector(`[data-pct-of="${window.CSS?.escape ? window.CSS.escape(id) : id}"]`); if (t) t.textContent = v + '%'; if (el.classList.contains('big')) { const p = this.shadowRoot.querySelector('.L-slide [data-pct]'); if (p) p.textContent = v + '%'; } };
    el.addEventListener('pointerdown', e => { if (el.classList.contains('dis')) return; active = true; el.setPointerCapture?.(e.pointerId); el.classList.add('moving'); el._drag = true; val = Math.round(frac(e) * 100); show(val); e.preventDefault(); e.stopPropagation(); });
    el.addEventListener('pointermove', e => { if (!active) return; val = Math.round(frac(e) * 100); show(val); });
    const end = e => { if (!active) return; active = false; el.classList.remove('moving'); val = Math.round(frac(e) * 100); show(val); this._setPos(id, val); setTimeout(() => { el._drag = false; }, 2500); };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', () => { active = false; el._drag = false; el.classList.remove('moving'); });
  }
  _ids(id) { const m = this._model(); return id === 'all' ? m.targets : [id]; }
  async _call(service, data) { try { await this._hass.callService('cover', service, data); } catch (e) { console.warn('One Stop Shades:', e?.message || e); } }
  _cmd(cmd) {
    const t = this._ids('all').filter(id => live(this._hass.states[id])); if (!t.length) return;
    this._call({ open: 'open_cover', close: 'close_cover', stop: 'stop_cover' }[cmd], { entity_id: t });
  }
  _setPos(id, v) {
    const t = this._ids(id).filter(x => live(this._hass.states[x])); if (!t.length) return;
    this._call('set_cover_position', { entity_id: t, position: Math.max(0, Math.min(100, Math.round(v))) });
  }

  _update() {
    const h = this._hass, R = this.shadowRoot; if (!h || !this._built) return;
    const m = this._model(), c = this._cfg;
    const card = R.querySelector('ha-card'); if (!card) return;
    card.classList.toggle('open', (m.mpos || 0) > 0 && c.open_glow !== 'off');
    const mst = m.master ? h.states[m.master] : m.shades.length ? h.states[m.shades[0]] : null;
    const word = m.moving ? (h.states[m.master]?.state === 'closing' ? 'Closing…' : 'Opening…') : m.mpos == null ? '—' : m.mpos === 0 ? 'Closed' : m.mpos === 100 ? 'Open' : `${m.mpos}% open`;
    R.querySelectorAll('[data-sub]').forEach(e => { e.textContent = word; });
    for (const el of R.querySelectorAll('[data-slide]')) {
      if (el._drag) continue;
      const id = el.dataset.slide, p = id === 'all' ? m.mpos : posOf(h.states[id]);
      el.style.setProperty('--p', (p ?? 0) + '%');
      el.classList.toggle('dis', id !== 'all' && !live(h.states[id]));
      const t = el.querySelector('[data-pct]'); if (t) t.textContent = p == null ? '—' : p + '%';
      const t2 = R.querySelector(`[data-pct-of="${id}"]`); if (t2) t2.textContent = p == null ? '—' : p + '%';
    }
    const anyDrag = [...R.querySelectorAll('[data-slide]')].some(e => e._drag);
    if (!anyDrag) R.querySelectorAll('.big[data-pct], .pct[data-pct], .in [data-pct]').forEach(e => { e.textContent = m.mpos == null ? '—' : m.mpos + '%'; });
    card.style.setProperty('--p', (m.mpos || 0) + '%');
    { const g = { subtle: [.06, .16], normal: [.12, .30], strong: [.2, .45] }[c.open_glow] || [.12, .30], f = (m.mpos || 0) / 100;
      card.style.setProperty('--ga', (g[0] + (g[1] - g[0]) * f).toFixed(3)); card.style.setProperty('--gb', (.22 + .2 * f).toFixed(3)); }
    R.querySelectorAll('.seg .mid[data-pct]').forEach(e => { e.textContent = m.moving ? '■' : m.mpos == null ? '—' : m.mpos + '%'; e.style.setProperty('--p', (m.mpos || 0) + '%'); });
    const tmT = R.querySelector('[data-tm=t]'), tmH = R.querySelector('[data-tm=h]');
    const fmt0 = (id, unit) => { const st = h.states[id]; if (!live(st)) return '—'; const v = parseFloat(st.state); return Number.isFinite(v) ? (Math.round(v * 10) / 10) + (unit || st.attributes.unit_of_measurement || '') : st.state; };
    if (tmT && m.temp) { const st = h.states[m.temp], v = parseFloat(st?.state); tmT.textContent = Number.isFinite(v) ? (Math.round(v * 10) / 10) + '°' : '—'; } if (tmH && m.hum) { const v = parseFloat(h.states[m.hum]?.state); tmH.textContent = Number.isFinite(v) ? Math.round(v) + '% RH' : '—'; }
    const gauge = R.querySelector('[data-gauge]'); if (gauge) gauge.style.setProperty('--deg', ((m.mpos || 0) * 3.6) + 'deg');
    const bar = R.querySelector('[data-bar]'); if (bar) bar.style.setProperty('--p', (m.mpos || 0) + '%');
    R.querySelectorAll('[data-preset]').forEach(b => b.classList.toggle('sel', +b.dataset.preset === m.mpos));
    const fmt = (id, unit) => { const st = h.states[id]; if (!live(st)) return '—'; const v = parseFloat(st.state); return Number.isFinite(v) ? (Math.round(v * 10) / 10) + (unit || st.attributes.unit_of_measurement || '') : st.state; };
    const tc = R.querySelector('[data-chip=t] span'); if (tc && m.temp) tc.textContent = fmt(m.temp);
    const hc = R.querySelector('[data-chip=h] span'); if (hc && m.hum) hc.textContent = fmt(m.hum, '%');
    const cmdOk = m.targets.some(id => live(h.states[id]));
    R.querySelectorAll('[data-cmd]').forEach(b => { b.disabled = !cmdOk; });
    const sb = R.querySelector('[data-sched]');
    if (sb) {
      const rows = scheduleFor(h, c, m.covers, m.devs, m.shades);
      const key = JSON.stringify(rows);
      if (key !== sb._key) {
        sb._key = key;
        if (rows == null) sb.innerHTML = `<div class="stitle">Schedule</div><div class="empty">Loading…</div>`;
        else if (!rows.length) sb.innerHTML = `<div class="stitle">Schedule</div><div class="empty">No automatic open or close times found.</div>`;
        else {
          const toMin = s => { const mm = /(\d+):(\d+)/.exec(s); return mm ? (+mm[1]) * 60 + (+mm[2]) : null; };
          const marks = rows.map(r => ({ r, m: toMin(r.sort) })).filter(x => x.m != null);
          const now = new Date(), nm = now.getHours() * 60 + now.getMinutes();
          const timeline = this._cfg.layout === 'panel' || this._cfg.layout === 'columns'
            ? `<div class="timeline">${marks.map(x => `<div class="mk ${x.r.what === 'Close' ? 'c' : ''}" style="left:${x.m / 14.4}%"></div>`).join('')}<div class="now" style="left:${nm / 14.4}%"></div>${[6, 12, 18].map(h => `<span class="hr" style="left:${h / .24}%">${h === 12 ? '12 PM' : h < 12 ? h + ' AM' : (h - 12) + ' PM'}</span>`).join('')}</div>` : '';
          sb.innerHTML = `<div class="stitle">Schedule</div>${timeline}${rows.slice(0, 6).map(r => `<div class="srow ${r.enabled ? '' : 'off'}"><ha-icon icon="${r.what === 'Close' ? 'mdi:window-shutter' : 'mdi:window-shutter-open'}"></ha-icon><span class="w">${esc(r.when)}</span><span>${esc(r.text)}</span><span class="d">${esc(r.days)}${r.enabled ? '' : ' · paused'}</span></div>`).join('')}`;
        }
      }
    }
  }
}

/* ---------------- visual editor ---------------- */
const sel = opts => ({ select: { mode: 'dropdown', options: opts.map(([value, label]) => ({ value, label })) } });
const toggle = { boolean: {} };
const pct = { number: { min: 5, max: 95, step: 5, mode: 'slider', unit_of_measurement: '%' } };
const schema = d => {
  const grid = items => ({ type: 'grid', name: '', flatten: true, schema: items });
  const section = (name, title, icon, items) => ({ name, type: 'expandable', flatten: true, title, icon, schema: items });
  return [
    { name: 'area', selector: { area: {} } },
    grid([{ name: 'name', selector: { text: {} } }, { name: 'room_icon', selector: { icon: {} } }]),
    { name: 'layout', selector: sel(Object.entries(LAYOUTS).filter(([k]) => k.startsWith('bar') || k === d.layout)) },
    { name: 'size', selector: sel([['standard', 'Standard'], ['large', 'Large'], ['extra_large', 'Extra large']]) },
    section('g_shades', 'Which shades', 'mdi:roller-shade', [
      { name: 'master_shade', selector: { entity: { filter: { domain: 'cover' } } } },
      { name: 'extra_shades', selector: { entity: { multiple: true, filter: { domain: 'cover' } } } },
      { name: 'hide_shades', selector: { entity: { multiple: true, filter: { domain: 'cover' } } } },
    ]),
    section('g_show', 'What to show', 'mdi:eye-outline', [grid([
      { name: 'show_climate', selector: toggle }, { name: 'show_individual', selector: toggle },
      { name: 'show_presets', selector: toggle }, { name: 'show_stop', selector: toggle },
      { name: 'show_schedule', selector: toggle },
    ])]),
    section('g_climate', 'Temperature and humidity', 'mdi:thermometer', [
      { name: 'temperature_sensor', selector: { entity: { filter: { domain: 'sensor', device_class: 'temperature' } } } },
      { name: 'humidity_sensor', selector: { entity: { filter: { domain: 'sensor', device_class: 'humidity' } } } },
    ]),
    section('g_presets', 'Quick position buttons', 'mdi:format-list-numbered', [grid([
      { name: 'preset_1', selector: pct }, { name: 'preset_2', selector: pct }, { name: 'preset_3', selector: pct },
    ])]),
    section('g_schedule', 'Schedule', 'mdi:clock-outline', [
      { name: 'schedule_automations', selector: { entity: { multiple: true, filter: { domain: 'automation' } } } },
    ]),
    section('g_look', 'Look and words', 'mdi:palette-outline', [grid([
      { name: 'fill_color', selector: { color_rgb: {} } },
      { name: 'show_icon', selector: toggle },
      { name: 'button_style', selector: sel([['tinted', 'Tinted'], ['solid', 'Solid'], ['outline', 'Outline'], ['glass', 'Glass']]) },
      { name: 'slider_size', selector: sel([['thin', 'Thin'], ['standard', 'Standard'], ['thick', 'Thick']]) },
      { name: 'open_glow', selector: sel([['off', 'No glow'], ['subtle', 'Subtle'], ['normal', 'Normal'], ['strong', 'Strong']]) },
      { name: 'on_color', selector: { color_rgb: {} } }, { name: 'off_color', selector: { color_rgb: {} } },
      { name: 'button_tint', selector: sel([['very_soft', 'Very soft'], ['soft', 'Soft'], ['medium', 'Medium'], ['bold', 'Bold']]) },
      { name: 'title_size', selector: sel([['small', 'Small'], ['medium', 'Medium'], ['large', 'Large'], ['extra_large', 'Extra large']]) },
      { name: 'corners', selector: sel([['square', 'Square'], ['rounded', 'Rounded'], ['extra_round', 'Extra round']]) },
      { name: 'card_spacing', selector: sel([['compact', 'Compact'], ['standard', 'Standard'], ['roomy', 'Roomy']]) },
      { name: 'open_word', selector: { text: {} } }, { name: 'close_word', selector: { text: {} } },
    ])]),
  ];
};
const LABELS = {
  edit_all: 'Master edit – change all Shades cards at once', reset_style: 'Use the shared style on this card (clear its own changes)',
  area: 'Room', name: 'Card title', room_icon: 'Room icon', layout: 'Layout', size: 'Size',
  master_shade: 'Main shade or shade group (controls them all)', extra_shades: 'Add shades from other rooms', hide_shades: 'Leave these shades out',
  show_climate: 'Temperature & humidity', show_individual: 'Each shade’s own slider', show_presets: 'Quick position buttons', show_stop: 'Stop button', show_schedule: 'Open / close times',
  temperature_sensor: 'Temperature sensor', humidity_sensor: 'Humidity sensor',
  preset_1: 'Button 1', preset_2: 'Button 2', preset_3: 'Button 3',
  schedule_automations: 'Only use these automations for the times',
  fill_color: 'Glow and slider colour', open_glow: 'Glow when shades are open', show_icon: 'Show room icon', button_style: 'Button style', slider_size: 'Slider size', on_color: 'Open button colour', off_color: 'Close button colour', button_tint: 'Button colour strength', title_size: 'Title size', corners: 'Card corners', card_spacing: 'Spacing inside the card', open_word: 'Open button words', close_word: 'Close button words',
};
const HELPERS = {
  name: 'Leave empty to use the room’s name.',
  master_shade: 'Leave empty to use the room’s shade group, or control each shade together.',
  temperature_sensor: 'Leave empty to pick one from the room automatically.',
  schedule_automations: 'Leave empty to find them automatically from your automations.',
};

class OneStopShadesCardEditor extends HTMLElement {
  setConfig(config) { this._config = { ...config }; this._render(); }
  set hass(hass) { const first = !this._hass; this._hass = hass; if (first) Shared.get(hass).then(() => this._render()); this._render(); }
  _inherited() { Shared._readCache(); return { ...DEFAULTS, ...((Shared.data || {})[SECTION] || {}) }; }
  _ownStyle() { return Object.keys(this._config || {}).filter(k => !ROOM_KEYS.includes(k)); }
  _emit(cfg) { this._config = cfg; this._render(); this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: cfg }, bubbles: true, composed: true })); }
  _onChange(v) {
    if (!!v.edit_all !== !!this._all) { this._all = !!v.edit_all; this._render(); return; }
    const type = this._config.type || 'custom:' + TAG;
    if (v.reset_style) { const cfg = { type }; for (const k of ROOM_KEYS) if (k in this._config && k !== 'type') cfg[k] = this._config[k]; return this._emit(cfg); }
    const clean = {};
    for (const [k, val] of Object.entries(v)) { if (['type', 'edit_all', 'reset_style'].includes(k) || val === '' || val == null) continue; if (Array.isArray(val) && !val.length && !okRgb(val)) continue; clean[k] = val; }
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
    this._note.textContent = this._all ? 'Master edit is on: look changes apply to every Shades card. Room, layout and shades still apply to this card only.'
      : own.length ? `This card has ${own.length} setting${own.length > 1 ? 's' : ''} of its own.` : 'Turn on Master edit to change every Shades card at once.';
    this._form.hass = this._hass;
    this._form.schema = [{ name: 'edit_all', selector: toggle }, ...(!this._all && own.length ? [{ name: 'reset_style', selector: toggle }] : []), ...schema(data)];
    this._form.data = data;
  }
}

if (!customElements.get(TAG)) customElements.define(TAG, OneStopShadesCard);
if (!customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, OneStopShadesCardEditor);
window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === TAG)) window.customCards.push({ type: TAG, name: 'One Stop - Shades card', description: 'Shades for a room: slider, Open/Stop/Close, quick positions, each shade, temperature and the open/close schedule. Six layouts.', preview: true });
console.info(`%c ONE STOP %c Shades card ${VERSION} `, 'background:#375374;color:#fff;border-radius:3px 0 0 3px;padding:2px 4px', 'background:#e9eef5;color:#375374;border-radius:0 3px 3px 0;padding:2px 4px');
window.__oneStopShades = { roomShades, scheduleFor, Schedules, VERSION };
})();
