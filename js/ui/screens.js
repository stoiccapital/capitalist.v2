// HTML templates for each sheet mode. Pure functions of state; return strings.
// Buttons carry data-k="action[:arg[:arg]]" which input.js dispatches to actions.
import { S } from '../game/state.js';
import { DEF } from '../content/assets.js';
import { BUILD } from '../content/buildables.js';
import { CARS } from '../content/cars.js';
import { ETF } from '../content/etfs.js';
import { GOALS, currentGoal } from '../game/goals.js';
import {
  fmt, pct, grade, bumpy, payback,
  priceOf, valueOf, bCost, bRent, ret, avgEarn, owned,
  nearby, boostOf, built, residential,
  canBorrow, canLiveIn, homeLevel, giveUp, livingCost,
  stuffValue, machine, interest, saasValue,
  BANK, LOAN_RATE, FLAT_RENT, BILLS, LIFE,
} from '../game/economy.js';
import { FAR } from '../constants.js';
import { confirmReset, mode, currentDistrict } from './sheet.js';
import { isWatching } from '../world/camera.js';

export const pill = r => { const g = grade(r); return `<span class="pill ${g.c}">${g.s ? g.s + ' ' : ''}${g.t}</span>`; };

// Shared row shell. Body opens the detail; the right side carries a Buy button (primary),
// an optional Borrow button when the player can't afford outright but has loan capacity,
// and a "Save more" fallback when even borrowing wouldn't cover it.
function row({tapKey, body, buyKey, borrowKey, canBuy, canBorrow: canBorrowFlag, priceLabel, borrowLabel, needLabel}) {
  let right;
  if (!buyKey) {
    right = `<button class="row-buy ghost" data-k="${tapKey}">${priceLabel} ›</button>`;
  } else if (canBuy) {
    right = `<button class="row-buy" data-k="${buyKey}">${priceLabel}</button>`;
  } else if (canBorrowFlag) {
    right = `<button class="row-buy" disabled>${priceLabel}</button>`
          + `<button class="row-buy loan" data-k="${borrowKey}">${borrowLabel}</button>`;
  } else {
    right = `<button class="row-buy" disabled>${needLabel || priceLabel}</button>`;
  }
  return `<div class="item-row"><button class="row-tap" data-k="${tapKey}">${body}</button><div class="row-right">${right}</div></div>`;
}

// Compact stat strip used in rows: three key numbers in order {price, monthly, yearly}.
const stat3 = (price, monthly, yearly) =>
  `<div class="rowstats"><span>💰 ${fmt(price)}</span><span>📈 ${fmt(monthly)}/mo</span><span>📊 ${pct(yearly)}/yr</span></div>`;

export function rowLand(id) {
  const d = DEF[id], o = S.own[id], dv = o && o.dev;
  const sub = !o ? `${d.plot.m2.toLocaleString('en-US')} m² of land`
    : !dv ? 'Yours. Choose what to build!'
    : !dv.done ? `🚧 Building: ${dv.left} ${dv.left === 1 ? 'month' : 'months'} to go`
    : `${BUILD[dv.type].name}, earns ${fmt(avgEarn(id))} a month`;
  const price = o ? valueOf(id) : priceOf(id);
  const earns = o ? avgEarn(id) : 0, yearly = earns > 0 ? earns*12/price : 0;
  const body = `<span class="ic">${dv ? BUILD[dv.type].icon : '🌱'}</span><span class="mid"><span class="nm">${d.name}${S.home === id ? ' <small style="display:inline">(your home)</small>' : ''}</span>${stat3(price, earns, yearly)}<small>${sub}</small>${o ? '' : '<span class="pill good">🏗️ Build on it</span>'}</span>`;
  if (o) return row({tapKey:`item:${id}`, body, priceLabel:fmt(price)});
  const canBuy = S.cash >= price, canB = !canBuy && S.cash + canBorrow() >= price;
  return row({
    tapKey:`item:${id}`, body,
    buyKey:`buy:${id}`, borrowKey:`lbuy:${id}`,
    canBuy, canBorrow: canB,
    priceLabel: `💰 Buy`,
    borrowLabel: `🏦 Borrow ${fmt(price - S.cash)}`,
    needLabel: `Save ${fmt(price - S.cash)} more`,
  });
}

