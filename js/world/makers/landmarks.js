// Starter-city landmarks: factories that build each pre-existing building/car on the island.
// Each maker takes a Vector3 (resolved from the city's landmark table) and returns a Group
// positioned at that point. The group is added to the scene by city.js.
// Register a new landmark: add a maker here, add its key to the city.prebuilt list.
import { kit, waterM, gable, hip, cypress } from './kit.js';
import { ANIMS } from '../scene.js';

const X_AXIS = new THREE.Vector3(1, 0, 0);

// --- Modern villa (HOUSE landmark) ---
function villa(pos) {
  const h = new THREE.Group();
  h.position.copy(pos);
  const mat = (c, e = {}) => new THREE.MeshLambertMaterial({color:c, ...e});
  const box = (w, ht, d, m, x, y, z) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, ht, d), m);
    b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; h.add(b); return b;
  };
  const white = mat(0xf4f2ee), stone = mat(0xcfc3ad), wall = mat(0xd9d2c3), dark = mat(0x2f2b28),
        paving = mat(0xbdb5a6), deck = mat(0xe9e2d3), lawn = mat(0x6fa24f), wood = mat(0x8a5a3b);
  const glass = new THREE.MeshPhongMaterial({color:0x8fb8c4, emissive:0x4a3410, transparent:true, opacity:.6, shininess:120});
  const water = new THREE.MeshPhongMaterial({color:0x3fc1d9, emissive:0x0b3a44, shininess:150});

  box(34.6, 0.06, 34.6, lawn, 0, 0.03, 0);
  box(9, 0.08, 6, paving, -13, 0.06, -8);
  box(22, 0.2, 9, deck, 3, 0.1, 8.5);
  box(14, 0.12, 4.5, water, 3, 0.24, 8.5);

  box(34.6, 1.2, 0.3, wall, 0, 0.6, -17.15);
  box(34.6, 1.2, 0.3, wall, 0, 0.6, 17.15);
  box(0.3, 1.2, 34.6, wall, 17.15, 0.6, 0);
  box(0.3, 1.2, 6.3, wall, -17.15, 0.6, -14.15);
  box(0.3, 1.2, 22.3, wall, -17.15, 0.6, 6.15);

  box(18, 3.5, 12, stone, 2, 1.75, -3);
  box(16, 2.9, 0.12, glass, 2, 1.6, 3.02);
  box(0.12, 2.9, 8, glass, -7.02, 1.6, -3);
  box(7, 3.5, 7, white, -12, 1.75, -8);
  box(0.1, 2.6, 5, dark, -15.52, 1.3, -8);

  box(23, 3.2, 9, white, -1, 5.1, -4);
  box(20, 2.2, 0.12, glass, -1, 5.1, 0.52);
  box(0.12, 2.2, 7, glass, -12.52, 5.1, -4);
  box(24, 0.35, 10.5, white, -1, 6.88, -3.8);
  box(6, 3.2, 0.15, wood, 7, 5.1, 0.6);
  box(10, 0.9, 0.2, white, 5, 7.5, 1.2);
  for (const x of [-5.5, -4, -2.5]) box(1, 0.4, 2, white, x, 0.4, 12);

  const trunkM = mat(0x6b4a33), leafM = mat(0x3f6e3a, {flatShading:true}), cypM = mat(0x2f5a33, {flatShading:true});
  const trees = [[15,-15,'r'],[15,-5,'c'],[15,5,'c'],[15,15,'r'],[-15,15,'r'],[-10,15,'c'],[0,-15,'c'],[8,-15,'c'],[-15,-15,'r']];
  for (const [x, z, t] of trees) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 2.5, 6), trunkM);
    trunk.position.set(x, 1.25, z); trunk.castShadow = true; h.add(trunk);
    const crown = t === 'r'
      ? new THREE.Mesh(new THREE.IcosahedronGeometry(2.2, 0), leafM)
      : new THREE.Mesh(new THREE.ConeGeometry(1, 6, 7), cypM);
    crown.position.set(x, t === 'r' ? 3.8 : 4.5, z); crown.castShadow = true; h.add(crown);
  }
  return h;
}

