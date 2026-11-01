// Input dispatch: data-k="action[:arg[:arg]]" buttons, nav tabs, keyboard, auto-step.
import { S, resetState } from '../game/state.js';
import { DEF } from '../content/assets.js';
import { BUILD } from '../content/buildables.js';
import { priceOf, bCost, canBorrow } from '../game/economy.js';
import { lesson } from './fx.js';
import {
  buy, sell, buyDeal, sellSaas, buildOn, buyCar, sellCar,
  moveIn, moveOut, etfBuy, etfSell, borrow, repay, step,
} from '../game/actions.js';
import { mode, preview, confirmReset, setMode, setPreview, setConfirmReset, currentDistrict, setCurrentDistrict } from './sheet.js';
import { $, setMuted } from './fx.js';
import city from '../content/cities/vn.js';
import { updatePins, showArea } from '../world/pins.js';
import { showItem, HOME_VIEW, watchPerson, stopWatching, flyToDistrict, flyToWholeCity } from '../world/camera.js';
import { showCars } from '../world/cars.js';
import { FAR } from '../constants.js';
import { render, drawWealth } from './render.js';
import { setVisibleDistrict } from '../world/city.js';
import { renderer } from '../world/scene.js';
import { showCityAmenityRings } from '../world/pins.js';

// Play button: tap advances one month. Hold (>400 ms) toggles auto-advance ON.
// Auto keeps running after release. Tap again while auto is on → pause.
let autoId = 0, holdTimer = 0, heldToAuto = false;
export function stopAuto() {
  clearInterval(autoId); autoId = 0;
  const btn = $('kPlay'); if (btn) { btn.classList.remove('auto'); btn.innerHTML = '▶ Next month<small style="display:block;font-size:.68rem;font-weight:400;opacity:.75">hold for auto</small>'; }
}
export function startAuto() {
  if (autoId) return;
  autoId = setInterval(step, 700);
  const btn = $('kPlay'); if (btn) { btn.classList.add('auto'); btn.innerHTML = '⏸ Pause<small style="display:block;font-size:.68rem;font-weight:400;opacity:.85">auto playing…</small>'; }
}

export function closeSheet() {
  const wasItem = mode && mode.item;
  setMode(null);
  if (preview) { setPreview(null); updatePins(); }
  setConfirmReset(false);
  showCityAmenityRings(false);
  render();
  if (wasItem) HOME_VIEW();
}

export function act(k) {
  const [a, b, c] = k.split(':');
  if (a !== 'reset') setConfirmReset(false);

  if (a === 'item') { if (preview) { setPreview(null); updatePins(); } setMode({item:b}); render(); }
  else if (a === 'deal')  { setMode({deal:+b}); render(); }
  else if (a === 'saas')  { setMode({saas:+b}); render(); }
  else if (a === 'buy')   buy(b);
  else if (a === 'sell')  sell(b);
  else if (a === 'borrow')borrow(b === 'max' ? canBorrow() : +b);
  else if (a === 'repay') repay(b === 'all' ? S.loan : +b);
  else if (a === 'lbuy')  { if (borrow(priceOf(b) - S.cash + 1)) buy(b); }
  else if (a === 'lbuyd') { const d = S.deals.find(x => x.id === +b); if (d && borrow(d.price - S.cash + 1)) buyDeal(+b); }
  else if (a === 'dbuy')  buyDeal(+b);
  else if (a === 'build') buildOn(b, c);
  else if (a === 'lbuild'){ if (borrow(bCost(c, DEF[b].plot) - S.cash + 1)) buildOn(b, c); }
  else if (a === 'prev')  { setPreview({id:b, type:c}); updatePins(); render(); showItem(b, BUILD[c].amenity ? FAR*0.9 : BUILD[c].h); }
  else if (a === 'live')  moveIn(b);
  else if (a === 'car')   { setMode({car:b}); render(); showCars(); }
  else if (a === 'cbuy')  buyCar(b);
  else if (a === 'csell') sellCar(b);
  else if (a === 'moveout') moveOut();
  else if (a === 'etf')   { setMode({etf:b}); render(); lesson('etf'); }
  else if (a === 'etfb')  etfBuy(b, c === 'all' ? S.cash : +c);
  else if (a === 'etfs')  etfSell(b, +c);
  else if (a === 'ssell') sellSaas(+b);
  else if (a === 'sub')       { setMode({tab:'shop', sub:b}); showCityAmenityRings(b === 'land' || b === 'build'); render(); }
  else if (a === 'shop-back') { setMode({tab:'shop'}); showCityAmenityRings(false); render(); }
  else if (a === 'land-all')  { setMode({...mode, landAll:true}); render(); }
  else if (a === 'land-less') { setMode({...mode, landAll:false}); render(); }
  else if (a === 'mine-all')      { setMode({...mode, mineOnlyDistrict:false}); render(); }
  else if (a === 'mine-district') { setMode({...mode, mineOnlyDistrict:true}); render(); }
  else if (a === 'reset') {
    if (!confirmReset) { setConfirmReset(true); render(); return; }
    setConfirmReset(false); stopAuto();
    resetState(); updatePins();
    setMode(null); HOME_VIEW(); render(); lesson('start');
  }
  else if (a === 'people')   watchPerson();
  else if (a === 'overview') { stopWatching(); HOME_VIEW(); }
  else if (a === 'palace')   { stopWatching(); showItem('trophy'); }
  else if (['shop','mine','goals','city','wealth'].includes(a)) {
    if (mode && mode.tab === a) { closeSheet(); return; }
    setMode({tab:a}); render();
  }
}

