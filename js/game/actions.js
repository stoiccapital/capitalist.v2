// Player actions and monthly step. These mutate S and then trigger ui.render + world.updatePins.
// Depends on ui/* and world/* via ES module live bindings — the cycle is safe because
// all cross-module calls happen inside functions, not at module init.
import { S, save, fresh, resetState } from './state.js';
import { DEF } from '../content/assets.js';
import { BUILD } from '../content/buildables.js';
import { CARS } from '../content/cars.js';
import { ETF } from '../content/etfs.js';
import { SAAS, SAAS_WHAT } from '../content/saas.js';
import {
  BANK, LOAN_RATE, FLAT_RENT,
  priceOf, valueOf, bCost, bRent, boostOf, built,
  owned, ret, saasValue, stuffValue, canBorrow, canLiveIn,
  livingCost, carsUpkeep, netWorth,
  randn, pk, fmt,
  LEND, CALL,
} from './economy.js';
import { checkGoals } from './goals.js';
import { snd, confetti, floatAt, lesson, recap, bump } from '../ui/fx.js';
import { updatePins } from '../world/pins.js';
import { updateCars } from '../world/cars.js';
import { showItem, itemH } from '../world/camera.js';
import { setPreview, setMode } from '../ui/sheet.js';
import { render } from '../ui/render.js';

// --- actions ---
export function buy(id) {
  const p = priceOf(id); if (owned(id) >= DEF[id].max) return;
  if (S.cash < p) return;
  S.cash -= p;
  const o = S.own[id] || (S.own[id] = {n:0, paid:0, earned:0});
  o.n++; o.paid += p;
  if (ret(id) >= 0.15) S.goals.boughtGreat = true;
  if (S.mood === 'sale') S.goals.boughtSale = true;
  snd('buy'); updatePins();
  if (!S.lessons.firstBuy) lesson('firstBuy');
  // Fire the gold-pin lesson the first time the player sees a pin (right after their first buy).
  if (!S.lessons.pins) setTimeout(() => lesson('pins'), 2200);
  checkGoals(); save(); render();
}

export function sell(id) {
  const o = S.own[id]; if (!o) return;
  if (o.dev && !o.dev.done) return;
  const p = (DEF[id].kind === 'land' ? valueOf(id) : priceOf(id))*0.95;
  S.cash += p; o.paid *= (o.n - 1)/o.n; o.earned *= (o.n - 1)/o.n; o.n--;
  if (!o.n) delete S.own[id];
  if (S.home === id && !S.own[id]) { S.home = null; updateCars(); recap('🏠 You sold your home', 'You moved back into a rented flat.'); }
  snd('coin'); updatePins(); lesson('sell'); save(); render();
}

export function buyDeal(i) {
  const d = S.deals.find(x => x.id === i); if (!d || S.cash < d.price) return;
  S.cash -= d.price; S.deals = S.deals.filter(x => x !== d);
  delete d.left; d.paid = d.price; d.earned = 0; S.saas.push(d);
  if (d.earn*12/d.price >= 0.15) S.goals.boughtGreat = true;
  if (S.mood === 'sale') S.goals.boughtSale = true;
  snd('buy');
  if (!S.lessons.firstBuy) lesson('firstBuy');
  checkGoals(); save(); render();
}

export function sellSaas(i) {
  const c = S.saas.find(x => x.id === i); if (!c) return;
  S.cash += saasValue(c)*0.95; S.saas = S.saas.filter(x => x !== c);
  snd('coin'); lesson('sell'); setMode({tab:'mine'}); save(); render();
}

export function buildOn(id, type) {
  const d = DEF[id], o = S.own[id], B = BUILD[type]; if (!o || o.dev) return;
  const c = bCost(type, d.plot); if (S.cash < c) return;
  S.cash -= c; o.paid += c; o.dev = {type, left:B.months, total:B.months, done:false};
  setPreview(null);
  snd('buy'); updatePins(); lesson('build'); save(); render();
}

export function buyCar(type) {
  const c = CARS[type], pr = c.price*S.cpi;
  if (S.cash < pr || S.cars.length >= 6) return;
  S.cash -= pr; S.cars.push({id:S.nextId++, type, value:pr});
  snd('buy'); updateCars(); lesson('car'); checkGoals(); save(); render();
}

export function sellCar(type) {
  const i = S.cars.findIndex(c => c.type === type); if (i < 0) return;
  S.cash += S.cars[i].value; S.cars.splice(i, 1);
  snd('coin'); updateCars(); save(); render();
}

export function moveIn(id) {
  if (!canLiveIn(id)) return;
  S.home = id; setTimeout(updateCars, 0);
  snd('star'); confetti(40); lesson('home'); checkGoals(); save(); render();
}

export function moveOut() {
  S.home = null; setTimeout(updateCars, 0);
  recap('🏠 You moved into a rented flat', `Rent: ${fmt(FLAT_RENT*S.cpi)} a month.`);
  save(); render();
}

export function etfBuy(k, amt) {
  amt = Math.min(amt, S.cash); if (amt < 1) return;
  const e = S.etf[k]; e.sh += amt/e.p; e.paid += amt; S.cash -= amt;
  snd('buy'); lesson('etf'); checkGoals(); save(); render();
}