// --- Residential tower with penthouse (TOWER landmark) ---
function towerPH(pos) {
  const FLOORS = 24, FH = 3.3, LOBBY = 5, ROOF_Y = LOBBY + FLOORS*FH;
  const t = new THREE.Group(); t.position.copy(pos);
  const mat = (c, e = {}) => new THREE.MeshLambertMaterial({color:c, ...e});
  const box = (w, ht, d, m, x, y, z) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, ht, d), m);
    b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; t.add(b); return b;
  };
  const white = mat(0xf2f0eb), paving = mat(0xc9c4ba), deckM = mat(0x9a6b47), green = mat(0x4a7a43, {flatShading:true});
  const towerGlass = new THREE.MeshPhongMaterial({color:0x5d7c8c, specular:0xbfd9e6, shininess:110});
  const lobbyGlass = new THREE.MeshPhongMaterial({color:0x8fb8c4, emissive:0x3a2a10, transparent:true, opacity:.55});
  const phGlass = new THREE.MeshPhongMaterial({color:0x9fc4cf, emissive:0x7a5418, transparent:true, opacity:.5, shininess:140});
  const rail = new THREE.MeshPhongMaterial({color:0xcfe6ee, transparent:true, opacity:.35});
  const water = new THREE.MeshPhongMaterial({color:0x3fc1d9, emissive:0x0b3a44, shininess:150});

  box(34.6, 0.06, 34.6, paving, 0, 0.03, 0);
  box(20, LOBBY, 20, lobbyGlass, 0, LOBBY/2, 0);
  for (const x of [-10.7, 10.7]) for (const z of [-10.7, 10.7]) box(0.8, LOBBY, 0.8, white, x, LOBBY/2, z);

  box(22, FLOORS*FH, 22, towerGlass, 0, LOBBY + FLOORS*FH/2, 0);
  for (let i = 0; i <= FLOORS; i++) box(22.6, 0.35, 22.6, white, 0, LOBBY + i*FH, 0);
  for (const x of [-11, 11]) for (const z of [-11, 11]) box(0.7, FLOORS*FH, 0.7, white, x, LOBBY + FLOORS*FH/2, z);

  const R = ROOF_Y;
  box(22.6, 0.3, 22.6, deckM, 0, R + 0.15, 0);
  box(15, 6.6, 12, phGlass, -2.5, R + 0.3 + 3.3, -4.5);
  box(15.2, 0.3, 12.2, white, -2.5, R + 0.3 + 3.3, -4.5);
  box(4, 6.6, 4, white, -8, R + 0.3 + 3.3, -8.5);
  box(18.5, 0.5, 15.5, white, -2.5, R + 6.9 + 0.25, -3.8);
  box(22.6, 1.1, 0.08, rail, 0, R + 0.85, 11.26);
  box(22.6, 1.1, 0.08, rail, 0, R + 0.85, -11.26);
  box(0.08, 1.1, 22.6, rail, 11.26, R + 0.85, 0);
  box(0.08, 1.1, 22.6, rail, -11.26, R + 0.85, 0);
  box(9.2, 0.5, 4.2, white, 4, R + 0.55, 7.5);
  box(8.6, 0.06, 3.6, water, 4, R + 0.82, 7.5);
  for (const x of [-1.5, 0]) box(0.9, 0.4, 2, white, x, R + 0.5, 8);
  for (const x of [-9.5, -5.5]) for (const z of [4, 9]) box(0.2, 3, 0.2, white, x, R + 1.8, z);
  for (let i = 0; i < 6; i++) box(4.4, 0.15, 0.25, deckM, -7.5, R + 3.35, 4 + i);
  for (const [x, z] of [[10,-10],[10,2],[-10,10],[10,10]]) {
    box(1.4, 0.7, 1.4, white, x, R + 0.65, z);
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 0), green);
    s.position.set(x, R + 1.6, z); s.castShadow = true; t.add(s);
  }
  return t;
}

// --- Landmark 81 (L81 landmark) ---
function l81(pos) {
  const g = new THREE.Group(); g.position.copy(pos);
  const white = new THREE.MeshLambertMaterial({color:0xf2f0eb});
  const box = (w, ht, d, m, x, y, z) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, ht, d), m);
    b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; g.add(b); return b;
  };
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const cx = c.getContext('2d');
  cx.fillStyle = '#4c6c80'; cx.fillRect(0, 0, 64, 64);
  cx.fillStyle = '#a9c4d1'; cx.fillRect(0, 0, 64, 7);
  cx.fillStyle = '#3c5a6b'; cx.fillRect(30, 0, 4, 64);
  const baseTex = new THREE.CanvasTexture(c);
  baseTex.wrapS = baseTex.wrapT = THREE.RepeatWrapping;

  const podGlass = new THREE.MeshPhongMaterial({color:0x7fa6b6, emissive:0x2e2310, shininess:90});
  box(34.6, 22, 34.6, podGlass, 0, 11, 0);
  for (let y = 0; y <= 22; y += 5.5) box(35, 0.6, 35, white, 0, y, 0);

  const S = 11.1, W = 10.8;
  const H = {'-1,-1':330,'0,-1':400,'1,-1':360,'-1,0':385,'0,0':440,'1,0':420,'-1,1':350,'0,1':410,'1,1':300};
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
    const h = H[i+','+j];
    const tex = baseTex.clone(); tex.needsUpdate = true; tex.repeat.set(3, h/5.7);
    const m = new THREE.MeshPhongMaterial({map:tex, specular:0x9fc0d0, shininess:90});
    box(W, h, W, m, i*S, h/2, j*S);
    box(W + 0.4, 1.2, W + 0.4, white, i*S, h + 0.6, j*S);
    for (const dx of [-1, 1]) for (const dz of [-1, 1])
      box(0.35, h, 0.35, white, i*S + dx*W/2, h/2, j*S + dz*W/2);
  }
  const top = 441.2;
  for (const dx of [-1, 1]) for (const dz of [-1, 1]) box(0.8, 17, 0.8, white, dx*5, top + 8.5, dz*5);
  for (const y of [top + 5, top + 10.5, top + 16.5]) {
    box(10.8, 0.6, 0.6, white, 0, y, 5); box(10.8, 0.6, 0.6, white, 0, y, -5);
    box(0.6, 0.6, 10.8, white, 5, y, 0); box(0.6, 0.6, 10.8, white, -5, y, 0);
  }
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.6, 3.2, 8), white);
  mast.position.set(0, 458 + 1.6, 0); g.add(mast);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 8), new THREE.MeshBasicMaterial({color:0xff3b30}));
  beacon.position.set(0, 461.2, 0); g.add(beacon);
  return g;
}

