import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { projects } from '../data/projects'
import { useTheme } from '../hooks/useTheme'
import { ThemeToggle } from '../components/ThemeToggle'

// Public by design (ships to the browser); overridable via env.
const WEB3FORMS_ACCESS_KEY =
  import.meta.env.VITE_WEB3FORMS_KEY || 'e1667dec-80cf-4c3a-ab85-bf5ec7e8d755'

const NAV_LINKS = [
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'contact', label: 'Contact' },
]

const SKILLS = [
  {
    heading: 'Full-Stack & UI',
    items: ['React', 'Next.js', 'TypeScript', 'Redux / Zustand', 'Node.js', 'Express / Fastify', 'Tailwind CSS', 'HTML5 / CSS3'],
  },
  {
    heading: 'Backend & Data',
    items: ['Python', 'FastAPI', 'Go', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch'],
  },
  {
    heading: 'Cloud & AI Agents',
    items: ['AWS', 'Kubernetes (EKS)', 'Terraform', 'LangChain', 'LangGraph', 'LlamaIndex', 'pgvector', 'RAG Pipelines'],
  },
]

const GITHUB_ICON = (
  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.835 2.807 1.305 3.492.998.108-.776.42-1.305.762-1.605-2.665-.305-5.467-1.332-5.467-5.93 0-1.31.467-2.38 1.235-3.22-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.047.138 3.006.404 2.29-1.552 3.296-1.23 3.296-1.23.654 1.652.243 2.873.12 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.806 5.62-5.48 5.92.43.37.814 1.102.814 2.222 0 1.604-.015 2.896-.015 3.29 0 .322.216.695.825.577C20.565 21.795 24 17.297 24 12c0-6.63-5.37-12-12-12z" />
)
const LINKEDIN_ICON = (
  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
)
const PROJECT_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 18l6-6-6-6" />
    <path d="M8 6l-6 6 6 6" />
    <path d="M14.5 4l-5 16" />
  </svg>
)
const EXTERNAL_LINK_ICON = (
  <path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3zM5 5h6v2H5v12h12v-6h2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
)

