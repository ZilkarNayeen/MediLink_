import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { API_BASE_URL } from '../config.js'
import { Navbar, BottomNav } from '../components/Navbar.jsx'
import './Dashboard.css'

function Dashboard() {
  const { i18n } = useTranslation()
  const [sosStatus, setSosStatus] = useState('')
  const [stats, setStats] = useState({ appointments: 0, records: 0, prescriptions: 0 })

  // AI Chat States
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiMessages, setAiMessages] = useState([
    { role: 'assistant', content: 'Hi there! I am your AI Symptom Checker. How are you feeling today?' }
  ])
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const aiChatEndRef = useRef(null)

  const userStr = localStorage.getItem('medilink_user')
  const user = userStr ? JSON.parse(userStr) : null
  const token = localStorage.getItem('medilink_token')

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/appointments`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        const apts = data.appointments || []
        setStats(prev => ({ ...prev, appointments: apts.length }))
      } catch {}
    }
    if (token) fetchStats()
  }, [])

  useEffect(() => {
    aiChatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiMessages])

  const handleSOS = () => {
    if (!navigator.geolocation) {
      setSosStatus('Geolocation is not supported by your browser.')
      return
    }
    setSosStatus('📍 Locating you…')
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords
      setSosStatus('🚑 Dispatching ambulance…')
      try {
        const res = await fetch(`${API_BASE_URL}/emergency`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ latitude, longitude })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message)
        setSosStatus('✅ Ambulance dispatched to your location!')
      } catch (err) {
        setSosStatus('⚠️ Failed to dispatch: ' + err.message)
      }
    }, () => {
      setSosStatus('⚠️ Unable to get your location. Please enable location services.')
    })
  }

  const switchLang = (lang) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('medilink_lang', lang)
  }

  const handleAiSubmit = async (e) => {
    e.preventDefault()
    if (!aiInput.trim() || aiLoading) return

    const userMessage = { role: 'user', content: aiInput }
    const updatedMessages = [...aiMessages, userMessage]
    setAiMessages(updatedMessages)
    setAiInput('')
    setAiLoading(true)

    try {
      const res = await fetch(`${API_BASE_URL}/ai/symptoms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: updatedMessages })
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      setAiMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (err) {
      setAiMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${err.message}` }])
    } finally {
      setAiLoading(false)
    }
  }

  const quickActions = [
    {
      to: '/appointments',
      icon: '📅',
      iconClass: 'blue',
      title: 'Book Appointment',
      sub: 'Schedule with a doctor',
    },
    {
      to: '/consultation-history',
      icon: '📋',
      iconClass: 'teal',
      title: 'My Consultations',
      sub: 'View past visits & prescriptions',
    },
    {
      to: '/records',
      icon: '📁',
      iconClass: 'purple',
      title: 'Medical Records',
      sub: 'Lab results, X-rays & notes',
    },
    {
      isButton: true,
      onClick: () => setShowAiModal(true),
      icon: '🤖',
      iconClass: 'blue',
      title: 'AI Symptom Checker',
      sub: 'Check symptoms instantly',
    },
    {
      to: '/blood-bank',
      icon: '🩸',
      iconClass: 'red',
      title: 'Blood Bank',
      sub: 'Find donors & requests',
    },
    {
      isButton: true,
      onClick: handleSOS,
      icon: '🚨',
      iconClass: 'red',
      title: 'SOS Ambulance',
      sub: 'Emergency dispatch now',
      isDanger: true,
    },
  ]

  return (
    <div className="dashboard-page">
      <Navbar role="patient" />

      {/* ── Hero ── */}
      <section className="dashboard-hero">
        <div className="dashboard-hero-content">
          <p className="dashboard-greeting">{greeting()}</p>
          <h1 className="dashboard-hero-title">
            {user?.fullName ? `Hello, ${user.fullName.split(' ')[0]} 👋` : 'Welcome to MediLink'}
          </h1>
          <p className="dashboard-hero-sub">
            Your health, at your fingertips. Book appointments, access records, and stay connected with your care team.
          </p>

          <div className="dashboard-stats">
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-value">{stats.appointments}</div>
              <div className="dashboard-stat-label">Appointments</div>
            </div>
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-value">{stats.records}</div>
              <div className="dashboard-stat-label">Records</div>
            </div>
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-value">24/7</div>
              <div className="dashboard-stat-label">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* SOS banner */}
      {sosStatus && (
        <div className="dashboard-sos-banner">{sosStatus}</div>
      )}

      {/* ── Quick Actions ── */}
      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h2 className="dashboard-section-title">Quick Actions</h2>
          <div style={{ display: 'flex', gap: '4px' }}>
            {['en', 'bn', 'es'].map(lang => (
              <button
                key={lang}
                onClick={() => switchLang(lang)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '999px',
                  border: `1px solid ${i18n.language === lang ? 'var(--primary)' : 'var(--border)'}`,
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  background: i18n.language === lang ? 'var(--primary)' : 'var(--surface)',
                  color: i18n.language === lang ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="dashboard-actions-grid">
          {quickActions.map((action, i) =>
            action.isButton ? (
               // Explicitly mapping large feature card for the AI Symptom Checker if needed, but here it matches the standard grid.
               action.title === 'AI Symptom Checker' ? (
                 <button
                   key={i}
                   className={`dashboard-action-card`}
                   onClick={action.onClick}
                   style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(147,51,234,0.1) 100%)', borderColor: 'rgba(147,51,234,0.2)' }}
                 >
                   <div className={`dashboard-action-icon`} style={{ background: 'linear-gradient(135deg, var(--primary), #9333ea)', color: '#fff' }}>{action.icon}</div>
                   <div className="dashboard-action-title" style={{ color: '#9333ea'}}>{action.title}</div>
                   <div className="dashboard-action-sub">{action.sub}</div>
                 </button>
               ) : (
                <button
                  key={i}
                  className={`dashboard-action-card ${action.isDanger ? 'danger' : ''}`}
                  onClick={action.onClick}
                >
                  <div className={`dashboard-action-icon ${action.iconClass}`}>{action.icon}</div>
                  <div className="dashboard-action-title">{action.title}</div>
                  <div className="dashboard-action-sub">{action.sub}</div>
                </button>
               )
            ) : (
              <Link key={i} to={action.to} className="dashboard-action-card">
                <div className={`dashboard-action-icon ${action.iconClass}`}>{action.icon}</div>
                <div className="dashboard-action-title">{action.title}</div>
                <div className="dashboard-action-sub">{action.sub}</div>
              </Link>
            )
          )}
        </div>
      </div>

      {/* ── AI Chat Modal Overlay ── */}
      {showAiModal && (
        <div className="doc-modal-overlay" style={{ zIndex: 10000, padding: '1rem' }}>
          <div className="doc-modal" style={{ display: 'flex', flexDirection: 'column', height: '80vh', maxWidth: '600px', padding: 0, overflow: 'hidden' }}>
            
            <div style={{ padding: '1.25rem', background: 'linear-gradient(135deg, var(--primary), #9333ea)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ color: 'white', margin: 0, fontSize: '1.2rem' }}>🤖 AI Symptom Checker</h2>
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Powered by Groq & Llama-3-8b</p>
              </div>
              <button 
                onClick={() => setShowAiModal(false)}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {aiMessages.map((msg, idx) => {
                const isUser = msg.role === 'user'
                return (
                  <div key={idx} style={{ alignSelf: isUser ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                    <div style={{
                      background: isUser ? 'var(--primary)' : 'var(--surface)',
                      color: isUser ? '#fff' : 'var(--text)',
                      padding: '0.75rem 1rem',
                      borderRadius: isUser ? '16px 16px 0px 16px' : '16px 16px 16px 0px',
                      boxShadow: 'var(--shadow-sm)',
                      fontSize: '0.95rem',
                      lineHeight: 1.5,
                      border: isUser ? 'none' : '1px solid var(--border)'
                    }}>
                      {msg.content}
                    </div>
                  </div>
                )
              })}
              {aiLoading && (
                <div style={{ alignSelf: 'flex-start', background: 'var(--surface)', padding: '0.75rem 1rem', borderRadius: '16px 16px 16px 0px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
                  <span className="ml-pulse" style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', marginRight: '3px' }}></span>
                  <span className="ml-pulse" style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', marginRight: '3px', animationDelay: '0.2s' }}></span>
                  <span className="ml-pulse" style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', animationDelay: '0.4s' }}></span>
                </div>
              )}
              <div ref={aiChatEndRef} />
            </div>

            <form onSubmit={handleAiSubmit} style={{ padding: '1rem', background: 'var(--surface)', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                placeholder="Describe your symptoms (e.g. sharp headache)..."
                disabled={aiLoading}
                style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '999px', border: '1px solid var(--border-strong)', background: 'var(--surface-2)', outline: 'none', color: 'var(--text)' }}
              />
              <button 
                type="submit" 
                disabled={!aiInput.trim() || aiLoading}
                style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: aiInput.trim() && !aiLoading ? 'pointer' : 'not-allowed', opacity: aiInput.trim() && !aiLoading ? 1 : 0.5 }}
              >
                ➤
              </button>
            </form>

          </div>
        </div>
      )}

      <BottomNav role="patient" />
    </div>
  )
}

export default Dashboard