// --- 4 apartment towers around the APTS landmark ---
// Each tower is its own group so pick-tagging can hit each block individually.
function apts4(pos) {
  const FL = 40, F = 3.2, BASE = 6, W = 26, D = 16, Y0 = pos.y;
  const mat = (c, e = {}) => new THREE.MeshLambertMaterial({color:c, ...e});
  const white = mat(0xf2f0eb), paving = mat(0xc9c4ba), roofGreen = mat(0x5d8a4c), mech = mat(0x9a9890);
  const podium = new THREE.MeshPhongMaterial({color:0x8fb3c0, emissive:0x3a2a10, shininess:80});
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const cx = c.getContext('2d');
  cx.fillStyle = '#e6dfd2'; cx.fillRect(0, 0, 64, 64);
  cx.fillStyle = '#6b8796'; cx.fillRect(8, 14, 48, 40);
  cx.fillStyle = '#d8d0c0'; cx.fillRect(31, 14, 2, 40);
  const baseTex = new THREE.CanvasTexture(c);
  baseTex.wrapS = baseTex.wrapT = THREE.RepeatWrapping;
  const unit = new THREE.BoxGeometry(1, 1, 1);
  const blocks = [[-27.5,-27.5,0,0x7c9a8e],[-75,-27.5,1,0xc29a6c],[-27.5,-75,1,0x8796b4],[-75,-75,0,0xb4877a]];
  const groups = [];
  for (const [x, z, rot, accent] of blocks) {
    const sx = Math.abs(x) > 50 ? 39.6 : 34.6, sz = Math.abs(z) > 50 ? 39.6 : 34.6;
    const p = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.06, sz), paving);
    p.position.set(x, Y0 + 0.03, z); p.receiveShadow = true; groups.push(p);
    const g = new THREE.Group();
    g.position.set(x, Y0, z); g.rotation.y = rot ? Math.PI/2 : 0;
    const add = (geo, m, px, py, pz) => { const b = new THREE.Mesh(geo, m); b.position.set(px, py, pz); b.castShadow = b.receiveShadow = true; g.add(b); return b; };
    add(new THREE.BoxGeometry(W + 6, BASE, D + 8), podium, 0, BASE/2, 0);
    add(new THREE.BoxGeometry(W + 6.4, 0.5, D + 8.4), white, 0, BASE, 0);
    const tex = baseTex.clone(); tex.needsUpdate = true; tex.repeat.set(7, FL);
    add(new THREE.BoxGeometry(W, FL*F, D), new THREE.MeshLambertMaterial({map:tex}), 0, BASE + FL*F/2, 0);
    const bal = new THREE.InstancedMesh(unit, white, FL);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(W + 1.4, 0.25, D + 1.4), v = new THREE.Vector3();
    for (let i = 0; i < FL; i++) { v.set(0, BASE + (i+1)*F - 0.1, 0); m4.compose(v, q, s); bal.setMatrixAt(i, m4); }
    bal.castShadow = bal.receiveShadow = true; g.add(bal);
    const am = mat(accent);
    for (const e of [-1, 1]) add(new THREE.BoxGeometry(0.6, FL*F + 1, D + 1.6), am, e*(W/2 + 0.4), BASE + FL*F/2 + 0.5, 0);
    const top = BASE + FL*F;
    add(new THREE.BoxGeometry(W + 0.8, 1, D + 0.8), white, 0, top + 0.5, 0);
    add(new THREE.BoxGeometry(8, 4, 6), mech, -6, top + 2, 0);
    add(new THREE.BoxGeometry(12, 0.4, D - 3), roofGreen, 5, top + 1.2, 0);
    groups.push(g);
  }
  // Wrap all four blocks + their paving in a parent group so this maker returns one object.
  const parent = new THREE.Group();
  for (const o of groups) parent.add(o);
  return parent;
}

// --- Original luxury sedan parked at a forecourt (SEDAN landmark) ---
function sedan(pos) {
  const g = new THREE.Group();
  const fc = new THREE.Mesh(new THREE.BoxGeometry(7, 0.1, 8), new THREE.MeshLambertMaterial({color:0xbdb5a6}));
  fc.position.set(pos.x, pos.y + 0.08, pos.z); fc.receiveShadow = true; g.add(fc);
  const car = new THREE.Group();
  car.position.set(pos.x, pos.y + 0.13, pos.z);
  car.rotation.y = Math.PI/2 + 0.15;
  const paint = new THREE.MeshPhongMaterial({color:0x1b2a44, specular:0x8899bb, shininess:140});
  const glassM = new THREE.MeshPhongMaterial({color:0x10161c, specular:0x99aabb, shininess:160});
  const chrome = new THREE.MeshPhongMaterial({color:0xd9dde2, specular:0xffffff, shininess:200});
  const tyre = new THREE.MeshLambertMaterial({color:0x1a1a1a});
  const add = (geo, m, x, y, z) => { const b = new THREE.Mesh(geo, m); b.position.set(x, y, z); b.castShadow = true; b.receiveShadow = true; car.add(b); return b; };
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  add(B(5.7, 0.7, 2.0), paint, 0, 0.75, 0);
  add(B(5.5, 0.15, 1.96), paint, 0, 1.15, 0);
  add(B(2.9, 0.58, 1.78), glassM, -0.45, 1.5, 0);
  add(B(2.7, 0.08, 1.74), paint, -0.5, 1.82, 0);
  for (const s of [-1, 1]) add(B(5.2, 0.04, 0.02), chrome, 0, 1.12, s*1.0);
  add(B(0.06, 0.18, 1.3), chrome, 2.86, 0.7, 0);
  const lamp = new THREE.MeshBasicMaterial({color:0xfdf6e3});
  for (const s of [-1, 1]) add(B(0.05, 0.06, 0.5), lamp, 2.87, 0.95, s*0.68);
  add(B(0.05, 0.06, 1.7), new THREE.MeshBasicMaterial({color:0xc0242b}), -2.87, 1.0, 0);
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 20); wheelGeo.rotateX(Math.PI/2);
  const hubGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.32, 16); hubGeo.rotateX(Math.PI/2);
  for (const x of [1.85, -1.75]) for (const z of [-0.88, 0.88]) { add(wheelGeo, tyre, x, 0.42, z); add(hubGeo, chrome, x, 0.42, z); }
  g.add(car);
  return g;
}

