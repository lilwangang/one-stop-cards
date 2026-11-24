/*!
 * One Stop – Security card
 * Alarm status with arm buttons, door locks (with door sensor + battery), doors & windows, motion,
 * and cameras (tap for live view). Door codes (Lock Code Manager) open in a pop-up.
 */
(() => {
'use strict';
const VERSION = '1.0.0';
const TAG = 'one-stop-security-card';
const EDITOR_TAG = TAG + '-editor';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ic = n => `<ha-icon icon="mdi:${n}"></ha-icon>`;
const DEAD = ['unknown', 'unavailable'];
const AF = { HOME: 1, AWAY: 2, NIGHT: 4, TRIGGER: 8, CUSTOM: 16, VACATION: 32 };
const ALARM = {
  disarmed: ['shield-off-outline', 'Disarmed', '169,191,210'], armed_home: ['shield-home', 'Armed · Home', '94,214,140'], armed_away: ['shield-lock', 'Armed · Away', '94,214,140'],
  armed_night: ['shield-moon', 'Armed · Night', '94,214,140'], armed_vacation: ['shield-airplane', 'Armed · Vacation', '94,214,140'], armed_custom_bypass: ['shield-star', 'Armed', '94,214,140'],
  arming: ['shield-sync', 'Arming…', '250,204,21'], pending: ['shield-alert-outline', 'Entry delay', '251,146,60'], disarming: ['shield-sync', 'Disarming…', '250,204,21'], triggered: ['bell-ring', 'ALARM', '248,113,113'],
};
const ago = t => { if (!t) return ''; const s = (Date.now() - new Date(t).getTime()) / 1000; if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + ' min ago'; if (s < 86400) return Math.floor(s / 3600) + ' h ago'; const d = Math.floor(s / 86400); return d === 1 ? 'yesterday' : d < 30 ? d + ' days ago' : new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); };

const CSS = `
:host{display:block}*{box-sizing:border-box}
button{all:unset;box-sizing:border-box;cursor:pointer;-webkit-tap-highlight-color:transparent}
ha-card{position:relative;overflow:hidden;padding:12px 18px 18px;border-radius:18px;color:var(--primary-text-color,#f2f6fa);
  background:radial-gradient(110% 70% at 100% 0%,rgba(var(--al),.13),transparent 60%),linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.015)),var(--bubble-main-background-color,var(--secondary-background-color,#1f2329));
  border:1px solid rgba(255,255,255,.12);box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 10px 24px rgba(0,0,0,.10);-webkit-backdrop-filter:blur(18px) saturate(1.1);backdrop-filter:blur(18px) saturate(1.1)}
ha-card.alarm{animation:pulse 1.2s ease-in-out infinite}@keyframes pulse{50%{box-shadow:0 0 0 3px rgba(248,113,113,.55),0 10px 24px rgba(0,0,0,.1)}}
.hd{display:grid;grid-template-columns:minmax(0,1fr) 44px;column-gap:8px;align-items:center;min-height:44px;margin-bottom:12px}
.hd h2{margin:0;font-size:22px;line-height:27px;font-weight:650}
.hd p{margin:1px 0 0;font-size:12.5px;color:#aebdcb;display:flex;align-items:center;gap:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dot{flex:none;width:7px;height:7px;border-radius:50%;background:#5ed68c;box-shadow:0 0 8px rgba(94,214,140,.7)}.dot.warn{background:#fb923c;box-shadow:0 0 8px rgba(251,146,60,.8)}
.sq{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;border:1px solid rgba(211,224,238,.16);background:rgba(66,70,76,.42)}.sq ha-icon{--mdc-icon-size:23px}
.sq:active,.ab:active,.lk:active,.cam:active{transform:scale(.96)}
.al{display:flex;align-items:center;gap:14px;padding:14px;border-radius:17px;border:1px solid rgba(var(--al),.35);background:rgba(var(--al),.09)}
.al .sh{flex:none;width:58px;height:58px;border-radius:18px;display:grid;place-items:center;background:rgba(var(--al),.2);color:rgb(var(--al))}.al .sh ha-icon{--mdc-icon-size:32px}
.al .tx{flex:1;min-width:0}.al .tx small{display:block;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#aebdcb}
.al .tx b{display:block;font-size:22px;line-height:27px;font-weight:650;margin-top:2px}.al .tx span{display:block;font-size:12.5px;color:#b8c6d4;margin-top:2px}
.arm{display:grid;grid-template-columns:repeat(var(--n,3),minmax(0,1fr));gap:8px;margin-top:10px}
.ab{height:50px;border-radius:14px;display:flex;align-items:center;justify-content:center;gap:7px;font-size:14.5px;font-weight:650;border:1px solid rgba(211,224,238,.16);background:rgba(66,70,76,.42)}
.ab ha-icon{--mdc-icon-size:21px}.ab.on{background:rgba(94,214,140,.22);border-color:rgba(94,214,140,.55)}.ab.dis{background:rgba(var(--al),.22);border-color:rgba(var(--al),.6)}
.sec{display:flex;align-items:center;gap:7px;margin:16px 2px 9px;color:#c4cfdd;font-size:13px;font-weight:650}.sec ha-icon{--mdc-icon-size:19px}.sec em{margin-left:auto;font-style:normal;font-weight:500;color:#94a3b3;font-size:12px}
.locks{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:9px}
.lk{display:flex;flex-direction:column;gap:9px;padding:12px;border-radius:16px;border:1px solid rgba(211,224,238,.14);background:rgba(66,70,76,.26);min-width:0}
.lk .top{display:flex;align-items:center;gap:10px}
.lk .i{flex:none;width:44px;height:44px;border-radius:14px;display:grid;place-items:center;background:rgba(94,214,140,.16);color:#5ed68c}.lk .i ha-icon{--mdc-icon-size:25px}
.lk.open .i{background:rgba(251,146,60,.18);color:#fb923c}.lk.busy .i{background:rgba(250,204,21,.16);color:#facc15}.lk.dead .i{background:rgba(255,255,255,.07);color:#8f9cab}
.lk .n{min-width:0}.lk .n b{display:block;font-size:15px;line-height:19px;font-weight:650;overflow-wrap:anywhere}.lk .n span{display:block;font-size:12.5px;color:#b8c6d4}
.lk .meta{display:flex;flex-wrap:wrap;gap:5px}.lk .meta span{display:flex;align-items:center;gap:4px;font-size:11.5px;padding:3px 7px;border-radius:8px;background:rgba(255,255,255,.07);color:#cdd7e2}.lk .meta ha-icon{--mdc-icon-size:14px}
.lk .meta span.warn{background:rgba(251,146,60,.18);color:#fdba74}
.lk .go{height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:7px;font-size:14px;font-weight:650;background:rgba(255,255,255,.08);border:1px solid rgba(211,224,238,.14)}
.lk .go ha-icon{--mdc-icon-size:19px}.lk .go.sure{background:rgba(251,146,60,.3);border-color:rgba(251,146,60,.7);color:#fff}
.chips{display:flex;flex-wrap:wrap;gap:7px}
.chip{display:flex;align-items:center;gap:7px;padding:8px 11px;border-radius:12px;background:rgba(66,70,76,.3);border:1px solid rgba(211,224,238,.12);font-size:13.5px;font-weight:600;min-width:0}
.chip ha-icon{--mdc-icon-size:18px;color:#8fa0b2}.chip small{font-weight:400;color:#9fb0c0;font-size:11.5px}
.chip.hot{background:rgba(251,146,60,.16);border-color:rgba(251,146,60,.5)}.chip.hot ha-icon{color:#fb923c}
.chip.mo{background:rgba(96,165,250,.16);border-color:rgba(96,165,250,.5)}.chip.mo ha-icon{color:#60a5fa}
.cams{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:9px}
.cam{position:relative;aspect-ratio:16/9;border-radius:14px;overflow:hidden;background:#11151a;border:1px solid rgba(211,224,238,.12);display:grid;place-items:center;color:#5c6a79}
.cam img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.cam>ha-icon{--mdc-icon-size:34px}
.cam .lbl{position:absolute;left:0;right:0;bottom:0;padding:18px 10px 7px;background:linear-gradient(transparent,rgba(0,0,0,.7));font-size:12.5px;font-weight:650;color:#fff;display:flex;align-items:center;gap:6px}
.cam .lbl i{width:7px;height:7px;border-radius:50%;background:#f87171;box-shadow:0 0 6px #f87171}.cam .lbl ha-icon{margin-left:auto;--mdc-icon-size:18px}
`;
const SHEET_CSS = `
:host{all:initial;position:fixed;inset:0;z-index:2147483000;font-family:var(--ha-font-family-body,Roboto,system-ui,sans-serif);color:#eef3f8}
*{box-sizing:border-box}button,input{font:inherit;color:inherit}button{all:unset;box-sizing:border-box;cursor:pointer;-webkit-tap-highlight-color:transparent}
.bg{position:absolute;inset:0;background:rgba(0,0,0,.6);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);animation:fade .18s ease-out}
.sh{position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:min(100%,var(--w,560px));max-height:90vh;display:flex;flex-direction:column;background:rgba(30,34,41,.985);border:1px solid rgba(255,255,255,.12);border-bottom:0;border-radius:26px 26px 0 0;box-shadow:0 -18px 48px rgba(0,0,0,.5);padding:10px 18px calc(16px + env(safe-area-inset-bottom));animation:up .24s cubic-bezier(.2,.9,.3,1)}
@media(min-width:700px){.sh{bottom:auto;top:50%;transform:translate(-50%,-50%);border-radius:26px;border-bottom:1px solid rgba(255,255,255,.12);animation:pop .2s ease-out;padding-bottom:20px}.grab{display:none}}
@keyframes fade{from{opacity:0}}@keyframes up{from{transform:translate(-50%,100%)}}@keyframes pop{from{opacity:0;transform:translate(-50%,-48%) scale(.97)}}
.grab{flex:none;width:40px;height:5px;border-radius:3px;background:rgba(255,255,255,.25);margin:0 auto 10px}
.top{flex:none;display:flex;align-items:center;gap:12px;margin-bottom:12px}.top .ic{flex:none;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:rgba(169,191,210,.18);color:#c4d6e6}.top .ic ha-icon{--mdc-icon-size:22px}
.top h3{flex:1;margin:0;font-size:20px;font-weight:650}.top h3 small{display:block;font-size:12.5px;font-weight:500;color:#aebdcb;margin-top:2px}
.x{flex:none;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.08)}.x ha-icon{--mdc-icon-size:20px}
.body{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;margin:0 -4px;padding:2px 4px 4px}
.code{padding:14px;border-radius:16px;border:1px solid rgba(211,224,238,.14);background:rgba(66,70,76,.26);margin-bottom:10px}
.code.on{border-color:rgba(94,214,140,.45);background:rgba(94,214,140,.07)}
.code .r1{display:flex;align-items:center;gap:12px}.code .av{flex:none;width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.08);font-weight:700;font-size:17px}
.code.on .av{background:rgba(94,214,140,.22);color:#86efac}
.code .nm{flex:1;min-width:0}.code .nm b{display:block;font-size:16.5px}.code .nm span{display:block;font-size:12px;color:#aebdcb;margin-top:2px}
.tg{flex:none;width:52px;height:32px;border-radius:16px;background:rgba(255,255,255,.16);position:relative;transition:background .15s}.tg:after{content:'';position:absolute;top:3px;left:3px;width:26px;height:26px;border-radius:50%;background:#fff;transition:transform .15s}
.tg.on{background:#22c55e}.tg.on:after{transform:translateX(20px)}
.code .r2{display:flex;align-items:center;gap:8px;margin-top:12px}
.pin{flex:1;height:44px;border-radius:12px;background:rgba(0,0,0,.22);display:flex;align-items:center;padding:0 12px;font-size:19px;letter-spacing:.3em;font-variant-numeric:tabular-nums}
.pin input{all:unset;width:100%;letter-spacing:.3em}
.ib{flex:none;width:44px;height:44px;border-radius:12px;display:grid;place-items:center;background:rgba(255,255,255,.08)}.ib ha-icon{--mdc-icon-size:21px}.ib.pri{background:rgba(94,214,140,.25)}
.msg{font-size:12.5px;color:#aebdcb;margin-top:8px}.msg.err{color:#f0b8bd}
.live{position:relative;width:100%;aspect-ratio:16/9;border-radius:16px;overflow:hidden;background:#000}
.live>*{position:absolute;inset:0;width:100%;height:100%}.live img{object-fit:contain}
.pad{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:6px}.pad button{height:60px;border-radius:16px;display:grid;place-items:center;font-size:24px;font-weight:600;background:rgba(255,255,255,.08)}
.dots{display:flex;justify-content:center;gap:12px;height:24px;align-items:center;margin-bottom:10px}.dots i{width:13px;height:13px;border-radius:50%;border:2px solid rgba(255,255,255,.5)}.dots i.f{background:#fff;border-color:#fff}
`;

function sheet(card, { icon, title, sub = '', wide = false }) {
  const host = document.createElement('div'); host.className = 'one-stop-sheet';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>${SHEET_CSS}</style><div class="bg"></div><div class="sh" style="${wide ? '--w:900px' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="grab"></div>
    <div class="top"><span class="ic">${ic(icon)}</span><h3>${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ''}</h3><button class="x" aria-label="Close">${ic('close')}</button></div><div class="slot" style="display:contents"></div></div>`;
  const prev = document.documentElement.style.overflow;
  const s = { host, root, el: root.querySelector('.slot'), closed: false };
  const key = e => { if (e.key === 'Escape') s.close(); };
  s.close = () => { if (s.closed) return; s.closed = true; document.removeEventListener('keydown', key); document.documentElement.style.overflow = prev || ''; host.remove(); if (card._sheet === s) card._sheet = null; s.onClose && s.onClose(); };
  root.querySelector('.bg').addEventListener('click', s.close); root.querySelector('.x').addEventListener('click', s.close); document.addEventListener('keydown', key);
  if (card._sheet) card._sheet.close(); card._sheet = s; document.body.appendChild(host); document.documentElement.style.overflow = 'hidden';
  return s;
}

class OneStopSecurityCard extends HTMLElement {
  static getConfigElement() { return document.createElement(EDITOR_TAG); }
  static getStubConfig(hass) { const S = hass?.states || {}, k = Object.keys(S); return { alarm: k.find(x => x.startsWith('alarm_control_panel.')) || '', locks: k.filter(x => x.startsWith('lock.')).slice(0, 2) }; }
  setConfig(c) { this._cfg = { title: 'Security', codes: 'auto', ...c }; if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._sig = null; this._confirm = {}; if (this._hass) this._render(); }
  set hass(h) { this._hass = h; this._render(); if (this._sheet?.update) this._sheet.update(); }
  getCardSize() { return 8; }
  getGridOptions() { return { columns: 12, rows: 'auto', min_columns: 12 }; }
  connectedCallback() { clearInterval(this._t); this._t = setInterval(() => this._refreshCams(), (this._cfg?.camera_refresh || 10) * 1000); }
  disconnectedCallback() { clearInterval(this._t); if (this._sheet) this._sheet.close(); }
  _s(id) { return id ? this._hass.states[id] : null; }
  _name(id, fallback) { const s = this._s(id); let n = s?.attributes?.friendly_name || fallback || id || ''; const dev = this._hass.devices?.[this._hass.entities?.[id]?.device_id]; const dn = dev?.name_by_user || dev?.name; if (dn && n.startsWith(dn + ' ') && n.length > dn.length + 1) n = n.slice(dn.length + 1); return n.replace(/^./, x => x.toUpperCase()); }
  _label(id) {
    // friendly short name: device name, or the room when the device name is generic ("motion sensor")
    const h = this._hass, e = h.entities?.[id], d = h.devices?.[e?.device_id], area = h.areas?.[e?.area_id || d?.area_id]?.name;
    let n = d?.name_by_user || d?.name || this._s(id)?.attributes?.friendly_name || id;
    if (/^(motion|occupancy|presence|door|window|contact)?\s*sensor\s*\d*$/i.test(n.trim()) && area) n = area;
    n = n.replace(/\s+(sensor|contact|lock|motion|occupancy)$/i, '').trim();
    if (/person/i.test(e?.name || '') || /person/i.test(id)) n += ' · person';
    return n.replace(/^./, x => x.toUpperCase());
  }
  _list(k) { return (this._cfg[k] || []).map(x => typeof x === 'string' ? { entity: x } : x).filter(x => x && x.entity); }
  _sameDevice(id, pred) { const d = this._hass.entities?.[id]?.device_id; if (!d) return null; return Object.values(this._hass.entities).find(e => e.device_id === d && pred(e.entity_id, this._s(e.entity_id)))?.entity_id || null; }
  _lockDoor(l) {
    if (l.door) return l.door;
    const map = this._cfg.lock_doors || {}; if (map[l.entity]) return map[l.entity];
    const words = this._name(l.entity).toLowerCase().replace(/\block\b/g, '').split(/\s+/).filter(w => w.length > 2);
    return (this._cfg.doors || []).map(x => typeof x === 'string' ? x : x.entity).find(d => { const n = this._name(d).toLowerCase(); return words.length && words.every(w => n.includes(w)); }) || null;
  }
  _lockBattery(l) { return l.battery || this._sameDevice(l.entity, (id, s) => id.startsWith('sensor.') && s?.attributes?.device_class === 'battery'); }
  _codes() {
    if (this._cfg.codes === false || this._cfg.codes === 'off') return [];
    if (Array.isArray(this._cfg.codes)) return this._cfg.codes;
    const E = this._hass.entities || {};
    return Object.values(E).filter(e => e.platform === 'lock_code_manager' && e.entity_id.startsWith('switch.') && e.entity_id.endsWith('_enabled')).map(e => {
      const base = e.entity_id.slice(7, -8);
      return { enabled: e.entity_id, pin: `text.${base}_pin`, name_entity: `text.${base}_name`, used: `event.${base}_credential_used`, active: `binary_sensor.${base}_active` };
    }).filter(c => this._s(c.enabled));
  }

  _render() {
    const R = this.shadowRoot, h = this._hass, c = this._cfg; if (!R || !h) return;
    const al = this._s(c.alarm), ast = al?.state, A = ALARM[ast] || (al ? ['shield-outline', (ast || '').replace(/_/g, ' '), '169,191,210'] : null);
    const locks = this._list('locks').map(l => { const s = this._s(l.entity), door = this._lockDoor(l), bat = this._lockBattery(l); return { ...l, st: s?.state, name: l.name || this._label(l.entity), door: door && this._s(door)?.state, bat: bat && this._s(bat)?.state, changed: s?.last_changed }; });
    const doors = this._list('doors').map(d => ({ ...d, st: this._s(d.entity)?.state, name: d.name || this._label(d.entity), changed: this._s(d.entity)?.last_changed }));
    const motion = this._list('motion').map(d => ({ ...d, st: this._s(d.entity)?.state, name: d.name || this._label(d.entity), changed: this._s(d.entity)?.last_changed }));
    const cams = this._list('cameras');
    const openDoors = doors.filter(d => d.st === 'on'), unlocked = locks.filter(l => l.st && !['locked', ...DEAD].includes(l.st)), moving = motion.filter(m => m.st === 'on');
    const codes = this._codes();
    const sig = JSON.stringify([ast, al?.attributes?.open_sensors, locks.map(l => [l.st, l.door, l.bat]), doors.map(d => d.st), motion.map(m => [m.st, Math.floor((Date.now() - new Date(m.changed)) / 60000)]), cams, this._confirm, codes.length]);
    if (sig === this._sig) return; this._sig = sig;
    const problems = [unlocked.length ? `${unlocked.length} unlocked` : '', openDoors.length ? `${openDoors.length} open` : ''].filter(Boolean);
    const status = problems.length ? problems.join(' · ') : [locks.length ? 'All locked' : '', doors.length ? 'doors closed' : ''].filter(Boolean).join(' · ') || 'All good';
    const f = al?.attributes?.supported_features || 0, armed = ast && ast.startsWith('armed');
    const modes = [[AF.HOME, 'arm_home', 'armed_home', 'home', 'Home'], [AF.AWAY, 'arm_away', 'armed_away', 'shield-lock', 'Away'], [AF.NIGHT, 'arm_night', 'armed_night', 'weather-night', 'Night'], [AF.VACATION, 'arm_vacation', 'armed_vacation', 'airplane', 'Vacation']].filter(m => f & m[0]);
    const buttons = armed || ['arming', 'pending', 'triggered'].includes(ast) ? [['disarm', null, 'shield-off', 'Disarm', 'dis']] : modes.map(m => [m[1], m[2], m[3], m[4], ast === m[2] ? 'on' : '']);
    const alarmSub = ast === 'triggered' ? 'Something set off the alarm' : ast === 'pending' ? 'Disarm now or the alarm goes off' : ast === 'arming' ? 'Leave now · doors are being watched' : armed ? `Since ${ago(al.last_changed)}` : (al?.attributes?.open_sensors ? 'Some sensors are open' : 'Ready to arm');
    R.innerHTML = `<style>${CSS}</style><ha-card class="${ast === 'triggered' ? 'alarm' : ''}" style="--al:${A ? A[2] : '169,191,210'}">
      <div class="hd"><div style="min-width:0"><h2>${esc(c.title)}</h2><p><span class="dot ${problems.length ? 'warn' : ''}"></span>${esc(status)}</p></div>
        ${codes.length ? `<button class="sq" data-a="codes" aria-label="Door codes">${ic('dialpad')}</button>` : '<span></span>'}</div>
      ${A ? `<div class="al"><span class="sh">${ic(A[0])}</span><div class="tx"><small>Alarm</small><b>${esc(A[1])}</b><span>${esc(alarmSub)}</span></div></div>
        <div class="arm" style="--n:${buttons.length}">${buttons.map(b => `<button class="ab ${b[4]}" data-arm="${b[0]}">${ic(b[2])}${b[3]}</button>`).join('')}</div>` : ''}
      ${locks.length ? `<div class="sec">${ic('lock-outline')}Locks<em>${unlocked.length ? `${unlocked.length} unlocked` : 'All locked'}</em></div><div class="locks">${locks.map(l => {
        const dead = !l.st || DEAD.includes(l.st), busy = ['locking', 'unlocking', 'opening'].includes(l.st), locked = l.st === 'locked', sure = this._confirm[l.entity];
        const word = dead ? 'Offline' : busy ? l.st.replace(/^./, x => x.toUpperCase()) + '…' : locked ? 'Locked' : l.st === 'jammed' ? 'Jammed' : 'Unlocked';
        return `<div class="lk ${dead ? 'dead' : busy ? 'busy' : locked ? '' : 'open'}"><div class="top"><span class="i">${ic(dead ? 'lock-question' : busy ? 'lock-clock' : locked ? 'lock' : 'lock-open-variant')}</span><div class="n"><b>${esc(l.name)}</b><span>${word} · ${ago(l.changed)}</span></div></div>
          ${l.door || l.bat ? `<div class="meta">${l.door ? `<span class="${l.door === 'on' ? 'warn' : ''}">${ic(l.door === 'on' ? 'door-open' : 'door-closed')}${l.door === 'on' ? 'Door open' : 'Door closed'}</span>` : ''}${l.bat && !DEAD.includes(l.bat) ? `<span class="${+l.bat < 20 ? 'warn' : ''}">${ic(+l.bat < 20 ? 'battery-alert' : 'battery')}${Math.round(+l.bat)}%</span>` : ''}</div>` : ''}
          ${dead ? '' : `<button class="go ${sure ? 'sure' : ''}" data-lock="${esc(l.entity)}">${ic(locked ? 'lock-open-variant-outline' : 'lock')}${locked ? (sure ? 'Tap again to unlock' : 'Unlock') : 'Lock'}</button>`}</div>`; }).join('')}</div>` : ''}
      ${doors.length ? `<div class="sec">${ic('door')}Doors &amp; windows<em>${openDoors.length ? `${openDoors.length} open` : 'All closed'}</em></div><div class="chips">${doors.map(d => `<span class="chip ${d.st === 'on' ? 'hot' : ''}">${ic(d.st === 'on' ? (/window/i.test(d.name) ? 'window-open-variant' : 'door-open') : (/window/i.test(d.name) ? 'window-closed-variant' : 'door-closed'))}${esc(d.name)}${d.st === 'on' ? ` <small>open ${ago(d.changed)}</small>` : ''}</span>`).join('')}</div>` : ''}
      ${motion.length ? `<div class="sec">${ic('motion-sensor')}Motion<em>${moving.length ? `${moving.length} now` : 'All quiet'}</em></div><div class="chips">${motion.map(m => `<span class="chip ${m.st === 'on' ? 'mo' : ''}">${ic(m.st === 'on' ? 'motion-sensor' : 'motion-sensor-off')}${esc(m.name)} <small>${m.st === 'on' ? 'now' : ago(m.changed)}</small></span>`).join('')}</div>` : ''}
      ${cams.length ? `<div class="sec">${ic('cctv')}Cameras<em>Tap to watch live</em></div><div class="cams">${cams.map(k => `<button class="cam" data-cam="${esc(k.entity)}">${ic('cctv')}<img alt="" data-snap="${esc(k.entity)}"><span class="lbl"><i></i>${esc(k.name || this._label(k.entity))}${ic('play-circle-outline')}</span></button>`).join('')}</div>` : ''}
    </ha-card>`;
    R.querySelectorAll('[data-arm]').forEach(b => b.addEventListener('click', () => this._arm(b.dataset.arm)));
    R.querySelectorAll('[data-lock]').forEach(b => b.addEventListener('click', () => this._lock(b.dataset.lock)));
    R.querySelectorAll('[data-cam]').forEach(b => b.addEventListener('click', () => this._live(b.dataset.cam)));
    R.querySelector('[data-a=codes]')?.addEventListener('click', () => this._codesSheet());
    this._refreshCams(true);
  }
  _refreshCams(initial) {
    const R = this.shadowRoot; if (!R || !this._hass || (!initial && document.hidden)) return;
    R.querySelectorAll('img[data-snap]').forEach(img => {
      const p = this._s(img.dataset.snap)?.attributes?.entity_picture; if (!p) return;
      if (initial && img.src) return;
      const pre = new Image(); pre.onload = () => { img.src = pre.src; }; pre.src = p + (p.includes('?') ? '&' : '?') + 't=' + Date.now();
    });
  }
  _arm(svc) {
    const al = this._s(this._cfg.alarm); if (!al) return;
    const needCode = al.attributes.code_format && (svc === 'disarm' || al.attributes.code_arm_required);
    if (!needCode) return this._hass.callService('alarm_control_panel', 'alarm_' + svc, { entity_id: this._cfg.alarm });
    const s = sheet(this, { icon: 'dialpad', title: svc === 'disarm' ? 'Disarm' : 'Arm', sub: 'Enter your alarm code' }); let code = '';
    const draw = () => { s.el.innerHTML = `<div class="dots">${[...Array(Math.max(4, code.length))].map((_, i) => `<i class="${i < code.length ? 'f' : ''}"></i>`).join('')}</div><div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 'clr', 0, 'ok'].map(k => `<button data-k="${k}">${k === 'clr' ? ic('backspace-outline') : k === 'ok' ? ic('check') : k}</button>`).join('')}</div><div class="msg" data-m></div>`;
      s.el.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', async () => { const k = b.dataset.k;
        if (k === 'clr') code = code.slice(0, -1); else if (k === 'ok') { try { await this._hass.callService('alarm_control_panel', 'alarm_' + svc, { entity_id: this._cfg.alarm, code }); s.close(); return; } catch (e) { code = ''; draw(); s.el.querySelector('[data-m]').className = 'msg err'; s.el.querySelector('[data-m]').textContent = 'Wrong code. Try again.'; return; } } else if (code.length < 10) code += k; draw(); })); };
    draw();
  }
  _lock(id) {
    const s = this._s(id); if (!s) return;
    if (s.state === 'locked') {
      if (!this._confirm[id]) { this._confirm = { ...this._confirm, [id]: true }; this._sig = null; this._render(); clearTimeout(this._ct); this._ct = setTimeout(() => { this._confirm = {}; this._sig = null; this._render(); }, 4000); return; }
      this._confirm = {}; this._hass.callService('lock', 'unlock', { entity_id: id });
    } else this._hass.callService('lock', 'lock', { entity_id: id });
    this._sig = null; this._render();
  }
  _live(id) {
    const st = this._s(id), s = sheet(this, { icon: 'cctv', title: this._label(id), sub: 'Picture updates every 2 seconds', wide: true });
    s.el.innerHTML = `<div class="live"><img alt=""></div>`;
    const box = s.el.querySelector('.live'), img = box.querySelector('img');
    // fresh picture straight away (and every 2 s) so there's always something to see
    const tick = () => { const p = this._s(id)?.attributes?.entity_picture; if (p) { const n = new Image(); n.onload = () => { img.src = n.src; }; n.src = p + (p.includes('?') ? '&' : '?') + 't=' + Date.now(); } };
    tick(); const t = setInterval(tick, 2000); s.onClose = () => clearInterval(t);
    // then Home Assistant's own live player on top, when the camera can stream
    if (st.attributes.supported_features & 2) (async () => {
      try {
        const helpers = await window.loadCardHelpers();
        const el = await helpers.createCardElement({ type: 'picture-entity', entity: id, camera_view: 'live', show_name: false, show_state: false, tap_action: { action: 'none' }, hold_action: { action: 'none' } });
        el.hass = this._hass; s.update = () => { el.hass = this._hass; };
        // load the player out of sight; only swap it in once real video is playing
        el.style.cssText = 'display:block;position:fixed;left:-9999px;top:0;width:640px;opacity:0;pointer-events:none;--ha-card-border-radius:16px;--ha-card-border-width:0;';
        if (s.closed) return; s.el.appendChild(el);
        const deep = (root, out = []) => { root.querySelectorAll('*').forEach(e => { if (e.tagName === 'VIDEO') out.push(e); if (e.shadowRoot) deep(e.shadowRoot, out); }); return out; };
        const w = setInterval(() => {
          if (s.closed) return clearInterval(w);
          const v = deep(el.shadowRoot || el).find(v => v.readyState >= 2 && v.videoWidth);
          if (v) { clearInterval(w); clearInterval(t); el.style.cssText = 'display:block;--ha-card-border-radius:16px;--ha-card-border-width:0;'; box.replaceWith(el); s.root.querySelector('h3 small').textContent = 'Live'; }
        }, 500);
        const oc = s.onClose; s.onClose = () => { clearInterval(w); oc && oc(); };
      } catch (e) { /* snapshot keeps refreshing */ }
    })();
  }
  _codesSheet() {
    const s = sheet(this, { icon: 'dialpad', title: 'Door codes', sub: 'Turn a code on to let someone in' });
    const reveal = new Set(), editing = {};
    const draw = () => {
      if (s.closed) return;
      const body = s.el.querySelector('.body'); const top = body ? body.scrollTop : 0;
      const codes = this._codes();
      s.el.innerHTML = `<div class="body">${codes.map((c, i) => {
        const on = this._s(c.enabled)?.state === 'on', pin = this._s(c.pin)?.state || '', nm = this._s(c.name_entity)?.state || c.name || `Code ${i + 1}`;
        const used = this._s(c.used)?.state, usedTxt = used && !DEAD.includes(used) ? `Last used ${ago(used)}` : 'Never used';
        const show = reveal.has(i), ed = editing[i] != null;
        return `<div class="code ${on ? 'on' : ''}"><div class="r1"><span class="av">${esc(nm[0] || '?')}</span><div class="nm"><b>${esc(nm)}</b><span>${on ? 'On · ' : 'Off · '}${esc(usedTxt)}</span></div><button class="tg ${on ? 'on' : ''}" data-tg="${i}" aria-label="${on ? 'Turn off' : 'Turn on'} ${esc(nm)}"></button></div>
          <div class="r2"><div class="pin">${ed ? `<input inputmode="numeric" pattern="[0-9]*" maxlength="10" value="${esc(editing[i])}" data-in="${i}" aria-label="New PIN">` : esc(show ? pin : pin.replace(/./g, '•'))}</div>
          ${ed ? `<button class="ib pri" data-save="${i}" aria-label="Save">${ic('check')}</button><button class="ib" data-cancel="${i}" aria-label="Cancel">${ic('close')}</button>` : `<button class="ib" data-eye="${i}" aria-label="${show ? 'Hide' : 'Show'} PIN">${ic(show ? 'eye-off' : 'eye')}</button><button class="ib" data-edit="${i}" aria-label="Change PIN">${ic('pencil')}</button>`}</div><div class="msg" data-m="${i}"></div></div>`;
      }).join('') || '<div class="msg">No door codes found.</div>'}</div>`;
      s.el.querySelector('.body').scrollTop = top;
      const codesNow = codes;
      s.el.querySelectorAll('[data-tg]').forEach(b => b.addEventListener('click', () => { const c = codesNow[+b.dataset.tg]; b.classList.toggle('on'); this._hass.callService('switch', 'toggle', { entity_id: c.enabled }); }));
      s.el.querySelectorAll('[data-eye]').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.eye; reveal.has(i) ? reveal.delete(i) : reveal.add(i); draw(); }));
      s.el.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.edit; editing[i] = ''; draw(); s.el.querySelector(`[data-in="${i}"]`)?.focus(); }));
      s.el.querySelectorAll('[data-cancel]').forEach(b => b.addEventListener('click', () => { delete editing[+b.dataset.cancel]; draw(); }));
      s.el.querySelectorAll('[data-in]').forEach(inp => inp.addEventListener('input', () => { inp.value = inp.value.replace(/\D/g, ''); editing[+inp.dataset.in] = inp.value; }));
      s.el.querySelectorAll('[data-save]').forEach(b => b.addEventListener('click', async () => {
        const i = +b.dataset.save, v = editing[i] || '', m = s.el.querySelector(`[data-m="${i}"]`);
        if (!/^\d{4,10}$/.test(v)) { m.className = 'msg err'; m.textContent = 'Use 4 to 10 numbers.'; return; }
        try { await this._hass.callService('text', 'set_value', { entity_id: codesNow[i].pin, value: v }); delete editing[i]; draw(); }
        catch (e) { m.className = 'msg err'; m.textContent = 'Couldn’t save that PIN.'; }
      }));
    };
    s.update = () => { if (!Object.keys(editing).length) draw(); };
    draw();
  }
}

class OneStopSecurityCardEditor extends HTMLElement {
  setConfig(c) { this._config = { ...c }; this._draw(); }
  set hass(h) { this._hass = h; if (this._form) this._form.hass = h; else this._draw(); }
  _draw() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement('ha-form');
      this._form.computeLabel = s => ({ title: 'Title', alarm: 'Alarm panel', locks: 'Locks', doors: 'Doors & windows', motion: 'Motion sensors', cameras: 'Cameras', show_codes: 'Show door codes button (Lock Code Manager)', camera_refresh: 'Camera picture refresh (seconds)' }[s.name] || s.name);
      this._form.addEventListener('value-changed', e => {
        const v = { ...e.detail.value }, out = { type: this._config.type };
        for (const [k, x] of Object.entries(v)) if (k !== 'show_codes' && x !== '' && x != null && !(Array.isArray(x) && !x.length)) out[k] = x;
        if (v.show_codes === false) out.codes = false; else if (Array.isArray(this._config.codes)) out.codes = this._config.codes;
        if (this._config.lock_doors) out.lock_doors = this._config.lock_doors;
        this._config = out; this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: out }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    const M = (d, dc) => ({ entity: { multiple: true, filter: { domain: d, ...(dc ? { device_class: dc } : {}) } } });
    this._form.schema = [
      { type: 'grid', name: '', schema: [{ name: 'title', selector: { text: {} } }, { name: 'alarm', selector: { entity: { domain: 'alarm_control_panel' } } }] },
      { name: 'locks', selector: M('lock') },
      { name: 'doors', selector: M('binary_sensor', ['door', 'window', 'opening', 'garage_door']) },
      { name: 'motion', selector: M('binary_sensor', ['motion', 'occupancy', 'presence']) },
      { name: 'cameras', selector: M('camera') },
      { type: 'grid', name: '', schema: [{ name: 'show_codes', selector: { boolean: {} } }, { name: 'camera_refresh', selector: { number: { min: 3, max: 120, mode: 'box' } } }] },
    ];
    const c = this._config, ids = k => (c[k] || []).map(x => typeof x === 'string' ? x : x.entity);
    this._form.data = { ...c, locks: ids('locks'), doors: ids('doors'), motion: ids('motion'), cameras: ids('cameras'), show_codes: c.codes !== false };
  }
}
if (!customElements.get(TAG)) customElements.define(TAG, OneStopSecurityCard);
if (!customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, OneStopSecurityCardEditor);
window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === TAG)) window.customCards.push({ type: TAG, name: 'One Stop - Security', description: 'Alarm with arm buttons, locks, doors & windows, motion, cameras and door codes in one card.', preview: false });
console.info(`%c ONE STOP SECURITY %c ${VERSION} `, 'color:#fff;background:#334155;font-weight:700', 'color:#334155;background:#fff');
})();
