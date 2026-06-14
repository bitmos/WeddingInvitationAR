import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// Dresses a rigged (Mixamo) groom scan in a cream sherwani + churidar by
// overlaying garment geometry fitted to the skeleton. Sleeves/legs are attached
// to the matching bones (via Object3D.attach) so they follow the body's motion.
// No turban — the scanned head stays.
//
// The source scan is an UNTEXTURED gray mesh, so we also:
//   • tint the body to a skin tone, and
//   • overlay the real face photo on a flat plate on the head (opts.faceImg).
//
// Call AFTER loading the GLB and BEFORE applying scene scale/position.
// ─────────────────────────────────────────────────────────────────────────────
export function dressGroom(root, opts = {}) {
  const cream = opts.coat ?? 0xF3EAD2;
  const churidarHex = opts.churidar ?? 0xEFE6CF;
  const skinHex = opts.skin ?? 0xB07A4E;

  const coatMat = new THREE.MeshStandardMaterial({ color: cream, roughness: 0.7, metalness: 0.04 });
  const legMat = new THREE.MeshStandardMaterial({ color: churidarHex, roughness: 0.75, metalness: 0.02 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xD4AF37, roughness: 0.25, metalness: 0.85 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x3a2410, roughness: 0.4, metalness: 0.2 });
  const skinMatBody = new THREE.MeshStandardMaterial({ color: skinHex, roughness: 0.85, metalness: 0 });

  // Tint the untextured scan to skin tone (exposed hands/neck/head)
  root.traverse((o) => {
    if (o.isMesh && o.material && !o.material.map) {
      o.material = o.material.clone();
      o.material.color.setHex(skinHex);
      o.material.roughness = 0.85;
    }
  });

  // Collect bones by name
  const B = {};
  root.updateWorldMatrix(true, true);
  root.traverse((o) => { if (o.isBone) B[o.name.replace('mixamorig_', '')] = o; });
  const wp = (n) => { const v = new THREE.Vector3(); B[n].getWorldPosition(v); return v; };

  // Cylinder spanning two world points, optionally tapered, attached to a bone.
  const limb = (a, b, rTop, rBot, mat, bone, extend = 0) => {
    const dir = b.clone().sub(a);
    const len = dir.length() + extend;
    const geo = new THREE.CylinderGeometry(rTop, rBot, len, 20, 1, false);
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(a.clone().add(b).multiplyScalar(0.5));
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    root.add(m);
    if (bone) bone.attach(m);
    return m;
  };

  // ── Sherwani coat (shoulders → knees), stacked sections on the spine ──
  const cz = -0.03;
  const sections = [
    [0.52, 0.235], [0.37, 0.255], [0.16, 0.23],
    [0.02, 0.25], [-0.22, 0.27], [-0.5, 0.295],
  ];
  for (let i = 0; i < sections.length - 1; i++) {
    const [y0, r0] = sections[i];
    const [y1, r1] = sections[i + 1];
    const geo = new THREE.CylinderGeometry(r0, r1, y0 - y1, 28, 1, true);
    const m = new THREE.Mesh(geo, coatMat);
    m.position.set(0, (y0 + y1) / 2, cz);
    root.add(m); B.Spine.attach(m);
  }
  const hem = new THREE.Mesh(new THREE.CylinderGeometry(0.295, 0.30, 0.05, 28), gold);
  hem.position.set(0, -0.5, cz); root.add(hem); B.Spine.attach(hem);
  // Dome the shoulders so the coat closes over the top
  const shoulderCap = new THREE.Mesh(new THREE.SphereGeometry(0.236, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2), coatMat);
  shoulderCap.position.set(0, 0.52, cz); shoulderCap.scale.set(1, 0.55, 0.92);
  root.add(shoulderCap); B.Spine.attach(shoulderCap);

  // Mandarin collar
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.1, 0.08, 22, 1, true), coatMat);
  collar.position.copy(wp('Neck')).add(new THREE.Vector3(0, 0.0, 0.01));
  root.add(collar); B.Neck.attach(collar);
  const collarTrim = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.007, 8, 26), gold);
  collarTrim.position.copy(wp('Neck')).add(new THREE.Vector3(0, 0.035, 0.012));
  collarTrim.rotation.x = Math.PI / 2; root.add(collarTrim); B.Neck.attach(collarTrim);

  // Gold front placket + buttons
  const placket = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.92, 0.02), gold);
  placket.position.set(0, 0.05, cz + 0.245); root.add(placket); B.Spine.attach(placket);
  for (let i = 0; i < 6; i++) {
    const btn = new THREE.Mesh(new THREE.SphereGeometry(0.013, 10, 10), gold);
    btn.position.set(0, 0.45 - i * 0.11, cz + 0.258); root.add(btn); B.Spine.attach(btn);
  }

  // ── Sleeves (upper arm + forearm), attached to arm bones ──
  ['Left', 'Right'].forEach((s) => {
    limb(wp(s + 'Arm'), wp(s + 'ForeArm'), 0.09, 0.072, coatMat, B[s + 'Arm'], 0.06);
    limb(wp(s + 'ForeArm'), wp(s + 'Hand'), 0.072, 0.052, coatMat, B[s + 'ForeArm'], 0.02);
    const w = wp(s + 'Hand');
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 16), gold);
    cuff.position.copy(w);
    cuff.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), w.clone().sub(wp(s + 'ForeArm')).normalize());
    root.add(cuff); B[s + 'ForeArm'].attach(cuff);
    // Smooth skin hand over the melty scan hand
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.058, 18, 18), skinMatBody);
    hand.scale.set(1.0, 1.25, 0.7);
    hand.position.copy(w).add(w.clone().sub(wp(s + 'ForeArm')).normalize().multiplyScalar(0.06));
    root.add(hand); B[s + 'Hand'].attach(hand);
  });

  // ── Churidar (lower legs) + simple mojari shoes ──
  ['Left', 'Right'].forEach((s) => {
    limb(wp(s + 'UpLeg'), wp(s + 'Leg'), 0.11, 0.085, legMat, B[s + 'UpLeg']);
    limb(wp(s + 'Leg'), wp(s + 'Foot'), 0.085, 0.05, legMat, B[s + 'Leg']);
    const f = wp(s + 'Foot');
    // Mojari that fully covers the melty scan foot
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.075, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.6), shoeMat);
    shoe.scale.set(1.0, 0.7, 1.9);
    shoe.rotation.x = Math.PI;
    shoe.position.set(f.x, f.y - 0.02, f.z + 0.05);
    root.add(shoe); B[s + 'Foot'].attach(shoe);
  });

  // ── Clean head grafted over the low-quality scan head ──
  // A smooth skin sphere (sized to enclose the melty scan head) + hair + a flat
  // plate carrying the real face photo, so the groom is recognizable.
  if (opts.faceImg) {
    const head = wp('Head');
    const cy = head.y + 0.055;
    const skinMat = new THREE.MeshStandardMaterial({ color: skinHex, roughness: 0.85, metalness: 0 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x140a04, roughness: 0.8, metalness: 0.05 });

    // Collapse the low-quality scan head (it's skinned to the Head bone) so our
    // clean head fully replaces it. Clean head attaches to the Neck bone instead.
    B.Head.scale.setScalar(0.08);

    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.142, 30, 30), skinMat);
    skull.scale.set(1.0, 1.26, 0.98);
    skull.position.set(head.x, cy, head.z);
    root.add(skull); B.Neck.attach(skull);

    // Hair cap (crown + back)
    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 28, 24, 0, Math.PI * 2, 0, Math.PI * 0.5), hairMat);
    hairCap.scale.set(1.0, 1.2, 1.0);
    hairCap.position.set(head.x, cy + 0.008, head.z - 0.006);
    root.add(hairCap); B.Neck.attach(hairCap);

    // Face photo → feathered plate on the front of the skull
    const S = 512;
    const cv = document.createElement('canvas'); cv.width = cv.height = S;
    const ctx = cv.getContext('2d');
    const w = 520, h = 520;
    ctx.drawImage(opts.faceImg, S / 2 - w / 2, S / 2 - h / 2, w, h);
    // Tight elliptical feather hides the photo's green background
    ctx.globalCompositeOperation = 'destination-in';
    ctx.save();
    ctx.translate(S / 2, S * 0.5); ctx.scale(0.82, 1.0);
    const rg = ctx.createRadialGradient(0, 0, S * 0.12, 0, 0, S * 0.34);
    rg.addColorStop(0, 'rgba(0,0,0,1)'); rg.addColorStop(0.8, 'rgba(0,0,0,1)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(0, 0, S * 0.34, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;

    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.2, 0.232),
      new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.9, metalness: 0,
        polygonOffset: true, polygonOffsetFactor: -4 })
    );
    plate.position.set(head.x, cy + 0.012, head.z + 0.142);
    root.add(plate); B.Neck.attach(plate);
  }

  return root;
}