export function rowCar(t) {
  const c = CARS[t], n = S.cars.filter(x => x.type === t).length, pr = c.price*S.cpi;
  // Cars show price + monthly cost, no yearly return (they lose money).
  const monthly = -c.upkeep*S.cpi;
  const body = `<span class="ic">${c.icon}</span><span class="mid"><span class="nm">${c.name}${n ? ` <small style="display:inline">(you own ${n})</small>` : ''}</span><div class="rowstats"><span>💰 ${fmt(pr)}</span><span class="bad">📉 ${fmt(monthly)}/mo</span><span class="bad">🔻 loses value</span></div></span>`;
  const canBuy = S.cash >= pr && S.cars.length < 6;
  const canB = !canBuy && S.cars.length < 6 && S.cash + canBorrow() >= pr;
  return row({
    tapKey:`car:${t}`, body,
    buyKey:`cbuy:${t}`, borrowKey:`cbuy:${t}`,   // cars don't have a dedicated lbuy; buyers rarely borrow for these
    canBuy, canBorrow: false,
    priceLabel: `💰 Buy`,
    needLabel: S.cars.length >= 6 ? 'Garage full' : `Save ${fmt(pr - S.cash)} more`,
  });
}

export function carHTML(t) {
  const c = CARS[t], pr = c.price*S.cpi, mine = S.cars.filter(x => x.type === t), after5 = pr*Math.pow(1 - c.dep/12, 60);
  let h = `<p class="tip">${c.what}</p><div class="facts"><div><small>Price</small><b>${fmt(pr)}</b></div><div><small>Costs a month</small><b>${fmt(c.upkeep*S.cpi)}</b></div><div><small>Worth in 5 years</small><b>${fmt(after5)}</b></div></div>`;
  h += `<div class="say">🚗 A car earns nothing. In 5 years it loses about <b>${fmt(pr - after5)}</b> of value and costs about <b>${fmt(c.upkeep*S.cpi*60)}</b> to keep. ${machine() >= c.upkeep*S.cpi ? '✅ Your stuff already earns enough to pay for its monthly costs.' : '⚠️ Your stuff doesn\u2019t earn enough yet to pay its monthly costs: your job would have to pay for it.'}</div>`;
  h += `<div class="say">It will park at ${S.home ? 'your home' : 'your rented flat'}.</div><div class="acts">`;
  h += S.cars.length >= 6 ? '<button disabled>Your garage is full (6 cars)</button>'
      : S.cash >= pr ? `<button data-k="cbuy:${t}">Buy for ${fmt(pr)}</button>`
      : `<button disabled>Save ${fmt(pr - S.cash)} more</button>`;
  if (mine.length) h += `<button class="ghost" data-k="csell:${t}">Sell one for ${fmt(mine[0].value)}</button>`;
  return h + '</div>';
}

export function rowEtf(k) {
  const E = ETF[k], e = S.etf[k];
  // ETFs always open the detail (user picks an amount) — no direct buy button on the row.
  const body = `<span class="ic">${E.icon}</span><span class="mid"><span class="nm">${E.name}</span><small>${e.sh ? `You own ${fmt(e.sh*e.p)}` : 'Buy any amount, from $100'}</small><span class="pill ${k === 'bonds' ? 'ok' : 'good'}">📈 ${k === 'bonds' ? 'Steady' : 'Bumpy'}, about ${pct(E.mu + E.div)} a year</span></span>`;
  return row({tapKey:`etf:${k}`, body, priceLabel:`${fmt(e.p)}/share`});
}

export function rowItem(id) {
  if (DEF[id].kind === 'land') return rowLand(id);
  const d = DEF[id], r = ret(id), p = priceOf(id), e = avgEarn(id), n = owned(id);
  const canBuy = S.cash >= p && n < d.max;
  const canB = !canBuy && n < d.max && S.cash + canBorrow() >= p;
  const body = `<span class="ic">${d.icon}</span><span class="mid"><span class="nm">${d.name}${n ? ` <small style="display:inline">(you own ${n})</small>` : ''}</span>${stat3(p, e, r)}${pill(r)}</span>`;
  return row({
    tapKey:`item:${id}`, body,
    buyKey:`buy:${id}`, borrowKey:`lbuy:${id}`,
    canBuy, canBorrow: canB,
    priceLabel: `💰 Buy`,
    borrowLabel: `🏦 Borrow ${fmt(p - S.cash)}`,
    needLabel: n >= d.max ? 'Owned all' : `Save ${fmt(p - S.cash)} more`,
  });
}

// SaaS company you already own (shown in My stuff). Shows current worth, monthly earnings
// and yearly return; right side has a one-tap Sell button.
export function rowOwnedSaas(c) {
  const worth = saasValue(c);
  const yearly = c.earn*12/Math.max(1, worth);
  const grown = c.paid > 0 ? (c.earned/c.paid*100).toFixed(0) : 0;
  const body = `<span class="ic">💻</span><span class="mid"><span class="nm">${c.name}</span>${stat3(worth, c.earn, yearly)}<small>Growing · earned ${fmt(c.earned)} so far (${grown}% of what you paid)</small></span>`;
  return row({tapKey:`saas:${c.id}`, body, buyKey:`ssell:${c.id}`, canBuy:true, priceLabel:`💰 Sell · ${fmt(worth*0.95)}`});
}