// --- Original luxury grand tourer at the tower plaza (GT landmark) ---
function gt(pos) {
  const g = new THREE.Group();
  const car = new THREE.Group();
  car.position.copy(pos);
  car.rotation.y = -0.2;
  const pearl = new THREE.MeshPhongMaterial({color:0xf3efe6, specular:0xffffff, shininess:160});
  const glassM = new THREE.MeshPhongMaterial({color:0x0e1418, specular:0xaabbcc, shininess:180});
  const copper = new THREE.MeshPhongMaterial({color:0xb87333, specular:0xffd2a8, shininess:150});
  const dark = new THREE.MeshLambertMaterial({color:0x1c1c1c});
  const prof = [[2.5,0.35],[2.5,0.62],[1.2,0.8],[0.4,1.22],[-0.9,1.26],[-2.15,0.95],[-2.5,0.82],[-2.5,0.35]];
  const shape = new THREE.Shape(); prof.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y));
  const body = new THREE.ExtrudeGeometry(shape, {depth:1.84, bevelEnabled:true, bevelSize:0.09, bevelThickness:0.09, bevelSegments:4});
  body.translate(0, 0, -0.92);
  const bm = new THREE.Mesh(body, pearl); bm.castShadow = bm.receiveShadow = true; car.add(bm);
  const win = new THREE.Shape([[1.12,0.84],[0.42,1.18],[-0.85,1.21],[-1.95,0.95],[-1.95,0.84]].map(([x, y]) => new THREE.Vector2(x, y)));
  const wg = new THREE.ExtrudeGeometry(win, {depth:2.06, bevelEnabled:false}); wg.translate(0, 0, -1.03);
  car.add(new THREE.Mesh(wg, glassM));
  const add = (geo, m, x, y, z) => { const b = new THREE.Mesh(geo, m); b.position.set(x, y, z); b.castShadow = true; car.add(b); return b; };
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  for (const s of [-1, 1]) { add(B(4.6, 0.03, 0.02), copper, 0, 0.78, s*1.025); add(B(3.0, 0.12, 0.04), dark, 0, 0.32, s*1.0); }
  for (const s of [-1, 1]) add(B(0.06, 0.05, 0.55), new THREE.MeshBasicMaterial({color:0xfdf6e3}), 2.6, 0.6, s*0.6);
  add(B(0.05, 0.05, 1.8), new THREE.MeshBasicMaterial({color:0xc0242b}), -2.6, 0.78, 0);
  const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 24); wheelGeo.rotateX(Math.PI/2);
  const rimGeo = new THREE.CylinderGeometry(0.27, 0.27, 0.32, 20); rimGeo.rotateX(Math.PI/2);
  const capGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.34, 12); capGeo.rotateX(Math.PI/2);
  const rimM = new THREE.MeshPhongMaterial({color:0x3a3a3e, specular:0x888888, shininess:100});
  for (const x of [1.6, -1.55]) for (const z of [-0.98, 0.98]) { add(wheelGeo, dark, x, 0.4, z); add(rimGeo, rimM, x, 0.4, z); add(capGeo, copper, x, 0.4, z); }
  g.add(car);
  return g;
}

// --- Private school (SCHOOL landmark) ---
function school(pos) {
  const s = new THREE.Group(); s.position.copy(pos);
  const mat = (c, e = {}) => new THREE.MeshLambertMaterial({color:c, ...e});
  const add = (geo, m, x, y, z) => { const b = new THREE.Mesh(geo, m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; s.add(b); return b; };
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const cream = mat(0xf1e9d8), ochre = mat(0xe0a23a), paving = mat(0xd6d0c4), white = mat(0xf7f7f4), grey = mat(0x6d6a66);
  const glassM = new THREE.MeshPhongMaterial({color:0x6f97a8, emissive:0x2a2010, shininess:100});
  const H = 10.8, FH = 3.6;
  add(B(39.6, 0.06, 39.6), paving, 0, 0.03, 0);
  add(B(39, H, 10), cream, 0, H/2, -14.5);
  add(B(10, H, 29), cream, -14.5, H/2, 5);
  for (let i = 0; i < 3; i++) {
    const y = 1.9 + i*FH;
    add(B(36, 1.8, 0.12), glassM, 1, y, -9.44);
    add(B(36, 1.8, 0.12), glassM, 0, y, -19.56);
    add(B(0.12, 1.8, 26), glassM, -9.44, y, 6);
    add(B(0.12, 1.8, 26), glassM, -19.56, y, 5);
  }
  for (let i = 1; i <= 3; i++) {
    const y = i*FH, m = i === 3 ? white : ochre;
    add(B(39.4, 0.35, 10.4), m, 0, y, -14.5);
    add(B(10.4, 0.35, 29.4), m, -14.5, y, 5);
  }
  const panel = new THREE.InstancedMesh(B(1.8, 0.06, 1.1), new THREE.MeshPhongMaterial({color:0x1d2c4a, specular:0x6688bb, shininess:120}), 51);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.3), one = new THREE.Vector3(1, 1, 1), v = new THREE.Vector3();
  let n = 0;
  for (let x = -17; x <= 18; x += 2.2) for (const z of [-17.5, -14.5, -11.5]) { if (n >= 51) break; v.set(x, H + 0.6, z); m4.compose(v, q, one); panel.setMatrixAt(n++, m4); }
  panel.count = n; panel.castShadow = true; s.add(panel);
  add(B(6.5, 0.3, 3.5), white, -6.5, 3.4, -7.8);
  for (const x of [-3.6]) for (const z of [-6.3]) add(B(0.3, 3.3, 0.3), grey, x, 1.65, z);
  add(new THREE.CylinderGeometry(0.08, 0.1, 10, 8), grey, -5, 5, -4);
  add(B(24, 0.06, 13), mat(0x3f7f6a), 4, 0.08, 4);
  const line = mat(0xffffff);
  add(B(24, 0.02, 0.12), line, 4, 0.12, -2.44); add(B(24, 0.02, 0.12), line, 4, 0.12, 10.44);
  add(B(0.12, 0.02, 13), line, -7.94, 0.12, 4); add(B(0.12, 0.02, 13), line, 15.94, 0.12, 4);
  add(B(0.12, 0.02, 13), line, 4, 0.12, 4);
  for (const e of [-1, 1]) { const x = 4 + e*11.2; add(B(0.15, 3.05, 0.15), grey, x + e*0.6, 1.5, 4); add(B(0.05, 1.05, 1.8), white, x, 3.3, 4); }
  const trunkM = mat(0x6b4a33), leafM = mat(0x4f8a45, {flatShading:true});
  for (const [x, z] of [[18,-6],[18,4],[18,14],[8,16.5],[-2,16.5]]) {
    add(new THREE.CylinderGeometry(0.2, 0.3, 2.6, 6), trunkM, x, 1.3, z);
    add(new THREE.IcosahedronGeometry(2.2, 0), leafM, x, 4, z);
  }
  return s;
}

