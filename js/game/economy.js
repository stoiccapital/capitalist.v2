// Pure money maths and formatting. No side effects.
import { S } from './state.js';
import { DEF } from '../content/assets.js';
import { BUILD } from '../content/buildables.js';
import { CARS } from '../content/cars.js';
import { ETF } from '../content/etfs.js';
import { NEAR, FAR } from '../constants.js';

// --- economy constants ---
export const BANK = 0.03;
export const LOAN_RATE = 0.06, LEND = 0.5, CALL = 0.7;
export const FLAT_RENT = 800;
export const BILLS = {1:0, 2:0, 3:300, 4:1500, 5:2500, 6:6000, 7:15000, 8:60000};
export const LIVE = {apt:2, townhouse:2, family:3, villa:4, penthouse:5, estate:6, mansion:7, trophy:8};
export const LIFE = {1:'Rented flat', 2:'Your own apartment', 3:'Family house', 4:'Luxury house', 5:'Penthouse', 6:'Estate', 7:'Mansion', 8:'Palace'};
export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// --- helpers ---
export const fmt = n => { const s = n < 0 ? '−' : '', a = Math.abs(n);
  return s + '$' + (a >= 1e9 ? (a/1e9).toFixed(1) + 'B' : a >= 1e6 ? (a/1e6).toFixed(a >= 1e8 ? 0 : 1) + 'M' : a >= 1e4 ? Math.round(a/1e3) + 'k' : Math.round(a).toLocaleString('en-US')); };
export const pct = x => (x*100).toFixed(x < 0.1 ? 1 : 0) + '%';
export const randn = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };
export const pk = a => a[Math.floor(Math.random()*a.length)];

// --- state readers ---
export const built = id => { const o = S.own[id]; return !!(o && o.dev && o.dev.done); };
export const residential = t => !BUILD[t].biz && !BUILD[t].amenity;

export function amenities() {
  const out = [];
  for (const id in S.own) {
    const o = S.own[id], d = DEF[id];
    if (!d) continue;   // save contains an id that no longer exists in the catalogue
    if (d.kind === 'land' && o.dev && o.dev.done && BUILD[o.dev.type].amenity)
      out.push({id, x:d.plot.x, z:d.plot.z, b:BUILD[o.dev.type].amenity, name:BUILD[o.dev.type].name});
  }
  return out;
}

// City-level infrastructure (metro station, university, mall, pre-built school/hospital…).
// Loaded by main.js at boot from the city config. These always contribute to `nearby()`,
// regardless of ownership.
let _cityAmenities = [];
export function setCityAmenities(list) { _cityAmenities = list || []; }
export function cityAmenities() { return _cityAmenities; }

export function nearby(id) {
  const d = DEF[id], x = d.plot ? d.plot.x : d.pos.x, z = d.plot ? d.plot.z : d.pos.z;
  let sum = 0; const who = [];
  // Player-built amenities + fixed city infrastructure both lift nearby rents.
  for (const a of amenities().concat(_cityAmenities)) {
    if (a.id && a.id === id) continue;
    const k = Math.min(1, Math.max(0, (FAR - Math.hypot(a.x - x, a.z - z))/(FAR - NEAR)));
    if (k > 0) { sum += a.b*k; who.push(a.name.toLowerCase()); }
  }
  return {boost:1 + Math.min(0.4, sum), who:[...new Set(who)]};
}

export const boostOf = id => {
  const d = DEF[id];
  if (d.kind === 'home') return nearby(id).boost;
  if (d.kind === 'land') { const o = S.own[id]; return o && o.dev && !residential(o.dev.type) ? 1 : nearby(id).boost; }
  return 1;
};

export const bCost = (t, p) => BUILD[t].cost(p)*S.cpi*S.mult;
export const bRent = (t, p) => BUILD[t].rent(p)*S.cpi;

export const avgEarn = id => { const d = DEF[id];
  if (d.kind === 'biz') return S.biz[id];
  if (d.kind === 'land') return built(id) ? bRent(S.own[id].dev.type, d.plot)*boostOf(id) : 0;
  return d.earn*S.cpi*boostOf(id); };

