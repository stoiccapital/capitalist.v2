// Pedestrians walking loops around each built block. One of three figure builders is used
// (person3 — the most detailed). person/person2 are earlier iterations kept for reference.
import { scene } from './scene.js';
import { PLATEAU_H } from '../constants.js';

export const walkers = [];

// Blocks whose perimeter walkers loop. One pair of half-sizes per block.
const blocks = [
  [27.5, 27.5, 17.5, 17.5], [-27.5, 27.5, 17.5, 17.5],
  [27.5, -27.5, 17.5, 17.5], [-27.5, -27.5, 17.5, 17.5],
  [-75, -27.5, 20, 17.5], [-27.5, -75, 17.5, 20],
  [-75, -75, 20, 20], [75, 75, 20, 20],
  [75, -75, 20, 20], [27.5, 75, 17.5, 20],
];
const skins   = [0xf1d3bc,0xe3b896,0xc99872,0xa8754f,0x7a4f33,0xf5dccb];
const hairs   = [0x1b1410,0x3b2416,0x6b4226,0xb88a4a,0xe2c27a,0x2a2a2a,0x8a3b24];
const outfits = [0xc8344a,0xf2efe8,0x1f2a44,0xe8a33d,0x6fa58f,0xd77fa1,0x7e6bc4,0x2f7fb5,0xf4c7c3,0x111111];
const lam = c => new THREE.MeshLambertMaterial({color:c});
const pick = a => a[Math.floor(Math.random()*a.length)];

const G = (() => {
  const lathe = (pts, sz) => { const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 16); g.scale(1, 1, sz); return g; };
  const cyl = (a, b, h, dy) => { const g = new THREE.CylinderGeometry(a, b, h, 8); g.translate(0, dy, 0); return g; };
  const sph = (r, sx = 1, sy = 1, sz = 1, w = 10, h = 8) => { const g = new THREE.SphereGeometry(r, w, h); g.scale(sx, sy, sz); return g; };
  const box = (w, h, d, x = 0, y = 0, z = 0) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return g; };
  return {
    torso: lathe([[0,0.92],[0.145,0.93],[0.16,0.99],[0.148,1.07],[0.12,1.16],[0.132,1.26],[0.145,1.35],[0.14,1.42],[0.165,1.47],[0.09,1.52],[0,1.53]], 0.72),
    dress: [
      lathe([[0.125,1.17],[0.165,1.02],[0.2,0.85],[0.25,0.62],[0.28,0.44]], 0.82),
      lathe([[0.125,1.17],[0.165,1.02],[0.2,0.86],[0.24,0.64]], 0.82),
      lathe([[0.125,1.17],[0.165,1.0],[0.195,0.84]], 0.82),
    ],
    thigh: cyl(0.068,0.05,0.46,-0.23), shin: cyl(0.047,0.033,0.44,-0.22),
    shoe: box(0.075,0.06,0.2,0,0,0.04), heel: box(0.03,0.05,0.03,0,0.02,-0.05),
    upper: cyl(0.04,0.034,0.28,-0.14), fore: cyl(0.033,0.027,0.25,-0.125), hand: sph(0.034,0.8,1.25,0.6),
    neck: cyl(0.04,0.045,0.1,0), head: sph(0.1,0.88,1.08,0.95,16,14),
    eye: sph(0.012,1,1,1,6,4), lips: box(0.036,0.012,0.01), nose: sph(0.012,0.8,1,1.3,6,4),
    cap: new THREE.SphereGeometry(0.106,16,10,0,Math.PI*2,0,Math.PI*0.56),
    bob: new THREE.SphereGeometry(0.114,16,10,0,Math.PI*2,0,Math.PI*0.7),
    back: box(0.19,0.4,0.05), strand: box(0.03,0.28,0.05), bun: sph(0.052), tail: cyl(0.032,0.016,0.3,-0.15),
    glasses: box(0.16,0.034,0.02), necklace: new THREE.TorusGeometry(0.058,0.005,6,18), belt: new THREE.TorusGeometry(0.122,0.012,6,20),
    bag: box(0.07,0.2,0.26), strap: box(0.01,0.42,0.01),
  };
})();
const black = lam(0x111111), gold = new THREE.MeshPhongMaterial({color:0xd4af37, specular:0xffffff, shininess:120});
const lipCols = [0xb5485a,0xc2626a,0x9e3b4a,0xd28a84];

// --- v1: simple lambert figure ---
export function person() {
  const p = new THREE.Group();
  const skin = new THREE.MeshPhongMaterial({color:pick(skins), shininess:12});
  const hair = new THREE.MeshPhongMaterial({color:pick(hairs), shininess:40});
  const main = lam(pick(outfits)), top = lam(pick(outfits));
  const kind = Math.random();
  const torsoM = kind < 0.6 ? main : top, legM = kind >= 0.85 ? main : skin;
  const shoeM = lam(pick([0x1a1a1a,0xd9cbb6,0x8a5a3b,0xc8344a,0xf2efe8]));
  const mesh = (geo, m, x, y, z, parent = p) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; parent.add(o); return o; };
  mesh(G.torso, torsoM, 0, 0, 0);
  if (kind < 0.85) { const d = mesh(G.dress[kind < 0.6 ? Math.floor(Math.random()*3) : 1 + Math.floor(Math.random()*2)], main, 0, 0, 0); d.material = main.clone(); d.material.side = THREE.DoubleSide; }
  if (Math.random() < 0.3) { const b = mesh(G.belt, lam(pick([0x111111,0x8a5a3b,0xd9cbb6])), 0, 1.16, 0); b.rotation.x = Math.PI/2; b.scale.set(1, 0.75, 1); }
  const heels = Math.random() < 0.5;
  const legs = [], knees = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s*0.078, 0.93, 0); p.add(hip);
    mesh(G.thigh, legM, 0, 0, 0, hip);
    const knee = new THREE.Group(); knee.position.y = -0.46; hip.add(knee);
    mesh(G.shin, legM, 0, 0, 0, knee);
    mesh(G.shoe, shoeM, 0, -0.44, 0, knee);
    if (heels) mesh(G.heel, shoeM, 0, -0.5, 0, knee);
    legs.push(hip); knees.push(knee);
  }
  const sleeve = Math.random() < 0.5 ? torsoM : skin;
  const arms = [], elbows = [];
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s*0.195, 1.455, 0); sh.rotation.z = s*0.07; p.add(sh);
    mesh(G.upper, sleeve, 0, 0, 0, sh);
    const el = new THREE.Group(); el.position.y = -0.28; el.rotation.x = -0.25; sh.add(el);
    mesh(G.fore, skin, 0, 0, 0, el);
    mesh(G.hand, skin, 0, -0.27, 0, el);
    arms.push(sh); elbows.push(el);
  }
  mesh(G.neck, skin, 0, 1.56, 0);
  mesh(G.head, skin, 0, 1.69, 0);
  if (Math.random() < 0.2) mesh(G.glasses, black, 0, 1.705, 0.088);
  else for (const s of [-1, 1]) mesh(G.eye, black, s*0.033, 1.705, 0.082);
  mesh(G.nose, skin, 0, 1.675, 0.094);
  mesh(G.lips, lam(pick(lipCols)), 0, 1.638, 0.084);
  if (Math.random() < 0.35) { const n = mesh(G.necklace, gold, 0, 1.53, 0.01); n.rotation.x = Math.PI/2 - 0.35; }
  const style = Math.random();
  if (style < 0.75) mesh(G.cap, hair, 0, 1.7, -0.008);
  if (style < 0.35) { mesh(G.back, hair, 0, 1.56, -0.075); for (const s of [-1, 1]) mesh(G.strand, hair, s*0.088, 1.6, -0.01); }
  else if (style < 0.55) { const t = mesh(G.tail, hair, 0, 1.73, -0.11); t.rotation.x = 0.35; mesh(G.bun, hair, 0, 1.74, -0.1).scale.setScalar(0.6); }
  else if (style < 0.75) mesh(G.bun, hair, 0, 1.8, -0.075);
  else mesh(G.bob, hair, 0, 1.7, -0.01);
  if (Math.random() < 0.55) {
    const bm = lam(pick([0x8a5a3b,0x111111,0xd9cbb6,0xc8344a,0xf2efe8]));
    mesh(G.bag, bm, 0.215, 1.0, -0.02);
    mesh(G.strap, bm, 0.2, 1.3, -0.02);
  }
  return {p, legs, knees, arms, elbows};
}

