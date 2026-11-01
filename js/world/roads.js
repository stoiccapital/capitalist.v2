// City streets (grid + avenues on the plateau) and the clifftop road up to the pad.
// Also exports the clifftop curve data so other code (terrain, trophy maker) can share it.
import { scene } from './scene.js';
import { setRoadNear, setRoadH } from './terrain.js';

export let RP = null, ROAD_LEN = 0, roadH = null;
const ROAD_SEG = [];

function buildClifftopCurve(city) {
  const def = city.roads.find(r => r.name === 'clifftop') || city.roads[0];
  RP = new THREE.CatmullRomCurve3(
    def.curve.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    false, 'centripetal',
  ).getSpacedPoints(140);
  ROAD_SEG.length = 0; ROAD_LEN = 0;
  for (let i = 0; i < RP.length - 1; i++) {
    const a = RP[i], b = RP[i+1], l = Math.hypot(b.x - a.x, b.z - a.z);
    ROAD_SEG.push({ax:a.x, az:a.z, dx:(b.x - a.x)/l, dz:(b.z - a.z)/l, l, s0:ROAD_LEN});
    ROAD_LEN += l;
  }
  const {plateauH, padH} = city.terrain;
  roadH = s => plateauH + (padH - plateauH)*Math.min(1, Math.max(0, s/ROAD_LEN));
  return def.width;
}
function roadNear(x, z) {
  let best = 1e9, bs = 0;
  for (const g of ROAD_SEG) {
    const t = Math.min(g.l, Math.max(0, (x - g.ax)*g.dx + (z - g.az)*g.dz));
    const d = Math.hypot(x - (g.ax + g.dx*t), z - (g.az + g.dz*t));
    if (d < best) { best = d; bs = g.s0 + t; }
  }
  return {d:best, s:bs};
}

// Street grid for the mainland city. 50 m blocks; every 200 m is a 20 m avenue.
// Rectangular bounds: covers the whole mainland (south/east/west) and stops before the north cliffs
// so streets don't float over water.
function buildStreets(city) {
  const Y = city.terrain.plateauH + 0.12;
  // City extent: huge on south/east/west, cut off before the sea cliffs on north.
  const X_MIN = -1600, X_MAX = 1600, Z_MIN = -1600, Z_MAX = 200;
  const asphalt = new THREE.MeshLambertMaterial({color:0x3b3f42});
  const paint = new THREE.MeshBasicMaterial({color:0xf1e6b8});
  const g = new THREE.Group();
  // E-W streets (varying z) and N-S streets (varying x)
  // Uniform 10 m streets every 50 m — blocks between them are a clean 40 m wide
  // (centred at ±25, ±75, ±125, …) which is what the procedural filler assumes.
  const stripsZ = [], stripsX = [];
  for (let k = Z_MIN; k <= Z_MAX; k += 50) stripsZ.push([k - 5, k + 5]);
  for (let k = X_MIN; k <= X_MAX; k += 50) stripsX.push([k - 5, k + 5]);
  const dashPos = [];
  const inStripZ = p => stripsZ.some(([a, b]) => p > a - 2 && p < b + 2);
  const inStripX = p => stripsX.some(([a, b]) => p > a - 2 && p < b + 2);

  // E-W streets: span full X range at each z strip
  for (const [a, b] of stripsZ) {
    const w = b - a, mid = (a + b)/2, lenX = X_MAX - X_MIN;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(lenX, w), asphalt);
    m.rotation.x = -Math.PI/2; m.position.set((X_MIN + X_MAX)/2, Y, mid); m.receiveShadow = true; g.add(m);
    for (let p = X_MIN + 3; p < X_MAX - 3; p += 6) if (!inStripX(p)) dashPos.push([p, mid, true]);
  }
  // N-S streets: span full Z range at each x strip
  for (const [a, b] of stripsX) {
    const w = b - a, mid = (a + b)/2, lenZ = Z_MAX - Z_MIN;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, lenZ), asphalt);
    m.rotation.x = -Math.PI/2; m.position.set(mid, Y, (Z_MIN + Z_MAX)/2); m.receiveShadow = true; g.add(m);
    for (let p = Z_MIN + 3; p < Z_MAX - 3; p += 6) if (!inStripZ(p)) dashPos.push([mid, p, false]);
  }
  const dashGeo = new THREE.PlaneGeometry(3, 0.3); dashGeo.rotateX(-Math.PI/2);
  const inst = new THREE.InstancedMesh(dashGeo, paint, dashPos.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), yAxis = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1), v = new THREE.Vector3();
  dashPos.forEach(([x, z, alongX], i) => { q.setFromAxisAngle(yAxis, alongX ? 0 : Math.PI/2); v.set(x, Y + 0.05, z); m4.compose(v, q, one); inst.setMatrixAt(i, m4); });
  g.add(inst);
  scene.add(g);
}

