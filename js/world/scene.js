// Three.js scene, camera, renderer, lights. Pickable list and per-frame animation registry.
// Imported first by every world module.

export const renderer = new THREE.WebGLRenderer({antialias:true, logarithmicDepthBuffer:true});
// Cap pixel ratio at 1.5 (not 2) — on retina displays this nearly halves pixel work with
// almost no visible difference against the game's low-poly style.
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
// BasicShadowMap is unfiltered but ~4× cheaper than PCFSoft. For a stylised city the hard
// edges are acceptable and the perf win is enormous.
renderer.shadowMap.type = THREE.BasicShadowMap;
// The sun doesn't move. Bake the shadow map once at startup and reuse it every frame —
// skips the entire depth pass over all 4,000+ meshes. We force a refresh after any
// construction change (world/pins.js calls `renderer.shadowMap.needsUpdate = true`).
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true;
document.body.appendChild(renderer.domElement);
export const el = renderer.domElement;

export const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbcd8e2);
scene.fog = new THREE.Fog(0xbcd8e2, 1800, 5500);

export const camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.05, 15000);
const faceLight = new THREE.PointLight(0xfff1e6, 0.8, 7, 2); faceLight.position.set(0.3, 0.4, 0); camera.add(faceLight);
scene.add(new THREE.HemisphereLight(0xdff1ff, 0x8a806e, 0.75));
const sun = new THREE.DirectionalLight(0xfff3dd, 0.9);
sun.position.set(-1200, 1600, 800);
sun.castShadow = true;
// Shadow pass dominates frame cost. Smaller map (2048 vs 4096) → 4× faster depth render.
// Tighter frustum (650 vs 1300) → focused on the plateau where shadows actually matter.
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, {left:-650, right:650, top:650, bottom:-650, far:3500});
scene.add(sun);
scene.add(camera);

// Groups registered here get their click → asset id dispatch (populated by city.js & pins.js).
export const pickables = [];

// Per-frame callbacks (populated by makers that need animation: ferris wheel, fountain, rotor).
export const ANIMS = [];

addEventListener('resize', () => {
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
