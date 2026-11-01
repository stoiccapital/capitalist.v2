// Urban density: office towers, mixed-use mid-rise, shophouse rows, park, market, scooter clusters.
// Each maker: (pos, opts) → Group positioned at pos. opts fields are documented per maker.
// To add a new office tower: add a prebuilt entry in cities/vn.js with varied `opts`.
import { kit } from './kit.js';

// --- Office tower: parametric glass box with floor slabs, corner fins and a crown ---
// opts: {h=70, w=24, d=24, color=0x6b8698, crown=true}
export function officeTower(pos, opts = {}) {
  const h = opts.h ?? 70, w = opts.w ?? 24, d = opts.d ?? w;
  const color = opts.color ?? 0x6b8698, crown = opts.crown ?? true;
  const k = kit(), {add, B, mat} = k;
  const white = mat(0xf2f0eb), paving = mat(0xc9c4ba);
  const glass = new THREE.MeshPhongMaterial({color, specular:0xbfd9e6, shininess:110});
  const lobby = new THREE.MeshPhongMaterial({color:0x8fb8c4, emissive:0x3a2a10, transparent:true, opacity:.55});

  // base plaza
  const sx = w + 8, sz = d + 8;
  add(B(sx, 0.06, sz), paving, 0, 0.03, 0);

  // 4-storey glass lobby
  const LOBBY = 5;
  add(B(w - 2, LOBBY, d - 2), lobby, 0, LOBBY/2, 0);
  for (const x of [-w/2 + 1.3, w/2 - 1.3]) for (const z of [-d/2 + 1.3, d/2 - 1.3])
    add(B(0.8, LOBBY, 0.8), white, x, LOBBY/2, z);

  // shaft with per-floor slab bands
  const shaftH = h - LOBBY;
  const FH = 3.3, floors = Math.max(1, Math.round(shaftH/FH));
  add(B(w, shaftH, d), glass, 0, LOBBY + shaftH/2, 0);
  for (let i = 0; i <= floors; i++) add(B(w + 0.6, 0.3, d + 0.6), white, 0, LOBBY + i*FH, 0);

  // corner fins (vertical lines up the whole shaft)
  for (const x of [-w/2 + 0.4, w/2 - 0.4]) for (const z of [-d/2 + 0.4, d/2 - 0.4])
    add(B(0.6, shaftH, 0.6), white, x, LOBBY + shaftH/2, z);

  // crown: a mechanical floor + a slim mast on taller towers
  if (crown) {
    add(B(w + 1.5, 2.5, d + 1.5), mat(0x9a9890), 0, h + 1, 0);
    if (h > 60) {
      const mastH = Math.min(14, h/8);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, mastH, 8), white);
      mast.position.set(0, h + 2.5 + mastH/2, 0); k.g.add(mast);
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), new THREE.MeshBasicMaterial({color:0xff3b30}));
      beacon.position.set(0, h + 2.5 + mastH + 0.4, 0); k.g.add(beacon);
    }
  }

  k.g.position.copy(pos);
  return k.g;
}

