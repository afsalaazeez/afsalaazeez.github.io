/*
  =========================================
  DRIVABLE CAR WORLD  (Variant: 3d-car-world)
  A Bruno-Simon-style playground: drive a low-poly car around a neon
  plaza with WASD / arrow keys (or on-screen buttons). Each "kiosk" is a
  glowing pillar; drive close and that section's info card slides in.

  Arcade kinematics (no physics engine) for reliability + small bundle.
  =========================================
*/

import * as THREE from 'three';

(function initCarWorld() {
  const canvas = document.getElementById('world');
  if (!canvas) return;

  // --- WebGL guard ---------------------------------------------------------
  try {
    const t = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!t) throw 0;
  } catch (e) {
    document.body.classList.add('no-webgl');
    return;
  }

  // ========================================================================
  // KIOSK DEFINITIONS — each maps to an .info-card in the DOM (by id)
  // ========================================================================
  const KIOSKS = [
    { id: 'about',    label: 'ABOUT',        color: 0x00f2fe },
    { id: 'skills',   label: 'SKILLS',       color: 0x4f8bff },
    { id: 'p-rag',    label: 'GovShield',    color: 0x00ffa3 },
    { id: 'p-agent',  label: 'TaskEngine',   color: 0x7f00ff },
    { id: 'p-vision', label: 'VisionLog',    color: 0x00ffa3 },
    { id: 'p-gis',    label: 'GIS Water DB', color: 0xff9f43 },
    { id: 'p-chat',   label: 'Realtime Chat',color: 0x4f8bff },
    { id: 'p-flight', label: 'Flight Delay', color: 0xff3df0 },
    { id: 'contact',  label: 'CONTACT',      color: 0x00f2fe },
  ];

  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  // ========================================================================
  // RENDERER / SCENE / CAMERA
  // ========================================================================
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070b15);
  scene.fog = new THREE.Fog(0x070b15, 40, 130);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    400
  );
  camera.position.set(0, 12, -16);

  // ========================================================================
  // LIGHTS
  // ========================================================================
  const hemLight = new THREE.HemisphereLight(0x8fbfff, 0x10131f, 0.7);
  scene.add(hemLight);
  const sun = new THREE.DirectionalLight(0xffffff, 1.1);
  sun.position.set(30, 50, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 160;
  sun.shadow.camera.left = -80;
  sun.shadow.camera.right = 80;
  sun.shadow.camera.top = 80;
  sun.shadow.camera.bottom = -80;
  scene.add(sun);

  // ========================================================================
  // GROUND + GRID
  // ========================================================================
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x0c1322, roughness: 0.95, metalness: 0.1 });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(75, 64), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const grid = new THREE.GridHelper(150, 75, 0x00f2fe, 0x1b3a5c);
  grid.material.opacity = 0.25;
  grid.material.transparent = true;
  scene.add(grid);

  // Plaza accent ring
  const plazaMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
  const plaza = new THREE.Mesh(new THREE.RingGeometry(2.6, 3, 48), plazaMat);
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = 0.02;
  scene.add(plaza);

  // ========================================================================
  // HELPERS — text label sprite from a canvas
  // ========================================================================
  function makeLabel(text, hex) {
    const cvs = document.createElement('canvas');
    cvs.width = 512;
    cvs.height = 128;
    const ctx = cvs.getContext('2d');
    ctx.fillStyle = 'rgba(8,12,20,0.0)';
    ctx.fillRect(0, 0, 512, 128);
    ctx.font = '700 64px Outfit, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.strokeText(text, 256, 70);
    ctx.fillStyle = '#' + new THREE.Color(hex).getHexString();
    ctx.fillText(text, 256, 70);
    const tex = new THREE.CanvasTexture(cvs);
    tex.anisotropy = 4;
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
    );
    sprite.scale.set(8, 2, 1);
    return sprite;
  }

  // ========================================================================
  // KIOSKS — glowing pillars arranged in a ring
  // ========================================================================
  const RING_RADIUS = 26;
  const kioskMeshes = [];
  const padMat = new THREE.MeshStandardMaterial({ color: 0x141c2e, roughness: 0.7, metalness: 0.3 });

  KIOSKS.forEach((k, i) => {
    const angle = (i / KIOSKS.length) * Math.PI * 2;
    const x = Math.cos(angle) * RING_RADIUS;
    const z = Math.sin(angle) * RING_RADIUS;
    const color = new THREE.Color(k.color);

    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Base pad
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 0.4, 24),
      padMat
    );
    pad.position.y = 0.2;
    pad.receiveShadow = true;
    pad.castShadow = true;
    group.add(pad);

    // Glowing pillar
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 1.1, 5, 6),
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.6,
        roughness: 0.3,
        metalness: 0.6,
      })
    );
    pillar.position.y = 2.9;
    pillar.castShadow = true;
    group.add(pillar);

    // Floating crystal on top
    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.1, 0),
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.1,
        roughness: 0.2,
        metalness: 0.4,
      })
    );
    crystal.position.y = 7.4;
    crystal.castShadow = true;
    group.add(crystal);

    // Beacon light
    const beam = new THREE.PointLight(color, 18, 18);
    beam.position.y = 6;
    group.add(beam);

    // Floating label, billboarded
    const label = makeLabel(k.label, k.color);
    label.position.y = 9.6;
    group.add(label);

    // Proximity ring on the ground (pulses when near)
    const pring = new THREE.Mesh(
      new THREE.RingGeometry(3.2, 3.6, 40),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.0, side: THREE.DoubleSide })
    );
    pring.rotation.x = -Math.PI / 2;
    pring.position.y = 0.05;
    group.add(pring);

    scene.add(group);
    kioskMeshes.push({ ...k, group, crystal, pring, pos: new THREE.Vector3(x, 0, z) });
  });

  // ========================================================================
  // SCENERY — low-poly trees (pine + round-crowned). Materials stored for
  // dynamic theme switching between dark silhouettes and bright meadow greens.
  // ========================================================================
  const treeData = [];
  for (let i = 0; i < 38; i++) {
    const angle = (i / 38) * Math.PI * 2 + (Math.random() - 0.5) * 0.28;
    const r = 38 + Math.random() * 24;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const trunkH = 2.0 + Math.random() * 3.5;
    const s = 0.7 + Math.random() * 0.7;

    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = Math.random() * Math.PI * 2;

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x1e0d05, roughness: 0.92, metalness: 0.0 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * s, 0.22 * s, trunkH, 6), trunkMat);
    trunk.position.y = trunkH / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);

    const foliageMats = [];
    const isPine = i % 3 !== 0;

    if (isPine) {
      const layers = 2 + (i % 2);
      for (let l = 0; l < layers; l++) {
        const fm = new THREE.MeshStandardMaterial({ color: 0x0c1a0a, roughness: 0.85, metalness: 0.0 });
        foliageMats.push(fm);
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry((1.1 - l * 0.2) * s, (1.6 - l * 0.15) * s, 6),
          fm
        );
        cone.position.y = trunkH + l * 1.1 * s;
        cone.castShadow = true;
        group.add(cone);
      }
    } else {
      const fm = new THREE.MeshStandardMaterial({ color: 0x0c1a0a, roughness: 0.85, metalness: 0.0 });
      foliageMats.push(fm);
      const crown = new THREE.Mesh(new THREE.SphereGeometry(1.1 * s, 8, 7), fm);
      crown.position.y = trunkH + 0.85 * s;
      crown.castShadow = true;
      group.add(crown);
    }

    scene.add(group);
    treeData.push({ trunkMat, foliageMats });
  }

  // Subtle floating welcome marker high above the spawn plaza
  const welcome = makeLabel('AFSAL A AZEEZ', 0xf8fafc);
  welcome.scale.set(7, 1.75, 1);
  welcome.position.set(0, 12, 0);
  welcome.material.opacity = 0.5;
  scene.add(welcome);

  // Starfield dome
  const starCount = 800;
  const sp = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 150 + Math.random() * 100;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(Math.random());
    sp[i * 3] = r * Math.sin(ph) * Math.cos(th);
    sp[i * 3 + 1] = r * Math.cos(ph) + 20;
    sp[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const starPoints = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ color: 0x9fd8ff, size: 1.1, transparent: true, opacity: 0.7 })
  );
  scene.add(starPoints);

  // ========================================================================
  // CAR
  // ========================================================================
  // Hardcore tube-frame rock crawler buggy. Front of the car points toward +Z.
  // Fully exposed CNC-bent tube chassis + cage, portal axles, triangulated
  // 4-link, long-travel coilovers, driveshafts, beadlock rims + mud tires.
  const car = new THREE.Group();

  // --- Materials ---
  const steelMat  = new THREE.MeshStandardMaterial({ color: 0x39414f, metalness: 0.95, roughness: 0.4 });
  const cageMat   = new THREE.MeshStandardMaterial({ color: 0x8b0000, metalness: 0.85, roughness: 0.3, emissive: 0x2a0000, emissiveIntensity: 0.35 });
  const castMat   = new THREE.MeshStandardMaterial({ color: 0x262b35, metalness: 0.85, roughness: 0.55 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xb9c6d6, metalness: 1.0, roughness: 0.15 });
  const springMat = new THREE.MeshStandardMaterial({ color: 0x7f00ff, metalness: 0.6, roughness: 0.35, emissive: 0x1a0033, emissiveIntensity: 0.45 });
  const tireMat   = new THREE.MeshStandardMaterial({ color: 0x0a0c12, metalness: 0.1, roughness: 0.95 });
  const rimMat    = new THREE.MeshStandardMaterial({ color: 0x00f2fe, metalness: 0.95, roughness: 0.18, emissive: 0x00343a, emissiveIntensity: 0.4 });
  const boltMat   = new THREE.MeshStandardMaterial({ color: 0x8895a6, metalness: 0.9, roughness: 0.3 });
  const seatMat   = new THREE.MeshStandardMaterial({ color: 0x141821, metalness: 0.2, roughness: 0.85 });

  const UPV = new THREE.Vector3(0, 1, 0);
  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), tmpD = new THREE.Vector3();

  // Tube between two points — the building block for chassis / cage / links
  function strut(parent, p1, p2, r, mat, cast = true) {
    tmpA.set(p1[0], p1[1], p1[2]); tmpB.set(p2[0], p2[1], p2[2]);
    tmpD.subVectors(tmpB, tmpA);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, tmpD.length(), 8), mat);
    m.position.copy(tmpA).addScaledVector(tmpD, 0.5);
    m.quaternion.setFromUnitVectors(UPV, tmpD.normalize());
    m.castShadow = cast;
    parent.add(m);
    return m;
  }
  function slab(parent, w, h, d, mat, x, y, z, cast = true) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); m.castShadow = cast; parent.add(m); return m;
  }
  function drum(parent, rt, rb, h, mat, x, y, z, axis, cast = true) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 16), mat);
    m.position.set(x, y, z);
    if (axis === 'x') m.rotation.x = Math.PI / 2;
    if (axis === 'z') m.rotation.z = Math.PI / 2;
    m.castShadow = cast; parent.add(m); return m;
  }

  // ---- Tube chassis + integrated roll cage (right-side nodes, mirrored) ----
  const CAGE = {
    lf: [0.82, 0.55, 1.55], lm: [0.9, 0.46, 0.15], lr: [0.82, 0.6, -1.55],
    af: [0.74, 1.2, 1.05],  rf: [0.7, 2.0, 0.4],   rr: [0.7, 2.0, -0.7],
    dr: [0.8, 1.15, -1.6],  bf: [0.66, 0.92, 2.0], db: [0.74, 1.2, 0.55],
  };
  const mir = (k) => [-CAGE[k][0], CAGE[k][1], CAGE[k][2]];
  const sideEdges = [
    ['lf','lm'],['lm','lr'],['lf','af'],['af','rf'],['rf','rr'],['rr','dr'],
    ['dr','lr'],['lm','rf'],['af','bf'],['lf','bf'],['db','af'],['db','lm'],['lr','rr'],
  ];
  sideEdges.forEach(([a, b]) => {
    strut(car, CAGE[a], CAGE[b], 0.06, cageMat);
    strut(car, mir(a), mir(b), 0.06, cageMat);
  });
  // Cross members + roof X-brace (right node -> left node)
  [['af','af'],['rf','rf'],['rr','rr'],['dr','dr'],['bf','bf'],['lf','lf'],
   ['lr','lr'],['db','db'],['rf','rr'],['rr','rf']].forEach(([a, b]) =>
    strut(car, CAGE[a], mir(b), 0.055, cageMat));
  // Welded node gussets
  Object.keys(CAGE).forEach((k) => {
    [1, -1].forEach((s) => {
      const g = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), steelMat);
      g.position.set(s * CAGE[k][0], CAGE[k][1], CAGE[k][2]); car.add(g);
    });
  });

  // ---- Cockpit: minimalist firewall, seats, steering ----
  slab(car, 1.5, 0.7, 0.05, steelMat, 0, 1.05, -0.35, false);   // firewall
  [-0.34, 0.34].forEach((sx) => {
    slab(car, 0.5, 0.12, 0.5, seatMat, sx, 0.95, -0.05, false);
    slab(car, 0.46, 0.6, 0.1, seatMat, sx, 1.28, -0.27, false);
  });
  const col = drum(car, 0.03, 0.03, 0.5, castMat, 0.34, 1.2, 0.42, null, false);
  col.rotation.x = Math.PI / 3.2;
  const sWheel = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 8, 18), castMat);
  sWheel.position.set(0.34, 1.33, 0.52); sWheel.rotation.x = Math.PI / 3.2; car.add(sWheel);

  // ---- Engine block + transfer case (drivetrain origin) ----
  slab(car, 0.82, 0.7, 1.0, castMat, 0, 0.88, -1.05);
  slab(car, 0.5, 0.3, 0.5, steelMat, 0, 0.62, -0.25, false);
  strut(car, [0.32, 0.55, -1.5], [0.5, 1.35, -1.62], 0.05, chromeMat); // exhaust

  // ---- Helpers: helical coil spring + coilover shock ----
  function coilSpring(len, radius, coils) {
    const segs = coils * 14, pts = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs, a = t * coils * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, t * len, Math.sin(a) * radius));
    }
    const m = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), segs, 0.028, 5, false),
      springMat);
    m.castShadow = false;
    return m;
  }
  function shock(p1, p2) {
    tmpA.set(p1[0], p1[1], p1[2]); tmpB.set(p2[0], p2[1], p2[2]);
    tmpD.subVectors(tmpB, tmpA);
    const len = tmpD.length();
    const g = new THREE.Group();
    g.add(coilSpring(len, 0.12, Math.max(5, Math.round(len * 8))));
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, len, 10), chromeMat);
    body.position.y = len / 2; g.add(body);
    const res = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, len * 0.4, 8), castMat);
    res.position.set(0.14, len * 0.5, 0); g.add(res);
    g.position.copy(tmpA);
    g.quaternion.setFromUnitVectors(UPV, tmpD.normalize());
    car.add(g);
  }

  // ---- Solid portal axle + open diff + triangulated 4-link + coilovers ----
  const AXLE_Y = 0.94, HUB_Y = 0.72, TRACK = 1.08;
  function buildAxle(z) {
    drum(car, 0.11, 0.11, TRACK * 2, castMat, 0, AXLE_Y, z, 'z'); // axle housing
    const diff = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), castMat);
    diff.position.set(0.17, AXLE_Y, z); diff.castShadow = true; car.add(diff); // pumpkin
    drum(car, 0.2, 0.17, 0.12, steelMat, 0.17, AXLE_Y, z + 0.22, 'x', false);   // diff cover
    [-1, 1].forEach((s) => {
      slab(car, 0.26, 0.36, 0.26, castMat, s * (TRACK - 0.02), (AXLE_Y + HUB_Y) / 2, z); // portal
      // lower link (longitudinal) + upper link (triangulated inward)
      strut(car, [s * 0.55, 0.5, z + (z > 0 ? -0.95 : 0.95)], [s * 0.78, 0.62, z], 0.05, steelMat, false);
      strut(car, [s * 0.16, 1.12, z + (z > 0 ? -1.0 : 1.0)], [s * 0.6, 1.0, z], 0.045, steelMat, false);
    });
    shock([-0.82, 1.52, z], [-0.88, 0.82, z]);
    shock([0.82, 1.52, z], [0.88, 0.82, z]);
  }
  buildAxle(1.3);   // front
  buildAxle(-1.3);  // rear

  // ---- Driveshafts (transfer case -> diffs) + U-joints ----
  strut(car, [0, 0.62, -0.3], [0.17, 0.94, 1.05], 0.06, chromeMat, false);
  strut(car, [0, 0.62, -0.5], [0.17, 0.94, -1.1], 0.06, chromeMat, false);
  [[0.17,0.94,1.05],[0.17,0.94,-1.1],[0,0.62,-0.4]].forEach((p) => {
    const u = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), steelMat);
    u.position.set(p[0], p[1], p[2]); car.add(u);
  });

  // ---- Skid plate, rock-slider bumpers, roof light bar ----
  slab(car, 1.0, 0.06, 1.7, steelMat, 0, 0.4, -0.1, false);
  strut(car, [-0.85, 0.6, 2.0], [0.85, 0.6, 2.0], 0.06, steelMat);
  strut(car, [-0.85, 0.65, -1.95], [0.85, 0.65, -1.95], 0.06, steelMat);
  slab(car, 1.0, 0.08, 0.12, new THREE.MeshBasicMaterial({ color: 0xeaffff }), 0, 2.02, 0.42, false);

  const underglow = new THREE.PointLight(0x00f2fe, 5, 6);
  underglow.position.set(0, 0.35, 0);
  car.add(underglow);

  // ---- Beadlock deep-dish wheels + oversized lugged mud tires ----
  const wheels = [];       // inner pivots that roll (rotation.x)
  const steerWheels = [];  // front outer pivots that steer (rotation.y)

  // Fat tire cross-section, revolved around Y (wheel laid on its side later)
  const tireProfile = [
    [0.34,-0.20],[0.40,-0.22],[0.58,-0.20],[0.70,-0.13],[0.73,-0.06],
    [0.73,0.06],[0.70,0.13],[0.58,0.20],[0.40,0.22],[0.34,0.20],
  ].map((p) => new THREE.Vector2(p[0], p[1]));
  const tireGeo = new THREE.LatheGeometry(tireProfile, 26);
  const lugGeo = new THREE.BoxGeometry(0.18, 0.34, 0.14);

  function buildWheel(x, z, steerable) {
    const outer = new THREE.Group();         // steering pivot (rotation.y)
    outer.position.set(x, HUB_Y, z);
    const inner = new THREE.Group();          // rolling pivot (rotation.x)
    outer.add(inner);
    const wm = new THREE.Group();             // wheel model, axle laid along X
    wm.rotation.z = Math.PI / 2;
    inner.add(wm);

    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.castShadow = true; wm.add(tire);

    // Aggressive deep-tread lugs around the circumference
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const lug = new THREE.Mesh(lugGeo, tireMat);
      lug.position.set(Math.cos(a) * 0.69, 0, Math.sin(a) * 0.69);
      lug.rotation.y = -a;
      wm.add(lug);
    }

    // Deep-dish beadlock rim
    wm.add(new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.42, 18), rimMat));
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.2, 0.22, 18), rimMat);
    dish.position.y = 0.11; wm.add(dish);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.025, 6, 24), boltMat);
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.21; wm.add(ring);
    for (let i = 0; i < 12; i++) {       // beadlock bolts
      const a = (i / 12) * Math.PI * 2;
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.05, 6), boltMat);
      bolt.position.set(Math.cos(a) * 0.37, 0.22, Math.sin(a) * 0.37);
      wm.add(bolt);
    }
    wm.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.46, 10), boltMat)); // hub
    for (let i = 0; i < 5; i++) {        // lug nuts
      const a = (i / 5) * Math.PI * 2;
      const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.48, 6), boltMat);
      nut.position.set(Math.cos(a) * 0.13, 0, Math.sin(a) * 0.13);
      wm.add(nut);
    }

    car.add(outer);
    wheels.push(inner);
    if (steerable) steerWheels.push(outer);
  }
  buildWheel(1.12, 1.3, true);
  buildWheel(-1.12, 1.3, true);
  buildWheel(1.12, -1.3, false);
  buildWheel(-1.12, -1.3, false);

  scene.add(car);

  // ========================================================================
  // CAR STATE + CONTROLS
  // ========================================================================
  const state = {
    x: 0, z: -8,       // spawn just south of centre
    yaw: 0,            // faces +Z
    speed: 0,
  };
  const MAX_SPEED = 26;
  const ACCEL = 34;
  const REVERSE_ACCEL = 22;
  const FRICTION = 6;
  const STEER = 2.6;
  const BOUND = 64;
  const CAR_RADIUS = 1.8;
  const KIOSK_RADIUS = 3.2;
  const TRIGGER = 7.5;

  const input = { forward: false, back: false, left: false, right: false };

  const keyMap = {
    ArrowUp: 'forward', KeyW: 'forward',
    ArrowDown: 'back', KeyS: 'back',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
  };
  window.addEventListener('keydown', (e) => {
    const a = keyMap[e.code];
    if (a) { input[a] = true; e.preventDefault(); }
  });
  window.addEventListener('keyup', (e) => {
    const a = keyMap[e.code];
    if (a) { input[a] = false; }
  });

  // Expose controls for on-screen / touch buttons + nav teleport
  window.CarControls = {
    press(dir, on) { if (dir in input) input[dir] = on; },
    goTo(id) {
      const k = kioskMeshes.find((m) => m.id === id);
      if (!k) { // 'home' → spawn
        state.x = 0; state.z = -8; state.yaw = 0; state.speed = 0;
        return;
      }
      // Place car a little in front of the kiosk, facing it
      const dir = k.pos.clone().normalize();
      const stop = k.pos.clone().sub(dir.clone().multiplyScalar(TRIGGER - 1.5));
      state.x = stop.x;
      state.z = stop.z;
      state.yaw = Math.atan2(k.pos.x - state.x, k.pos.z - state.z);
      state.speed = 0;
    },
  };

  // ========================================================================
  // PROXIMITY → DOM PANEL
  // ========================================================================
  let activeKiosk = null;
  function updateProximity() {
    let nearest = null;
    let nd = TRIGGER;
    kioskMeshes.forEach((k) => {
      const d = Math.hypot(state.x - k.pos.x, state.z - k.pos.z);
      const near = d < TRIGGER;
      // pulse ring opacity by closeness
      k.pring.material.opacity = near ? 0.15 + 0.5 * (1 - d / TRIGGER) : 0;
      if (near && d < nd) { nd = d; nearest = k; }
    });

    const newId = nearest ? nearest.id : null;
    if (newId !== activeKiosk) {
      activeKiosk = newId;
      document.querySelectorAll('.info-card').forEach((c) =>
        c.classList.toggle('active', c.id === 'card-' + newId)
      );
      document.body.classList.toggle('near-kiosk', !!newId);
      // sync nav highlight for the major sections
      document.querySelectorAll('.nav-links a').forEach((a) =>
        a.classList.toggle('active', a.dataset.kiosk === newId)
      );
    }
  }

  // ========================================================================
  // RESIZE
  // ========================================================================
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  // Theme: dark = cyberpunk neon / light = green meadow day
  const MEADOW_GREENS = [0x3d8a28, 0x2d7020, 0x4a9e35, 0x5aaa40];
  function applyTheme(dark) {
    if (dark) {
      scene.background.setHex(0x070b15);
      scene.fog.color.setHex(0x070b15);
      scene.fog.near = 40; scene.fog.far = 130;
      groundMat.color.setHex(0x0c1322);
      groundMat.roughness = 0.95;
      grid.visible = true;
      plazaMat.color.setHex(0x00f2fe);
      hemLight.color.setHex(0x8fbfff);
      hemLight.groundColor.setHex(0x10131f);
      hemLight.intensity = 0.7;
      sun.color.setHex(0xffffff);
      sun.intensity = 1.1;
      starPoints.visible = true;
      padMat.color.setHex(0x141c2e);
      treeData.forEach(({ trunkMat, foliageMats }) => {
        trunkMat.color.setHex(0x1e0d05);
        foliageMats.forEach((m) => m.color.setHex(0x0c1a0a));
      });
    } else {
      scene.background.setHex(0x7ec8e3);
      scene.fog.color.setHex(0xaaddf0);
      scene.fog.near = 55; scene.fog.far = 160;
      groundMat.color.setHex(0x5c9e42);
      groundMat.roughness = 0.88;
      grid.visible = false;
      plazaMat.color.setHex(0xf0c030);
      hemLight.color.setHex(0xc8e4f8);
      hemLight.groundColor.setHex(0x4e8c35);
      hemLight.intensity = 1.1;
      sun.color.setHex(0xfff5d0);
      sun.intensity = 1.7;
      starPoints.visible = false;
      padMat.color.setHex(0x9e8c6b);
      treeData.forEach(({ trunkMat, foliageMats }, idx) => {
        trunkMat.color.setHex(0x7a4f28);
        foliageMats.forEach((m) => m.color.setHex(MEADOW_GREENS[idx % MEADOW_GREENS.length]));
      });
    }
  }
  window.addEventListener('themechange', (e) => applyTheme(e.detail.theme !== 'light'));
  // Apply on load in case user had light mode saved
  applyTheme(document.documentElement.getAttribute('data-theme') !== 'light');

  // ========================================================================
  // MAIN LOOP
  // ========================================================================
  const clock = new THREE.Clock();
  const camTarget = new THREE.Vector3();
  const camGoal = new THREE.Vector3();

  function tick() {
    let dt = clock.getDelta();
    if (dt > 0.05) dt = 0.05; // clamp big frame gaps

    // --- Acceleration / friction ---
    if (input.forward) state.speed += ACCEL * dt;
    else if (input.back) state.speed -= REVERSE_ACCEL * dt;
    else {
      // coast to a stop
      const drag = FRICTION * dt;
      if (state.speed > drag) state.speed -= drag;
      else if (state.speed < -drag) state.speed += drag;
      else state.speed = 0;
    }
    state.speed = THREE.MathUtils.clamp(state.speed, -MAX_SPEED * 0.5, MAX_SPEED);

    // --- Steering (proportional to speed, inverts in reverse) ---
    if (state.speed !== 0) {
      const grip = THREE.MathUtils.clamp(Math.abs(state.speed) / 6, 0, 1);
      const dir = Math.sign(state.speed);
      if (input.left) state.yaw += STEER * dt * grip * dir;
      if (input.right) state.yaw -= STEER * dt * grip * dir;
    }

    // --- Integrate position ---
    const fx = Math.sin(state.yaw);
    const fz = Math.cos(state.yaw);
    state.x += fx * state.speed * dt;
    state.z += fz * state.speed * dt;

    // --- World boundary (circular) ---
    const distC = Math.hypot(state.x, state.z);
    if (distC > BOUND) {
      state.x = (state.x / distC) * BOUND;
      state.z = (state.z / distC) * BOUND;
      state.speed *= 0.4;
    }

    // --- Kiosk collision (push out) ---
    kioskMeshes.forEach((k) => {
      const dx = state.x - k.pos.x;
      const dz = state.z - k.pos.z;
      const d = Math.hypot(dx, dz);
      const minD = KIOSK_RADIUS + CAR_RADIUS;
      if (d < minD && d > 0.001) {
        state.x = k.pos.x + (dx / d) * minD;
        state.z = k.pos.z + (dz / d) * minD;
        state.speed *= 0.5;
      }
    });

    // --- Apply to car mesh ---
    car.position.set(state.x, 0, state.z);
    car.rotation.y = state.yaw;
    const spin = state.speed * dt * 2;
    wheels.forEach((w) => (w.rotation.x += spin));
    // Front wheels visually steer toward the input
    const targetSteer = ((input.left ? 1 : 0) - (input.right ? 1 : 0)) * 0.5;
    steerWheels.forEach((p) => (p.rotation.y += (targetSteer - p.rotation.y) * 0.2));

    // --- Chase camera (closer + lower to show off the buggy detail) ---
    camGoal.set(
      state.x - fx * 9.5,
      6.8,
      state.z - fz * 9.5
    );
    camera.position.lerp(camGoal, 1 - Math.pow(0.0008, dt));
    camTarget.set(state.x + fx * 3.5, 1.4, state.z + fz * 3.5);
    camera.lookAt(camTarget);

    // --- Animate kiosks ---
    const t = clock.getElapsedTime();
    if (!reduceMotion) {
      kioskMeshes.forEach((k, i) => {
        k.crystal.rotation.y = t * 0.8 + i;
        k.crystal.position.y = 7.4 + Math.sin(t * 1.5 + i) * 0.25;
        k.pring.rotation.z = t * 0.5;
      });
      plaza.rotation.z = t * 0.2;
    }

    updateProximity();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(() => {
    document.body.classList.add('world-ready');
    tick();
  });
})();
