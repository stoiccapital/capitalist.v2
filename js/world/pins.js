// Plot visuals (for-sale sign + preview/built model + scaffold), ownership pins, amenity area ring.
import { scene, pickables, ANIMS, renderer } from './scene.js';
import { S } from '../game/state.js';
import { DEF } from '../content/assets.js';
import { BUILD, SCAF } from '../content/buildables.js';
import { BUILD_MAKERS } from './makers/buildables.js';
import { TEX, goldM } from './makers/kit.js';
import { FAR, Y0g } from '../constants.js';
import { preview } from '../ui/sheet.js';
import { itemH } from './camera.js';

const plotVis = {};
const pins = {};
let areaRing, areaFill;
// Persistent rings over each city amenity (metro, school, etc.) — toggled on when the
// player is picking land/build so they can see where the bonuses land.
const cityRings = [];
let cityAmenitiesList = [];
export function setCityAmenitiesForRings(list) { cityAmenitiesList = list || []; }
let TEXS;   // lazily initialized after document is ready

export function showCityAmenityRings(on) {
  for (const {ring, fill} of cityRings) { ring.visible = on; fill.visible = on; }
}

export function initPins() {
  TEXS = TEX();
  const PLOTS = Object.keys(DEF).filter(id => DEF[id].kind === 'land').map(id => DEF[id].plot);
  for (const p of PLOTS) {
    const procedural = !!DEF[p.id].procedural;
    const g = new THREE.Group(); g.position.set(p.x, Y0g, p.z); g.userData.asset = p.id;
    g.userData.district = DEF[p.id].district;
    // Pickable base plane. Hero plots show a bright green pad; procedural ones are
    // almost invisible but still clickable so the user can buy the empty ground.
    const pm = new THREE.MeshBasicMaterial({color:0x5fbf7f, transparent:true, opacity: procedural ? 0.02 : 0.3, depthWrite:false});
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(p.sx - 1, p.sz - 1), pm); plane.rotation.x = -Math.PI/2; plane.position.y = 0.1; g.add(plane);
    let post, board;
    if (!procedural) {
      post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3, 6), new THREE.MeshLambertMaterial({color:0x5a5a5a})); post.position.set(-p.sx/2 + 3, 1.5, p.sz/2 - 3); g.add(post);
      board = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), new THREE.MeshBasicMaterial({map:TEXS.sale, side:THREE.DoubleSide})); board.position.set(-p.sx/2 + 3, 3.2, p.sz/2 - 3); g.add(board);
    }
    const scaffold = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1, 4, 12, 4), new THREE.MeshBasicMaterial({color:0xe08a2e, wireframe:true})); scaffold.visible = false; g.add(scaffold);
    scene.add(g); pickables.push(g);
    plotVis[p.id] = {g, plane, pm, post, board, scaffold, models:{}, procedural};
  }

  areaRing = new THREE.Mesh(new THREE.RingGeometry(FAR - 6, FAR, 96), new THREE.MeshBasicMaterial({color:0x2f8a5b, transparent:true, opacity:0.8, depthWrite:false, side:THREE.DoubleSide}));
  areaRing.rotation.x = -Math.PI/2; areaRing.visible = false; scene.add(areaRing);
  areaFill = new THREE.Mesh(new THREE.CircleGeometry(FAR, 96), new THREE.MeshBasicMaterial({color:0x2f8a5b, transparent:true, opacity:0.14, depthWrite:false}));
  areaFill.rotation.x = -Math.PI/2; areaFill.visible = false; scene.add(areaFill);

  // Build persistent rings over every city amenity. Hidden by default; shown via showCityAmenityRings().
  for (const a of cityAmenitiesList) {
    const colors = {metro:0x2f7fb5, school:0xe08a2e, uni:0x7e6bc4, park:0x2f8a5b, hospital:0xc0392b, mall:0xd04b3c, food:0xe4572e, market:0xf5b700};
    const name = (a.name || '').toLowerCase();
    const col = name.includes('metro') ? colors.metro : name.includes('university') ? colors.uni : name.includes('school') ? colors.school : name.includes('park') ? colors.park : name.includes('hospital') ? colors.hospital : name.includes('mall') ? colors.mall : name.includes('food') ? colors.food : colors.market;
    // Ring radius scales with boost strength — bigger ring = stronger amenity.
    const r = FAR;
    const ring = new THREE.Mesh(new THREE.RingGeometry(r - 3, r, 64), new THREE.MeshBasicMaterial({color: col, transparent:true, opacity:0.5, depthWrite:false, side:THREE.DoubleSide}));
    const fill = new THREE.Mesh(new THREE.CircleGeometry(r, 64), new THREE.MeshBasicMaterial({color: col, transparent:true, opacity:0.08, depthWrite:false}));
    ring.rotation.x = fill.rotation.x = -Math.PI/2;
    ring.position.set(a.x, Y0g + 0.4, a.z);
    fill.position.set(a.x, Y0g + 0.35, a.z);
    ring.visible = fill.visible = false;
    scene.add(ring); scene.add(fill);
    cityRings.push({ring, fill, amenity:a});
  }

  // Register the pin-spin + bobbing animation.
  ANIMS.push(time => {
    for (const k in pins) if (pins[k].visible) {
      pins[k].rotation.y = time*2;
      pins[k].children[1].position.y = pins[k].children[1].geometry.parameters.radius/0.62*1.8 + Math.sin(time*4)*0.3;
    }
  });
}