export function rowDeal(d) {
  const r = d.earn*12/d.price;
  const canBuy = S.cash >= d.price;
  const canB = !canBuy && S.cash + canBorrow() >= d.price;
  const body = `<span class="ic">💻</span><span class="mid"><span class="nm">${d.name}</span>${stat3(d.price, d.earn, r)}<small>Software for ${d.what} · gone in ${d.left} ${d.left === 1 ? 'month' : 'months'}</small>${pill(r)}</span>`;
  return row({
    tapKey:`deal:${d.id}`, body,
    buyKey:`dbuy:${d.id}`, borrowKey:`lbuyd:${d.id}`,
    canBuy, canBorrow: canB,
    priceLabel: `💰 Buy`,
    borrowLabel: `🏦 Borrow ${fmt(d.price - S.cash)}`,
    needLabel: `Save ${fmt(d.price - S.cash)} more`,
  });
}

// Shop categories. Each has an id (used in mode.sub), label, icon, blurb and a renderer.
// Procedural buildings and ambient plots are click-to-buy from 3D — intentionally not here.
function shopCategories() {
  const bizIds   = Object.keys(DEF).filter(id => DEF[id].kind === 'biz'  && !DEF[id].procedural).sort((a, b) => priceOf(a) - priceOf(b));
  // Homes shown in a district = all hero homes located in the district + every procedural
  // building there. Hero homes without a district tag show in all districts (fallback).
  const inDistrict = id => DEF[id].district === currentDistrict;
  const homeIds  = Object.keys(DEF).filter(id => DEF[id].kind === 'home' && (!DEF[id].district || inDistrict(id))).sort((a, b) => priceOf(a) - priceOf(b));
  const plotIds  = Object.keys(DEF).filter(id => DEF[id].kind === 'land' && inDistrict(id)).sort((a, b) => priceOf(a) - priceOf(b));
  const freeLand = plotIds.filter(id => !S.own[id]);
  const vacantOwned = Object.keys(S.own).filter(id => DEF[id].kind === 'land' && !S.own[id].dev && inDistrict(id));
  return [
    {id:'biz',   icon:'🧃', label:'Businesses',    blurb:'Shops, cafés, laundromats, and software companies on sale.',
      count: bizIds.length + S.deals.length,
      cheapest: Math.min(...[...bizIds.map(id => priceOf(id)), ...S.deals.map(d => d.price), Infinity]),
      render:() => (S.deals.length ? `<div class="saleRibbon">🔥 SALE · ${S.deals.length} software ${S.deals.length === 1 ? 'company' : 'companies'} for a short time only</div>` + S.deals.map(rowDeal).join('') : '')
                 + (bizIds.length ? `<h3>🧃 Small businesses</h3>` + bizIds.map(rowItem).join('') : '')},
    {id:'home',  icon:'🏠', label:'Homes',          blurb:'Apartments, houses, towers — rent them out for steady income.',         count:homeIds.length, cheapest: homeIds.length ? priceOf(homeIds[0]) : null, render:() => homeIds.map(rowItem).join('')},
    {id:'land',  icon:'🌱', label:'Land',           blurb:`Buy an empty plot in ${currentDistrict}, then choose what to build on it.`, count:freeLand.length, cheapest: freeLand.length ? priceOf(freeLand[0]) : null, render:() => renderLandList(freeLand)},
    {id:'build', icon:'🏗️', label:'Build',          blurb:`Put a school, hospital, villa or tower on your empty land in ${currentDistrict}.`, count:vacantOwned.length, cheapest: vacantOwned.length ? Math.min(...Object.keys(BUILD).map(t => bCost(t, DEF[vacantOwned[0]].plot))) : null, render:() => renderBuildList(vacantOwned)},
    {id:'stock', icon:'📈', label:'Stocks',         blurb:'Pieces of hundreds of companies at once. Bumpy but grows over years.',  count:Object.keys(ETF).length, cheapest: 100, render:() => Object.keys(ETF).map(rowEtf).join('')},
    {id:'car',   icon:'🚗', label:'Cars',           blurb:'Fun to own, but they cost money every month and lose value.',           count:Object.keys(CARS).length, cheapest: Math.min(...Object.values(CARS).map(c => c.price*S.cpi)), render:() => Object.keys(CARS).map(rowCar).join('')},
  ];
}

