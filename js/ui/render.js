// Top bar + current sheet + wealth chart.
import { S } from '../game/state.js';
import { DEF } from '../content/assets.js';
import { BUILD } from '../content/buildables.js';
import { CARS } from '../content/cars.js';
import { ETF } from '../content/etfs.js';
import {
  fmt, pct, BANK, MONTHS,
  machine, netWorth, wealthSeries, growthRate,
} from '../game/economy.js';
import { currentGoal } from '../game/goals.js';
import { mode, setMode } from './sheet.js';
import { $ } from './fx.js';
import { showArea } from '../world/pins.js';
import {
  shopHTML, mineHTML, goalsHTML, cityHTML,
  itemHTML, carHTML, etfHTML, dealHTML,
  shopCategoryLabel,
} from './screens.js';

const moodChip = () => S.mood === 'sale' ? ['🏷️ Sale: prices are low', 'sale']
                     : S.mood === 'hot'  ? ['🔥 Prices are high', 'hot']
                     : ['🙂 Normal prices', ''];

export function renderTop() {
  $('kDate').textContent = `${MONTHS[S.m % 12]} ${2027 + Math.floor(S.m/12)}`;
  const [mt, mc] = moodChip();
  $('kMood').textContent = mt; $('kMood').className = 'chip ' + mc;
  const loanEl = $('kLoan');
  loanEl.textContent = S.loan > 0 ? fmt(S.loan) : '$0';
  loanEl.classList.toggle('debt', S.loan > 0);
  $('kCash').textContent = fmt(S.cash);
  $('kMachine').textContent = fmt(machine()) + '/mo';
  $('kNW').textContent = fmt(netWorth());
  const g = currentGoal();
  const goalText = g ? `🎯 ${g.t}` : '🏆 You finished every goal!';
  const chip = $('kGoal');
  if (chip.textContent !== goalText) {
    chip.textContent = goalText;
    chip.classList.remove('pulse'); void chip.offsetWidth; chip.classList.add('pulse');
  }
}

export function render() {
  renderTop();
  const sh = $('kSheet');
  document.querySelectorAll('#kNav [data-k]').forEach(b => b.classList.toggle('on', !!mode && mode.tab === b.dataset.k));
  if (!mode) { sh.hidden = true; showArea(null); return; }
  sh.hidden = false;
  let t = '', h = '';
  if (mode.item) {
    const d = DEF[mode.item], dv = S.own[mode.item] && S.own[mode.item].dev;
    t = (dv ? BUILD[dv.type].icon : d.icon) + ' ' + d.name;
    h = itemHTML(mode.item);
  } else if (mode.car) {
    const c = CARS[mode.car]; t = c.icon + ' ' + c.name; h = carHTML(mode.car);
  } else if (mode.etf) {
    const E = ETF[mode.etf]; t = E.icon + ' ' + E.name; h = etfHTML(mode.etf);
  } else if (mode.deal) {
    const d = S.deals.find(x => x.id === mode.deal);
    if (!d) { setMode({tab:'shop'}); return render(); }
    t = '💻 ' + d.name; h = dealHTML(d, false);
  } else if (mode.saas) {
    const d = S.saas.find(x => x.id === mode.saas);
    if (!d) { setMode({tab:'mine'}); return render(); }
    t = '💻 ' + d.name; h = dealHTML(d, true);
  } else {
    const subLabel = mode.tab === 'shop' && mode.sub ? shopCategoryLabel(mode.sub) : '';
    t = subLabel ? `🛒 ${subLabel}` : {shop:'🛒 Shop', mine:'📦 My stuff and bank', goals:'⭐ Goals', city:'🗺️ City', wealth:'🏆 Your wealth'}[mode.tab];
    h = {shop:shopHTML, mine:mineHTML, goals:goalsHTML, city:cityHTML, wealth:wealthHTML}[mode.tab]();
  }
  $('kTitle').textContent = t;
  $('kBody').innerHTML = h;
  showArea(mode.item);
  if (mode.tab === 'wealth') drawWealth();
  sh.classList.toggle('item', !!(mode.item && DEF[mode.item].pos));
  if (mode.etf) sh.classList.remove('item');
  if (mode.car) sh.classList.add('item');
}

