import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config.js'
import { Navbar, BottomNav } from '../components/Navbar.jsx'
import './AdminPages.css'

function AdminDashboard() {
  const [emergencies, setEmergencies] = useState([])
  const [stats, setStats] = useState(null)
  const [recentPatients, setRecentPatients] = useState([])
  const [activeDoctors, setActiveDoctors] = useState([])

  const token = localStorage.getItem('medilink_admin_token')

  useEffect(() => {
    fetchEmergencies()
    fetchStats()
    const interval = setInterval(fetchEmergencies, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchEmergencies = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/emergency/active`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.emergencies) setEmergencies(data.emergencies)
    } catch {}
  }

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/emergency/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.stats) {
        setStats(data.stats)
        setRecentPatients(data.recentPatients || [])
      }

      // Fetch doctors as well
      const docRes = await fetch(`${API_BASE_URL}/doctors`)
      const docData = await docRes.json()
      setActiveDoctors(docData.doctors || [])
    } catch {}
  }

  const handleResolveEmergency = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/emergency/${id}/resolve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        fetchEmergencies()
        fetchStats()
      }
    } catch (err) {
      console.error('Failed to resolve', err)
    }
  }

  const STAT_CARDS = stats ? [
    { icon: '🧑', label: 'Total Patients', value: stats.patients, color: '#0057B7' },
    { icon: '👨‍⚕️', label: 'Total Doctors', value: stats.doctors, color: '#059669' },
    { icon: '📅', label: 'Appointments', value: stats.appointments, color: '#9333ea' },
    { icon: '🚨', label: 'SOS Dispatches', value: stats.emergencies, color: '#DC2626' },
    { icon: '🩸', label: 'Blood Donors', value: stats.bloodDonors, color: '#e11d48' },
    { icon: '📋', label: 'Open Blood Requests', value: stats.bloodRequests, color: '#D97706' },
  ] : []

  return (
    <div className="admin-dashboard-page">
      <Navbar role="admin" />

      <div className="admin-content ml-fade-up">
        {/* Page Header */}
        <div className="admin-header">
          <div>
            <h1 className="admin-welcome">Admin Control Center</h1>
            <p style={{ color: 'var(--text-muted)' }}>Platform analytics, emergency dispatches, and personnel management.</p>
          </div>
        </div>

        {/* ── Analytics Stats Grid ── */}
        {stats && (
          <div className="admin-stats-grid">
            {STAT_CARDS.map((s, i) => (
              <div key={i} className="admin-stat-card ml-card" style={{ borderTopColor: s.color }}>
                <div className="admin-stat-icon">{s.icon}</div>
                <div className="admin-stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="admin-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Active Emergencies Section ── */}
        <div className="emergency-section ml-card ml-fade-up">
          <div className="emergency-header">
            <span className="emergency-header-icon">🚨</span>
            Active Emergency SOS Dispatches
            <span className="emergency-count-badge">
              {emergencies.length}
            </span>
          </div>

          {/* Emergency Map Placeholder — OpenStreetMap Embed */}
          <div className="emergency-map-container">
            {emergencies.length > 0 ? (
              <iframe
                title="Emergency Locations"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                  Math.min(...emergencies.map(e => e.longitude)) - 0.05
                },${
                  Math.min(...emergencies.map(e => e.latitude)) - 0.05
                },${
                  Math.max(...emergencies.map(e => e.longitude)) + 0.05
                },${
                  Math.max(...emergencies.map(e => e.latitude)) + 0.05
                }&layer=mapnik&marker=${emergencies[0].latitude},${emergencies[0].longitude}`}
              />
            ) : (
              <div className="emergency-map-empty">
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
                <div style={{ fontWeight: 700, color: '#059669' }}>All Clear</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>No active emergency signals. Map auto-refreshes every 10 seconds.</div>
              </div>
            )}
          </div>

          {/* Emergency List View below map */}
          {emergencies.length > 0 && (
            <div className="emergency-list">
              <h4 className="emergency-list-title">Requires Immediate Dispatch:</h4>
              <div className="emergency-list-items">
                {emergencies.map(em => (
                  <div key={em.id} className="emergency-list-item">
                    <div className="emergency-item-info">
                      <div className="emergency-item-pulse"></div>
                      <div>
                        <strong style={{ color: 'var(--text)' }}>Patient SOS</strong>
                        <div className="emergency-item-coords">
                          📍 [{em.latitude.toFixed(4)}, {em.longitude.toFixed(4)}] • {new Date(em.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleResolveEmergency(em.id)}
                      className="emergency-resolve-btn"
                    >
                      ✓ Acknowledge & Resolve
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Personnel Tables ── */}
        <div className="admin-tables-grid">
          {/* ── Recent Patients ── */}
          {recentPatients.length > 0 && (
            <div className="ml-card ml-fade-up admin-table-card">
              <div className="admin-table-header">
                🧑 Recently Registered Patients ({recentPatients.length})
              </div>
              <div style={{ overflow: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Patient Name</th>
                      <th>Email</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPatients.map(p => (
                      <tr key={p.id}>
                        <td><strong>{p.fullName}</strong></td>
                        <td style={{ color: 'var(--text-muted)' }}>{p.email}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Active Doctors ── */}
          {activeDoctors.length > 0 && (
            <div className="ml-card ml-fade-up admin-table-card">
              <div className="admin-table-header">
                👨‍⚕️ Verified Doctors On Platform ({activeDoctors.length})
              </div>
              <div style={{ overflow: 'auto', maxHeight: '400px' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Doctor Name</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeDoctors.map(d => (
                      <tr key={d.id}>
                        <td><strong>{d.fullName}</strong></td>
                        <td><span className="ml-badge ml-badge-success">Active</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNav role="admin" />
    </div>
  )
}

export default AdminDashboard