// --- Mixed-use mid-rise: ground-floor shops with awnings, residential floors above ---
// opts: {h=28, w=26, d=16, floors=8, color=0xe6dcc8, awning=0xc8344a}
export function midrise(pos, opts = {}) {
  const h = opts.h ?? 28, w = opts.w ?? 26, d = opts.d ?? 16;
  const floors = opts.floors ?? Math.max(3, Math.round(h/3.2));
  const color = opts.color ?? 0xe6dcc8, awning = opts.awning ?? 0xc8344a;
  const k = kit(), {add, B, mat} = k;
  const ground = 3.6, resH = h - ground, FH = resH/(floors - 1 || 1);
  const paving = mat(0xc9c4ba), white = mat(0xf4f1ea);
  const glass = new THREE.MeshPhongMaterial({color:0x8fb8c4, emissive:0x3a2a10, shininess:100});
  const retail = new THREE.MeshPhongMaterial({color:0xffd27a, emissive:0x6a4a10, shininess:60});
  const facade = mat(color);

  add(B(w + 4, 0.06, d + 4), paving, 0, 0.03, 0);

  // ground floor: tall glass shopfront with a continuous awning
  add(B(w, ground, d), facade, 0, ground/2, 0);
  for (const s of [-1, 1]) add(B(w - 1, ground - 0.6, 0.1), retail, 0, ground/2 - 0.1, s*(d/2 + 0.06));
  for (const s of [-1, 1]) add(B(0.1, ground - 0.6, d - 1), retail, s*(w/2 + 0.06), ground/2 - 0.1, 0);
  // awnings on both long sides
  for (const s of [-1, 1]) add(B(w - 2, 0.25, 1.3), mat(awning), 0, ground - 0.3, s*(d/2 + 0.7));

  // upper floors: windows banded across the facade
  const upperY0 = ground;
  add(B(w, resH, d), facade, 0, upperY0 + resH/2, 0);
  for (let i = 0; i < floors - 1; i++) {
    const y = upperY0 + 0.5 + i*FH;
    for (const s of [-1, 1]) add(B(w - 2.4, 1.4, 0.12), glass, 0, y + 0.7, s*(d/2 + 0.06));
    for (const s of [-1, 1]) add(B(0.12, 1.4, d - 2.4), glass, s*(w/2 + 0.06), y + 0.7, 0);
  }
  // thin floor-slab lines so the storeys read
  for (let i = 1; i < floors; i++) {
    const y = upperY0 + i*FH;
    add(B(w + 0.5, 0.18, d + 0.5), white, 0, y, 0);
  }
  // flat roof parapet + small AC/service plant
  add(B(w + 0.6, 0.7, d + 0.6), white, 0, h + 0.35, 0);
  add(B(5, 2.4, 3), mat(0x8f8a82), -w/2 + 5, h + 2, 0);

  k.g.position.copy(pos);
  return k.g;
}

// --- Shophouse row: 4-6 narrow 3-4 floor buildings side by side (classic Saigon) ---
// opts: {count=5, alongZ=true, unit=7, depth=10, floors=4}
export function shophouseRow(pos, opts = {}) {
  const count = opts.count ?? 5;
  const alongZ = opts.alongZ ?? true;
  const unit = opts.unit ?? 7, depth = opts.depth ?? 10;
  const floors = opts.floors ?? 4, FH = 3.3;
  const h = floors*FH;
  const k = kit(), {add, B, mat} = k;
  const facadeCols = [0xe8c37a, 0xd9a870, 0xc4885a, 0xb5a37a, 0xd4b89a, 0xe3cfa5, 0xaa8a65, 0xf0e2c2];
  const awningCols = [0x2f5d50, 0xc8344a, 0x1f2a44, 0x6fa58f, 0xe08a2e, 0x4a4a4a];
  const glass = new THREE.MeshPhongMaterial({color:0x8fb8c4, emissive:0x3a2a10, shininess:100});
  const sign = new THREE.MeshBasicMaterial({color:0xf1e6b8});
  const dark = mat(0x1f1a16), white = mat(0xf4efe4);
  const totalLen = count*unit;

  add(B(alongZ ? depth + 4 : totalLen + 4, 0.06, alongZ ? totalLen + 4 : depth + 4), mat(0xc9c4ba), 0, 0.03, 0);

  for (let i = 0; i < count; i++) {
    const t = -totalLen/2 + unit/2 + i*unit;   // offset along the row axis
    const [x, z] = alongZ ? [0, t] : [t, 0];
    const facade = mat(facadeCols[(i*3 + 1) % facadeCols.length]);
    const aw = mat(awningCols[(i*2 + 3) % awningCols.length]);

    // body
    add(B(alongZ ? depth : unit - 0.3, h, alongZ ? unit - 0.3 : depth), facade, x, h/2, z);
    // ground: wide shopfront (glazing) + awning on the street side
    const faceSign = alongZ ? depth/2 : unit/2 - 0.15;
    const faceDepth = alongZ ? depth : depth;
    // sides for the shop glazing: in the alongZ orientation the "front" is the +x face
    if (alongZ) {
      add(B(0.1, 2.6, unit - 1.5), glass, depth/2 + 0.06, 1.4, z);
      add(B(1.3, 0.2, unit - 2), aw, depth/2 + 0.7, 3.0, z);
      // signboard above the awning
      add(B(0.1, 0.9, unit - 2.5), sign, depth/2 + 0.08, 3.65, z);
    } else {
      add(B(unit - 1.5, 2.6, 0.1), glass, x, 1.4, depth/2 + 0.06);
      add(B(unit - 2, 0.2, 1.3), aw, x, 3.0, depth/2 + 0.7);
      add(B(unit - 2.5, 0.9, 0.1), sign, x, 3.65, depth/2 + 0.08);
    }
    // upper floors: tall narrow French-shutter windows + juliet balconies
    for (let f = 1; f < floors; f++) {
      const y = f*FH + 1.4;
      if (alongZ) {
        for (const wx of [-1.6, 1.6]) add(B(0.08, 1.8, 1.1), glass, depth/2 + 0.04, y, z + wx);
        add(B(0.12, 0.1, unit - 1.5), white, depth/2 + 0.1, y - 0.95, z);
        // juliet balcony railing
        add(B(0.08, 0.9, unit - 1.5), dark, depth/2 + 0.4, y - 0.5, z);
      } else {
        for (const wx of [-1.6, 1.6]) add(B(1.1, 1.8, 0.08), glass, x + wx, y, depth/2 + 0.04);
        add(B(unit - 1.5, 0.1, 0.12), white, x, y - 0.95, depth/2 + 0.1);
        add(B(unit - 1.5, 0.9, 0.08), dark, x, y - 0.5, depth/2 + 0.4);
      }
    }
    // roof parapet with slight varied height so the row isn't flat
    const roofH = 0.6 + ((i*7) % 5)*0.1;
    add(B(alongZ ? depth + 0.3 : unit - 0.1, roofH, alongZ ? unit - 0.1 : depth + 0.3), white, x, h + roofH/2, z);
  }

  k.g.position.copy(pos);
  return k.g;
}