// Default land list: everything you can afford, plus the next 10 cheapest. "Show all" expands.
function renderLandList(freeLand) {
  if (!freeLand.length) return '<p class="tip">You own every plot on the island! 🎉</p>';
  const affordable = freeLand.filter(id => S.cash >= priceOf(id));
  const unaffordable = freeLand.filter(id => S.cash < priceOf(id));
  const showAll = mode && mode.landAll;
  if (showAll) {
    return `<p class="tip">${freeLand.length} plots, cheapest first.</p>`
         + freeLand.map(id => rowLand(id)).join('')
         + `<div class="acts" style="margin-top:10px"><button class="ghost" data-k="land-less">← Show fewer</button></div>`;
  }
  const preview = [...affordable, ...unaffordable.slice(0, Math.max(5, 10 - affordable.length))];
  const remaining = freeLand.length - preview.length;
  return `<p class="tip">${affordable.length ? `${affordable.length} you can afford · ` : ''}showing ${preview.length} of ${freeLand.length}. Tap any empty block in the city too.</p>`
       + preview.map(id => rowLand(id)).join('')
       + (remaining > 0 ? `<div class="acts" style="margin-top:10px"><button class="ghost" data-k="land-all">Show all ${freeLand.length} plots</button></div>` : '');
}

// Build list: each row is a build type; tapping it builds on the player's first vacant plot.
// If they don't own any empty land yet, the row explains how to get some.
function renderBuildList(vacantOwned) {
  if (!vacantOwned.length) {
    return `<p class="tip">You don't own any empty land yet. Open 🌱 Land, buy a plot, then come back.</p>`
         + `<div class="acts"><button data-k="sub:land">Go to 🌱 Land</button></div>`;
  }
  // Pick the first (cheapest) vacant plot and build on it. Costs/rents depend on plot size.
  const target = vacantOwned.sort((a, b) => DEF[a].plot.m2 - DEF[b].plot.m2)[0];
  const p = DEF[target].plot;
  const targetName = DEF[target].name;
  let h = `<p class="tip">You own <b>${vacantOwned.length}</b> empty ${vacantOwned.length === 1 ? 'plot' : 'plots'}. Each 🏗️ Build button puts the building on <b>${targetName}</b> at (${p.x}, ${p.z}), ${p.m2.toLocaleString('en-US')} m².</p>`;
  for (const type in BUILD) {
    const B = BUILD[type];
    const cost = bCost(type, p), rent = bRent(type, p), r = rent*12/cost;
    const canBuild = S.cash >= cost;
    const canB = !canBuild && S.cash + canBorrow() >= cost;
    const body = `<span class="ic">${B.icon}</span><span class="mid"><span class="nm">${B.name}</span>${stat3(cost, rent, r)}<small>Takes ${B.months} months to build${B.amenity ? ` · ⬆️ lifts rents nearby` : B.biz ? ' · 🎢 bumpy earnings' : ''}</small></span>`;
    h += row({
      tapKey: `item:${target}`,
      body,
      buyKey: `build:${target}:${type}`,
      borrowKey: `lbuild:${target}:${type}`,
      canBuy: canBuild,
      canBorrow: canB,
      priceLabel: `🏗️ Build`,
      borrowLabel: `🏦 Borrow ${fmt(cost - S.cash)}`,
      needLabel: `Save ${fmt(cost - S.cash)} more`,
    });
  }
  return h;
}

export const shopCategoryLabel = sub => (shopCategories().find(c => c.id === sub) || {}).label || '';

export function shopHTML() {
  const sub = mode && mode.sub;
  const cats = shopCategories();
  if (sub) {
    const cat = cats.find(c => c.id === sub);
    if (!cat) { return `<p class="tip">Unknown category.</p>` + `<div class="acts"><button data-k="shop-back">← Back</button></div>`; }
    return `<div class="acts" style="margin:0 0 10px"><button class="ghost" data-k="shop-back">← Back</button></div>`
         + `<p class="tip">${cat.blurb}</p>`
         + cat.render();
  }
  return `<p class="tip">What do you want to buy?</p>`
       + `<div class="cats">`
       + cats.map(c => {
           const unaffordable = c.cheapest !== undefined && c.cheapest !== null && c.cheapest > S.cash;
           const line = c.count === 0 ? 'none right now'
                     : c.cheapest !== undefined && c.cheapest !== null ? `${c.count} items · from ${fmt(c.cheapest)}`
                     : `${c.count} items`;
           return `<button class="cat${unaffordable ? ' dim' : ''}" data-k="sub:${c.id}"><span class="catic">${c.icon}</span><span class="catnm">${c.label}</span><small>${line}</small></button>`;
         }).join('')
       + `</div>`;
}

export function hoodLine(id) {
  const d = DEF[id];
  if (d.kind !== 'home' && !(d.kind === 'land' && (!S.own[id] || !S.own[id].dev || residential(S.own[id].dev.type)))) return '';
  const nb = nearby(id);
  if (nb.boost <= 1) return `<div class="say">🏘️ Neighbourhood: nothing special nearby. A school, hospital or theme park within ${FAR} m would push rents up.</div>`;
  return `<div class="say">⬆️ Neighbourhood bonus: <b>+${Math.round((nb.boost - 1)*100)}% rent</b>, thanks to the ${nb.who.join(' and ')} nearby.</div>`;
}

