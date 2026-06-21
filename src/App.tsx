import { useEffect, useRef, useState } from 'react'
import { CanvasWrapper } from './components/CanvasWrapper'

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
  )
  const [listMode, setListMode] = useState(false)
  const [helpVisible, setHelpVisible] = useState(true)
  const typingRef = useRef<HTMLSpanElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)

  // Sync theme to <html data-theme> and fire event for the 3D scene
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }))
  }, [theme])

  // Sync list-mode class on body
  useEffect(() => {
    document.body.classList.toggle('list-mode', listMode)
  }, [listMode])

  // Auto list-mode on touch devices + close help on first drive key
  useEffect(() => {
    if (navigator.maxTouchPoints > 0) {
      setHelpVisible(false)
      setListMode(true)
    }
    const onDriveKey = (e: KeyboardEvent) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD'].includes(e.code)) {
        setHelpVisible(false)
      }
    }
    window.addEventListener('keydown', onDriveKey, { once: true })
    return () => window.removeEventListener('keydown', onDriveKey)
  }, [])

  // Typewriter
  useEffect(() => {
    const el = typingRef.current
    if (!el) return
    const node = el  // stable non-null ref for the closure
    const roles = ['Full-Stack Developer', 'GenAI Architect', 'Systems Engineer']
    let r = 0, c = 0, deleting = false, speed = 100
    let timer: ReturnType<typeof setTimeout>
    function type() {
      const role = roles[r]
      node.textContent = deleting ? role.substring(0, c - 1) : role.substring(0, c + 1)
      c += deleting ? -1 : 1
      speed = deleting ? 50 : 100
      if (!deleting && c === role.length) { speed = 2000; deleting = true }
      else if (deleting && c === 0) { deleting = false; r = (r + 1) % roles.length; speed = 500 }
      timer = setTimeout(type, speed)
    }
    type()
    return () => clearTimeout(timer)
  }, [])

  const toggleTheme = () =>
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark'
      localStorage.setItem('theme', next)
      return next
    })

  const goTo = (id: string | null) => window.CarControls?.goTo(id)
  const press = (dir: string, on: boolean) => window.CarControls?.press(dir, on)

  const closeHelp = () => setHelpVisible(false)
  const openListFromHelp = () => { closeHelp(); setListMode(true) }

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const statusEl = statusRef.current
    if (!statusEl) return
    const name    = (form.querySelector('#form-name')    as HTMLInputElement).value.trim()
    const email   = (form.querySelector('#form-email')   as HTMLInputElement).value.trim()
    const subject = (form.querySelector('#form-subject') as HTMLInputElement).value.trim()
    const message = (form.querySelector('#form-message') as HTMLTextAreaElement).value.trim()
    const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement
    const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
    const showStatus = (msg: string, type: string) => {
      statusEl.textContent = msg
      statusEl.className = 'form-status ' + type
      if (type === 'success') setTimeout(() => { statusEl.className = 'form-status'; statusEl.style.display = 'none' }, 7000)
    }
    if (!name || !email || !subject || !message) return showStatus('Please fill in all fields.', 'error')
    if (!validateEmail(email)) return showStatus('Please provide a valid email address.', 'error')
    const orig = submitBtn.innerHTML
    submitBtn.disabled = true
    submitBtn.textContent = 'Sending message...'
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name, email, subject, message, access_key: 'e1667dec-80cf-4c3a-ab85-bf5ec7e8d755' }),
      })
      const data = await res.json()
      submitBtn.disabled = false
      submitBtn.innerHTML = orig
      if (res.status === 200) { showStatus('Thank you! Your message was sent successfully.', 'success'); form.reset() }
      else showStatus(data.message || 'An error occurred. Please try again.', 'error')
    } catch {
      submitBtn.disabled = false
      submitBtn.innerHTML = orig
      showStatus('Network error. Please email directly.', 'error')
    }
  }

  const touchBtn = (dir: string) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); press(dir, true) },
    onPointerUp:   (e: React.PointerEvent) => { e.preventDefault(); press(dir, false) },
    onPointerLeave:(e: React.PointerEvent) => { e.preventDefault(); press(dir, false) },
    onPointerCancel:(e: React.PointerEvent) => { e.preventDefault(); press(dir, false) },
  })

  return (
    <>
      {/* 3D world — fixed background layer */}
      <CanvasWrapper />

      {/* SEO: Primary heading for search engines (visually hidden) */}
      <h1 className="sr-only">Afsal A Azeez — Full-Stack &amp; AI Engineer | IIT Bombay M.Tech Portfolio</h1>

      {/* UI overlay — pointer-events: none so clicks fall through to the canvas */}
      <div style={{ position: 'relative', zIndex: 1, pointerEvents: 'none' }}>

        {/* NAV */}
        <nav className="navbar scrolled" id="navbar" style={{ pointerEvents: 'auto' }}>
          <div className="container nav-container">
            <a href="#" className="logo" onClick={e => { e.preventDefault(); goTo(null) }}>
              <img src="/assets/logo.svg" alt="AA Monogram" className="logo-icon" width={36} height={36} />
              <span className="logo-text">AFSAL<span className="logo-text-accent"> A AZEEZ</span></span>
              <span className="logo-dot"></span>
            </a>
            <ul className="nav-links" id="nav-links">
              <li><a href="#" data-kiosk="" className="active" onClick={e => { e.preventDefault(); goTo(null) }}>Home</a></li>
              <li><a href="#" data-kiosk="about"   onClick={e => { e.preventDefault(); goTo('about') }}>About</a></li>
              <li><a href="#" data-kiosk="skills"  onClick={e => { e.preventDefault(); goTo('skills') }}>Skills</a></li>
              <li><a href="#" data-kiosk="p-rag"   onClick={e => { e.preventDefault(); goTo('p-rag') }}>Projects</a></li>
              <li><a href="#" data-kiosk="contact" onClick={e => { e.preventDefault(); goTo('contact') }}>Contact</a></li>
            </ul>
            <div className="nav-actions">
              <a href="/assets/Afsal_A_Azeez_CV.pdf" download="Afsal_A_Azeez_CV.pdf" className="cv-download-btn">↓ Download CV</a>
              <button className="list-toggle-btn" id="list-toggle" title="View all content as a list" onClick={() => setListMode(true)}>☰ List view</button>
              <button className="theme-toggle" id="theme-toggle" aria-label="Toggle visual theme" title="Switch Theme" onClick={toggleTheme}>
                <svg className="sun-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                <svg className="moon-icon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              </button>
            </div>
          </div>
        </nav>

        <button className="btn btn-secondary" id="list-close" style={{ pointerEvents: 'auto' }} onClick={() => setListMode(false)}>✕ Close list</button>

        {/* INFO CARDS */}
        <div id="cards" style={{ pointerEvents: 'auto' }}>
          <p className="webgl-banner">Your browser couldn't start the 3D world, so here is the full portfolio as a list.</p>

          {/* ABOUT */}
          <article className="info-card glass" id="card-about">
            <span className="card-kicker">About My Journey</span>
            <div className="profile-photo-wrap">
              <div className="profile-photo-ring">
                <img src="/assets/Profile.jpg" alt="Afsal A Azeez" className="profile-photo" />
              </div>
            </div>
            <h2>Afsal A Azeez</h2>
            <p>Full-Stack &amp; AI Engineer specializing in scalable distributed microservices and production-grade AI/LLM applications. Alumnus of IIT Bombay (M.Tech), AIR-241 in GATE CS, with 5+ years building full-stack and AI systems at a venture-backed startup.</p>
            <a href="/assets/Afsal_A_Azeez_CV.pdf" download="Afsal_A_Azeez_CV.pdf" className="btn btn-primary" style={{ marginTop:'1rem', marginBottom:'0.25rem', width:'100%', justifyContent:'center' }}>↓ Download CV</a>
            <div className="about-stats">
              <div className="stat-card glass"><span className="stat-num">5+</span><span className="stat-label">Years Exp</span></div>
              <div className="stat-card glass"><span className="stat-num">AIR-241</span><span className="stat-label">GATE CS</span></div>
              <div className="stat-card glass"><span className="stat-num">IIT</span><span className="stat-label">Bombay M.Tech</span></div>
            </div>
            <div className="timeline" style={{ marginTop:'1.5rem' }}>
              <div className="timeline-item">
                <div className="timeline-dot"></div>
                <span className="timeline-time">2020 - 2026</span>
                <h4 className="timeline-header">Member of Technical Staff <span>- Zettabytes (Roost.ai)</span></h4>
                <p className="timeline-desc">Full-stack &amp; AI engineer: Kubernetes visualisation UI, Electron desktop app, a Java AST parsing service (93% compile rate), MS Teams bot, Git platform integrations, and a multi-LLM provider UI dashboard.</p>
              </div>
              <div className="timeline-item">
                <div className="timeline-dot"></div>
                <span className="timeline-time">2018 - 2020</span>
                <h4 className="timeline-header">M.Tech CSE <span>- IIT Bombay</span></h4>
                <p className="timeline-desc">Graduate research; TA for CS699 (Software Lab) and CS101 (Computer Programming).</p>
              </div>
            </div>
          </article>

          {/* SKILLS */}
          <article className="info-card glass" id="card-skills">
            <span className="card-kicker">Professional Stack</span>
            <h2>Skills</h2>
            <div className="skills-grid">
              <div className="skills-category">
                <h3>Full-Stack &amp; UI</h3>
                <div className="skills-list">
                  {['React','Next.js','TypeScript','Redux / Zustand','Node.js','Express / Fastify','Tailwind CSS','HTML5 / CSS3'].map(s => <span key={s} className="skill-tag">{s}</span>)}
                </div>
              </div>
              <div className="skills-category">
                <h3>Backend &amp; Data</h3>
                <div className="skills-list">
                  {['Python','FastAPI','Go','PostgreSQL','MySQL','MongoDB','Redis','Elasticsearch'].map(s => <span key={s} className="skill-tag">{s}</span>)}
                </div>
              </div>
              <div className="skills-category">
                <h3>Cloud &amp; AI Agents</h3>
                <div className="skills-list">
                  {['AWS','Kubernetes (EKS)','Terraform','LangChain','LangGraph','LlamaIndex','pgvector','RAG Pipelines'].map(s => <span key={s} className="skill-tag">{s}</span>)}
                </div>
              </div>
            </div>
          </article>

          {/* PROJECT: GovShield */}
          <article className="info-card glass" id="card-p-rag">
            <span className="card-kicker">Project · Secure RAG</span>
            <h2>GovShield — Offline RAG Portal</h2>
            <div className="project-tags"><span className="project-tag">LlamaIndex</span><span className="project-tag">pgvector</span><span className="project-tag">FastAPI</span><span className="project-tag">RBAC</span></div>
            <p>100% offline RAG system with RBAC pre-filtering at the vector store layer — access control enforced before retrieval, not after. LlamaIndex + Ollama + PostgreSQL pgvector + FastAPI REST API. Dockerized two-service deployment.</p>
            <a href="https://github.com/zencodelab/raglearn" target="_blank" rel="noopener noreferrer" className="btn btn-primary">View on GitHub →</a>
          </article>

          {/* PROJECT: TaskEngine */}
          <article className="info-card glass" id="card-p-agent">
            <span className="card-kicker">Project · Autonomous Agent</span>
            <h2>TaskEngine — Autonomous Agent</h2>
            <div className="project-tags"><span className="project-tag">LangChain</span><span className="project-tag">LangGraph</span><span className="project-tag">Pinecone</span><span className="project-tag">FastAPI</span></div>
            <p>Plan→Execute→Reflect loop: a LangChain planner decomposes queries into atomic steps, a LangGraph ReAct executor runs each with tools (web search, code execution, file I/O), and a reflector scores quality and re-plans on failure. Pinecone stores past runs as few-shot context.</p>
            <a href="https://github.com/zencodelab/aiautonomous" target="_blank" rel="noopener noreferrer" className="btn btn-primary">View on GitHub →</a>
          </article>

          {/* PROJECT: VisionLog */}
          <article className="info-card glass" id="card-p-vision">
            <span className="card-kicker">Project · Vision AI</span>
            <h2>VisionLog-MLX</h2>
            <div className="project-tags"><span className="project-tag">Python</span><span className="project-tag">OpenCV</span><span className="project-tag">Ollama</span><span className="project-tag">Apple Silicon</span></div>
            <p>On-device vision logger using OpenCV for motion detection, dlib for face recognition, and Ollama Gemma for real-time scene description. Fully offline on Apple Silicon via Metal acceleration.</p>
            <a href="https://github.com/zencodelab/MehvishLog" target="_blank" rel="noopener noreferrer" className="btn btn-primary">View on GitHub →</a>
          </article>

          {/* PROJECT: GIS */}
          <article className="info-card glass" id="card-p-gis">
            <span className="card-kicker">Project · GIS Database</span>
            <h2>GIS Water Network DB</h2>
            <div className="project-tags"><span className="project-tag">Python</span><span className="project-tag">SQL</span><span className="project-tag">QGIS</span><span className="project-tag">EPANET</span></div>
            <p>A GIS-integrated water network database application in QGIS using Python and SQL. Automates node elevation extraction and workflows for EPANET and JalTantra.</p>
            <a href="https://github.com/afsalaazeez" target="_blank" rel="noopener noreferrer" className="btn btn-primary">View on GitHub →</a>
          </article>

          {/* PROJECT: Chat */}
          <article className="info-card glass" id="card-p-chat">
            <span className="card-kicker">Project · Real-Time Web</span>
            <h2>Real-Time Messaging Platform</h2>
            <div className="project-tags"><span className="project-tag">Flask</span><span className="project-tag">Socket.IO</span><span className="project-tag">Elasticsearch</span></div>
            <p>A Flask-based real-time coordination and workspace system using Socket.IO for bi-directional messaging and Elasticsearch for fast query indexing.</p>
            <a href="https://github.com/afsalaazeez" target="_blank" rel="noopener noreferrer" className="btn btn-primary">View on GitHub →</a>
          </article>

          {/* PROJECT: Flight */}
          <article className="info-card glass" id="card-p-flight">
            <span className="card-kicker">Project · Predictive ML</span>
            <h2>Flight Delay Predictor</h2>
            <div className="project-tags"><span className="project-tag">Python</span><span className="project-tag">XGBoost</span><span className="project-tag">SMOTE</span></div>
            <p>A binary classification engine using Python and XGBoost to predict delays exceeding 15 minutes, solving heavy class imbalance with SMOTE.</p>
            <a href="https://github.com/afsalaazeez" target="_blank" rel="noopener noreferrer" className="btn btn-primary">View on GitHub →</a>
          </article>

          {/* CONTACT */}
          <article className="info-card glass" id="card-contact">
            <span className="card-kicker">Get In Touch</span>
            <h2>Contact</h2>
            <p>Open to Full-Stack or AI/LLM engineering roles. Based in Abu Dhabi, UAE (willing to relocate).</p>
            <div className="contact-card glass">
              <div className="contact-icon"><svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg></div>
              <div className="contact-details"><span>Email</span><strong><a href="mailto:afsalaazeez@gmail.com">afsalaazeez@gmail.com</a></strong></div>
            </div>
            <div className="contact-card glass">
              <div className="contact-icon"><svg fill="currentColor" viewBox="0 0 24 24" style={{ width:'20px', height:'20px' }}><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg></div>
              <div className="contact-details"><span>LinkedIn</span><strong><a href="https://linkedin.com/in/afsalaazeez" target="_blank" rel="noopener noreferrer">linkedin.com/in/afsalaazeez</a></strong></div>
            </div>
            <form className="contact-form" id="portfolio-contact-form" noValidate style={{ padding:0, marginTop:'1rem' }} onSubmit={handleContactSubmit}>
              <div className="form-grid">
                <div className="form-group form-group-full"><label htmlFor="form-name">Full Name</label><div className="form-input-wrapper"><input type="text" id="form-name" name="name" className="form-input" placeholder="Your name" required /></div></div>
                <div className="form-group form-group-full"><label htmlFor="form-email">Email</label><div className="form-input-wrapper"><input type="email" id="form-email" name="email" className="form-input" placeholder="email@domain.com" required /></div></div>
                <div className="form-group form-group-full"><label htmlFor="form-subject">Subject</label><div className="form-input-wrapper"><input type="text" id="form-subject" name="subject" className="form-input" placeholder="Collaboration proposal" required /></div></div>
                <div className="form-group form-group-full"><label htmlFor="form-message">Message</label><div className="form-input-wrapper"><textarea id="form-message" name="message" className="form-input" placeholder="Hi Afsal..." required /></div></div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width:'100%', marginTop:'1rem' }}>Transmit Message</button>
              <div id="form-status" className="form-status" ref={statusRef}></div>
            </form>
          </article>
        </div>

        {/* HELP / START OVERLAY */}
        {helpVisible && (
          <div id="help-overlay" style={{ pointerEvents: 'auto' }}>
            <div className="help-card">
              <span className="hero-tag"><span style={{ display:'inline-block', width:'8px', height:'8px', borderRadius:'50%', background:'#00f2fe', boxShadow:'0 0 8px #00f2fe' }}></span>Available Immediately (UAE)</span>
              <h1>Drive through my <span className="name">portfolio</span></h1>
              <div className="hero-subtitle">I'm a <span className="typing-text gradient-text" ref={typingRef}></span></div>
              <p>Steer the car around the plaza and roll up to any glowing kiosk to read about my experience, skills and projects.</p>
              <div className="help-keys"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><span style={{ color:'var(--text-muted)', alignSelf:'center' }}>or</span><kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd></div>
              <button className="btn btn-primary" id="help-start" onClick={closeHelp}>Start driving</button>
              <button className="btn btn-secondary" id="help-list" style={{ marginTop:'0.6rem' }} onClick={openListFromHelp}>View as list →</button>
            </div>
          </div>
        )}

        {/* PERSISTENT HINT */}
        <div className="controls-hint">WASD / Arrow keys to drive · approach a kiosk</div>

        {/* TOUCH CONTROLS */}
        <div className="touch-controls" aria-label="Driving controls" style={{ pointerEvents: 'auto' }}>
          <button id="btn-up"    aria-label="Accelerate"   {...touchBtn('forward')}>▲</button>
          <button id="btn-left"  aria-label="Steer left"   {...touchBtn('left')}>◀</button>
          <button id="btn-down"  aria-label="Reverse"      {...touchBtn('back')}>▼</button>
          <button id="btn-right" aria-label="Steer right"  {...touchBtn('right')}>▶</button>
        </div>

      </div>
    </>
  )
}