// --- Central urban park: grass circle, pond, winding path, trees, benches ---
// opts: {radius=70}
export function park(pos, opts = {}) {
  const R = opts.radius ?? 70;
  const k = kit(), {add, B, mat} = k;
  const grass = mat(0x7fa358), path = mat(0xd8cfb8), bench = mat(0x6b4a33), stone = mat(0xcfc3ad);
  const water = new THREE.MeshPhongMaterial({color:0x3fc1d9, emissive:0x0b3a44, shininess:150});

  // base grass circle
  const base = new THREE.Mesh(new THREE.CircleGeometry(R, 48), grass);
  base.rotation.x = -Math.PI/2; base.position.y = 0.05; base.receiveShadow = true; k.g.add(base);

  // cross paths
  for (const [sx, sy] of [[1, 0], [0, 1]]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(sx ? R*2 - 10 : 4, sy ? R*2 - 10 : 4), path);
    m.rotation.x = -Math.PI/2; m.position.y = 0.08; k.g.add(m);
  }

  // pond slightly offset
  const pond = new THREE.Mesh(new THREE.CircleGeometry(R*0.25, 32), water);
  pond.rotation.x = -Math.PI/2; pond.position.set(R*0.22, 0.12, -R*0.18); k.g.add(pond);
  // pond rim (stone edging)
  const rim = new THREE.Mesh(new THREE.RingGeometry(R*0.25, R*0.27, 32), stone);
  rim.rotation.x = -Math.PI/2; rim.position.set(R*0.22, 0.13, -R*0.18); k.g.add(rim);

  // scattered trees (round canopies + cypresses)
  const trunkM = mat(0x6b4a33), leafM = mat(0x3f6e3a, {flatShading:true}), cypM = mat(0x2f5a33, {flatShading:true});
  const trees = [];
  for (let i = 0; i < 18; i++) {
    const a = Math.random()*Math.PI*2, r = R*(0.35 + Math.random()*0.55);
    const x = Math.cos(a)*r, z = Math.sin(a)*r;
    // keep clear of the paths and pond
    if (Math.abs(x) < 2.5 || Math.abs(z) < 2.5) continue;
    if (Math.hypot(x - R*0.22, z + R*0.18) < R*0.32) continue;
    trees.push([x, z, Math.random() < 0.7 ? 'r' : 'c']);
  }
  for (const [x, z, t] of trees) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 2.5, 6), trunkM);
    trunk.position.set(x, 1.25, z); trunk.castShadow = true; k.g.add(trunk);
    const crown = t === 'r'
      ? new THREE.Mesh(new THREE.IcosahedronGeometry(2.4, 0), leafM)
      : new THREE.Mesh(new THREE.ConeGeometry(1.1, 6.5, 7), cypM);
    crown.position.set(x, t === 'r' ? 3.9 : 4.8, z); crown.castShadow = true; k.g.add(crown);
  }

  // benches along the cross path
  for (const [bx, bz, rot] of [[-R*0.3, 2.2, 0], [R*0.3, 2.2, 0], [2.2, -R*0.4, Math.PI/2], [2.2, R*0.4, Math.PI/2]]) {
    const bg = new THREE.Group();
    bg.add(new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 0.5), bench));
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 0.08), bench); back.position.set(0, 0.35, -0.21); bg.add(back);
    for (const sx of [-0.9, 0.9]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.5), bench); leg.position.set(sx, -0.3, 0); bg.add(leg); }
    bg.position.set(bx, 0.55, bz); bg.rotation.y = rot;
    bg.children.forEach(c => c.castShadow = true);
    k.g.add(bg);
  }

  // central gazebo / pavilion
  const pav = new THREE.Group();
  const roof = new THREE.Mesh(new THREE.ConeGeometry(5, 2.8, 8), mat(0x8a4a3a));
  roof.position.y = 4.2; roof.castShadow = true; pav.add(roof);
  for (let i = 0; i < 6; i++) {
    const a = i/6*Math.PI*2;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 3.2, 8), stone);
    col.position.set(Math.cos(a)*3.6, 1.6, Math.sin(a)*3.6); col.castShadow = true; pav.add(col);
  }
  pav.add(new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.7, 0.4, 24), stone));
  pav.children[pav.children.length - 1].position.y = 0.2;
  pav.position.set(-R*0.25, 0, R*0.15);
  k.g.add(pav);

  k.g.position.copy(pos);
  return k.g;
}

