import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// Draws a realistic placeholder face onto a 512×512 canvas.
// Will be replaced by the user's actual photo later.
// ─────────────────────────────────────────────────────────────────────────────
function buildFaceCanvas(isBride) {
  const W = 512, H = 512;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d');

  const skinLight = isBride ? '#D4936B' : '#C07840';
  const skinMid   = isBride ? '#C07840' : '#A0633A';
  const skinDark  = isBride ? '#9A5C2E' : '#7A4620';

  // ── Face shape ──────────────────────────────────────────────────────────
  const faceGrad = c.createRadialGradient(256, 240, 40, 256, 260, 230);
  faceGrad.addColorStop(0,   skinLight);
  faceGrad.addColorStop(0.5, skinMid);
  faceGrad.addColorStop(1,   skinDark);
  c.fillStyle = faceGrad;
  c.beginPath();
  c.ellipse(256, 265, 185, 215, 0, 0, Math.PI * 2);
  c.fill();

  // Jaw narrowing
  c.fillStyle = skinDark;
  c.beginPath();
  c.ellipse(256, 430, 120, 60, 0, 0, Math.PI * 2);
  c.fill();

  // ── Forehead highlight ──────────────────────────────────────────────────
  const fgGrad = c.createRadialGradient(256, 160, 20, 256, 160, 100);
  fgGrad.addColorStop(0, 'rgba(255,220,180,0.55)');
  fgGrad.addColorStop(1, 'rgba(255,220,180,0)');
  c.fillStyle = fgGrad;
  c.beginPath();
  c.ellipse(256, 170, 130, 90, 0, 0, Math.PI * 2);
  c.fill();

  // Cheek highlights
  [170, 342].forEach(x => {
    const cg = c.createRadialGradient(x, 290, 5, x, 290, 55);
    cg.addColorStop(0, 'rgba(255,160,130,0.35)');
    cg.addColorStop(1, 'rgba(255,160,130,0)');
    c.fillStyle = cg;
    c.beginPath(); c.ellipse(x, 290, 55, 45, 0, 0, Math.PI*2); c.fill();
  });

  // ── Eyes ────────────────────────────────────────────────────────────────
  const eyeY = 255;
  [[170, eyeY], [342, eyeY]].forEach(([ex, ey], i) => {
    const flip = i === 0 ? 1 : -1;

    // Eye socket shadow
    c.fillStyle = 'rgba(60,30,10,0.18)';
    c.beginPath();
    c.ellipse(ex, ey, 50, 28, flip*0.15, 0, Math.PI*2);
    c.fill();

    // White of eye (sclera)
    c.fillStyle = '#F8F4EE';
    c.beginPath();
    c.ellipse(ex, ey, 40, 20, flip*0.15, 0, Math.PI*2);
    c.fill();

    // Iris
    const irisCx = ex + flip*4;
    const irisGrad = c.createRadialGradient(irisCx-3, ey-3, 2, irisCx, ey, 14);
    irisGrad.addColorStop(0,   '#5C3D1A');
    irisGrad.addColorStop(0.5, '#3A2010');
    irisGrad.addColorStop(1,   '#1A0A00');
    c.fillStyle = irisGrad;
    c.beginPath(); c.arc(irisCx, ey, 14, 0, Math.PI*2); c.fill();

    // Pupil
    c.fillStyle = '#0A0500';
    c.beginPath(); c.arc(irisCx, ey, 7, 0, Math.PI*2); c.fill();

    // Catchlight
    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.beginPath(); c.ellipse(irisCx+4, ey-5, 4, 3, 0.5, 0, Math.PI*2); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.4)';
    c.beginPath(); c.ellipse(irisCx-5, ey+4, 2, 2, 0, 0, Math.PI*2); c.fill();

    // Upper eyelid
    c.strokeStyle = '#2A1505';
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(ex - 40, ey + 5);
    c.bezierCurveTo(ex - 20, ey - 22, ex + 20, ey - 22, ex + 40, ey + 5);
    c.stroke();

    // Lower lash line
    c.strokeStyle = 'rgba(42,21,5,0.5)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(ex - 38, ey + 7);
    c.bezierCurveTo(ex - 10, ey + 20, ex + 10, ey + 20, ex + 38, ey + 7);
    c.stroke();

    // Eyebrow
    const browY = ey - 32;
    const browGrad = c.createLinearGradient(ex - 40, browY, ex + 40, browY);
    browGrad.addColorStop(0,   'rgba(30,15,5,0.1)');
    browGrad.addColorStop(0.2, 'rgba(30,15,5,0.9)');
    browGrad.addColorStop(0.8, 'rgba(30,15,5,0.85)');
    browGrad.addColorStop(1,   'rgba(30,15,5,0.1)');
    c.fillStyle = browGrad;
    c.beginPath();
    c.moveTo(ex - 42, browY + 6);
    c.bezierCurveTo(ex - 20, browY - 8, ex + 15, browY - 8, ex + 42, browY + 2);
    c.bezierCurveTo(ex + 25, browY + 8, ex - 15, browY + 8, ex - 42, browY + 6);
    c.fill();
  });

  // ── Nose ────────────────────────────────────────────────────────────────
  // Nose bridge shadow
  c.strokeStyle = 'rgba(80,40,15,0.28)';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(245, 265); c.lineTo(237, 320); c.quadraticCurveTo(242, 335, 256, 336);
  c.quadraticCurveTo(270, 335, 275, 320); c.lineTo(267, 265);
  c.stroke();

  // Nostrils
  c.fillStyle = 'rgba(60,25,5,0.45)';
  [[-22, 330], [22, 330]].forEach(([dx, ny]) => {
    c.beginPath(); c.ellipse(256+dx, ny, 14, 9, dx<0?0.3:-0.3, 0, Math.PI*2); c.fill();
  });

  // Nose tip highlight
  const ntGrad = c.createRadialGradient(256, 322, 2, 256, 322, 18);
  ntGrad.addColorStop(0, 'rgba(255,210,170,0.5)');
  ntGrad.addColorStop(1, 'rgba(255,210,170,0)');
  c.fillStyle = ntGrad;
  c.beginPath(); c.ellipse(256, 322, 22, 14, 0, 0, Math.PI*2); c.fill();

  // ── Lips ────────────────────────────────────────────────────────────────
  const lipY = 372;
  const lipColor = isBride ? '#C0334A' : '#A04030';
  const lipDark  = isBride ? '#8B1A2C' : '#7A2A20';

  // Upper lip
  c.fillStyle = lipColor;
  c.beginPath();
  c.moveTo(210, lipY);
  c.bezierCurveTo(226, lipY - 14, 244, lipY - 18, 256, lipY - 12);
  c.bezierCurveTo(268, lipY - 18, 286, lipY - 14, 302, lipY);
  c.bezierCurveTo(280, lipY + 6, 232, lipY + 6, 210, lipY);
  c.fill();

  // Upper lip Cupid bow
  c.fillStyle = lipColor;
  c.beginPath();
  c.moveTo(222, lipY - 2);
  c.bezierCurveTo(235, lipY - 16, 246, lipY - 20, 256, lipY - 14);
  c.bezierCurveTo(266, lipY - 20, 277, lipY - 16, 290, lipY - 2);
  c.bezierCurveTo(275, lipY - 8, 237, lipY - 8, 222, lipY - 2);
  c.fill();

  // Lower lip
  const llGrad = c.createLinearGradient(210, lipY, 302, lipY + 28);
  llGrad.addColorStop(0, lipColor);
  llGrad.addColorStop(0.5, isBride ? '#D4556A' : '#B85040');
  llGrad.addColorStop(1, lipColor);
  c.fillStyle = llGrad;
  c.beginPath();
  c.moveTo(210, lipY);
  c.bezierCurveTo(225, lipY + 30, 287, lipY + 30, 302, lipY);
  c.bezierCurveTo(285, lipY + 34, 227, lipY + 34, 210, lipY);
  c.fill();

  // Lip shine
  c.fillStyle = 'rgba(255,200,200,0.35)';
  c.beginPath();
  c.ellipse(256, lipY + 14, 32, 8, 0, 0, Math.PI*2);
  c.fill();

  // Lip line
  c.strokeStyle = lipDark;
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(210, lipY); c.bezierCurveTo(235, lipY + 2, 277, lipY + 2, 302, lipY);
  c.stroke();

  // ── Bride extras ─────────────────────────────────────────────────────
  if (isBride) {
    // Bindi
    const bindiGrad = c.createRadialGradient(256, 218, 1, 256, 218, 10);
    bindiGrad.addColorStop(0, '#FF2244');
    bindiGrad.addColorStop(1, '#AA0022');
    c.fillStyle = bindiGrad;
    c.beginPath(); c.arc(256, 218, 10, 0, Math.PI*2); c.fill();
    c.strokeStyle = 'rgba(255,180,80,0.7)'; c.lineWidth = 1;
    c.beginPath(); c.arc(256, 218, 12, 0, Math.PI*2); c.stroke();

    // Maang tikka (forehead ornament)
    c.strokeStyle = 'rgba(212,175,55,0.85)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(256, 100); c.lineTo(256, 218); c.stroke();
    const tgGrad = c.createRadialGradient(256, 100, 2, 256, 100, 14);
    tgGrad.addColorStop(0, '#FFE566'); tgGrad.addColorStop(1, '#B8860B');
    c.fillStyle = tgGrad;
    c.beginPath(); c.arc(256, 100, 13, 0, Math.PI*2); c.fill();
    c.fillStyle = '#CC2244';
    c.beginPath(); c.arc(256, 100, 5, 0, Math.PI*2); c.fill();

    // Kajal / eye liner (bride wears heavier liner)
    [[170, eyeY], [342, eyeY]].forEach(([ex, ey]) => {
      c.strokeStyle = 'rgba(10,5,0,0.9)';
      c.lineWidth = 3.5;
      c.beginPath();
      c.moveTo(ex - 42, ey + 4);
      c.bezierCurveTo(ex - 10, ey - 24, ex + 25, ey - 24, ex + 46, ey + 2);
      c.stroke();
      // Wing
      c.beginPath();
      c.moveTo(ex + 42, ey + 2);
      c.lineTo(ex + 52, ey - 8);
      c.stroke();
    });
  } else {
    // Groom — slight beard/stubble
    c.fillStyle = 'rgba(20,10,2,0.18)';
    c.beginPath();
    c.ellipse(256, 420, 140, 55, 0, 0, Math.PI*2);
    c.fill();
    // Defined jaw line
    c.strokeStyle = 'rgba(20,10,2,0.12)';
    c.lineWidth = 8;
    c.beginPath();
    c.moveTo(90, 280); c.quadraticCurveTo(75, 390, 256, 460);
    c.quadraticCurveTo(437, 390, 422, 280);
    c.stroke();
  }

  // ── Ears ─────────────────────────────────────────────────────────────────
  [56, 456].forEach((ex, i) => {
    c.fillStyle = skinMid;
    c.beginPath();
    c.ellipse(ex, 275, 28, 38, 0, 0, Math.PI*2);
    c.fill();
    c.fillStyle = skinDark;
    c.beginPath();
    c.ellipse(ex + (i===0?8:-8), 275, 14, 24, 0, 0, Math.PI*2);
    c.fill();
    if (isBride) {
      // Earring
      c.fillStyle = '#D4AF37';
      c.beginPath(); c.arc(ex, 308, 7, 0, Math.PI*2); c.fill();
    }
  });

  // ── Neck ─────────────────────────────────────────────────────────────────
  const neckGrad = c.createLinearGradient(210, 470, 302, 512);
  neckGrad.addColorStop(0, skinMid);
  neckGrad.addColorStop(1, skinDark);
  c.fillStyle = neckGrad;
  c.beginPath();
  c.moveTo(210, 470); c.lineTo(302, 470); c.lineTo(312, 512); c.lineTo(200, 512);
  c.closePath(); c.fill();

  // ── Placeholder text (semi-transparent) ──────────────────────────────────
  c.fillStyle = 'rgba(255,255,255,0.08)';
  c.font = 'bold 20px sans-serif';
  c.textAlign = 'center';
  c.fillText(isBride ? 'Shreya' : 'Shravan', 256, 500);

  return cv;
}