export function homeCard(id) {
  if (!canLiveIn(id)) return '';
  if (S.home === id) return `<div class="say">🏠 <b>You live here.</b> Home bills: ${fmt(BILLS[homeLevel(id)]*S.cpi)} a month.</div><div class="acts"><button class="ghost" data-k="moveout">Move out to a rented flat</button></div>`;
  const lv = homeLevel(id);
  return `<div class="say">🏠 <b>Live here?</b> You\u2019d stop paying ${S.home ? 'bills for your old home' : `${fmt(FLAT_RENT*S.cpi)} rent for your flat`}, but this would stop earning <b>${fmt(giveUp(id))} a month</b> for you${BILLS[lv] ? `, and its bills are ${fmt(BILLS[lv]*S.cpi)} a month` : ''}.</div><div class="acts"><button data-k="live:${id}">Move in</button></div>`;
}

export function landHTML(id) {
  const d = DEF[id], o = S.own[id], dv = o && o.dev, p = d.plot;
  let h = `<p class="tip">${d.blurb}</p>`;
  const options = (own) => Object.keys(BUILD).map(t => {
    const B = BUILD[t], c = bCost(t, p), rent = bRent(t, p), r = rent*12/c;
    let b = `<div class="say"><b>${B.icon} ${B.name}</b><br>${B.what(p)}<br>Costs <b>${fmt(c)}</b>, takes <b>${B.months} months</b>, then earns <b>${fmt(rent)} a month${B.biz ? ' on average' : ''}</b> (${pct(r)} a year on what you spend).${B.biz ? '<br>⚠️ Bumpy: busy in summer, quiet in winter. You can\u2019t live in it.' : ''}${B.amenity ? `<br>⬆️ <b>Homes within about ${FAR} m earn up to +${Math.round(B.amenity*100)}% more rent</b> and are worth more, including yours.` : ''}</div><div class="acts">`;
    b += `<button class="ghost" data-k="prev:${id}:${t}">👀 Preview</button>`;
    if (own) b += S.cash >= c ? `<button data-k="build:${id}:${t}">Build it</button>`
                  : S.cash + canBorrow() >= c ? `<button data-k="lbuild:${id}:${t}">Borrow ${fmt(c - S.cash)} and build</button>`
                  : `<button disabled>Save ${fmt(c - S.cash)} more</button>`;
    return b + '</div>';
  }).join('');
  if (!o) {
    const pr = priceOf(id);
    h += `<div class="facts"><div><small>Price</small><b>${fmt(pr)}</b></div><div><small>Size</small><b>${p.m2.toLocaleString('en-US')} m²</b></div><div><small>Earns</small><b>$0</b></div></div>`;
    h += '<div class="acts">' + (S.cash >= pr ? `<button data-k="buy:${id}">Buy the land for ${fmt(pr)}</button>`
                                : S.cash + canBorrow() >= pr ? `<button data-k="lbuy:${id}">Borrow ${fmt(pr - S.cash)} and buy</button>`
                                : `<button disabled>Save ${fmt(pr - S.cash)} more</button>`) + '</div>';
    h += hoodLine(id) + '<h3>What you could build here</h3>' + options(false);
  } else if (!dv) {
    h += hoodLine(id) + '<h3>What do you want to build?</h3>' + options(true) + `<div class="acts"><button class="ghost" data-k="sell:${id}">Sell the land for ${fmt(priceOf(id)*0.95)}</button></div>`;
  } else if (!dv.done) {
    const done = 1 - dv.left/dv.total;
    h += `<div class="say">🚧 Building your <b>${BUILD[dv.type].name.toLowerCase()}</b>. Ready in <b>${dv.left} ${dv.left === 1 ? 'month' : 'months'}</b>.<div style="height:10px;border-radius:6px;background:var(--line);margin-top:8px;overflow:hidden"><div style="height:100%;width:${Math.round(done*100)}%;background:var(--coin)"></div></div><br>While it\u2019s being built, it earns nothing. Patience!</div>`;
  } else {
    const v = valueOf(id), e = avgEarn(id);
    h += `<div class="facts"><div><small>Worth</small><b>${fmt(v)}</b></div><div><small>Earns a month</small><b>${fmt(e)}</b></div><div><small>Each year</small><b>${pct(e*12/v)}</b></div></div>`;
    h += `<div class="say">${BUILD[dv.type].biz ? '🎢 Your theme park is open. Summer months earn the most. ' : ''}You spent <b>${fmt(o.paid)}</b> on the land and building. It has earned you <b>${fmt(o.earned)}</b> so far.</div>`;
    h += hoodLine(id) + (BUILD[dv.type].amenity ? `<div class="say">⬆️ It lifts rents by up to <b>+${Math.round(BUILD[dv.type].amenity*100)}%</b> for homes within ${FAR} m. The green circle shows the area.</div>` : '') + homeCard(id) + `<div class="acts"><button class="ghost" data-k="sell:${id}">Sell it for ${fmt(v*0.95)}</button></div>`;
  }
  return h;
}