// --- Open-air market: grid of colorful tarped stalls ---
// opts: {rows=3, cols=5}
export function market(pos, opts = {}) {
  const rows = opts.rows ?? 3, cols = opts.cols ?? 5;
  const stall = 3.2, aisle = 1.4;
  const sx = cols*stall + (cols - 1)*aisle, sz = rows*stall + (rows - 1)*aisle;
  const k = kit(), {add, B, mat} = k;
  const paving = mat(0xd8cfb8), poleM = mat(0x3a2a20), produceM = mat(0x7fa35b);
  const tarpCols = [0xd04b3c, 0x3c80bc, 0xf2b84a, 0x4a9b7b, 0xd47aa8, 0xf0f0ea, 0xc87a3a];

  add(B(sx + 6, 0.06, sz + 6), paving, 0, 0.03, 0);

  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = -sx/2 + stall/2 + c*(stall + aisle);
    const z = -sz/2 + stall/2 + r*(stall + aisle);
    const tarp = mat(tarpCols[(r*cols + c) % tarpCols.length]);
    // table (plywood on trestles)
    add(B(stall - 0.4, 0.1, stall - 0.4), mat(0xb08858), x, 0.85, z);
    for (const dx of [-1, 1]) for (const dz of [-1, 1])
      add(B(0.08, 0.8, 0.08), poleM, x + dx*(stall/2 - 0.5), 0.4, z + dz*(stall/2 - 0.5));
    // tarp roof (4 poles + sloped square)
    for (const dx of [-1, 1]) for (const dz of [-1, 1])
      add(B(0.08, 3.0, 0.08), poleM, x + dx*(stall/2 - 0.1), 1.5, z + dz*(stall/2 - 0.1));
    const t = add(B(stall, 0.08, stall), tarp, x, 3.0, z);
    t.rotation.x = ((r + c) % 2 ? -1 : 1)*0.08;   // slight slope so rain would run off
    // produce heaps on the table
    for (let i = 0; i < 4; i++) {
      const px = x + (Math.random() - 0.5)*(stall - 1), pz = z + (Math.random() - 0.5)*(stall - 1);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.25 + Math.random()*0.15, 10, 8), produceM);
      ball.position.set(px, 1.05, pz); ball.castShadow = true; k.g.add(ball);
    }
  }

  k.g.position.copy(pos);
  return k.g;
}

