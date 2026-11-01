// The animate loop: water bob, walkers, follow-cam, maker animations, render.
import { scene, camera, renderer, ANIMS } from './scene.js';
import { waterTick } from './terrain.js';
import { updateWalkers } from './people.js';
import { followTick } from './camera.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function startLoop(waterH) {
  let t = 0;
  (function loop() {
    t += 0.01;
    if (!reduce) waterTick(t, waterH);
    if (!reduce) updateWalkers(1/60);
    followTick();
    for (const f of ANIMS) f(t);
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  })();
}