// --- Hospital (HOSPITAL landmark) ---
function hospital(pos) {
  const h = new THREE.Group(); h.position.copy(pos);
  const mat = (c, e = {}) => new THREE.MeshLambertMaterial({color:c, ...e});
  const add = (geo, m, x, y, z) => { const b = new THREE.Mesh(geo, m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; h.add(b); return b; };
  const B = (w, ht, d) => new THREE.BoxGeometry(w, ht, d);
  const white = mat(0xf6f6f3), teal = mat(0x1f8a8a), paving = mat(0xd3d0ca), asphalt = mat(0x55595c), green = mat(0x5f8f4e), grey = mat(0x707070);
  const podGlass = new THREE.MeshPhongMaterial({color:0x7fb0bd, emissive:0x2a3a3a, shininess:100});
  add(B(39.6, 0.06, 39.6), paving, 0, 0.03, 0);
  add(B(16, 0.07, 7), asphalt, 8, 0.07, 17.5);
  add(B(36, 9, 32), podGlass, 0, 4.5, -2);
  for (const y of [0.2, 4.5, 9]) add(B(36.4, 0.5, 32.4), white, 0, y, -2);
  add(B(14, 0.3, 14), green, -8, 9.4, 5);
  const FL = 10, FH = 3.6, top = 9 + FL*FH;
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const cx = c.getContext('2d');
  cx.fillStyle = '#f4f4f1'; cx.fillRect(0, 0, 64, 64);
  cx.fillStyle = '#5f8f9c'; cx.fillRect(6, 18, 52, 30);
  cx.fillStyle = '#1f8a8a'; cx.fillRect(0, 58, 64, 4);
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(10, FL);
  add(B(30, FL*FH, 12), new THREE.MeshLambertMaterial({map:tex}), 0, 9 + FL*FH/2, -12);
  add(B(30.6, 1, 12.6), white, 0, top + 0.5, -12);
  add(B(4.2, 4.2, 0.2), teal, 11, top - 4, -5.85);
  for (const x of [-1.1, 1.1]) add(B(0.6, 3, 0.1), white, 11 + x, top - 4, -5.7);
  add(B(1.8, 0.6, 0.1), white, 11, top - 4, -5.7);
  add(new THREE.CylinderGeometry(5.6, 5.6, 0.4, 40), mat(0x3d4043), 0, top + 1.2, -12);
  const ring = new THREE.Mesh(new THREE.RingGeometry(4.6, 4.9, 40), new THREE.MeshBasicMaterial({color:0xf2c230}));
  ring.rotation.x = -Math.PI/2; ring.position.set(0, top + 1.42, -12); h.add(ring);
  for (const x of [-1, 1]) add(B(0.5, 0.05, 3), white, x, top + 1.43, -12);
  add(B(2, 0.05, 0.5), white, 0, top + 1.43, -12);
  add(B(14, 0.4, 6), white, 8, 4.2, 17);
  add(B(14.1, 0.6, 0.15), teal, 8, 4.2, 20.05);
  for (const x of [1.5, 14.5]) add(B(0.35, 4, 0.35), grey, x, 2, 19.6);
  const lightM = new THREE.MeshBasicMaterial({color:0x58c8ff});
  for (const x of [4.5, 10.5]) {
    add(B(2.1, 2.3, 5.4), white, x, 1.55, 17.2);
    add(B(2.12, 0.3, 5.42), teal, x, 1.4, 17.2);
    add(B(2.0, 0.6, 1.2), mat(0x1d2428), x, 2.0, 19.4);
    add(B(1.2, 0.15, 0.3), lightM, x, 2.8, 19.5);
    for (const dx of [-0.95, 0.95]) for (const dz of [-1.6, 1.7]) add(new THREE.CylinderGeometry(0.38, 0.38, 0.25, 14).rotateZ(Math.PI/2), mat(0x1a1a1a), x + dx, 0.38, 17.2 + dz);
  }
  const trunkM = mat(0x6b4a33), leafM = mat(0x4f8a45, {flatShading:true});
  for (const [x, z] of [[-16,17.5],[-10,17.5],[-4,17.5],[17.5,-17],[17.5,-9]]) {
    add(new THREE.CylinderGeometry(0.2, 0.3, 2.6, 6), trunkM, x, 1.3, z);
    add(new THREE.IcosahedronGeometry(2, 0), leafM, x, 3.9, z);
  }
  return h;
}

// --- Restaurant + café block (FOOD landmark) ---
// Picker disambiguates by z: z < FOOD.z → restaurant, else cafe.
function food(pos) {
  const f = new THREE.Group(); f.position.copy(pos);
  const mat = (c, e = {}) => new THREE.MeshLambertMaterial({color:c, ...e});
  const add = (geo, m, x, y, z) => { const b = new THREE.Mesh(geo, m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; f.add(b); return b; };
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const sign = (text, w, h, bg, fg, font) => {
    const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512*h/w);
    const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = fg; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(text, c.width/2, c.height/2 + 4);
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c)}));
  };
  const wood = mat(0x9a6b47), charcoal = mat(0x2e2a27), concrete = mat(0xe4ded3), sage = mat(0x6f8f72), grey = mat(0x5a5a5a);
  const warmGlass = new THREE.MeshPhongMaterial({color:0xa8c4cc, emissive:0x8a5a20, shininess:120});
  add(B(34.6, 0.06, 39.6), mat(0xd8d1c4), 0, 0.03, 0);
  add(B(16, 5.5, 11), charcoal, -6, 2.75, -12);
  add(B(16.2, 1, 11.2), wood, -6, 5.2, -12);
  add(B(0.1, 3.6, 9), warmGlass, 2.05, 2, -12);
  const rs = sign('Ember & Salt', 6, 1.1, '#2e2a27', '#f3c27a', 'italic 600 64px Georgia, serif');
  rs.rotation.y = Math.PI/2; rs.position.set(2.12, 4.35, -12); f.add(rs);
  add(B(13, 0.15, 12), wood, 9.5, 0.08, -12);
  for (const x of [6, 9.5, 13]) for (const z of [-15.5, -8.5]) {
    add(B(1.6, 0.08, 0.9), wood, x, 0.85, z);
    add(new THREE.CylinderGeometry(0.06, 0.2, 0.7, 8), grey, x, 0.5, z);
  }
  const poles = [[3.4,-17.6],[15.6,-17.6],[15.6,-6.4],[3.4,-6.4]];
  for (const [x, z] of poles) add(new THREE.CylinderGeometry(0.06, 0.06, 4, 6), grey, x, 2, z);
  const bulbs = [];
  for (let i = 0; i < 4; i++) {
    const [x1, z1] = poles[i], [x2, z2] = poles[(i+1) % 4];
    for (let t = 0; t <= 1; t += 0.08) bulbs.push([x1 + (x2 - x1)*t, 3.8 - Math.sin(Math.PI*t)*0.5, z1 + (z2 - z1)*t]);
  }
  const bulbM = new THREE.InstancedMesh(new THREE.SphereGeometry(0.08, 6, 4), new THREE.MeshBasicMaterial({color:0xffd27a}), bulbs.length);
  const m4 = new THREE.Matrix4();
  bulbs.forEach(([x, y, z], i) => { m4.makeTranslation(x, y, z); bulbM.setMatrixAt(i, m4); });
  f.add(bulbM);
  add(B(10, 4.2, 8), concrete, -10, 2.1, 12);
  add(B(10.2, 0.4, 8.2), wood, -10, 4.2, 12);
  add(B(0.1, 2.8, 6), warmGlass, -4.95, 1.6, 12);
  const aw = add(B(2, 0.1, 7.5), sage, -4, 3.3, 12); aw.rotation.z = -0.25;
  const cs = sign('Slow Drip coffee', 5.5, 1, '#e4ded3', '#3d5a40', '600 56px "Space Grotesk", system-ui, sans-serif');
  cs.position.set(-10, 3.2, 16.06); f.add(cs);
  for (const x of [-1, 2.5, 6]) for (const z of [9, 14]) {
    add(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 16), concrete, x, 0.75, z);
    add(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 6), grey, x, 1.2, z);
    add(new THREE.ConeGeometry(1.3, 0.5, 8), sage, x, 2.5, z);
  }
  const trunkM = mat(0x6b4a33), leafM = mat(0x4f8a45, {flatShading:true});
  for (const [x, z] of [[14,4],[14,17],[-15,1]]) {
    add(new THREE.CylinderGeometry(0.2, 0.3, 2.6, 6), trunkM, x, 1.3, z);
    add(new THREE.IcosahedronGeometry(2, 0), leafM, x, 3.9, z);
  }
  return f;
}

