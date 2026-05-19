/**
  =========================================
  PREMIUM DEVELOPER PORTFOLIO - SCRIPTING
  Created with Vanilla ES6 Javascript
  =========================================
*/

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileMenu();
  initHeaderScroll();
  initHeroCanvas();
  initScrollReveal();
  initProjectFilter();
  initContactForm();
});

/* ==========================================
   1. THEME MANAGER (DARK / LIGHT MODE)
   ========================================== */
function initTheme() {
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (!themeToggleBtn) return;

  // Check saved theme, default to dark
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Smooth transition trigger
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Dispatch global themechange event so the canvas can update colors
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: newTheme } }));
  });
}

/* ==========================================
   2. MOBILE NAVIGATION DRAWER
   ========================================== */
function initMobileMenu() {
  const menuBtn = document.getElementById('menu-btn');
  const navLinks = document.getElementById('nav-links');
  const links = document.querySelectorAll('.nav-links a');

  if (!menuBtn || !navLinks) return;

  const toggleMenu = () => {
    menuBtn.classList.toggle('active');
    navLinks.classList.toggle('active');
    document.body.classList.toggle('overflow-hidden');
  };

  menuBtn.addEventListener('click', toggleMenu);

  links.forEach(link => {
    link.addEventListener('click', () => {
      if (navLinks.classList.contains('active')) {
        toggleMenu();
      }
    });
  });
}

/* ==========================================
   3. HEADER SCROLL & BACK TO TOP
   ========================================== */
function initHeaderScroll() {
  const navbar = document.getElementById('navbar');
  const backToTopBtn = document.getElementById('back-to-top');
  const sections = document.querySelectorAll('section[id]');
  const navAnchorLinks = document.querySelectorAll('.nav-links a[href^="#"]');

  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;

    // Header active state on scroll
    if (scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Back to top visibility
    if (scrollY > 500) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }

    // Active link highlighting on scroll
    sections.forEach(section => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 120; // offset navbar height
      const sectionId = section.getAttribute('id');
      const activeLink = document.querySelector(`.nav-links a[href*=${sectionId}]`);

      if (activeLink && scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        navAnchorLinks.forEach(link => link.classList.remove('active'));
        activeLink.classList.add('active');
      }
    });
  });

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

/* ==========================================
   4. INTERACTIVE HERO CANVAS PARTICLES
   ========================================== */
function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let animationFrameId;
  let particles = [];
  let mouse = { x: null, y: null, radius: 150 };

  // Set particle colors based on active theme
  let theme = document.documentElement.getAttribute('data-theme') || 'dark';
  let particleColor = theme === 'dark' ? 'rgba(0, 242, 254, 0.4)' : 'rgba(59, 130, 246, 0.3)';
  let lineColor = theme === 'dark' ? 'rgba(0, 242, 254, 0.08)' : 'rgba(59, 130, 246, 0.06)';

  window.addEventListener('themechange', (e) => {
    theme = e.detail.theme;
    particleColor = theme === 'dark' ? 'rgba(0, 242, 254, 0.4)' : 'rgba(59, 130, 246, 0.3)';
    lineColor = theme === 'dark' ? 'rgba(0, 242, 254, 0.08)' : 'rgba(59, 130, 246, 0.06)';
  });

  // Resize handler
  function resizeCanvas() {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
    initParticles();
  }

  // Particle Blueprint
  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.size = Math.random() * 2 + 1;
      this.baseX = this.x;
      this.baseY = this.y;
      this.density = (Math.random() * 30) + 15;
      this.vx = (Math.random() - 0.5) * 0.8;
      this.vy = (Math.random() - 0.5) * 0.8;
    }

    draw() {
      ctx.fillStyle = particleColor;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    }

    update() {
      // Float naturally
      this.x += this.vx;
      this.y += this.vy;

      // Bounce on boundaries
      if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
      if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;

      // Interactive mouse attraction/repulsion
      if (mouse.x !== null && mouse.y !== null) {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouse.radius) {
          let force = (mouse.radius - distance) / mouse.radius;
          let directionX = dx / distance;
          let directionY = dy / distance;
          
          // Gently attract to mouse
          this.x += directionX * force * 1.5;
          this.y += directionY * force * 1.5;
        }
      }
    }
  }

  function initParticles() {
    particles = [];
    // Adjust density based on screen dimensions
    const numberOfParticles = Math.min(Math.floor((canvas.width * canvas.height) / 14000), 80);
    for (let i = 0; i < numberOfParticles; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      particles.push(new Particle(x, y));
    }
  }

  function connectParticles() {
    for (let a = 0; a < particles.length; a++) {
      for (let b = a; b < particles.length; b++) {
        let dx = particles[a].x - particles[b].x;
        let dy = particles[a].y - particles[b].y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 120) {
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particles[a].x, particles[a].y);
          ctx.lineTo(particles[b].x, particles[b].y);
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(particle => {
      particle.update();
      particle.draw();
    });
    
    connectParticles();
    animationFrameId = requestAnimationFrame(animate);
  }

  // Mouse move tracking
  window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  window.addEventListener('resize', resizeCanvas);

  // Kickstart
  resizeCanvas();
  animate();
}