// --- v2: physically-based figure ---
const std = (c, r = 0.85, m = 0) => new THREE.MeshStandardMaterial({color:c, roughness:r, metalness:m});
const hex = c => '#' + c.toString(16).padStart(6, '0');
const texCache = {};
function fabric(c) {
  const kind = Math.random();
  if (kind < 0.5) return std(c);
  const accent = pick([0xffffff,0x111111,0xf2c94c,0xd77fa1,0x2f7fb5,0xf4c7c3]);
  const k = kind < 0.72 ? 's' : kind < 0.88 ? 'd' : 'f', key = c + '-' + accent + '-' + k;
  if (!texCache[key]) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d');
    x.fillStyle = hex(c); x.fillRect(0, 0, 128, 128); x.fillStyle = hex(accent);
    if (k === 's') for (let i = 0; i < 128; i += 16) x.fillRect(0, i, 128, 5);
    else if (k === 'd') for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.beginPath(); x.arc(i*16 + 4 + (j % 2)*8, j*16 + 8, 3.2, 0, 7); x.fill(); }
    else for (let n = 0; n < 36; n++) { const px = Math.random()*128, py = Math.random()*128; for (let a = 0; a < 5; a++) { x.beginPath(); x.arc(px + Math.cos(a*1.26)*4, py + Math.sin(a*1.26)*4, 2.8, 0, 7); x.fill(); } }
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2); texCache[key] = t;
  }
  return new THREE.MeshStandardMaterial({map:texCache[key], roughness:0.85});
}
const H = (() => {
  const lathe = (pts, sz) => { const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 32); g.scale(1, 1, sz); return g; };
  const cyl = (a, b, h, dy, seg = 14) => { const g = new THREE.CylinderGeometry(a, b, h, seg); g.translate(0, dy, 0); return g; };
  const sph = (r, sx = 1, sy = 1, sz = 1, w = 16, h = 12) => { const g = new THREE.SphereGeometry(r, w, h); g.scale(sx, sy, sz); return g; };
  const box = (w, h, d, x = 0, y = 0, z = 0) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return g; };
  const torus = (r, t, a = 8, b = 24) => new THREE.TorusGeometry(r, t, a, b);
  return {
    torso: lathe([[0,0.92],[0.14,0.925],[0.158,0.97],[0.16,1.01],[0.148,1.07],[0.125,1.14],[0.12,1.17],[0.128,1.24],[0.142,1.31],[0.146,1.36],[0.138,1.41],[0.152,1.45],[0.168,1.475],[0.13,1.505],[0.07,1.525],[0,1.53]], 0.72),
    dress: [
      lathe([[0.122,1.17],[0.15,1.08],[0.168,1.0],[0.2,0.86],[0.24,0.66],[0.272,0.5],[0.285,0.44]], 0.82),
      lathe([[0.122,1.17],[0.15,1.08],[0.168,1.0],[0.2,0.86],[0.235,0.66],[0.242,0.63]], 0.82),
      lathe([[0.122,1.17],[0.15,1.08],[0.168,1.0],[0.19,0.86],[0.197,0.83]], 0.82),
    ],
    hem: [[0.285,0.44],[0.242,0.63],[0.197,0.83]].map(([r, y]) => { const g = torus(r, 0.008, 6, 40); g.rotateX(Math.PI/2); g.scale(1, 1, 0.82); g.translate(0, y, 0); return g; }),
    chest: sph(0.068,1.3,0.7,0.42,16,10),
    thigh: cyl(0.07,0.05,0.46,-0.23), kneeJ: sph(0.05), shin: cyl(0.048,0.032,0.44,-0.22), ankle: sph(0.033,1,1.2,1,10,8),
    sole: box(0.078,0.018,0.22,0,-0.021,0.04), toe: sph(0.04,1,0.65,2.5,14,10), heel: cyl(0.014,0.009,0.06,0,10),
    upper: cyl(0.04,0.034,0.28,-0.14), elbowJ: sph(0.035,1,1,1,10,8), fore: cyl(0.033,0.026,0.25,-0.125),
    palm: sph(0.03,0.75,1.3,0.55,10,8), thumb: cyl(0.01,0.008,0.05,-0.025,8),
    neck: cyl(0.038,0.044,0.1,0),
    head: sph(0.1,0.86,1.06,0.95,32,24), jaw: sph(0.066,1,0.8,1,24,16), ear: sph(0.019,0.5,1,0.8,10,8),
    sclera: sph(0.021,1.25,0.8,0.5,16,12), iris: sph(0.012,1,1,0.45,14,10), pupil: sph(0.0055,1,1,0.4,10,8), lash: box(0.05,0.006,0.012), brow: box(0.036,0.009,0.01),
    lipU: sph(0.019,1.1,0.32,0.5,12,6), lipL: sph(0.02,1.05,0.38,0.5,12,6), nose: sph(0.013,0.75,1,1.4,10,8),
    cap: new THREE.SphereGeometry(0.107,32,16,0,Math.PI*2,0,Math.PI*0.56),
    fringe: new THREE.SphereGeometry(0.111,24,8,Math.PI/2-0.95,1.9,Math.PI*0.2,Math.PI*0.17),
    longBack: new THREE.CylinderGeometry(0.1,0.125,0.44,28,1,true,Math.PI/2,Math.PI),
    bobShell: new THREE.CylinderGeometry(0.113,0.126,0.17,28,1,true,Math.PI*0.32,Math.PI*1.36),
    bun: sph(0.05,1,1,1,14,10), tail: cyl(0.03,0.012,0.32,-0.16,12), tie: torus(0.026,0.008,6,14),
    stud: sph(0.008,1,1,1,8,6), hoop: torus(0.016,0.003,6,16),
    necklace: torus(0.058,0.0042,6,28), pendant: sph(0.011,1,1.3,0.6,10,8),
    belt: (() => { const g = torus(0.122,0.012,8,32); g.rotateX(Math.PI/2); g.scale(1,1,0.75); return g; })(), buckle: box(0.032,0.024,0.008),
    button: sph(0.0075,1,1,0.6,8,6), bracelet: torus(0.03,0.005,6,18),
    bag: box(0.055,0.15,0.21), flap: box(0.059,0.07,0.214), clasp: box(0.008,0.016,0.026), strap: box(0.008,0.4,0.008),
    glasses: box(0.162,0.036,0.018), temple: box(0.004,0.008,0.1),
  };
})();
const blackS = std(0x0d0d0d, 0.3), goldS = std(0xd4af37, 0.35, 0.45), white = std(0xf8f8f8, 0.4);
const lipCols2 = [0xb5485a,0xc2626a,0x9e3b4a,0xd28a84,0xa83246];
const irisCols = [0x3b2416,0x1d1d1d,0x4a6b3a,0x3d6a8f,0x6b4a2a];