export function etfSell(k, frac) {
  const e = S.etf[k]; if (!e.sh) return;
  const sh = e.sh*frac, got = sh*e.p;
  e.paid *= 1 - frac; e.sh -= sh; S.cash += got;
  snd('coin'); save(); render();
}

export function borrow(amt) {
  amt = Math.min(amt, canBorrow()); if (amt < 1) return 0;
  S.loan += amt; S.cash += amt; S.borrowed = true;
  snd('coin'); lesson('loan'); save(); render(); return amt;
}

export function repay(amt) {
  amt = Math.min(amt, S.loan, Math.max(0, S.cash)); if (amt < 1) return;
  S.loan -= amt; S.cash -= amt;
  if (S.loan < 1) { S.loan = 0; if (S.borrowed) { S.goals.loanRepaid = true; recap('🏦 Loan paid back!', 'No more interest to pay.'); } }
  snd('coin'); checkGoals(); save(); render();
}

// Bank force-sell logic: when the loan grows too big relative to collateral, or cash goes negative.
export function bankCheck() {
  const sold = [];
  const sellCheapest = () => {
    const unitV = id => DEF[id].kind === 'land' ? valueOf(id) : priceOf(id);
    const ids = Object.keys(S.own).filter(id => !(S.own[id].dev && !S.own[id].dev.done)).sort((a, b) => unitV(a) - unitV(b));
    if (ids.length) {
      const id = ids[0], o = S.own[id];
      S.cash += unitV(id)*0.95; o.n--; if (!o.n) delete S.own[id];
      sold.push(DEF[id].name);
      if (S.home === id && !S.own[id]) S.home = null;
      return true;
    }
    if (S.saas.length) {
      const c = S.saas.sort((a, b) => saasValue(a) - saasValue(b))[0];
      S.cash += saasValue(c)*0.95; S.saas = S.saas.filter(x => x !== c);
      sold.push(c.name);
      return true;
    }
    return false;
  };
  if (S.loan > stuffValue()*CALL) {
    const want = S.loan - stuffValue()*LEND, pay = Math.min(want, Math.max(0, S.cash));
    S.loan -= pay; S.cash -= pay;
    while (S.loan > stuffValue()*CALL && sellCheapest()) { const p2 = Math.min(S.loan, S.cash); S.loan -= p2; S.cash -= p2; }
    recap('🏦 The bank asked for money back', sold.length ? `It sold your ${sold.join(', ')}.` : 'It took some of your cash.');
    snd('bad'); lesson('margin');
  }
  while (S.cash < 0) {
    const extra = Math.min(-S.cash, canBorrow());
    if (extra >= 1) { S.loan += extra; S.cash += extra; }
    else if (!sellCheapest()) break;
  }
  if (S.loan < 1) S.loan = 0;
  updatePins();
}

export function newDeal() {
  const nm = pk(SAAS), r = 0.1 + Math.random()*0.22;
  const price = Math.round(pk([4e5, 8e5, 1.5e6, 3e6, 6e6, 12e6])*(0.8 + Math.random()*0.5)*S.cpi*S.mult/1000)*1000;
  return {id:S.nextId++, name:nm + pk(['Desk','Hub','Flow','Base','Pilot','Works']), what:SAAS_WHAT[nm], price, earn:price*r/12, grow:0.004 + Math.random()*0.008, left:6};
}

