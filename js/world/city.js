// Instantiate a city: terrain, roads, prebuilt landmarks, pick-tagging.
// Call buildCity(city) once at boot, after terrain/roads have initialized.
import { scene, pickables } from './scene.js';
import { MAKERS } from './makers/landmarks.js';
import { mergeByMaterial } from './mergeUtils.js';

// Procedural buildings have no per-mesh animation and are safe to flatten.
// Hero landmarks have moving parts (fountain, helicopter rotor, estate pool) → leave alone.
const MERGEABLE_MAKERS = new Set(['officeTower', 'midrise', 'shophouseRow']);

// Hide every scene group that isn't in `districtId`. Pass null to show everything.
// Terrain, roads, sea, sky, and the clifftop assets (which have no district) stay visible.
export function setVisibleDistrict(districtId) {
  for (const o of scene.children) {
    if (!o.userData || o.userData.district === undefined) continue;   // no district tag → always visible
    o.visible = districtId === null || o.userData.district === districtId;
  }
}

export function buildCity(city) {
  const landmarks = city.landmarks;
  const failures = [];
  for (const entry of city.prebuilt) {
    if (entry.maker === 'clifftopRoad') continue;   // built by roads.js
    const make = MAKERS[entry.maker];
    if (!make) { console.warn('No landmark maker:', entry.maker); continue; }
    const triple = Array.isArray(entry.at) ? entry.at : entry.at ? landmarks[entry.at] : [0, 0, 0];
    const pos = new THREE.Vector3(...triple);
    try {
      const g = make(pos, entry.opts || {});
      if (entry.rot !== undefined) g.rotation.y = entry.rot;
      if (MERGEABLE_MAKERS.has(entry.maker)) mergeByMaterial(g);
      if (entry.asset) { g.userData.asset = entry.asset; pickables.push(g); }
      // Tag the group with the district that owns it, so we can hide out-of-district buildings.
      if (city.districtAt) g.userData.district = city.districtAt(pos.x, pos.z);
      scene.add(g);
    } catch (e) {
      console.error(`buildCity: ${entry.maker} at ${JSON.stringify(entry.at)} failed:`, e);
      failures.push({maker:entry.maker, at:entry.at, msg:e.message, stack:e.stack});
    }
  }
  if (failures.length) {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;top:200px;left:8px;right:8px;max-height:50vh;overflow:auto;background:#c0392b;color:#fff;padding:12px;z-index:100;font:12px/1.4 monospace;border-radius:8px';
    el.innerHTML = `<b>${failures.length} buildCity failures:</b><br>` +
      failures.map(f => `• ${f.maker} at ${JSON.stringify(f.at)} — ${f.msg}`).join('<br>');
    document.body.appendChild(el);
  }
  tagPickables(city);
}

// Tag the already-placed groups so clicking them opens the matching asset sheet.
// Walks the scene tree (not just top-level) so landmarks wrapped in parent groups still match.
function tagPickables(city) {
  const near = (g, p) => Math.abs(g.getWorldPosition(new THREE.Vector3()).x - p[0]) < 0.6
                      && Math.abs(g.getWorldPosition(new THREE.Vector3()).z - p[2]) < 0.6
                      && Math.abs(g.getWorldPosition(new THREE.Vector3()).y - p[1]) < 0.6;
  const landmarks = city.landmarks;
  const allGroups = [];
  scene.traverse(o => { if (o.isGroup) allGroups.push(o); });
  for (const t of city.pickTags) {
    const pt = Array.isArray(t.at) ? t.at : landmarks[t.at];
    for (const g of allGroups) if (near(g, pt)) {
      g.userData.asset = t.asset;
      if (!pickables.includes(g)) pickables.push(g);
    }
  }
}