export function person2() {
  const p = new THREE.Group();
  const skinC = pick(skins);
  const skin = std(skinC, 0.6), hair = std(pick(hairs), 0.45), hairShell = hair.clone(); hairShell.side = THREE.DoubleSide;
  const kind = Math.random();
  const mainC = pick(outfits), main = fabric(mainC), top = fabric(pick(outfits));
  const torsoM = kind < 0.6 ? main : top, legM = kind >= 0.85 ? std(pick([0x1f2a44,0x111111,0xd9cbb6,0xf2efe8,0x6b5a4a]), 0.9) : skin;
  const shoeM = std(pick([0x1a1a1a,0xd9cbb6,0x8a5a3b,0xc8344a,0xf2efe8]), 0.4), soleM = std(0x2a2522, 0.9);
  const mesh = (geo, m, x = 0, y = 0, z = 0, parent = p) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; parent.add(o); return o; };
  mesh(H.torso, torsoM);
  if (kind < 0.6 && Math.random() < 0.6) mesh(H.chest, skin, 0, 1.485, 0.092);
  if (kind < 0.85) {
    const idx = kind < 0.6 ? Math.floor(Math.random()*3) : 1 + Math.floor(Math.random()*2);
    const dm = main.clone(); dm.side = THREE.DoubleSide;
    mesh(H.dress[idx], dm);
    if (Math.random() < 0.35) mesh(H.hem[idx], std(pick([0xffffff,0x111111,0xd4af37]), 0.6));
    if (Math.random() < 0.4) { mesh(H.belt, std(pick([0x111111,0x8a5a3b,0xd9cbb6]), 0.5), 0, 1.165, 0); mesh(H.buckle, goldS, 0, 1.165, 0.093); }
  } else {
    for (let i = 0; i < 4; i++) mesh(H.button, white, 0, 1.22 + i*0.06, 0.1);
  }
  const heels = Math.random() < 0.5;
  const legs = [], knees = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s*0.078, 0.93, 0); p.add(hip);
    mesh(H.thigh, legM, 0, 0, 0, hip);
    const knee = new THREE.Group(); knee.position.y = -0.46; hip.add(knee);
    mesh(H.kneeJ, legM, 0, 0, 0, knee);
    mesh(H.shin, legM, 0, 0, 0, knee);
    mesh(H.ankle, skin, 0, -0.415, 0, knee);
    mesh(H.sole, soleM, 0, -0.44, 0, knee);
    mesh(H.toe, shoeM, 0, -0.448, 0.05, knee);
    if (heels) mesh(H.heel, shoeM, 0, -0.43, -0.055, knee);
    legs.push(hip); knees.push(knee);
  }
  const sleeve = Math.random() < 0.5 ? torsoM : skin;
  const arms = [], elbows = [];
  const wrist = Math.random() < 0.45 ? (Math.random() < 0.5 ? goldS : std(0x2b2b2b, 0.4, 0.6)) : null;
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s*0.195, 1.455, 0); sh.rotation.z = s*0.07; p.add(sh);
    mesh(H.upper, sleeve, 0, 0, 0, sh);
    const el = new THREE.Group(); el.position.y = -0.28; el.rotation.x = -0.25; sh.add(el);
    mesh(H.elbowJ, skin, 0, 0, 0, el);
    mesh(H.fore, skin, 0, 0, 0, el);
    mesh(H.palm, skin, 0, -0.275, 0, el);
    const th = mesh(H.thumb, skin, -s*0.012, -0.255, 0.018, el); th.rotation.z = -s*0.4;
    if (wrist && s === -1) { const b = mesh(H.bracelet, wrist, 0, -0.235, 0, el); b.rotation.x = Math.PI/2; }
    arms.push(sh); elbows.push(el);
  }
  mesh(H.neck, skin, 0, 1.56, 0);
  mesh(H.head, skin, 0, 1.69, 0);
  mesh(H.jaw, skin, 0, 1.64, 0.012);
  for (const s of [-1, 1]) mesh(H.ear, skin, s*0.087, 1.69, -0.005);
  if (Math.random() < 0.2) {
    mesh(H.glasses, blackS, 0, 1.708, 0.102);
    for (const s of [-1, 1]) mesh(H.temple, blackS, s*0.08, 1.712, 0.04);
  } else {
    const irisM = std(pick(irisCols), 0.2);
    for (const s of [-1, 1]) {
      mesh(H.sclera, white, s*0.033, 1.708, 0.087);
      mesh(H.iris, irisM, s*0.033, 1.707, 0.0955);
      mesh(H.pupil, blackS, s*0.033, 1.707, 0.1);
      const l = mesh(H.lash, blackS, s*0.033, 1.7215, 0.093); l.rotation.z = -s*0.1;
    }
  }
  for (const s of [-1, 1]) { const b = mesh(H.brow, hair, s*0.035, 1.739, 0.09); b.rotation.z = -s*0.15; }
  mesh(H.nose, skin, 0, 1.678, 0.093);
  const lipM = std(pick(lipCols2), 0.35);
  mesh(H.lipU, lipM, 0, 1.646, 0.083); mesh(H.lipL, lipM, 0, 1.636, 0.082);
  const er = Math.random();
  if (er < 0.25) for (const s of [-1, 1]) mesh(H.stud, goldS, s*0.09, 1.675, 0.004);
  else if (er < 0.45) for (const s of [-1, 1]) { const h = mesh(H.hoop, goldS, s*0.09, 1.66, 0); h.rotation.y = Math.PI/2; }
  if (Math.random() < 0.35) { const n = mesh(H.necklace, goldS, 0, 1.53, 0.012); n.rotation.x = Math.PI/2 - 0.35; mesh(H.pendant, goldS, 0, 1.495, 0.112); }
  const style = Math.random();
  mesh(H.cap, hair, 0, 1.7, -0.008);
  if (style < 0.35) { mesh(H.longBack, hairShell, 0, 1.56, -0.006); if (Math.random() < 0.5) mesh(H.fringe, hair, 0, 1.69, 0); }
  else if (style < 0.55) { const t = mesh(H.tail, hair, 0, 1.73, -0.11); t.rotation.x = 0.35; const tie = mesh(H.tie, pick([blackS, goldS]), 0, 1.73, -0.108); tie.rotation.x = Math.PI/2 + 0.35; }
  else if (style < 0.75) { mesh(H.bun, hair, 0, 1.8, -0.075); }
  else { mesh(H.bobShell, hairShell, 0, 1.66, -0.006); mesh(H.fringe, hair, 0, 1.69, 0); }
  if (Math.random() < 0.55) {
    const bm = std(pick([0x8a5a3b,0x111111,0xd9cbb6,0xc8344a,0xf2efe8,0x2f7fb5]), 0.5);
    const fm = bm.clone(); fm.color.multiplyScalar(0.8);
    mesh(H.bag, bm, 0.215, 1.0, -0.02);
    mesh(H.flap, fm, 0.215, 1.065, -0.02);
    mesh(H.clasp, goldS, 0.253, 1.04, -0.02);
    mesh(H.strap, bm, 0.2, 1.3, -0.02);
  }
  return {p, legs, knees, arms, elbows};
}

