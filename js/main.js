// Bootstrap: load city → resolve catalog → load save → scene / world / ui → animate.
//
// Static imports throughout. Module-cycle-safe because cross-module calls happen inside
// functions, never at module init. scene.js initializes WebGL as a side effect on first
// import — safe because <script type="module"> is deferred (runs after DOM parse).

import city from './content/cities/vn.js';
import { resolveCatalog, DEF } from './content/assets.js';
import { Y0g } from './constants.js';
import { S, loadSave, save } from './game/state.js';
import { setCityAmenities } from './game/economy.js';

// Resolve DEF positions and build plot entries BEFORE anything else reads DEF.
// Nothing in the import chain below reads DEF at module init — only at use time.
resolveCatalog(THREE, city, Y0g);
setCityAmenities(city.cityAmenities);
setCityAmenitiesForRings(city.cityAmenities);
import { buildTerrain, regenTerrain, setGridVisible } from './world/terrain.js';
import { buildRoads } from './world/roads.js';
import { buildCity, setVisibleDistrict } from './world/city.js';
import { populate } from './world/people.js';
import { wirePointer, placeCam, HOME_VIEW, flyTo, watchPerson } from './world/camera.js';
import { initPins, updatePins, setCityAmenitiesForRings } from './world/pins.js';
import { setCityForCars, updateCars } from './world/cars.js';
import { wirePicker } from './world/picker.js';
import { startLoop } from './world/loop.js';
import { renderer, camera } from './world/scene.js';
import { wireInput } from './ui/input.js';
import { render } from './ui/render.js';
import { lesson } from './ui/fx.js';

loadSave();

buildTerrain(city);
buildRoads(city);
regenTerrain();            // after roads.js has set roadNear/roadH
buildCity(city);
populate();
initPins();
setCityForCars(city);
wirePointer();
placeCam();
wirePicker(city);

wireInput();
updatePins();
updateCars();
// Start the player in D4 (central district with hero landmarks). Hide everything else.
setVisibleDistrict('D4');
render();
HOME_VIEW();
if (!S.lessons.start) lesson('start');
// If the catalogue changed and we had to scrub stale ownership, tell the player.
if (S._catalogChanged) {
  import('./ui/fx.js').then(({recap}) => recap('🏙️ City updated', `${S._catalogChanged} building${S._catalogChanged === 1 ? '' : 's'} you owned were replaced with new buildings. Your cash is unchanged.`));
  delete S._catalogChanged;
  save();
}
// Districts are a new mechanic — explain them after the welcome lesson.
if (!S.lessons.districts) setTimeout(() => lesson('districts'), 4000);
// First-run only: float a "Tap me" hint over a visible building so new players discover
// that any building in 3D is clickable.
if (!S.lessons.tapHint) setTimeout(showTapHint, 6500);
function showTapHint() {
  // Pick a hero home in the current district as the target.
  const id = Object.keys(DEF).find(k => DEF[k].kind === 'home' && DEF[k].pos && DEF[k].district === 'D4' && !DEF[k].procedural);
  const d = id && DEF[id];
  if (!d || !d.pos) return;
  const hint = document.createElement('div');
  hint.className = 'taphint';
  hint.innerHTML = '👆 Tap any building to buy it!';
  document.body.appendChild(hint);
  const t0 = performance.now();
  const tick = () => {
    const v = d.pos.clone().project(camera);
    if (v.z > 1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1) {
      hint.style.left = '50%'; hint.style.top = '55%'; hint.style.transform = 'translate(-50%, 0)';
    } else {
      hint.style.left = (v.x + 1)/2*innerWidth + 'px';
      hint.style.top = (1 - v.y)/2*innerHeight + 'px';
      hint.style.transform = 'translate(-50%, -140%)';
    }
    if (performance.now() - t0 < 5000) requestAnimationFrame(tick);
    else hint.remove();
  };
  tick();
  S.lessons.tapHint = true; save();
}

wireMenu();
startLoop(city.terrain.waterH);

function wireMenu() {
  const L = city.landmarks;
  const hud = document.getElementById('hud');
  if (!hud) return;
  hud.open = innerWidth >= 900;
  hud.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { if (innerWidth < 900) hud.open = false; }));
  const by = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };
  const v = p => new THREE.Vector3(...p);
  by('regen',      () => { regenTerrain(); renderer.shadowMap.needsUpdate = true; });
  by('goHouse',    () => flyTo(v(L.HOUSE), 75, 0.95));
  by('goPent',     () => flyTo(v(L.PENT), 70, 0.9));
  by('goL81',      () => flyTo(v([L.L81[0], L.L81[1] + 220, L.L81[2]]), 700, 1.25));
  by('goApts',     () => flyTo(v([L.APTS[0], L.APTS[1] + 60, L.APTS[2]]), 320, 1.1));
  by('goCar',      () => flyTo(v([L.SEDAN[0], L.SEDAN[1] + 1, L.SEDAN[2]]), 14, 1.15));
  by('goGT',       () => flyTo(v([L.GT[0], L.GT[1] + 0.8, L.GT[2]]), 10, 1.2));
  by('goSchool',   () => flyTo(v([L.SCHOOL[0], L.SCHOOL[1] + 4, L.SCHOOL[2]]), 90, 0.95));
  by('goHospital', () => flyTo(v([L.HOSPITAL[0], L.HOSPITAL[1] + 18, L.HOSPITAL[2]]), 130, 1.0));
  by('goFood',     () => flyTo(v([L.FOOD[0], L.FOOD[1] + 2, L.FOOD[2]]), 55, 1.0));
  by('goPeople',   () => flyTo(v([10, 13, 10]), 22, 1.2));
  by('goIsland',   () => flyTo(v([0, 12, 0]), 2400, 0.95));
  by('follow',     watchPerson);
  const grid = document.getElementById('grid');
  if (grid) grid.onchange = e => setGridVisible(e.target.checked);
}