// --- Row of 8 townhouses (TOWNHOUSE landmark) ---
function townhouse(pos) {
  const k = kit(), {add, B, mat} = k;
  const bricks = [0xb5654a,0xc98b6b,0x8f5a48,0xd9b99b,0xa77462,0xe3d2bd,0x9c6b56,0xc7a083];
  const glassM = new THREE.MeshPhongMaterial({color:0x7fa6b6, emissive:0x3a2a10, shininess:90}), white = mat(0xf4f1ea), dark = mat(0x2f2b28);
  add(B(39.6, 0.06, 39.6), mat(0x6fa24f), 0, 0.03, 0);
  let n = 0;
  for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) {
    const x = -12 + i*8, z = sd*11, fz = z + sd*6.03;
    add(B(7.8, 9.6, 12), mat(bricks[n++]), x, 4.8, z);
    add(B(8, 0.6, 12.2), white, x, 9.9, z);
    add(B(2.6, 1.8, 0.1), glassM, x + 1.6, 1.7, fz);
    for (const y of [4.9, 8]) add(B(5, 1.7, 0.1), glassM, x, y, fz);
    add(B(1.2, 2.3, 0.12), dark, x - 2.2, 1.15, fz);
    add(B(1.8, 0.25, 1.2), white, x - 2.2, 0.12, fz + sd*0.6);
  }
  k.trees([[-14, 0], [0, 0], [14, 0]]);
  k.g.position.copy(pos);
  return k.g;
}

