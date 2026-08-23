import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ArrowRight, Search, ChevronRight, Menu, X } from 'lucide-react'
import './LandingPage.css'

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const auth = useAuth()
  const user = auth?.user
  const isAdmin = auth?.isAdmin || false

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Signed-in visitors get a profile button and CTAs that jump straight into the app
  const isLoggedIn = !!user
  const appHome = isAdmin ? '/dashboard' : '/home'
  const ctaTarget = isLoggedIn ? appHome : '/login'
  const profileLabel = user?.email || 'My Account'
  const profileInitial = (user?.email || '?').charAt(0).toUpperCase()

  const features = [
    {
      icon: '🤖',
      iconClass: 'feature-icon-wrap--blue',
      title: 'Multi-Agent AI System',
      desc: '9 specialized AI agents autonomously process, classify, and route complaints to the right department.'
    },
    {
      icon: '📊',
      iconClass: 'feature-icon-wrap--purple',
      title: 'Sentiment Analysis',
      desc: 'Detects citizen frustration and automatically boosts urgency for emotionally charged complaints.'
    },
    {
      icon: '🗺️',
      iconClass: 'feature-icon-wrap--emerald',
      title: 'Real-Time Heatmap',
      desc: 'Geographic visualization of complaint density, trends, and resolution times across Maharashtra.'
    },
    {
      icon: '💬',
      iconClass: 'feature-icon-wrap--sky',
      title: 'AI Chatbot',
      desc: 'Multilingual conversational assistant with voice support in English, Hindi, and Marathi.'
    },
    {
      icon: '🚨',
      iconClass: 'feature-icon-wrap--rose',
      title: 'Emergency Detection',
      desc: 'Automatic detection and instant routing of fire, medical, and safety emergencies within minutes.'
    },
    {
      icon: '👥',
      iconClass: 'feature-icon-wrap--amber',
      title: 'Community Forum',
      desc: 'Citizens discuss similar incidents and upvote to boost complaint priority and drive faster resolution.'
    }
  ]

  const agents = [
    { emoji: '🎯', name: 'Classification Agent', desc: 'Routes to the right department' },
    { emoji: '😊', name: 'Sentiment Agent', desc: 'Analyzes citizen emotion & urgency' },
    { emoji: '⏰', name: 'SLA Assignment', desc: 'Sets realistic deadlines' },
    { emoji: '🔄', name: 'Follow-Up Agent', desc: 'Monitors stale complaints' },
    { emoji: '💬', name: 'Chatbot Agent', desc: 'Answers queries in 3 languages' },
    { emoji: '📈', name: 'Escalation Agent', desc: 'Auto-escalates delayed cases' },
    { emoji: '📧', name: 'Communication Agent', desc: 'Sends status updates' },
    { emoji: '📜', name: 'Policy Intelligence', desc: 'Maps to government rules' },
    { emoji: '👁️', name: 'Monitoring Agent', desc: 'Tracks SLA breaches' }
  ]

  const techStack = [
    { emoji: '⚡', name: 'FastAPI' },
    { emoji: '⚛️', name: 'React 18' },
    { emoji: '🧠', name: 'LangChain' },
    { emoji: '🔗', name: 'LangGraph' },
    { emoji: '🗄️', name: 'Supabase' },
    { emoji: '🦙', name: 'Groq / Llama' },
    { emoji: '🗺️', name: 'Leaflet Maps' },
    { emoji: '🎤', name: 'Web Speech API' },
    { emoji: '📧', name: 'SMTP Email' },
    { emoji: '🔒', name: 'Row Level Security' }
  ]

  return (
    <div className="landing-page">
      {/* NAV */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-brand">
          <span className="nav-brand-icon">🏛️</span>
          <div className="nav-brand-text">
            <h2>Grievance Resolver</h2>
            <p>AI-Powered Complaint System</p>
          </div>
        </div>

        <div className="nav-links">
          <a href="#features" className="nav-link-item">Features</a>
          <a href="#how-it-works" className="nav-link-item">How It Works</a>
          <a href="#agents" className="nav-link-item">AI Agents</a>
        </div>

        <div className="nav-actions">
          {isLoggedIn ? (
            <Link to={appHome} className="nav-btn nav-btn--profile" title={profileLabel}>
              <span className="nav-avatar">{profileInitial}</span>
              <span className="nav-profile-email">{profileLabel}</span>
            </Link>
          ) : (
            <>
              <Link to="/login" className="nav-btn nav-btn--ghost">Log In</Link>
              <Link to="/login" className="nav-btn nav-btn--primary">
                Get Started <ArrowRight size={15} />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Dropdown */}
        {isMobileMenuOpen && (
          <div className="mobile-dropdown">
            <a href="#features" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>How It Works</a>
            <a href="#agents" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>AI Agents</a>
            <div className="mobile-actions">
              {isLoggedIn ? (
                <Link to={appHome} className="nav-btn nav-btn--profile" onClick={() => setIsMobileMenuOpen(false)}>
                  <span className="nav-avatar">{profileInitial}</span>
                  <span className="nav-profile-email">{profileLabel}</span>
                </Link>
              ) : (
                <>
                  <Link to="/login" className="nav-btn nav-btn--ghost" onClick={() => setIsMobileMenuOpen(false)}>Log In</Link>
                  <Link to="/login" className="nav-btn nav-btn--primary" onClick={() => setIsMobileMenuOpen(false)}>
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="hero-section">
        <div className="hero-decor hero-decor--1" />
        <div className="hero-decor hero-decor--2" />
        <div className="hero-decor hero-decor--3" />
        <div className="hero-pattern" />

        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot" />
            Built for India &nbsp;·&nbsp; Powered by AI
          </div>

          <h1 className="hero-title">
            Your Voice, <span className="hero-title-highlight">Resolved by AI</span>
          </h1>

          <p className="hero-subtitle">
            File citizen complaints and let 9 specialized AI agents autonomously classify, 
            route, monitor, and escalate your grievance — from submission to resolution.
          </p>

          <div className="hero-cta-group">
            <Link to={ctaTarget} className="hero-btn hero-btn--primary">
              File a Complaint <ArrowRight size={17} />
            </Link>
            <a href="#how-it-works" className="hero-btn hero-btn--secondary">
              <Search size={16} />
              See How It Works
            </a>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">9</div>
              <div className="hero-stat-label">AI Agents</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">11+</div>
              <div className="hero-stat-label">Departments</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">3</div>
              <div className="hero-stat-label">Languages</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">15 min</div>
              <div className="hero-stat-label">Emergency SLA</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-section" id="features">
        <div className="section-container">
          <div className="section-header">
            <span className="section-label">Platform Features</span>
            <h2 className="section-title">Everything to get your grievance heard</h2>
            <p className="section-subtitle">
              A comprehensive AI-powered system that handles your complaint end-to-end.
            </p>
          </div>

          <div className="features-grid">
            {features.map((f, i) => (
              <div className="feature-card" key={i}>
                <div className={`feature-icon-wrap ${f.iconClass}`}>
                  {f.icon}
                </div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="workflow-section" id="how-it-works">
        <div className="section-container">
          <div className="section-header">
            <span className="section-label">How It Works</span>
            <h2 className="section-title">From complaint to resolution in 4 steps</h2>
            <p className="section-subtitle">
              Our multi-agent AI system handles the entire lifecycle automatically.
            </p>
          </div>

          <div className="workflow-steps">
            <div className="workflow-step">
              <div className="step-number">1</div>
              <h3 className="step-title">Submit</h3>
              <p className="step-desc">Describe your issue with text or voice input and provide location details.</p>
            </div>
            <div className="workflow-step">
              <div className="step-number">2</div>
              <h3 className="step-title">AI Classification</h3>
              <p className="step-desc">Agents classify urgency, detect sentiment, and route to the right department.</p>
            </div>
            <div className="workflow-step">
              <div className="step-number">3</div>
              <h3 className="step-title">Track & Monitor</h3>
              <p className="step-desc">Real-time status updates, SLA tracking, and automated follow-ups via email.</p>
            </div>
            <div className="workflow-step">
              <div className="step-number">4</div>
              <h3 className="step-title">Resolution</h3>
              <p className="step-desc">Get notified when resolved. Community upvotes can boost priority.</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI AGENTS */}
      <section className="agents-section" id="agents">
        <div className="section-container">
          <div className="section-header">
            <span className="section-label">AI Agent Team</span>
            <h2 className="section-title">9 Specialized Agents Working for You</h2>
            <p className="section-subtitle">
              Each agent is an autonomous AI worker with a specific role in the resolution pipeline.
            </p>
          </div>

          <div className="agents-grid">
            {agents.map((a, i) => (
              <div className="agent-card" key={i}>
                <span className="agent-emoji">{a.emoji}</span>
                <div className="agent-info">
                  <h4>{a.name}</h4>
                  <p>{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TECH STACK */}
      <section className="tech-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-label">Built With</span>
            <h2 className="section-title">Modern Tech Stack</h2>
            <p className="section-subtitle">
              Production-ready architecture using cutting-edge frameworks.
            </p>
          </div>

          <div className="tech-grid">
            {techStack.map((t, i) => (
              <div className="tech-pill" key={i}>
                <span className="tech-emoji">{t.emoji}</span>
                {t.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to file your <span className="cta-highlight">grievance?</span></h2>
          <p>
            Join citizens who trust our AI-powered system to resolve their complaints faster and more efficiently.
          </p>
          <Link to={ctaTarget} className="hero-btn hero-btn--primary">
            {isLoggedIn ? 'Continue to App' : 'Get Started Now'} <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span>🏛️</span>
            <span className="footer-brand-text">Grievance Resolver</span>
          </div>
          <p className="footer-tagline">AI-Powered Citizen Complaint System for India</p>
          <div className="footer-links">
            <a href="#features" className="footer-link">Features</a>
            <a href="#how-it-works" className="footer-link">How It Works</a>
            <a href="#agents" className="footer-link">AI Agents</a>
            <Link to={ctaTarget} className="footer-link">{isLoggedIn ? 'My Account' : 'Login'}</Link>
          </div>
          <div className="footer-divider" />
          <div className="footer-bottom">
            <span>Built for India</span>
            <span>·</span>
            <span>Powered by AI 🤖</span>
            <span>·</span>
            <span>© 2026 Grievance Resolver</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
