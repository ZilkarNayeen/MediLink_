import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../config.js'
import { Navbar, BottomNav } from '../components/Navbar.jsx'
import './Dashboard.css'

function Dashboard() {
  const [sosStatus, setSosStatus] = useState('')
  const [sosPhase, setSosPhase] = useState('') // 'locating' | 'dispatching' | 'done' | 'error'
  const [stats, setStats] = useState({ appointments: 0, records: 0 })

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

  // ─── SOS Emergency Dispatch ───
  const handleSOS = () => {
    if (!navigator.geolocation) {
      setSosStatus('Geolocation is not supported by your browser.')
      setSosPhase('error')
      return
    }
    setSosStatus('📍 Locating you…')
    setSosPhase('locating')
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords
      setSosStatus('🚑 Dispatching ambulance…')
      setSosPhase('dispatching')
      try {
        const res = await fetch(`${API_BASE_URL}/emergency`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ latitude, longitude })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message)
        setSosStatus('✅ Ambulance dispatched to your location!')
        setSosPhase('done')
      } catch (err) {
        setSosStatus('⚠️ Failed to dispatch: ' + err.message)
        setSosPhase('error')
      }
    }, () => {
      setSosStatus('⚠️ Unable to get your location. Please enable location services.')
      setSosPhase('error')
    })
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
      onClick: () => alert('AI Symptom Checker — coming soon'),
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

      {/* SOS Status Banner */}
      {sosStatus && (
        <div className={`dashboard-sos-banner ${sosPhase === 'done' ? 'sos-success' : ''} ${sosPhase === 'locating' || sosPhase === 'dispatching' ? 'sos-active' : ''}`}>
          {(sosPhase === 'locating' || sosPhase === 'dispatching') && (
            <span className="sos-spinner"></span>
          )}
          {sosStatus}
          {sosPhase === 'done' && (
            <button className="sos-dismiss-btn" onClick={() => { setSosStatus(''); setSosPhase(''); }}>✕</button>
          )}
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h2 className="dashboard-section-title">Quick Actions</h2>
        </div>

        <div className="dashboard-actions-grid">
          {quickActions.map((action, i) =>
            action.isButton ? (
              action.title === 'AI Symptom Checker' ? (
                <button
                  key={i}
                  className="dashboard-action-card"
                  onClick={action.onClick}
                  style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(147,51,234,0.1) 100%)', borderColor: 'rgba(147,51,234,0.2)' }}
                >
                  <div className="dashboard-action-icon" style={{ background: 'linear-gradient(135deg, var(--primary), #9333ea)', color: '#fff' }}>{action.icon}</div>
                  <div className="dashboard-action-title" style={{ color: '#9333ea' }}>{action.title}</div>
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

      <BottomNav role="patient" />
    </div>
  )
}

export default Dashboard
