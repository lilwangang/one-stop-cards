/*!
 * One Stop – Mealie card ("What's cooking?")
 * Tonight's dinner with photo and a Cook mode, plus pop-ups for Recipes, Shopping list, Meal plan,
 * choosing tonight's dinner and importing a recipe. Uses Home Assistant's built-in Mealie integration only.
 */
(() => {
'use strict';
const VERSION = '1.2.0';
const TAG = 'one-stop-mealie-card';
const EDITOR_TAG = TAG + '-editor';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ic = n => `<ha-icon icon="mdi:${n}"></ha-icon>`;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACCENT = { green: '142,190,154', slate: '169,191,210', blue: '96,165,250', orange: '251,146,60', purple: '167,139,250', teal: '45,212,191' };

/* ---------- ingredient amounts (scales text like "1 1/2 cup (180g) flour") ---------- */
const FR = { '⅛': 1 / 8, '¼': 1 / 4, '⅓': 1 / 3, '½': 1 / 2, '⅔': 2 / 3, '¾': 3 / 4, '⅞': 7 / 8 };
const numText = n => { const w = Math.floor(n), p = n - w, f = Object.entries(FR).find(([, v]) => Math.abs(p - v) < .02); return p < .02 ? String(w) : f ? (w ? `${w} ${f[0]}` : f[0]) : String(+n.toFixed(2)); };
const parseNum = t => { let s = t.trim(); for (const [g, v] of Object.entries(FR)) if (s.endsWith(g)) return Number(s.slice(0, -1).trim() || 0) + v; if (s.includes('/')) { const p = s.split(/\s+/), f = p.pop().split('/').map(Number); return Number(p[0] || 0) + f[0] / f[1]; } return Number(s); };
function scaleText(text, k) {
  if (k === 1 || !text) return text || '';
  const atom = '(?:\\d+\\s+\\d+/\\d+|\\d+\\s*[⅛¼⅓½⅔¾⅞]|\\d+/\\d+|\\d+(?:\\.\\d+)?|\\.\\d+|[⅛¼⅓½⅔¾⅞])';
  const m = text.match(new RegExp('^(\\s*)(' + atom + ')(?:\\s*([-–]|to)\\s*(' + atom + '))?(\\s*)(.*)$', 'u'));
  if (!m || /^[-–]/.test(m[6])) return text;
  const range = m[4] ? (m[3] === 'to' ? ' to ' : m[3]) + numText(parseNum(m[4]) * k) : '';
  const tail = m[6].replace(/\((\d+(?:\.\d+)?)(\s*)(g|kg|mg|ml|l|oz|lb)\)/gi, (_, n, sp, u) => '(' + (+(Number(n) * k).toFixed(2)) + sp + u + ')');
  return m[1] + numText(parseNum(m[2]) * k) + range + m[5] + tail;
}
function ingText(x, k = 1) {
  if (!x.quantity && !x.food?.name) return scaleText(x.note || x.display || '', k);
  let u = x.unit; if (typeof u === 'string') { try { u = JSON.parse(u); } catch (e) { u = { name: u }; } }
  const main = [x.quantity ? numText(x.quantity * k) : '', u?.use_abbreviation && u.abbreviation ? u.abbreviation : u?.name, x.food?.name].filter(Boolean).join(' ');
  return x.note ? `${main} (${x.note})` : main;
}

/* ---------- ingredient → main food ("1 1/2 cups shredded cheddar cheese, divided" → "cheddar cheese") ---------- */
const UNITS = 'cups?|c|tablespoons?|tbsp?s?|tbs|teaspoons?|tsps?|t|ounces?|oz|pounds?|lbs?|grams?|g|kg|kilograms?|ml|milliliters?|l|liters?|litres?|pinch(?:es)?|dash(?:es)?|cloves?|cans?|jars?|packages?|pkgs?|packets?|bags?|boxes?|sticks?|slices?|pieces?|heads?|bunch(?:es)?|sprigs?|stalks?|handfuls?|quarts?|qts?|pints?|pts?|gallons?|inch(?:es)?|containers?|bottles?|envelopes?|whole|large|medium|small|extra[- ]large|jumbo|heaping|level|scant|generous';
const FLUFF = new Set(('chopped diced minced fresh freshly shredded grated sliced thinly thickly finely roughly coarsely divided softened melted cold warm hot room temperature packed lightly firmly optional taste to of the a an and for plus about approximately more needed as if cooked uncooked raw boneless skinless peeled seeded halved quartered cubed crushed rinsed drained trimmed beaten whisked sifted ' +
  'gluten-free gluten free dairy-free dairy certified homemade store-bought storebought favorite favourite your any brand such like good quality pure organic low-sodium reduced-sodium unsalted salted plain prepared frozen thawed canned dried ripe fine').split(' '));
const sing = w => w.length > 3 ? w.replace(/ies$/, 'y').replace(/(oes|ches|shes|sses)$/, m => m.slice(0, -2)).replace(/([^s])s$/, '$1') : w;
const words = t => String(t || '').toLowerCase().replace(/[^a-z\s-]/g, ' ').split(/[\s]+/).filter(Boolean).map(sing);
function foodKey(text) {
  let t = String(text || '').toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/\*.*$/, '').split(/,|;| - | – /)[0];
  t = t.replace(/gluten[- ]free|dairy[- ]free|all[- ]purpose/g, ' ').split(/\s+or\s+/)[0];
  t = t.replace(/[\d⅛¼⅓½⅔¾⅞/.\-–]+(?=\s|$)/g, ' ').replace(new RegExp('\\b(' + UNITS + ')\\b\\.?', 'g'), ' ');
  const w = t.replace(/[^a-z\s'-]/g, ' ').split(/\s+/).filter(x => x && x.length > 1 && !FLUFF.has(x));
  return w.slice(-3).join(' ').trim();
}

/* ---------- ingredient filter chips (tap Chicken + Pasta → recipes with both) ---------- */
const GROUPS = [
  ['chicken', 'Chicken', 'chicken', 'broth stock bouillon base soup'],
  ['beef', 'Beef', 'beef steak sirloin chuck brisket', 'broth stock bouillon base soup'],
  ['pork', 'Pork', 'pork ham tenderloin', 'broth stock'],
  ['turkey', 'Turkey', 'turkey', 'broth stock'],
  ['bacon', 'Bacon', 'bacon', ''],
  ['sausage', 'Sausage', 'sausage chorizo kielbasa', ''],
  ['salmon', 'Salmon', 'salmon', ''],
  ['shrimp', 'Shrimp', 'shrimp prawn', ''],
  ['fish', 'Fish', 'fish cod tilapia halibut tuna haddock', 'sauce'],
  ['pasta', 'Pasta', 'pasta noodle macaroni spaghetti penne ziti lasagna fettuccine fettucine rigatoni shell linguine elbow rotini orzo', ''],
  ['rice', 'Rice', 'rice', 'flour vinegar cereal krispy krispie paper wine milk'],
  ['potato', 'Potatoes', 'potato hashbrown hash tot', 'sweet starch flake chip'],
  ['sweetpotato', 'Sweet potato', 'sweet+potato', ''],
  ['cheese', 'Cheese', 'cheese cheddar mozzarella parmesan feta ricotta', ''],
  ['egg', 'Eggs', 'egg', 'replacer noodle'],
  ['broccoli', 'Broccoli', 'broccoli', ''],
  ['mushroom', 'Mushrooms', 'mushroom', 'soup'],
  ['spinach', 'Spinach', 'spinach', ''],
  ['tomato', 'Tomatoes', 'tomato', 'paste'],
  ['pepper', 'Peppers', 'bell jalapeno poblano', ''],
  ['beans', 'Beans', 'black+bean kidney+bean pinto chickpea', ''],
  ['corn', 'Corn', 'corn', 'syrup flake'],
  ['zucchini', 'Zucchini', 'zucchini', ''],
  ['onion', 'Onion', 'onion', 'powder soup'],
  ['garlic', 'Garlic', 'garlic', 'powder salt'],
  ['pumpkin', 'Pumpkin', 'pumpkin', 'spice'],
  ['chocolate', 'Chocolate', 'chocolate cocoa', ''],
  ['banana', 'Banana', 'banana', ''],
  ['blueberry', 'Blueberries', 'blueberry', ''],
  ['apple', 'Apple', 'apple', 'vinegar'],
  ['lemon', 'Lemon', 'lemon', ''],
  ['peanutbutter', 'Peanut butter', 'peanut+butter', ''],
  ['oats', 'Oats', 'oat oatmeal', 'milk flour'],
].map(([k, label, inc, exc]) => ({ k, label, inc: inc.split(' ').map(x => x.split('+').map(sing)), exc: new Set(exc ? exc.split(' ').map(sing) : []) }));
const hit = (g, text) => { const w = words(text), set = new Set(w); return g.inc.some(all => all.every(x => set.has(x))) && !w.some(x => g.exc.has(x)); };
const lineHas = (g, line) => { const out = String(line).replace(/\([^)]*\)?/g, ' '); return hit(g, out) || (!foodKey(out) && hit(g, line)); };

/* ---------- styles ---------- */
const CSS = `
:host{display:block}*{box-sizing:border-box}
button{all:unset;box-sizing:border-box;cursor:pointer;-webkit-tap-highlight-color:transparent}
ha-card{position:relative;overflow:hidden;padding:12px 18px 18px;border-radius:18px;color:var(--primary-text-color,#f2f6fa);
  background:linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.015)),var(--bubble-main-background-color,var(--secondary-background-color,#1f2329));
  border:1px solid rgba(255,255,255,.12);box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 10px 24px rgba(0,0,0,.10);-webkit-backdrop-filter:blur(18px) saturate(1.1);backdrop-filter:blur(18px) saturate(1.1)}
.hd{display:grid;grid-template-columns:minmax(0,1fr) 44px 44px;column-gap:8px;align-items:center;min-height:44px;margin-bottom:12px}
.hd h2{margin:0;font-size:22px;line-height:27px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hd p{margin:1px 0 0;font-size:12.5px;color:#aebdcb;display:flex;align-items:center;gap:6px;white-space:nowrap;overflow:hidden}
.dot{flex:none;width:7px;height:7px;border-radius:50%;background:#8796a6}.dot.on{background:rgb(var(--ac));box-shadow:0 0 8px rgba(var(--ac),.8)}
.sq{width:44px;height:44px;border-radius:14px;display:grid;place-items:center;border:1px solid rgba(211,224,238,.16);background:rgba(66,70,76,.42)}
.sq ha-icon{--mdc-icon-size:23px}.sq:active,.b:active,.sc:active{transform:scale(.95)}
.sq.spin ha-icon{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
.hero{display:grid;grid-template-columns:var(--ph,129px) minmax(0,1fr);column-gap:20px;align-items:center;min-height:var(--ph,129px)}
.ph{position:relative;width:var(--ph,129px);height:var(--ph,129px);border-radius:18px;overflow:hidden;display:grid;place-items:center;background:linear-gradient(145deg,rgba(156,180,203,.13),rgba(255,255,255,.025));border:1px solid rgba(211,224,238,.12);color:#b9cadb}
.ph ha-icon{--mdc-icon-size:54px}.ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.info{min-width:0}
.lab{font-size:11px;line-height:16px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#aebdcb;margin-bottom:6px}
.ttl{font-size:20px;line-height:24px;font-weight:600;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.meta{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}.meta span{font-size:11.5px;padding:4px 8px;border-radius:8px;background:rgba(255,255,255,.07);color:#cdd7e2}
.sub{font-size:14px;line-height:19px;color:#b8c6d4;margin-top:4px}
.act{display:flex;gap:10px;margin-top:14px}
.b{flex:1;height:52px;border-radius:16px;display:flex;align-items:center;justify-content:center;gap:9px;font-size:15.5px;font-weight:650;border:1px solid rgba(211,224,238,.16);background:rgba(66,70,76,.42)}
.b ha-icon{--mdc-icon-size:23px}
.b.pri{background:rgba(var(--ac),.30);border-color:rgba(var(--ac),.6)}
.sc-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}
.sc{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;min-height:70px;border-radius:14px;border:1px solid rgba(211,224,238,.16);background:rgba(66,70,76,.30);font-size:13px;font-weight:600;text-align:center;padding:6px 4px}
.sc ha-icon{--mdc-icon-size:23px;color:#c7d7cd}.sc small{display:block;font-size:11px;font-weight:500;color:#aab9c9}
.status{padding:28px 6px;text-align:center;color:#aebdcb;font-size:14px}.err{color:#f0b8bd;font-size:12px;margin-top:8px}
`;
const SHEET_CSS = `
:host{all:initial;position:fixed;inset:0;z-index:2147483000;font-family:var(--ha-font-family-body,Roboto,system-ui,sans-serif);color:#eef3f8}
*{box-sizing:border-box}button,input,select{font:inherit;color:inherit}
button{all:unset;box-sizing:border-box;cursor:pointer;-webkit-tap-highlight-color:transparent}
.bg{position:absolute;inset:0;background:rgba(0,0,0,.55);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);animation:fade .18s ease-out}
.sh{position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:min(100%,640px);height:var(--h,auto);max-height:90vh;display:flex;flex-direction:column;
  background:rgba(30,34,41,.985);border:1px solid rgba(255,255,255,.12);border-bottom:0;border-radius:26px 26px 0 0;box-shadow:0 -18px 48px rgba(0,0,0,.5);
  padding:10px 18px calc(16px + env(safe-area-inset-bottom));animation:up .24s cubic-bezier(.2,.9,.3,1)}
.sh.tall{--h:90vh}
@media(min-width:700px){.sh{bottom:auto;top:50%;transform:translate(-50%,-50%);border-radius:26px;border-bottom:1px solid rgba(255,255,255,.12);animation:pop .2s ease-out;padding-bottom:20px}.grab{display:none}}
@keyframes fade{from{opacity:0}}@keyframes up{from{transform:translate(-50%,100%)}}@keyframes pop{from{opacity:0;transform:translate(-50%,-48%) scale(.97)}}
.grab{flex:none;width:40px;height:5px;border-radius:3px;background:rgba(255,255,255,.25);margin:0 auto 10px}
.top{flex:none;display:flex;align-items:center;gap:12px;margin-bottom:10px}
.top .ic{flex:none;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:rgba(var(--ac),.2);color:rgb(var(--ac))}.top .ic ha-icon{--mdc-icon-size:22px}
.top h3{flex:1;min-width:0;margin:0;font-size:20px;font-weight:650;line-height:1.2;overflow-wrap:anywhere}.top h3 small{display:block;font-size:12.5px;font-weight:500;color:#aebdcb;margin-top:2px}
.x,.bk{flex:none;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.08)}.x ha-icon,.bk ha-icon{--mdc-icon-size:20px}
.intro{flex:none;margin:0 2px 12px;font-size:13px;color:#b4c3d3;line-height:1.4}
.in{flex:none;width:100%;height:46px;border-radius:14px;border:1px solid rgba(211,224,238,.16);background:rgba(66,70,76,.35);padding:0 14px;font-size:15px;outline:none;margin-bottom:12px}
.in:focus{border-color:rgba(var(--ac),.6)}
.body{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;margin:0 -4px;padding:2px 4px 6px}
.tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:14px 10px}
.tile{display:flex;flex-direction:column;gap:7px;min-width:0}.tile:active{transform:scale(.97)}
.cv{position:relative;aspect-ratio:4/3;border-radius:14px;overflow:hidden;display:grid;place-items:center;background:linear-gradient(145deg,rgba(156,180,203,.18),rgba(255,255,255,.03));border:1px solid rgba(211,224,238,.12)}
.cv img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.cv ha-icon{--mdc-icon-size:36px;color:#adbdcd}
.tile .t{font-size:14px;line-height:18px;font-weight:600;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow-wrap:anywhere}
.tile .t small{display:block;font-size:11.5px;font-weight:400;color:#aab9c9;margin-top:2px}
.tile.busy{opacity:.5;pointer-events:none}
.msg{padding:18px 4px;text-align:center;color:#aab9c9;font-size:14px}.msg.err{color:#f0b8bd}
.row{display:flex;align-items:center;gap:12px;min-height:56px;padding:8px 12px;border-radius:14px;border:1px solid rgba(211,224,238,.13);background:rgba(66,70,76,.26);margin-bottom:8px}
.row .ck{flex:none;width:28px;height:28px;border-radius:9px;border:2px solid rgba(211,224,238,.4);display:grid;place-items:center}
.row.done .ck{background:rgb(var(--ac));border-color:rgb(var(--ac))}.row .ck ha-icon{--mdc-icon-size:18px;color:#0b1220;display:none}.row.done .ck ha-icon{display:block}
.row .tx{flex:1;min-width:0;font-size:15.5px;line-height:20px;overflow-wrap:anywhere}.row.done .tx{text-decoration:line-through;color:#8f9cab}
.row .del{flex:none;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;color:#aab9c9}.row .del ha-icon{--mdc-icon-size:19px}
.add{display:flex;gap:8px;flex:none}.add .in{margin:0;flex:1}
.btn{flex:none;height:46px;padding:0 18px;border-radius:14px;display:flex;align-items:center;justify-content:center;gap:8px;font-weight:650;font-size:15px;background:rgba(255,255,255,.09);border:1px solid rgba(211,224,238,.16)}
.btn.pri{background:rgba(var(--ac),.32);border-color:rgba(var(--ac),.65)}.btn ha-icon{--mdc-icon-size:21px}.btn[disabled]{opacity:.45;pointer-events:none}
.sec{font-size:12.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#aebdcb;margin:16px 2px 8px}
.day{display:flex;gap:12px;align-items:center;padding:8px;border-radius:16px;border:1px solid rgba(211,224,238,.13);background:rgba(66,70,76,.24);margin-bottom:8px;min-height:76px}
.day .cv{flex:none;width:76px;aspect-ratio:1;border-radius:12px}.day .cv ha-icon{--mdc-icon-size:26px}
.day .tx{flex:1;min-width:0}.day .tx b{display:block;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#aebdcb;font-weight:700}
.day .tx span{display:block;font-size:16px;font-weight:600;margin-top:3px;overflow-wrap:anywhere}.day .tx span.none{color:#8f9cab;font-weight:500}
.day .sm{flex:none;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:rgba(255,255,255,.08)}.day .sm ha-icon{--mdc-icon-size:21px}
.det-ph{position:relative;height:190px;border-radius:18px;overflow:hidden;margin-bottom:12px;background:linear-gradient(145deg,rgba(156,180,203,.18),rgba(255,255,255,.03));display:grid;place-items:center}
.det-ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.det-ph ha-icon{--mdc-icon-size:48px;color:#adbdcd}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}.chips span{font-size:12px;padding:5px 9px;border-radius:8px;background:rgba(255,255,255,.08);color:#cdd7e2}
.btns{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:6px}.btns .btn{flex:1 1 140px}
.desc{font-size:14px;line-height:1.5;color:#c5d0dc;margin:4px 2px 4px}
.li{font-size:15px;line-height:1.45;padding:7px 2px;border-bottom:1px solid rgba(255,255,255,.06)}.li.h{font-weight:700;color:#aebdcb;border:0;padding-top:12px}
button.li{display:flex;align-items:center;gap:10px;width:100%}button.li span{flex:1;min-width:0;overflow-wrap:anywhere}
button.li ha-icon{flex:none;--mdc-icon-size:18px;color:rgba(var(--ac),.85)}button.li:active{background:rgba(var(--ac),.12);border-radius:10px}
.sec small{font-weight:500;text-transform:none;letter-spacing:0;color:#8f9cab;margin-left:6px}
.fchips{flex:none;display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}
.gchips{flex:none;display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin:-2px -18px 12px;padding:0 18px;-webkit-overflow-scrolling:touch}.gchips::-webkit-scrollbar{display:none}
.gchips button{flex:none;height:38px;padding:0 14px;border-radius:999px;display:flex;align-items:center;gap:6px;font-size:14.5px;font-weight:600;background:rgba(255,255,255,.08);border:1px solid rgba(211,224,238,.16);white-space:nowrap}
.gchips button small{font-size:12px;font-weight:500;color:#9fb0c1}.gchips button.on{background:rgba(var(--ac),.32);border-color:rgba(var(--ac),.75)}.gchips button.on small{color:#e6eef6}
.gchips .clr{background:none;border-color:transparent;color:#aebdcb;padding:0 8px}
.fchips button{height:36px;padding:0 14px;border-radius:999px;display:flex;align-items:center;font-size:14px;font-weight:600;background:rgba(255,255,255,.08);border:1px solid rgba(211,224,238,.16)}
.fchips button.on{background:rgba(var(--ac),.32);border-color:rgba(var(--ac),.7)}
.tile .mt{display:block;font-style:normal;font-size:12px;line-height:15px;color:rgb(var(--ac));margin-top:-3px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
/* cook mode */
.bar{flex:none;display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap}
.seg{display:flex;background:rgba(255,255,255,.07);border-radius:12px;padding:3px;gap:3px;flex:1}
.seg button{flex:1;height:38px;border-radius:10px;display:grid;place-items:center;font-size:14px;font-weight:650;color:#c8d2dd}.seg button.on{background:rgba(var(--ac),.32);color:#fff}
.sz{display:flex;align-items:center;gap:6px;font-size:13px;color:#b4c3d3}
.sz select{height:38px;border-radius:10px;border:1px solid rgba(211,224,238,.2);background:#2a2f37;padding:0 8px;font-size:14px}
.kick{font-size:12.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:rgb(var(--ac));margin:6px 2px 10px}
.step h4{margin:0 2px 8px;font-size:19px}.step p{margin:0 2px;font-size:22px;line-height:1.5}
.prog{flex:none;height:4px;border-radius:2px;background:rgba(255,255,255,.12);overflow:hidden;margin:12px 0}.prog i{display:block;height:100%;background:rgb(var(--ac))}
.nav{flex:none;display:flex;gap:10px}.nav .btn{flex:1;height:54px;font-size:16px}
`;

/* ---------- pop-up sheet ---------- */
function sheet(card, { icon, title, sub = '', tall = false, onBack = null }) {
  const host = document.createElement('div'); host.className = 'one-stop-sheet';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>${SHEET_CSS}</style><div class="bg"></div><div class="sh${tall ? ' tall' : ''}" style="--ac:${card._ac()}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="grab"></div><div class="top">${onBack ? `<button class="bk" aria-label="Back">${ic('arrow-left')}</button>` : `<span class="ic">${ic(icon)}</span>`}<h3>${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ''}</h3><button class="x" aria-label="Close">${ic('close')}</button></div>
    <div class="slot" style="display:contents"></div></div>`;
  const s = { host, root, el: root.querySelector('.slot'), closed: false };
  const prev = document.documentElement.style.overflow;
  s.close = () => { if (s.closed) return; s.closed = true; document.removeEventListener('keydown', key); document.documentElement.style.overflow = prev || ''; host.remove(); if (card._sheet === s) card._sheet = null; s.onClose && s.onClose(); };
  const key = e => { if (e.key === 'Escape') s.close(); };
  root.querySelector('.bg').addEventListener('click', s.close); root.querySelector('.x').addEventListener('click', s.close);
  if (onBack) root.querySelector('.bk').addEventListener('click', () => { s.close(); onBack(); });
  document.addEventListener('keydown', key);
  if (card._sheet) card._sheet.close();
  card._sheet = s; document.body.appendChild(host); document.documentElement.style.overflow = 'hidden';
  return s;
}

class OneStopMealieCard extends HTMLElement {
  static getConfigElement() { return document.createElement(EDITOR_TAG); }
  static getStubConfig(hass) { const t = Object.keys(hass?.states || {}).find(x => x.startsWith('todo.mealie')); return { shopping_list: t || '' }; }
  setConfig(c) { this._cfg = { meal_type: 'dinner', ...c }; if (!this.shadowRoot) this.attachShadow({ mode: 'open' }); this._built = false; this._data = null; if (this._hass) { this._render(); this._load(true); } }
  set hass(h) { const first = !this._hass; this._hass = h; if (!this._built) this._render(); else this._paintShortcuts(); if (first) this._load(true); }
  getCardSize() { return 6; }
  getGridOptions() { return { columns: 12, rows: 'auto', min_columns: 12 }; }
  connectedCallback() { clearInterval(this._t); this._t = setInterval(() => this._load(), 60000); if (this._hass) this._load(); }
  disconnectedCallback() { clearInterval(this._t); if (this._sheet) this._sheet.close(); }
  _ac() { return ACCENT[this._cfg.color] || ACCENT.green; }
  _mealLabel() { return { dinner: 'dinner', lunch: 'lunch', breakfast: 'breakfast', side: 'side' }[this._cfg.meal_type] || 'dinner'; }
  async _entry() {
    if (this._cfg.config_entry_id) return this._cfg.config_entry_id;
    if (this._entryId) return this._entryId;
    const es = await this._hass.callWS({ type: 'config_entries/get', domain: 'mealie' });
    this._entryId = (es.find(e => e.state === 'loaded') || es[0])?.entry_id; return this._entryId;
  }
  async _m(service, data = {}) {
    const r = await this._hass.callWS({ type: 'call_service', domain: 'mealie', service, service_data: { config_entry_id: await this._entry(), ...data }, return_response: true });
    return r.response;
  }
  _shopping() { return this._cfg.shopping_list || Object.keys(this._hass.states).find(x => x.startsWith('todo.mealie')); }
  _img(id) {
    if (!UUID.test(id || '')) return '';
    const t = this._cfg.image_url || (this._cfg.mealie_url ? this._cfg.mealie_url.replace(/\/$/, '') + '/api/media/recipes/{id}/images/min-original.webp' : '');
    return t ? t.replace('{id}', id) : '';
  }
  _date(offset = 0) { const d = new Date(Date.now() + offset * 864e5); return new Intl.DateTimeFormat('en-CA', { timeZone: this._hass?.config?.time_zone || undefined, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d); }
  _meta(r) { const m = []; if (r.prep_time) m.push('Prep ' + r.prep_time); if (r.total_time) m.push('Total ' + r.total_time); else if (r.perform_time) m.push('Cook ' + r.perform_time); if (Number(r.recipe_servings) > 0) m.push(r.recipe_servings + ' servings'); return m; }
  _forType(list, date) { return (Array.isArray(list) ? list : []).filter(e => String(e.mealplan_date ?? e.date ?? '').slice(0, 10) === date && (e.entry_type ?? e.entryType) === this._cfg.meal_type); }
  _rid(e) { return e?.recipe_id || e?.recipe?.recipe_id || e?.recipe?.id; }

  async _load(force = false) {
    if (!this._hass || !this._cfg || this._loading) return;
    const date = this._date();
    if (!force && this._loadedFor === date && Date.now() - (this._at || 0) < 300000) return;
    this._loading = true; this._spin(true);
    try {
      const plan = await this._m('get_mealplan', { start_date: date, end_date: date });
      const entries = this._forType(plan?.mealplan, date), pick = entries.find(e => this._rid(e));
      const recipe = pick ? (await this._m('get_recipe', { recipe_id: this._rid(pick) }))?.recipe : null;
      this._data = { entries, recipe }; this._err = ''; this._loadedFor = date; this._at = Date.now();
    } catch (e) { this._err = 'Couldn’t reach Mealie. Recipes and your list still work.'; this._at = Date.now(); this._loadedFor = date; }
    finally { this._loading = false; this._spin(false); this._paintHero(); }
  }
  _spin(on) { const b = this.shadowRoot?.querySelector('[data-a=refresh]'); if (b) b.classList.toggle('spin', on); }

  _render() {
    const R = this.shadowRoot; if (!R || !this._hass) return;
    R.innerHTML = `<style>${CSS}</style><ha-card style="--ac:${this._ac()}">
      <div class="hd"><div style="min-width:0"><h2>${esc(this._cfg.title || 'What’s cooking?')}</h2><p><span class="dot"></span><span data-st>Mealie</span></p></div>
        <button class="sq" data-a="import" aria-label="Import a recipe">${ic('book-plus-outline')}</button>
        <button class="sq" data-a="refresh" aria-label="Refresh">${ic('refresh')}</button></div>
      <div data-hero><div class="status">Checking tonight’s ${this._mealLabel()}…</div></div>
      <div class="sc-row">
        <button class="sc" data-a="recipes">${ic('book-open-page-variant')}<span>Recipes<small data-n="recipes"></small></span></button>
        <button class="sc" data-a="shopping">${ic('cart-outline')}<span>Shopping list<small data-n="shopping"></small></span></button>
        <button class="sc" data-a="plan">${ic('calendar-week')}<span>Meal plan<small>This week</small></span></button>
      </div><div class="err" data-err></div></ha-card>`;
    this._built = true;
    R.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (!b) return; e.stopPropagation(); this._act(b.dataset.a); });
    this._paintShortcuts(); if (this._data) this._paintHero();
  }
  _paintShortcuts() {
    const R = this.shadowRoot; if (!R || !this._built) return;
    const total = this._hass.states[this._cfg.recipes_sensor || 'sensor.mealie_recipes']?.state, items = this._hass.states[this._shopping()]?.state;
    const a = R.querySelector('[data-n=recipes]'), b = R.querySelector('[data-n=shopping]');
    if (a) a.textContent = /^\d+$/.test(total || '') ? `${total} saved` : 'Browse';
    if (b) b.textContent = /^\d+$/.test(items || '') ? (+items ? `${items} to get` : 'All done') : 'Open';
  }
  _paintHero() {
    const R = this.shadowRoot; if (!R || !this._built) return;
    const box = R.querySelector('[data-hero]'), d = this._data, meal = this._mealLabel();
    R.querySelector('[data-err]').textContent = this._err || '';
    if (!d) { box.innerHTML = `<div class="status">${this._err ? esc(this._err) : `Checking tonight’s ${meal}…`}</div>`; return; }
    const r = d.recipe, note = d.entries.find(e => e.title || e.note_title);
    R.querySelector('[data-st]').textContent = r ? `Tonight · ${r.name}` : 'Mealie · Nothing planned tonight';
    R.querySelector('.dot').classList.toggle('on', !!r);
    if (r) {
      const img = this._img(r.recipe_id), meta = this._meta(r);
      box.innerHTML = `<div class="hero"><div class="ph">${ic('silverware-fork-knife')}${img ? `<img src="${esc(img)}" alt="" onerror="this.remove()">` : ''}</div>
        <div class="info"><div class="lab">Tonight’s ${meal}</div><div class="ttl">${esc(r.name)}</div>${meta.length ? `<div class="meta">${meta.map(m => `<span>${esc(m)}</span>`).join('')}</div>` : ''}${d.entries.length > 1 ? `<div class="sub">+${d.entries.length - 1} more planned</div>` : ''}</div></div>
        <div class="act"><button class="b pri" data-a="cook">${ic('chef-hat')}Cook</button><button class="b" data-a="view">${ic('book-open-variant')}Recipe</button></div>`;
    } else if (note) {
      box.innerHTML = `<div class="hero"><div class="ph">${ic('note-text-outline')}</div><div class="info"><div class="lab">Tonight’s ${meal}</div><div class="ttl">${esc(note.title || note.note_title)}</div><div class="sub">${esc(note.text || note.note_text || '')}</div></div></div>
        <div class="act"><button class="b" data-a="plan">${ic('calendar-edit')}Meal plan</button></div>`;
    } else {
      box.innerHTML = `<div class="hero"><div class="ph">${ic('chef-hat')}</div><div class="info"><div class="lab">Tonight’s ${meal}</div><div class="ttl">What’s on the menu?</div><div class="sub">Nothing planned yet.</div></div></div>
        <div class="act"><button class="b pri" data-a="choose">${ic('calendar-plus')}Choose tonight’s ${meal}</button></div>`;
    }
  }
  _act(a) {
    if (a === 'refresh') return this._load(true);
    if (a === 'recipes') return this._recipes({ mode: 'browse' });
    if (a === 'choose') return this._recipes({ mode: 'pick', date: this._date() });
    if (a === 'shopping') return this._shoppingSheet();
    if (a === 'plan') return this._planSheet();
    if (a === 'import') return this._importSheet();
    if (a === 'cook' && this._data?.recipe) return this._cook(this._data.recipe);
    if (a === 'view' && this._data?.recipe) return this._recipeSheet(this._data.recipe.recipe_id, null, this._data.recipe);
  }

  /* ----- recipes grid (browse or pick for a day) ----- */
  _recipes({ mode, date, back, picked }) {
    const meal = this._mealLabel(), when = date === this._date() ? 'tonight' : date ? new Date(date + 'T12:00').toLocaleDateString(undefined, { weekday: 'long' }) : '';
    const s = sheet(this, { icon: mode === 'pick' ? 'calendar-plus' : 'book-open-page-variant', title: mode === 'pick' ? `Choose ${meal} for ${when}` : 'Your recipes', tall: true, onBack: back });
    s.el.innerHTML = `<p class="intro">${mode === 'pick' ? `Tap a recipe to plan it for ${when}.` : 'Tap a recipe to see it, cook it or plan it.'}</p><input class="in" type="search" placeholder="Search recipes…" aria-label="Search recipes"><div class="gchips" aria-label="Filter by ingredient"></div><div class="body"><div class="tiles"><div class="msg" style="grid-column:1/-1">Loading recipes…</div></div></div>`;
    const grid = s.el.querySelector('.tiles'), input = s.el.querySelector('input'), chipBox = s.el.querySelector('.gchips');
    const sel = new Set(picked || []); let t, q = 0, idx = null, base = [];
    const tile = (id, name, sub, line) => { const img = this._img(id);
      return `<button class="tile" data-id="${esc(id)}"><span class="cv">${ic('silverware-fork-knife')}${img ? `<img src="${esc(img)}" alt="" loading="lazy" onerror="this.remove()">` : ''}</span><span class="t">${esc(name)}${sub ? `<small>${esc(sub)}</small>` : ''}</span>${line ? `<em class="mt">${esc(line)}</em>` : ''}</button>`; };
    const has = (x, g) => x.i.some(l => lineHas(g, l));
    const chips = () => {
      if (!idx) { chipBox.innerHTML = ''; return; }
      const rec = Object.values(idx.r), chosen = GROUPS.filter(g => sel.has(g.k));
      const pool = rec.filter(x => chosen.every(g => has(x, g)));
      const list = GROUPS.map(g => ({ g, n: sel.has(g.k) ? pool.length : pool.filter(x => has(x, g)).length, all: base[g.k] || 0 }))
        .filter(o => sel.has(o.g.k) || o.n > 0).sort((a, b) => sel.has(b.g.k) - sel.has(a.g.k));
      chipBox.innerHTML = (sel.size ? `<button class="clr" data-clear>${ic('close')}Clear</button>` : '') + list.map(o => `<button data-g="${o.g.k}" class="${sel.has(o.g.k) ? 'on' : ''}">${esc(o.g.label)}${sel.has(o.g.k) ? '' : ` <small>${o.n}</small>`}</button>`).join('');
    };
    const filtered = () => {
      const chosen = GROUPS.filter(g => sel.has(g.k)), term = input.value.trim().toLowerCase();
      const hits = Object.entries(idx.r).filter(([, x]) => chosen.every(g => has(x, g)) && (!term || x.n.toLowerCase().includes(term)))
        .sort((a, b) => a[1].n.localeCompare(b[1].n));
      grid.innerHTML = hits.length ? hits.map(([id, x]) => tile(id, x.n, x.t, chosen.length ? chosen.map(g => (x.i.find(l => lineHas(g, l)) || '').replace(/\s+/g, ' ')).filter(Boolean).join(' · ').slice(0, 90) : '')).join('')
        : '<div class="msg" style="grid-column:1/-1">No recipes have all of those. Tap one to remove it.</div>';
      s.root.querySelector('h3').firstChild.textContent = chosen.length ? `${hits.length} recipe${hits.length === 1 ? '' : 's'} with ${chosen.map(g => g.label.toLowerCase()).join(' + ')}` : (mode === 'pick' ? `Choose ${meal} for ${when}` : 'Your recipes');
    };
    const load = async term => {
      if (sel.size && idx) return filtered();
      const n = ++q; grid.innerHTML = '<div class="msg" style="grid-column:1/-1">Loading recipes…</div>';
      try {
        const r = await this._m('get_recipes', { result_limit: 500, ...(term ? { search_terms: term } : {}) }); if (n !== q || s.closed) return;
        const items = r?.recipes?.items || [];
        grid.innerHTML = items.length ? items.map(x => tile(x.recipe_id, x.name, x.total_time || x.perform_time || '')).join('')
          : `<div class="msg" style="grid-column:1/-1">${term ? 'No recipes match.' : 'No recipes yet. Use the import button to add one.'}</div>`;
      } catch (e) { if (n === q) grid.innerHTML = '<div class="msg err" style="grid-column:1/-1">Couldn’t load recipes.</div>'; }
    };
    input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => load(input.value.trim()), 300); });
    chipBox.addEventListener('click', e => {
      const c = e.target.closest('button'); if (!c || !idx) return;
      if (c.dataset.clear !== undefined) sel.clear(); else sel.has(c.dataset.g) ? sel.delete(c.dataset.g) : sel.add(c.dataset.g);
      chips(); grid.parentElement.scrollTop = 0;
      if (sel.size) filtered(); else { s.root.querySelector('h3').firstChild.textContent = mode === 'pick' ? `Choose ${meal} for ${when}` : 'Your recipes'; load(input.value.trim()); }
    });
    grid.addEventListener('click', async e => {
      const tl = e.target.closest('.tile'); if (!tl) return;
      if (mode !== 'pick') return this._recipeSheet(tl.dataset.id, () => this._recipes({ mode, date, back, picked: [...sel] }));
      tl.classList.add('busy');
      try { await this._plan(date, tl.dataset.id); s.close(); this._load(true); if (back) back(); }
      catch (err) { tl.classList.remove('busy'); input.insertAdjacentHTML('afterend', `<div class="msg err">${esc(err.message || 'Couldn’t plan that recipe.')}</div>`); }
    });
    if (!sel.size) load('');
    this._ingIndex().then(x => {
      if (s.closed) return; idx = x; base = {};
      for (const g of GROUPS) base[g.k] = Object.values(idx.r).filter(r => has(r, g)).length;
      chips(); if (sel.size) filtered();
    }).catch(() => {});
  }
  async _plan(date, recipeId) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !UUID.test(recipeId)) throw new Error('Invalid day or recipe');
    const has = async () => this._forType((await this._m('get_mealplan', { start_date: date, end_date: date }))?.mealplan, date).find(e => this._rid(e) === recipeId);
    if (await has()) return;
    await this._m('set_mealplan', { date, entry_type: this._cfg.meal_type, recipe_id: recipeId });
    if (!(await has())) throw new Error('Mealie didn’t confirm the plan. Refresh and try again.');
  }

  /* ----- one recipe ----- */
  async _recipeSheet(id, back, known) {
    const s = sheet(this, { icon: 'book-open-variant', title: known?.name || 'Recipe', tall: true, onBack: back });
    s.el.innerHTML = '<div class="body"><div class="msg">Loading recipe…</div></div>';
    let r = known && known.ingredients ? known : null;
    try { if (!r) r = (await this._m('get_recipe', { recipe_id: id }))?.recipe; } catch (e) {}
    if (s.closed) return;
    if (!r) { s.el.innerHTML = '<div class="body"><div class="msg err">Couldn’t load this recipe.</div></div>'; return; }
    s.root.querySelector('h3').firstChild.textContent = r.name;
    const img = this._img(r.recipe_id), meta = this._meta(r);
    s.el.innerHTML = `<div class="body">
      <div class="det-ph">${ic('silverware-fork-knife')}${img ? `<img src="${esc(img)}" alt="" onerror="this.remove()">` : ''}</div>
      ${meta.length ? `<div class="chips">${meta.map(m => `<span>${esc(m)}</span>`).join('')}</div>` : ''}
      <div class="btns"><button class="btn pri" data-x="cook">${ic('chef-hat')}Cook</button><button class="btn" data-x="tonight">${ic('calendar-plus')}Make tonight’s ${this._mealLabel()}</button><button class="btn" data-x="list">${ic('cart-plus')}Add to shopping list</button></div>
      <div class="msg" data-msg style="display:none"></div>
      ${r.description ? `<p class="desc">${esc(r.description)}</p>` : ''}
      <div class="sec">Ingredients<small>Tap one to find other recipes with it</small></div>${(r.ingredients || []).map((x, i) => x.title && !x.food && !x.note ? `<div class="li h">${esc(x.title)}</div>` : foodKey(x.food?.name || ingText(x)) ? `<button class="li" data-ing="${i}"><span>${esc(ingText(x))}</span>${ic('magnify')}</button>` : `<div class="li">${esc(ingText(x))}</div>`).join('') || '<div class="msg">No ingredients listed.</div>'}
      <div class="sec">Steps</div>${(r.instructions || []).map((x, i) => `<div class="li"><b>${i + 1}.</b> ${esc(x.text)}</div>`).join('') || '<div class="msg">No steps listed.</div>'}
    </div>`;
    const msg = s.el.querySelector('[data-msg]'), say = (t, bad) => { msg.style.display = ''; msg.className = 'msg' + (bad ? ' err' : ''); msg.textContent = t; };
    s.el.querySelector('[data-x=cook]').addEventListener('click', () => this._cook(r));
    s.el.querySelector('[data-x=tonight]').addEventListener('click', async e => { const b = e.currentTarget; b.setAttribute('disabled', ''); say('Planning…'); try { await this._plan(this._date(), r.recipe_id); say(`Planned for tonight’s ${this._mealLabel()}.`); this._load(true); } catch (err) { say(err.message, true); } b.removeAttribute('disabled'); });
    s.el.querySelector('[data-x=list]').addEventListener('click', () => this._toList(r, () => this._recipeSheet(r.recipe_id, back, r)));
    s.el.querySelectorAll('[data-ing]').forEach(b => b.addEventListener('click', () => {
      const x = r.ingredients[+b.dataset.ing];
      this._withIngredient(foodKey(x.food?.name || ingText(x)), r, () => this._recipeSheet(r.recipe_id, back, r));
    }));
  }

  /* ----- recipes that use an ingredient ----- */
  async _ingIndex(progress) {
    const KEY = 'one-stop-mealie-ing:' + (await this._entry());
    let idx = this._idx;
    if (!idx) { try { idx = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { idx = null; } }
    idx = idx && idx.v === 2 ? idx : { v: 2, r: {} };
    if (this._idx && Date.now() - (this._idxAt || 0) < 120000) return this._idx;
    const list = (await this._m('get_recipes', { result_limit: 1000 }))?.recipes?.items || [];
    const live = new Set(list.map(x => x.recipe_id));
    for (const id of Object.keys(idx.r)) if (!live.has(id)) delete idx.r[id];
    const todo = list.filter(x => !idx.r[x.recipe_id] || idx.r[x.recipe_id].u !== (x.date_updated || x.date_added || ''));
    let done = 0;
    const work = async () => { for (let x; (x = todo.shift());) {
      try { const d = (await this._m('get_recipe', { recipe_id: x.recipe_id }))?.recipe;
        if (d) idx.r[x.recipe_id] = { n: d.name, t: d.total_time || d.perform_time || '', u: x.date_updated || x.date_added || '', i: (d.ingredients || []).filter(y => !(y.title && !y.food && !y.note)).map(y => { const t = ingText(y) || y.display || y.note || ''; return y.food?.name && !t.toLowerCase().includes(y.food.name.toLowerCase()) ? `${t} ${y.food.name}` : t; }) };
      } catch (e) {}
      progress && progress(++done, done + todo.length);
    } };
    if (todo.length) { await Promise.all(Array.from({ length: 6 }, work)); try { localStorage.setItem(KEY, JSON.stringify(idx)); } catch (e) {} }
    this._idx = idx; this._idxAt = Date.now(); return idx;
  }
  _withIngredient(key, from, back) {
    const s = sheet(this, { icon: 'food-apple-outline', title: 'Recipes with ' + key, sub: from ? 'From ' + from.name : '', tall: true, onBack: back });
    const all = words(key), chipsFor = k => [...new Set([k, ...(all.length > 1 ? words(k).filter(w => w.length > 2) : [])])];
    s.el.innerHTML = `<div class="fchips"></div><input class="in" type="search" placeholder="Any ingredient…" aria-label="Ingredient" value="${esc(key)}"><div class="body"><div class="tiles"><div class="msg" style="grid-column:1/-1">Looking through your recipes…</div></div></div>`;
    const grid = s.el.querySelector('.tiles'), input = s.el.querySelector('input'), chipBox = s.el.querySelector('.fchips');
    const chips = chipsFor(key); let t;
    const run = async q => {
      chipBox.style.display = chips.length > 1 ? '' : 'none';
      chipBox.innerHTML = chips.map(c => `<button data-c="${esc(c)}" class="${c === q ? 'on' : ''}">${esc(c)}</button>`).join('');
      s.root.querySelector('h3').firstChild.textContent = 'Recipes with ' + q;
      const need = words(q); if (!need.length) { grid.innerHTML = '<div class="msg" style="grid-column:1/-1">Type an ingredient.</div>'; return; }
      let idx;
      try { idx = await this._ingIndex((a, b) => { if (!s.closed && b > 8) grid.innerHTML = `<div class="msg" style="grid-column:1/-1">Reading your recipes… ${a} of ${b}</div>`; }); }
      catch (e) { grid.innerHTML = '<div class="msg err" style="grid-column:1/-1">Couldn’t read your recipes.</div>'; return; }
      if (s.closed || input.value.trim().toLowerCase() !== q) return;
      const hits = [];
      for (const [id, x] of Object.entries(idx.r)) {
        if (from && id === from.recipe_id) continue;
        const line = x.i.find(l => { const w = new Set(words(l)); return need.every(n => w.has(n)); });
        if (line) hits.push([id, x, line]);
      }
      hits.sort((a, b) => a[1].n.localeCompare(b[1].n));
      grid.innerHTML = hits.length ? hits.map(([id, x, line]) => { const img = this._img(id);
        return `<button class="tile" data-id="${esc(id)}"><span class="cv">${ic('silverware-fork-knife')}${img ? `<img src="${esc(img)}" alt="" loading="lazy" onerror="this.remove()">` : ''}</span><span class="t">${esc(x.n)}</span><em class="mt">${esc(line.replace(/\s+/g, ' ').slice(0, 80))}</em></button>`; }).join('')
        : `<div class="msg" style="grid-column:1/-1">No other recipes use “${esc(q)}”.${chips.length > 1 ? ' Try a shorter word above.' : ''}</div>`;
    };
    chipBox.addEventListener('click', e => { const c = e.target.closest('[data-c]'); if (!c) return; input.value = c.dataset.c; run(c.dataset.c); });
    input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => run(input.value.trim().toLowerCase()), 300); });
    grid.addEventListener('click', e => { const tile = e.target.closest('.tile'); if (tile) this._recipeSheet(tile.dataset.id, () => this._withIngredient(input.value.trim().toLowerCase() || key, from, back)); });
    run(key);
  }
  _toList(r, back) {
    const ent = this._shopping(); const s = sheet(this, { icon: 'cart-plus', title: 'Add to shopping list', sub: r.name, tall: true, onBack: back });
    const rows = (r.ingredients || []).map((x, i) => ({ i, title: x.title && !x.food && !x.note, x })).filter(o => !o.title && ingText(o.x).trim());
    const sel = new Set(rows.map(o => o.i)); let k = 1;
    const draw = () => {
      s.el.innerHTML = `<div class="bar"><span class="sz">Recipe size <select>${[.5, 1, 1.5, 2, 3, 4].map(n => `<option value="${n}"${n === k ? ' selected' : ''}>${n}×</option>`).join('')}</select></span></div>
        <p class="intro">Untick anything you already have.</p>
        <div class="body">${rows.map(o => `<button class="row${sel.has(o.i) ? ' done' : ''}" data-i="${o.i}" style="width:100%"><span class="ck">${ic('check')}</span><span class="tx">${esc(ingText(o.x, k))}</span></button>`).join('')}</div>
        <div class="add" style="margin-top:10px"><button class="btn pri" data-go style="flex:1">${ic('cart-plus')}Add ${sel.size} item${sel.size === 1 ? '' : 's'}</button></div><div class="msg" data-msg style="display:none"></div>`;
      s.el.querySelectorAll('.row').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.i; sel.has(i) ? sel.delete(i) : sel.add(i); draw(); }));
      s.el.querySelector('select').addEventListener('change', e => { k = +e.target.value; draw(); });
      s.el.querySelector('[data-go]').addEventListener('click', async e => {
        const b = e.currentTarget, msg = s.el.querySelector('[data-msg]'); if (!sel.size) return; b.setAttribute('disabled', ''); msg.style.display = ''; msg.className = 'msg'; msg.textContent = 'Adding…';
        let n = 0;
        try { for (const o of rows) if (sel.has(o.i)) { await this._hass.callService('todo', 'add_item', { item: ingText(o.x, k).trim() }, { entity_id: ent }); n++; } msg.textContent = `Added ${n} item${n === 1 ? '' : 's'} to your shopping list.`; }
        catch (err) { msg.className = 'msg err'; msg.textContent = `Added ${n} before it failed. Check your list before trying again.`; b.removeAttribute('disabled'); }
      });
    };
    if (!ent) { s.el.innerHTML = '<div class="msg err">Pick a shopping list in the card settings first.</div>'; return; }
    draw();
  }

  /* ----- cook mode ----- */
  _cook(r) {
    const key = 'one-stop-cook:' + r.recipe_id; let st = { tab: 'steps', step: 0, k: 1, done: [], fin: false };
    try { st = { ...st, ...JSON.parse(sessionStorage.getItem(key) || '{}') }; } catch (e) {}
    const steps = r.instructions || [], ings = r.ingredients || [];
    const s = sheet(this, { icon: 'chef-hat', title: r.name, sub: 'Cook mode', tall: true });
    const save = () => { try { sessionStorage.setItem(key, JSON.stringify(st)); } catch (e) {} };
    let scrollTop = 0;
    const draw = () => {
      const body = s.el.querySelector('.body'); if (body) scrollTop = body.scrollTop;
      const done = new Set(st.done), cur = steps[st.step];
      const serv = Number(r.recipe_servings) > 0 ? ` · ${+(r.recipe_servings * st.k).toFixed(1)} servings` : '';
      s.el.innerHTML = `<div class="bar"><div class="seg"><button data-t="ingredients" class="${st.tab === 'ingredients' ? 'on' : ''}">Ingredients ${done.size}/${ings.filter(x => !(x.title && !x.food && !x.note)).length}</button><button data-t="steps" class="${st.tab === 'steps' ? 'on' : ''}">Steps</button></div>
        <span class="sz">Size${serv}<select aria-label="Recipe size">${[.5, 1, 1.5, 2, 3, 4].map(n => `<option value="${n}"${n === st.k ? ' selected' : ''}>${n}×</option>`).join('')}</select></span></div>
        <div class="body">${st.tab === 'ingredients'
          ? ings.map((x, i) => x.title && !x.food && !x.note ? `<div class="li h">${esc(x.title)}</div>` : `<button class="row${done.has(i) ? ' done' : ''}" data-i="${i}" style="width:100%"><span class="ck">${ic('check')}</span><span class="tx">${esc(ingText(x, st.k))}</span></button>`).join('') || '<div class="msg">No ingredients listed.</div>'
          : `<div class="step"><div class="kick">${st.fin ? 'All done' : `Step ${steps.length ? st.step + 1 : 0} of ${steps.length}`}</div>${st.fin ? '<h4>Enjoy your meal.</h4><p style="font-size:17px;color:#b8c6d4">Go back to any step if you need to.</p>' : `${cur?.title ? `<h4>${esc(cur.title)}</h4>` : ''}<p>${esc(cur?.text || 'This recipe has no steps yet.')}</p>`}</div>`}</div>
        ${st.tab === 'steps' ? `<div class="prog"><i style="width:${steps.length ? (st.fin ? 100 : (st.step + 1) / steps.length * 100) : 0}%"></i></div><div class="nav"><button class="btn" data-n="prev"${st.step === 0 && !st.fin ? ' disabled' : ''}>${ic('chevron-left')}Back</button><button class="btn pri" data-n="next"${st.fin || !steps.length ? ' disabled' : ''}>${st.step >= steps.length - 1 ? 'Finish' : 'Next'}${ic('chevron-right')}</button></div>` : ''}`;
      const nb = s.el.querySelector('.body'); if (st.tab === 'ingredients') nb.scrollTop = scrollTop;
      s.el.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => { st.tab = b.dataset.t; scrollTop = 0; save(); draw(); }));
      s.el.querySelector('select').addEventListener('change', e => { st.k = +e.target.value; save(); draw(); });
      s.el.querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.i, set = new Set(st.done); set.has(i) ? set.delete(i) : set.add(i); st.done = [...set]; save(); draw(); }));
      s.el.querySelectorAll('[data-n]').forEach(b => b.addEventListener('click', () => {
        if (b.dataset.n === 'prev') { if (st.fin) st.fin = false; else st.step = Math.max(0, st.step - 1); }
        else if (st.step >= steps.length - 1) st.fin = true; else st.step++;
        save(); draw();
      }));
    };
    draw();
  }

  /* ----- shopping list (any todo entity) ----- */
  async _shoppingSheet() {
    const ent = this._shopping(); const name = this._hass.states[ent]?.attributes?.friendly_name || 'Shopping list';
    const s = sheet(this, { icon: 'cart-outline', title: 'Shopping list', sub: name, tall: true });
    if (!ent) { s.el.innerHTML = '<div class="msg err">Pick a shopping list in the card settings first.</div>'; return; }
    s.el.innerHTML = `<div class="add" style="margin-bottom:12px"><input class="in" style="margin:0" placeholder="Add an item…" aria-label="Add an item"><button class="btn pri" data-add aria-label="Add">${ic('plus')}</button></div><div class="body"><div class="msg">Loading…</div></div><div class="add" style="margin-top:10px"><button class="btn" data-clear style="flex:1">${ic('broom')}Clear checked items</button></div>`;
    const body = s.el.querySelector('.body'), input = s.el.querySelector('input');
    const load = async () => {
      try {
        const r = await this._hass.callWS({ type: 'todo/item/list', entity_id: ent }); if (s.closed) return;
        const items = r.items || [], open = items.filter(i => i.status !== 'completed'), done = items.filter(i => i.status === 'completed');
        const row = i => `<div class="row${i.status === 'completed' ? ' done' : ''}" data-uid="${esc(i.uid)}"><button class="ck" data-tg aria-label="Tick">${ic('check')}</button><span class="tx">${esc(i.summary)}</span><button class="del" data-del aria-label="Remove">${ic('close')}</button></div>`;
        body.innerHTML = (open.length ? open.map(row).join('') : '<div class="msg">Nothing to buy. Nice.</div>') + (done.length ? `<div class="sec">Checked</div>${done.map(row).join('')}` : '');
        this._items = items;
      } catch (e) { body.innerHTML = '<div class="msg err">Couldn’t load your list.</div>'; }
    };
    const add = async () => { const v = input.value.trim(); if (!v) return; input.value = ''; await this._hass.callService('todo', 'add_item', { item: v }, { entity_id: ent }); load(); };
    s.el.querySelector('[data-add]').addEventListener('click', add);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
    body.addEventListener('click', async e => {
      const rowEl = e.target.closest('.row'); if (!rowEl) return; const it = (this._items || []).find(i => i.uid === rowEl.dataset.uid); if (!it) return;
      if (e.target.closest('[data-del]')) { rowEl.style.opacity = .4; await this._hass.callService('todo', 'remove_item', { item: it.uid }, { entity_id: ent }); }
      else { rowEl.classList.toggle('done'); await this._hass.callService('todo', 'update_item', { item: it.uid, status: it.status === 'completed' ? 'needs_action' : 'completed' }, { entity_id: ent }); }
      load();
    });
    s.el.querySelector('[data-clear]').addEventListener('click', async () => { try { await this._hass.callService('todo', 'remove_completed_items', {}, { entity_id: ent }); } catch (e) {} load(); });
    load();
  }

  /* ----- meal plan: next 7 days ----- */
  async _planSheet() {
    const s = sheet(this, { icon: 'calendar-week', title: 'Meal plan', sub: `${this._mealLabel()[0].toUpperCase() + this._mealLabel().slice(1)} · next 7 days`, tall: true });
    s.el.innerHTML = '<div class="body"><div class="msg">Loading your week…</div></div>';
    const body = s.el.querySelector('.body');
    const load = async () => {
      const days = [...Array(7)].map((_, i) => this._date(i));
      try {
        const r = await this._m('get_mealplan', { start_date: days[0], end_date: days[6] }); if (s.closed) return;
        this._week = r?.mealplan || [];
        body.innerHTML = days.map((d, i) => {
          const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : new Date(d + 'T12:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
          const es = this._forType(this._week, d);
          if (!es.length) return `<div class="day"><span class="cv">${ic('calendar-blank-outline')}</span><span class="tx"><b>${esc(label)}</b><span class="none">Nothing planned</span></span><button class="sm" data-add="${d}" aria-label="Plan ${esc(label)}">${ic('plus')}</button></div>`;
          return es.map(e => { const id = this._rid(e), img = this._img(id), nm = e.recipe?.name || e.title || e.note_title || 'Note';
            return `<div class="day"><button class="cv" data-open="${esc(id || '')}">${ic(id ? 'silverware-fork-knife' : 'note-text-outline')}${img ? `<img src="${esc(img)}" alt="" loading="lazy" onerror="this.remove()">` : ''}</button><button class="tx" data-open="${esc(id || '')}" style="text-align:left"><b>${esc(label)}</b><span>${esc(nm)}</span></button><button class="sm" data-rm="${esc(e.mealplan_id ?? e.id ?? '')}" aria-label="Remove from plan">${ic('close')}</button></div>`; }).join('');
        }).join('');
      } catch (e) { body.innerHTML = '<div class="msg err">Couldn’t load your meal plan.</div>'; }
    };
    body.addEventListener('click', async e => {
      const add = e.target.closest('[data-add]'), open = e.target.closest('[data-open]'), rm = e.target.closest('[data-rm]');
      if (add) return this._recipes({ mode: 'pick', date: add.dataset.add, back: () => this._planSheet() });
      if (open && open.dataset.open) return this._recipeSheet(open.dataset.open, () => this._planSheet());
      if (rm && rm.dataset.rm) { rm.closest('.day').style.opacity = .4; try { await this._m('delete_mealplan', { mealplan_id: Number(rm.dataset.rm) }); } catch (err) {} this._load(true); load(); }
    });
    load();
  }

  /* ----- import a recipe from a web page ----- */
  _importSheet() {
    const s = sheet(this, { icon: 'book-plus-outline', title: 'Import a recipe', sub: 'From any recipe website' });
    s.el.innerHTML = `<p class="intro">Paste the link to a recipe page. Mealie copies the photo, ingredients and steps.</p><input class="in" type="url" inputmode="url" placeholder="https://…" aria-label="Recipe link"><div class="add"><button class="btn pri" data-go style="flex:1">${ic('download')}Import</button></div><div class="msg" data-msg style="display:none"></div>`;
    const input = s.el.querySelector('input'), msg = s.el.querySelector('[data-msg]');
    setTimeout(() => input.focus(), 250);
    s.el.querySelector('[data-go]').addEventListener('click', async e => {
      const url = input.value.trim(), b = e.currentTarget; if (!/^https?:\/\/\S+$/i.test(url)) { msg.style.display = ''; msg.className = 'msg err'; msg.textContent = 'That doesn’t look like a web link.'; return; }
      b.setAttribute('disabled', ''); msg.style.display = ''; msg.className = 'msg'; msg.textContent = 'Importing… this can take a few seconds.';
      try { const r = await this._m('import_recipe', { url }); const rec = r?.recipe; msg.textContent = rec?.name ? `Added “${rec.name}”.` : 'Recipe imported.'; if (rec?.recipe_id) setTimeout(() => this._recipeSheet(rec.recipe_id, null, rec.ingredients ? rec : null), 700); }
      catch (err) { msg.className = 'msg err'; msg.textContent = 'Mealie couldn’t read that page. Try a different link.'; b.removeAttribute('disabled'); }
    });
  }
}

class OneStopMealieCardEditor extends HTMLElement {
  setConfig(c) { this._config = { ...c }; this._draw(); }
  set hass(h) { this._hass = h; if (this._form) this._form.hass = h; else this._draw(); }
  _draw() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement('ha-form');
      this._form.computeLabel = s => ({ title: 'Title (default: What’s cooking?)', shopping_list: 'Shopping list', meal_type: 'Meal to show', color: 'Accent colour', mealie_url: 'Mealie address for photos (e.g. http://192.168.1.10:9925)', image_url: 'Or a custom photo address ({id} = recipe id)', config_entry_id: 'Mealie connection (only if you have more than one)', recipes_sensor: 'Recipe count sensor' }[s.name] || s.name);
      this._form.addEventListener('value-changed', e => { const out = { type: this._config.type }; for (const [k, x] of Object.entries(e.detail.value)) if (x !== '' && x != null) out[k] = x; this._config = out; this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: out }, bubbles: true, composed: true })); });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._form.schema = [
      { type: 'grid', name: '', schema: [{ name: 'title', selector: { text: {} } }, { name: 'color', selector: { select: { mode: 'dropdown', options: Object.keys(ACCENT) } } }] },
      { type: 'grid', name: '', schema: [{ name: 'shopping_list', selector: { entity: { domain: 'todo' } } }, { name: 'meal_type', selector: { select: { mode: 'dropdown', options: ['dinner', 'lunch', 'breakfast', 'side'] } } }] },
      { name: 'mealie_url', selector: { text: {} } },
      { name: 'image_url', selector: { text: {} } },
      { name: 'recipes_sensor', selector: { entity: { domain: 'sensor' } } },
      { name: 'config_entry_id', selector: { config_entry: { integration: 'mealie' } } },
    ];
    this._form.data = { meal_type: 'dinner', ...this._config };
  }
}
if (!customElements.get(TAG)) customElements.define(TAG, OneStopMealieCard);
if (!customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, OneStopMealieCardEditor);
window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === TAG)) window.customCards.push({ type: TAG, name: 'One Stop - Mealie', description: 'Tonight’s dinner with Cook mode, plus Recipes, Shopping list, Meal plan and Import pop-ups.', preview: false });
console.info(`%c ONE STOP MEALIE %c ${VERSION} `, 'color:#fff;background:#4d7c5a;font-weight:700', 'color:#4d7c5a;background:#fff');
})();
