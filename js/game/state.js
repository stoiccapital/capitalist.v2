// Mutable save state and persistence. Everything else reads S live.
// Callers mutate S directly; call save() to flush to localStorage.
import { DEF } from '../content/assets.js';

export const SAVE_KEY = 'little-allocator-v1';

export const fresh = () => ({
  v:1, cars:[], home:null,
  etf:{world:{p:100, sh:0, paid:0, earned:0}, tech:{p:100, sh:0, paid:0, earned:0}, bonds:{p:100, sh:0, paid:0, earned:0}},
  loan:0, m:0, cash:25000, job:2000, mood:'normal', mult:1, cpi:1,
  own:{}, biz:{}, saas:[], deals:[], nextId:1, goals:{}, lessons:{}, hist:[], last:null,
});

// S is a const object: we mutate it in place rather than reassigning.
// This matters because consumers often destructure `S` once (actions.js, test harnesses,
// closures captured at module init) — reassigning would silently split the universe.
export const S = fresh();

function replaceS(src) {
  for (const k of Object.keys(S)) delete S[k];
  Object.assign(S, src);
}

export function loadSave() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) {}
  if (saved && saved.v === 1) replaceS(saved);
  else replaceS(fresh());

  // forward-compat defaults for older saves
  if (S.loan === undefined) S.loan = 0;
  if (S.home === undefined) S.home = null;
  if (!S.cars) S.cars = [];
  if (!S.etf) S.etf = {world:{p:100, sh:0, paid:0, earned:0}, tech:{p:100, sh:0, paid:0, earned:0}, bonds:{p:100, sh:0, paid:0, earned:0}};
  if (!S.biz) S.biz = {};
  for (const id in DEF) if (DEF[id].kind === 'biz' && !S.biz[id]) S.biz[id] = DEF[id].earn;
  // Scrub stale ownership — the save may reference ids that no longer exist (e.g. after
  // a catalogue change). Keeps economy functions from throwing on DEF[id].kind lookups.
  const scrubbed = [];
  for (const id of Object.keys(S.own)) if (!DEF[id]) { scrubbed.push(id); delete S.own[id]; }
  if (S.home && !DEF[S.home]) S.home = null;
  for (const id of Object.keys(S.biz)) if (!DEF[id]) delete S.biz[id];
  if (scrubbed.length) {
    // Expose a one-shot flag so UI can tell the user what happened.
    S._catalogChanged = scrubbed.length;
  }
}

export function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {}
}

export function resetState() {
  replaceS(fresh());
  for (const id in DEF) if (DEF[id].kind === 'biz') S.biz[id] = DEF[id].earn;
  save();
}
