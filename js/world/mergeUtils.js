// Flatten a Group of static Meshes down to one Mesh per unique material.
// Shophouse rows go from ~100 meshes to ~5 — same look, 20× fewer draw calls.
//
// Rules:
//  • Only merges plain Mesh children (skips InstancedMesh, textured materials, nested Groups
//    with their own transforms are flattened).
//  • Materials are grouped by {type, color, emissive, opacity, transparent}. Materials with
//    the same visual properties share a bucket even if they're separate JS instances.
//  • Castes/receives shadow are preserved (every child in these makers casts+receives).
//  • Call once per building, right after construction.

function matKey(m) {
  if (!m.color || m.map) return null;             // textured or exotic → leave alone
  const type = m.type || 'Mesh';
  const color = m.color.getHex();
  const emis = m.emissive ? m.emissive.getHex() : 0;
  const op = m.transparent ? m.opacity.toFixed(2) : '1';
  const sh = m.shininess !== undefined ? m.shininess : '-';
  return `${type}|${color}|${emis}|${op}|${sh}`;
}

// Convert any geometry to the standard {position, normal, uv} non-indexed form so they
// can be concatenated without caring about which attributes each primitive has.
function normalize(g) {
  const geo = g.index ? g.toNonIndexed() : g.clone();
  if (!geo.attributes.normal) geo.computeVertexNormals();
  if (!geo.attributes.uv) {
    const n = geo.attributes.position.count;
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
  }
  return geo;
}

function concatGeometries(geoms) {
  if (geoms.length === 1) return geoms[0];
  let totalVerts = 0;
  for (const g of geoms) totalVerts += g.attributes.position.count;
  const pos = new Float32Array(totalVerts * 3);
  const nor = new Float32Array(totalVerts * 3);
  const uv  = new Float32Array(totalVerts * 2);
  let off = 0;
  for (const g of geoms) {
    const n = g.attributes.position.count;
    pos.set(g.attributes.position.array, off*3);
    nor.set(g.attributes.normal.array,   off*3);
    uv.set (g.attributes.uv.array,        off*2);
    off += n;
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  merged.setAttribute('normal',   new THREE.BufferAttribute(nor, 3));
  merged.setAttribute('uv',       new THREE.BufferAttribute(uv, 2));
  return merged;
}

export function mergeByMaterial(root) {
  root.updateMatrixWorld(true);
  // Local-space transform: bake each child's position/rotation/scale into its geometry
  // relative to the root, so the merged mesh still sits at the root's transform.
  const rootInv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map();                      // key → {material, geoms:[]}
  const skip = [];                                // meshes we don't touch

  const visit = (obj) => {
    for (const child of [...obj.children]) {
      if (child.isInstancedMesh) { continue; }
      if (child.isGroup) { visit(child); continue; }
      if (!child.isMesh) continue;
      const key = matKey(child.material);
      if (!key) { skip.push(child); continue; }
      const g = normalize(child.geometry);
      const m = new THREE.Matrix4().copy(rootInv).multiply(child.matrixWorld);
      g.applyMatrix4(m);
      if (!buckets.has(key)) buckets.set(key, {material: child.material, geoms: []});
      buckets.get(key).geoms.push(g);
      // disconnect from parent — we'll replace it with a merged mesh
      child.parent.remove(child);
      // let the original geometry be garbage-collected (we cloned it)
      // (child.geometry is unchanged on the original mesh, but original mesh is gone)
    }
  };
  visit(root);

  for (const {material, geoms} of buckets.values()) {
    const merged = concatGeometries(geoms);
    const mesh = new THREE.Mesh(merged, material);
    mesh.castShadow = true; mesh.receiveShadow = true;
    root.add(mesh);
    // drop intermediate per-child geometry clones
    for (const g of geoms) if (g !== merged) g.dispose();
  }
}