// --- Metro station: elevated platform with canopy + visible rails extending in Z ---
// opts: {alongZ=true, platformLen=40}
// Teaches: transit is the #1 real-world value driver.
export function metroStation(pos, opts = {}) {
  const alongZ = opts.alongZ ?? true;
  const L = opts.platformLen ?? 40;
  const k = kit(), {add, B, mat} = k;
  const concrete = mat(0xcfcfcf), rail = mat(0x8a8a90), roof = mat(0x3b4a52), accent = mat(0xe4572e);
  const glass = new THREE.MeshPhongMaterial({color:0x8fb8c4, emissive:0x2a2010, shininess:100});

  // paved base
  add(B(alongZ ? 16 : L, 0.06, alongZ ? L : 16), mat(0xc9c4ba), 0, 0.03, 0);

  // elevated platform (6 m above ground)
  const platformH = 6;
  add(B(alongZ ? 10 : L, 0.6, alongZ ? L : 10), concrete, 0, platformH, 0);

  // support columns at ends and middle
  for (const t of [-L/2 + 2, 0, L/2 - 2]) {
    const [cx, cz] = alongZ ? [0, t] : [t, 0];
    add(B(1.4, platformH, 1.4), concrete, cx, platformH/2, cz);
  }

  // canopy roof above the platform
  add(B(alongZ ? 11 : L - 2, 0.3, alongZ ? L - 2 : 11), roof, 0, platformH + 3.2, 0);
  for (const t of [-L/2 + 4, L/2 - 4]) {
    const [cx, cz] = alongZ ? [0, t] : [t, 0];
    add(B(0.4, 3.2, 0.4), rail, cx, platformH + 1.5, cz);
  }

  // orange accent stripe (station identity)
  add(B(alongZ ? 11.2 : L - 2, 0.4, alongZ ? L - 2 : 11.2), accent, 0, platformH + 0.9, 0);

  // one metro car on the platform
  const carL = 18, carH = 2.6, carW = 2.6;
  const bodyM = new THREE.MeshPhongMaterial({color:0xe4572e, specular:0xffffff, shininess:130});
  add(B(alongZ ? carW : carL, carH, alongZ ? carL : carW), bodyM, 0, platformH + 1.9, 0);
  add(B(alongZ ? carW - 0.2 : carL - 1, 1.1, alongZ ? carL - 1 : carW - 0.2), glass, 0, platformH + 2.4, 0);

  // rails extending in both directions beyond the platform (symbol of line continuing)
  const railL = 50;
  for (const side of [-1, 1]) {
    const t = side*(L/2 + railL/2);
    const [rx, rz] = alongZ ? [0, t] : [t, 0];
    for (const r of [-1, 1]) {
      const [ox, oz] = alongZ ? [r*0.7, 0] : [0, r*0.7];
      add(B(alongZ ? 0.1 : railL, 0.15, alongZ ? railL : 0.1), rail, rx + ox, platformH - 0.4, rz + oz);
    }
    // concrete sleeper ribbon
    add(B(alongZ ? 2 : railL, 0.1, alongZ ? railL : 2), concrete, rx, platformH - 0.6, rz);
  }

  // "M" sign on top (orange disc)
  const sign = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.3, 16), bodyM);
  sign.position.set(0, platformH + 5.5, 0); sign.castShadow = true; k.g.add(sign);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 2.3, 8), mat(0x4a4d52));
  pole.position.set(0, platformH + 4.2, 0); k.g.add(pole);

  k.g.position.copy(pos);
  return k.g;
}