// --- v3: most realistic (used) ---
const css = (c, f = 1, a = 1) => { const k = new THREE.Color(c); const v = n => Math.min(255, Math.round(n*255*f)); return `rgba(${v(k.r)},${v(k.g)},${v(k.b)},${a})`; };
const faceCache = {};
function faceTexture(skinC, hairC, irisC, lipC) {
  const lightBrow = [0xb88a4a, 0xe2c27a].includes(hairC), key = skinC + (lightBrow ? 'L' : 'D');
  if (faceCache[key]) return faceCache[key];
  const SC = 1.5, c = document.createElement('canvas'); c.width = 1024*SC; c.height = 512*SC;
  const x = c.getContext('2d'); x.scale(SC, SC);
  const cx = 256, sk = new THREE.Color(skinC), browC = lightBrow ? 0x8a6a40 : 0x2a1d17;
  const blob = (px, py, r, col) => { const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(px - r, py - r, 2*r, 2*r); };
  x.fillStyle = css(skinC); x.fillRect(0, 0, 1024, 512);
  const vg = x.createLinearGradient(0, 140, 0, 430); vg.addColorStop(0, css(skinC, 1.05, 0.7)); vg.addColorStop(0.45, 'rgba(0,0,0,0)'); vg.addColorStop(1, css(skinC, 0.8, 0.55));
  x.fillStyle = vg; x.fillRect(0, 0, 1024, 512);
  blob(cx, 272, 62, 'rgba(200,80,70,0.09)');
  for (const s of [-1, 1]) blob(cx + s*70, 282, 46, 'rgba(205,85,80,0.11)');
  for (let i = 0; i < 16000; i++) { x.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)'; x.fillRect(Math.random()*1024, Math.random()*512, 0.8, 0.8); }
  if (sk.r > 0.88 && Math.random() < 0.35) for (let i = 0; i < 70; i++) { x.fillStyle = css(skinC, 0.72, 0.3 + Math.random()*0.2); x.beginPath(); x.arc(cx + (Math.random() - 0.5)*160, 252 + Math.random()*40, 0.6 + Math.random()*1.1, 0, 7); x.fill(); }
  for (const s of [-1, 1]) { blob(cx + s*120, 250, 72, css(skinC, 0.8, 0.22)); blob(cx + s*92, 306, 42, css(skinC, 0.84, 0.2)); blob(cx + s*58, 262, 22, css(skinC, 1.12, 0.28)); }
  blob(cx, 178, 58, css(skinC, 1.08, 0.25));
  x.lineCap = 'round';
  for (const s of [-1, 1]) { x.strokeStyle = css(skinC, 0.82, 0.12); x.lineWidth = 7; x.beginPath(); x.moveTo(cx + s*11, 216); x.quadraticCurveTo(cx + s*13, 256, cx + s*15, 278); x.stroke(); }
  blob(cx, 232, 6, 'rgba(255,255,255,0.14)'); blob(cx, 268, 9, 'rgba(255,255,255,0.2)');
  for (const s of [-1, 1]) { const g2 = x.createRadialGradient(cx + s*6.5, 288, 0, cx + s*6.5, 288, 4); g2.addColorStop(0, css(skinC, 0.38, 0.75)); g2.addColorStop(0.7, css(skinC, 0.6, 0.35)); g2.addColorStop(1, css(skinC, 0.8, 0));
    x.fillStyle = g2; x.beginPath(); x.ellipse(cx + s*6.5, 288, 4, 2.2, s*0.4, 0, 7); x.fill();
  }
  blob(cx, 296, 16, css(skinC, 1.15, 0.35));
  x.strokeStyle = css(skinC, 0.78, 0.3); x.lineWidth = 1.3;
  for (const s of [-1, 1]) { x.beginPath(); x.moveTo(cx + s*4, 297); x.lineTo(cx + s*5.5, 319); x.stroke(); }
  const shadowC = pick(['rgba(120,80,60,0.26)','rgba(150,90,100,0.22)','rgba(110,90,80,0.28)','rgba(160,120,80,0.22)']);
  for (const s of [-1, 1]) {
    const ex = cx + s*64, ey = 228, inner = ex - s*21, outer = ex + s*24;
    blob(ex, ey - 13, 38, shadowC);
    blob(ex + s*2, ey + 11, 22, css(skinC, 0.84, 0.28));
    x.strokeStyle = css(skinC, 0.62, 0.45); x.lineWidth = 2.4;
    x.beginPath(); x.moveTo(ex - s*21, ey - 11); x.quadraticCurveTo(ex + s*2, ey - 29, ex + s*26, ey - 9); x.stroke();
    x.save();
    x.beginPath(); x.moveTo(inner, ey + 1); x.quadraticCurveTo(ex + s*2, ey - 19, outer, ey - 3); x.quadraticCurveTo(ex + s*3, ey + 13, inner, ey + 1); x.closePath();
    const sg = x.createRadialGradient(ex, ey - 2, 4, ex, ey - 2, 26); sg.addColorStop(0, '#f7f2ed'); sg.addColorStop(1, '#cdbfb6');
    x.fillStyle = sg; x.fill(); x.clip();
    const ir = x.createRadialGradient(ex, ey - 2, 1.5, ex, ey - 2, 11.5);
    ir.addColorStop(0, css(irisC, 1.9)); ir.addColorStop(0.45, css(irisC, 1.25)); ir.addColorStop(0.85, css(irisC, 0.9)); ir.addColorStop(1, css(irisC, 0.45));
    x.fillStyle = ir; x.beginPath(); x.arc(ex, ey - 2, 11.5, 0, 7); x.fill();
    x.lineWidth = 0.6;
    for (let k = 0; k < 40; k++) { const a = k/40*Math.PI*2 + Math.random()*0.1; x.strokeStyle = k % 2 ? css(irisC, 1.8, 0.35) : css(irisC, 0.6, 0.3);
      x.beginPath(); x.moveTo(ex + Math.cos(a)*5, ey - 2 + Math.sin(a)*5); x.lineTo(ex + Math.cos(a)*10.5, ey - 2 + Math.sin(a)*10.5); x.stroke();
    }
    x.strokeStyle = css(irisC, 0.3, 0.8); x.lineWidth = 1.5; x.beginPath(); x.arc(ex, ey - 2, 11, 0, 7); x.stroke();
    x.fillStyle = '#080605'; x.beginPath(); x.arc(ex, ey - 2, 4.3, 0, 7); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.95)'; x.beginPath(); x.arc(ex + 3.6, ey - 6.2, 2.6, 0, 7); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.55)'; x.beginPath(); x.arc(ex - 3, ey + 2.5, 1.1, 0, 7); x.fill();
    const lid = x.createLinearGradient(0, ey - 20, 0, ey - 6); lid.addColorStop(0, 'rgba(40,20,15,0.45)'); lid.addColorStop(1, 'rgba(40,20,15,0)');
    x.fillStyle = lid; x.fillRect(ex - 30, ey - 20, 60, 14);
    x.restore();
    x.fillStyle = 'rgba(215,120,120,0.65)'; x.beginPath(); x.ellipse(inner + s*2.2, ey + 1, 2.6, 1.9, 0, 0, 7); x.fill();
    x.strokeStyle = '#120b09'; x.lineWidth = 3.4;
    x.beginPath(); x.moveTo(inner, ey + 1); x.quadraticCurveTo(ex + s*2, ey - 19, outer, ey - 3); x.lineTo(outer + s*7, ey - 8); x.stroke();
    x.lineWidth = 1.1;
    for (let t = 0.12; t <= 1.001; t += 0.06) {
      const px = (1 - t)*(1 - t)*inner + 2*(1 - t)*t*(ex + s*2) + t*t*outer, py = (1 - t)*(1 - t)*(ey + 1) + 2*(1 - t)*t*(ey - 19) + t*t*(ey - 3);
      x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + s*(1 + t*3), py - 5 - t*2, px + s*(3 + t*6), py - 7 - t*2.5); x.stroke();
    }
    x.strokeStyle = 'rgba(40,25,20,0.4)'; x.lineWidth = 1.2;
    x.beginPath(); x.moveTo(inner + s*4, ey + 3); x.quadraticCurveTo(ex + s*3, ey + 12, outer, ey - 3); x.stroke();
    x.lineWidth = 0.7;
    for (let t = 0.35; t <= 0.95; t += 0.15) { const px = inner + s*4 + (outer - inner - s*4)*t, py = ey + 3 + Math.sin(t*Math.PI)*7; x.beginPath(); x.moveTo(px, py); x.lineTo(px + s*1.5, py + 3); x.stroke(); }
    const browY = t => ey - 38 - Math.sin(Math.min(1, t*1.4)*Math.PI*0.5)*8 + (t > 0.7 ? (t - 0.7)*20 : 0);
    x.strokeStyle = css(browC, 1, 0.22); x.lineWidth = 6;
    x.beginPath(); for (let t = 0; t <= 1.001; t += 0.05) { const bx = ex - s*24 + s*50*t; t ? x.lineTo(bx, browY(t)) : x.moveTo(bx, browY(t) + 2); } x.stroke();
    x.lineWidth = 1.2;
    for (let k = 0; k < 55; k++) { const t = Math.random(), bx = ex - s*24 + s*50*t, by = browY(t) + (Math.random() - 0.5)*4;
      x.strokeStyle = css(browC, 0.9 + Math.random()*0.4, 0.55 + Math.random()*0.35);
      x.beginPath(); x.moveTo(bx, by + 2.5*(1 - t) + 1.5); x.lineTo(bx + s*(4 + Math.random()*2), by - 1.5 - (1 - t)*2); x.stroke();
    }
  }
  const ly = 332;
  x.strokeStyle = css(skinC, 1.15, 0.35); x.lineWidth = 1.2;
  x.beginPath(); x.moveTo(cx - 24, ly - 2); x.quadraticCurveTo(cx - 15, ly - 11, cx - 8, ly - 12); x.quadraticCurveTo(cx, ly - 8, cx + 8, ly - 12); x.quadraticCurveTo(cx + 15, ly - 11, cx + 24, ly - 2); x.stroke();
  x.fillStyle = css(lipC, 0.82);
  x.beginPath(); x.moveTo(cx - 27, ly); x.quadraticCurveTo(cx - 16, ly - 9, cx - 8, ly - 10); x.quadraticCurveTo(cx, ly - 6, cx + 8, ly - 10); x.quadraticCurveTo(cx + 16, ly - 9, cx + 27, ly); x.quadraticCurveTo(cx, ly + 2, cx - 27, ly); x.fill();
  const lg = x.createLinearGradient(0, ly, 0, ly + 18); lg.addColorStop(0, css(lipC, 0.85)); lg.addColorStop(0.5, css(lipC, 1.05)); lg.addColorStop(1, css(lipC, 0.9));
  x.fillStyle = lg;
  x.beginPath(); x.moveTo(cx - 27, ly); x.quadraticCurveTo(cx, ly + 3, cx + 27, ly); x.quadraticCurveTo(cx + 14, ly + 17, cx, ly + 18); x.quadraticCurveTo(cx - 14, ly + 17, cx - 27, ly); x.fill();
  x.strokeStyle = css(lipC, 0.7, 0.18); x.lineWidth = 0.6;
  for (let i = -22; i <= 22; i += 3) { x.beginPath(); x.moveTo(cx + i, ly + 3); x.lineTo(cx + i*1.05, ly + 14 - Math.abs(i)*0.25); x.stroke(); x.beginPath(); x.moveTo(cx + i, ly - 1); x.lineTo(cx + i, ly - 7 + Math.abs(i)*0.2); x.stroke(); }
  blob(cx, ly + 8, 9, 'rgba(255,255,255,0.3)'); blob(cx - 5, ly - 6, 4, 'rgba(255,255,255,0.18)');
  x.strokeStyle = css(lipC, 0.4, 0.9); x.lineWidth = 1.8;
  x.beginPath(); x.moveTo(cx - 26, ly); x.quadraticCurveTo(cx, ly + 3, cx + 26, ly); x.stroke();
  for (const s of [-1, 1]) blob(cx + s*27, ly, 3.5, css(lipC, 0.4, 0.6));
  blob(cx, 357, 15, css(skinC, 0.8, 0.28)); blob(cx, 384, 17, 'rgba(255,255,255,0.12)'); blob(cx, 425, 70, css(skinC, 0.72, 0.35));
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8;
  return (faceCache[key] = t);
}
function sculptHead() {
  const g = new THREE.SphereGeometry(0.1, 128, 96); g.scale(0.8, 1.06, 0.95);
  const p = g.attributes.position, v = new THREE.Vector3();
  const G2 = (x, y, cx, cy, sx, sy) => Math.exp(-((x - cx)**2/(2*sx*sx) + (y - cy)**2/(2*sy*sy)));
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const {x, y, z} = v, front = Math.max(0, z/0.095), f = front*front;
    let d = 0.0045*G2(x, y, 0, 0.036, 0.045, 0.008)*f;
    for (const s of [-1, 1]) {
      d -= 0.0065*G2(x, y, s*0.031, 0.017, 0.014, 0.01)*f;
      d += 0.004*G2(x, y, s*0.049, -0.008, 0.016, 0.012)*f;
      d -= 0.0028*G2(x, y, s*0.047, -0.042, 0.013, 0.014)*f;
      d -= 0.0025*G2(x, y, s*0.067, 0.03, 0.012, 0.02)*front;
      d += 0.004*G2(x, y, s*0.012, -0.016, 0.006, 0.005)*f;
    }
    const ny = (0.024 - y)/0.036, k = Math.min(1, Math.max(0, ny));
    if (ny > -0.3 && ny < 1.8) d += f*(0.003 + 0.0135*k**1.5)*Math.exp(-(x*x)/(2*(0.005 + 0.0022*k)**2))*(ny > 1 ? Math.exp(-(((ny - 1)*3.2)**2)) : 1);
    d += 0.0035*G2(x, y, 0, -0.045, 0.016, 0.006)*f;
    d -= 0.0032*G2(x, y, 0, -0.06, 0.013, 0.004)*f;
    d += 0.0075*G2(x, y, 0, -0.08, 0.012, 0.011)*f;
    for (const s of [-1, 1]) d += 0.0022*G2(x, y, s*0.0095, -0.09, 0.006, 0.006)*f;
    const jaw = y < -0.005 ? Math.min(1, (-0.005 - y)/0.085) : 0, nx = x*(1 - 0.42*jaw**1.4*(0.6 + 0.4*front)), ny2 = y < 0 ? y*1.06 : y, len = Math.hypot(nx, ny2, z) || 1;
    const X = nx + nx/len*d, Z = z + z/len*d; let Y = ny2 + ny2/len*d;
    const floorY = -0.088 - 0.012*Math.exp(-(X*X)/(2*0.02**2))*Math.max(0, Z/0.09);
    if (Y < floorY) Y = floorY + (Y - floorY)*0.35;
    p.setXYZ(i, X, Y, Z);
  }
  g.computeVertexNormals(); return g;
}
const hairTexCache = {};
function hairMat(c) {
  if (!hairTexCache[c]) {
    const W = 256, Hh = 512, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh;
    const x = cv.getContext('2d');
    x.fillStyle = css(c); x.fillRect(0, 0, W, Hh);
    for (let i = 0; i < 1400; i++) {
      const px = Math.random()*W, py = Math.random()*Hh, len = 60 + Math.random()*300;
      x.strokeStyle = Math.random() < 0.5 ? css(c, 1.5, 0.35) : css(c, 0.6, 0.35);
      x.lineWidth = 0.6 + Math.random()*1.2;
      x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + (Math.random() - 0.5)*8, py + len/2, px + (Math.random() - 0.5)*6, py + len); x.stroke();
    }
    for (let px = 0; px < W; px += 2) { const cut = 6 + Math.random()*40; x.clearRect(px, Hh - cut, 2, cut); }
    const t = new THREE.CanvasTexture(cv); t.wrapS = THREE.RepeatWrapping; t.repeat.set(4, 1); t.anisotropy = 4;
    hairTexCache[c] = t;
  }
  return new THREE.MeshStandardMaterial({map:hairTexCache[c], roughness:0.42, metalness:0.05, alphaTest:0.5, side:THREE.DoubleSide});
}
const TORSO_PROFILE = [
  [0.915,0.0,0.0,0.0],[0.92,0.145,0.098,0.10],[0.97,0.160,0.104,0.108],[1.02,0.158,0.100,0.104],[1.08,0.142,0.092,0.094],
  [1.14,0.122,0.086,0.084],[1.17,0.118,0.085,0.083],[1.22,0.124,0.089,0.084],[1.28,0.136,0.095,0.086],[1.34,0.146,0.100,0.088],
  [1.39,0.150,0.096,0.088],[1.43,0.162,0.086,0.084],[1.465,0.176,0.074,0.076],[1.49,0.158,0.064,0.068],[1.51,0.112,0.056,0.060],
  [1.525,0.066,0.047,0.050],[1.535,0.046,0.042,0.044],[1.54,0.0,0.0,0.0],
];
const torsoAt = y => { const P = TORSO_PROFILE; let i = 0; while (i < P.length - 2 && P[i+1][0] < y) i++;
  const a = P[i], b = P[i+1], p0 = P[Math.max(0, i-1)], p3 = P[Math.min(P.length - 1, i+2)], t = Math.min(1, Math.max(0, (y - a[0])/(b[0] - a[0])));
  const cr = j => { const v0 = p0[j], v1 = a[j], v2 = b[j], v3 = p3[j]; return Math.max(0, 0.5*((2*v1) + (-v0 + v2)*t + (2*v0 - 5*v1 + 4*v2 - v3)*t*t + (-v0 + 3*v1 - 3*v2 + v3)*t*t*t)); };
  return [cr(1), cr(2), cr(3)];
};
const torsoFront = y => torsoAt(y)[1] + 0.010*Math.exp(-((y - 1.335)**2)/(2*0.04**2))*0.7;
function sculptTorso(neck) {
  const SEG = 192, y0 = 0.915, y1 = 1.54, ym = 1.36, n = 2.7, pos = [], uv = [], ys = [];
  for (let r = 0; r < 36; r++) ys.push(y0 + (ym - y0)*(1 - Math.cos(r/36*Math.PI/2)));
  for (let r = 0; r <= 100; r++) ys.push(ym + (y1 - ym)*r/100);
  const RINGS = ys.length - 1;
  for (const y of ys) {
    const [w, df, db] = torsoAt(y);
    for (let k = 0; k <= SEG; k++) {
      const a = k/SEG*Math.PI*2, ca = Math.cos(a), sa = Math.sin(a);
      let x = w*Math.sign(ca)*Math.abs(ca)**(2/n), z = (sa >= 0 ? df : db)*Math.sign(sa)*Math.abs(sa)**(2/n);
      if (sa > 0) for (const s of [-1, 1]) z += 0.010*Math.exp(-((x - s*0.05)**2/(2*0.034**2) + (y - 1.335)**2/(2*0.04**2)))*sa;
      if (sa < 0) for (const s of [-1, 1]) z -= 0.004*Math.exp(-((x - s*0.06)**2/(2*0.03**2) + (y - 1.40)**2/(2*0.05**2)))*-sa;
      if (sa < 0) z += 0.004*Math.exp(-(x*x)/(2*0.01**2))*-sa*(y > 1.0 && y < 1.45 ? 1 : 0);
      pos.push(x, y, z); uv.push(k/SEG, (y - y0)/(y1 - y0));
    }
  }
  const neckY = x => neck === 'scoop' ? 1.425 + 30*x*x : neck === 'v' ? 1.385 + 1.6*Math.abs(x) : 1.51;
  const fabricIdx = [], skinIdx = [];
  for (let r = 0; r < RINGS; r++) for (let k = 0; k < SEG; k++) {
    const i0 = r*(SEG + 1) + k, i1 = i0 + 1, i2 = i0 + SEG + 1, i3 = i2 + 1;
    for (const tri of [[i0, i2, i1], [i1, i2, i3]]) {
      const c = [0, 1, 2].map(j => (pos[tri[0]*3 + j] + pos[tri[1]*3 + j] + pos[tri[2]*3 + j])/3);
      const open = c[2] > 0 ? c[1] > neckY(c[0]) : c[1] > 1.515;
      (open ? skinIdx : fabricIdx).push(...tri);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(fabricIdx.concat(skinIdx)); g.addGroup(0, fabricIdx.length, 0); g.addGroup(fabricIdx.length, skinIdx.length, 1);
  g.computeVertexNormals();
  const nm = g.attributes.normal;
  for (let r = 0; r <= RINGS; r++) { const a = r*(SEG + 1), b = a + SEG;
    const nx = nm.getX(a) + nm.getX(b), ny = nm.getY(a) + nm.getY(b), nz = nm.getZ(a) + nm.getZ(b), l = Math.hypot(nx, ny, nz) || 1;
    nm.setXYZ(a, nx/l, ny/l, nz/l); nm.setXYZ(b, nx/l, ny/l, nz/l);
  }
  return g;
}
const V = (() => {
  const lathe = (pts, sz = 1, seg = 24) => { const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg); if (sz !== 1) g.scale(1, 1, sz); return g; };
  const sph = (r, sx = 1, sy = 1, sz = 1, w = 16, h = 12) => { const g = new THREE.SphereGeometry(r, w, h); g.scale(sx, sy, sz); return g; };
  const hs = (ps, pl, ts, tl) => { const g = new THREE.SphereGeometry(0.1, 40, 20, ps, pl, ts, tl); g.scale(0.93, 1.12, 1.02); return g; };
  const folds = (g, hemY, amp, freq) => {
    const p = g.attributes.position, ph = Math.random()*6;
    for (let i = 0; i < p.count; i++) {
      const x0 = p.getX(i), y = p.getY(i), z0 = p.getZ(i);
      const t = Math.min(1, Math.max(0, (1.1 - y)/(1.1 - hemY))), a = Math.atan2(z0, x0);
      const k = 1 + amp*t*t*Math.sin(a*freq + ph);
      p.setX(i, x0*k); p.setZ(i, z0*k);
    }
    g.computeVertexNormals(); return g;
  };
  const dressPts = [
    [[0.122,1.17],[0.15,1.08],[0.168,1.0],[0.2,0.86],[0.24,0.66],[0.272,0.5],[0.285,0.44]],
    [[0.122,1.17],[0.15,1.08],[0.168,1.0],[0.2,0.86],[0.235,0.66],[0.242,0.63]],
    [[0.122,1.17],[0.15,1.08],[0.168,1.0],[0.19,0.86],[0.197,0.83]],
  ];
  const hemYs = [0.44, 0.63, 0.83];
  return {
    torso: {crew:sculptTorso('crew'), scoop:sculptTorso('scoop'), v:sculptTorso('v')},
    dress: dressPts.map((pts, i) => [0, 1].map(() => folds(lathe(pts, 0.82, 64), hemYs[i], 0.055, 9 + Math.floor(Math.random()*4)))),
    thigh: lathe([[0,-0.47],[0.045,-0.46],[0.048,-0.43],[0.056,-0.34],[0.066,-0.22],[0.073,-0.1],[0.074,-0.03],[0.066,0.01],[0,0.03]]),
    shin: lathe([[0,-0.45],[0.028,-0.445],[0.03,-0.41],[0.034,-0.34],[0.045,-0.22],[0.051,-0.13],[0.049,-0.06],[0.044,-0.01],[0,0.02]]),
    kneeCap: sph(0.044,1,1,1,14,10),
    upper: lathe([[0,-0.29],[0.031,-0.285],[0.034,-0.22],[0.038,-0.12],[0.042,-0.04],[0.04,0],[0,0.03]]),
    deltoid: sph(0.04,0.95,1.1,1,18,14),
    fore: lathe([[0,-0.26],[0.022,-0.255],[0.024,-0.22],[0.031,-0.12],[0.034,-0.05],[0.032,0],[0,0.015]]),
    palm: sph(0.03,0.5,1.15,1.15,14,10),
    finger: (() => { const g = new THREE.CylinderGeometry(0.0072, 0.006, 0.065, 8); g.translate(0, -0.0325, 0); return g; })(),
    thumb: (() => { const g = new THREE.CylinderGeometry(0.0085, 0.007, 0.05, 8); g.translate(0, -0.025, 0); return g; })(),
    neck: lathe([[0,1.5],[0.046,1.505],[0.04,1.56],[0.039,1.62],[0,1.625]]),
    head: sculptHead(),
    jaw: sph(0.066,1,0.8,1,24,16), nose: sph(0.012,0.7,1.1,1.3,10,8), ear: sph(0.019,0.45,1,0.8,10,8),
    capTop: hs(0, Math.PI*2, 0, Math.PI*0.2),
    capBack: hs(Math.PI/2 + 0.85, Math.PI*2 - 1.7, 0, Math.PI*0.6),
    fringe: hs(Math.PI/2 - 0.95, 1.9, Math.PI*0.2, Math.PI*0.17),
    longBack: new THREE.CylinderGeometry(0.098,0.125,0.46,32,6,true,Math.PI/2,Math.PI),
    longOuter: new THREE.CylinderGeometry(0.106,0.132,0.36,32,4,true,Math.PI*0.6,Math.PI*0.8),
    lockR: new THREE.CylinderGeometry(0.1,0.112,0.3,10,3,true,Math.PI/2 - 0.6,0.6),
    lockL: new THREE.CylinderGeometry(0.1,0.112,0.3,10,3,true,Math.PI*1.5,0.6),
    bobShell: new THREE.CylinderGeometry(0.113,0.127,0.18,36,2,true,0.75,Math.PI*2 - 1.5),
  };
})();

export function person3() {
  const p = new THREE.Group();
  const skinC = pick(skins), hairC = pick(hairs);
  const skin = std(skinC, 0.55); skin.emissive = new THREE.Color(skinC).multiplyScalar(0.07);
  const faceM = new THREE.MeshStandardMaterial({map: faceTexture(skinC, hairC, pick(irisCols), pick(lipCols2)), roughness:0.48, emissive:new THREE.Color(skinC).multiplyScalar(0.07)});
  const hairM = hairMat(hairC);
  const kind = Math.random();
  const main = fabric(pick(outfits)), top = fabric(pick(outfits));
  const torsoM = kind < 0.6 ? main : top;
  const legM = kind >= 0.85 ? std(pick([0x1f2a44,0x111111,0xd9cbb6,0xf2efe8,0x6b5a4a]), 0.9) : skin;
  const shoeM = std(pick([0x1a1a1a,0xd9cbb6,0x8a5a3b,0xc8344a,0xf2efe8]), 0.35), soleM = std(0x2a2522, 0.9);
  const mesh = (geo, m, parent, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = false; parent.add(o); return o; };
  const lower = new THREE.Group(), upper = new THREE.Group(), headG = new THREE.Group();
  p.add(lower, upper); upper.add(headG);
  const heels = Math.random() < 0.5;
  const legs = [], knees = [], feet = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s*0.078, 0.93, 0); lower.add(hip);
    mesh(V.thigh, legM, hip);
    const knee = new THREE.Group(); knee.position.y = -0.46; hip.add(knee);
    mesh(V.kneeCap, legM, knee, 0, 0, 0.008);
    mesh(V.shin, legM, knee);
    const foot = new THREE.Group(); foot.position.y = -0.44; knee.add(foot);
    mesh(H.ankle, skin, foot, 0, 0.025, 0);
    mesh(H.sole, soleM, foot);
    mesh(H.toe, shoeM, foot, 0, -0.008, 0.05);
    if (heels) mesh(H.heel, shoeM, foot, 0, 0.01, -0.055);
    legs.push(hip); knees.push(knee); feet.push(foot);
  }
  let dressMesh = null;
  if (kind < 0.85) {
    const idx = kind < 0.6 ? Math.floor(Math.random()*3) : 1 + Math.floor(Math.random()*2);
    const dm = main.clone(); dm.side = THREE.DoubleSide;
    dressMesh = mesh(V.dress[idx][Math.floor(Math.random()*2)], dm, lower);
    if (Math.random() < 0.35) mesh(H.hem[idx], std(pick([0xffffff,0x111111,0xd4af37]), 0.6), lower);
    if (Math.random() < 0.4) { mesh(H.belt, std(pick([0x111111,0x8a5a3b,0xd9cbb6]), 0.5), lower, 0, 1.165, 0); mesh(H.buckle, goldS, lower, 0, 1.165, 0.093); }
  }
  const neck = kind < 0.6 ? pick(['crew','scoop','v','scoop']) : pick(['crew','v']);
  mesh(V.torso[neck], [torsoM, skin], upper);
  if (kind >= 0.85) for (let i = 0; i < 4; i++) { const by = 1.2 + i*0.05; if (neck !== 'v' || by < 1.38) mesh(H.button, white, upper, 0, by, torsoFront(by) + 0.002); }
  const sleeve = Math.random() < 0.5 ? torsoM : skin;
  const wristM = Math.random() < 0.45 ? (Math.random() < 0.5 ? goldS : std(0x2b2b2b, 0.4, 0.6)) : null;
  const arms = [], elbows = [];
  for (const s of [-1, 1]) {
    mesh(V.deltoid, sleeve, upper, s*0.176, 1.446, 0);
    const sh = new THREE.Group(); sh.position.set(s*0.195, 1.455, 0); sh.rotation.z = s*0.07; upper.add(sh);
    mesh(V.upper, sleeve, sh);
    const el = new THREE.Group(); el.position.y = -0.28; el.rotation.x = -0.25; sh.add(el);
    mesh(H.elbowJ, skin, el);
    mesh(V.fore, skin, el);
    const wr = new THREE.Group(); wr.position.y = -0.255; el.add(wr);
    mesh(V.palm, skin, wr, 0, -0.035, 0);
    for (const fz of [-0.021, -0.007, 0.007, 0.021]) { const f = mesh(V.finger, skin, wr, 0, -0.068, fz); f.rotation.x = 0.15; f.scale.y = fz === -0.021 ? 0.8 : 1; }
    const th = mesh(V.thumb, skin, wr, -s*0.01, -0.022, 0.03); th.rotation.x = 0.6;
    if (wristM && s === -1) { const b = mesh(H.bracelet, wristM, wr, 0, 0.012, 0); b.rotation.x = Math.PI/2; }
    arms.push(sh); elbows.push(el);
  }
  if (Math.random() < 0.35) { const n = mesh(H.necklace, goldS, upper, 0, 1.53, 0.012); n.rotation.x = Math.PI/2 - 0.35; mesh(H.pendant, goldS, upper, 0, 1.5, torsoFront(1.5) + 0.009); }
  if (Math.random() < 0.55) {
    const bm = std(pick([0x8a5a3b,0x111111,0xd9cbb6,0xc8344a,0xf2efe8,0x2f7fb5]), 0.5);
    const fm = bm.clone(); fm.color.multiplyScalar(0.8);
    mesh(H.bag, bm, upper, 0.205, 1.03, -0.02);
    mesh(H.flap, fm, upper, 0.205, 1.08, -0.02);
    mesh(H.clasp, goldS, upper, 0.236, 1.06, -0.02);
    mesh(H.strap, bm, upper, 0.19, 1.3, -0.02);
  }
  mesh(V.neck, skin, headG);
  mesh(V.head, faceM, headG, 0, 1.69, 0);
  for (const s of [-1, 1]) mesh(V.ear, skin, headG, s*0.078, 1.688, -0.008);
  if (Math.random() < 0.18) {
    const lensM = new THREE.MeshStandardMaterial({color:pick([0x1a1a1a, 0x3a2a1a, 0x1d2b3a]), roughness:0.1, metalness:0.3, transparent:true, opacity:0.82});
    const frameM = Math.random() < 0.5 ? goldS : blackS;
    for (const s of [-1, 1]) {
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.003, 24), lensM); lens.rotation.x = Math.PI/2; lens.scale.set(1.2, 1, 1); lens.position.set(s*0.033, 1.707, 0.101); headG.add(lens);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.019, 0.0016, 6, 28), frameM); rim.scale.set(1.2, 1, 1); rim.position.set(s*0.033, 1.707, 0.102); headG.add(rim);
      mesh(H.temple, frameM, headG, s*0.081, 1.712, 0.05);
    }
    mesh(new THREE.BoxGeometry(0.018, 0.003, 0.003), frameM, headG, 0, 1.712, 0.104);
  }
  const er = Math.random();
  if (er < 0.25) for (const s of [-1, 1]) mesh(H.stud, goldS, headG, s*0.09, 1.675, 0.004);
  else if (er < 0.45) for (const s of [-1, 1]) { const h = mesh(H.hoop, goldS, headG, s*0.092, 1.655, 0); h.rotation.y = Math.PI/2; }
  mesh(V.capTop, hairM, headG, 0, 1.69, -0.004);
  mesh(V.capBack, hairM, headG, 0, 1.69, -0.004);
  let hairSway = null;
  const style = Math.random();
  if (style < 0.4) {
    hairSway = new THREE.Group(); hairSway.position.set(0, 1.7, 0); headG.add(hairSway);
    mesh(V.longBack, hairM, hairSway, 0, -0.2, -0.006);
    mesh(V.longOuter, hairM, hairSway, 0, -0.15, -0.012);
    mesh(V.lockR, hairM, hairSway, 0, -0.13, 0);
    mesh(V.lockL, hairM, hairSway, 0, -0.13, 0);
    if (Math.random() < 0.5) mesh(V.fringe, hairM, headG, 0, 1.69, 0);
  } else if (style < 0.6) {
    hairSway = new THREE.Group(); hairSway.position.set(0, 1.735, -0.11); headG.add(hairSway);
    const t = mesh(H.tail, hairM, hairSway); t.rotation.x = 0.35;
    const tie = mesh(H.tie, pick([blackS, goldS]), headG, 0, 1.735, -0.108); tie.rotation.x = Math.PI/2 + 0.35;
  } else if (style < 0.78) {
    mesh(H.bun, hairM, headG, 0, 1.8, -0.08);
  } else {
    mesh(V.bobShell, hairM, headG, 0, 1.655, -0.004);
    mesh(V.fringe, hairM, headG, 0, 1.69, 0);
  }
  return {p, legs, knees, feet, arms, elbows, lower, upper, headG, dress: dressMesh, hairSway};
}