export const priceOf = id => (DEF[id].kind === 'biz' ? S.biz[id]*12*DEF[id].mult : DEF[id].price*S.cpi*nearby(id).boost)*S.mult;
export const ret = id => avgEarn(id)*12/priceOf(id);
export const saasValue = c => c.earn*12*6*S.mult;
export const owned = id => (S.own[id] ? S.own[id].n : 0);

export function valueOf(id) {
  const d = DEF[id], o = S.own[id]; if (!o) return 0;
  if (d.kind !== 'land') return priceOf(id)*o.n;
  let v = priceOf(id);
  if (o.dev) { const c = bCost(o.dev.type, d.plot); v += o.dev.done ? c*1.15*boostOf(id) : c*(1 - o.dev.left/o.dev.total)*0.9; }
  return v;
}

export const etfValue   = () => Object.values(S.etf).reduce((a, e) => a + e.sh*e.p, 0);
export const etfDiv     = () => Object.keys(ETF).reduce((a, k) => a + S.etf[k].sh*S.etf[k].p*ETF[k].div/12, 0);
export const stuffValue = () => Object.keys(S.own).reduce((a, id) => a + valueOf(id), 0) + S.saas.reduce((a, c) => a + saasValue(c), 0) + etfValue();

export const canLiveIn = id => { const o = S.own[id]; if (!o) return false;
  return DEF[id].kind === 'land' ? built(id) && BUILD[o.dev.type].live > 0 : !!LIVE[id]; };
export const homeLevel = id => !id || !S.own[id] ? 1 : DEF[id].kind === 'land' ? BUILD[S.own[id].dev.type].live : LIVE[id];
export const giveUp    = id => !id || !S.own[id] ? 0 : (DEF[id].kind === 'land' ? BUILD[S.own[id].dev.type].home*S.cpi : DEF[id].earn*S.cpi)*boostOf(id);

export const livingCost  = () => (S.home ? BILLS[homeLevel(S.home)] : FLAT_RENT)*S.cpi;
export const carsValue   = () => S.cars.reduce((a, c) => a + c.value, 0);
export const carsUpkeep  = () => S.cars.reduce((a, c) => a + CARS[c.type].upkeep, 0)*S.cpi;
export const netWorth    = () => S.cash + stuffValue() + carsValue() - S.loan;
export const interest    = () => S.loan*LOAN_RATE/12;
export const canBorrow   = () => Math.max(0, stuffValue()*LEND - S.loan);
export const machineGross = () => Object.keys(S.own).reduce((a, id) => a + avgEarn(id)*owned(id), 0) + S.saas.reduce((a, c) => a + c.earn, 0) + etfDiv() - giveUp(S.home);
export const machine     = () => machineGross() - interest();

export function grade(r) {
  if (r >= 0.15)  return {t:'Great deal',           s:'⭐⭐⭐', c:'great'};
  if (r >= 0.08)  return {t:'Good deal',            s:'⭐⭐',   c:'good'};
  if (r >= 0.045) return {t:'OK deal',              s:'⭐',     c:'ok'};
  if (r >= BANK)  return {t:'Weak deal',            s:'',       c:'weak'};
  return             {t:'Worse than the bank',   s:'',       c:'worse'};
}
export const bumpy   = id => DEF[id].kind === 'home' ? 'steady' : DEF[id].vol <= 0.15 ? 'a little bumpy' : DEF[id].vol <= 0.4 ? 'bumpy' : 'very bumpy';
export const payback = r => r > 0 ? Math.round(1/r) : 99;

// --- wealth history ---
export const START_WEALTH = 25000;
export function wealthSeries() {
  const pts = S.hist.slice(), first = S.m - pts.length;
  return {first, pts: first === 0 ? [START_WEALTH, ...pts] : pts, from: first === 0 ? 0 : first};
}
export function growthRate() {
  const {pts, from} = wealthSeries(), months = S.m - from;
  if (months < 12 || pts[0] <= 0 || pts[pts.length - 1] <= 0) return null;
  return Math.pow(pts[pts.length - 1]/pts[0], 12/months) - 1;
}
