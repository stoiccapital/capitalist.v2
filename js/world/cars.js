// Owned cars: parked models, parking-spot resolver, camera framing for the garage view.
// To add a new car visually: add an entry here under CAR_SHAPE (profile, wheelbase, size).
import { scene } from './scene.js';
import { S } from '../game/state.js';
import { DEF } from '../content/assets.js';
import { CARS } from '../content/cars.js';
import { Y0g } from '../constants.js';
import { flyTo, setTheta } from './camera.js';

export const CAR_SHAPE = {
  city:  {L:3.6, W:1.7, r:0.3, wb:[1.2,-1.2], body:[[1.8,0.32],[1.8,0.75],[1.2,0.92],[0.55,1.48],[-1.3,1.5],[-1.8,1.15],[-1.8,0.32]], glass:[[1.1,0.95],[0.52,1.42],[-1.25,1.44],[-1.62,1.12],[-1.62,0.97]]},
  suv:   {L:4.7, W:1.9, r:0.4, wb:[1.45,-1.45], body:[[2.35,0.45],[2.35,1.0],[1.6,1.15],[0.9,1.75],[-2.0,1.78],[-2.35,1.55],[-2.35,0.45]], glass:[[1.52,1.18],[0.92,1.68],[-1.95,1.7],[-2.22,1.45],[-2.22,1.18]]},
  sports:{L:4.6, W:1.9, r:0.36, wb:[1.45,-1.4], body:[[2.3,0.3],[2.3,0.6],[1.1,0.78],[0.3,1.2],[-0.8,1.24],[-2.0,0.95],[-2.3,0.8],[-2.3,0.3]], glass:[[1.02,0.82],[0.32,1.16],[-0.75,1.19],[-1.85,0.93],[-1.85,0.82]]},
  limo:  {L:6.0, W:2.0, r:0.4, wb:[2.0,-1.9], body:[[3.0,0.36],[3.0,0.95],[1.9,1.05],[1.2,1.55],[-1.7,1.6],[-2.6,1.2],[-3.0,1.1],[-3.0,0.36]], glass:[[1.82,1.08],[1.22,1.5],[-1.65,1.54],[-2.45,1.2],[-2.45,1.08]]},
  hyper: {L:4.6, W:2.05, r:0.36, wb:[1.45,-1.4], body:[[2.3,0.22],[2.3,0.45],[0.9,0.62],[0.0,1.08],[-0.9,1.1],[-2.3,0.75],[-2.3,0.22]], glass:[[0.82,0.66],[0.02,1.04],[-0.75,1.06],[-1.3,0.86],[-1.3,0.66]]},
};

function makeCar(type) {
  const S2 = CAR_SHAPE[type], g = new THREE.Group(), W = S2.W;
  const paint = new THREE.MeshPhongMaterial({color:CARS[type].color, specular:0xffffff, shininess:140});
  const glassM = new THREE.MeshPhongMaterial({color:0x10161c, specular:0x99aabb, shininess:160});
  const dark = new THREE.MeshLambertMaterial({color:0x1a1a1a}), chrome = new THREE.MeshPhongMaterial({color:0xd9dde2, specular:0xffffff, shininess:200});
  const shape = pts => { const sh = new THREE.Shape(); pts.forEach(([x, y], i) => i ? sh.lineTo(x, y) : sh.moveTo(x, y)); return sh; };
  const body = new THREE.ExtrudeGeometry(shape(S2.body), {depth:W - 0.16, bevelEnabled:true, bevelSize:0.08, bevelThickness:0.08, bevelSegments:3}); body.translate(0, 0, -(W - 0.16)/2);
  const bm = new THREE.Mesh(body, paint); bm.castShadow = true; g.add(bm);
  const gl = new THREE.ExtrudeGeometry(shape(S2.glass), {depth:W + 0.02, bevelEnabled:false}); gl.translate(0, 0, -(W + 0.02)/2); g.add(new THREE.Mesh(gl, glassM));
  const L = S2.L/2;
  for (const s of [-1, 1]) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.45), new THREE.MeshBasicMaterial({color:0xfdf6e3})); f.position.set(L + 0.08, S2.body[1][1] - 0.08, s*(W/2 - 0.35)); g.add(f); }
  const rear = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, W - 0.3), new THREE.MeshBasicMaterial({color:0xc0242b})); rear.position.set(-L - 0.08, S2.body[S2.body.length - 2][1] - 0.1, 0); g.add(rear);
  if (type === 'hyper') { const wing = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, W), dark); wing.position.set(-L + 0.4, 1.0, 0); g.add(wing); for (const s of [-1, 1]) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.08), dark); st.position.set(-L + 0.4, 0.85, s*0.6); g.add(st); } }
  if (type === 'limo') for (const s of [-1, 1]) { const line = new THREE.Mesh(new THREE.BoxGeometry(S2.L - 0.6, 0.03, 0.02), chrome); line.position.set(0, 0.95, s*(W/2 + 0.01)); g.add(line); }
  const tyre = new THREE.CylinderGeometry(S2.r, S2.r, 0.28, 22); tyre.rotateX(Math.PI/2);
  const rim = new THREE.CylinderGeometry(S2.r*0.62, S2.r*0.62, 0.3, 18); rim.rotateX(Math.PI/2);
  for (const x of S2.wb) for (const s of [-1, 1]) { const t = new THREE.Mesh(tyre, dark); t.position.set(x, S2.r, s*(W/2 - 0.08)); t.castShadow = true; g.add(t); const rm = new THREE.Mesh(rim, chrome); rm.position.copy(t.position); g.add(rm); }
  return g;
}