// --- one month passes ---
export function step() {
  S.m++; S.cpi *= 1.0025;
  if (S.m % 12 === 0) { S.job = Math.round(S.job*1.05/50)*50; recap(`🎉 Pay rise! Your job now pays ${fmt(S.job)} a month`); }

  // market mood
  const r = Math.random(), prevMood = S.mood;
  if (S.mood === 'normal') S.mood = r < 0.05 ? 'sale' : r < 0.1 ? 'hot' : 'normal';
  else if (r < 0.14) S.mood = 'normal';
  S.mult += ({sale:0.78, normal:1, hot:1.2}[S.mood] - S.mult)*0.3;
  if (S.mood !== prevMood && S.mood !== 'normal') lesson(S.mood);

  // earnings
  let fromStuff = 0, badMonth = false;
  const pops = [];

  for (const id in DEF) if (DEF[id].kind === 'biz') {
    const d = DEF[id], season = d.seasonal ? 1 + 0.6*Math.sin((S.m % 12 - 3)/12*Math.PI*2) : 1;
    const month = Math.max(-0.4*d.earn*S.cpi, d.earn*S.cpi*season*(1 + randn()*d.vol));
    S.biz[id] = S.biz[id]*0.9 + month*0.1;
    if (S.own[id]) { const got = month*S.own[id].n; fromStuff += got; S.own[id].earned += got; pops.push([id, got]); if (got < 0) badMonth = true; }
  }

  for (const id in S.own) if (DEF[id].kind === 'home') {
    const o = S.own[id], empty = o.n === 1 && Math.random() < 0.04;
    let got = empty ? 0 : DEF[id].earn*S.cpi*o.n*boostOf(id);
    if (S.home === id) {
      const give = (DEF[id].earn*S.cpi)*boostOf(id);
      got = Math.max(0, got - give);
    }
    fromStuff += got; o.earned += got; if (got) pops.push([id, got]);
  }

  for (const id in S.own) if (DEF[id].kind === 'land') {
    const o = S.own[id], dv = o.dev; if (!dv) continue;
    if (!dv.done) {
      if (--dv.left <= 0) {
        dv.done = true; updatePins(); snd('star'); confetti(90);
        recap(`🎉 Your ${BUILD[dv.type].name.toLowerCase()} is ${BUILD[dv.type].biz || BUILD[dv.type].amenity ? 'open' : 'finished'}!`,
              BUILD[dv.type].amenity ? 'Homes nearby now earn more rent!' : 'It starts earning rent next month.');
        if (BUILD[dv.type].biz) lesson('park');
        if (BUILD[dv.type].amenity) setTimeout(() => lesson('amenity'), 50);
      }
      continue;
    }
    const base = bRent(dv.type, DEF[id].plot)*boostOf(id);
    let got = BUILD[dv.type].biz
      ? Math.max(-0.2*base, base*(1 + 0.55*Math.sin((S.m % 12 - 3)/12*Math.PI*2))*(1 + randn()*0.3))
      : base*(BUILD[dv.type].home === 7500 ? (Math.random() < 0.04 ? 0 : 1) : Math.min(1, 0.95 + randn()*0.02));
    if (got < 0) badMonth = true;
    if (S.home === id) { const give = (BUILD[dv.type].home*S.cpi)*boostOf(id); got = Math.max(0, got - give); }
    fromStuff += got; o.earned += got; if (got) pops.push([id, got]);
  }

  // ETFs
  const z = randn(), crash = Math.random() < 0.012;
  for (const k in ETF) { const E = ETF[k], e = S.etf[k];
    e.p *= Math.max(0.5, 1 + E.mu/12 + E.sig/Math.sqrt(12)*(k === 'bonds' ? randn() : 0.85*z + 0.5*randn()) + (crash ? (k === 'bonds' ? 0.01 : k === 'tech' ? -0.22 : -0.15) : 0));
    const dv = e.sh*e.p*E.div/12; fromStuff += dv; e.earned += dv;
  }
  if (crash && Object.values(S.etf).some(e => e.sh > 0)) { snd('bad'); recap('📉 The stock market crashed this month', 'ETF prices fell a lot.'); lesson('crash'); }

  for (const c of S.saas) { c.earn *= 1 + c.grow + randn()*0.01; fromStuff += c.earn; c.earned += c.earn; }

  const bankInt = Math.max(0, S.cash)*BANK/12, loanCost = S.loan*LOAN_RATE/12, living = livingCost(), carCost = carsUpkeep();
  for (const c of S.cars) c.value *= 1 - CARS[c.type].dep/12;
  S.cash += S.job + fromStuff + bankInt - loanCost - living - carCost;
  bankCheck();

  // deals come and go
  S.deals = S.deals.filter(d => --d.left > 0);
  if (S.m >= 6 && S.deals.length < 3 && Math.random() < 0.25) { S.deals.push(newDeal()); lesson('deal'); }

  S.last = {job:S.job, stuff:fromStuff, interest:bankInt};
  S.hist.push(Math.round(netWorth())); if (S.hist.length > 600) S.hist.shift();

  // floating coins over earning buildings
  let shown = 0;
  for (const [id, got] of pops) {
    if (!DEF[id].pos || got === 0 || shown >= 6) continue;
    const p = DEF[id].pos, lift = Math.min(itemH(id), 120);
    const pt = new THREE.Vector3(p.x, p.y + lift, p.z);
    if (floatAt(pt, (got > 0 ? '+' : '') + fmt(got), got < 0)) shown++;
  }

  if (fromStuff > 0) snd('coin');
  if (badMonth) { snd('bad'); lesson('badMonth'); }

  const net = S.job + fromStuff + bankInt - loanCost - living - carCost;
  recap(`You ${net >= 0 ? 'saved' : 'spent'} ${fmt(Math.abs(net))} this month`,
        `Job ${fmt(S.job)}${fromStuff ? `, your stuff ${fmt(fromStuff)}` : ''}${bankInt >= 1 ? `, bank ${fmt(bankInt)}` : ''}${loanCost >= 1 ? `, loan −${fmt(loanCost)}` : ''}${living >= 1 ? `, ${S.home ? 'home bills' : 'rent'} −${fmt(living)}` : ''}${carCost >= 1 ? `, cars −${fmt(carCost)}` : ''}`);

  if (Object.keys(S.own).some(id => DEF[id].kind === 'land' && S.own[id].dev && !S.own[id].dev.done)) updatePins();
  bump('kCash'); if (fromStuff) bump('kMachine');
  checkGoals(); save(); render();
}

// Full-reset action (used by goals screen "Start over").
export function doReset(stopAuto, homeView) {
  stopAuto();
  resetState();
  updatePins();
  setMode(null);
  homeView();
  render();
  lesson('start');
}
