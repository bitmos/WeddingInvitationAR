import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { buildSceneGroup, buildWelcomeClip, buildGroomWelcomeClip } from './buildScene.js';
import { dressGroom, buildGroomWaveClip, applyGroomStaticWave } from './avatar/GroomOutfit.js';

// ── Asset preload ────────────────────────────────────────────────────────────
function loadImage(url) {
  return new Promise((res) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = url;
  });
}

// Ready Player Me avatars override the procedural ones if present.
async function loadAvatarGLBs() {
  const loader = new GLTFLoader();
  const tryLoad = (url) =>
    new Promise((res) => loader.load(url, (g) => res(g.scene), undefined, () => res(null)));
  const [bride, groom] = await Promise.all([
    tryLoad('/models/bride-rpm.glb'),
    tryLoad('/models/groom-rpm.glb'),
  ]);
  if (bride && groom) { console.log('[export] using Ready Player Me avatars'); return { bride, groom }; }
  return null;
}

let FACES = {};
let RPM;

// Dump world positions of key Mixamo bones to fit clothing precisely.
window.__boneInfo = function (url) {
  return new Promise((resolve, reject) => {
    new GLTFLoader().load(url, (gltf) => {
      gltf.scene.updateWorldMatrix(true, true);
      const byName = {};
      gltf.scene.traverse((o) => { if (o.isBone) byName[o.name] = o; });
      const wp = (n) => {
        const b = byName[n]; if (!b) return null;
        const v = new THREE.Vector3(); b.getWorldPosition(v);
        return [+v.x.toFixed(3), +v.y.toFixed(3), +v.z.toFixed(3)];
      };
      const names = ['mixamorig_Hips','mixamorig_Spine','mixamorig_Spine2','mixamorig_Neck','mixamorig_Head',
        'mixamorig_LeftShoulder','mixamorig_LeftArm','mixamorig_LeftForeArm','mixamorig_LeftHand',
        'mixamorig_RightShoulder','mixamorig_RightArm','mixamorig_RightForeArm','mixamorig_RightHand',
        'mixamorig_LeftUpLeg','mixamorig_LeftLeg','mixamorig_LeftFoot',
        'mixamorig_RightUpLeg','mixamorig_RightLeg','mixamorig_RightFoot'];
      const out = {};
      names.forEach((n) => out[n.replace('mixamorig_','')] = wp(n));
      resolve(out);
    }, undefined, reject);
  });
};

// Inspect any GLB: meshes, materials, rig (skinned), animations, bounds.
window.__inspect = function (url) {
  return new Promise((resolve, reject) => {
    new GLTFLoader().load(url, (gltf) => {
      const meshes = [], materials = new Set(), bones = [];
      let skinned = false, tris = 0;
      const matInfo = [];
      gltf.scene.traverse((o) => {
        if (o.isBone) bones.push(o.name);
        if (o.isSkinnedMesh) skinned = true;
        if (o.isMesh) {
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
            if (m) matInfo.push({ type: m.type, hasMap: !!m.map, mapSize: m.map?.image ? (m.map.image.width + 'x' + m.map.image.height) : null, color: m.color ? '#' + m.color.getHexString() : null, vertexColors: !!m.vertexColors, hasUV: !!o.geometry.attributes.uv });
          });
          const g = o.geometry;
          const t = g.index ? g.index.count / 3 : g.attributes.position.count / 3;
          tris += t;
          meshes.push({ name: o.name, material: o.material?.name || '(unnamed)', skinned: !!o.isSkinnedMesh, tris: Math.round(t) });
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m && materials.add(m.name || '(unnamed)'));
        }
      });
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const size = box.getSize(new THREE.Vector3());
      resolve({
        animations: gltf.animations.map((a) => a.name),
        skinned, boneCount: bones.length, bones: bones.slice(0, 40),
        meshCount: meshes.length, totalTris: Math.round(tris),
        materials: [...materials],
        matInfo,
        meshes,
        sizeMeters: { x: +size.x.toFixed(2), y: +size.y.toFixed(2), z: +size.z.toFixed(2) },
      });
    }, undefined, reject);
  });
};

async function save(name, bytes) {
  const res = await fetch('/__save?name=' + encodeURIComponent(name), { method: 'POST', body: bytes });
  return res.text();
}

