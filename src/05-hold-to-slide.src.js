/*!
 * One Stop – Hold to slide
 * Every slider on the dashboard has to be pressed and held (about half a second) before it moves,
 * so scrolling past a slider with a finger never changes anything.
 * Covers One Stop cards, Home Assistant's own sliders (tile features, more-info) and any native
 * range slider inside other cards. Bubble Card sliders already work this way and are left alone.
 * Mouse use on a computer is unaffected. Turn off on a device with:
 *   localStorage.setItem('one-stop-hold-to-slide', 'off')
 */
(() => {
'use strict';
if (window.__oneStopHoldToSlide) return;
window.__oneStopHoldToSlide = true;

const HOLD_MS = 400, MOVE_PX = 10;
const CUSTOM = 'ha-control-slider, [data-hold-slide]';
const off = () => { try { return localStorage.getItem('one-stop-hold-to-slide') === 'off'; } catch (e) { return false; } };
const isRange = n => n instanceof HTMLInputElement && n.type === 'range';
let g = null;                                   // the current press: { el, native, x, y, armed, timer, until }
const roots = new WeakSet();

const blocked = el => g && g.el === el && !g.armed && (!g.ended || Date.now() < g.until);
function guardRoot(root) {                      // native sliders: swallow value changes until the hold completes
  if (!root || roots.has(root)) return; roots.add(root);
  const stop = e => {
    const el = e.composedPath()[0];
    if (!isRange(el) || !blocked(el)) return;
    e.stopImmediatePropagation(); el.value = g.v;
  };
  root.addEventListener('input', stop, true); root.addEventListener('change', stop, true);
}
const glow = (el, on) => { try { el.style.filter = on ? 'brightness(1.25) drop-shadow(0 0 6px rgba(255,255,255,.35))' : ''; } catch (e) {} };

window.addEventListener('pointerdown', e => {
  if (e.__osPass || off() || e.pointerType === 'mouse' || !e.isPrimary) return;
  const path = e.composedPath();
  if (path.some(n => n.tagName === 'BUBBLE-CARD')) return;           // Bubble Card already needs a hold
  const el = path.find(n => n.nodeType === 1 && (isRange(n) || n.matches?.(CUSTOM)));
  if (!el || el.disabled) return;
  if (g?.timer) clearTimeout(g.timer);
  const native = isRange(el);
  g = { el, native, x: e.clientX, y: e.clientY, armed: false, ended: false, until: 0, v: native ? el.value : null };
  if (native) guardRoot(el.getRootNode());
  else e.stopImmediatePropagation();                               // the slider never sees the touch unless it's held
  const init = {
    bubbles: true, composed: true, cancelable: true, pointerId: e.pointerId, pointerType: e.pointerType, isPrimary: true,
    clientX: e.clientX, clientY: e.clientY, screenX: e.screenX, screenY: e.screenY, button: 0, buttons: 1, pressure: .5,
  };
  const target = path[0], mine = g;
  g.timer = setTimeout(() => {
    if (g !== mine || mine.ended) return;
    mine.armed = true; glow(el, true);
    try { navigator.vibrate?.(15); } catch (err) {}
    if (!native) {                                                  // hand the held press to the slider
      const ev = new PointerEvent('pointerdown', { ...init, clientX: mine.lx ?? init.clientX, clientY: mine.ly ?? init.clientY });
      ev.__osPass = true; target.dispatchEvent(ev);
    }
  }, HOLD_MS);
}, true);

window.addEventListener('pointermove', e => {
  if (!g || g.armed || g.ended) return;
  g.lx = e.clientX; g.ly = e.clientY;
  if (Math.hypot(e.clientX - g.x, e.clientY - g.y) > MOVE_PX) { clearTimeout(g.timer); g.ended = true; g.until = Date.now() + 700; }
}, true);

const end = () => {
  if (!g) return; clearTimeout(g.timer);
  if (g.armed) { glow(g.el, false); g.armed = false; g.ended = true; g.until = 0; const done = g; setTimeout(() => { if (g === done) g = null; }, 50); return; }
  g.ended = true; g.until = Date.now() + 700;                         // swallow the change that follows a quick tap
};
window.addEventListener('pointerup', end, true);
window.addEventListener('pointercancel', end, true);
})();