function jumpToDistrict(id) {
  setCurrentDistrict(id);
  $('kDistName').textContent = `${id} ▾`;
  setVisibleDistrict(id);
  renderer.shadowMap.needsUpdate = true;
  flyToDistrict(city.districts.find(d => d.id === id));
  render();
  closeDistrictPicker();
  const chip = $('kWholeChip');
  if (chip && !chip.hidden) { chip.hidden = true; priorDistrict = null; }
}

// Cycle through districts in order (D1 → D2 → …).
function changeDistrict(step) {
  const ids = city.districts.map(d => d.id);
  const idx = ids.indexOf(currentDistrict);
  jumpToDistrict(ids[(idx + step + ids.length) % ids.length]);
}

function openDistrictPicker() {
  const picker = $('kDistPicker');
  const name = $('kDistName');
  if (!picker || !name) return;
  // Build the grid of 24 district buttons on each open (ids rarely change but ok to rebuild).
  const grid = document.createElement('div');
  grid.className = 'distgrid';
  for (const d of city.districts) {
    const b = document.createElement('button');
    b.textContent = d.id;
    if (d.id === currentDistrict) b.classList.add('active');
    b.onclick = (e) => { e.stopPropagation(); jumpToDistrict(d.id); };
    grid.appendChild(b);
  }
  picker.innerHTML = '';
  picker.appendChild(grid);
  picker.hidden = false;
  name.setAttribute('aria-expanded', 'true');
}
function closeDistrictPicker() {
  const picker = $('kDistPicker'), name = $('kDistName');
  if (picker) picker.hidden = true;
  if (name) name.setAttribute('aria-expanded', 'false');
}

let priorDistrict = null;   // the district we came from when entering whole-city view

// Birds-eye: show the whole city at once, high up.
export function wholeCityView() {
  priorDistrict = currentDistrict;
  setVisibleDistrict(null);
  renderer.shadowMap.needsUpdate = true;
  flyToWholeCity();
  closeDistrictPicker();
  const chip = $('kWholeChip'); const to = $('kWholeChipTo');
  if (chip && to) { to.textContent = priorDistrict || 'D4'; chip.hidden = false; }
}
function exitWholeCity() {
  const chip = $('kWholeChip');
  if (chip) chip.hidden = true;
  jumpToDistrict(priorDistrict || 'D4');
  priorDistrict = null;
}

export function wireInput() {
  $('kBody').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b && !b.disabled) act(b.dataset.k); });
  document.querySelectorAll('#kNav [data-k]').forEach(b => b.onclick = () => act(b.dataset.k));
  $('kClose').onclick   = closeSheet;
  $('kGoal').onclick    = () => act('goals');
  $('kWealth').onclick  = () => act('wealth');
  // Play button logic:
  //   • Auto OFF, quick tap  → step 1 month
  //   • Auto OFF, hold >400ms → start auto (keeps running after release)
  //   • Auto ON,  tap        → pause auto
  const play = $('kPlay');
  stopAuto();   // paint initial "▶ Next month · hold for auto"
  play.addEventListener('pointerdown', e => {
    e.preventDefault();
    play.setPointerCapture(e.pointerId);
    heldToAuto = false;
    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => { heldToAuto = true; startAuto(); }, 400);
  });
  play.addEventListener('pointerup', () => {
    clearTimeout(holdTimer); holdTimer = 0;
    if (heldToAuto) return;                 // auto already started during the hold
    if (autoId) stopAuto();                 // was already auto-playing → pause it
    else step();                            // quick tap → one month
  });
  const cancel = () => { clearTimeout(holdTimer); holdTimer = 0; };
  play.addEventListener('pointercancel', cancel);
  play.addEventListener('pointerleave', cancel);
  $('kMute').onclick    = () => {
    const next = $('kMute').textContent === '🔊';
    setMuted(next);
    $('kMute').textContent = next ? '🔇' : '🔊';
    $('kMute').setAttribute('aria-label', next ? 'Turn sound on' : 'Turn sound off');
  };
  $('kLessonOk').onclick = () => { $('kLesson').hidden = true; };
  // District switcher wiring
  const dp = $('kDistPrev'), dn = $('kDistNext'), dname = $('kDistName'), wc = $('kWholeCity');
  if (dp) dp.onclick = () => changeDistrict(-1);
  if (dn) dn.onclick = () => changeDistrict(+1);
  if (dname) dname.onclick = (e) => {
    e.stopPropagation();
    const picker = $('kDistPicker');
    if (picker && !picker.hidden) closeDistrictPicker();
    else openDistrictPicker();
  };
  if (wc) wc.onclick = () => wholeCityView();
  const wchip = $('kWholeChip');
  if (wchip) wchip.onclick = () => exitWholeCity();
  // Gear popover: shows date + mood
  const gear = $('kGear'), gearPop = $('kGearPop');
  if (gear) gear.onclick = (e) => {
    e.stopPropagation();
    if (gearPop.hidden) { gearPop.hidden = false; gear.setAttribute('aria-expanded', 'true'); }
    else { gearPop.hidden = true; gear.setAttribute('aria-expanded', 'false'); }
  };
  document.addEventListener('click', (e) => {
    if (!gearPop || gearPop.hidden) return;
    if (gearPop.contains(e.target) || gear.contains(e.target)) return;
    gearPop.hidden = true; gear.setAttribute('aria-expanded', 'false');
  });
  // Close picker when clicking anywhere outside it.
  document.addEventListener('click', (e) => {
    const picker = $('kDistPicker');
    if (!picker || picker.hidden) return;
    if (picker.contains(e.target) || dname.contains(e.target)) return;
    closeDistrictPicker();
  });
  addEventListener('resize', () => { if (mode && mode.tab === 'wealth') drawWealth(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') { if (!$('kLesson').hidden) $('kLesson').hidden = true; else closeSheet(); } });
}
