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
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

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

  // ---- Inspect / orbit mode (press I to toggle) -------------------------
  const orbitControls = new OrbitControls(camera, canvas);
  orbitControls.enableDamping = true;
  orbitControls.dampingFactor = 0.08;
  orbitControls.enabled = false;

  let inspectMode = false;
  const inspectHUD = document.createElement('div');
  inspectHUD.textContent = 'INSPECT MODE — press I to exit';
  Object.assign(inspectHUD.style, {
    position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.65)', color: '#00f2fe', fontFamily: 'monospace',
    fontSize: '13px', padding: '6px 16px', borderRadius: '20px',
    border: '1px solid #00f2fe55', letterSpacing: '0.05em',
    pointerEvents: 'none', display: 'none', zIndex: '9999',
  });
  document.body.appendChild(inspectHUD);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'i' || e.key === 'I') {
      inspectMode = !inspectMode;
      orbitControls.enabled = inspectMode;
      inspectHUD.style.display = inspectMode ? 'block' : 'none';
      if (inspectMode) {
        // Centre orbit target on the car
        orbitControls.target.set(
          orbitControls.object.position.x,
          1.2,
          orbitControls.object.position.z
        );
        orbitControls.update();
      }
    }
  });
  // -----------------------------------------------------------------------

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
  // Bumpy terrain: PlaneGeometry with per-vertex height displacement
  const terrainGeo = new THREE.PlaneGeometry(150, 150, 64, 64);
  terrainGeo.rotateX(-Math.PI / 2);
  const terrPos = terrainGeo.attributes.position;
  for (let i = 0; i < terrPos.count; i++) {
    const tx = terrPos.getX(i);
    const tz = terrPos.getZ(i);
    const dist = Math.sqrt(tx * tx + tz * tz);
    const fade = THREE.MathUtils.clamp((dist - 8) / 22, 0, 1);
    const h = (
      Math.sin(tx * 0.20 + 0.6) * Math.cos(tz * 0.24 + 1.1) * 0.85 +
      Math.sin(tx * 0.42 - 0.9) * Math.sin(tz * 0.31 + 0.4) * 0.55 +
      Math.cos(tx * 0.11 + tz * 0.14) * 1.05 +
      Math.sin(tx * 0.63 + tz * 0.47) * 0.30 +
      Math.cos(tx * 0.09 - tz * 0.19) * 0.45
    ) * fade;
    terrPos.setY(i, h);
  }
  terrainGeo.computeVertexNormals();
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x0c1322, roughness: 0.95, metalness: 0.1 });
  const ground = new THREE.Mesh(terrainGeo, groundMat);
  ground.receiveShadow = true;
  scene.add(ground);

  // Sand / dust patches scattered across the terrain (deterministic positions)
  const sandMat = new THREE.MeshStandardMaterial({ color: 0x192035, roughness: 0.98, metalness: 0.0 });
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2 + (i % 3) * 0.65;
    const r = 9 + (i % 7) * 5.4 + Math.sin(i * 2.1) * 3.2;
    const patchX = Math.cos(angle) * r;
    const patchZ = Math.sin(angle) * r;
    const patchR = 2.2 + (i % 5) * 1.1;
    const patch = new THREE.Mesh(new THREE.CircleGeometry(patchR, 9), sandMat);
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(patchX, getTerrainHeight(patchX, patchZ) + 0.07, patchZ);
    patch.receiveShadow = true;
    scene.add(patch);
  }

  const grid = new THREE.GridHelper(150, 75, 0x00f2fe, 0x1b3a5c);
  grid.material.opacity = 0.25;
  grid.material.transparent = true;
  grid.visible = false;
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
    const W = 768, H = 200;
    const cvs = document.createElement('canvas');
    cvs.width = W; cvs.height = H;
    const ctx = cvs.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    const col = '#' + new THREE.Color(hex).getHexString();
    const cx = W / 2, cy = H / 2;
    ctx.font = '700 72px Outfit, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    try { ctx.letterSpacing = '6px'; } catch (_) {}

    // Pass 1 — wide outer halo
    ctx.globalAlpha = 0.45;
    ctx.shadowColor = col;
    ctx.shadowBlur = 70;
    ctx.fillStyle = col;
    ctx.fillText(text, cx, cy);

    // Pass 2 — mid glow
    ctx.globalAlpha = 0.75;
    ctx.shadowBlur = 32;
    ctx.fillText(text, cx, cy);

    // Pass 3 — crisp bright core (white-hot centre)
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, cx, cy);

    const tex = new THREE.CanvasTexture(cvs);
    tex.anisotropy = 4;
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })
    );
    sprite.scale.set(10, 2.6, 1);
    return sprite;
  }

  // Canvas texture — single grand arcane composition (used as emissiveMap)
  function makeRuneTexture(color, idx = 0) {
    const W = 1024, H = 1024;
    const cvs = document.createElement('canvas');
    cvs.width = W; cvs.height = H;
    const ctx = cvs.getContext('2d');

    // Unique seed per pillar so each kiosk gets a distinct pattern
    const cr = Math.round(color.r * 255), cg = Math.round(color.g * 255), cb = Math.round(color.b * 255);
    let _s = (((cr << 16) | (cg << 8) | cb) ^ (idx * 0x9e3779b9 + 0xdeadbeef)) | 1;
    const rand = () => { _s ^= _s << 13; _s ^= _s >> 17; _s ^= _s << 5; return ((_s >>> 0) / 0xffffffff); };

    const hex = '#' + color.getHexString();
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = hex; ctx.fillStyle = hex; ctx.shadowColor = hex;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    const RUNES = ['ᚠ','ᚢ','ᚦ','ᚨ','ᚱ','ᚲ','ᚷ','ᚹ','ᚺ','ᚾ',
                   'ᛁ','ᛃ','ᛇ','ᛈ','ᛉ','ᛊ','ᛏ','ᛒ','ᛖ','ᛗ','ᛚ','ᛜ','ᛞ','ᛟ'];

    // ── 5-layer ornate border ────────────────────────────────────
    [[4,1,0.25],[12,2,0.6],[20,1,0.2],[32,2.5,1.0],[44,1,0.3]].forEach(([ins,w,a]) => {
      ctx.lineWidth = w; ctx.globalAlpha = a; ctx.shadowBlur = ins === 32 ? 16 : 4;
      ctx.strokeRect(ins, ins, W - ins*2, H - ins*2);
    });
    ctx.globalAlpha = 1;

    // ── Four unique corner ornaments (triangle / square / pentagon / hexagon) ──
    [[66,66],[W-66,66],[66,H-66],[W-66,H-66]].forEach(([cx,cy],ci) => {
      ctx.shadowBlur = 14; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.arc(cx,cy,40,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx,cy,24,0,Math.PI*2); ctx.stroke();
      const sides = ci + 3;
      ctx.beginPath();
      for (let v = 0; v < sides; v++) {
        const a = (v/sides)*Math.PI*2 - Math.PI/2;
        v === 0 ? ctx.moveTo(cx+Math.cos(a)*18,cy+Math.sin(a)*18)
                : ctx.lineTo(cx+Math.cos(a)*18,cy+Math.sin(a)*18);
      }
      ctx.closePath(); ctx.stroke();
      ctx.font = '22px serif'; ctx.globalAlpha = 0.9; ctx.shadowBlur = 16;
      ctx.fillText(RUNES[(ci*7 + idx*3 + 2) % RUNES.length], cx, cy);
    });
    ctx.globalAlpha = 1;

    // ── Vertical edge rune strips (varying sizes, unique per pillar) ──
    ctx.shadowBlur = 8;
    for (let row = 0; row < 26; row++) {
      const ry = 52 + row*(H-104)/25;
      ctx.font = `${16+Math.floor(rand()*11)}px serif`;
      ctx.globalAlpha = 0.42 + rand()*0.42;
      ctx.fillText(RUNES[(row*3 + idx) % RUNES.length], 26, ry);
      ctx.fillText(RUNES[(row*7 + 11 + idx) % RUNES.length], W-26, ry);
    }
    ctx.globalAlpha = 1;

    // ── Grand central mandala ────────────────────────────────────
    const CX = W/2, CY = H/2, R = 270;

    // Five concentric rings at decreasing opacity
    [[R,2.5,1.0,20],[R*0.74,1.5,0.85,12],[R*0.53,1.2,0.65,8],
     [R*0.35,1,0.55,7],[R*0.18,0.8,0.45,5]].forEach(([r,w,a,blur]) => {
      ctx.lineWidth = w; ctx.globalAlpha = a; ctx.shadowBlur = blur;
      ctx.beginPath(); ctx.arc(CX,CY,r,0,Math.PI*2); ctx.stroke();
    });

    // 12 major spokes — alternating diamond / circle tips
    ctx.globalAlpha = 0.78; ctx.lineWidth = 1.5; ctx.shadowBlur = 12;
    for (let s = 0; s < 12; s++) {
      const a = (s/12)*Math.PI*2;
      ctx.beginPath();
      ctx.moveTo(CX+Math.cos(a)*R*0.18, CY+Math.sin(a)*R*0.18);
      ctx.lineTo(CX+Math.cos(a)*R,      CY+Math.sin(a)*R);
      ctx.stroke();
      if (s%2 === 0) {
        ctx.save();
        ctx.translate(CX+Math.cos(a)*(R+13), CY+Math.sin(a)*(R+13));
        ctx.rotate(a+Math.PI/4); ctx.globalAlpha = 0.7; ctx.lineWidth = 1.2;
        ctx.strokeRect(-6,-6,12,12); ctx.restore();
        ctx.globalAlpha = 0.78; ctx.lineWidth = 1.5;
      } else {
        ctx.beginPath();
        ctx.arc(CX+Math.cos(a)*(R+11), CY+Math.sin(a)*(R+11), 4.5, 0, Math.PI*2);
        ctx.stroke();
      }
    }

    // 6 minor half-spokes (inner rings only)
    ctx.globalAlpha = 0.35; ctx.lineWidth = 0.8; ctx.shadowBlur = 5;
    for (let s = 0; s < 6; s++) {
      const a = (s/6)*Math.PI*2 + Math.PI/12;
      ctx.beginPath();
      ctx.moveTo(CX+Math.cos(a)*R*0.18, CY+Math.sin(a)*R*0.18);
      ctx.lineTo(CX+Math.cos(a)*R*0.53, CY+Math.sin(a)*R*0.53);
      ctx.stroke();
    }

    // Alternating arc fillets between outer two rings
    ctx.globalAlpha = 0.3; ctx.lineWidth = 1; ctx.shadowBlur = 4;
    for (let s = 0; s < 12; s += 2) {
      ctx.beginPath();
      ctx.arc(CX,CY,R*0.87, (s/12)*Math.PI*2, ((s+1)/12)*Math.PI*2);
      ctx.stroke();
    }

    // Hexagram (two overlapping triangles — Star of David)
    ctx.globalAlpha = 0.88; ctx.lineWidth = 1.5; ctx.shadowBlur = 14;
    for (let t = 0; t < 2; t++) {
      ctx.beginPath();
      for (let v = 0; v < 3; v++) {
        const a = (v/3)*Math.PI*2 + t*(Math.PI/3) - Math.PI/2;
        v === 0 ? ctx.moveTo(CX+Math.cos(a)*R*0.37, CY+Math.sin(a)*R*0.37)
                : ctx.lineTo(CX+Math.cos(a)*R*0.37, CY+Math.sin(a)*R*0.37);
      }
      ctx.closePath(); ctx.stroke();
    }

    // Pentagram inscribed inside hexagram
    ctx.globalAlpha = 0.62; ctx.lineWidth = 1.2; ctx.shadowBlur = 10;
    ctx.beginPath();
    for (let v = 0; v < 5; v++) {
      const a = ((v*2)/5)*Math.PI*2 - Math.PI/2;
      v === 0 ? ctx.moveTo(CX+Math.cos(a)*R*0.22, CY+Math.sin(a)*R*0.22)
              : ctx.lineTo(CX+Math.cos(a)*R*0.22, CY+Math.sin(a)*R*0.22);
    }
    ctx.closePath(); ctx.stroke();

    // 12 runes orbiting between ring 2 and ring 3
    for (let i = 0; i < 12; i++) {
      const a = (i/12)*Math.PI*2;
      ctx.save();
      ctx.translate(CX+Math.cos(a)*R*0.635, CY+Math.sin(a)*R*0.635);
      ctx.rotate(a+Math.PI/2);
      ctx.font = '19px serif'; ctx.globalAlpha = 0.62; ctx.shadowBlur = 9;
      ctx.fillText(RUNES[(i*2+5+idx) % RUNES.length], 0, 0);
      ctx.restore();
    }

    // 16 runes orbiting just outside the outer circle
    for (let i = 0; i < 16; i++) {
      const a = (i/16)*Math.PI*2;
      ctx.save();
      ctx.translate(CX+Math.cos(a)*R*1.10, CY+Math.sin(a)*R*1.10);
      ctx.rotate(a+Math.PI/2);
      ctx.font = '16px serif'; ctx.globalAlpha = 0.45; ctx.shadowBlur = 7;
      ctx.fillText(RUNES[(i*3+11+idx) % RUNES.length], 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    // Central focal rune (unique per pillar via idx)
    ctx.font = '80px serif'; ctx.globalAlpha = 1.0; ctx.shadowBlur = 28;
    ctx.fillText(RUNES[(idx*5+18) % RUNES.length], CX, CY);

    // ── Top sub-ornament: 8-spoke star wheel ─────────────────────
    const TOP_Y = 116, TOP_R = 68;
    ctx.globalAlpha = 0.82; ctx.lineWidth = 1.5; ctx.shadowBlur = 12;
    [TOP_R, TOP_R*0.60, TOP_R*0.34].forEach(r => {
      ctx.beginPath(); ctx.arc(CX,TOP_Y,r,0,Math.PI*2); ctx.stroke();
    });
    ctx.globalAlpha = 0.68; ctx.lineWidth = 1; ctx.shadowBlur = 8;
    for (let s = 0; s < 8; s++) {
      const a = (s/8)*Math.PI*2;
      ctx.beginPath();
      ctx.moveTo(CX+Math.cos(a)*TOP_R*0.34, TOP_Y+Math.sin(a)*TOP_R*0.34);
      ctx.lineTo(CX+Math.cos(a)*TOP_R,       TOP_Y+Math.sin(a)*TOP_R);
      ctx.stroke();
    }
    ctx.beginPath(); // inscribed square
    for (let v = 0; v < 4; v++) {
      const a = (v/4)*Math.PI*2 - Math.PI/4;
      v === 0 ? ctx.moveTo(CX+Math.cos(a)*TOP_R*0.30, TOP_Y+Math.sin(a)*TOP_R*0.30)
              : ctx.lineTo(CX+Math.cos(a)*TOP_R*0.30, TOP_Y+Math.sin(a)*TOP_R*0.30);
    }
    ctx.closePath(); ctx.stroke();
    for (let i = 0; i < 8; i++) { // 8 mini runes on middle ring
      const a = (i/8)*Math.PI*2;
      ctx.save();
      ctx.translate(CX+Math.cos(a)*TOP_R*0.47, TOP_Y+Math.sin(a)*TOP_R*0.47);
      ctx.rotate(a+Math.PI/2); ctx.font = '11px serif'; ctx.globalAlpha = 0.55; ctx.shadowBlur = 6;
      ctx.fillText(RUNES[(i+idx*2) % RUNES.length], 0, 0); ctx.restore();
    }
    ctx.font = '32px serif'; ctx.globalAlpha = 0.95; ctx.shadowBlur = 18;
    ctx.fillText(RUNES[(idx*3) % RUNES.length], CX, TOP_Y);

    // ── Bottom sub-ornament: 6-spoke rune wheel ───────────────────
    const BOT_Y = H-116, BOT_R = 68;
    ctx.globalAlpha = 0.82; ctx.lineWidth = 1.5; ctx.shadowBlur = 12;
    [BOT_R, BOT_R*0.60, BOT_R*0.34].forEach(r => {
      ctx.beginPath(); ctx.arc(CX,BOT_Y,r,0,Math.PI*2); ctx.stroke();
    });
    ctx.globalAlpha = 0.65; ctx.lineWidth = 1; ctx.shadowBlur = 8;
    for (let s = 0; s < 6; s++) {
      const a = (s/6)*Math.PI*2;
      ctx.beginPath();
      ctx.moveTo(CX+Math.cos(a)*BOT_R*0.34, BOT_Y+Math.sin(a)*BOT_R*0.34);
      ctx.lineTo(CX+Math.cos(a)*BOT_R,       BOT_Y+Math.sin(a)*BOT_R);
      ctx.stroke();
    }
    ctx.beginPath(); // inscribed hexagon
    for (let v = 0; v < 6; v++) {
      const a = (v/6)*Math.PI*2 - Math.PI/6;
      v === 0 ? ctx.moveTo(CX+Math.cos(a)*BOT_R*0.30, BOT_Y+Math.sin(a)*BOT_R*0.30)
              : ctx.lineTo(CX+Math.cos(a)*BOT_R*0.30, BOT_Y+Math.sin(a)*BOT_R*0.30);
    }
    ctx.closePath(); ctx.stroke();
    for (let i = 0; i < 6; i++) { // 6 mini runes on middle ring
      const a = (i/6)*Math.PI*2;
      ctx.save();
      ctx.translate(CX+Math.cos(a)*BOT_R*0.47, BOT_Y+Math.sin(a)*BOT_R*0.47);
      ctx.rotate(a+Math.PI/2); ctx.font = '11px serif'; ctx.globalAlpha = 0.55; ctx.shadowBlur = 6;
      ctx.fillText(RUNES[(i+6+idx*4) % RUNES.length], 0, 0); ctx.restore();
    }
    ctx.font = '28px serif'; ctx.globalAlpha = 0.92; ctx.shadowBlur = 16;
    ctx.fillText(RUNES[(idx*7+14) % RUNES.length], CX, BOT_Y);
    ctx.globalAlpha = 1;

    // ── Vertical spine connecting all three focal elements ────────
    ctx.lineWidth = 1; ctx.globalAlpha = 0.4; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.moveTo(CX, TOP_Y+TOP_R+2); ctx.lineTo(CX, CY-R); ctx.stroke();
    for (let ty = TOP_Y+TOP_R+14; ty < CY-R-4; ty += 14) {
      ctx.beginPath(); ctx.moveTo(CX-5,ty); ctx.lineTo(CX+5,ty); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(CX, CY+R); ctx.lineTo(CX, BOT_Y-BOT_R-2); ctx.stroke();
    for (let ty = CY+R+14; ty < BOT_Y-BOT_R-4; ty += 14) {
      ctx.beginPath(); ctx.moveTo(CX-5,ty); ctx.lineTo(CX+5,ty); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // ── Side circuit lines (angular paths with node dots) ─────────
    ctx.lineWidth = 1; ctx.globalAlpha = 0.42; ctx.shadowBlur = 7;
    [[54,96],[W-54,W-96]].forEach(([xA,xB]) => {
      ctx.beginPath();
      ctx.moveTo(xA,158); ctx.lineTo(xB,232); ctx.lineTo(xB,CY-90);
      ctx.lineTo(xA,CY); ctx.lineTo(xB,CY+90);
      ctx.lineTo(xB,H-232); ctx.lineTo(xA,H-158);
      ctx.stroke();
      [[xA,158],[xB,232],[xB,CY-90],[xA,CY],[xB,CY+90],[xB,H-232],[xA,H-158]].forEach(([px,py]) => {
        ctx.globalAlpha = 0.62; ctx.beginPath(); ctx.arc(px,py,4.5,0,Math.PI*2); ctx.fill();
      });
      ctx.globalAlpha = 0.42;
    });
    ctx.globalAlpha = 1;

    // ── Scattered rune clusters unique per pillar ─────────────────
    ctx.shadowBlur = 8;
    [
      {x1:108, x2:230, y1:170, y2:H-170, n:20, off:1},
      {x1:W-230, x2:W-108, y1:170, y2:H-170, n:20, off:9},
      {x1:135, x2:440, y1:TOP_Y+TOP_R+8, y2:CY-R-8, n:7, off:17},
      {x1:584, x2:889, y1:TOP_Y+TOP_R+8, y2:CY-R-8, n:7, off:20},
      {x1:135, x2:440, y1:CY+R+8, y2:BOT_Y-BOT_R-8, n:7, off:3},
      {x1:584, x2:889, y1:CY+R+8, y2:BOT_Y-BOT_R-8, n:7, off:7},
    ].forEach(({x1,x2,y1,y2,n,off}) => {
      if (x2 <= x1+8 || y2 <= y1+8) return;
      for (let j = 0; j < n; j++) {
        const rx = x1 + rand()*(x2-x1), ry = y1 + rand()*(y2-y1);
        ctx.font = `${13+Math.floor(rand()*18)}px serif`;
        ctx.globalAlpha = 0.2 + rand()*0.5;
        ctx.save(); ctx.translate(rx,ry); ctx.rotate((rand()-0.5)*0.5);
        ctx.fillText(RUNES[(off+j+idx*3) % RUNES.length], 0, 0);
        ctx.restore();
      }
    });
    ctx.globalAlpha = 1;

    // ── Horizontal accent lines flanking sub-mandalas ─────────────
    ctx.lineWidth = 1; ctx.shadowBlur = 5;
    [[TOP_Y,TOP_R+6],[BOT_Y,BOT_R+6]].forEach(([ly,clr]) => {
      ctx.globalAlpha = 0.42;
      ctx.beginPath(); ctx.moveTo(50,ly); ctx.lineTo(CX-clr,ly); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(CX+clr,ly); ctx.lineTo(W-50,ly); ctx.stroke();
      for (let t = 0; t < 5; t++) {
        const tx = 56 + t*(CX-clr-58)/4;
        ctx.beginPath(); ctx.moveTo(tx,ly-5); ctx.lineTo(tx,ly+5); ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;

    // ── Constellation accent dots ─────────────────────────────────
    ctx.shadowBlur = 4;
    for (let i = 0; i < 70; i++) {
      const dx = 52+rand()*(W-104), dy = 52+rand()*(H-104);
      if (Math.hypot(dx-CX,dy-CY) < R+36) continue;
      if (Math.hypot(dx-CX,dy-TOP_Y) < TOP_R+14) continue;
      if (Math.hypot(dx-CX,dy-BOT_Y) < BOT_R+14) continue;
      ctx.globalAlpha = 0.16+rand()*0.36;
      ctx.beginPath(); ctx.arc(dx,dy,1+rand()*2.5,0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    const tex = new THREE.CanvasTexture(cvs);
    tex.anisotropy = 4;
    return tex;
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
    const ky = getTerrainHeight(x, z);
    group.position.set(x, ky, z);

    // Base pad
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 0.4, 24),
      padMat
    );
    pad.position.y = 0.2;
    pad.receiveShadow = true;
    pad.castShadow = true;
    group.add(pad);

    // Rune-engraved glowing pillar
    const runeTex = makeRuneTexture(color, i);
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 1.1, 5, 6),
      new THREE.MeshStandardMaterial({
        color: 0x030810,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.18,
        emissiveMap: runeTex,
        roughness: 0.55,
        metalness: 0.15,
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
        emissiveIntensity: 0.25,
        roughness: 0.2,
        metalness: 0.4,
      })
    );
    crystal.position.y = 7.4;
    crystal.castShadow = true;
    group.add(crystal);

    // Beacon light
    const beam = new THREE.PointLight(color, 3, 18);
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

    // Floating sparkle particles around the pillar
    const SPARK_N = 28;
    const sparkPos   = new Float32Array(SPARK_N * 3);
    const sparkPhase = new Float32Array(SPARK_N);
    const sparkSpeed = new Float32Array(SPARK_N);
    for (let j = 0; j < SPARK_N; j++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.9 + Math.random() * 1.4;
      sparkPos[j * 3]     = Math.cos(a) * r;
      sparkPos[j * 3 + 1] = Math.random() * 6.0;
      sparkPos[j * 3 + 2] = Math.sin(a) * r;
      sparkPhase[j] = Math.random() * 6.0;
      sparkSpeed[j] = 0.35 + Math.random() * 0.65;
    }
    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    const sparkles = new THREE.Points(sparkGeo,
      new THREE.PointsMaterial({ color, size: 0.09, transparent: true, opacity: 0.85, depthWrite: false })
    );
    group.add(sparkles);

    scene.add(group);
    kioskMeshes.push({ ...k, group, pillar, crystal, beam, pring, sparkles, sparkPhase, sparkSpeed, pos: new THREE.Vector3(x, ky, z) });
  });

  // --- Score / coin collection ---
  const visitedKiosks = new Set();
  const scoreHUD = document.createElement('div');
  scoreHUD.id = 'score-hud';
  scoreHUD.innerHTML = `🪙 <span id="score-val">0</span>&thinsp;/&thinsp;<span id="score-max">${kioskMeshes.length}</span>`;
  document.body.appendChild(scoreHUD);

  function awardCoin(id) {
    document.getElementById('score-val').textContent = visitedKiosks.size;
    const pop = document.createElement('div');
    pop.className = 'coin-popup';
    pop.textContent = '+1 🪙';
    document.body.appendChild(pop);
    pop.addEventListener('animationend', () => pop.remove());
    scoreHUD.classList.remove('score-pop');
    void scoreHUD.offsetWidth; // restart animation
    scoreHUD.classList.add('score-pop');
    if (visitedKiosks.size === kioskMeshes.length)
      setTimeout(() => scoreHUD.classList.add('score-complete'), 400);
    _playCoinChime();
    // Light up the pillar permanently on first visit
    const km = kioskMeshes.find((m) => m.id === id);
    if (km) {
      km.pillar.material.emissiveIntensity = 4.5;
      km.beam.intensity = 55;
      km.crystal.material.emissiveIntensity = 2.8;
    }
  }

  // ========================================================================
  // SOUND SYSTEM — Web Audio API, all sounds generated procedurally
  // ========================================================================
  let _actx = null;
  let _engOsc = null, _engOsc2 = null, _engGain = null, _engFilter = null;

  function _getCtx() {
    if (!_actx) _actx = new (window.AudioContext || window.webkitAudioContext)();
    if (_actx.state === 'suspended') _actx.resume();
    return _actx;
  }

  function _initEngine() {
    if (_engOsc) return;
    const ctx = _getCtx();
    _engFilter = ctx.createBiquadFilter();
    _engFilter.type = 'lowpass';
    _engFilter.frequency.value = 300;
    _engGain = ctx.createGain();
    _engGain.gain.value = 0;
    _engFilter.connect(_engGain);
    _engGain.connect(ctx.destination);
    _engOsc = ctx.createOscillator();
    _engOsc.type = 'sawtooth';
    _engOsc.frequency.value = 55;
    _engOsc.connect(_engFilter);
    _engOsc.start();
    _engOsc2 = ctx.createOscillator();
    _engOsc2.type = 'square';
    _engOsc2.frequency.value = 28;
    const sub = ctx.createGain();
    sub.gain.value = 0.3;
    _engOsc2.connect(sub);
    sub.connect(_engFilter);
    _engOsc2.start();
  }

  function _tickEngine(speed) {
    if (!_actx || !_engOsc) return;
    const abs = Math.abs(speed);
    const t = _actx.currentTime;
    const freq = 55 + (abs / MAX_SPEED) * 90;
    _engOsc.frequency.setTargetAtTime(freq, t, 0.08);
    _engOsc2.frequency.setTargetAtTime(freq * 0.5, t, 0.08);
    _engFilter.frequency.setTargetAtTime(200 + (abs / MAX_SPEED) * 700, t, 0.05);
    _engGain.gain.setTargetAtTime(abs > 0.5 ? 0.15 : 0, t, abs > 0.5 ? 0.15 : 0.5);
  }

  function _playCoinChime() {
    const ctx = _getCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.28);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.28, t + 0.02);
    g.gain.setValueAtTime(0.28, t + 0.22);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.42);
  }

  function _playKioskWhomp() {
    const ctx = _getCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.3);
    g.gain.setValueAtTime(0.28, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.48);
  }

  // Lazy-init engine on first user gesture (browser autoplay policy)
  window.addEventListener('keydown', _initEngine, { once: true });
  window.addEventListener('pointerdown', _initEngine, { once: true });
  document.addEventListener('visibilitychange', () => {
    if (!_actx) return;
    if (document.hidden) _actx.suspend();
    else _actx.resume();
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
    group.position.set(x, getTerrainHeight(x, z), z);
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

  // ========================================================================
  // CHICKENS — Minecraft-style blocky birds roaming the field
  // ========================================================================
  const FLEE_RADIUS = 12;
  const chickens = [];
  {
    const CS = 1.5; // chicken scale (large)
    const legLen = 0.48 * CS;
    const bodyBottom = legLen;
    const bodyH = 0.65 * CS;
    const bodyCenter = bodyBottom + bodyH / 2;
    const bodyTop = bodyBottom + bodyH;
    const headBaseY = bodyTop + 0.35 * CS;

    const cWhiteMat  = new THREE.MeshStandardMaterial({ color: 0xeeeedd, roughness: 0.82 });
    const cOrangeMat = new THREE.MeshStandardMaterial({ color: 0xdd7700, roughness: 0.72 });
    const cRedMat    = new THREE.MeshStandardMaterial({ color: 0xcc1111, roughness: 0.72 });
    const cEyeMat    = new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.9  });
    const cWingMat   = new THREE.MeshStandardMaterial({ color: 0xd8d8c8, roughness: 0.85 });

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.5;
      const r = 10 + Math.random() * 26;
      const cx = Math.cos(angle) * r;
      const cz = Math.sin(angle) * r;
      const group = new THREE.Group();

      // Body
      const body = new THREE.Mesh(new RoundedBoxGeometry(0.8 * CS, bodyH, 1.05 * CS, 4, 0.08 * CS), cWhiteMat);
      body.position.set(0, bodyCenter, 0);
      body.castShadow = true;
      group.add(body);

      // Tail feathers
      const tail = new THREE.Mesh(new RoundedBoxGeometry(0.55 * CS, 0.42 * CS, 0.20 * CS, 4, 0.04 * CS), cWhiteMat);
      tail.position.set(0, bodyTop - 0.08 * CS, -0.58 * CS);
      tail.rotation.x = 0.55;
      group.add(tail);

      // Head group (animated for bob/peck)
      const headGroup = new THREE.Group();
      headGroup.position.set(0, headBaseY, 0.36 * CS);

      const headMesh = new THREE.Mesh(new RoundedBoxGeometry(0.55 * CS, 0.55 * CS, 0.55 * CS, 4, 0.07 * CS), cWhiteMat);
      headMesh.castShadow = true;
      headGroup.add(headMesh);

      const beak = new THREE.Mesh(new RoundedBoxGeometry(0.16 * CS, 0.12 * CS, 0.22 * CS, 3, 0.02 * CS), cOrangeMat);
      beak.position.set(0, -0.06 * CS, 0.38 * CS);
      headGroup.add(beak);

      const comb = new THREE.Mesh(new RoundedBoxGeometry(0.10 * CS, 0.22 * CS, 0.34 * CS, 3, 0.02 * CS), cRedMat);
      comb.position.set(0, 0.37 * CS, 0.04 * CS);
      headGroup.add(comb);

      const wattle = new THREE.Mesh(new RoundedBoxGeometry(0.10 * CS, 0.18 * CS, 0.10 * CS, 3, 0.02 * CS), cRedMat);
      wattle.position.set(0, -0.25 * CS, 0.22 * CS);
      headGroup.add(wattle);

      [-1, 1].forEach((side) => {
        const eye = new THREE.Mesh(new RoundedBoxGeometry(0.05 * CS, 0.09 * CS, 0.05 * CS, 2, 0.01 * CS), cEyeMat);
        eye.position.set(side * 0.28 * CS, 0.04 * CS, 0.28 * CS);
        headGroup.add(eye);
      });
      group.add(headGroup);

      // Wings — pivot at shoulder so they flap when fleeing
      const leftWingPivot  = new THREE.Group();
      leftWingPivot.position.set(-0.42 * CS, bodyCenter + 0.10 * CS, 0);
      const lwm = new THREE.Mesh(new RoundedBoxGeometry(0.14 * CS, 0.52 * CS, 0.88 * CS, 3, 0.03 * CS), cWingMat);
      lwm.position.y = -0.26 * CS;
      leftWingPivot.add(lwm);
      group.add(leftWingPivot);

      const rightWingPivot = new THREE.Group();
      rightWingPivot.position.set(0.42 * CS, bodyCenter + 0.10 * CS, 0);
      const rwm = new THREE.Mesh(new RoundedBoxGeometry(0.14 * CS, 0.52 * CS, 0.88 * CS, 3, 0.03 * CS), cWingMat);
      rwm.position.y = -0.26 * CS;
      rightWingPivot.add(rwm);
      group.add(rightWingPivot);

      // Legs — pivot at hip for striding
      const leftLegPivot = new THREE.Group();
      leftLegPivot.position.set(-0.18 * CS, bodyBottom, 0.08 * CS);
      const llm = new THREE.Mesh(new RoundedBoxGeometry(0.13 * CS, legLen, 0.13 * CS, 3, 0.02 * CS), cOrangeMat);
      llm.position.y = -legLen / 2;
      leftLegPivot.add(llm);
      const lf = new THREE.Mesh(new RoundedBoxGeometry(0.32 * CS, 0.06 * CS, 0.22 * CS, 3, 0.01 * CS), cOrangeMat);
      lf.position.set(0.04 * CS, -legLen, 0.07 * CS);
      leftLegPivot.add(lf);
      group.add(leftLegPivot);

      const rightLegPivot = new THREE.Group();
      rightLegPivot.position.set(0.18 * CS, bodyBottom, 0.08 * CS);
      const rlm = new THREE.Mesh(new RoundedBoxGeometry(0.13 * CS, legLen, 0.13 * CS, 3, 0.02 * CS), cOrangeMat);
      rlm.position.y = -legLen / 2;
      rightLegPivot.add(rlm);
      const rf = new THREE.Mesh(new RoundedBoxGeometry(0.32 * CS, 0.06 * CS, 0.22 * CS, 3, 0.01 * CS), cOrangeMat);
      rf.position.set(0.04 * CS, -legLen, 0.07 * CS);
      rightLegPivot.add(rf);
      group.add(rightLegPivot);

      group.position.set(cx, getTerrainHeight(cx, cz), cz);
      group.rotation.y = Math.random() * Math.PI * 2;
      scene.add(group);

      chickens.push({
        x: cx, z: cz,
        yaw: Math.random() * Math.PI * 2,
        targetYaw: Math.random() * Math.PI * 2,
        speed: 0,
        wanderTimer: Math.random() * 2,
        group, headGroup,
        leftLegPivot, rightLegPivot,
        leftWingPivot, rightWingPivot,
        headBaseY,
      });
    }
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
  // CAR — fire logo texture for rear plate
  // ========================================================================
  function makeFireLogoTexture() {
    const W = 512, H = 256;
    const cvs = document.createElement('canvas');
    cvs.width = W; cvs.height = H;
    const ctx = cvs.getContext('2d');

    // Warm near-black background
    ctx.fillStyle = '#050100';
    ctx.fillRect(0, 0, W, H);

    // Ambient fire glow (radial, centered)
    const ambG = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W * 0.44);
    ambG.addColorStop(0,   'rgba(255,88,0,0.22)');
    ambG.addColorStop(0.5, 'rgba(200,28,0,0.09)');
    ambG.addColorStop(1,   'rgba(160,0,0,0)');
    ctx.fillStyle = ambG;
    ctx.fillRect(0, 0, W, H);

    // Rising flame wave lines at the bottom
    for (let ly = 0; ly < 6; ly++) {
      const baseY = H * 0.74 + ly * 7;
      const amp   = 7 - ly;
      const freq  = (2.2 + ly * 0.5) * Math.PI * 2 / W;
      const gv    = Math.round(ly * 22);
      ctx.strokeStyle = `rgba(255,${gv},0,${0.75 - ly * 0.1})`;
      ctx.lineWidth   = 2.5 - ly * 0.28;
      ctx.shadowColor = `rgba(255,${gv},0,1)`;
      ctx.shadowBlur  = 9;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const y = baseY + Math.sin(x * freq + ly * 1.8) * amp;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // Side wavy streaks radiating outward from logo
    [-1, 1].forEach(side => {
      const x0 = W/2 + side * 110;
      const x1 = W/2 + side * (W/2 - 22);
      for (let row = 0; row < 5; row++) {
        const y0 = H/2 - 32 + row * 14;
        const gv = 55 + row * 28;
        ctx.strokeStyle = `rgba(255,${gv},0,${0.68 - row * 0.1})`;
        ctx.lineWidth   = 2.2 - row * 0.3;
        ctx.shadowColor = `rgba(255,${gv},0,0.9)`;
        ctx.shadowBlur  = 7;
        ctx.beginPath();
        for (let i = 0; i <= 40; i++) {
          const ft = i / 40;
          const x = x0 + (x1 - x0) * ft;
          const y = y0 + Math.sin(ft * Math.PI * 3.5 + row * 1.3) * 5;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    });
    ctx.shadowBlur = 0;

    // AA logo — scaled into fire gradient in local SVG coordinate space
    const SC   = 3.75;
    const offX = W/2 - 24 * SC;
    const offY = (H - 48 * SC) / 2 - 8; // slightly above center to leave room for text

    ctx.save();
    ctx.translate(offX, offY);
    ctx.scale(SC, SC);

    const fireG = ctx.createLinearGradient(4, 2, 44, 46);
    fireG.addColorStop(0,    '#ffee00');
    fireG.addColorStop(0.35, '#ff8800');
    fireG.addColorStop(0.72, '#ff2200');
    fireG.addColorStop(1,    '#cc0000');

    // Hexagonal border
    ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 5;
    ctx.strokeStyle = fireG; ctx.lineWidth = 2; ctx.globalAlpha = 0.82;
    ctx.beginPath();
    [[24,2],[44,13],[44,35],[24,46],[4,35],[4,13]].forEach(([px,py],vi) =>
      vi===0 ? ctx.moveTo(px,py) : ctx.lineTo(px,py));
    ctx.closePath(); ctx.stroke();

    // Two A shapes
    ctx.shadowBlur = 3.5; ctx.fillStyle = fireG; ctx.globalAlpha = 1.0;
    ctx.fill(new Path2D('M10 36 L18 12 L22 12 L16 36 L13 36 L19.5 18.5 L17 18.5 Z'));
    ctx.fill(new Path2D('M26 36 L34 12 L38 12 L32 36 L29 36 L35.5 18.5 L33 18.5 Z'));

    // Crossbar connecting both As (rounded rect)
    ctx.globalAlpha = 0.88;
    const [bx,by,bw,bh,br] = [14, 25, 22, 2.5, 1.25];
    ctx.beginPath();
    ctx.moveTo(bx+br, by);
    ctx.lineTo(bx+bw-br, by);       ctx.arcTo(bx+bw, by,   bx+bw, by+br,   br);
    ctx.lineTo(bx+bw, by+bh-br);    ctx.arcTo(bx+bw, by+bh, bx+bw-br, by+bh, br);
    ctx.lineTo(bx+br, by+bh);       ctx.arcTo(bx, by+bh, bx, by+bh-br, br);
    ctx.lineTo(bx, by+br);          ctx.arcTo(bx, by, bx+br, by, br);
    ctx.closePath(); ctx.fill();

    ctx.restore(); ctx.shadowBlur = 0;

    // "AFSAL A AZEEZ" name text
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 16px monospace';
    ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 8;
    ctx.fillStyle = 'rgba(255,128,18,0.72)'; ctx.globalAlpha = 1;
    ctx.fillText('AFSAL  A  AZEEZ', W/2, H - 18);
    ctx.shadowBlur = 0;

    const tex = new THREE.CanvasTexture(cvs);
    tex.anisotropy = 4;
    return tex;
  }

  let fireLogoMat = null; // referenced in tick for flicker animation
  let accentMat = null;   // emissive accent strips — referenced in tick for pulse

  // ========================================================================
  // CAR
  // ========================================================================
  // RC rock crawler: red metal tube cage, silver polycarbonate body panels,
  // red coilover springs, dark spoked rims with red beadlock rings,
  // and a spare tyre standing on the roof rack.
  const car = new THREE.Group();

  // --- Materials ---
  const steelMat    = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.75, roughness: 0.45 });
  const cageMat     = new THREE.MeshStandardMaterial({ color: 0xcc1111, metalness: 0.15, roughness: 0.68 }); // matte red painted metal
  const castMat     = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.82, roughness: 0.50 });
  const chromeMat   = new THREE.MeshStandardMaterial({ color: 0xd0d8e0, metalness: 1.0,  roughness: 0.14 });
  const springMat   = new THREE.MeshStandardMaterial({ color: 0xdd1111, metalness: 0.55, roughness: 0.30, emissive: 0x280000, emissiveIntensity: 0.2 }); // red coilovers
  const tireMat     = new THREE.MeshStandardMaterial({ color: 0x0a0c12, metalness: 0.1,  roughness: 0.95 });
  const rimMat      = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.85, roughness: 0.30 }); // dark spoke rim
  const boltMat     = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8,  roughness: 0.35 });
  const beadlockMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, metalness: 0.7,  roughness: 0.30 }); // red beadlock ring
  const seatMat     = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.1,  roughness: 0.90 });
  const bodyMat     = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, metalness: 0.6, roughness: 0.3 });

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
    const chamfer = Math.min(w, h, d) * 0.18;
    const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, chamfer), mat);
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
    strut(car, CAGE[a], CAGE[b], 0.04, cageMat);
    strut(car, mir(a), mir(b), 0.04, cageMat);
  });
  // Cross members + roof X-brace (right node -> left node)
  [['af','af'],['rf','rf'],['rr','rr'],['dr','dr'],['bf','bf'],['lf','lf'],
   ['lr','lr'],['db','db'],['rf','rr'],['rr','rf']].forEach(([a, b]) =>
    strut(car, CAGE[a], mir(b), 0.038, cageMat));
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
  slab(car, 1.0, 0.08, 0.12, new THREE.MeshBasicMaterial({ color: 0xffffff }), 0, 2.02, 0.42, false);

  // ---- RC rock crawler body ----
  // Fire logo emissive material — shared across rear, front, and side body panels
  fireLogoMat = new THREE.MeshStandardMaterial({
    color: 0xd0d8e0, metalness: 0.22, roughness: 0.55,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.9,
    emissiveMap: makeFireLogoTexture(),
  });
  // Side panels — fire logo glows on the outward-facing face
  [-0.74, 0.74].forEach((sx) => slab(car, 0.10, 0.72, 2.2, fireLogoMat, sx, 1.0, -0.1));
  // Rear body panel — fire logo facing the chase camera
  slab(car, 1.44, 0.70, 0.08, fireLogoMat, 0, 1.05, -1.80);
  // Front body panel — fire logo facing forward
  slab(car, 1.44, 0.70, 0.08, fireLogoMat, 0, 1.05, 1.80);

  // ---- Hood panel — bridges front body panel top to windshield base ----
  // Front panel top edge: y ≈ 1.40, z = 1.76
  // Windshield base (after rotation): y ≈ 1.36, z ≈ 0.53
  // Hood spans between these, slightly angled to slope down toward the front
  const hoodLen = 1.24;   // z span from windshield base to front panel
  const hoodPanel = new THREE.Mesh(
    new RoundedBoxGeometry(1.44, 0.07, hoodLen, 4, 0.012),
    bodyMat
  );
  hoodPanel.position.set(0, 1.40, 1.16);
  hoodPanel.rotation.x = 0.04;  // very slight downward slope toward front
  hoodPanel.castShadow = true;
  car.add(hoodPanel);

  // ---- Rear deck panel — bridges roof rear to rear body panel ----
  // Roof back edge: z ≈ -0.825,  Rear panel: z = -1.76
  const rearDeckLen = 0.96;
  const rearDeck = new THREE.Mesh(
    new RoundedBoxGeometry(1.44, 0.07, rearDeckLen, 4, 0.012),
    bodyMat
  );
  rearDeck.position.set(0, 1.40, -1.32);
  rearDeck.rotation.x = -0.04;
  rearDeck.castShadow = true;
  car.add(rearDeck);

  // ---- Side filler panels — close the gap between side panels and front/rear fascia ----
  // Front quarter panels (side panels end at z ≈ 1.0, front panel at z = 1.76)
  [-0.74, 0.74].forEach((sx) => {
    slab(car, 0.10, 0.70, 0.64, bodyMat, sx, 1.05, 1.50);
  });
  // Rear quarter panels (side panels end at z ≈ -1.2, rear panel at z = -1.76)
  [-0.74, 0.74].forEach((sx) => {
    slab(car, 0.10, 0.70, 0.48, bodyMat, sx, 1.05, -1.56);
  });

  // Flat roof panel
  slab(car, 1.44, 0.07, 1.45, bodyMat, 0, 1.86, -0.1);

  // ---- A-pillar struts — connect windshield sides to roof corners ----
  strut(car, [-0.66, 1.36, 0.50], [-0.70, 1.86, 0.62], 0.04, steelMat);
  strut(car, [0.66, 1.36, 0.50], [0.70, 1.86, 0.62], 0.04, steelMat);

  // Angled windscreen — transparent glass via MeshPhysicalMaterial
  const windshieldMat = new THREE.MeshPhysicalMaterial({
    color: 0x88ccff,
    metalness: 0.0,
    roughness: 0.05,
    transmission: 1,
    transparent: true,
    opacity: 0.35,
    thickness: 0.08,
    ior: 1.5,
    envMapIntensity: 1.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  });
  const wsPanel = new THREE.Mesh(
    new RoundedBoxGeometry(1.44, 0.07, 0.80, 4, 0.012),
    windshieldMat
  );
  wsPanel.position.set(0, 1.62, 0.78);
  wsPanel.rotation.x = -0.48;
  wsPanel.castShadow = false;
  car.add(wsPanel);

  // ---- Rear window glass — matching windshield angle ----
  const rearWsPanel = new THREE.Mesh(
    new RoundedBoxGeometry(1.44, 0.07, 0.58, 4, 0.012),
    windshieldMat
  );
  rearWsPanel.position.set(0, 1.62, -0.88);
  rearWsPanel.rotation.x = 0.42;
  rearWsPanel.castShadow = false;
  car.add(rearWsPanel);

  // Front & rear bumper bars
  slab(car, 1.3, 0.38, 0.12, steelMat, 0, 0.70, 1.96);
  slab(car, 1.3, 0.38, 0.12, steelMat, 0, 0.70, -1.96);

  // ---- Headlights — emissive spheres + SpotLights on the front bumper ----
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xfff8e0,
    emissive: new THREE.Color(0xffeebb),
    emissiveIntensity: 2.5,
    roughness: 0.1,
    metalness: 0.0,
  });
  const headlightHousingMat = new THREE.MeshStandardMaterial({
    color: 0x222222, metalness: 0.85, roughness: 0.25,
  });
  [-0.45, 0.45].forEach((sx) => {
    // Chrome housing ring
    const housing = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 8, 16), headlightHousingMat);
    housing.position.set(sx, 0.82, 2.02);
    housing.rotation.y = 0; // faces forward along +Z
    car.add(housing);

    // Emissive glass bulb
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), headlightMat);
    bulb.position.set(sx, 0.82, 2.04);
    car.add(bulb);

    // SpotLight for the forward beam
    const headSpot = new THREE.SpotLight(0xffeedd, 12, 30, Math.PI / 7, 0.5, 1.5);
    headSpot.position.set(sx, 0.82, 2.04);
    // Target sits far ahead of the car
    const spotTarget = new THREE.Object3D();
    spotTarget.position.set(sx * 0.3, 0.2, 12);
    car.add(spotTarget);
    headSpot.target = spotTarget;
    car.add(headSpot);
  });

  // ---- Tail lights — red emissive spheres on the rear bumper ----
  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xff1111,
    emissive: new THREE.Color(0xff0000),
    emissiveIntensity: 2.0,
    roughness: 0.15,
    metalness: 0.0,
  });
  [-0.45, 0.45].forEach((sx) => {
    const tailBulb = new THREE.Mesh(new THREE.SphereGeometry(0.10, 10, 8), taillightMat);
    tailBulb.position.set(sx, 0.82, -2.02);
    car.add(tailBulb);

    // Subtle red glow behind
    const tailGlow = new THREE.PointLight(0xff2200, 2, 5);
    tailGlow.position.set(sx, 0.82, -2.10);
    car.add(tailGlow);
  });
  // Spare tyre — properly seated flat on the roof rack, center of roof
  const spare = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.13, 8, 14), tireMat);
  spare.rotation.x = Math.PI / 2;
  spare.position.set(0, 2.01, -0.20);
  car.add(spare);
  const spareRim = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.09, 8), rimMat);
  spareRim.position.set(0, 2.01, -0.20);
  car.add(spareRim);
  const spareBeadlock = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.016, 6, 18), beadlockMat);
  spareBeadlock.rotation.x = Math.PI / 2;
  spareBeadlock.position.set(0, 2.06, -0.20);
  car.add(spareBeadlock);

  // Emissive accent strips — teal to match portfolio gradient
  accentMat = new THREE.MeshStandardMaterial({
    color: 0x000000, roughness: 1, metalness: 0,
    emissive: new THREE.Color(0xff1100),
    emissiveIntensity: 1.6,
  });
  // Flat underglow strip along the belly of the car
  slab(car, 1.55, 0.03, 2.1, accentMat, 0, 0.40, -0.10, false);
  // Thin accent strips along the bottom edge of each side panel
  [-0.80, 0.80].forEach((sx) => slab(car, 0.04, 0.05, 2.0, accentMat, sx, 0.65, -0.10, false));
  // PointLight so the glow actually tints the ground and body
  const underglowLight = new THREE.PointLight(0xff1100, 4, 6);
  underglowLight.position.set(0, 0.35, 0);
  car.add(underglowLight);

  // ---- Beadlock deep-dish wheels + oversized lugged mud tires ----
  const wheels = [];       // inner pivots that roll (rotation.x)
  const steerWheels = [];  // front outer pivots that steer (rotation.y)

  // Fat tire cross-section, revolved around Y (wheel laid on its side later)
  const tireProfile = [
    [0.34,-0.20],[0.40,-0.22],[0.58,-0.20],[0.70,-0.13],[0.73,-0.06],
    [0.73,0.06],[0.70,0.13],[0.58,0.20],[0.40,0.22],[0.34,0.20],
  ].map((p) => new THREE.Vector2(p[0], p[1]));
  const tireGeo = new THREE.LatheGeometry(tireProfile, 26);
  const lugGeo = new RoundedBoxGeometry(0.18, 0.34, 0.14, 3, 0.025);

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
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.025, 6, 24), beadlockMat);
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.21; wm.add(ring);
    for (let i = 0; i < 12; i++) {       // beadlock bolts
      const a = (i / 12) * Math.PI * 2;
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.05, 6), beadlockMat);
      bolt.position.set(Math.cos(a) * 0.37, 0.22, Math.sin(a) * 0.37);
      wm.add(bolt);
    }
    wm.add(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.46, 10), rimMat)); // hub
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
    x: 0, z: -8, y: 0,   // spawn just south of centre
    yaw: 0,               // faces +Z
    speed: 0,
    pitch: 0, roll: 0,    // terrain-slope tilt (radians, lerped)
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
  const isTyping = (e) => e.target.matches('input, textarea, select');
  window.addEventListener('keydown', (e) => {
    if (isTyping(e)) return;
    const a = keyMap[e.code];
    if (a) { input[a] = true; e.preventDefault(); }
  });
  window.addEventListener('keyup', (e) => {
    if (isTyping(e)) return;
    const a = keyMap[e.code];
    if (a) { input[a] = false; }
  });
  document.addEventListener('focusin', (e) => {
    if (e.target.matches('input, textarea, select'))
      input.forward = input.back = input.left = input.right = false;
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
      if (newId) _playKioskWhomp();
      if (newId && !visitedKiosks.has(newId)) {
        visitedKiosks.add(newId);
        awardCoin(newId);
      }
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
      sandMat.color.setHex(0x192035);
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
      sandMat.color.setHex(0xd4a862);
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
  applyTheme(localStorage.getItem('theme') !== 'light');

  // Height sampler — exact mirror of the terrain geometry displacement formula
  function getTerrainHeight(x, z) {
    const dist = Math.sqrt(x * x + z * z);
    const fade = THREE.MathUtils.clamp((dist - 8) / 22, 0, 1);
    return (
      Math.sin(x * 0.20 + 0.6) * Math.cos(z * 0.24 + 1.1) * 0.85 +
      Math.sin(x * 0.42 - 0.9) * Math.sin(z * 0.31 + 0.4) * 0.55 +
      Math.cos(x * 0.11 + z * 0.14) * 1.05 +
      Math.sin(x * 0.63 + z * 0.47) * 0.30 +
      Math.cos(x * 0.09 - z * 0.19) * 0.45
    ) * fade;
  }

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
    _tickEngine(state.speed);

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

    // --- Terrain-following: lift car to ground height + tilt to slope ---
    const terrH = getTerrainHeight(state.x, state.z);
    state.y += (terrH - state.y) * 0.18;
    const TS = 0.9;
    const sinYaw = Math.sin(state.yaw), cosYaw = Math.cos(state.yaw);
    const tPitch = Math.atan2(
      getTerrainHeight(state.x + sinYaw * TS, state.z + cosYaw * TS) -
      getTerrainHeight(state.x - sinYaw * TS, state.z - cosYaw * TS),
      2 * TS
    );
    const tRoll = Math.atan2(
      getTerrainHeight(state.x + cosYaw * TS, state.z - sinYaw * TS) -
      getTerrainHeight(state.x - cosYaw * TS, state.z + sinYaw * TS),
      2 * TS
    );
    state.pitch += (tPitch - state.pitch) * 0.12;
    state.roll  += (tRoll  - state.roll)  * 0.12;

    // --- Apply to car mesh ---
    car.position.set(state.x, state.y, state.z);
    car.rotation.set(-state.pitch, state.yaw, state.roll, 'YXZ');
    const spin = state.speed * dt * 2;
    wheels.forEach((w) => (w.rotation.x += spin));
    // Front wheels visually steer toward the input
    const targetSteer = ((input.left ? 1 : 0) - (input.right ? 1 : 0)) * 0.5;
    steerWheels.forEach((p) => (p.rotation.y += (targetSteer - p.rotation.y) * 0.2));

    // --- Camera ---
    if (inspectMode) {
      orbitControls.target.set(state.x, state.y + 1.2, state.z);
      orbitControls.update();
    } else {
      camGoal.set(
        state.x - fx * 9.5,
        state.y + 6.8,
        state.z - fz * 9.5
      );
      camera.position.lerp(camGoal, 1 - Math.pow(0.0008, dt));
      camTarget.set(state.x + fx * 3.5, state.y + 1.4, state.z + fz * 3.5);
      camera.lookAt(camTarget);
    }

    // --- Animate kiosks ---
    const t = clock.getElapsedTime();
    if (!reduceMotion) {
      kioskMeshes.forEach((k, i) => {
        const visited = visitedKiosks.has(k.id);
        k.crystal.rotation.y = t * (visited ? 1.6 : 0.8) + i;
        k.crystal.position.y = 7.4 + Math.sin(t * 1.5 + i) * 0.25;
        if (visited) {
          k.pillar.material.emissiveIntensity = 3.2 + Math.sin(t * 2.1 + i) * 0.5;
          k.crystal.material.emissiveIntensity = 2.4 + Math.sin(t * 1.5 + i) * 0.4;
          k.beam.intensity = 50 + Math.sin(t * 1.8 + i) * 8;
        }
        k.pring.rotation.z = t * 0.5;
        // Drift sparkles upward, wrap at top
        const pos = k.sparkles.geometry.attributes.position;
        for (let j = 0; j < k.sparkPhase.length; j++) {
          pos.setY(j, (k.sparkPhase[j] + t * k.sparkSpeed[j]) % 6.2);
        }
        pos.needsUpdate = true;
        k.sparkles.material.opacity = visited
          ? 0.85 + Math.sin(t * 2.1 + i) * 0.15
          : 0.6 + Math.sin(t * 2.1 + i) * 0.25;
      });
      plaza.rotation.z = t * 0.2;
      // Fire logo flicker on rear plate
      if (fireLogoMat) {
        fireLogoMat.emissiveIntensity = 0.80 + Math.sin(t * 4.3) * 0.18 + Math.sin(t * 7.1) * 0.08;
      }
      // Accent strip pulse
      if (accentMat) {
        accentMat.emissiveIntensity = 1.5 + Math.sin(t * 1.8) * 0.35 + Math.sin(t * 4.7) * 0.12;
      }
    }

    // --- Animate chickens ---
    chickens.forEach((ch, ci) => {
      const dx = state.x - ch.x;
      const dz = state.z - ch.z;
      const distToCar = Math.sqrt(dx * dx + dz * dz);
      const fleeing = distToCar < FLEE_RADIUS;

      if (fleeing) {
        const awayYaw = Math.atan2(-dx, -dz);
        const diff = ((awayYaw - ch.yaw) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
        ch.yaw += diff * 0.22;
        ch.speed = 5.5;
      } else {
        ch.wanderTimer -= dt;
        if (ch.wanderTimer <= 0) {
          ch.wanderTimer = 1.5 + Math.random() * 3.5;
          ch.speed = Math.random() < 0.35 ? 0 : 1.2;
          if (ch.speed > 0) ch.targetYaw = Math.random() * Math.PI * 2;
        }
        if (ch.speed > 0) {
          const diff = ((ch.targetYaw - ch.yaw) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
          ch.yaw += diff * 0.04;
        }
      }

      if (ch.speed > 0) {
        ch.x += Math.sin(ch.yaw) * ch.speed * dt;
        ch.z += Math.cos(ch.yaw) * ch.speed * dt;
      }

      // Keep chickens in the field
      const cDist = Math.sqrt(ch.x * ch.x + ch.z * ch.z);
      if (cDist > 50) {
        ch.yaw = Math.atan2(-ch.x, -ch.z);
        ch.targetYaw = ch.yaw;
        ch.x *= 50 / cDist;
        ch.z *= 50 / cDist;
      }

      ch.group.position.set(ch.x, getTerrainHeight(ch.x, ch.z), ch.z);
      ch.group.rotation.y = ch.yaw;

      // Leg striding
      const rate = fleeing ? 10 : ch.speed > 0 ? 5 : 0;
      const legSwing = rate > 0 ? Math.sin(t * rate + ci * 1.7) * 0.5 : 0;
      ch.leftLegPivot.rotation.x  =  legSwing;
      ch.rightLegPivot.rotation.x = -legSwing;

      // Head bob when walking, peck when idle
      const headBob = rate > 0
        ? Math.sin(t * rate * 0.5 + ci) * 0.06
        : Math.sin(t * 0.9 + ci * 2.3) > 0.85 ? -0.10 : 0;
      ch.headGroup.position.y = ch.headBaseY + headBob;

      // Wing flap when fleeing
      const wingAngle = fleeing ? Math.sin(t * 18 + ci) * 0.65 + 0.4 : 0.12;
      ch.leftWingPivot.rotation.z  =  wingAngle;
      ch.rightWingPivot.rotation.z = -wingAngle;
    });

    updateProximity();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(() => {
    document.body.classList.add('world-ready');
    tick();
  });
})();
