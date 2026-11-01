// Shop-model factories: one function per build type that fits a plot {sx, sz, m2}.
// These models are added to each plot group with .visible=false; shown as previews
// or during construction (scaled to current progress). Keep in sync with BUILD / SCAF.
import { kit } from './kit.js';
import { ANIMS } from '../scene.js';

const X_AXIS = new THREE.Vector3(1, 0, 0);

export function makeHouse(p) {
  const {g, mat, add, B, trees} = kit();
  const glassM = new THREE.MeshPhongMaterial({color:0x8fb8c4, emissive:0x4a3410, transparent:true, opacity:0.6, shininess:120}), white = mat(0xf4f2ee);
  add(B(p.sx - 1, 0.05, p.sz - 1), mat(0x6fa24f), 0, 0.05, 0);
  add(B(16, 3.4, 10), mat(0xcfc3ad), 0, 1.7, -3);
  add(B(14, 2.8, 0.12), glassM, 0, 1.6, 2.06);
  add(B(19, 3.2, 8), white, -1, 5, -3.5);
  add(B(17, 2.1, 0.12), glassM, -1, 5, 0.56);
  add(B(20, 0.35, 9.5), white, -1, 6.75, -3.4);
  add(B(18, 0.2, 7), mat(0xe9e2d3), 0, 0.12, 6);
  add(B(11, 0.12, 3.6), new THREE.MeshPhongMaterial({color:0x3fc1d9, emissive:0x0b3a44, shininess:150}), 0, 0.26, 6);
  trees([[-p.sx/2 + 3, -p.sz/2 + 3], [p.sx/2 - 3, -p.sz/2 + 3], [p.sx/2 - 3, p.sz/2 - 3], [-p.sx/2 + 3, p.sz/2 - 3]]);
  g.visible = false; return g;
}

export function makeTowerPH(p) {
  const {g, mat, add, B, trees} = kit(), FLN = 22, FHt = 3.3, base = 5, top = base + FLN*FHt;
  const white = mat(0xf2f0eb);
  add(B(p.sx - 1, 0.06, p.sz - 1), mat(0xc9c4ba), 0, 0.03, 0);
  add(B(18, base, 18), new THREE.MeshPhongMaterial({color:0x8fb8c4, emissive:0x3a2a10, transparent:true, opacity:0.6}), 0, base/2, 0);
  add(B(20, FLN*FHt, 20), new THREE.MeshPhongMaterial({color:0x4f7286, specular:0xbfd9e6, shininess:110}), 0, base + FLN*FHt/2, 0);
  for (let i = 0; i <= FLN; i++) add(B(20.6, 0.3, 20.6), white, 0, base + i*FHt, 0);
  for (const x of [-10, 10]) for (const z of [-10, 10]) add(B(0.7, FLN*FHt, 0.7), white, x, base + FLN*FHt/2, z);
  add(B(20.6, 0.3, 20.6), mat(0x9a6b47), 0, top + 0.15, 0);
  add(B(13, 6.4, 10), new THREE.MeshPhongMaterial({color:0x9fc4cf, emissive:0x7a5418, transparent:true, opacity:0.5, shininess:140}), -2, top + 3.5, -3.5);
  add(B(16, 0.45, 13), white, -2, top + 6.95, -3);
  add(B(7, 0.3, 3), new THREE.MeshPhongMaterial({color:0x3fc1d9, emissive:0x0b3a44, shininess:150}), 4, top + 0.5, 6);
  trees([[-p.sx/2 + 3, p.sz/2 - 3], [p.sx/2 - 3, p.sz/2 - 3]]);
  g.visible = false; return g;
}

export function makeComplex(p) {
  const {g, mat, add, B} = kit(), FL = 30, F = 3.2, H = FL*F, W = p.sx - 8, PD = p.sz - 6, zOff = PD/2 - 4.5;
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.fillStyle = '#ece5d8'; x.fillRect(0, 0, 64, 64);
  x.fillStyle = '#6b8796'; x.fillRect(8, 14, 48, 40);
  x.fillStyle = '#ddd4c4'; x.fillRect(31, 14, 2, 40);
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(Math.round(W/4), FL);
  const white = mat(0xf2f0eb), body = new THREE.MeshLambertMaterial({map:tex}), accent = mat(0x7f9a86);
  add(B(p.sx - 4, 6, PD), new THREE.MeshPhongMaterial({color:0x8fb3c0, emissive:0x3a2a10, shininess:80}), 0, 3, 0);
  add(B(p.sx - 6, 0.4, 2*zOff - 9), mat(0x5d8a4c), 0, 6.2, 0);
  for (const s of [-1, 1]) {
    add(B(W, H, 8), body, 0, 6 + H/2, s*zOff);
    for (let i = 5; i <= FL; i += 5) add(B(W + 0.6, 0.45, 8.6), white, 0, 6 + i*F, s*zOff);
    for (const e of [-1, 1]) add(B(0.6, H + 1, 8.6), accent, e*(W/2 + 0.3), 6 + H/2 + 0.5, s*zOff);
  }
  g.visible = false; return g;
}