export function wealthHTML() {
  const g = growthRate(), nw = netWorth(), yrs = Math.floor(S.m/12);
  let h = `<div class="facts"><div><small>Total wealth now</small><b>${fmt(nw)}</b></div><div><small>Growth per year</small><b class="${g === null ? '' : g >= 0 ? 'good' : 'bad'}">${g === null ? '—' : (g >= 0 ? '+' : '') + pct(g)}</b></div><div><small>Years played</small><b>${yrs}</b></div></div>`;
  h += '<canvas id="kChart" style="width:100%;height:190px;display:block"></canvas>';
  if (g === null) h += '<div class="say">Play at least one year to see how fast your wealth grows.</div>';
  else {
    h += `<div class="say">On average your wealth grew <b>${pct(g)} a year</b>. That includes what you saved from your job, not just what your stuff earned.`;
    h += g > BANK ? ` The bank pays ${pct(BANK)}, so you\u2019re beating it.` : ` That\u2019s less than the bank\u2019s ${pct(BANK)}: your money could work harder.`;
    if (g > 0) h += `<br>📈 If it keeps growing like this, in 10 years you\u2019d have about <b>${fmt(nw*Math.pow(1 + g, 10))}</b>. Growth on top of growth is called compounding.`;
    h += '</div>';
  }
  return h;
}

export function drawWealth() {
  const cv = $('kChart'); if (!cv) return;
  const {pts, from} = wealthSeries(), dpr = Math.min(2, devicePixelRatio || 1), W = cv.clientWidth || 320, H = 190;
  cv.width = W*dpr; cv.height = H*dpr;
  const x = cv.getContext('2d'); x.scale(dpr, dpr);
  const cs = getComputedStyle(document.body), ink = cs.color;
  const coin = getComputedStyle(document.documentElement).getPropertyValue('--good').trim() || '#2f8a5b';
  const L = 46, Rr = 8, T = 12, B = 24;
  if (pts.length < 2) {
    x.fillStyle = ink; x.globalAlpha = 0.6; x.font = '14px system-ui, sans-serif';
    x.fillText('Press Next month to start your chart.', 10, H/2); return;
  }
  const lo = Math.min(0, ...pts), hi = Math.max(...pts)*1.05 || 1;
  const X = i => L + i*(W - L - Rr)/(pts.length - 1), Y = v => T + (1 - (v - lo)/(hi - lo))*(H - T - B);
  x.font = '11px system-ui, sans-serif'; x.fillStyle = ink; x.strokeStyle = ink; x.textAlign = 'right';
  for (let k = 0; k <= 3; k++) {
    const v = lo + (hi - lo)*k/3, y = Y(v);
    x.globalAlpha = 0.15; x.beginPath(); x.moveTo(L, y); x.lineTo(W - Rr, y); x.stroke();
    x.globalAlpha = 0.7; x.fillText(fmt(v), L - 6, y + 4);
  }
  x.textAlign = 'center';
  const step = Math.max(12, Math.ceil(pts.length/60)*12);
  for (let i = 0; i < pts.length; i++) { const m = from + i; if (m % step === 0) { x.globalAlpha = 0.7; x.fillText(String(2027 + m/12), X(i), H - 6); } }
  x.globalAlpha = 1;
  const grad = x.createLinearGradient(0, T, 0, H - B);
  grad.addColorStop(0, coin + '66'); grad.addColorStop(1, coin + '00');
  x.beginPath(); x.moveTo(X(0), Y(Math.max(lo, 0)));
  pts.forEach((v, i) => x.lineTo(X(i), Y(v)));
  x.lineTo(X(pts.length - 1), Y(Math.max(lo, 0))); x.closePath();
  x.fillStyle = grad; x.fill();
  x.beginPath();
  pts.forEach((v, i) => i ? x.lineTo(X(i), Y(v)) : x.moveTo(X(i), Y(v)));
  x.strokeStyle = coin; x.lineWidth = 2.5; x.stroke();
  const lx = X(pts.length - 1), ly = Y(pts[pts.length - 1]);
  x.fillStyle = coin; x.beginPath(); x.arc(lx, ly, 4, 0, 7); x.fill();
}
