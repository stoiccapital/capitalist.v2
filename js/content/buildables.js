// What you can build on a land plot.
// cost / rent / what are functions of the plot `p` ({sx, sz, m2}) so each plot sizes correctly.
// Register the matching maker in world/makers/buildables.js under the same key.
// SCAF gives the wireframe scaffold dimensions used while the building is going up.
export const BUILD = {
  school:   {name:'School',                      icon:'🏫', cost:() => 12e6, months:18, rent:() => 80000,                 home:0,     live:0, amenity:0.15, h:14,   what:() => 'A private school for 400 students. Parents pay fees every month.'},
  hospital: {name:'Hospital',                    icon:'🏥', cost:() => 40e6, months:30, rent:() => 300000,                home:0,     live:0, amenity:0.10, h:48,   what:() => 'A hospital with 250 beds. Patients and insurers pay for care.'},
  park:     {name:'Theme park',                  icon:'🎢', cost:() => 25e6, months:24, rent:() => 250000,                home:0,     live:0, biz:true, amenity:0.15, h:32, what:() => 'A Ferris wheel, a roller coaster and a carousel. Lots of visitors in summer, fewer in winter.'},
  villa:    {name:'Villa',                       icon:'🏖️', cost:() => 2.6e6, months:14, rent:() => 9500,                 home:9500,  live:4,               h:9,    what:() => 'A modern villa with a pool, a garage and a walled garden, like the famous one downtown.'},
  house:    {name:'Luxury house',                icon:'🏡', cost:() => 1.4e6, months:10, rent:() => 7500,                 home:7500,  live:4,               h:9,    what:() => 'A modern villa with a pool. Rent it out or live in it yourself.'},
  boutique: {name:'Small apartment building',    icon:'🏢', cost:p => p.m2*900, months:12, rent:p => Math.round(p.m2/200)*1600, home:1600, live:2,           h:13.5, what:p => `A 4-storey building with ${Math.round(p.m2/200)} apartments to rent out.`},
  tower:    {name:'Tower with a penthouse',      icon:'🌆', cost:() => 22e6, months:24, rent:() => 92*1600 + 15000,       home:15000, live:5,               h:86,   what:() => '24 floors: 92 apartments, plus a penthouse on top you could live in.'},
  complex:  {name:'Apartment complex',           icon:'🏙️', cost:() => 70e6, months:36, rent:() => 360*1500,              home:1500,  live:2,               h:103,  what:() => 'Two 30-floor towers with 360 apartments.'},
};

// Scaffold footprint while building. Keep in sync with each maker's visible model.
export const SCAF = {
  school:   p => [p.sx - 1, 12, p.sz - 1],
  hospital: p => [p.sx - 4, 46, p.sz - 6],
  park:     p => [p.sx - 2, 30, p.sz - 2],
  villa:    () => [26, 9, 16],
  house:    () => [22, 9, 14],
  boutique: p => [p.sx - 12, 13.5, p.sz - 16],
  tower:    () => [22, 86, 22],
  complex:  p => [p.sx - 4, 103, p.sz - 6],
};
