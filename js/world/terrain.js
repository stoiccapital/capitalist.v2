// Procedural island terrain, water, plot grid.
// buildTerrain(city) is called once at boot. regen() reseeds the noise and rebuilds the mesh.
import { scene } from './scene.js';

const colors = {
  sand:    new THREE.Color(0xd9c89a),
  grass:   new THREE.Color(0x7fa35b),
  meadow:  new THREE.Color(0x9bb86a),
  forest:  new THREE.Color(0x4f7a45),
  rock:    new THREE.Color(0x8a8378),
  snow:    new THREE.Color(0xf2f2ee),
  plateau: new THREE.Color(0xa9bf78),
};

let perm;
function seedNoise() {
  perm = new Uint8Array(512);
  const p = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
}
const fade = t => t*t*(3 - 2*t);
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const h = (a, b) => perm[(perm[a & 255] + b) & 255]/255;
  const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
  const u = fade(xf), v = fade(yf);
  return a + (b - a)*u + (c - a)*v + (a - b - c + d)*u*v;
}
function fbm(x, y) {
  let s = 0, amp = 1, f = 1, n = 0;
  for (let o = 0; o < 5; o++) { s += vnoise(x*f, y*f)*amp; n += amp; amp *= .5; f *= 2; }
  return s/n;
}
const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0)/(e1 - e0))); return t*t*(3 - 2*t); };

// Road height along the clifftop curve: linearly rises from plateau to pad.
export let roadNearFn = null;   // set by roads.js once it builds the curve
export function setRoadNear(fn) { roadNearFn = fn; }
export let roadHFn = null;
export function setRoadH(fn) { roadHFn = fn; }

let terrain, water, grid, cityCfg;

// Terrain model (continent-with-coast):
//   The pad landmark sits on a cliff above the sea (+z direction). We treat +z as "north".
//   On the north hemisphere beyond the plateau we keep the island cliffs & sea.
//   On the south/east/west we extend flat land out to the plane edges — the city grid lives here.
//   `northness` (0..1) picks which rule applies based on direction from origin.
function heightAt(x, z) {
  const d = Math.hypot(x, z);
  const {size, plateauR, plateauH, padR, padX, padZ, padH} = cityCfg.terrain;

  // --- island (sea-side) height, same as the original ---
  let hSea = fbm(x*0.0016 + 50, z*0.0016 + 50);
  hSea = Math.pow(hSea, 1.6)*260 - 25;
  hSea -= smooth(size*0.32, size*0.5, d)*100;

  // --- mainland height: flat at plateauH with mild undulation ---
  const hCityNoise = fbm(x*0.003 + 100, z*0.003 + 100);
  const hCity = plateauH + (hCityNoise - 0.5)*4;

  // Blend: north pointing (+z) → island rules, south/east/west → mainland.
  const northness = d > 1 ? Math.max(0, z/d) : 0;
  const seaBlend = northness * smooth(plateauR*0.9, plateauR*1.4, d);
  let y = hCity*(1 - seaBlend) + hSea*seaBlend;

  // Keep a flat core wherever city grid lives — larger extent on the mainland side.
  const flatR = plateauR + (1 - northness)*800;   // 550 at pure north, ~1350 south/east/west
  const kFlat = smooth(flatR - 50, flatR, d);
  y = plateauH*(1 - kFlat) + y*kFlat;

  // Clifftop pad (unchanged, overrides whatever is beneath).
  const kp = smooth(padR, padR + 70, Math.hypot(x - padX, z - padZ));
  y = y*kp + padH*(1 - kp);

  // Clifftop road to the palace.
  if (!roadNearFn || x < -35 || x > 190 || z < 495 || z > 700) return y;
  const rn = roadNearFn(x, z), kr = smooth(6, 24, rn.d);
  return y*kr + roadHFn(rn.s)*(1 - kr);
}

function colorFor(h, d, slope, plateauR, z) {
  // On the mainland (not pointing north), stay plateau green regardless of distance.
  const northness = d > 1 ? Math.max(0, z/d) : 0;
  if (northness < 0.25 || d < plateauR + 10) return colors.plateau.clone();
  if (h < 3) return colors.sand.clone();
  if (slope > 0.9 || h > 100) return h > 140 ? colors.snow.clone() : colors.rock.clone();
  if (h > 45) return colors.forest.clone();
  return colors.grass.clone().lerp(colors.meadow, Math.random()*0.5);
}

export function regenTerrain() {
  if (terrain) { scene.remove(terrain); terrain.geometry.dispose(); }
  seedNoise();
  const {size, seg, plateauR, padR, padX, padZ} = cityCfg.terrain;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI/2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, heightAt(pos.getX(i), pos.getZ(i)));
  const flat = geo.toNonIndexed();
  const p = flat.attributes.position, col = new Float32Array(p.count*3);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
    n.subVectors(c, b).cross(a.clone().sub(b)).normalize();
    const cy = (a.y + b.y + c.y)/3, cx = (a.x + b.x + c.x)/3, cz = (a.z + b.z + c.z)/3;
    const col3 = Math.hypot(cx - padX, cz - padZ) < padR + 4
      ? colors.plateau.clone()
      : colorFor(cy, Math.hypot(cx, cz), 1 - Math.abs(n.y)*1.0 + 0.3, plateauR, cz);
    for (let k = 0; k < 3; k++) { col[(i + k)*3] = col3.r; col[(i + k)*3 + 1] = col3.g; col[(i + k)*3 + 2] = col3.b; }
  }
  flat.setAttribute('color', new THREE.BufferAttribute(col, 3));
  flat.computeVertexNormals();
  terrain = new THREE.Mesh(flat, new THREE.MeshLambertMaterial({vertexColors:true, flatShading:true}));
  terrain.receiveShadow = true; terrain.castShadow = true;
  scene.add(terrain);
}

export function waterMesh() { return water; }

export function buildTerrain(city) {
  cityCfg = city;
  // regenTerrain runs later (after roads.js sets the roadNear/roadH functions)

  const {waterH} = city.terrain;
  water = new THREE.Mesh(
    new THREE.CircleGeometry(8000, 96),
    new THREE.MeshPhongMaterial({color:0x3f86a8, transparent:true, opacity:.85, shininess:80}),
  );
  water.rotation.x = -Math.PI/2; water.position.y = waterH; scene.add(water);

  // plot grid lines on plateau (future city blocks preview)
  const g = new THREE.Group(), step = 10, {plateauR, plateauH} = city.terrain, r = plateauR - 3;
  const mat = new THREE.LineBasicMaterial({color:0x2f5d50, transparent:true, opacity:.22});
  for (let v = -r; v <= r; v += step) {
    const half = Math.sqrt(Math.max(0, r*r - v*v));
    const g1 = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(v, plateauH + .05, -half), new THREE.Vector3(v, plateauH + .05, half)]);
    const g2 = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-half, plateauH + .05, v), new THREE.Vector3(half, plateauH + .05, v)]);
    g.add(new THREE.Line(g1, mat), new THREE.Line(g2, mat));
  }
  grid = g; scene.add(g);
}

export function waterTick(t, waterH) { if (water) water.position.y = waterH + Math.sin(t)*0.15; }
export function setGridVisible(v) { if (grid) grid.visible = v; }