// ─────────────────────────────────────────────────────────────────────────────
// Builds a looping "welcome wave" clip for a Mixamo-rigged model: the right arm
// raises, the forearm waves a few times, then lowers. Authored relative to the
// rig's current bind pose, so it works for any Mixamo rig (incl. your future
// replacement GLB) — just re-run the export after swapping the file.
// ─────────────────────────────────────────────────────────────────────────────
export function buildGroomWaveClip(root, name = 'GroomWave') {
  const B = {};
  root.traverse((o) => { if (o.isBone) B[o.name.replace('mixamorig_', '')] = o; });
  if (!B.RightArm || !B.RightForeArm) return null;

  const times = [0, 0.5, 0.8, 1.1, 1.4, 1.7, 2.0, 2.3, 2.9, 3.4];
  const armZ  = [0, -1.65, -1.65, -1.65, -1.65, -1.65, -1.65, -1.65, 0, 0];
  const foreZ = [0, -0.6, -0.95, -0.4, -0.95, -0.4, -0.95, -0.6, 0, 0];

  const e = new THREE.Euler(), dq = new THREE.Quaternion();
  const track = (bone, fullName, zs) => {
    const base = bone.quaternion.clone();
    const v = [];
    zs.forEach((z) => {
      e.set(0, 0, z); dq.setFromEuler(e);
      const q = base.clone().multiply(dq);
      v.push(q.x, q.y, q.z, q.w);
    });
    return new THREE.QuaternionKeyframeTrack(fullName + '.quaternion', times, v);
  };

  return new THREE.AnimationClip(name, 3.4, [
    track(B.RightArm, 'mixamorig_RightArm', armZ),
    track(B.RightForeArm, 'mixamorig_RightForeArm', foreZ),
  ]);
}

// Set a static raised welcoming pose (used for the USDZ/iOS export, which can't
// play skeletal animation).
export function applyGroomStaticWave(root) {
  const B = {};
  root.traverse((o) => { if (o.isBone) B[o.name.replace('mixamorig_', '')] = o; });
  if (!B.RightArm) return;
  const e = new THREE.Euler(), dq = new THREE.Quaternion();
  e.set(0, 0, -1.6); B.RightArm.quaternion.multiply(dq.setFromEuler(e));
  e.set(0, 0, -0.7); B.RightForeArm.quaternion.multiply(dq.setFromEuler(e));
}