export function etfHTML(k) {
  const E = ETF[k], e = S.etf[k], val = e.sh*e.p, gain = val - e.paid;
  let h = `<p class="tip">One share gives you ${E.what}.</p>`;
  h += `<div class="facts"><div><small>Price per share</small><b>${fmt(e.p)}</b></div><div><small>You own</small><b>${fmt(val)}</b></div><div><small>On average</small><b>${pct(E.mu + E.div)}/yr</b></div></div>`;
  h += `<div class="say">${k === 'bonds' ? '🙂 Steady: the price moves only a little.' : k === 'tech' ? '⚠️ Very bumpy: it can fall a lot in a bad year, and grow a lot in a good one.' : '⚠️ Bumpy: the price goes up and down every month, but over many years it has usually grown.'} It also pays you about <b>${pct(E.div)}</b> a year in dividends, every month.</div>`;
  if (e.sh) h += `<div class="say">You put in <b>${fmt(e.paid)}</b>. It\u2019s worth <b class="${gain >= 0 ? 'good' : 'bad'}">${fmt(val)}</b> now (${gain >= 0 ? '+' : ''}${fmt(gain)}), and paid you ${fmt(e.earned)} in dividends so far.</div>`;
  h += '<div class="acts">' + [100, 1000, 10000, 100000].filter(a => a <= S.cash).map(a => `<button data-k="etfb:${k}:${a}">Buy ${fmt(a)}</button>`).join('')
     + (S.cash >= 1 ? `<button data-k="etfb:${k}:all">Buy with all my cash (${fmt(S.cash)})</button>` : '<button disabled>No cash to invest</button>') + '</div>';
  if (e.sh) h += `<div class="acts"><button class="ghost" data-k="etfs:${k}:0.5">Sell half (${fmt(val/2)})</button><button class="ghost" data-k="etfs:${k}:1">Sell all (${fmt(val)})</button></div>`;
  return h;
}

// One-line summary + big Buy up top. Full paragraphs live inside <details>, hidden by default.
export function itemHTML(id) {
  if (DEF[id].kind === 'land') return landHTML(id);
  const d = DEF[id], r = ret(id), p = priceOf(id), e = avgEarn(id), n = owned(id), o = S.own[id];
  const can = S.cash >= p && n < d.max;
  // Headline (what matters for the decision)
  let h = `<div class="headline"><div class="hprice">${fmt(p)}</div><div class="hsummary">Earns ~${fmt(e)}/mo · ${pct(r)}/yr</div>${pill(r)}</div>`;
  // Buy / borrow / sell actions
  h += '<div class="acts">';
  if (n >= d.max) h += `<button disabled>You own all ${d.max}</button>`;
  else if (can)   h += `<button data-k="buy:${id}">💰 Buy for ${fmt(p)}</button>`;
  else if (S.cash + canBorrow() >= p) h += `<button data-k="lbuy:${id}">Borrow & buy for ${fmt(p)}</button>`;
  else {
    const moreMonths = Math.ceil((p - S.cash)/Math.max(1, S.job + machine()));
    h += `<button disabled>Save ${fmt(p - S.cash)} more (~${moreMonths} ${moreMonths === 1 ? 'month' : 'months'})</button>`;
  }
  if (o) h += `<button class="ghost" data-k="sell:${id}">Sell one · ${fmt(p*0.95)}</button>`;
  h += '</div>';
  // Ownership + home line (short) and the amenity boost note stay above the fold.
  if (o) h += `<p class="tip">You own ${n}. Earned ${fmt(o.earned)} so far.</p>` + homeCard(id);
  h += hoodLine(id);
  // Full explanation — collapsible for curious kids.
  let say = `It pays for itself in ~${payback(r)} years. `;
  say += r < BANK ? `Worse than the bank's ${pct(BANK)} — fun to own, bad investment.`
       : r < 0.045 ? `Only a bit better than the bank's ${pct(BANK)}.`
       : r >= 0.15 ? `That's fast. Allocators love deals like this.`
       : `That beats the bank's ${pct(BANK)}.`;
  if (d.kind === 'biz') say += d.vol >= 0.6 ? ' Very bumpy — some months it loses money.'
                              : d.vol <= 0.15 ? ' A little bumpy — small month-to-month changes.'
                              : ' Bumpy — swings up and down.';
  else say += ' Steady — rent comes in almost every month.';
  if (S.mood === 'sale') say += ' 🏷️ Prices are on sale.';
  if (S.mood === 'hot')  say += ' 🔥 Prices are high — maybe wait.';
  h += `<details class="explain"><summary>ℹ️ Explain</summary><p>${d.blurb}</p><p>${say}</p>`;
  if (!can && n < d.max && S.cash + canBorrow() >= p) h += `<p>🏦 Loans cost ${pct(LOAN_RATE)}/yr. ${r > LOAN_RATE ? `You'd still keep ~${pct(r - LOAN_RATE)}/yr after the loan.` : `This earns only ${pct(r)}: borrowing would lose money.`}</p>`;
  h += `</details>`;
  return h;
}