export default function Home() {
  const { toggleTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showTop, setShowTop] = useState(false)
  const typingRef = useRef<HTMLSpanElement>(null)

  // Contact form
  const [contact, setContact] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<{ type: '' | 'success' | 'error'; msg: string }>({ type: '', msg: '' })

  // Scroll-driven UI: navbar background + back-to-top visibility
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40)
      setShowTop(window.scrollY > 600)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Reveal-on-scroll for .reveal elements
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('active')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12 }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  // Typewriter roles
  useEffect(() => {
    const el = typingRef.current
    if (!el) return
    const node = el
    const roles = ['Backend & Platform Engineer', 'GenAI Architect', 'Full-Stack Engineer', 'Systems Engineer']
    let r = 0, c = 0, deleting = false
    let timer: ReturnType<typeof setTimeout>
    function type() {
      const role = roles[r]
      node.textContent = deleting ? role.substring(0, c - 1) : role.substring(0, c + 1)
      c += deleting ? -1 : 1
      let speed = deleting ? 50 : 100
      if (!deleting && c === role.length) { speed = 2000; deleting = true }
      else if (deleting && c === 0) { deleting = false; r = (r + 1) % roles.length; speed = 500 }
      timer = setTimeout(type, speed)
    }
    type()
    return () => clearTimeout(timer)
  }, [])

  const closeMenu = () => setMenuOpen(false)
  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const updateContact = (field: keyof typeof contact) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setContact((c) => ({ ...c, [field]: e.target.value }))

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const name = contact.name.trim()
    const email = contact.email.trim()
    const subject = contact.subject.trim()
    const message = contact.message.trim()
    const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
    if (!name || !email || !subject || !message) return setStatus({ type: 'error', msg: 'Please fill in all fields.' })
    if (!validEmail(email)) return setStatus({ type: 'error', msg: 'Please provide a valid email address.' })
    setSubmitting(true)
    setStatus({ type: '', msg: '' })
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name, email, subject, message, access_key: WEB3FORMS_ACCESS_KEY }),
      })
      const data = await res.json()
      if (res.status === 200) {
        setStatus({ type: 'success', msg: 'Thank you! Your message was sent successfully.' })
        setContact({ name: '', email: '', subject: '', message: '' })
        setTimeout(() => setStatus({ type: '', msg: '' }), 7000)
      } else {
        setStatus({ type: 'error', msg: data.message || 'An error occurred. Please try again.' })
      }
    } catch {
      setStatus({ type: 'error', msg: 'Network error. Please email directly.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* NAV */}
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="container nav-container">
          <a href="#top" className="logo" onClick={(e) => { e.preventDefault(); scrollTop() }}>
            <img src="/assets/logo.svg" alt="AA Monogram" className="logo-icon" width={36} height={36} />
            <span className="logo-text">AFSAL<span className="logo-text-accent"> A AZEEZ</span></span>
            <span className="logo-dot"></span>
          </a>

          <ul className={`nav-links${menuOpen ? ' active' : ''}`}>
            {NAV_LINKS.map((l) => (
              <li key={l.id}><a href={`#${l.id}`} onClick={closeMenu}>{l.label}</a></li>
            ))}
            <li><Link to="/rideit" onClick={closeMenu} style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Ride It 🚗</Link></li>
          </ul>

          <div className="nav-actions">
            <a href="/assets/Afsal_A_Azeez_CV.pdf" download="Afsal_A_Azeez_CV.pdf" className="cv-download-btn">↓ CV</a>
            <ThemeToggle onClick={toggleTheme} />
            <div
              className={`menu-btn${menuOpen ? ' active' : ''}`}
              role="button"
              aria-label="Toggle menu"
              tabIndex={0}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </nav>

      <main id="top">
        {/* HERO */}
        <header className="hero">
          <div className="container">
            <div className="hero-content">
              <span className="hero-tag">
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)', boxShadow: '0 0 8px var(--accent-primary)' }}></span>
                Available Immediately · UAE
              </span>
              <h1>
                Afsal A Azeez
                <span className="name">Full-Stack &amp; AI Engineer</span>
              </h1>
              <div className="hero-subtitle">
                I build as a <span className="typing-text gradient-text" ref={typingRef}></span>
              </div>
              <p className="hero-desc">
                IIT Bombay M.Tech with 5+ years shipping production full-stack and
                AI/LLM systems — developer platforms, RAG pipelines, autonomous
                agents, and scalable distributed services. AIR-241 in GATE CS.
              </p>
              <div className="hero-btns">
                <a href="#projects" className="btn btn-primary">View Projects</a>
                <a href="/assets/Afsal_A_Azeez_CV.pdf" download="Afsal_A_Azeez_CV.pdf" className="btn btn-secondary">↓ Download CV</a>
                <Link to="/rideit" className="btn btn-secondary">🚗 Take the interactive tour →</Link>
              </div>
              <div className="hero-socials">
                <span>Find me</span>
                <a className="social-icon" href="https://github.com/zencodelab" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><svg viewBox="0 0 24 24">{GITHUB_ICON}</svg></a>
                <a className="social-icon" href="https://linkedin.com/in/afsalaazeez" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><svg viewBox="0 0 24 24">{LINKEDIN_ICON}</svg></a>
              </div>
            </div>

            <div className="hero-graphic">
              <div className="portrait-container">
                <div className="portrait-glow"></div>
                <div className="portrait-mesh">
                  <img src="/assets/Profile.jpg" alt="Afsal A Azeez" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div className="floating-badge badge-1 glass">
                  <div className="badge-icon">🎓</div>
                  <div className="badge-text"><span>Education</span><strong>IIT Bombay</strong></div>
                </div>
                <div className="floating-badge badge-2 glass">
                  <div className="badge-icon">⚡</div>
                  <div className="badge-text"><span>Experience</span><strong>5+ Years</strong></div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ABOUT + EXPERIENCE */}
        <section className="section" id="about">
          <div className="container">
            <div className="section-header reveal">
              <h2>About Me</h2>
              <p>Engineer by training, builder by instinct.</p>
            </div>
            <div className="about-grid">
              <div className="about-content reveal">
                <h3>Full-Stack &amp; AI Engineer</h3>
                <p>
                  I specialize in scalable distributed microservices and
                  production-grade AI/LLM applications. Alumnus of IIT Bombay
                  (M.Tech), AIR-241 in GATE CS, with 5+ years building full-stack
                  and AI systems — now Founder of Markaba AI, an AI-powered
                  automotive diagnostics and marketplace platform.
                </p>
                <p>
                  My recent work spans secure offline RAG portals, autonomous
                  Plan→Execute→Reflect agents, and on-device vision systems —
                  always with an eye on performance, security, and clean
                  architecture.
                </p>
                <div className="about-stats">
                  <div className="stat-card glass"><span className="stat-num">5+</span><span className="stat-label">Years Exp</span></div>
                  <div className="stat-card glass"><span className="stat-num">AIR-241</span><span className="stat-label">GATE CS</span></div>
                  <div className="stat-card glass"><span className="stat-num">IIT</span><span className="stat-label">Bombay M.Tech</span></div>
                </div>
              </div>

              <div className="reveal delay-1">
                <h4 className="timeline-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>
                  Experience
                </h4>
                <div className="timeline">
                  <div className="timeline-item">
                    <div className="timeline-dot"></div>
                    <span className="timeline-time">2026 - Present</span>
                    <h4 className="timeline-header">Founder <span>- Markaba AI</span></h4>
                    <p className="timeline-desc">AI Automotive Intelligence Platform (markabaai.com) — diagnoses vehicle symptoms, matches a real parts catalog, ranks the workshop network, and composes a bookable repair quotation end-to-end. Built solo with FastAPI, React, Claude, and pgvector.</p>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-dot"></div>
                    <span className="timeline-time">2020 - 2026</span>
                    <h4 className="timeline-header">Member of Technical Staff <span>- Zettabytes (Roost.ai)</span></h4>
                    <p className="timeline-desc">Developer platforms and AI tooling for enterprise engineering teams. Owned RoostGPT&apos;s end-to-end Java unit test generation pipeline — 93% compile success, 4× test coverage, 85% less manual testing — and redesigned the Java AST schema (316KB → 17KB per class). Earlier: the Environments-as-a-Service dashboard, a Kubernetes topology UI, and a cross-platform Electron app.</p>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-dot"></div>
                    <span className="timeline-time">2018 - 2020</span>
                    <h4 className="timeline-header">M.Tech CSE <span>- IIT Bombay</span></h4>
                    <p className="timeline-desc">Graduate research; TA for CS699 (Software Lab) and CS101 (Computer Programming).</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SKILLS */}
        <section className="section" id="skills">
          <div className="container">
            <div className="section-header reveal">
              <h2>Skills</h2>
              <p>The stack I reach for across the full product lifecycle.</p>
            </div>
            <div className="skills-grid">
              {SKILLS.map((cat, i) => (
                <div className={`skills-category glass reveal delay-${i + 1}`} key={cat.heading}>
                  <h3>{cat.heading}</h3>
                  <div className="skills-list">
                    {cat.items.map((s) => <span key={s} className="skill-tag">{s}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PROJECTS */}
        <section className="section" id="projects">
          <div className="container">
            <div className="section-header reveal">
              <h2>Featured Projects</h2>
              <p>Production-minded builds across RAG, agents, vision, and data.</p>
            </div>
            <div className="projects-grid">
              {projects.map((p, i) => (
                <article className={`project-card glass glass-interactive reveal delay-${(i % 3) + 1}`} key={p.id}>
                  <div className="project-img-wrapper">
                    {PROJECT_ICON}
                    <div className="project-img-overlay">
                      <span className="project-tag">{p.kicker.replace(/^[^·]*·\s*/, '')}</span>
                      {p.href && (
                        <div className="project-overlay-links">
                          <a className="social-icon" href={p.href} target="_blank" rel="noopener noreferrer" aria-label={p.linkType === 'site' ? `${p.title} website` : `${p.title} repository`} style={{ width: 38, height: 38 }}>
                            <svg viewBox="0 0 24 24">{p.linkType === 'site' ? EXTERNAL_LINK_ICON : GITHUB_ICON}</svg>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="project-body">
                    <div className="project-tags">
                      {p.tags.map((t) => <span className="project-tag" key={t}>{t}</span>)}
                    </div>
                    <h3 className="project-title">{p.title}</h3>
                    <p className="project-desc">{p.description}</p>
                    <div className="project-links">
                      {p.href ? (
                        <a className="project-link" href={p.href} target="_blank" rel="noopener noreferrer">
                          <svg viewBox="0 0 24 24" fill="currentColor">{p.linkType === 'site' ? EXTERNAL_LINK_ICON : GITHUB_ICON}</svg>
                          {p.linkType === 'site' ? 'Visit Site' : 'View on GitHub'}
                        </a>
                      ) : (
                        <span className="project-link" style={{ color: 'var(--text-muted)', cursor: 'default' }}>
                          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm3 8H9V6a3 3 0 0 1 6 0v3z" /></svg>
                          Private client project
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section className="section" id="contact">
          <div className="container">
            <div className="section-header reveal">
              <h2>Get In Touch</h2>
              <p>Open to Full-Stack or AI/LLM engineering roles. Based in Abu Dhabi, UAE (willing to relocate).</p>
            </div>
            <div className="contact-grid">
              <div className="contact-info reveal">
                <div className="contact-heading">
                  <h3>Let's build something.</h3>
                  <p>The fastest way to reach me is email or LinkedIn. I usually reply within a day.</p>
                </div>
                <div className="contact-methods">
                  <a className="contact-card glass glass-interactive" href="mailto:afsalaazeez@gmail.com">
                    <div className="contact-icon"><svg viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></div>
                    <div className="contact-details"><span>Email</span><strong>afsalaazeez@gmail.com</strong></div>
                  </a>
                  <a className="contact-card glass glass-interactive" href="https://linkedin.com/in/afsalaazeez" target="_blank" rel="noopener noreferrer">
                    <div className="contact-icon"><svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ width: 20, height: 20 }}>{LINKEDIN_ICON}</svg></div>
                    <div className="contact-details"><span>LinkedIn</span><strong>linkedin.com/in/afsalaazeez</strong></div>
                  </a>
                  <a className="contact-card glass glass-interactive" href="https://github.com/zencodelab" target="_blank" rel="noopener noreferrer">
                    <div className="contact-icon"><svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ width: 20, height: 20 }}>{GITHUB_ICON}</svg></div>
                    <div className="contact-details"><span>GitHub</span><strong>github.com/zencodelab</strong></div>
                  </a>
                </div>
              </div>

              <form className="contact-form glass reveal delay-1" noValidate onSubmit={handleContactSubmit}>
                <div className="form-grid">
                  <div className="form-group form-group-full"><label htmlFor="c-name">Full Name</label><div className="form-input-wrapper"><input id="c-name" type="text" className="form-input" placeholder="Your name" value={contact.name} onChange={updateContact('name')} /></div></div>
                  <div className="form-group form-group-full"><label htmlFor="c-email">Email</label><div className="form-input-wrapper"><input id="c-email" type="email" className="form-input" placeholder="email@domain.com" value={contact.email} onChange={updateContact('email')} /></div></div>
                  <div className="form-group form-group-full"><label htmlFor="c-subject">Subject</label><div className="form-input-wrapper"><input id="c-subject" type="text" className="form-input" placeholder="Collaboration proposal" value={contact.subject} onChange={updateContact('subject')} /></div></div>
                  <div className="form-group form-group-full"><label htmlFor="c-message">Message</label><div className="form-input-wrapper"><textarea id="c-message" className="form-input" placeholder="Hi Afsal..." value={contact.message} onChange={updateContact('message')} /></div></div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>{submitting ? 'Sending message...' : 'Send Message'}</button>
                {status.msg && <div className={`form-status ${status.type}`} role="status" aria-live="polite">{status.msg}</div>}
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container footer-container">
          <p className="footer-text">© {new Date().getFullYear()} Afsal A Azeez. Built with React, TypeScript &amp; Vite.</p>
          <div className="footer-links">
            <Link to="/rideit">Ride It 🚗</Link>
            <a href="https://github.com/zencodelab" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="https://linkedin.com/in/afsalaazeez" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          </div>
        </div>
      </footer>

      <button className={`back-to-top glass${showTop ? ' visible' : ''}`} aria-label="Back to top" onClick={scrollTop}>
        <svg viewBox="0 0 24 24"><path d="M18 15l-6-6-6 6" /></svg>
      </button>
    </>
  )
}
