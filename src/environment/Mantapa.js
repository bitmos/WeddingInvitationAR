import * as THREE from 'three';

// Builds a traditional Indian wedding mandapa (mantapa) scene
export class Mantapa {
  constructor() {
    this.group = new THREE.Group();
    this.doors = { left: null, right: null };
    this.doorOpen = false;
    this._build();
  }

  _mat(color, metalness = 0, roughness = 0.7, emissive = 0x000000, emissiveIntensity = 0) {
    return new THREE.MeshStandardMaterial({ color, metalness, roughness, emissive, emissiveIntensity });
  }

  _build() {
    this._buildPlatform();
    this._buildPillars();
    this._buildRoof();
    this._buildDoors();
    this._buildGarlands();
    this._buildFlowers();
    this._buildInterior();
    this._buildLights();
  }

  _buildPlatform() {
    // Main stage platform
    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.18, 3.6),
      this._mat(0xF5E6C8, 0.05, 0.85)
    );
    platform.position.set(0, -0.09, 0);
    platform.receiveShadow = true;
    this.group.add(platform);

    // Gold trim around platform
    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(3.7, 0.06, 3.7),
      this._mat(0xD4AF37, 0.8, 0.2)
    );
    trim.position.set(0, 0.03, 0);
    this.group.add(trim);

    // Steps at front
    [0.14, 0.07].forEach((h, i) => {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.075, 0.22),
        this._mat(0xE8D5A3, 0.05, 0.85)
      );
      step.position.set(0, -0.075 + i * 0.075, 1.93 + i * 0.22);
      this.group.add(step);
    });
  }

  _buildPillars() {
    const positions = [
      [-1.5, 1.5], [1.5, 1.5],
      [-1.5, -1.5], [1.5, -1.5]
    ];

    positions.forEach(([x, z]) => {
      const pillar = new THREE.Group();

      // Main shaft
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.14, 2.8, 16),
        this._mat(0xF5E6C8, 0.1, 0.7)
      );
      shaft.position.y = 1.4;
      shaft.castShadow = true;
      pillar.add(shaft);

      // Decorative rings on pillar
      [0.4, 0.9, 1.4, 1.9, 2.4].forEach(y => {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.14, 0.025, 8, 20),
          this._mat(0xD4AF37, 0.8, 0.2)
        );
        ring.position.y = y;
        ring.rotation.x = Math.PI / 2;
        pillar.add(ring);
      });

      // Base block
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.12, 0.3),
        this._mat(0xD4AF37, 0.7, 0.3)
      );
      base.position.y = 0.06;
      pillar.add(base);

      // Capital (top of pillar)
      const capital = new THREE.Mesh(
        new THREE.BoxGeometry(0.34, 0.14, 0.34),
        this._mat(0xD4AF37, 0.7, 0.2)
      );
      capital.position.y = 2.87;
      pillar.add(capital);

      pillar.position.set(x, 0, z);
      this.group.add(pillar);
    });
  }

  _buildRoof() {
    // Main flat roof
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 0.12, 3.8),
      this._mat(0xE8C86E, 0.2, 0.6)
    );
    roof.position.set(0, 2.97, 0);
    roof.castShadow = true;
    this.group.add(roof);

    // Roof gold trim
    const roofTrim = new THREE.Mesh(
      new THREE.BoxGeometry(3.95, 0.06, 3.95),
      this._mat(0xD4AF37, 0.8, 0.2)
    );
    roofTrim.position.set(0, 2.91, 0);
    this.group.add(roofTrim);

    // Pyramid / shikhara on top
    const shikhara = new THREE.Mesh(
      new THREE.ConeGeometry(1.4, 1.2, 4),
      this._mat(0xCC4400, 0.1, 0.7)
    );
    shikhara.position.set(0, 3.63, 0);
    shikhara.rotation.y = Math.PI / 4;
    this.group.add(shikhara);

    // Gold finial on top
    const finial = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.3, 12),
      this._mat(0xD4AF37, 0.9, 0.1, 0xFFAA00, 0.3)
    );
    finial.position.set(0, 4.38, 0);
    this.group.add(finial);

    const finialBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 12, 12),
      this._mat(0xD4AF37, 0.9, 0.1, 0xFFAA00, 0.4)
    );
    finialBall.position.set(0, 4.58, 0);
    this.group.add(finialBall);

    // Side overhangs
    ['front', 'back', 'left', 'right'].forEach((side, i) => {
      const overhang = new THREE.Mesh(
        new THREE.BoxGeometry(i < 2 ? 3.95 : 0.2, 0.06, i < 2 ? 0.2 : 3.95),
        this._mat(0xD4AF37, 0.8, 0.2)
      );
      const angle = i * Math.PI / 2;
      overhang.position.set(
        Math.sin(angle) * 1.98,
        2.88,
        Math.cos(angle) * 1.98
      );
      this.group.add(overhang);
    });
  }

  _buildDoors() {
    // Front arch frame
    const archLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 2.2, 0.14),
      this._mat(0xD4AF37, 0.8, 0.2)
    );
    archLeft.position.set(-0.55, 1.1, 1.79);
    this.group.add(archLeft);

    const archRight = archLeft.clone();
    archRight.position.set(0.55, 1.1, 1.79);
    this.group.add(archRight);

    const archTop = new THREE.Mesh(
      new THREE.BoxGeometry(1.24, 0.18, 0.14),
      this._mat(0xD4AF37, 0.8, 0.2)
    );
    archTop.position.set(0, 2.16, 1.79);
    this.group.add(archTop);

    // Door panels (hinged at sides)
    const doorGeo = new THREE.BoxGeometry(0.52, 1.9, 0.06);
    const doorMat = this._mat(0x8B4513, 0.1, 0.9);

    const doorLeft = new THREE.Group();
    const doorLeftMesh = new THREE.Mesh(doorGeo, doorMat);
    doorLeftMesh.position.x = 0.26; // pivot at left edge
    doorLeft.add(doorLeftMesh);
    // Gold inlay on door
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 2; col++) {
        const inlay = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.4, 0.07),
          this._mat(0xD4AF37, 0.8, 0.2)
        );
        inlay.position.set(0.11 + col * 0.24, -0.45 + row * 0.6, 0);
        doorLeft.add(inlay);
      }
    }
    doorLeft.position.set(-0.53, 1.08, 1.82);
    this.group.add(doorLeft);
    this.doors.left = doorLeft;

    const doorRight = new THREE.Group();
    const doorRightMesh = new THREE.Mesh(doorGeo, doorMat);
    doorRightMesh.position.x = -0.26; // pivot at right edge
    doorRight.add(doorRightMesh);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 2; col++) {
        const inlay = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.4, 0.07),
          this._mat(0xD4AF37, 0.8, 0.2)
        );
        inlay.position.set(-0.11 - col * 0.24, -0.45 + row * 0.6, 0);
        doorRight.add(inlay);
      }
    }
    doorRight.position.set(0.53, 1.08, 1.82);
    this.group.add(doorRight);
    this.doors.right = doorRight;
  }

  _buildGarlands() {
    // Hanging marigold garlands between pillars
    const garlandColors = [0xFF8C00, 0xFFD700, 0xFF4500];
    const garlandPoints = [
      { from: [-1.5, 0], to: [1.5, 0], y: 2.65 },      // front
      { from: [-1.5, -3], to: [1.5, -3], y: 2.65 },    // back (z=-1.5 to 1.5 mapped)
      { from: [-1.5, 0], to: [-1.5, -3], y: 2.65 },    // left side
      { from: [1.5, 0], to: [1.5, -3], y: 2.65 },      // right side
    ];

    garlandPoints.forEach(({ from, to, y }) => {
      const segments = 20;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = from[0] + (to[0] - from[0]) * t;
        const z = from[1] + (to[1] - from[1]) * t;
        const sag = Math.sin(t * Math.PI) * 0.35;
        const bead = new THREE.Mesh(
          new THREE.SphereGeometry(0.04, 6, 6),
          this._mat(garlandColors[i % garlandColors.length], 0, 0.6)
        );
        bead.position.set(x, y - sag, z);
        this.group.add(bead);
      }
    });

    // Toran (door topping) - mango leaves & flowers
    const toranColors = [0x228B22, 0x006400, 0xFF8C00];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const x = -0.65 + t * 1.3;
      const leaf = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 6, 6),
        this._mat(toranColors[i % toranColors.length])
      );
      leaf.scale.set(0.5, 1.2, 0.4);
      const sag = Math.sin(t * Math.PI) * 0.15;
      leaf.position.set(x, 2.25 - sag, 1.83);
      this.group.add(leaf);
    }
  }

  _buildFlowers() {
    // Scattered flower petals on floor
    const petalColors = [0xFF1744, 0xFF8C00, 0xFFD700, 0xFF69B4, 0xFFFFE0];
    for (let i = 0; i < 60; i++) {
      const petal = new THREE.Mesh(
        new THREE.CircleGeometry(0.035, 5),
        this._mat(petalColors[Math.floor(Math.random() * petalColors.length)])
      );
      petal.rotation.x = -Math.PI / 2;
      petal.position.set(
        (Math.random() - 0.5) * 2.8,
        0.001,
        (Math.random() - 0.5) * 2.8
      );
      this.group.add(petal);
    }

    // Rangoli (decorative floor pattern) in center
    const rangoliColors = [0xFF1744, 0xFF8C00, 0xFFD700, 0x9C27B0, 0x00BCD4];
    for (let ring = 1; ring <= 4; ring++) {
      const count = ring * 8;
      for (let j = 0; j < count; j++) {
        const angle = (j / count) * Math.PI * 2;
        const dot = new THREE.Mesh(
          new THREE.CircleGeometry(0.025, 6),
          this._mat(rangoliColors[ring % rangoliColors.length])
        );
        dot.rotation.x = -Math.PI / 2;
        dot.position.set(
          Math.cos(angle) * ring * 0.22,
          0.002,
          Math.sin(angle) * ring * 0.22
        );
        this.group.add(dot);
      }
    }

    // Center lamp / diya
    const diyaBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.09, 0.04, 16),
      this._mat(0xCC8800, 0.3, 0.6)
    );
    diyaBase.position.set(0, 0.02, 0);
    this.group.add(diyaBase);
  }

  _buildInterior() {
    const H = 2.85;          // wall height
    const wallMat = this._mat(0xF3E2BE, 0, 0.92);
    const sideMat = this._mat(0xEAD7B0, 0, 0.92);

    // ── Solid back wall (closes the rear) ──
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(3.3, H, 0.1), wallMat);
    backWall.position.set(0, H / 2, -1.62);
    backWall.receiveShadow = true;
    this.group.add(backWall);

    // ── Solid left & right walls (closes the sides) ──
    [-1, 1].forEach((sx) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.1, H, 3.3), sideMat);
      wall.position.set(sx * 1.62, H / 2, 0);
      wall.receiveShadow = true;
      this.group.add(wall);
    });

    // ── Front side panels flanking the doorway (so only the door opens) ──
    // Doorway is ~1.2 wide; fill the rest of the 3.3-wide front with wall.
    [-1, 1].forEach((sx) => {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1.0, H, 0.1), wallMat);
      panel.position.set(sx * 1.12, H / 2, 1.62);
      panel.receiveShadow = true;
      this.group.add(panel);
    });
    // Lintel above the doorway
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.65, 0.1), wallMat);
    lintel.position.set(0, H - 0.32, 1.62);
    this.group.add(lintel);

    // Decorative gold arches on back wall
    for (let x = -0.85; x <= 0.85; x += 0.85) {
      const arch = new THREE.Mesh(
        new THREE.TorusGeometry(0.34, 0.04, 8, 20, Math.PI),
        this._mat(0xD4AF37, 0.8, 0.2)
      );
      arch.position.set(x, 1.95, -1.55);
      this.group.add(arch);
    }

    this._buildInvitationBoard();
  }

  // The wedding invitation rendered as a decorated backdrop board on the stage.
  // This is what guests see when they walk in through the doorway in AR.
  _buildInvitationBoard() {
    const W = 1024, Hc = 720;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = Hc;
    const c = cv.getContext('2d');

    // Backdrop fabric gradient
    const bg = c.createLinearGradient(0, 0, 0, Hc);
    bg.addColorStop(0, '#7a0d18');
    bg.addColorStop(0.5, '#9c1320');
    bg.addColorStop(1, '#6e0a14');
    c.fillStyle = bg; c.fillRect(0, 0, W, Hc);

    // Gold border frame
    c.strokeStyle = '#E8C86E'; c.lineWidth = 14;
    c.strokeRect(26, 26, W - 52, Hc - 52);
    c.strokeStyle = 'rgba(245,225,150,0.6)'; c.lineWidth = 4;
    c.strokeRect(46, 46, W - 92, Hc - 92);

    const gold = '#F2D785';
    c.textAlign = 'center';

    // Om
    c.fillStyle = gold; c.font = '70px serif';
    c.fillText('ॐ', W / 2, 130);

    c.fillStyle = 'rgba(255,240,210,0.85)'; c.font = 'italic 26px Georgia, serif';
    c.fillText('With the blessings of our families', W / 2, 178);

    // Names
    c.fillStyle = '#FFF3D6'; c.font = 'bold 92px Georgia, serif';
    c.fillText('Shreya', W / 2, 285);
    c.fillStyle = gold; c.font = 'italic 40px Georgia, serif';
    c.fillText('weds', W / 2, 340);
    c.fillStyle = '#FFF3D6'; c.font = 'bold 92px Georgia, serif';
    c.fillText('Shravan', W / 2, 432);

    // Divider
    c.fillStyle = gold; c.font = '34px serif';
    c.fillText('❋  ✦  ❋', W / 2, 490);

    // Details
    c.fillStyle = '#FFF3D6'; c.font = '34px Georgia, serif';
    c.fillText('Sunday, 15th February 2026', W / 2, 552);
    c.font = '30px Georgia, serif';
    c.fillStyle = 'rgba(255,240,210,0.9)';
    c.fillText('Muhurtham · 11:00 AM — 1:00 PM', W / 2, 600);
    c.fillText('Sri Kalyana Mandapa, Bangalore', W / 2, 644);
    c.fillStyle = gold; c.font = 'bold 30px Georgia, serif';
    c.fillText('#ShreyaWedsShravan', W / 2, 690);

    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(2.5, 1.76),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.0, emissive: 0x3a1208, emissiveIntensity: 0.25 })
    );
    board.position.set(0, 1.55, -1.55);
    this.group.add(board);

    // Gold frame around the board
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(2.62, 1.88, 0.04),
      this._mat(0xD4AF37, 0.85, 0.2)
    );
    frame.position.set(0, 1.55, -1.575);
    this.group.add(frame);

    // A small raised stage platform under the board
    const stage = new THREE.Mesh(
      new THREE.BoxGeometry(2.7, 0.12, 0.7),
      this._mat(0xC9A24B, 0.5, 0.4)
    );
    stage.position.set(0, 0.06, -1.25);
    this.group.add(stage);
  }

  _buildLights() {
    // Warm lights inside mantapa
    const warmOrange = new THREE.PointLight(0xFF8C00, 2.5, 4);
    warmOrange.position.set(0, 2.4, 0);
    this.group.add(warmOrange);

    const leftLight = new THREE.PointLight(0xFFD700, 1.5, 3);
    leftLight.position.set(-1.2, 2.2, -0.8);
    this.group.add(leftLight);

    const rightLight = new THREE.PointLight(0xFFD700, 1.5, 3);
    rightLight.position.set(1.2, 2.2, -0.8);
    this.group.add(rightLight);

    // Diya flame light
    const diyaLight = new THREE.PointLight(0xFF6600, 1.8, 1.5);
    diyaLight.position.set(0, 0.3, 0);
    this.group.add(diyaLight);
    this.diyaLight = diyaLight;
  }

  // Open doors animation
  openDoors(onComplete) {
    if (this.doorOpen) return;
    this.doorOpen = true;

    const duration = 1800;
    const start = performance.now();

    const animate = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);

      this.doors.left.rotation.y = ease * Math.PI * 0.55;
      this.doors.right.rotation.y = -ease * Math.PI * 0.55;

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        if (onComplete) onComplete();
      }
    };
    requestAnimationFrame(animate);
  }

  // Flicker the diya flame
  updateDiya(time) {
    if (this.diyaLight) {
      this.diyaLight.intensity = 1.6 + Math.sin(time * 8.3) * 0.3 + Math.sin(time * 13.7) * 0.2;
    }
  }

  get object3D() { return this.group; }
}