export function dealHTML(d, mine) {
  const r = d.earn*12/(mine ? saasValue(d) : d.price);
  let h = `<p class="tip">A software company that makes apps for ${d.what}. Its earnings grow a little every month.</p>`;
  h += `<div class="facts"><div><small>${mine ? 'Worth now' : 'Price'}</small><b>${fmt(mine ? saasValue(d) : d.price)}</b></div><div><small>Earns a month</small><b>${fmt(d.earn)}</b></div><div><small>Each year</small><b>${pct(r)}</b></div></div><div>${pill(r)}</div>`;
  h += `<div class="say">It pays for itself in about <b>${payback(r)} years</b>, and the earnings keep growing. 📈</div>`;
  if (mine) h += `<div class="say">It has earned you <b>${fmt(d.earned)}</b> so far: ${pct(d.earned/d.paid)} of what you paid.</div><div class="acts"><button class="ghost" data-k="ssell:${d.id}">Sell for ${fmt(saasValue(d)*0.95)}</button></div>`;
  else h += `<div class="say">⏳ Only for sale for ${d.left} more ${d.left === 1 ? 'month' : 'months'}.</div><div class="acts">${S.cash >= d.price ? `<button data-k="dbuy:${d.id}">Buy for ${fmt(d.price)}</button>` : S.cash + canBorrow() >= d.price ? `<button data-k="lbuyd:${d.id}">Borrow ${fmt(d.price - S.cash)} and buy</button>` : `<button disabled>Save ${fmt(d.price - S.cash)} more</button>`}</div>`;
  return h;
}

export function homeLine() {
  const lv = homeLevel(S.home);
  return S.home ? `<div class="say">🏠 You live in your <b>${LIFE[lv].toLowerCase()}</b> (${DEF[S.home].name}). Home bills: ${fmt(livingCost())} a month.</div>`
                : `<div class="say">🏠 You rent a small flat for <b>${fmt(livingCost())}</b> a month. Buy or build a home, then open it and tap Move in.</div>`;
}

export function bankHTML() {
  const lim = canBorrow();
  let h = `<div class="say"><b>🏦 Bank loan</b><br>`;
  h += S.loan ? `You owe <b>${fmt(S.loan)}</b>. It costs ${pct(LOAN_RATE)} a year: <b>${fmt(interest())} a month</b>.<br>` : `You don\u2019t owe the bank anything.<br>`;
  h += stuffValue() ? `You can borrow up to <b>${fmt(lim)}</b> more: the bank lends up to half of what your stuff is worth.` : 'Buy something first. The bank only lends against things you own.';
  h += '</div><div class="acts">';
  for (const a of [10000, 50000, 250000, 1000000, 5000000]) if (a <= lim) h += `<button data-k="borrow:${a}">Borrow ${fmt(a)}</button>`;
  if (lim >= 1000) h += `<button data-k="borrow:max">Borrow ${fmt(lim)}</button>`;
  if (S.loan && S.cash > 0) {
    for (const a of [10000, 100000]) if (a < S.loan && a <= S.cash) h += `<button class="ghost" data-k="repay:${a}">Pay back ${fmt(a)}</button>`;
    h += `<button class="ghost" data-k="repay:all">Pay back ${fmt(Math.min(S.loan, S.cash))}</button>`;
  }
  return h + '</div><p class="tip" style="margin-top:8px">If prices fall and your loan gets too big, the bank will ask for money back, and may sell your stuff.</p>';
}