// Private clifftop road: ribbon mesh along RP, dashes, alternating street lamps, stone gate at the end.
function buildClifftopRoad(width) {
  const N = RP.length, W = width, pos = [], idx = [];
  const asphalt = new THREE.MeshLambertMaterial({color:0x3b3f42, side:THREE.DoubleSide});
  const sAt = [0]; for (let i = 1; i < N; i++) sAt.push(sAt[i-1] + RP[i].distanceTo(RP[i-1]));
  const dirAt = i => { const a = RP[Math.max(0, i-1)], b = RP[Math.min(N-1, i+1)], tx = b.x - a.x, tz = b.z - a.z, l = Math.hypot(tx, tz); return [tx/l, tz/l]; };
  for (let i = 0; i < N; i++) {
    const [tx, tz] = dirAt(i), nx = -tz, nz = tx, y = roadH(sAt[i]) + 0.3;
    pos.push(RP[i].x + nx*W/2, y, RP[i].z + nz*W/2, RP[i].x - nx*W/2, y, RP[i].z - nz*W/2);
    if (i < N - 1) { const q = i*2; idx.push(q, q+1, q+2, q+1, q+3, q+2); }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const road = new THREE.Mesh(geo, asphalt); road.receiveShadow = true; scene.add(road);

  const m4 = new THREE.Matrix4(), qt = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1), v = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const dashes = [], lamps = [];
  for (let i = 0, next = 4, side = 1, nextL = 10; i < N; i++) {
    if (sAt[i] >= next) { dashes.push(i); next += 8; }
    if (sAt[i] >= nextL && sAt[i] < sAt[N-1] - 6) { lamps.push([i, side]); side = -side; nextL += 24; }
  }
  const dm = new THREE.InstancedMesh(new THREE.BoxGeometry(3, 0.05, 0.25), new THREE.MeshBasicMaterial({color:0xf1e6b8}), dashes.length);
  dashes.forEach((i, j) => { const [tx, tz] = dirAt(i); qt.setFromAxisAngle(up, -Math.atan2(tz, tx)); v.set(RP[i].x, roadH(sAt[i]) + 0.36, RP[i].z); m4.compose(v, qt, one); dm.setMatrixAt(j, m4); });
  scene.add(dm);
  const poleM = new THREE.MeshLambertMaterial({color:0x4a4d52}), headM = new THREE.MeshBasicMaterial({color:0xffe2a8});
  for (const [i, sd] of lamps) {
    const [tx, tz] = dirAt(i), x = RP[i].x - tz*sd*(W/2 + 1.3), z = RP[i].z + tx*sd*(W/2 + 1.3), y = roadH(sAt[i]);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 7, 8), poleM); pole.position.set(x, y + 3.5, z); pole.castShadow = true; scene.add(pole);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), headM); head.position.set(x, y + 7.1, z); scene.add(head);
  }
  const [gx, gz] = dirAt(N-1), end = RP[N-1], gy = roadH(sAt[N-1]);
  const stoneM = new THREE.MeshLambertMaterial({color:0xe2d9c8});
  for (const sd of [-1, 1]) {
    const x = end.x - gz*sd*6.2, z = end.z + gx*sd*6.2;
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 4.2, 1.4), stoneM); p1.position.set(x, gy + 2.1, z); p1.castShadow = true; scene.add(p1);
    const lt = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), headM); lt.position.set(x, gy + 4.7, z); scene.add(lt);
  }
}

export function buildRoads(city) {
  const width = buildClifftopCurve(city);
  setRoadNear(roadNear);
  setRoadH(roadH);
  buildStreets(city);
  buildClifftopRoad(width);
}