// --- population + movement ---
export function populate() {
  const Y0 = PLATEAU_H + 0.12;
  for (let i = 0; i < 30; i++) {
    const [cx, cz, hx, hz] = blocks[i % blocks.length];
    const off = 0.6 + Math.random()*0.8;
    const a = hx + off, b = hz + off, P = 4*(a + b);
    const w = person3();
    Object.assign(w, {cx, cz, a, b, P, s: Math.random()*P, dir: Math.random() < 0.5 ? 1 : -1,
                      speed: 1.15 + Math.random()*0.35, phase: Math.random()*6.28});
    w.p.position.y = Y0;
    scene.add(w.p);
    walkers.push(w);
  }
  walkers.forEach(placeWalker);
  // Shadow map is baked at startup for perf — moving walker shadows would freeze and look weird.
  // Turn their shadow casting off entirely.
  for (const w of walkers) w.p.traverse(o => { if (o.isMesh) o.castShadow = false; });
  // Walkers loop in the central landmark area → tag them as D3/D4 so they hide in other districts.
  for (const w of walkers) w.p.userData.district = (w.cx + w.cz) < 0 ? 'D3' : 'D4';
}

export function placeWalker(w) {
  const {a, b} = w;
  let s = ((w.s % w.P) + w.P) % w.P, x, z, dx, dz;
  if (s < 2*a) { x = -a + s; z = -b; dx = 1; dz = 0; }
  else if ((s -= 2*a) < 2*b) { x = a; z = -b + s; dx = 0; dz = 1; }
  else if ((s -= 2*b) < 2*a) { x = a - s; z = b; dx = -1; dz = 0; }
  else { s -= 2*a; x = -a; z = b - s; dx = 0; dz = -1; }
  w.p.position.x = w.cx + x; w.p.position.z = w.cz + z;
  w.p.rotation.y = Math.atan2(dx*w.dir, dz*w.dir);
}

