/*
  =========================================
  CAR WORLD - UI CONTROLLER (Variant: 3d-car-world)
  Wires the DOM chrome to the 3D world (scene-car.js):
  theme toggle, nav "drive-to" teleports, on-screen / touch driving
  buttons, the "list view" accessibility fallback, and the contact form.
  =========================================
*/

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavTeleport();
  initTouchControls();
  initListView();
  initContactForm();
  initTypewriter();
  initHelpDismiss();
});

/* ---------- THEME ---------- */
function initTheme() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  btn.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: next } }));
  });
}

/* ---------- NAV "DRIVE TO" TELEPORT ---------- */
function initNavTeleport() {
  document.querySelectorAll('.nav-links a[data-kiosk], .logo').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const id = el.dataset.kiosk || null; // logo / Home → spawn
      if (window.CarControls) window.CarControls.goTo(id);
      // close mobile menu if open
      document.getElementById('nav-links')?.classList.remove('active');
      document.getElementById('menu-btn')?.classList.remove('active');
    });
  });

  const menuBtn = document.getElementById('menu-btn');
  const navLinks = document.getElementById('nav-links');
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
      menuBtn.classList.toggle('active');
      navLinks.classList.toggle('active');
    });
  }
}

/* ---------- ON-SCREEN / TOUCH DRIVING ---------- */
function initTouchControls() {
  const map = {
    'btn-up': 'forward',
    'btn-down': 'back',
    'btn-left': 'left',
    'btn-right': 'right',
  };
  Object.entries(map).forEach(([btnId, dir]) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const on = (e) => { e.preventDefault(); window.CarControls?.press(dir, true); };
    const off = (e) => { e.preventDefault(); window.CarControls?.press(dir, false); };
    btn.addEventListener('pointerdown', on);
    btn.addEventListener('pointerup', off);
    btn.addEventListener('pointerleave', off);
    btn.addEventListener('pointercancel', off);
  });
}

/* ---------- LIST VIEW (accessibility / recruiter fallback) ---------- */
function initListView() {
  const openBtn = document.getElementById('list-toggle');
  const closeBtn = document.getElementById('list-close');
  const toggle = (on) => document.body.classList.toggle('list-mode', on);
  openBtn?.addEventListener('click', () => toggle(true));
  closeBtn?.addEventListener('click', () => toggle(false));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') toggle(false);
  });
}

/* ---------- HELP / INSTRUCTIONS DISMISS ---------- */
function initHelpDismiss() {
  const help = document.getElementById('help-overlay');
  const start = document.getElementById('help-start');
  const listBtn = document.getElementById('help-list');
  if (!help) return;
  const close = () => help.classList.add('hidden');
  start?.addEventListener('click', close);
  listBtn?.addEventListener('click', () => {
    close();
    document.body.classList.add('list-mode');
  });
  // Auto-dismiss once the user starts driving
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) close();
  }, { once: true });
  // Auto list-mode on touch/mobile — driving is awkward on phones
  if (navigator.maxTouchPoints > 0) {
    close();
    document.body.classList.add('list-mode');
  }
}

/* ---------- TYPEWRITER ---------- */
function initTypewriter() {
  const el = document.getElementById('typing-sub');
  if (!el) return;
  const roles = ['Full-Stack Developer', 'GenAI Architect', 'Systems Engineer'];
  let r = 0, c = 0, deleting = false, speed = 100;
  function type() {
    const role = roles[r];
    el.textContent = deleting ? role.substring(0, c - 1) : role.substring(0, c + 1);
    c += deleting ? -1 : 1;
    speed = deleting ? 50 : 100;
    if (!deleting && c === role.length) { speed = 2000; deleting = true; }
    else if (deleting && c === 0) { deleting = false; r = (r + 1) % roles.length; speed = 500; }
    setTimeout(type, speed);
  }
  type();
}

/* ---------- CONTACT FORM ---------- */
function initContactForm() {
  const form = document.getElementById('portfolio-contact-form');
  const statusEl = document.getElementById('form-status');
  if (!form || !statusEl) return;

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
  const showStatus = (msg, type) => {
    statusEl.textContent = msg;
    statusEl.className = 'form-status ' + type;
    if (type === 'success') setTimeout(() => { statusEl.className = 'form-status'; statusEl.style.display = 'none'; }, 7000);
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('form-name').value.trim();
    const email = document.getElementById('form-email').value.trim();
    const subject = document.getElementById('form-subject').value.trim();
    const message = document.getElementById('form-message').value.trim();
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!name || !email || !subject || !message) return showStatus('Please fill in all fields.', 'error');
    if (!validateEmail(email)) return showStatus('Please provide a valid email address.', 'error');

    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending message...';

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ name, email, subject, message, access_key: 'e1667dec-80cf-4c3a-ab85-bf5ec7e8d755' }),
    })
      .then(async (res) => {
        const data = await res.json();
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        if (res.status === 200) { showStatus('Thank you! Your message was sent successfully.', 'success'); form.reset(); }
        else showStatus(data.message || 'An error occurred. Please try again.', 'error');
      })
      .catch(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        showStatus('Network error. Please email directly.', 'error');
      });
  });
}
