// Sài Gòn Island — the starter city.
//
// Pure data. No THREE imports.
// To add another city, copy this file and change the numbers.
// landmarks are [x, y, z] triples; prebuilt is a list of makers to call at boot.

import { PLATEAU_H, Y0g, PAD_H } from '../../constants.js';

const ROOF_Y = 84.2;   // top of the penthouse tower (lobby 5m + 24 floors × 3.3m)

const landmarks = {
  HOUSE:    [27.5,  Y0g, 27.5],
  TOWER:    [-27.5, Y0g, 27.5],
  PENT:     [-27.5, Y0g + ROOF_Y, 27.5],
  L81:      [27.5,  Y0g, -27.5],
  APTS:     [-51.25,Y0g, -51.25],
  SCHOOL:   [75,    Y0g, 75],
  HOSPITAL: [75,    Y0g, -75],
  FOOD:     [27.5,  Y0g, 75],
  PAD:      [0,     PAD_H, 660],
  SEDAN:    [27.5 - 12.5, Y0g, 27.5 + 3],
  GT:       [-27.5 + 2, Y0g + 0.06, 27.5 + 14],
  TOWNHOUSE:[-75,  Y0g, 125],
  FAMILY:   [-27.5,Y0g, 125],
  ESTATE:   [27.5, Y0g, 125],
  MANSION:  [75,   Y0g, 125],
};

const plotCoords = [
  [75,27.5],[75,-27.5],[-75,27.5],[-27.5,75],[-75,75],[27.5,-75],[125,27.5],[125,-27.5],
  [125,75],[125,-75],[-125,27.5],[-125,-27.5],[-125,75],[-125,-75],[125,125],[-125,125],
  [27.5,-125],[-27.5,-125],[75,-125],[-75,-125],[125,-125],[-125,-125],
];

// Procedural DEF entries get accumulated as fillPlateau runs, then merged into DEF
// in resolveCatalog. Must be declared before `prebuilt` because the array literal
// below immediately calls fillPlateau during module init.
const procDef = {};

// prebuilt entries each reference a maker key registered in world/makers/landmarks.js.
// `at` can be a landmark name (string) or a raw [x, y, z] triple for one-off placements.
// `opts` is passed through to the maker — see each maker's doc comment for fields.
// Procedural entries also carry `asset:id`; city.js tags the group so clicks open the sheet.
const prebuilt = [
  // --- the hero landmarks (buyable or clickable) ---
  {maker:'villa',       at:'HOUSE'},
  {maker:'towerPH',     at:'TOWER'},
  {maker:'l81',         at:'L81'},
  {maker:'apts4',       at:'APTS'},
  {maker:'sedan',       at:'SEDAN'},
  {maker:'gt',          at:'GT'},
  {maker:'school',      at:'SCHOOL'},
  {maker:'hospital',    at:'HOSPITAL'},
  {maker:'food',        at:'FOOD'},
  {maker:'trophy',      at:'PAD'},
  {maker:'clifftopRoad'},
  {maker:'townhouse',   at:'TOWNHOUSE'},
  {maker:'family',      at:'FAMILY'},
  {maker:'estate',      at:'ESTATE'},
  {maker:'mansion',     at:'MANSION'},

  // --- Infrastructure that lifts nearby rents (see cityAmenities below) ---
  {maker:'metroStation', at:[25, Y0g, -175], opts:{alongZ:true}},     // D10 — south of L81
  {maker:'university',   at:[-125, Y0g, 125], opts:{w:50, d:50}},     // D3 — west of TOWER
  {maker:'shoppingMall', at:[175, Y0g, 25],  opts:{w:45, d:35}},      // D4 — east of HOUSE

  // --- Civic amenities (positioned on block centres, sized to fit a 40 m block) ---
  {maker:'park',         at:[25, Y0g, 175], opts:{radius:18}},
  {maker:'market',       at:[125, Y0g, 175], opts:{rows:3, cols:5}},

  // --- Street scenes: parked scooters at kerb edges (sit next to the asphalt) ---
  {maker:'scooters',     at:[-25, Y0g, 25], opts:{count:12, alongX:true}},
  {maker:'scooters',     at:[ 25, Y0g, 25], opts:{count:12, alongX:true}},
  {maker:'scooters',     at:[ 75, Y0g, 175], opts:{count:10, alongX:true}},
  {maker:'scooters',     at:[-75, Y0g, -75], opts:{count:10, alongX:true}},

  // --- Procedural density: fill every empty block centre across the whole mainland ---
  // Core (≤325 m) dense; mainland (350–1500 m) half density. Buildings always sit between
  // streets (centres at ±25, ±75, ±125…), never on top of them.
  ...fillPlateau(1, 325),       // stride 1 = every block
  ...fillPlateau(2, 1500, 350), // stride 2 = every other block (coarser)
];