export function makeBoutique(p) {
  const g = new THREE.Group(), w = p.sx - 12, d = p.sz - 16, F = 4, FHt = 3.3, H = F*FHt;
  const mat = c => new THREE.MeshLambertMaterial({color:c});
  const add = (geo, m, x, y, z) => { const b = new THREE.Mesh(geo, m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; g.add(b); return b; };
  const glassM = new THREE.MeshPhongMaterial({color:0x8fb8c4, emissive:0x3a2a10, shininess:100}), whiteM = mat(0xffffff), woodM = mat(0x9a6b47);
  add(new THREE.BoxGeometry(p.sx - 1, 0.05, p.sz - 1), mat(0x6fa24f), 0, 0.05, 0);
  add(new THREE.BoxGeometry(w, H, d), mat(0xefe9df), 0, H/2, 0);
  for (let i = 0; i < F; i++) {
    for (const s of [-1, 1]) add(new THREE.BoxGeometry(w - 2, 1.9, 0.12), glassM, 0, 1.7 + i*FHt, s*(d/2 + 0.06));
    if (i) add(new THREE.BoxGeometry(w + 1, 0.22, 1.5), whiteM, 0, i*FHt, d/2 + 0.75);
  }
  for (let x = -w/2 + 1.5; x <= w/2 - 1; x += 3) add(new THREE.BoxGeometry(0.25, H, 0.35), woodM, x, H/2, d/2 + 1.55);
  add(new THREE.BoxGeometry(w + 0.6, 0.5, d + 0.6), whiteM, 0, H + 0.25, 0);
  const leaf = new THREE.MeshLambertMaterial({color:0x4f8a45, flatShading:true}), trunk = mat(0x6b4a33);
  for (const [x, z] of [[-p.sx/2 + 3, p.sz/2 - 3], [p.sx/2 - 3, p.sz/2 - 3], [p.sx/2 - 3, -p.sz/2 + 3]]) {
    add(new THREE.CylinderGeometry(0.2, 0.3, 2.6, 6), trunk, x, 1.3, z);
    add(new THREE.IcosahedronGeometry(2, 0), leaf, x, 3.9, z);
  }
  g.visible = false; return g;
}

export function makeVilla(p) {
  const g = new THREE.Group(), mat = (c, e = {}) => new THREE.MeshLambertMaterial({color:c, ...e});
  const box = (w, ht, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, ht, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; g.add(b); return b; };
  const white = mat(0xf4f2ee), stone = mat(0xcfc3ad), wall = mat(0xd9d2c3), dark = mat(0x2f2b28), deck = mat(0xe9e2d3), wood = mat(0x8a5a3b);
  const glass = new THREE.MeshPhongMaterial({color:0x8fb8c4, emissive:0x4a3410, transparent:true, opacity:.6, shininess:120});
  const water = new THREE.MeshPhongMaterial({color:0x3fc1d9, emissive:0x0b3a44, shininess:150});
  const hx = p.sx/2 - 0.35, hz = p.sz/2 - 0.35;
  box(p.sx - 0.4, 0.06, p.sz - 0.4, mat(0x6fa24f), 0, 0.03, 0);
  box(9, 0.08, 6, mat(0xbdb5a6), -hx + 4.2, 0.06, -8);
  box(22, 0.2, 9, deck, 3, 0.1, 8.5); box(14, 0.12, 4.5, water, 3, 0.24, 8.5);
  box(p.sx - 0.4, 1.2, 0.3, wall, 0, 0.6, -hz); box(p.sx - 0.4, 1.2, 0.3, wall, 0, 0.6, hz); box(0.3, 1.2, p.sz - 0.4, wall, hx, 0.6, 0);
  box(0.3, 1.2, hz - 11, wall, -hx, 0.6, -(hz + 11)/2); box(0.3, 1.2, hz + 5, wall, -hx, 0.6, (hz - 5)/2);
  box(18, 3.5, 12, stone, 2, 1.75, -3); box(16, 2.9, 0.12, glass, 2, 1.6, 3.02); box(0.12, 2.9, 8, glass, -7.02, 1.6, -3);
  box(7, 3.5, 7, white, -12, 1.75, -8); box(0.1, 2.6, 5, dark, -15.52, 1.3, -8);
  box(23, 3.2, 9, white, -1, 5.1, -4); box(20, 2.2, 0.12, glass, -1, 5.1, 0.52); box(0.12, 2.2, 7, glass, -12.52, 5.1, -4);
  box(24, 0.35, 10.5, white, -1, 6.88, -3.8); box(6, 3.2, 0.15, wood, 7, 5.1, 0.6); box(10, 0.9, 0.2, white, 5, 7.5, 1.2);
  for (const x of [-5.5, -4, -2.5]) box(1, 0.4, 2, white, x, 0.4, 12);
  const trunkM = mat(0x6b4a33), leafM = mat(0x3f6e3a, {flatShading:true}), cypM = mat(0x2f5a33, {flatShading:true});
  for (const [x, z, t] of [[hx - 2.5, -hz + 2.5, 'r'], [hx - 2.5, -5, 'c'], [hx - 2.5, 5, 'c'], [hx - 2.5, hz - 2.5, 'r'], [0, -hz + 2.5, 'c'], [8, -hz + 2.5, 'c']]) {
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 2.5, 6), trunkM); tr.position.set(x, 1.25, z); tr.castShadow = true; g.add(tr);
    const cr = t === 'r' ? new THREE.Mesh(new THREE.IcosahedronGeometry(2.2, 0), leafM) : new THREE.Mesh(new THREE.ConeGeometry(1, 6, 7), cypM);
    cr.position.set(x, t === 'r' ? 3.8 : 4.5, z); cr.castShadow = true; g.add(cr);
  }
  g.visible = false; return g;
}