// ─────────────────────────────────────────────────────────────────────────────
// Builds the 3D body mesh in Indian traditional wedding attire
// ─────────────────────────────────────────────────────────────────────────────
export class Avatar {
  constructor(isBride = false) {
    this.isBride = isBride;
    this.group = new THREE.Group();
    this.bones = {};
    this._faceCanvas = buildFaceCanvas(isBride);
    this._faceTex = new THREE.CanvasTexture(this._faceCanvas);
    this._build();
  }

  // Unique node-name prefix so baked animation tracks resolve per-avatar
  _n(part) { return (this.isBride ? 'Bride' : 'Groom') + '_' + part; }

  // ── Material helpers ──────────────────────────────────────────────────────
  _skin() {
    return new THREE.MeshPhysicalMaterial({
      color: this.isBride ? 0xC07840 : 0x9A5830,
      roughness: 0.72,
      metalness: 0.0,
      clearcoat: 0.1,
      clearcoatRoughness: 0.6,
      sheen: 0.08,
      sheenColor: new THREE.Color(0xFF9966),
    });
  }
  _cloth(hex, metal = 0.08, rough = 0.72) {
    return new THREE.MeshPhysicalMaterial({ color: hex, roughness: rough, metalness: metal, sheen: 0.15, sheenColor: new THREE.Color(hex) });
  }
  _gold() {
    return new THREE.MeshStandardMaterial({ color: 0xD4AF37, roughness: 0.18, metalness: 0.92 });
  }
  _hair() {
    return new THREE.MeshStandardMaterial({ color: 0x110800, roughness: 0.8, metalness: 0.05 });
  }

