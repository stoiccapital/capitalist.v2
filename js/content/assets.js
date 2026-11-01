// Buyable catalogue: businesses, homes, land.
//
// Positions are landmark references, resolved against the current city at boot:
//   at: 'HOUSE'                → pos = city.landmarks.HOUSE
//   at: 'FOOD', offset:[-10,0,12] → pos = FOOD + offset
// This keeps assets portable: swap cities, the villa still goes "where the HOUSE landmark is".
//
// Add a new ownable: add an entry here. If it needs a new visual, add a maker
// in world/makers/landmarks.js (prebuilt) or world/makers/buildables.js (built on land).

export const DEF = {
  vending:    {name:'Vending machines',          icon:'🥤', kind:'biz',  mult:4.2, vol:0.15, price:8000,     earn:150,    max:20,  blurb:'A few snack machines in office lobbies.'},
  icecream:   {name:'Ice cream cart',            icon:'🍦', kind:'biz',  mult:3,   vol:0.35, price:20000,    earn:450,    max:10,  blurb:'Sells ice cream in the park. Great in summer, slow in winter.', seasonal:true},
  carwash:    {name:'Car wash',                  icon:'🚗', kind:'biz',  mult:4.5, vol:0.25, price:90000,    earn:2000,   blurb:'Cars come in dirty, leave shiny.'},
  cafe:       {name:'Slow Drip café',            icon:'☕', kind:'biz',  mult:3.6, vol:0.4,  price:130000,   earn:3000,   at:'FOOD', offset:[-10,0,12], h:7, blurb:'A cosy café with a terrace. A manager runs it for you.'},
  laundromat: {name:'Laundromat',                icon:'🧺', kind:'biz',  mult:5.5, vol:0.15, price:300000,   earn:5500,   blurb:'Washing machines people pay to use.'},
  restaurant: {name:'Ember & Salt restaurant',   icon:'🍽️', kind:'biz',  mult:2.8, vol:0.65, price:650000,   earn:13000,  at:'FOOD', offset:[-6,0,-12], h:9, blurb:'A busy restaurant. A manager runs it for you.'},

  apt:        {name:'Apartment',                 icon:'🏢', kind:'home',           price:240000,    earn:1000, max:960,   at:'APTS',      h:150, blurb:'One apartment in the big towers. A family rents it from you.'},
  townhouse:  {name:'Townhouse',                 icon:'🏘️', kind:'home',           price:380000,    earn:1500, max:8,     at:'TOWNHOUSE', h:16,  blurb:'A townhouse in a row of eight. A family rents it from you.'},
  family:     {name:'Family house',              icon:'🏡', kind:'home',           price:850000,    earn:2900, max:4,     at:'FAMILY',    h:14,  blurb:'A house with a garden. A family rents it from you.'},
  l81:        {name:'Office in Landmark 81',     icon:'🏙️', kind:'home',           price:1800000,   earn:10000,max:20,    at:'L81',       h:475, blurb:'A whole office floor in the tallest tower. A company rents it.'},
  villa:      {name:'Villa',                     icon:'🏖️', kind:'home',           price:2200000,   earn:6000,            at:'HOUSE',     h:12,  blurb:'A modern villa with a pool.'},
  penthouse:  {name:'Penthouse',                 icon:'🌆', kind:'home',           price:3600000,   earn:9000,            at:'PENT',      h:12,  blurb:'The glass home on top of the tower, with a rooftop pool.'},
  estate:     {name:'Garden estate',             icon:'🌳', kind:'home',           price:7500000,   earn:18000,           at:'ESTATE',    h:18,  blurb:'A big modern home with a pool and tennis court.'},
  mansion:    {name:'Mansion',                   icon:'🏛️', kind:'home',           price:18000000,  earn:30000,           at:'MANSION',   h:20,  blurb:'A grand mansion with columns and a fountain.'},
  trophy:     {name:'Clifftop palace',           icon:'👑', kind:'home',           price:150000000, earn:150000,          at:'PAD',       h:42,  view:230, blurb:'The most famous home on the island, on a cliff above the sea.'},
};

// Resolve `at`/`offset` references into THREE.Vector3 positions, and generate
// land-plot DEF entries from the city's plotCoords. Called once at boot.
// Mutates the shared DEF object so all consumers see live bindings.
export function resolveCatalog(THREE, city, Y0g) {
  const landmarks = city.landmarks;
  const v3 = ([x,y,z]) => new THREE.Vector3(x, y, z);

  // Merge procedural buildings into DEF (each procedural building is a unique buyable asset).
  if (city.procDef) Object.assign(DEF, city.procDef);

  for (const id in DEF) {
    const d = DEF[id];
    if (d.at && landmarks[d.at]) {
      const base = landmarks[d.at];
      const o = d.offset || [0,0,0];
      d.pos = new THREE.Vector3(base[0] + o[0], base[1] + o[1], base[2] + o[2]);
    } else if (Array.isArray(d.at)) {
      // procedural entry: `at` is already a raw triple
      d.pos = new THREE.Vector3(d.at[0], d.at[1], d.at[2]);
    }
    // Tag each positioned asset with the district that contains it.
    if (d.pos && city.districtAt) d.district = city.districtAt(d.pos.x, d.pos.z);
  }

  const PLOTS = city.plotCoords.map(([x,z], i) => {
    const sx = Math.abs(x) > 50 ? 40 : 35, sz = Math.abs(z) > 50 ? 40 : 35;
    return {id:'plot'+i, n:i+1, x, z, sx, sz, m2:sx*sz};
  });
  for (const p of PLOTS) {
    DEF[p.id] = {
      name:'Land plot ' + p.n, icon:'🌱', kind:'land',
      price: p.m2 * 180,
      plot: p,
      pos: new THREE.Vector3(p.x, Y0g, p.z),
      h: 8,
      district: city.districtAt ? city.districtAt(p.x, p.z) : undefined,
      blurb:`${p.sx} m × ${p.sz} m of empty land (${p.m2.toLocaleString('en-US')} m²). Land on its own earns nothing: you make money by building on it.`,
    };
  }

  // Procedural "ambient" plots — every remaining empty block becomes land you can buy.
  // Flagged `procedural:true` so the shop list hides them and pin visuals stay subtle.
  if (city.extraPlots) {
    const base = PLOTS.length;
    city.extraPlots.forEach(([x, z], i) => {
      const sx = Math.abs(x) > 50 ? 40 : 35, sz = Math.abs(z) > 50 ? 40 : 35;
      const p = {id:'plot'+(base + i), n:base + i + 1, x, z, sx, sz, m2:sx*sz};
      PLOTS.push(p);
      DEF[p.id] = {
        name:`Land plot at (${x}, ${z})`, icon:'🌱', kind:'land',
        price: p.m2 * 180,
        plot: p,
        pos: new THREE.Vector3(p.x, Y0g, p.z),
        h: 8,
        procedural: true,
        district: city.districtAt ? city.districtAt(x, z) : undefined,
        blurb:`${p.sx} m × ${p.sz} m of empty land (${p.m2.toLocaleString('en-US')} m²). Land on its own earns nothing: you make money by building on it.`,
      };
    });
  }
  for (const id in DEF) if (!DEF[id].max) DEF[id].max = 1;

  return PLOTS;
}
