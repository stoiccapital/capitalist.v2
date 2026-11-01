// Click-to-open: raycast against the pickables list. Taps open the matching asset sheet.
// Food block is disambiguated by z (restaurant to the south, café to the north).
import { camera, el, pickables } from './scene.js';
import { DEF } from '../content/assets.js';
import { act } from '../ui/input.js';

export function wirePicker(city) {
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let down = null;
  el.addEventListener('pointerdown', e => { down = {x:e.clientX, y:e.clientY, n:0}; });
  el.addEventListener('pointerup', e => {
    const d0 = down; down = null;
    if (!d0 || Math.hypot(e.clientX - d0.x, e.clientY - d0.y) > 8) return;
    const r = el.getBoundingClientRect();
    ndc.set((e.clientX - r.left)/r.width*2 - 1, -(e.clientY - r.top)/r.height*2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(pickables, true)[0]; if (!hit) return;
    let o = hit.object; while (o && !o.userData.asset) o = o.parent; if (!o) return;
    let id = o.userData.asset;
    if (id === 'food') id = hit.point.z < city.landmarks.FOOD[2] ? 'restaurant' : 'cafe';
    if (DEF[id]) act('item:' + id);
  });
}
