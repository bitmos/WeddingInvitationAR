import * as THREE from 'three';
import { Avatar } from './avatar/Avatar.js';
import { Mantapa } from './environment/Mantapa.js';

// ─────────────────────────────────────────────────────────────────────────────
// Builds the complete mantapa + avatars scene as a single THREE.Group, ready to
// be exported to GLB/USDZ for model-viewer native AR (Scene Viewer / Quick Look).
//
// opts.faces      : { bride: HTMLImageElement, groom: HTMLImageElement }  (already face-cropped)
// opts.groomGLB   : Object3D  — a rigged groom model placed instead of the procedural one
// opts.welcomePose: true → set a static welcoming pose (for the USDZ/iOS static export)
// ─────────────────────────────────────────────────────────────────────────────
const POS = { bride: [-0.62, 0, 2.05], groom: [0.62, 0, 2.05] };

export function buildSceneGroup(opts = {}) {
  const root = new THREE.Group();
  root.name = 'WeddingScene';

  // ── Mantapa (doors open so the interior + couple are visible in AR) ──
  const mantapa = new Mantapa();
  mantapa.doors.left.rotation.y = Math.PI * 0.5;
  mantapa.doors.right.rotation.y = -Math.PI * 0.5;
  mantapa.group.name = 'Mantapa';
  root.add(mantapa.group);

  // ── Bride (always procedural, with her face photo) ──
  const bride = new Avatar(true);
  if (opts.faces?.bride) bride.setFacePhoto(opts.faces.bride, { scale: 1.12, dy: 0 });
  bride.setPosition(...POS.bride);
  bride.object3D.rotation.y = 0.22;
  bride.object3D.name = 'Bride';
  if (opts.welcomePose) bride.setWelcomePose();
  root.add(bride.object3D);

  // ── Groom: a rigged GLB if provided, otherwise procedural ──
  if (opts.groomGLB) {
    placeGroomGLB(opts.groomGLB, root);
  } else {
    const groom = new Avatar(false);
    if (opts.faces?.groom) groom.setFacePhoto(opts.faces.groom, { scale: 1.12, dy: 4 });
    groom.setPosition(...POS.groom);
    groom.object3D.rotation.y = -0.22;
    groom.object3D.name = 'Groom';
    if (opts.welcomePose) groom.setWelcomePose();
    root.add(groom.object3D);
  }

  return root;
}

// Scale a groom model to the scene, drop its feet on the floor, centre it, and
// place it flanking the doorway facing out. The model goes inside a wrapper node
// ('GroomGLB') kept at identity rotation so a whole-body welcome animation can be
// applied to the wrapper without disturbing the model's facing/placement.
function placeGroomGLB(g, root, targetHeight = 1.32) {
  const box = new THREE.Box3().setFromObject(g);
  const h = box.getSize(new THREE.Vector3()).y || 1;
  g.scale.setScalar(targetHeight / h);
  g.rotation.y = -0.2;                 // facing (slightly inward, toward guests)
  g.updateWorldMatrix(true, true);
  const b = new THREE.Box3().setFromObject(g);
  g.position.set(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2);

  const wrapper = new THREE.Group();
  wrapper.name = 'GroomGLB';
  wrapper.position.set(POS.groom[0], 0, POS.groom[2]);
  wrapper.add(g);
  root.add(wrapper);
}

// ─────────────────────────────────────────────────────────────────────────────
// A looping "welcome wave" animation clip, baked into the GLB so model-viewer
// auto-plays it. Right arm raises and waves; left arm opens in a welcoming
// gesture. Tracks target the named avatar bones (see Avatar._n()).
// ─────────────────────────────────────────────────────────────────────────────
export function buildWelcomeClip(prefixes = ['Bride', 'Groom']) {
  const tracks = [];
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const qTrack = (node, times, eulers) => {
    const v = [];
    eulers.forEach(([x, y, z]) => { e.set(x, y, z); q.setFromEuler(e); v.push(q.x, q.y, q.z, q.w); });
    tracks.push(new THREE.QuaternionKeyframeTrack(node + '.quaternion', times, v));
  };

  prefixes.forEach((who) => {
    // Right arm: down → raise → wave ×3 → down → hold (loops)
    qTrack(who + '_rightArm',
      [0.0, 0.6, 0.9, 1.2, 1.5, 1.8, 2.1, 2.7, 3.4],
      [
        [0, 0, 0],
        [-1.05, 0, -0.5],
        [-1.05, 0, -0.12],
        [-1.05, 0, -0.5],
        [-1.05, 0, -0.12],
        [-1.05, 0, -0.5],
        [-1.05, 0, -0.12],
        [0, 0, 0],
        [0, 0, 0],
      ]
    );
    // Left arm: gentle welcoming open and back
    qTrack(who + '_leftArm',
      [0.0, 0.7, 2.0, 2.7, 3.4],
      [
        [0, 0, 0],
        [-0.32, 0, 0.42],
        [-0.32, 0, 0.42],
        [0, 0, 0],
        [0, 0, 0],
      ]
    );
    // Subtle welcoming torso bow at the start of each loop
    qTrack(who + '_torso',
      [0.0, 0.5, 1.0, 3.4],
      [
        [0, 0, 0],
        [0.18, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ]
    );
  });

  return new THREE.AnimationClip('Welcome', 3.4, tracks);
}

// Whole-body "welcome" motion for a NON-rigged groom GLB (gentle greeting bob +
// sway), applied to the 'GroomGLB' wrapper node. No skeleton needed.
export function buildGroomWelcomeClip(node = 'GroomGLB') {
  const q = new THREE.Quaternion(), e = new THREE.Euler();
  const times = [0, 0.7, 1.4, 2.1, 2.8, 3.4];
  // x = forward bow, z = subtle side sway
  const eulers = [
    [0, 0, 0], [0.12, 0, 0.015], [0.03, 0, -0.02],
    [0.10, 0, 0.02], [0.0, 0, -0.008], [0, 0, 0],
  ];
  const qv = [];
  eulers.forEach(([x, y, z]) => { e.set(x, y, z); q.setFromEuler(e); qv.push(q.x, q.y, q.z, q.w); });
  return new THREE.AnimationClip('GroomWelcome', 3.4, [
    new THREE.QuaternionKeyframeTrack(node + '.quaternion', times, qv),
  ]);
}