  // ── Build ─────────────────────────────────────────────────────────────────
  _build() {
    const g = this.group;
    const skin = this._skin();
    const gold = this._gold();
    const hair = this._hair();

    // ── HEAD & FACE ──────────────────────────────────────────────────────
    // Head — slightly flattened sphere for human-like shape
    const headGeo = new THREE.SphereGeometry(0.118, 32, 32);
    // Scale Y slightly more for elongated human head
    const headMesh = new THREE.Mesh(headGeo, new THREE.MeshPhysicalMaterial({
      map: this._faceTex,
      roughness: 0.85,
      metalness: 0.0,
      clearcoat: 0.0,
    }));
    headMesh.scale.set(1.0, 1.16, 0.94);
    headMesh.position.set(0, 1.635, 0);
    headMesh.castShadow = true;
    headMesh.name = this._n('head');
    g.add(headMesh);
    this.bones.head = headMesh;

    // Back of head (skin color — face texture only covers front half)
    const backHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.116, 24, 24),
      skin
    );
    backHead.scale.set(1.0, 1.16, 0.94);
    backHead.position.set(0, 1.635, -0.005);
    g.add(backHead);

    // ── HAIR ──────────────────────────────────────────────────────────────
    if (this.isBride) {
      // Hair cap — covers only the crown/back so the face stays open
      const hairCap = new THREE.Mesh(
        new THREE.SphereGeometry(0.126, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.42),
        hair
      );
      hairCap.scale.set(1.0, 1.16, 1.0);
      hairCap.position.set(0, 1.635, 0);
      g.add(hairCap);
      // Hair sweep down the back of the head
      const hairBack = new THREE.Mesh(
        new THREE.SphereGeometry(0.122, 24, 24, 0, Math.PI * 2, Math.PI * 0.32, Math.PI * 0.5),
        hair
      );
      hairBack.scale.set(1.0, 1.18, 0.86);
      hairBack.position.set(0, 1.635, -0.03);
      g.add(hairBack);

      // Bun
      const bun = new THREE.Mesh(new THREE.SphereGeometry(0.055, 20, 20), hair);
      bun.scale.set(1.3, 0.8, 1.0);
      bun.position.set(0, 1.83, -0.06);
      g.add(bun);

      // Bun ornament
      const bunPin = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.005, 8, 20), gold);
      bunPin.position.set(0, 1.84, -0.06);
      g.add(bunPin);

      // Maang tikka chain (positioned at top of head going to forehead)
      const tikkaChain = new THREE.Mesh(
        new THREE.CylinderGeometry(0.003, 0.003, 0.16, 6),
        gold
      );
      tikkaChain.position.set(0, 1.74, 0.06);
      tikkaChain.rotation.x = 0.25;
      tikkaChain.name = 'faceOrnament';
      g.add(tikkaChain);

      const tikkaPendant = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 12), gold);
      tikkaPendant.position.set(0, 1.67, 0.112);
      tikkaPendant.name = 'faceOrnament';
      g.add(tikkaPendant);
      // Red center
      const tikkaRed = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xCC1133, roughness: 0.4, metalness: 0.2 }));
      tikkaRed.position.set(0, 1.672, 0.118);
      tikkaRed.name = 'faceOrnament';
      g.add(tikkaRed);

    } else {
      // Groom — short cropped hair
      const hairCap = new THREE.Mesh(
        new THREE.SphereGeometry(0.121, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.5),
        hair
      );
      hairCap.scale.set(1.0, 1.1, 0.95);
      hairCap.position.set(0, 1.655, 0);
      g.add(hairCap);

      // Turban (pagri) — layered, realistic
      const pagriMat = this._cloth(0xCC4400, 0.05, 0.75);
      const pagriBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.135, 0.13, 0.15, 32),
        pagriMat
      );
      pagriBase.position.set(0, 1.785, 0);
      g.add(pagriBase);

      // Pagri coils
      for (let i = 0; i < 5; i++) {
        const coil = new THREE.Mesh(
          new THREE.TorusGeometry(0.13 - i * 0.003, 0.018, 10, 40),
          this._cloth(i % 2 === 0 ? 0xCC4400 : 0xAA3800, 0.05, 0.75)
        );
        coil.position.set(0, 1.72 + i * 0.032, 0);
        coil.rotation.x = Math.PI / 2;
        g.add(coil);
      }

      // Gold sehra / kalgi ornament
      const kalgi = new THREE.Mesh(
        new THREE.CylinderGeometry(0.005, 0.003, 0.11, 8), gold
      );
      kalgi.position.set(0.07, 1.87, 0.05);
      kalgi.rotation.z = -0.25;
      g.add(kalgi);
      const kalgiDrop = new THREE.Mesh(new THREE.SphereGeometry(0.013, 10, 10), gold);
      kalgiDrop.position.set(0.075, 1.93, 0.05);
      g.add(kalgiDrop);
      const kalgiRuby = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xFF1133, roughness: 0.3, metalness: 0.3 }));
      kalgiRuby.position.set(0.075, 1.942, 0.05);
      g.add(kalgiRuby);
    }

    // ── NECK ──────────────────────────────────────────────────────────────
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.048, 0.1, 20), skin
    );
    neck.position.set(0, 1.515, 0);
    g.add(neck);

    // ── TORSO / UPPER BODY ────────────────────────────────────────────────
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 1.26, 0);
    torsoGroup.name = this._n('torso');
    g.add(torsoGroup);
    this.bones.torso = torsoGroup;

    if (this.isBride) {
      // Blouse (choli) — fitted
      const blouse = new THREE.Mesh(
        new THREE.CylinderGeometry(0.145, 0.138, 0.28, 24),
        this._cloth(0xAA0022, 0.12, 0.7)
      );
      torsoGroup.add(blouse);

      // Gold border at blouse hem
      const blouseHem = new THREE.Mesh(
        new THREE.TorusGeometry(0.14, 0.012, 8, 28),
        gold
      );
      blouseHem.position.y = -0.14;
      blouseHem.rotation.x = Math.PI / 2;
      torsoGroup.add(blouseHem);

      // Saree pallu drape over shoulder
      const pallaMat = this._cloth(0xCC1133, 0.1, 0.72);
      const palla = new THREE.Mesh(
        new THREE.CylinderGeometry(0.162, 0.24, 0.62, 20),
        pallaMat
      );
      palla.position.set(0.06, -0.16, 0.02);
      palla.rotation.z = 0.1;
      torsoGroup.add(palla);

      // Gold zari border on saree
      for (let i = 0; i < 4; i++) {
        const border = new THREE.Mesh(
          new THREE.TorusGeometry(0.245 + i * 0.003, 0.007, 6, 24),
          gold
        );
        border.position.set(0.06, -0.36 + i * -0.02, 0.02);
        border.rotation.x = Math.PI / 2;
        torsoGroup.add(border);
      }

    } else {
      // Sherwani — longer jacket
      const sherwaniMat = this._cloth(0xF5F0E0, 0.06, 0.78);
      const sherwani = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.155, 0.32, 24),
        sherwaniMat
      );
      torsoGroup.add(sherwani);

      // Sherwani collar
      const collar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.06, 20),
        this._cloth(0xEAE5D0, 0.06, 0.78)
      );
      collar.position.y = 0.16;
      torsoGroup.add(collar);

      // Gold buttons down centre
      for (let i = 0; i < 6; i++) {
        const btn = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 8), gold);
        btn.position.set(0, 0.13 - i * 0.055, 0.157);
        torsoGroup.add(btn);
      }

      // Gold trim around collar
      const collarTrim = new THREE.Mesh(
        new THREE.TorusGeometry(0.1, 0.008, 8, 24, Math.PI),
        gold
      );
      collarTrim.position.set(0, 0.188, 0);
      collarTrim.rotation.x = Math.PI / 2;
      torsoGroup.add(collarTrim);
    }

    // Necklace area skin
    const deco = new THREE.Mesh(
      new THREE.TorusGeometry(0.09, 0.006, 8, 24),
      gold
    );
    deco.position.set(0, 1.465, 0);
    deco.rotation.x = Math.PI / 2;
    g.add(deco);

    if (this.isBride) {
      // Mangalsutra / necklace beads
      for (let i = 0; i < 22; i++) {
        const angle = (i / 22) * Math.PI;
        const r = 0.092;
        const bead = new THREE.Mesh(new THREE.SphereGeometry(0.007, 7, 7), gold);
        bead.position.set(
          Math.cos(angle - Math.PI * 0.5) * r,
          1.455 - Math.abs(Math.sin(angle - Math.PI * 0.5)) * 0.045,
          Math.sin(angle - Math.PI * 0.5) * 0.018 + 0.09
        );
        g.add(bead);
      }
      // Pendant
      const pendant = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.008, 0.04, 10), gold);
      pendant.position.set(0, 1.408, 0.092);
      pendant.rotation.x = -0.4;
      g.add(pendant);
    }

    // ── ARMS ──────────────────────────────────────────────────────────────
    ['left', 'right'].forEach(side => {
      const s = side === 'left' ? -1 : 1;

      const armRoot = new THREE.Group();
      armRoot.position.set(s * 0.163, 1.432, 0);
      armRoot.name = this._n(`${side}Arm`);
      g.add(armRoot);
      this.bones[`${side}Arm`] = armRoot;

      // Shoulder sphere for smooth joint
      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.056, 16, 16), this.isBride
        ? this._cloth(0xAA0022, 0.12, 0.7)
        : this._cloth(0xF5F0E0, 0.06, 0.78)
      );
      shoulder.position.set(s * 0.01, 0, 0);
      armRoot.add(shoulder);

      // Upper arm
      const upper = new THREE.Mesh(
        new THREE.CylinderGeometry(0.046, 0.040, 0.30, 18),
        this.isBride
          ? this._cloth(0xCC1133, 0.1, 0.72) // saree sleeve
          : this._cloth(0xF5F0E0, 0.06, 0.78)
      );
      upper.position.set(s * 0.082, -0.15, 0);
      upper.rotation.z = s * 0.28;
      armRoot.add(upper);

      // Elbow pivot
      const elbow = new THREE.Group();
      elbow.position.set(s * 0.155, -0.30, 0);
      armRoot.add(elbow);
      this.bones[`${side}Elbow`] = elbow;

      // Forearm (skin — bride's sleeve ends here)
      const fore = new THREE.Mesh(
        new THREE.CylinderGeometry(0.036, 0.029, 0.26, 16), skin
      );
      fore.position.set(0, -0.13, 0);
      elbow.add(fore);

      // Hand
      const hand = new THREE.Mesh(
        new THREE.SphereGeometry(0.040, 16, 16), skin
      );
      hand.scale.set(0.80, 0.72, 0.55);
      hand.position.set(0, -0.273, 0);
      elbow.add(hand);

      // Fingers hint (4 small cylinders)
      for (let f = 0; f < 4; f++) {
        const fx = (f - 1.5) * 0.015;
        const finger = new THREE.Mesh(
          new THREE.CylinderGeometry(0.006, 0.005, 0.05, 6), skin
        );
        finger.position.set(fx, -0.315, s * 0.008);
        elbow.add(finger);
      }

      // Bangles for bride
      if (this.isBride) {
        const bangleColors = [0xD4AF37, 0xCC1133, 0x006633, 0xD4AF37, 0xFF4466];
        bangleColors.forEach((bc, bi) => {
          const bangle = new THREE.Mesh(
            new THREE.TorusGeometry(0.038, 0.007, 8, 22),
            this._cloth(bc, bc === 0xD4AF37 ? 0.85 : 0.1, bc === 0xD4AF37 ? 0.15 : 0.65)
          );
          bangle.position.set(0, -0.175 + bi * 0.02, 0);
          bangle.rotation.x = Math.PI / 2;
          elbow.add(bangle);
        });
      } else {
        // Sherwani cuff
        const cuff = new THREE.Mesh(
          new THREE.CylinderGeometry(0.038, 0.038, 0.04, 16),
          this._cloth(0xEAE5D0, 0.06, 0.78)
        );
        cuff.position.set(0, -0.05, 0);
        elbow.add(cuff);
        const cuffTrim = new THREE.Mesh(
          new THREE.TorusGeometry(0.038, 0.006, 6, 20), gold
        );
        cuffTrim.position.set(0, -0.07, 0);
        cuffTrim.rotation.x = Math.PI / 2;
        elbow.add(cuffTrim);
      }
    });

    // Nose ring for bride
    if (this.isBride) {
      const noseRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.013, 0.003, 7, 18), gold
      );
      noseRing.position.set(-0.042, 1.61, 0.112);
      noseRing.rotation.y = 0.5;
      noseRing.name = 'faceOrnament';
      g.add(noseRing);

      // Earrings — jhumka style
      [-0.126, 0.126].forEach(x => {
        const earTop = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 10), gold);
        earTop.position.set(x, 1.573, 0.02);
        g.add(earTop);
        const jhumka = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.052, 14), gold);
        jhumka.position.set(x, 1.535, 0.02);
        g.add(jhumka);
      });
    }

    // ── LOWER BODY ────────────────────────────────────────────────────────
    const lowerMat = this.isBride
      ? this._cloth(0xCC1133, 0.08, 0.72)
      : this._cloth(0xF5F0E0, 0.06, 0.78);

    const lower = new THREE.Mesh(
      new THREE.CylinderGeometry(this.isBride ? 0.165 : 0.158, this.isBride ? 0.225 : 0.168, 0.52, 24),
      lowerMat
    );
    lower.position.set(0, 0.82, 0);
    lower.castShadow = true;
    g.add(lower);

    // Saree/dhoti hem with gold border
    const hem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.228, 0.232, 0.035, 24),
      gold
    );
    hem.position.set(0, 0.565, 0);
    g.add(hem);

    if (!this.isBride) {
      // Kurta / sherwani lower extension
      const kurta = new THREE.Mesh(
        new THREE.CylinderGeometry(0.156, 0.152, 0.30, 24),
        this._cloth(0xF5F0E0, 0.06, 0.78)
      );
      kurta.position.set(0, 0.70, 0);
      g.add(kurta);
    }

    // ── FEET & SHOES ─────────────────────────────────────────────────────
    const shoeColor = this.isBride ? 0xC09010 : 0x2A1500;
    [-0.062, 0.062].forEach((x, i) => {
      const shoe = new THREE.Mesh(
        new THREE.BoxGeometry(0.075, 0.048, 0.155),
        new THREE.MeshStandardMaterial({ color: shoeColor, roughness: 0.55, metalness: this.isBride ? 0.5 : 0.1 })
      );
      shoe.position.set(x, 0.565, 0.022);
      shoe.castShadow = true;
      g.add(shoe);

      if (this.isBride) {
        // Heel
        const heel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.016, 0.013, 0.065, 8),
          new THREE.MeshStandardMaterial({ color: 0xB8860B, roughness: 0.3, metalness: 0.7 })
        );
        heel.position.set(x, 0.535, -0.055);
        g.add(heel);
      }
    });

    g.castShadow = true;
    g.scale.set(0.73, 0.73, 0.73);
  }

  get object3D() { return this.group; }
  setPosition(x, y, z) { this.group.position.set(x, y, z); }

  // Map a user-provided (already face-cropped, square) photo onto a flat,
  // feathered "face plate" mounted on the front of the head. A flat plate keeps
  // the photo undistorted (unlike wrapping it around the sphere) so the person
  // stays recognizable. opts.scale / opts.dy fine-tune the framing.
  setFacePhoto(source, opts = {}) {
    const { scale = 1.0, dy = 0 } = opts;
    const img = typeof source === 'string' ? new Image() : source;
    const apply = () => {
      // 1) Repaint the skull as plain skin so no procedural features peek out
      const skinHex = this.isBride ? 0xC07840 : 0x9A5830;
      const head = this.bones.head;
      head.material.map = null;
      head.material.color.setHex(skinHex);
      head.material.needsUpdate = true;
      // Remove procedural face ornaments that clash with the real photo
      this.group.children
        .filter((c) => c.name === 'faceOrnament')
        .forEach((c) => this.group.remove(c));

      // 2) Build the feathered face texture
      const S = 512;
      const cv = document.createElement('canvas');
      cv.width = cv.height = S;
      const ctx = cv.getContext('2d');
      const w = 470 * scale, h = 470 * scale;
      ctx.drawImage(img, S / 2 - w / 2, S / 2 - h / 2 + dy, w, h);
      // Feather to transparent at the oval edge so it blends into the skin
      ctx.globalCompositeOperation = 'destination-in';
      const rg = ctx.createRadialGradient(S / 2, S * 0.49, S * 0.22, S / 2, S * 0.5, S * 0.49);
      rg.addColorStop(0, 'rgba(0,0,0,1)');
      rg.addColorStop(0.82, 'rgba(0,0,0,1)');
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, S, S);

      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;

      // 3) Flat face plate on the front of the head (photo stays undistorted;
      //    feathered edges blend it into the spherical skin head)
      const plate = new THREE.Mesh(
        new THREE.PlaneGeometry(0.212, 0.236),
        new THREE.MeshStandardMaterial({
          map: tex, transparent: true, roughness: 0.88, metalness: 0,
          polygonOffset: true, polygonOffsetFactor: -2,
        })
      );
      plate.position.set(0, 1.646, 0.118);
      plate.renderOrder = 2;
      this.group.add(plate);
      this.bones.facePlate = plate;
    };
    if (typeof source === 'string') { img.onload = apply; img.src = source; }
    else apply();
  }

  // Static welcoming pose (used for the iOS/USDZ static export)
  setWelcomePose() {
    if (this.bones.rightArm) this.bones.rightArm.rotation.set(-1.0, 0, -0.35);
    if (this.bones.leftArm) this.bones.leftArm.rotation.set(-0.35, 0, 0.4);
  }

  // Gentle idle breathing sway
  idleSway(time) {
    const s = Math.sin(time * 0.75 + (this.isBride ? 0 : Math.PI));
    this.group.rotation.y = s * 0.022;
  }
}
