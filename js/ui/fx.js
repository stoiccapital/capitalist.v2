// Sound, confetti, floating coins, bump animation, recap feed, lesson modal.
// Depends on world/camera.js for the camera (needed to project 3D positions to screen).
import { S, save } from '../game/state.js';
import { camera } from '../world/scene.js';

export const $ = id => document.getElementById(id);
export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

let AC = null;
export let muted = false;
export const setMuted = v => { muted = v; };

export function snd(name) {
  if (muted) return;
  const N = {
    coin:[[988,0,.07],[1319,.06,.16]],
    buy: [[523,0,.1],[659,.08,.1],[784,.16,.1],[1047,.24,.3]],
    star:[[784,0,.12],[988,.1,.12],[1175,.2,.12],[1568,.32,.45]],
    bad: [[330,0,.15],[247,.13,.3]],
  }[name];
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    for (const [f, t, d] of N) {
      const o = AC.createOscillator(), g = AC.createGain(), t0 = AC.currentTime + t;
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
      o.connect(g); g.connect(AC.destination);
      o.start(t0); o.stop(t0 + d + 0.05);
    }
  } catch (e) {}
}

export function confetti(n = 60) {
  if (reduceMotion) return;
  const cols = ['#f5b700','#2f8a5b','#3e8ed0','#e4572e','#9b5de5','#ffffff'];
  for (let i = 0; i < n; i++) {
    const d = document.createElement('div');
    d.className = 'conf';
    d.style.left = Math.random()*100 + 'vw';
    d.style.background = cols[Math.floor(Math.random()*cols.length)];
    d.style.animationDelay = Math.random()*0.4 + 's';
    d.style.animationDuration = 1.4 + Math.random()*1.2 + 's';
    $('fx').append(d);
    setTimeout(() => d.remove(), 3200);
  }
}

export function floatAt(pos, text, neg) {
  const v = pos.clone().project(camera);
  if (v.z > 1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1) return false;
  const d = document.createElement('div');
  d.className = 'float' + (neg ? ' neg' : '');
  d.textContent = text;
  d.style.left = (v.x + 1)/2*innerWidth + 'px';
  d.style.top = (1 - v.y)/2*innerHeight + 'px';
  $('fx').append(d);
  setTimeout(() => d.remove(), 1700);
  return true;
}

export function bump(id) {
  const e = $(id); e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump');
}

export function recap(big, small) {
  const r = $('kRecap'), d = document.createElement('div');
  d.textContent = big;
  if (small) { const s = document.createElement('small'); s.textContent = small; d.append(s); }
  r.append(d);
  setTimeout(() => d.remove(), 2700);
  while (r.children.length > 2) r.firstChild.remove();
}

export const LESSONS = {
  start:    'You have $25,000. Allocators turn money into things that make more money. Open the Shop and look at the stars: they show how good a deal is.',
  firstBuy: 'You bought your first money machine! Every month it pays you. Use that money to buy more machines. That\u2019s how allocators grow.',
  sale:     'Prices are on sale! The rent stays the same, but the price is lower, so you earn more for every dollar. Allocators buy when things are cheap.',
  hot:      'Prices are high right now. Same earnings, higher price, so a worse deal. Allocators are patient and wait.',
  badMonth: 'One of your businesses had a bad month. Businesses earn more than houses, but their money jumps around. That\u2019s called risk.',
  bank:     'This earns less than the bank\u2019s 3%. It might be fun to own, but as an investment it\u2019s worse than just keeping your money in the bank.',
  deal:     'A software company is for sale! Good ones earn a lot and grow every year. Deals don\u2019t last long, so decide before it\u2019s gone.',
  sell:     'You sold something. Allocators sell when they can buy something better with the money, not just because the price went down.',
  loan:     'You borrowed money. The bank charges 6% a year. Borrowing only helps if what you buy earns more than 6%. A ⭐⭐⭐ deal earning 25% still leaves you 19%. A home earning 3% would lose you money every month.',
  margin:   'Prices fell, so your stuff is worth less than before. The bank got nervous and took money back, even selling something of yours. That\u2019s the danger of borrowing too much.',
  home:     'You moved into your own home! You don\u2019t pay rent any more, but your home stopped earning money for you, and big homes have big bills. A home you live in is nice, but it isn\u2019t a money machine.',
  etf:      'An ETF is a basket. With one buy you own a tiny piece of many companies, so one bad company can\u2019t sink you. The price jumps around every month, but over many years it has usually grown. The trick: keep buying and be patient.',
  crash:    'The stock market dropped a lot this month! It happens every few years. People who panic and sell lock in the loss. Patient allocators keep holding, or even buy more while it\u2019s cheap.',
  car:      'Nice car! But remember: a car loses value every year and costs money every month. It\u2019s a spending choice, not an investment. Allocators buy toys with what their money machines earn, not with the money that builds them.',
  amenity:  'Your new building makes the neighbourhood nicer, so people pay more to live close by. Every home you own nearby now earns more rent and is worth more. Smart allocators think about what\u2019s around their buildings, not just the buildings.',
  park:     'Your theme park is open! It earns a lot in summer and much less in winter, and some months can even lose money. Businesses like this pay well, but the money is bumpy, so keep some cash for the slow months.',
  build:    'You started building! While it\u2019s being built it earns nothing, and that\u2019s normal. Building takes patience, but when it\u2019s finished it\u2019s worth more than it cost.',
  freedom:  'Your stuff now earns more than your job! That means your money works harder than you do. This is the goal of every allocator.',
  districts:'The city is split into 24 districts (D1…D24). Tap the ◀ ▶ arrows or the "D4 ▾" label at the top to switch. Each district shows only its own buildings, and the Shop filters to the district you\'re in. Tap 🌍 to see the whole city.',
  pins:     'Those shiny gold pins floating over buildings are the ones YOU own. Taller buildings get bigger pins so you can spot them from far away.',
};

export function lesson(key) {
  if (S.lessons[key]) return;
  S.lessons[key] = true; save();
  $('kLessonText').textContent = LESSONS[key];
  $('kLesson').hidden = false;
  $('kLessonOk').focus();
}
