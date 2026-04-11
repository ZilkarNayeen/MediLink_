import { Link } from 'react-router-dom'
import './LandingPage.css'

export default function LandingPage() {
  return (
    <div className="landing-page">

      {/* ── Nav ── */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">⚕️ MediLink</div>
          <div className="landing-nav-links">
            <a href="#directory">Directory</a>
            <a href="#how-it-works">How It Works</a>
            <Link to="/doctor" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', color: '#60A5FA' }}>
              👨‍⚕️ For Doctors
            </Link>
          </div>
          <div className="landing-nav-cta">
            <Link to="/login" className="landing-btn-ghost">Sign In</Link>
            <Link to="/signup" className="landing-btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-overlay" />
        <div className="landing-hero-content">
          <span className="landing-badge">🚀 Next-Gen Medical Ecosystem</span>
          <h1 className="landing-hero-title">
            Healthcare That Comes<br />
            <span className="landing-gradient-text">To You</span>
          </h1>
          <p className="landing-hero-sub">
            The central hub for Bangladesh's medical infrastructure. Book top-tier hospitals, consult via HD Telemedicine, run AI symptom checks, and hail emergency dispatches.
          </p>
          <div className="landing-hero-actions">
            <Link to="/signup" className="landing-cta-btn">
              Create Patient Account <span>→</span>
            </Link>
            <Link to="/discovery" className="landing-cta-ghost">
              🔍 Browse Directory
            </Link>
          </div>
        </div>

        <div className="landing-hero-visuals">

          {/* Primary card — full width, anchors the section */}
          <div className="hv-card hv-card-primary">
            <div className="hv-card-avatar">👨‍⚕️</div>
            <div className="hv-card-body">
              <div className="hv-live-dot"><span className="hv-pulse" />Live</div>
              <h4>Dr. Rahim Is Online</h4>
              <p>Cardiology • HD Telemedicine Ready</p>
            </div>
            <Link to="/signup" className="landing-btn-primary" style={{ marginTop: 'auto', whiteSpace: 'nowrap' }}>Join →</Link>
          </div>

          {/* Secondary row — two equal cards side by side */}
          <div className="hv-row">
            <div className="hv-card hv-card-secondary">
              <div className="hv-card-icon" style={{ background: 'rgba(139,92,246,0.15)' }}>🤖</div>
              <div className="hv-card-body">
                <h4>Llama 3.1 AI</h4>
                <p>Symptom checker active</p>
              </div>
              <span className="hv-badge" style={{ background: 'rgba(52,211,153,0.15)', color: '#34D399' }}>Online</span>
            </div>

            <div className="hv-card hv-card-secondary">
              <div className="hv-card-icon" style={{ background: 'rgba(239,68,68,0.15)' }}>🚨</div>
              <div className="hv-card-body">
                <h4>SOS Dispatch</h4>
                <p>Ambulance 3 mins away</p>
              </div>
              <span className="hv-badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#F87171' }}>Active</span>
            </div>
          </div>

          {/* Tertiary card — stats strip */}
          <div className="hv-card hv-card-stats">
            <div className="hv-stat">
              <span className="hv-stat-val">50+</span>
              <span className="hv-stat-lab">Hospitals</span>
            </div>
            <div className="hv-stat-divider" />
            <div className="hv-stat">
              <span className="hv-stat-val">12K</span>
              <span className="hv-stat-lab">Patients</span>
            </div>
            <div className="hv-stat-divider" />
            <div className="hv-stat">
              <span className="hv-stat-val">24/7</span>
              <span className="hv-stat-lab">SOS</span>
            </div>
          </div>

        </div>
      </section>

      {/* ── Stats ── */}
      <section className="landing-stats-wrapper">
        <div className="landing-stats">
          <div className="landing-stat">
            <div className="landing-stat-value">50+</div>
            <div className="landing-stat-label">Hospitals Linked</div>
          </div>
          <div className="landing-stat">
            <div className="landing-stat-value">12K</div>
            <div className="landing-stat-label">Patients Served</div>
          </div>
          <div className="landing-stat">
            <div className="landing-stat-value">24/7</div>
            <div className="landing-stat-label">SOS Dispatch</div>
          </div>
          <div className="landing-stat">
            <div className="landing-stat-value">99%</div>
            <div className="landing-stat-label">System Uptime</div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="landing-features" id="directory">
        <div className="section-header">
          <h2>An Entire Medical Infrastructure</h2>
          <p>Everything you need to manage your health securely across the country.</p>
        </div>
        <div className="features-grid">
          <div className="feature-card" style={{ '--accent-glow': 'rgba(96, 165, 250, 0.4)' }}>
            <div className="feature-icon-wrap" style={{ color: '#60A5FA' }}>🔍</div>
            <h3>Hospital Directory</h3>
            <p>Compare local hospitals, browse their specific diagnostic tests and live operations pricing, and book directly.</p>
          </div>
          <div className="feature-card" style={{ '--accent-glow': 'rgba(167, 139, 250, 0.4)' }}>
            <div className="feature-icon-wrap" style={{ color: '#A78BFA' }}>🤖</div>
            <h3>AI Symptom AI</h3>
            <p>Leverage the massive groq-accelerated Meta Llama engine to cross-reference symptoms and triage your condition quickly.</p>
          </div>
          <div className="feature-card" style={{ '--accent-glow': 'rgba(52, 211, 153, 0.4)' }}>
            <div className="feature-icon-wrap" style={{ color: '#34D399' }}>📹</div>
            <h3>Telemedicine Suite</h3>
            <p>Connect with your physician natively in crisp, secure, WebRTC-powered video streams without leaving your browser.</p>
          </div>
          <div className="feature-card" style={{ '--accent-glow': 'rgba(239, 68, 68, 0.4)' }}>
            <div className="feature-icon-wrap" style={{ color: '#EF4444' }}>🚨</div>
            <h3>Live SOS Dispatch</h3>
            <p>One tap sends your live geographic GPS coordinates to our central Admin dispatch center for immediate ambulance routing.</p>
          </div>
        </div>
      </section>

      {/* ── Pipeline: How It Works ── */}
      <section className="flow-section" id="how-it-works">
        <div className="flow-container">
          
          <div className="flow-step">
            <div className="flow-visual">📱</div>
            <div className="flow-content">
              <span className="flow-badge">Step 1 — Discovery</span>
              <h3>Find The Perfect Care</h3>
              <p>Skip the waiting rooms. Open the beautifully optimized Mobile Directory to search across leading hospitals like BIRDEM and Square Hospital. Compare prices for tests and surgeries instantly.</p>
              <Link to="/discovery" className="landing-btn-ghost">Try The Directory</Link>
            </div>
          </div>

          <div className="flow-step">
            <div className="flow-visual">📅</div>
            <div className="flow-content">
              <span className="flow-badge">Step 2 — Auto Booking</span>
              <h3>Lock In Your Appointment</h3>
              <p>Once you locate your needed Test or highly-reviewed Doctor, one tap automatically prepares your booking profile. No messy phone calls needed—the Admin handles everything on our secure cloud.</p>
            </div>
          </div>

          <div className="flow-step">
            <div className="flow-visual">🏥</div>
            <div className="flow-content">
              <span className="flow-badge">Step 3 — Complete Health Record</span>
              <h3>A Unified Medical History</h3>
              <p>After your consultation, doctors instantly push digital prescriptions, lab results, and clinical notes to your EHR (Electronic Health Record). Accessible forever.</p>
            </div>
          </div>

        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-cta-banner">
        <h2>Ready to upgrade your healthcare?</h2>
        <p>Join the MediLink network today and experience medical discovery handled the 21st-century way.</p>
        <Link to="/signup" className="landing-cta-btn" style={{ padding: '1.25rem 3rem', fontSize: '1.25rem' }}>
          Create Free Account
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="footer-main">
        <div className="footer-inner">
          <div className="landing-logo">⚕️ MediLink</div>
          <div className="landing-nav-links">
            <Link to="/admin">Admin Gateway</Link>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
        <p className="footer-copy">© 2026 MediLink Bangladesh. All rights reserved. Built for scaling healthcare.</p>
      </footer>

    </div>
  )
}