/* ==========================================
   5. INTERSECTION OBSERVER (SCROLL REVEAL & SKILLS PROGRESS)
   ========================================== */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        
        // If skill category is shown, animate standard skillbars inside it
        if (entry.target.classList.contains('skills-category')) {
          const bars = entry.target.querySelectorAll('.skill-bar-fill');
          bars.forEach(bar => {
            const width = bar.getAttribute('data-width');
            bar.style.width = width + '%';
          });
        }
        
        observer.unobserve(entry.target); // Trigger only once
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  reveals.forEach(el => revealObserver.observe(el));
}

/* ==========================================
   6. PORTFOLIO FILTER ENGINE
   ========================================== */
function initProjectFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card-wrapper');

  if (filterBtns.length === 0 || projectCards.length === 0) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle button states
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      projectCards.forEach(card => {
        const category = card.getAttribute('data-category');
        
        // Add subtle animation exit/entry
        if (filterValue === 'all' || category === filterValue) {
          card.style.display = 'block';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
          }, 50);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.9)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 300); // match transition
        }
      });
    });
  });
}

/* ==========================================
   7. CONTACT FORM LOGIC & MICRO-FEEDBACK
   ========================================== */
function initContactForm() {
  const form = document.getElementById('portfolio-contact-form');
  const statusEl = document.getElementById('form-status');

  if (!form || !statusEl) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('form-name').value.trim();
    const email = document.getElementById('form-email').value.trim();
    const subject = document.getElementById('form-subject').value.trim();
    const message = document.getElementById('form-message').value.trim();
    const submitBtn = form.querySelector('button[type="submit"]');

    // Super basic local check
    if (!name || !email || !subject || !message) {
      showStatus('Please fill in all fields to complete the message.', 'error');
      return;
    }

    if (!validateEmail(email)) {
      showStatus('Please provide a valid email address.', 'error');
      return;
    }

    // Simulate sending progress animation
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="animate-spin" style="width:16px;height:16px;margin-right:8px;vertical-align:middle;display:inline-block;" viewBox="0 0 24 24" fill="none">
        <circle style="opacity:0.25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path style="opacity:0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg> Sending message...
    `;

    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      showStatus('Thank you! Your message was sent successfully. Afsal will get back to you shortly.', 'success');
      form.reset();
    }, 1500);
  });

  function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  function showStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = 'form-status'; // reset
    statusEl.classList.add(type);
    
    // Smooth scroll status into view
    statusEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Clear alert after 7 seconds if successful
    if (type === 'success') {
      setTimeout(() => {
        statusEl.classList.remove('success');
        statusEl.style.display = 'none';
      }, 7000);
    }
  }
}