// Small SVG donut showing portfolio allocation across major asset classes.
function portfolioDonut() {
  const bizV   = Object.keys(S.own).filter(id => DEF[id] && DEF[id].kind === 'biz').reduce((a, id) => a + valueOf(id), 0);
  const homeV  = Object.keys(S.own).filter(id => DEF[id] && DEF[id].kind === 'home').reduce((a, id) => a + valueOf(id), 0);
  const landV  = Object.keys(S.own).filter(id => DEF[id] && DEF[id].kind === 'land').reduce((a, id) => a + valueOf(id), 0);
  const stockV = Object.values(S.etf).reduce((a, e) => a + e.sh*e.p, 0);
  const saasV  = S.saas.reduce((a, c) => a + saasValue(c), 0);
  const cashV  = Math.max(0, S.cash);
  const slices = [
    {label:'Cash',   value:cashV,  col:'#2f8a5b'},
    {label:'Biz',    value:bizV,   col:'#e08a2e'},
    {label:'Homes',  value:homeV,  col:'#3e8ed0'},
    {label:'Land',   value:landV,  col:'#7fa358'},
    {label:'Stocks', value:stockV, col:'#9b5de5'},
    {label:'SaaS',   value:saasV,  col:'#d04b3c'},
  ].filter(s => s.value > 0);
  const total = slices.reduce((a, s) => a + s.value, 0);
  if (total < 1) return '';
  const R = 36, r = 24, cx = 44, cy = 44;
  let acc = -Math.PI/2;   // start at top
  const paths = slices.map(s => {
    const ang = s.value/total*Math.PI*2;
    const x1 = cx + R*Math.cos(acc),       y1 = cy + R*Math.sin(acc);
    const x2 = cx + R*Math.cos(acc + ang), y2 = cy + R*Math.sin(acc + ang);
    const i1 = cx + r*Math.cos(acc + ang), j1 = cy + r*Math.sin(acc + ang);
    const i2 = cx + r*Math.cos(acc),       j2 = cy + r*Math.sin(acc);
    const large = ang > Math.PI ? 1 : 0;
    acc += ang;
    return `<path d="M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${i1} ${j1} A ${r} ${r} 0 ${large} 0 ${i2} ${j2} Z" fill="${s.col}"></path>`;
  }).join('');
  const legend = slices.map(s => `<span style="font-size:.75rem;display:inline-flex;align-items:center;gap:4px;margin-right:8px"><span style="display:inline-block;width:10px;height:10px;background:${s.col};border-radius:2px"></span>${s.label} ${Math.round(s.value/total*100)}%</span>`).join('');
  return `<div style="display:flex;align-items:center;gap:14px;margin:4px 0 10px"><svg viewBox="0 0 88 88" style="width:88px;height:88px;flex-shrink:0">${paths}</svg><div>${legend}</div></div>`;
}

export function mineHTML() {
  const allIds = Object.keys(S.own);
  if (!allIds.length && !S.saas.length && !S.etf.world.sh && !S.etf.tech.sh && !S.etf.bonds.sh && !S.cars.length) {
    return '<p class="tip">You don\u2019t own anything yet. Open the 🛒 Shop and buy your first money machine.</p>' + homeLine() + bankHTML();
  }
  // Default: show every property regardless of district (opt-in to filter by current district).
  const onlyDistrict = mode && mode.mineOnlyDistrict;
  const districtIds = onlyDistrict ? allIds.filter(id => DEF[id].district === currentDistrict || !DEF[id].district) : allIds;
  const hiddenCount = allIds.length - districtIds.length;
  let h = portfolioDonut() + `<div class="facts"><div><small>Your stuff is worth</small><b>${fmt(stuffValue())}</b></div><div><small>It earns a month</small><b>${fmt(machine())}</b></div><div><small>Your job pays</small><b>${fmt(S.job)}</b></div></div>` + homeLine() + bankHTML();
  if (onlyDistrict && hiddenCount > 0) {
    h += `<p class="tip">Showing ${districtIds.length} of ${allIds.length} properties in ${currentDistrict} · <button class="row-buy ghost" data-k="mine-all" style="margin:0">Show all</button></p>`;
  } else if (allIds.length > 10) {
    h += `<p class="tip">Showing all ${allIds.length} properties · <button class="row-buy ghost" data-k="mine-district" style="margin:0">Only ${currentDistrict}</button></p>`;
  }
  h += districtIds.map(rowItem).join('');
  h += Object.keys(ETF).filter(k => S.etf[k].sh > 0).map(rowEtf).join('');
  h += [...new Set(S.cars.map(c => c.type))].map(rowCar).join('');
  h += S.saas.map(rowOwnedSaas).join('');
  return h;
}

export function goalsHTML() {
  const cur = currentGoal();
  let h = '<p class="tip">Finish goals to earn stars. Each one teaches a trick allocators use.</p>';
  h += GOALS.map(g => `<div class="goal ${S.goals[g.k] ? 'done' : g === cur ? 'now' : ''}"><span class="st">${S.goals[g.k] ? '⭐' : g === cur ? '🎯' : '○'}</span><span>${g.t}<small>${g.d}</small></span></div>`).join('');
  h += `<div class="acts"><button class="ghost" data-k="reset">${confirmReset ? 'Tap again to start over' : 'Start over'}</button></div>`;
  return h;
}

export function cityHTML() {
  let h = '<p class="tip">Pinch or scroll to zoom, drag to look around. Tap any building to see its deal.</p><div class="acts">';
  h += `<button data-k="people">${isWatching() ? '🔄 Watch someone else' : '👀 Zoom in on someone walking'}</button>`;
  h += '<button class="ghost" data-k="overview">🏙️ Whole city</button><button class="ghost" data-k="palace">👑 Clifftop palace</button></div>';
  if (isWatching()) h += '<p class="tip" style="margin-top:10px">The camera walks with them. Drag to look at their face, pinch to zoom in closer.</p>';
  return h;
}