export function makeSchoolB(p) {
  const s = new THREE.Group();
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
  s.scale.set(p.sx/40, 1, p.sz/40); s.visible = false; return s;
}

export function makeHospitalB(p) {
  const h = new THREE.Group();
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
  h.scale.set(p.sx/40, 1, p.sz/40); h.visible = false; return h;
}

export function makeThemePark(p) {
  const g = new THREE.Group(), mat = (c, e = {}) => new THREE.MeshLambertMaterial({color:c, ...e});
  const add = (geo, m, x, y, z, parent = g) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o; };
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d), hx = p.sx/2, hz = p.sz/2;
  const steel = mat(0xe9edf2), red = mat(0xe4572e), yellow = mat(0xf5b700), path = mat(0xe8d9b5);
  add(B(p.sx - 0.4, 0.06, p.sz - 0.4), mat(0x8fc46a), 0, 0.03, 0);
  add(B(3, 0.08, p.sz - 2), path, 0, 0.07, 0); add(B(p.sx - 2, 0.08, 3), path, 0, 0.07, 0);
  for (const s of [-1, 1]) add(B(1, 6, 1), red, s*3.5, 3, hz - 1.2);
  add(B(8.5, 0.5, 1.1), yellow, 0, 6.2, hz - 1.2);
  const c = document.createElement('canvas'); c.width = 512; c.height = 112; const x = c.getContext('2d');
  x.fillStyle = '#2f5d50'; x.fillRect(0, 0, 512, 112); x.fillStyle = '#ffffff'; x.font = '700 64px "Space Grotesk", system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('Sunny Park', 256, 60);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 1.66), new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c), side:THREE.DoubleSide})); sign.position.set(0, 7.3, hz - 1.15); g.add(sign);
  const R = 10, fw = new THREE.Group(); fw.position.set(-hx + 5, 12.5, -hz + 13); g.add(fw);
  for (const s of [-1, 1]) for (const dz of [-1, 1]) { const leg = add(B(0.45, 13.5, 0.45), steel, s*1.5, -6.2, dz*2.6, fw); leg.rotation.x = -dz*0.2; }
  const wheel = new THREE.Group(); fw.add(wheel);
  for (const s of [-1, 1]) { const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.18, 8, 48), steel); rim.rotation.y = Math.PI/2; rim.position.x = s*0.9; wheel.add(rim); }
  for (let i = 0; i < 12; i++) { const sp = new THREE.Mesh(B(0.12, 2*R, 0.12), steel); sp.rotation.x = i/12*Math.PI; wheel.add(sp); }
  const cabCols = [0xe4572e, 0xf5b700, 0x3e8ed0, 0x2f8a5b, 0x9b5de5, 0xff7eb6], cabs = [];
  for (let i = 0; i < 12; i++) { const a = i/12*Math.PI*2, cab = new THREE.Group(); cab.position.set(0, Math.cos(a)*R, Math.sin(a)*R); wheel.add(cab);
    add(B(1.6, 1.3, 1.4), mat(cabCols[i % 6]), 0, -0.9, 0, cab); add(B(1.8, 0.15, 1.6), mat(0xffffff), 0, -0.2, 0, cab); cabs.push(cab);
  }
  const pts = [[2,3,-hz+4],[hx-5,7,-hz+4],[hx-3,15,-hz+11],[hx-4,5,0],[hx-6,10,hz-8],[5,3.5,hz-7],[3,11,3],[2,5,-8]].map(([a, b, c2]) => new THREE.Vector3(a, b, c2));
  const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
  add(new THREE.TubeGeometry(curve, 240, 0.28, 8, true), red, 0, 0, 0);
  add(new THREE.TubeGeometry(curve, 240, 0.08, 6, true), yellow, 0, -0.45, 0);
  for (let i = 0; i < 24; i++) { const q = curve.getPointAt(i/24); add(new THREE.CylinderGeometry(0.12, 0.16, q.y, 6), steel, q.x, q.y/2, q.z); }
  const train = []; for (let i = 0; i < 3; i++) train.push(add(B(1.6, 0.8, 1.1), mat([0x3e8ed0, 0xf5b700, 0x2f8a5b][i]), 0, 0, 0));
  const car = new THREE.Group(); car.position.set(-hx + 9, 0, hz - 8.5); g.add(car);
  add(new THREE.CylinderGeometry(4.2, 4.4, 0.6, 24), mat(0xf4f1ea), 0, 0.3, 0, car);
  add(new THREE.CylinderGeometry(0.3, 0.3, 4.4, 10), yellow, 0, 2.6, 0, car);
  for (let i = 0; i < 2; i++) { const cone = add(new THREE.ConeGeometry(4.8 - i*0.01, 2.4, 16, 1, false, i*Math.PI/16, Math.PI*2 - i*Math.PI/16), mat(i ? 0xffffff : 0xff7eb6), 0, 5.6 + i*0.01, 0, car); }
  for (let i = 0; i < 8; i++) { const a = i/8*Math.PI*2, hx2 = Math.cos(a)*3, hz2 = Math.sin(a)*3;
    add(new THREE.CylinderGeometry(0.05, 0.05, 3.8, 6), mat(0xd4af37), hx2, 2.5, hz2, car);
    const horse = add(B(1.1, 0.6, 0.35), mat([0xffffff, 0x8a5a3b, 0xf5b700, 0x3e8ed0][i % 4]), hx2, 1.8 + (i % 2)*0.4, hz2, car); horse.rotation.y = -a;
  }
  for (const [sx2, sz2, col] of [[hx - 4, hz - 3.5, 0xe4572e], [-2.5 - 4, -hz + 3.5, 0x3e8ed0]]) { add(B(3, 2.2, 2), mat(0xfff6e0), sx2, 1.1, sz2); add(B(3.4, 0.25, 2.6), mat(col), sx2, 2.4, sz2); }
  const leaf = mat(0x4f8a45, {flatShading:true}), trunk = mat(0x6b4a33);
  for (const [tx, tz] of [[-hx + 2.5, hz - 2.5], [hx - 2.5, -hz + 2.5], [-3, hz - 3], [3, -hz + 3]]) { add(new THREE.CylinderGeometry(0.2, 0.3, 2.4, 6), trunk, tx, 1.2, tz); add(new THREE.IcosahedronGeometry(1.8, 0), leaf, tx, 3.6, tz); }
  ANIMS.push(t => {
    if (!g.visible) return;
    wheel.rotation.x = t*0.35; for (const cb of cabs) cb.rotation.x = -wheel.rotation.x;
    car.rotation.y = t*0.8;
    for (let i = 0; i < 3; i++) { const u = ((t*0.035) - i*0.012 + 10) % 1, a2 = curve.getPointAt(u), b2 = curve.getPointAt((u + 0.004) % 1);
      train[i].position.set(a2.x, a2.y + 0.6, a2.z); train[i].quaternion.setFromUnitVectors(X_AXIS, b2.sub(a2).normalize());
    }
  });
  g.visible = false; return g;
}

export const BUILD_MAKERS = {
  school: makeSchoolB, hospital: makeHospitalB, park: makeThemePark,
  villa: makeVilla, house: makeHouse,
  boutique: makeBoutique, tower: makeTowerPH, complex: makeComplex,
};