export function updateWalkers(dt) {
  for (const w of walkers) {
    if (!w.p.visible) continue;   // hidden walker (out of district) — skip the skeleton work
    w.s += w.speed*w.dir*dt;
    w.phase += w.speed*dt*5.5;
    const sn = Math.sin(w.phase), cs = Math.cos(w.phase), sw = sn*0.42;
    w.legs[0].rotation.x = sw; w.legs[1].rotation.x = -sw;
    w.knees[0].rotation.x = 0.08 + Math.max(0, -cs)*0.6;
    w.knees[1].rotation.x = 0.08 + Math.max(0, cs)*0.6;
    w.arms[0].rotation.x = -sw*0.6; w.arms[1].rotation.x = sw*0.35;
    w.elbows[0].rotation.x = -0.2 - Math.max(0, sn)*0.3; w.elbows[1].rotation.x = -0.2 - Math.max(0, -sn)*0.2;
    w.p.position.y = PLATEAU_H + 0.12 + Math.abs(cs)*0.025;
    if (w.lower) {
      w.lower.rotation.y = sn*0.09; w.lower.rotation.z = cs*0.012;
      w.upper.rotation.y = -sn*0.07;
      w.headG.rotation.y = sn*0.05;
      for (let i = 0; i < 2; i++) w.feet[i].rotation.x = -(w.legs[i].rotation.x + w.knees[i].rotation.x)*0.85;
      if (w.dress) { w.dress.scale.x = 1 + Math.abs(sn)*0.03; w.dress.scale.z = 1 + Math.abs(sn)*0.05; }
      if (w.hairSway) w.hairSway.rotation.x = 0.02 + Math.abs(sn)*0.05;
    }
    placeWalker(w);
  }
}