// Load /models/groom.glb fresh, AS-IS (no outfit/face processing).
async function loadGroomDressed() {
  const gltf = await new Promise((res) =>
    new GLTFLoader().load('/models/groom.glb', res, undefined, () => res(null)));
  if (!gltf) return null;
  return gltf.scene;
}

// Combined "Welcome" clip: bride (procedural) + groom.
// Groom motion depends on the GLB: a Mixamo arm wave if it's rigged, otherwise a
// whole-body welcome bob/sway on the wrapper node.
function makeWelcomeClip(groom) {
  const tracks = buildWelcomeClip(['Bride']).tracks;
  if (groom) {
    let rigged = false;
    groom.traverse((o) => { if (o.isBone) rigged = true; });
    if (rigged) {
      const gc = buildGroomWaveClip(groom);
      if (gc) tracks.push(...gc.tracks);
    } else {
      tracks.push(...buildGroomWelcomeClip().tracks);
    }
  } else {
    tracks.push(...buildWelcomeClip(['Groom']).tracks);
  }
  return new THREE.AnimationClip('Welcome', 3.4, tracks);
}

// ── GLB (Android / web) — animated welcome wave ──
window.__exportGLB = async function () {
  const groom = await loadGroomDressed();
  const scene = buildSceneGroup({ faces: FACES, groomGLB: groom || undefined });
  const clip = makeWelcomeClip(groom);
  const result = await new Promise((resolve, reject) =>
    new GLTFExporter().parse(scene, resolve, reject,
      { binary: true, onlyVisible: true, animations: [clip] }));
  return save('models/scene.glb', result);
};

// ── USDZ (iOS Quick Look) — static welcoming pose, no lights ──
window.__exportUSDZ = async function () {
  const groom = await loadGroomDressed();
  if (groom) applyGroomStaticWave(groom);
  const scene = buildSceneGroup({ faces: FACES, groomGLB: groom || undefined, welcomePose: true });
  const lights = [];
  scene.traverse((o) => { if (o.isLight) lights.push(o); });
  lights.forEach((l) => l.removeFromParent());
  const arr = await new USDZExporter().parseAsync(scene);
  return save('models/scene.usdz', arr);
};

window.__exportAll = async function () {
  const glb = await window.__exportGLB();
  const usdz = await window.__exportUSDZ();
  return { glb, usdz };
};

// ── Live preview (setInterval so it renders even in headless contexts) ──
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a0800);
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 100);
camera.position.set(0, 1.6, 5.2);
camera.lookAt(0, 1.2, 0);
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const dir = new THREE.DirectionalLight(0xffe0a0, 1.6);
dir.position.set(3, 6, 5);
scene.add(dir);