// --- University: U-shaped academic building around a lawn, with a library tower ---
// opts: {w=50, d=50}. Teaches: education hubs drive demand.
export function university(pos, opts = {}) {
  const w = opts.w ?? 50, d = opts.d ?? 50;
  const k = kit(), {add, B, mat} = k;
  const brick = mat(0xa05b45), stone = mat(0xe4ded3), roof = mat(0x4a4a4a), lawn = mat(0x6fa24f);
  const glass = new THREE.MeshPhongMaterial({color:0x8fb8c4, emissive:0x2a2010, shininess:100});
  const wood = mat(0x8a5a3b);

  // base pad
  add(B(w, 0.06, d), mat(0xd8d1c4), 0, 0.03, 0);

  // central lawn (quad)
  add(B(w*0.5, 0.08, d*0.4), lawn, 0, 0.1, 2);

  // Three sides of the U (back + two wings)
  const wing = 10, floors = 3, floorH = 3.6, buildingH = floors*floorH;
  // Back (north wall)
  add(B(w - 2, buildingH, wing), brick, 0, buildingH/2, -d/2 + wing/2 + 1);
  // Left wing
  add(B(wing, buildingH, d - wing - 2), brick, -w/2 + wing/2 + 1, buildingH/2, 2);
  // Right wing
  add(B(wing, buildingH, d - wing - 2), brick, w/2 - wing/2 - 1, buildingH/2, 2);

  // Stone cornerstones + roof trim
  for (const sx of [-1, 1]) add(B(2, buildingH + 0.6, 2), stone, sx*(w/2 - 1), buildingH/2, -d/2 + 1);
  add(B(w - 1, 0.6, wing + 0.3), stone, 0, buildingH + 0.3, -d/2 + wing/2 + 1);
  add(B(wing + 0.3, 0.6, d - wing - 1.7), stone, -w/2 + wing/2 + 1, buildingH + 0.3, 2);
  add(B(wing + 0.3, 0.6, d - wing - 1.7), stone, w/2 - wing/2 - 1, buildingH + 0.3, 2);

  // Grid of windows per floor
  for (let f = 0; f < floors; f++) {
    const y = f*floorH + 1.9;
    for (let x = -w/2 + 6; x <= w/2 - 6; x += 4) add(B(1.5, 1.6, 0.1), glass, x, y, -d/2 + wing + 0.6);
    for (let z = -d/2 + wing + 4; z <= d/2 - 2; z += 4) {
      add(B(0.1, 1.6, 1.5), glass, -w/2 + wing + 0.6, y, z);
      add(B(0.1, 1.6, 1.5), glass, w/2 - wing - 0.6, y, z);
    }
  }

  // Entrance portico at the open (south) side — four stone columns + gable
  for (let i = 0; i < 4; i++) add(new THREE.CylinderGeometry(0.6, 0.7, 7, 12), stone, -4.5 + i*3, 3.5, d/2 - 4);
  add(B(13, 0.9, 2.5), stone, 0, 7.4, d/2 - 4);
  const gable = new THREE.Mesh(new THREE.ConeGeometry(7.2, 2.6, 3), roof); gable.rotation.y = Math.PI/2; gable.position.set(0, 9.2, d/2 - 4); gable.castShadow = true; k.g.add(gable);

  // Library tower at the center-back (clock face as a plain disc for charm)
  const towerH = buildingH + 12, towerW = 10;
  add(B(towerW, towerH, towerW), brick, 0, towerH/2, -d/2 + wing/2 + 1);
  add(B(towerW + 1, 0.8, towerW + 1), stone, 0, towerH + 0.4, -d/2 + wing/2 + 1);
  const spire = new THREE.Mesh(new THREE.ConeGeometry(towerW*0.6, 5, 8), roof); spire.position.set(0, towerH + 3.3, -d/2 + wing/2 + 1); spire.castShadow = true; k.g.add(spire);
  // clock face
  const clock = new THREE.Mesh(new THREE.CircleGeometry(1.8, 24), stone); clock.position.set(0, towerH - 4, -d/2 + wing + 0.1); k.g.add(clock);
  for (let i = 0; i < 12; i++) {
    const a = i/12*Math.PI*2;
    add(B(0.15, 0.4, 0.1), roof, Math.cos(a)*1.5, towerH - 4 + Math.sin(a)*1.5, -d/2 + wing + 0.2);
  }

  // Trees in the quad corners
  const trunkM = mat(0x6b4a33), leafM = mat(0x4f8a45, {flatShading:true});
  for (const [tx, tz] of [[-w*0.3, d*0.15], [w*0.3, d*0.15], [-w*0.2, d*0.3], [w*0.2, d*0.3]]) {
    add(new THREE.CylinderGeometry(0.25, 0.35, 3.2, 7), trunkM, tx, 1.6, tz);
    add(new THREE.IcosahedronGeometry(2.4, 0), leafM, tx, 4.5, tz);
  }

  k.g.position.copy(pos);
  return k.g;
}

