import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config.js'
import { Navbar, BottomNav } from '../components/Navbar.jsx'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import './AdminPages.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
})

const sosIcon = new L.DivIcon({
  className: 'sos-marker-pulse',
  html: '🚨',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
})

function AdminDashboard() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
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
    } catch { }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/profile/admin/stats`, {
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
    } catch { }
  }

  const handleResolveEmergency = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/emergency/${id}/resolve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        fetchEmergencies() // Refresh active list
      }
    } catch (err) {
      console.error('Failed to resolve', err)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setSubmitting(true)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/doctor/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.message || 'Failed to register doctor')
      setSuccess(`Doctor "${data.user.fullName}" registered successfully!`)
      setForm({ fullName: '', email: '', password: '' })
      fetchStats() // Refresh stats after adding doctor
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const center = emergencies.length > 0
    ? [emergencies[0].latitude, emergencies[0].longitude]
    : [23.8103, 90.4125]

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="admin-welcome" style={{ fontSize: '1.8rem', fontWeight: 800 }}>Admin Control Center</h1>
            <p style={{ color: 'var(--text-muted)' }}>Platform analytics, emergency dispatches, and personnel management.</p>
          </div>
          <button className="ml-btn ml-btn-primary" onClick={() => { setShowForm(!showForm); setSuccess(''); setError('') }}>
            {showForm ? '✕ Cancel' : '＋ Add New Doctor'}
          </button>
        </div>

        {/* ── Analytics Stats Grid ── */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {STAT_CARDS.map((s, i) => (
              <div key={i} className="ml-card" style={{ padding: '1.25rem', textAlign: 'center', borderTop: `3px solid ${s.color}` }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{s.icon}</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Active Emergencies Map ── */}
        <div className="ml-card ml-fade-up" style={{ padding: 0, overflow: 'hidden', marginBottom: '2rem', border: '1px solid var(--danger-bg)' }}>
          <div style={{ background: 'var(--danger-bg)', color: '#DC2626', padding: '1rem', fontWeight: 700, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🚨 Active Emergency SOS Dispatches
            <span style={{ marginLeft: 'auto', background: '#DC2626', color: 'white', borderRadius: '999px', padding: '0.2rem 0.65rem', fontSize: '0.75rem', fontWeight: 800 }}>
              {emergencies.length}
            </span>
          </div>
          <div style={{ height: '380px', width: '100%' }}>
            <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%', zIndex: 0 }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
              {emergencies.map(em => (
                <Marker key={em.id} position={[em.latitude, em.longitude]} icon={sosIcon}>
                  <Popup>
                    <strong>Emergency Signal</strong><br />
                    Time: {new Date(em.createdAt).toLocaleTimeString()}<br />
                    Status: <span style={{ color: '#DC2626', fontWeight: 'bold' }}>Awaiting Dispatch</span>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Emergency List View below map */}
          {emergencies.length > 0 && (
            <div style={{ padding: '1rem', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#DC2626' }}>Requires Immediate Dispatch:</h4>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {emergencies.map(em => (
                  <div key={em.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(220,38,38,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(220,38,38,0.2)' }}>
                    <div>
                      <strong style={{ color: 'var(--text)' }}>Patient SOS</strong>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cord: [{em.latitude.toFixed(4)}, {em.longitude.toFixed(4)}] • {new Date(em.createdAt).toLocaleTimeString()}</div>
                    </div>
                    <button
                      onClick={() => handleResolveEmergency(em.id)}
                      style={{ background: '#10B981', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                      ✓ Acknowledge & Resolve
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: showForm ? '1fr' : '1fr 1fr', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* ── Recent Patients ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {recentPatients.length > 0 && (
              <div className="ml-card ml-fade-up" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
                  🧑 Recently Registered Patients ({recentPatients.length})
                </div>
                <div style={{ overflow: 'auto' }}>
                  <table className="appointments-table" style={{ minWidth: 400 }}>
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
              <div className="ml-card ml-fade-up" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
                  👨‍⚕️ Verified Doctors On Platform ({activeDoctors.length})
                </div>
                <div style={{ overflow: 'auto', maxHeight: '400px' }}>
                  <table className="appointments-table" style={{ minWidth: 400 }}>
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
                          <td><span className="status-badge status-confirmed">Active</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ── Doctor Signup Form ── */}
          {showForm && (
            <div className="ml-card ml-fade-up" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem' }}>Register New Doctor</h2>
              <form onSubmit={handleSubmit}>
                {success && <div className="ml-alert" style={{ backgroundColor: 'var(--success-bg)', color: '#059669', marginBottom: '1rem' }}>✅ {success}</div>}
                {error && <div className="ml-alert ml-alert-error" style={{ marginBottom: '1rem' }}>⚠️ {error}</div>}
                <div className="ml-field mb-1">
                  <label className="ml-label">Full Name</label>
                  <input className="ml-input" name="fullName" type="text" required placeholder="Dr. Jane Smith" value={form.fullName} onChange={handleChange} />
                </div>
                <div className="ml-field mb-1">
                  <label className="ml-label">Email Address</label>
                  <input className="ml-input" name="email" type="email" required placeholder="doctor@hospital.com" value={form.email} onChange={handleChange} />
                </div>
                <div className="ml-field mb-1">
                  <label className="ml-label">Initial Password</label>
                  <input className="ml-input" name="password" type="password" required placeholder="Enter secure password" value={form.password} onChange={handleChange} />
                </div>
                <button type="submit" className="ml-btn ml-btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={submitting}>
                  {submitting ? 'Registering...' : 'Register Doctor Account'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      <BottomNav role="admin" />
    </div>
  )
}

export default AdminDashboard