export function showArea(id) {
  if (!areaRing) return;
  const o = id && S.own[id], t = o && o.dev ? o.dev.type : preview && preview.id === id ? preview.type : null;
  const on = !!(t && BUILD[t].amenity);
  areaRing.visible = areaFill.visible = on;
  if (on) { const pl = DEF[id].plot; areaRing.position.set(pl.x, Y0g + 0.4, pl.z); areaFill.position.set(pl.x, Y0g + 0.35, pl.z); }
}

function modelFor(v, p, type) {
  if (!v.models[type]) { const m = BUILD_MAKERS[type](p); v.g.add(m); v.models[type] = m; }
  return v.models[type];
}

function updatePlots() {
  const PLOTS = Object.keys(DEF).filter(id => DEF[id].kind === 'land').map(id => DEF[id].plot);
  for (const p of PLOTS) {
    const v = plotVis[p.id], o = S.own[p.id], dev = o && o.dev, done = !!(dev && dev.done), building = !!(dev && !dev.done);
    v.plane.visible = !done;
    v.pm.color.set(o ? 0xd4af37 : 0x5fbf7f);
    if (v.post)  v.post.visible = !done;
    if (v.board) {
      v.board.visible = !done;
      v.board.material.map = building ? TEXS.build : o ? TEXS.owned : TEXS.sale;
      v.board.material.needsUpdate = true;
    }
    for (const t in v.models) v.models[t].visible = false;
    v.scaffold.visible = building;
    if (!dev && preview && preview.id === p.id) {
      const m = modelFor(v, p, preview.type); m.visible = true; m.scale.y = 1;
      if (v.board) v.board.visible = false;
    }
    if (dev) {
      const m = modelFor(v, p, dev.type), frac = done ? 1 : Math.max(0.04, 1 - dev.left/dev.total);
      m.visible = true; m.scale.y = frac;
      const [sx, sy, sz] = SCAF[dev.type](p), hgt = sy*Math.min(1, frac + 0.12);
      v.scaffold.scale.set(sx + 1, hgt, sz + 1); v.scaffold.position.y = hgt/2;
    }
  }
}

export function updatePins() {
  // Any change here might introduce/remove a model (preview, scaffold, finished build)
  // → shadow map needs to re-render. The map is otherwise static.
  renderer.shadowMap.needsUpdate = true;
  updatePlots();
  for (const id in DEF) {
    const d = DEF[id]; if (!d.pos) continue;
    if (pins[id] && d.kind === 'land') {
      const s = Math.max(1.4, Math.min(8, itemH(id)/14));
      pins[id].position.y = d.pos.y + itemH(id);
      pins[id].scale.setScalar(s/pins[id].userData.s);
    }
    if (S.own[id] && !pins[id]) {
      const s = Math.max(1.4, Math.min(8, itemH(id)/14)), g = new THREE.Group();
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.6*s, 1.6*s, 16), goldM); cone.rotation.x = Math.PI; cone.position.y = 0.8*s; g.add(cone);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.62*s, 16, 12), goldM); ball.position.y = 1.8*s; g.add(ball);
      g.position.set(d.pos.x, d.pos.y + itemH(id), d.pos.z); g.userData.s = s;
      g.userData.district = d.district;
      scene.add(g); pins[id] = g;
    }
    if (pins[id]) pins[id].visible = !!S.own[id];
  }
}