// Deterministic PRNG so the city layout is stable between refreshes.
function mulberry32(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Place a building at every block centre within `radius` (and beyond `inner`) that isn't
// already occupied by a landmark, plot, or civic amenity. Block centres are at ±25, ±75,
// ±125… (midway between the streets at 0, 50, 100…) — buildings never sit on asphalt.
// `stride` = 1 fills every block; 2 fills every other block (coarser mainland density).
function fillPlateau(stride, radius, inner = 0) {
  const rand = mulberry32(42 + stride + inner);
  // Give every procedural building a unique id based on its (x, z).
  const idFor = (type, x, z) => `${type}_${x < 0 ? 'n' : ''}${Math.abs(x)}_${z < 0 ? 'n' : ''}${Math.abs(z)}`;
  // Register a procedural DEF entry alongside the prebuilt. Returns the id to tag onto the maker group.
  const register = (type, x, z, opts) => {
    const id = idFor(type, x, z);
    const h = opts.h ?? (type === 'shophouseRow' ? (opts.floors ?? 4)*3.3 : 20);
    const icon = {officeTower:'🏢', midrise:'🏬', shophouseRow:'🏘️'}[type];
    const name = {officeTower:'Office tower', midrise:'Mid-rise building', shophouseRow:'Shophouse row'}[type];
    // Price per metre of height × building footprint factor (bigger w/count → more units sold).
    const scale = type === 'officeTower' ? (opts.w ?? 24)/24
                : type === 'midrise'     ? (opts.w ?? 26)*(opts.d ?? 16)/(26*16)
                                         : (opts.count ?? 5)/5;
    const price = Math.round(h * (type === 'officeTower' ? 120000 : type === 'midrise' ? 60000 : 25000) * scale / 1000)*1000;
    const earn  = Math.round(price * (type === 'officeTower' ? 0.0075 : 0.0055) / 100)*100;
    procDef[id] = {
      name:`${name} at (${x}, ${z})`,
      icon, kind:'home',
      price, earn,
      at:[x, Y0g, z], h,
      procedural:true,
      blurb:`${name === 'Office tower' ? 'An office tower in the CBD. Companies rent floors from you.' : name === 'Mid-rise building' ? 'A mid-rise with shops below and apartments above.' : 'A row of narrow shophouses; tenants live upstairs and run small businesses downstairs.'}`,
    };
    return id;
  };

  // Occupied cells = anything within ~30 m of an existing landmark / plot / amenity centre.
  // The 30 m threshold matches a half-block + a safety margin, so adjacent blocks are free.
  const occupied = [];
  for (const name of Object.keys(landmarks)) occupied.push([landmarks[name][0], landmarks[name][2]]);
  for (const [x, z] of plotCoords) occupied.push([x, z]);
  // APTS is a 2×2 tower cluster, extra blocks sit under its paving
  for (const [dx, dz] of [[-27.5, -27.5], [-27.5, 27.5], [27.5, -27.5], [27.5, 27.5]])
    occupied.push([-51.25 + dx, -51.25 + dz]);
  // Civic amenities + infrastructure placed above (keep in sync when their positions change)
  occupied.push([25, 175], [125, 175]);
  occupied.push([25, -175], [-125, 125], [175, 25]);   // metro station · university · mall
  const tooClose = (x, z) => occupied.some(([ox, oz]) => Math.hypot(x - ox, z - oz) < 30);

  // Build the list of block centres: {25, -25, 75, -75, 125, -125, ...}.
  const centres = [];
  for (let i = 0; (25 + i*50) <= radius; i++) {
    if (i % stride !== 0) continue;
    centres.push(25 + i*50, -(25 + i*50));
  }

  const entries = [];
  for (const x of centres) for (const z of centres) {
    const r = Math.hypot(x, z);
    if (r > radius || r < inner) continue;
    // Match the street-grid bounds (roads.js: X ±1600, Z −1600..200). Last valid block centre
    // on the north edge is 175 (between the streets at 150 and 200); buildings beyond that
    // would have no road on their north side.
    if (z > 175 || z < -1575 || x > 1575 || x < -1575) continue;
    if (tooClose(x, z)) continue;
    const roll = rand();
    const officePal = [0x6b8698, 0x4a6a88, 0x8b7c5e, 0xa8947c, 0x5b7d8f, 0x7a9088, 0x4f6a5c, 0x8a7a6b, 0x6a7a94, 0x7f6f5a];
    const push = (type, opts) => entries.push({maker:type, at:[x, Y0g, z], opts, asset:register(type, x, z, opts)});
    if (r < 300) {
      const h = 55 + Math.floor(rand()*75), w = 20 + Math.floor(rand()*8);
      push('officeTower', {h, w, color:officePal[Math.floor(rand()*officePal.length)], crown: h > 60});
    } else if (r < 600) {
      if (roll < 0.15) {
        const h = 40 + Math.floor(rand()*40);
        push('officeTower', {h, w:22, color:officePal[Math.floor(rand()*officePal.length)]});
      } else if (roll < 0.65) {
        const h = 20 + Math.floor(rand()*18);
        const palette = [0xe6dcc8, 0xdccfb0, 0xd9c89a, 0xeadfc3, 0xe3cfa5, 0xc9b58a];
        const aw = [0xc8344a, 0x2f5d50, 0xe08a2e, 0x4a6a88, 0x6fa58f];
        push('midrise', {h, floors:Math.max(4, Math.round(h/3.5)), color:palette[Math.floor(rand()*palette.length)], awning:aw[Math.floor(rand()*aw.length)]});
      } else {
        push('shophouseRow', {count:4 + Math.floor(rand()*2), alongZ:rand() < 0.5, floors:3 + Math.floor(rand()*2)});
      }
    } else {
      if (roll < 0.65) {
        push('shophouseRow', {count:4 + Math.floor(rand()*2), alongZ:rand() < 0.5, floors:3});
      } else {
        const h = 16 + Math.floor(rand()*8);
        push('midrise', {h, floors:Math.max(4, Math.round(h/3.5))});
      }
    }
  }
  return entries;
}

// Every block centre that nothing else uses becomes a buyable plot too.
// These "ambient" plots have no sign or green pad — the user clicks the grass to buy them.
// Keeps the shop list tidy while still answering "can I buy this empty block?" with yes.
const extraPlots = (() => {
  const taken = new Set();
  const key = (x, z) => `${x},${z}`;
  for (const name of Object.keys(landmarks)) {
    const [lx, , lz] = landmarks[name];
    // mark the single nearest block centre for each landmark/amenity
    const cx = Math.sign(lx || 1) * (Math.floor(Math.abs(lx)/50)*50 + 25);
    const cz = Math.sign(lz || 1) * (Math.floor(Math.abs(lz)/50)*50 + 25);
    taken.add(key(cx, cz));
  }
  for (const [px, pz] of plotCoords) {
    const cx = Math.sign(px || 1) * (Math.floor(Math.abs(px)/50)*50 + 25);
    const cz = Math.sign(pz || 1) * (Math.floor(Math.abs(pz)/50)*50 + 25);
    taken.add(key(cx, cz));
  }
  // APTS footprint
  for (const [dx, dz] of [[-27.5,-27.5],[-27.5,27.5],[27.5,-27.5],[27.5,27.5]]) {
    const bx = Math.sign(-51.25+dx) * (Math.floor(Math.abs(-51.25+dx)/50)*50 + 25);
    const bz = Math.sign(-51.25+dz) * (Math.floor(Math.abs(-51.25+dz)/50)*50 + 25);
    taken.add(key(bx, bz));
  }
  // civic amenities
  taken.add(key(25, 175)); taken.add(key(125, 175));
  // every prebuilt building (procedural or explicit) with a raw [x,y,z]
  for (const e of prebuilt) {
    if (!Array.isArray(e.at)) continue;
    taken.add(key(e.at[0], e.at[2]));
  }
  // Iterate every block centre on the mainland and keep the ones nothing claimed.
  const out = [];
  for (let i = 0; (25 + i*50) <= 1575; i++) {
    for (const sx of [1, -1]) {
      const x = sx*(25 + i*50);
      // j goes high enough to reach z=-1575 (south edge). The bounds check inside drops any
      // block north of z=175 (sea cutoff) and east/west beyond ±1575.
      for (let j = 0; (25 + j*50) <= 1575; j++) {
        for (const sz of [1, -1]) {
          const z = sz*(25 + j*50);
          if (z > 175 || z < -1575 || x > 1575 || x < -1575) continue;
          if (taken.has(key(x, z))) continue;
          out.push([x, z]);
        }
      }
    }
  }
  return out;
})();

// Fixed city infrastructure that lifts nearby property values (regardless of ownership).
// `b` is the max boost at the amenity's position; it fades to 0 at FAR metres away.
// Order of impact matches real-world data: transit > schools > mixed amenities > hospitals.
const cityAmenities = [
  {name:'Metro station',  x:  25, z: -175, b: 0.20},   // transit — the biggest driver
  {name:'School',          x:  75, z:   75, b: 0.15},   // the pre-built hero school
  {name:'University',      x:-125, z:  125, b: 0.12},
  {name:'Park',            x:  25, z:  175, b: 0.15},
  {name:'Hospital',        x:  75, z:  -75, b: 0.10},
  {name:'Shopping mall',   x: 175, z:   25, b: 0.08},
  {name:'Food district',   x:  27.5, z: 75, b: 0.07},   // Ember & Salt + Slow Drip café block
  {name:'Market',          x: 125, z:  175, b: 0.05},
];

// Districts: 6 columns × 3 rows across the mainland rectangle.
// Row heights are tuned (not equal) so each district carries ~30–70 buildings — the dense
// city centre becomes short rows with same col count; sparse outer south becomes taller rows.
// Numbered left-to-right, top-to-bottom → D1..D18. D3/D4 cover the central landmarks.
const DISTRICT_COLS = 6;
const DISTRICT_X_MIN = -1600, DISTRICT_X_MAX = 1600;
const DISTRICT_W = (DISTRICT_X_MAX - DISTRICT_X_MIN) / DISTRICT_COLS;   // 533.3 m
// Row z-bands: 4 rows total. Dense core (z: ±200) is split into two 200-m-tall rows so
// each district carries 30–50 buildings instead of 80+. Outer rows are wider.
const DISTRICT_ROW_Z = [
  {zMax: 200,   zMin: 0},       // row 0: 200 m, dense core north
  {zMax: 0,     zMin: -200},    // row 1: 200 m, dense core south
  {zMax: -200,  zMin: -800},    // row 2: 600 m, mid-ring
  {zMax: -800,  zMin: -1600},   // row 3: 800 m, sparse south
];

const districts = (() => {
  const out = [];
  let n = 1;
  for (const row of DISTRICT_ROW_Z) {
    const h = row.zMax - row.zMin;
    for (let c = 0; c < DISTRICT_COLS; c++) {
      const x = DISTRICT_X_MIN + c*DISTRICT_W;
      out.push({
        id: 'D' + n,
        name: 'D' + n,
        x, z: row.zMin,
        w: DISTRICT_W, h,
        cx: x + DISTRICT_W/2,
        cz: row.zMin + h/2,
      });
      n++;
    }
  }
  return out;
})();

// Which district contains (x, z)? Falls back to D4 (central) for points off the grid.
function districtAt(x, z) {
  for (const d of districts) {
    if (x >= d.x && x < d.x + d.w && z >= d.z && z < d.z + d.h) return d.id;
  }
  return 'D4';
}

// Pick-tagging: existing scene groups (made by prebuilt) whose click should open an asset.
// Each entry: landmark name → asset id (or {disambiguate:(point)=>id} for shared blocks).
const pickTags = [
  {at:'HOUSE', asset:'villa'},
  {at:'TOWER', asset:'penthouse'},
  {at:'L81',   asset:'l81'},
  {at:'FOOD',  asset:'food'},   // disambiguated by click z vs FOOD.z → restaurant / cafe
  {at:[-27.5,Y0g,-27.5], asset:'apt'},
  {at:[-75,  Y0g,-27.5], asset:'apt'},
  {at:[-27.5,Y0g,-75],   asset:'apt'},
  {at:[-75,  Y0g,-75],   asset:'apt'},
];

export default {
  id:'vn', name:'Sài Gòn Island',
  terrain: {
    size: 4000, seg: 400,
    plateauR: 550, plateauH: PLATEAU_H, waterH: 0,
    padX: 0, padZ: 660, padR: 72, padH: PAD_H,
  },
  roads: [{
    name:'clifftop',
    curve:[[0,530],[90,550],[145,600],[125,652],[74,662]],
    width: 9,
  }],
  landmarks,
  plotCoords,
  prebuilt,
  pickTags,
  procDef,       // extra DEF entries for every procedural building
  extraPlots,    // every remaining empty block (procedurally generated, click-to-buy only)
  districts,     // 18 districts carving the city into 40–60-building chunks
  districtAt,    // (x, z) → district id; used by assets.js resolveCatalog
  cityAmenities, // fixed infrastructure that lifts nearby property values
};
