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
  scene.add(new THREE.HemisphereLight(0x8fbfff, 0x10131f, 0.7));
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
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(75, 64),
    new THREE.MeshStandardMaterial({ color: 0x0c1322, roughness: 0.95, metalness: 0.1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const grid = new THREE.GridHelper(150, 75, 0x00f2fe, 0x1b3a5c);
  grid.material.opacity = 0.25;
  grid.material.transparent = true;
  scene.add(grid);

  // Plaza accent ring
  const plaza = new THREE.Mesh(
    new THREE.RingGeometry(2.6, 3, 48),
    new THREE.MeshBasicMaterial({ color: 0x00f2fe, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
  );
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
      new THREE.MeshStandardMaterial({ color: 0x141c2e, roughness: 0.7, metalness: 0.3 })
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
  // SCENERY — scattered low-poly props
  // ========================================================================
  const propColors = [0x14324d, 0x1a2740, 0x122a3f];
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 36 + Math.random() * 32;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const h = 2 + Math.random() * 10;
    const prop = new THREE.Mesh(
      new THREE.BoxGeometry(1.4 + Math.random() * 2.5, h, 1.4 + Math.random() * 2.5),
      new THREE.MeshStandardMaterial({
        color: propColors[i % propColors.length],
        roughness: 0.9,
        metalness: 0.2,
      })
    );
    prop.position.set(x, h / 2, z);
    prop.castShadow = true;
    prop.receiveShadow = true;
    scene.add(prop);
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
  scene.add(
    new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0x9fd8ff, size: 1.1, transparent: true, opacity: 0.7 })
    )
  );

  // ========================================================================
  // CAR
  // ========================================================================
  // Detailed low-poly roadster. Front of the car points toward +Z.
  const car = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x00f2fe, metalness: 0.7, roughness: 0.25,
    emissive: 0x00343a, emissiveIntensity: 0.35,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x7f00ff, metalness: 0.6, roughness: 0.3,
    emissive: 0x2a0a4a, emissiveIntensity: 0.4,
  });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x0b0e16, metalness: 0.5, roughness: 0.6 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x081018, metalness: 0.4, roughness: 0.1,
    transparent: true, opacity: 0.55,
  });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x0b0e16, roughness: 0.85, metalness: 0.1 });
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x00f2fe, metalness: 0.9, roughness: 0.2,
    emissive: 0x00343a, emissiveIntensity: 0.4,
  });

  // Helper: add a box/sphere part to the car
  function addPart(geo, mat, x, y, z, opts = {}) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = opts.cast !== false;
    car.add(m);
    return m;
  }

  // Body: low slung base + raised hood and rear deck
  addPart(new THREE.BoxGeometry(2, 0.5, 3.5), bodyMat, 0, 0.62, 0);
  addPart(new THREE.BoxGeometry(1.8, 0.34, 1.7), bodyMat, 0, 0.94, 0.75);   // hood
  addPart(new THREE.BoxGeometry(1.8, 0.34, 1.0), bodyMat, 0, 0.94, -1.05);  // rear deck
  addPart(new THREE.BoxGeometry(2.06, 0.14, 3.0), accentMat, 0, 0.5, 0);    // side skirt

  // Glass cabin + coloured roof + roof light bar
  addPart(new THREE.BoxGeometry(1.42, 0.52, 1.5), glassMat, 0, 1.26, -0.1);
  addPart(new THREE.BoxGeometry(1.5, 0.12, 1.55), accentMat, 0, 1.56, -0.1); // roof
  addPart(new THREE.BoxGeometry(1.05, 0.07, 0.14),
    new THREE.MeshBasicMaterial({ color: 0x00f2fe }), 0, 1.63, 0.45, { cast: false }); // light bar

  // Bumpers
  addPart(new THREE.BoxGeometry(1.85, 0.24, 0.2), trimMat, 0, 0.5, 1.72);
  addPart(new THREE.BoxGeometry(1.85, 0.24, 0.2), trimMat, 0, 0.5, -1.72);

  // Headlights (front, +Z) and taillights (rear, -Z)
  const hlMat = new THREE.MeshBasicMaterial({ color: 0xeaffff });
  addPart(new THREE.SphereGeometry(0.14, 12, 12), hlMat, 0.62, 0.72, 1.74, { cast: false });
  addPart(new THREE.SphereGeometry(0.14, 12, 12), hlMat, -0.62, 0.72, 1.74, { cast: false });
  const tlMat = new THREE.MeshBasicMaterial({ color: 0xff2d55 });
  addPart(new THREE.BoxGeometry(0.5, 0.12, 0.06), tlMat, 0.55, 0.78, -1.74, { cast: false });
  addPart(new THREE.BoxGeometry(0.5, 0.12, 0.06), tlMat, -0.55, 0.78, -1.74, { cast: false });

  // Rear spoiler
  addPart(new THREE.BoxGeometry(0.08, 0.32, 0.1), trimMat, 0.55, 1.05, -1.5);
  addPart(new THREE.BoxGeometry(0.08, 0.32, 0.1), trimMat, -0.55, 1.05, -1.5);
  addPart(new THREE.BoxGeometry(1.4, 0.08, 0.42), accentMat, 0, 1.22, -1.55);

  // Underglow
  const underglow = new THREE.PointLight(0x00f2fe, 6, 7);
  underglow.position.set(0, 0.25, 0);
  car.add(underglow);

  // Wheels: rolling on all four, steering on the front pair
  const wheels = [];       // inner pivots that roll (rotation.x)
  const steerWheels = [];  // front outer pivots that steer (rotation.y)

  function makeWheel(x, z, steerable) {
    const outer = new THREE.Group();
    outer.position.set(x, 0.55, z);
    const inner = new THREE.Group();
    outer.add(inner);

    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.42, 20), tireMat);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    inner.add(tire);

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.44, 14), rimMat);
    rim.rotation.z = Math.PI / 2;
    inner.add(rim);

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.46, 8), accentMat);
    cap.rotation.z = Math.PI / 2;
    inner.add(cap);

    car.add(outer);
    wheels.push(inner);
    if (steerable) steerWheels.push(outer);
  }
  makeWheel(1.02, 1.18, true);
  makeWheel(-1.02, 1.18, true);
  makeWheel(1.02, -1.18, false);
  makeWheel(-1.02, -1.18, false);

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

  // Theme just shifts the sky/fog tone
  window.addEventListener('themechange', (e) => {
    const dark = e.detail.theme !== 'light';
    const sky = dark ? 0x070b15 : 0xbcd2f0;
    scene.background = new THREE.Color(sky);
    scene.fog.color = new THREE.Color(sky);
  });

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

    // --- Chase camera ---
    camGoal.set(
      state.x - fx * 13,
      9.5,
      state.z - fz * 13
    );
    camera.position.lerp(camGoal, 1 - Math.pow(0.0008, dt));
    camTarget.set(state.x + fx * 4, 2, state.z + fz * 4);
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