// Where the first car parks for the current home. Returns {p, along:'x'|'z'}.
// Hard-coded offsets per home kind — tweak via assets.js once we need per-asset parking.
function homeSpot(city) {
  const id = S.home, d = id && S.own[id] ? DEF[id] : null;
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const APTS = city.landmarks.APTS, TOWER = city.landmarks.TOWER, HOUSE = city.landmarks.HOUSE;
  if (!d) return {p:V3(APTS[0] + 14, Y0g, APTS[2] + 12), along:'x'};
  if (d.kind === 'land') {
    const pl = d.plot, t = S.own[id].dev.type;
    return t === 'complex'
      ? {p:V3(pl.x - pl.sx/2 + 3, Y0g, pl.z + pl.sz/2 + 2.5), along:'x'}
      : {p:V3(pl.x - pl.sx/2 + 3.6, Y0g, pl.z - 2), along:'z'};
  }
  if (id === 'penthouse') return {p:V3(TOWER[0] - 14, TOWER[1], TOWER[2] + 14), along:'x'};
  if (id === 'villa')     return {p:V3(HOUSE[0] - 13.5, HOUSE[1], HOUSE[2] - 1.5), along:'z'};
  const M = {apt:[14, 12], townhouse:[-14, 18.5], family:[-15, 16], estate:[-13, 16.5], mansion:[-11, 15], trophy:[12, -40]};
  const [ox, oz] = M[id] || [-12, 14];
  return {p:V3(d.pos.x + ox, d.pos.y, d.pos.z + oz), along:'x'};
}

const carsG = new THREE.Group(); scene.add(carsG);
let currentCity = null;
export const setCityForCars = c => { currentCity = c; };

export function updateCars() {
  if (!currentCity) return;
  while (carsG.children.length) carsG.remove(carsG.children[0]);
  const {p, along} = homeSpot(currentCity);
  S.cars.forEach((c, i) => {
    const m = makeCar(c.type);
    m.rotation.y = along === 'x' ? Math.PI/2 : 0;
    m.position.set(p.x + (along === 'x' ? i*3.3 : 0), p.y + 0.06, p.z + (along === 'z' ? i*3.3 : 0));
    carsG.add(m);
  });
}

export function showCars() {
  if (!currentCity) return;
  const {p:sp, along} = homeSpot(currentCity);
  const d = S.home && S.own[S.home] ? DEF[S.home] : null;
  const TOWER = currentCity.landmarks.TOWER, APTS = currentCity.landmarks.APTS;
  const c = d ? (S.home === 'penthouse' ? {x:TOWER[0], z:TOWER[2]} : {x:d.pos.x, z:d.pos.z}) : {x:APTS[0], z:APTS[2]};
  const mid = Math.max(0, S.cars.length - 1)*1.65;
  const tx = sp.x + (along === 'x' ? mid : 0), tz = sp.z + (along === 'z' ? mid : 0);
  setTheta(Math.atan2(tx - c.x, tz - c.z) || 0.35);
  flyTo(new THREE.Vector3(tx, sp.y + 1, tz), 18 + S.cars.length*1.5, 0.85);
}