(async () => {
  const [bride, groom] = await Promise.all([
    loadImage('/faces/bride_face.jpg'),
    loadImage('/faces/groom_face.jpg'),
  ]);
  FACES = { bride, groom };
  RPM = (await loadAvatarGLBs()) || undefined;

  const group = buildSceneGroup({ faces: FACES, avatarGLBs: RPM });
  scene.add(group);
  let t = 0;
  let autoRotate = true;
  setInterval(() => { if (autoRotate) { t += 0.01; group.rotation.y = Math.sin(t) * 0.5; } renderer.render(scene, camera); }, 16);

  // Render /models/scene.glb from a model-viewer-style camera (target + orbit
  // theta/phi/radius) so tour framings can be checked before wiring the UI.
  window.__renderSceneView = async (name, target, theta, phi, radius, fov = 38) => {
    const s = new THREE.Scene(); s.background = new THREE.Color(0x14100a);
    s.add(new THREE.AmbientLight(0xffffff, 0.8));
    const d = new THREE.DirectionalLight(0xffe6b8, 1.5); d.position.set(3, 6, 4); s.add(d);
    const gltf = await new Promise((res, rej) => new GLTFLoader().load('/models/scene.glb?x=' + Date.now(), res, undefined, rej));
    s.add(gltf.scene);
    const t = new THREE.Vector3(...target);
    const ph = THREE.MathUtils.degToRad(phi), th = THREE.MathUtils.degToRad(theta);
    const pos = new THREE.Vector3(
      t.x + radius * Math.sin(ph) * Math.sin(th),
      t.y + radius * Math.cos(ph),
      t.z + radius * Math.sin(ph) * Math.cos(th));
    const cam = new THREE.PerspectiveCamera(fov, 1, 0.01, 100);
    cam.position.copy(pos); cam.lookAt(t);
    renderer.setSize(720, 720, false);
    renderer.render(s, cam);
    const blob = await new Promise(r => renderer.domElement.toBlob(r, 'image/png'));
    renderer.setSize(window.innerWidth, window.innerHeight);
    const res = await fetch('/__save?name=' + encodeURIComponent(name), { method: 'POST', body: await blob.arrayBuffer() });
    return res.text();
  };

  // Render an external GLB on its own, saved to /public/<name>, for inspection.
  window.__renderGLB = async (url, name, view = 'front') => {
    const s = new THREE.Scene();
    s.background = new THREE.Color(0x222018);
    s.add(new THREE.AmbientLight(0xffffff, 0.9));
    const d = new THREE.DirectionalLight(0xffffff, 1.4); d.position.set(2, 4, 3); s.add(d);
    const gltf = await new Promise((res, rej) => new GLTFLoader().load(url, res, undefined, rej));
    s.add(gltf.scene);
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const c = box.getCenter(new THREE.Vector3());
    const sz = box.getSize(new THREE.Vector3());
    const cam = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
    const dist = sz.y * 1.5;
    if (view === 'back') cam.position.set(c.x, c.y + sz.y * 0.1, c.z - dist);
    else cam.position.set(c.x + dist * 0.2, c.y + sz.y * 0.05, c.z + dist);
    cam.lookAt(c.x, c.y, c.z);
    renderer.render(s, cam);
    const blob = await new Promise(r => renderer.domElement.toBlob(r, 'image/png'));
    const res = await fetch('/__save?name=' + encodeURIComponent(name), { method: 'POST', body: await blob.arrayBuffer() });
    return res.text();
  };

  // Render the groom GLB dressed in the sherwani, saved to /public/<name>.
  window.__renderDressed = async (url, name, dress = true, view = 'front') => {
    const s = new THREE.Scene();
    s.background = new THREE.Color(0x2a2620);
    s.add(new THREE.AmbientLight(0xffffff, 0.85));
    const d1 = new THREE.DirectionalLight(0xfff2dd, 1.5); d1.position.set(2, 4, 4); s.add(d1);
    const d2 = new THREE.DirectionalLight(0xffd9b0, 0.6); d2.position.set(-3, 2, 1); s.add(d2);
    const gltf = await new Promise((res, rej) => new GLTFLoader().load(url, res, undefined, rej));
    if (dress) dressGroom(gltf.scene, { faceImg: FACES.groom });
    s.add(gltf.scene);
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const c = box.getCenter(new THREE.Vector3());
    const sz = box.getSize(new THREE.Vector3());
    const cam = new THREE.PerspectiveCamera(38, 1, 0.01, 100);
    if (view === 'head') {
      const top = box.max.y;
      cam.position.set(c.x, top - 0.18, c.z + 0.7);
      cam.lookAt(c.x, top - 0.2, c.z);
    } else {
      cam.position.set(c.x + sz.y * 0.25, c.y + sz.y * 0.06, c.z + sz.y * 1.55);
      cam.lookAt(c.x, c.y, c.z);
    }
    renderer.render(s, cam);
    const blob = await new Promise(r => renderer.domElement.toBlob(r, 'image/png'));
    const res = await fetch('/__save?name=' + encodeURIComponent(name), { method: 'POST', body: await blob.arrayBuffer() });
    return res.text();
  };

  // Render the wave clip as a motion strip (sampled frames) to verify it.
  window.__renderWaveAnim = async (url, name, frames = 5) => {
    const gltf = await new Promise((res, rej) => new GLTFLoader().load(url, res, undefined, rej));
    const root = gltf.scene;
    dressGroom(root, { faceImg: FACES.groom });
    const clip = buildGroomWaveClip(root);
    const mixer = new THREE.AnimationMixer(root);
    mixer.clipAction(clip).play();

    const tile = 360;
    renderer.setSize(tile * frames, tile, false);
    const s = new THREE.Scene(); s.background = new THREE.Color(0x2a2620);
    s.add(new THREE.AmbientLight(0xffffff, 0.9));
    const d = new THREE.DirectionalLight(0xfff2dd, 1.4); d.position.set(2, 4, 4); s.add(d);
    s.add(root);
    // sample across the wave (skip the very ends which are the lowered pose)
    const sampleTimes = [];
    for (let i = 0; i < frames; i++) sampleTimes.push(0.5 + (1.8 * i) / (frames - 1));
    let prev = 0;
    const box = new THREE.Box3().setFromObject(root); const c = box.getCenter(new THREE.Vector3()); const sz = box.getSize(new THREE.Vector3());
    sampleTimes.forEach((t, i) => {
      mixer.update(t - prev); prev = t;
      root.updateWorldMatrix(true, true);
      const cam = new THREE.PerspectiveCamera(36, 1, 0.01, 100);
      cam.position.set(c.x, c.y + sz.y * 0.14, c.z + sz.y * 1.45); cam.lookAt(c.x, c.y + sz.y * 0.06, c.z);
      renderer.setViewport(i * tile, 0, tile, tile); renderer.setScissor(i * tile, 0, tile, tile); renderer.setScissorTest(true);
      renderer.render(s, cam);
    });
    renderer.setScissorTest(false);
    const blob = await new Promise(r => renderer.domElement.toBlob(r, 'image/png'));
    renderer.setSize(window.innerWidth, window.innerHeight);
    const res = await fetch('/__save?name=' + encodeURIComponent(name), { method: 'POST', body: await blob.arrayBuffer() });
    return res.text();
  };

  // Test arm-raise rotations on a Mixamo rig. `poses` is an array of
  // { arm:[x,y,z], fore:[x,y,z] } applied as local deltas; renders each tile.
  window.__renderWavePose = async (url, name, poses) => {
    const gltf = await new Promise((res, rej) => new GLTFLoader().load(url, res, undefined, rej));
    const root = gltf.scene;
    dressGroom(root, { faceImg: FACES.groom });
    const B = {};
    root.traverse((o) => { if (o.isBone) B[o.name.replace('mixamorig_', '')] = o; });
    const base = {};
    ['RightArm','RightForeArm','LeftArm','LeftForeArm'].forEach(n => base[n] = B[n].quaternion.clone());
    const e = new THREE.Euler(), q = new THREE.Quaternion();
    const N = poses.length, cols = N;
    const tile = 360;
    renderer.setSize(tile * cols, tile, false);
    const s = new THREE.Scene(); s.background = new THREE.Color(0x2a2620);
    s.add(new THREE.AmbientLight(0xffffff, 0.9));
    const d = new THREE.DirectionalLight(0xfff2dd, 1.4); d.position.set(2,4,4); s.add(d);
    s.add(root);
    const box = new THREE.Box3().setFromObject(root); const c = box.getCenter(new THREE.Vector3()); const sz = box.getSize(new THREE.Vector3());
    poses.forEach((p, i) => {
      ['RightArm','RightForeArm','LeftArm','LeftForeArm'].forEach(n => B[n].quaternion.copy(base[n]));
      if (p.arm) { e.set(...p.arm); B.RightArm.quaternion.multiply(q.setFromEuler(e)); }
      if (p.fore) { e.set(...p.fore); B.RightForeArm.quaternion.multiply(q.setFromEuler(e)); }
      const cam = new THREE.PerspectiveCamera(38, 1, 0.01, 100);
      cam.position.set(c.x, c.y + sz.y*0.12, c.z + sz.y*1.5); cam.lookAt(c.x, c.y + sz.y*0.05, c.z);
      renderer.setViewport(i*tile, 0, tile, tile); renderer.setScissor(i*tile, 0, tile, tile); renderer.setScissorTest(true);
      renderer.render(s, cam);
    });
    renderer.setScissorTest(false);
    const blob = await new Promise(r => renderer.domElement.toBlob(r, 'image/png'));
    renderer.setSize(window.innerWidth, window.innerHeight);
    const res = await fetch('/__save?name=' + encodeURIComponent(name), { method: 'POST', body: await blob.arrayBuffer() });
    return res.text();
  };

  // Capture a still from a chosen camera, saved to /public/<name>, for verification.
  window.__capture = async (name, pos, look) => {
    autoRotate = false; group.rotation.y = 0;
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.lookAt(look[0], look[1], look[2]);
    renderer.render(scene, camera);
    const blob = await new Promise(r => renderer.domElement.toBlob(r, 'image/png'));
    const buf = await blob.arrayBuffer();
    const res = await fetch('/__save?name=' + encodeURIComponent(name), { method: 'POST', body: buf });
    return res.text();
  };

  window.__exportReady = true;
  console.log('[export] ready — call window.__exportAll()');
})();