// --- Shopping mall: low-rise glass-fronted retail with parking lot ---
// opts: {w=45, d=35}. Teaches: convenience premium.
export function shoppingMall(pos, opts = {}) {
  const w = opts.w ?? 45, d = opts.d ?? 35;
  const k = kit(), {add, B, mat} = k;
  const facade = mat(0xe6dcc8), roof = mat(0x4a4f57), parkM = mat(0x55595c), stripe = mat(0xffe066), accent = mat(0xd04b3c);
  const glass = new THREE.MeshPhongMaterial({color:0x8fb8c4, emissive:0x8a5a20, shininess:100});

  // paved pad
  add(B(w + 10, 0.06, d + 10), mat(0xc9c4ba), 0, 0.03, 0);

  // mall body (3 floors)
  const floors = 3, FH = 4, mallH = floors*FH;
  add(B(w, mallH, d), facade, 0, mallH/2, 0);
  // continuous glass storefront
  for (let f = 0; f < floors; f++) {
    const y = f*FH + FH/2;
    add(B(w - 4, FH - 1, 0.1), glass, 0, y, d/2 + 0.06);
  }
  // flat roof + rooftop AC units
  add(B(w + 1, 0.8, d + 1), roof, 0, mallH + 0.4, 0);
  for (const t of [-w/3, 0, w/3]) add(B(5, 1.6, 3), mat(0x9a9890), t, mallH + 1.6, 0);

  // Entry canopy
  add(B(w*0.4, 0.5, 3), roof, 0, FH - 0.5, d/2 + 1.6);
  add(B(w*0.4, 0.4, 0.2), stripe, 0, FH - 0.3, d/2 + 3);

  // Big logo sign on the roof
  const signPanel = new THREE.Mesh(new THREE.BoxGeometry(w*0.5, 2.2, 0.3), accent);
  signPanel.position.set(0, mallH + 1.9, 0); signPanel.castShadow = true; k.g.add(signPanel);

  // Parking lot in front
  const parkW = w + 8, parkD = 10;
  add(B(parkW, 0.08, parkD), parkM, 0, 0.07, d/2 + 6);
  // Painted stripes
  for (let x = -parkW/2 + 2.5; x <= parkW/2 - 2.5; x += 2.8) add(B(0.08, 0.02, parkD - 1), stripe, x, 0.12, d/2 + 6);

  // A few parked cars (simplified blocks)
  const carMs = [mat(0x3e8ed0), mat(0xe4572e), mat(0xf5b700), mat(0x2f8a5b), mat(0xf2efe8)];
  for (let i = 0; i < 6; i++) {
    const cx = -parkW/2 + 3 + i*(parkW/6);
    add(B(2.3, 1.2, 4.6), carMs[i % carMs.length], cx, 0.7, d/2 + 6);
    add(B(1.6, 0.7, 3.2), new THREE.MeshPhongMaterial({color:0x10161c, shininess:150}), cx, 1.4, d/2 + 6);
  }

  k.g.position.copy(pos);
  return k.g;
}

// --- Scooter cluster: parked motorbikes in a row (very Saigon) ---
// opts: {count=10, alongX=true, color=0xc4443b}
export function scooters(pos, opts = {}) {
  const count = opts.count ?? 10, alongX = opts.alongX ?? true;
  const k = kit(), {add, B, mat} = k;
  const paving = mat(0xc9c4ba);
  const colors = [0xc4443b, 0x1f2a44, 0xe6b84a, 0xf2efe8, 0x4a4a4a, 0x3e8ed0, 0x2f8a5b];
  const chrome = new THREE.MeshPhongMaterial({color:0xd9dde2, specular:0xffffff, shininess:200});
  const tyre = mat(0x1a1a1a);
  const bikeSpacing = 0.9;
  const totalLen = count*bikeSpacing;

  add(B(alongX ? totalLen + 1.6 : 2.6, 0.05, alongX ? 2.6 : totalLen + 1.6), paving, 0, 0.03, 0);

  for (let i = 0; i < count; i++) {
    const t = -totalLen/2 + bikeSpacing/2 + i*bikeSpacing;
    const g = new THREE.Group();
    const paint = new THREE.MeshPhongMaterial({color:colors[(i*3 + 1) % colors.length], specular:0xffffff, shininess:120});
    // seat and tank
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 0.3), paint); body.position.y = 0.6; g.add(body);
    const tank = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.32), paint); tank.position.set(0.3, 0.75, 0); g.add(tank);
    // handlebars
    const hb = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.7), chrome); hb.position.set(0.7, 0.9, 0); g.add(hb);
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.5), new THREE.MeshPhongMaterial({color:0x0e1418, shininess:160}));
    screen.position.set(0.78, 1.15, 0); g.add(screen);
    // wheels
    const wheelGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.14, 16); wheelGeo.rotateX(Math.PI/2);
    for (const wx of [-0.6, 0.6]) {
      const w = new THREE.Mesh(wheelGeo, tyre); w.position.set(wx, 0.26, 0); w.castShadow = true; g.add(w);
    }
    // kickstand lean
    g.rotation.z = -0.12;
    g.position.set(alongX ? t : 0, 0.08, alongX ? 0 : t);
    g.rotation.y = alongX ? 0 : Math.PI/2;
    g.children.forEach(c => c.castShadow = true);
    k.g.add(g);
  }

  k.g.position.copy(pos);
  return k.g;
}
