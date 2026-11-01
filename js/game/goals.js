// Goals ladder. Each goal has `k`ey, `t`itle, `d`escription and `ok()` predicate.
// checkGoals runs after any state change; completed goals fire star+confetti+recap.
import { S } from './state.js';
import { DEF } from '../content/assets.js';
import { machine, netWorth, nearby, built, etfValue, residential } from './economy.js';
import { snd, confetti, recap, lesson } from '../ui/fx.js';

export const GOALS = [
  {k:'month',  t:'Press Next month to get paid',                       d:'Your job pays you every month.',                                                             ok:() => S.m >= 1},
  {k:'buy1',   t:'Buy your first thing that makes money',              d:'Try the vending machines or the ice cream cart.',                                           ok:() => Object.keys(S.own).length + S.saas.length > 0 || etfValue() > 0},
  {k:'great',  t:'Buy a ⭐⭐⭐ Great deal',                              d:'Look for three stars in the Shop.',                                                           ok:() => S.goals.boughtGreat},
  {k:'loan',   t:'Borrow to buy something, then pay the loan back',    d:'Open 📦 My stuff to borrow. Only borrow for deals that earn more than 6%.',                 ok:() => S.goals.loanRepaid},
  {k:'earn1k', t:'Make your stuff earn $1,000 a month',                d:'Keep buying with what your stuff earns.',                                                    ok:() => machine() >= 1000},
  {k:'home',   t:'Buy a home to rent out',                             d:'Homes earn less, but the money is steady.',                                                  ok:() => Object.keys(S.own).some(id => DEF[id].kind === 'home')},
  {k:'sale',   t:'Buy something during a Sale',                        d:'Wait for the green Sale sign at the top.',                                                   ok:() => S.goals.boughtSale},
  {k:'etf',    t:'Buy an ETF',                                         d:'Find ETFs in the 🛒 Shop. One buy owns a piece of many companies.',                           ok:() => Object.values(S.etf).some(e => e.sh > 0)},
  {k:'five',   t:'Own 5 money machines',                               d:'More machines, more money every month.',                                                     ok:() => Object.values(S.own).reduce((a, o) => a + o.n, 0) + S.saas.length >= 5},
  {k:'build',  t:'Buy land and build something on it',                 d:'Pick a 🌱 land plot in the Shop, then choose what to build.',                                 ok:() => Object.keys(S.own).some(built)},
  {k:'movein', t:'Move into a home you own',                           d:'Open a home you own and tap Move in.',                                                       ok:() => !!S.home},
  {k:'car',    t:'Buy a car for your home',                            d:'Cars cost money every month, so buy one when your stuff earns enough to pay for it.',       ok:() => S.cars.length > 0},
  {k:'free',   t:'Make your stuff earn more than your job',            d:'Then your money works harder than you do.',                                                  ok:() => machine() > S.job},
  {k:'saas',   t:'Buy a software company',                             d:'They show up in the Shop for a few months only.',                                            ok:() => S.saas.length > 0},
  {k:'m1',     t:'Own $1 million of stuff and cash',                   d:'Keep reinvesting. It speeds up over time.',                                                  ok:() => netWorth() >= 1e6},
  {k:'hood',   t:'Build a school or hospital next to your homes',      d:'Homes near schools, hospitals and theme parks earn more rent.',                             ok:() => Object.keys(S.own).some(id => (DEF[id].kind === 'home' || (DEF[id].kind === 'land' && built(id) && residential(S.own[id].dev.type))) && nearby(id).boost > 1)},
  {k:'park',   t:'Build a theme park',                                 d:'Buy land, then build a theme park on it. It takes 2 years to build!',                        ok:() => Object.keys(S.own).some(id => built(id) && S.own[id].dev.type === 'park')},
  {k:'m10',    t:'Reach $10 million',                                  d:'Big homes and companies become possible.',                                                   ok:() => netWorth() >= 1e7},
  {k:'palace', t:'Be rich enough for the clifftop palace',             d:'Reach $150 million. Then think: is it a good deal?',                                        ok:() => netWorth() >= 1.5e8},
];

export const currentGoal = () => GOALS.find(g => !S.goals[g.k]);

export function checkGoals() {
  for (const g of GOALS) if (!S.goals[g.k] && g.ok()) {
    S.goals[g.k] = true;
    snd('star'); confetti(80);
    recap(`⭐ Goal done: ${g.t}`, 'Nice work, allocator!');
    if (g.k === 'free') lesson('freedom');
  }
}