// --- 4 detached family houses with gabled roofs (FAMILY landmark) ---
function family(pos) {
  const k = kit(), {add, B, mat} = k;
  const walls = [0xf1e9d8,0xdfe7e2,0xe8d9c9,0xd9e1ea], roofs = [0x5a4a42,0x3f4a52,0x8a4a3a,0x4f5b4a];
  const glassM = new THREE.MeshPhongMaterial({color:0x7fa6b6, emissive:0x3a2a10, shininess:90}), hedge = mat(0x3f6e3a), white = mat(0xffffff);
  add(B(34.6, 0.06, 39.6), mat(0x6fa24f), 0, 0.03, 0);
  let n = 0;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx*8.5, z = sz*9, fz = z + sz*4.53;
    add(B(10, 6, 9), mat(walls[n]), x, 3, z);
    const roof = gable(10.8, 9.8, 3.4, mat(roofs[n++])); roof.position.set(x, 6, z); k.g.add(roof);
    for (const wx of [-2.6, 2.6]) for (const y of [1.8, 4.5]) add(B(1.7, 1.3, 0.1), glassM, x + wx, y, fz);
    add(B(1.1, 2.2, 0.12), white, x, 1.1, fz);
    add(B(16.6, 1.1, 0.5), hedge, x, 0.55, sz*19.3);
    add(B(2.6, 0.05, 6), mat(0xbdb5a6), x + sx*3.5, 0.07, sz*16.5);
  }
  k.trees([[0, -14], [0, 14]]);
  k.g.position.copy(pos);
  return k.g;
}

// --- Garden estate (ESTATE landmark) ---
function estate(pos) {
  const k = kit(), {add, B, mat} = k;
  const glassM = new THREE.MeshPhongMaterial({color:0x8fb8c4, emissive:0x4a3410, transparent:true, opacity:0.6, shininess:120}), white = mat(0xf4f2ee), stone = mat(0xd8cfc0), hedge = mat(0x3a6634);
  add(B(34.6, 0.06, 39.6), mat(0x6fa24f), 0, 0.03, 0);
  for (const sz of [-1, 1]) add(B(34.6, 1.8, 0.5), hedge, 0, 0.9, sz*19.6);
  add(B(0.5, 1.8, 39.6), hedge, -17.1, 0.9, 0);
  add(B(22, 4, 12), stone, -4, 2, -11);
  add(B(20, 3.2, 0.12), glassM, -4, 1.9, -4.94);
  add(B(17, 3.6, 10), white, -7, 5.8, -12);
  add(B(15, 2.4, 0.12), glassM, -7, 5.8, -6.94);
  add(B(24, 0.4, 13), white, -5, 7.8, -11.5);
  add(B(20, 0.2, 8), mat(0xe9e2d3), -4, 0.12, 2);
  const pool = add(B(16, 0.12, 4.5), waterM(), -4, 0.26, 2);
  add(B(6, 3, 5), white, -12.5, 1.5, 10); add(B(6.4, 0.3, 5.4), mat(0x9a6b47), -12.5, 3.15, 10);
  add(B(11, 0.06, 23.8), mat(0x3f7f6a), 11.3, 0.08, 6);
  for (const z of [-5.85, 17.85]) add(B(11, 0.02, 0.1), white, 11.3, 0.12, z);
  for (const x of [5.85, 16.75]) add(B(0.1, 0.02, 23.8), white, x, 0.12, 6);
  add(B(11, 0.9, 0.05), mat(0x222222), 11.3, 0.45, 6);
  for (let x = -14; x <= 2; x += 4) cypress(k, x, 17.5, 6);
  ANIMS.push(t => { pool.material.emissive.setHex(0x0b3a44).multiplyScalar(1 + 0.25*Math.sin(t*3)); });
  k.g.position.copy(pos);
  return k.g;
}

// --- Classical mansion with portico, fountain, hedges (MANSION landmark) ---
function mansion(pos) {
  const k = kit(), {add, B, mat} = k;
  const cream = mat(0xefe6d2), slate = mat(0x4a4f57), glassM = new THREE.MeshPhongMaterial({color:0x6f8f9c, emissive:0x3a2a10, shininess:100}), hedge = mat(0x355f32), stone = mat(0xd9d2c3);
  add(B(39.6, 0.06, 39.6), mat(0x6fa24f), 0, 0.03, 0);
  add(B(26, 0.07, 18), mat(0xd8cfb8), 0, 0.07, 9);
  add(B(18, 11, 12), cream, 0, 5.5, -8);
  const r1 = hip(18.6, 12.6, 4.5, slate); r1.position.set(0, 11 + 2.25, -8); k.g.add(r1);
  for (const sx of [-1, 1]) {
    add(B(10, 8, 9), cream, sx*14.5, 4, -6.5);
    const r2 = hip(10.6, 9.6, 3.2, slate); r2.position.set(sx*14.5, 8 + 1.6, -6.5); k.g.add(r2);
    for (const wx of [-2.5, 2.5]) for (const y of [2.4, 5.8]) add(B(1.4, 2, 0.1), glassM, sx*14.5 + wx, y, -1.97);
  }
  for (const wx of [-7, -4.6, 4.6, 7]) for (const y of [2.6, 6.6]) add(B(1.4, 2.4, 0.1), glassM, wx, y, -1.97);
  add(B(2.4, 3.6, 0.1), mat(0x3a2a20), 0, 1.8, -1.96);
  for (let i = 0; i < 6; i++) add(new THREE.CylinderGeometry(0.42, 0.48, 8, 14), stone, -5 + i*2, 4, 0.4);
  add(B(12.4, 0.9, 2.8), cream, 0, 8.45, -0.5);
  const ped = gable(12.4, 2.6, 2.4, cream); ped.position.set(0, 8.9, -0.5); k.g.add(ped);
  add(new THREE.CylinderGeometry(3.2, 3.4, 0.7, 28), stone, 0, 0.35, 10);
  add(new THREE.CylinderGeometry(2.95, 2.95, 0.1, 28), waterM(), 0, 0.68, 10);
  add(new THREE.CylinderGeometry(0.5, 0.7, 1.4, 12), stone, 0, 1.2, 10);
  const jetM = new THREE.MeshPhongMaterial({color:0xcfefff, transparent:true, opacity:0.7, emissive:0x2a4a55});
  const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.25, 2.4, 10), jetM); jet.position.set(0, 3.1, 10); k.g.add(jet);
  const spray = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1, 16, 1, true), jetM); spray.rotation.x = Math.PI; spray.position.set(0, 4.1, 10); k.g.add(spray);
  ANIMS.push(t => { const s = 1 + 0.12*Math.sin(t*9); jet.scale.y = s; spray.position.y = 2 + 2.4*s; spray.scale.set(1 + 0.1*Math.sin(t*7), 1, 1 + 0.1*Math.cos(t*7)); });
  for (const sx of [-1, 1]) { add(B(6, 1, 6), hedge, sx*9, 0.5, 10); add(B(6, 1, 1), hedge, sx*9, 0.5, 16); cypress(k, sx*4.5, 18.5, 7); cypress(k, sx*17.5, 18.5, 7); }
  k.g.position.copy(pos);
  return k.g;
}

