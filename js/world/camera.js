// Orbit controls, follow mode, smooth fly-to transitions, person-watch, item framing.
import { scene, camera, renderer, el } from './scene.js';
import { PLATEAU_H } from '../constants.js';
import { DEF } from '../content/assets.js';
import { BUILD } from '../content/buildables.js';
import { S } from '../game/state.js';
import { preview } from '../ui/sheet.js';
import { walkers } from './people.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

export let theta = Math.PI*0.25, phi = 0.95, radius = 2400;
export const target = new THREE.Vector3(0, PLATEAU_H, 0);
export let follow = null;
export let watching = null;
export const isWatching = () => !!watching;
export const stopWatching = () => { watching = null; };
export const setTheta = t => { theta = t; };
export const setRadius = r => { radius = r; };

export function placeCam() {
  camera.position.set(
    target.x + radius*Math.sin(phi)*Math.sin(theta),
    target.y + radius*Math.cos(phi),
    target.z + radius*Math.sin(phi)*Math.cos(theta),
  );
  camera.lookAt(target);
}

// Pan the camera target across the ground plane. dx, dy are pointer deltas in px.
// Push convention: drag right → camera moves right (scene scrolls left under you).
function pan(dx, dy) {
  const scale = radius / 500;
  // horizontal basis vectors derived from theta (azimuth):
  //   right    = (cos θ, 0, -sin θ)
  //   forward* = (-sin θ, 0, -cos θ)   (into the scene, horizontal projection)
  target.x += dx*scale*Math.cos(theta) - dy*scale*Math.sin(theta);
  target.z += -dx*scale*Math.sin(theta) - dy*scale*Math.cos(theta);
}

export function wirePointer() {
  const pointers = new Map();
  let pinchDist = 0, pinchMid = null;
  // Double-click (within 300 ms) marks the NEXT drag as a pan.
  let lastDownT = 0, nextIsPan = false;
  const isPanButton = e => e.button === 2 || e.shiftKey || nextIsPan;

  el.addEventListener('contextmenu', e => e.preventDefault());
  el.addEventListener('pointerdown', e => {
    el.setPointerCapture(e.pointerId);
    const now = performance.now();
    if (now - lastDownT < 300 && pointers.size === 0) nextIsPan = true;
    lastDownT = now;
    pointers.set(e.pointerId, {x:e.clientX, y:e.clientY, panning:isPanButton(e)});
  });
  el.addEventListener('pointermove', e => {
    const info = pointers.get(e.pointerId); if (!info) return;
    const dx = e.clientX - info.x, dy = e.clientY - info.y;
    if (pointers.size === 1) {
      if (info.panning) pan(dx, dy);
      else {
        theta -= dx*0.006;
        phi = Math.min(1.45, Math.max(0.15, phi - dy*0.005));
      }
    }
    pointers.set(e.pointerId, {x:e.clientX, y:e.clientY, panning:info.panning});
    if (pointers.size === 2) {
      // Two-finger gesture: pinch to zoom + midpoint drag to pan simultaneously.
      const [p1, p2] = [...pointers.values()];
      const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const mid = {x:(p1.x + p2.x)/2, y:(p1.y + p2.y)/2};
      if (pinchDist) radius = Math.min(6000, Math.max(0.8, radius*pinchDist/d));
      if (pinchMid) pan(mid.x - pinchMid.x, mid.y - pinchMid.y);
      pinchDist = d; pinchMid = mid;
    }
    placeCam();
  });
  const up = e => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) { pinchDist = 0; pinchMid = null; }
    if (pointers.size === 0) nextIsPan = false;
  };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('wheel', e => { e.preventDefault(); radius = Math.min(6000, Math.max(0.8, radius*(1 + e.deltaY*0.0015))); placeCam(); }, {passive:false});

  // Keyboard arrows / WASD for pan (nice for exploring a big city).
  addEventListener('keydown', e => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    const step = 60;
    if (e.key === 'ArrowLeft'  || e.key === 'a') pan( step, 0);
    else if (e.key === 'ArrowRight' || e.key === 'd') pan(-step, 0);
    else if (e.key === 'ArrowUp'    || e.key === 'w') pan(0,  step);
    else if (e.key === 'ArrowDown'  || e.key === 's') pan(0, -step);
    else return;
    placeCam();
  });
}

let flyAnim = 0;
export function flyTo(p, r, ph, done) {
  follow = null; cancelAnimationFrame(flyAnim);
  if (reduceMotion) { target.copy(p); radius = r; phi = ph; placeCam(); if (done) done(); return; }
  const t0 = performance.now(), ft = target.clone(), fr = Math.log(radius), fp = phi;
  const tick = now => {
    const k = Math.min(1, (now - t0)/1000), e = k < 0.5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2)/2;
    target.lerpVectors(ft, p, e); radius = Math.exp(fr + (Math.log(r) - fr)*e); phi = fp + (ph - fp)*e; placeCam();
    if (k < 1) flyAnim = requestAnimationFrame(tick); else if (done) done();
  };
  flyAnim = requestAnimationFrame(tick);
}

export const HOME_VIEW = () => flyTo(new THREE.Vector3(0, PLATEAU_H, 0), 420, 0.95);

// Frame the camera so the whole district fits on screen. The radius scales with the
// larger of width/height so even wide outer districts fit.
export function flyToDistrict(d) {
  if (!d) return;
  const dim = Math.max(d.w, d.h);
  const r = dim * 1.2;
  flyTo(new THREE.Vector3(d.cx, PLATEAU_H, d.cz), r, 1.0);
}

// Birds-eye of the whole mainland. Steep angle so the camera looks almost straight down.
export function flyToWholeCity() {
  flyTo(new THREE.Vector3(0, PLATEAU_H, -600), 3800, 0.25);
}

export function watchPerson() {
  const pool = walkers.filter(x => x !== watching);
  const w = pool[Math.floor(Math.random()*pool.length)];
  watching = w;
  const p = w.p.position;
  flyTo(new THREE.Vector3(p.x, p.y + 1.6, p.z), 2.2, 1.42, () => { theta = w.p.rotation.y; follow = w; });
  // caller sets mode and re-renders
  import('../ui/sheet.js').then(m => m.setMode({tab:'city'}));
  import('../ui/render.js').then(m => m.render());
}

export function itemH(id) {
  const o = S.own[id], d = DEF[id];
  if (d.kind === 'land') {
    if (o && o.dev) return BUILD[o.dev.type].h + 6;
    if (preview && preview.id === id) return BUILD[preview.type].h + 6;
  }
  return d.h;
}

export function showItem(id, hh) {
  const d = DEF[id]; if (!d.pos) return;
  const h = hh || itemH(id);
  const r = Math.max(60, h*1.7, d.view || 0);
  flyTo(new THREE.Vector3(d.pos.x, d.pos.y + Math.min(h*0.4, 200) - r*0.22, d.pos.z), r, 1.05);
}

export function followTick() {
  if (follow) { target.set(follow.p.position.x, follow.p.position.y + 1.6, follow.p.position.z); placeCam(); }
}
