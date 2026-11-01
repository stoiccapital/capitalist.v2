// Shared primitives for building makers.
// kit() returns helpers that attach to a Group; makers compose boxes/trees from these.
export const kit = () => {
  const g = new THREE.Group();
  const mat = (c, extra = {}) => new THREE.MeshLambertMaterial({color:c, ...extra});
  const add = (geo, m, x, y, z) => { const b = new THREE.Mesh(geo, m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; g.add(b); return b; };
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const trees = pts => {
    const leaf = new THREE.MeshLambertMaterial({color:0x4f8a45, flatShading:true}), trunk = mat(0x6b4a33);
    for (const [x, z] of pts) {
      add(new THREE.CylinderGeometry(0.2, 0.3, 2.6, 6), trunk, x, 1.3, z);
      add(new THREE.IcosahedronGeometry(2, 0), leaf, x, 3.9, z);
    }
  };
  return {g, mat, add, B, trees};
};

export const waterM = () => new THREE.MeshPhongMaterial({color:0x3fc1d9, emissive:0x0b3a44, shininess:150});

export function gable(w, d, h, m) {
  const sh = new THREE.Shape([new THREE.Vector2(-w/2, 0), new THREE.Vector2(w/2, 0), new THREE.Vector2(0, h)]);
  const geo = new THREE.ExtrudeGeometry(sh, {depth:d, bevelEnabled:false}); geo.translate(0, 0, -d/2);
  const r = new THREE.Mesh(geo, m); r.castShadow = r.receiveShadow = true; return r;
}
export function hip(w, d, h, m) {
  const geo = new THREE.ConeGeometry(1, h, 4); geo.rotateY(Math.PI/4); geo.scale(w/Math.SQRT2, 1, d/Math.SQRT2);
  const r = new THREE.Mesh(geo, m); r.castShadow = true; return r;
}
export function cypress(k, x, z, h = 7) {
  const c = new THREE.Mesh(new THREE.ConeGeometry(0.9, h, 7), new THREE.MeshLambertMaterial({color:0x2f5a33, flatShading:true}));
  c.position.set(x, h/2, z); c.castShadow = true; k.g.add(c);
}

export function signTex(text, bg, fg) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, 256, 128);
  x.fillStyle = fg; x.font = '600 46px "Space Grotesk", system-ui, sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 128, 66);
  return new THREE.CanvasTexture(c);
}
export const TEX = () => ({
  sale:  signTex('For sale',   '#2f5d50', '#ffffff'),
  owned: signTex('Yours',      '#d4af37', '#1d2a2f'),
  build: signTex('Building…',  '#e08a2e', '#ffffff'),
});

export const goldM = new THREE.MeshStandardMaterial({color:0xd4af37, roughness:0.3, metalness:1, emissive:0x3a2a00});