// --- Clifftop trophy palace (PAD landmark) ---
function trophy(pos) {
  const k = kit(), {add, B, mat} = k;
  const stoneW = mat(0xf1ece2), stone = mat(0xe2d9c8), glassM = new THREE.MeshPhongMaterial({color:0x9fc4cf, emissive:0x7a5418, transparent:true, opacity:0.55, shininess:140}), dark = mat(0x2a2d31);
  add(new THREE.CylinderGeometry(69, 69, 0.2, 64), mat(0x7aa85a), 0, 0.1, 0);
  add(B(46, 9, 22), stoneW, 0, 4.5, -10);
  add(B(42, 6.4, 0.15), glassM, 0, 4, 1.08);
  add(B(52, 0.9, 28), stoneW, 0, 9.45, -9);
  add(B(32, 6, 16), stoneW, 0, 12.9, -12);
  add(B(28, 4.2, 0.15), glassM, 0, 12.8, -3.95);
  add(B(38, 0.9, 22), stoneW, 0, 16.35, -11);
  for (let i = 0; i < 12; i++) add(new THREE.CylinderGeometry(0.35, 0.35, 8.6, 12), stone, -22 + i*4, 4.3, 4.2);
  for (const sx of [-1, 1]) { add(B(14, 6, 16), stoneW, sx*31, 3, -14); add(B(16, 0.6, 18), stoneW, sx*31, 6.3, -14); add(B(12, 4, 0.15), glassM, sx*31, 3, -5.92); }
  add(B(60, 0.5, 22), stone, 0, 0.25, 18);
  const pool = add(B(44, 0.2, 9), waterM(), 0, 0.6, 22);
  for (const x of [-16, -12, 12, 16]) add(B(1.2, 0.5, 2.4), mat(0xffffff), x, 0.75, 13.5);
  add(new THREE.CylinderGeometry(9, 9, 0.3, 40), dark, -46, 0.25, -24);
  const ring = new THREE.Mesh(new THREE.RingGeometry(7.4, 7.9, 40), new THREE.MeshBasicMaterial({color:0xf2c230})); ring.rotation.x = -Math.PI/2; ring.position.set(-46, 0.42, -24); k.g.add(ring);
  for (const x of [-1.2, 1.2]) add(B(0.7, 0.05, 4), mat(0xffffff), -46 + x, 0.43, -24); add(B(2.4, 0.05, 0.7), mat(0xffffff), -46, 0.43, -24);
  const heli = new THREE.Group(); heli.position.set(-46, 0.4, -24); heli.rotation.y = 0.6; k.g.add(heli);
  const hm = new THREE.MeshPhongMaterial({color:0x1d2b3a, specular:0x8899aa, shininess:120});
  const body = new THREE.Mesh(new THREE.SphereGeometry(1.4, 20, 14), hm); body.scale.set(2, 1, 1); body.position.y = 1.7; heli.add(body);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(5, 0.4, 0.4), hm); tail.position.set(-4.5, 2, 0); heli.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.15), hm); fin.position.set(-6.8, 2.6, 0); heli.add(fin);
  for (const z of [-0.9, 0.9]) { const skid = new THREE.Mesh(new THREE.BoxGeometry(4, 0.12, 0.12), dark); skid.position.set(0, 0.25, z); heli.add(skid); }
  const rotor = new THREE.Group(); rotor.position.y = 3.3; heli.add(rotor);
  for (const a of [0, Math.PI/2]) { const bl = new THREE.Mesh(new THREE.BoxGeometry(11, 0.06, 0.35), dark); bl.rotation.y = a; rotor.add(bl); }
  ANIMS.push(t => { rotor.rotation.y = t*12; pool.material.emissive.setHex(0x0b3a44).multiplyScalar(1 + 0.3*Math.sin(t*2.5)); });
  for (const [x, z] of [[44, -32], [52, -8], [44, 16]]) { add(B(12, 4.5, 9), stoneW, x, 2.25, z); add(B(13, 0.4, 10), stoneW, x, 4.7, z); add(B(10, 3, 0.12), glassM, x - 0.5, 2, z + 4.56); }
  add(B(11, 0.08, 23.8), mat(0x3f7f6a), -44, 0.2, 14);
  for (let z = -64; z <= -26; z += 7) { cypress(k, -7, z, 9); cypress(k, 7, z, 9); }
  add(B(8, 0.08, 42), mat(0xd8cfb8), 0, 0.14, -46);
  k.g.position.copy(pos);
  return k.g;
}

import { officeTower, midrise, shophouseRow, park, market, scooters, metroStation, university, shoppingMall } from './urban.js';

export const MAKERS = {
  villa, towerPH, l81, apts4, sedan, gt, school, hospital, food,
  townhouse, family, estate, mansion, trophy,
  officeTower, midrise, shophouseRow, park, market, scooters,
  metroStation, university, shoppingMall,
};
