import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config.js'
import { Navbar, BottomNav } from '../components/Navbar.jsx'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ text: '', type: '' })

  const token = localStorage.getItem('medilink_token')
  const userStr = localStorage.getItem('medilink_user')
  const currentUser = userStr ? JSON.parse(userStr) : null

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setProfile(data.user)
      setForm({
        fullName: data.user.fullName || '',
        phone: data.user.phone || '',
        dateOfBirth: data.user.dateOfBirth || '',
        bloodGroup: data.user.bloodGroup || '',
        allergies: data.user.allergies || '',
        emergencyContact: data.user.emergencyContact || '',
      })
    } catch { setMsg({ text: 'Failed to load profile', type: 'error' }) }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg({ text: '', type: '' })
    try {
      const res = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      
      // Update localStorage so Navbar reflects new name
      localStorage.setItem('medilink_user', JSON.stringify({ ...currentUser, fullName: data.user.fullName }))
      setProfile(data.user)
      setMsg({ text: '✅ Profile updated successfully!', type: 'success' })
    } catch (err) {
      setMsg({ text: err.message, type: 'error' })
    } finally { setSaving(false) }
  }

  const initials = (name = '') => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text-muted)' }}>Loading profile...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 'var(--navbar-height)', paddingBottom: '5rem' }}>
      <Navbar role="patient" />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.25rem' }}>
        {/* Profile Header */}
        <div className="ml-card ml-fade-up" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', fontWeight: 800, color: 'white', flexShrink: 0
          }}>
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="avatar" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
            ) : initials(profile?.fullName)}
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>{profile?.fullName}</h1>
            <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>{profile?.email}</p>
            <span style={{
              display: 'inline-block', marginTop: '0.5rem',
              padding: '0.2rem 0.65rem', borderRadius: '999px',
              background: 'var(--success-bg)', color: '#059669',
              fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              {profile?.role}
            </span>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>Member since</p>
            <p style={{ color: 'var(--text)', fontWeight: 600, margin: 0 }}>
              {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
            </p>
          </div>
        </div>

        {/* Alert */}
        {msg.text && (
          <div className="ml-alert ml-fade-up" style={{
            marginBottom: '1.5rem',
            background: msg.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
            color: msg.type === 'success' ? '#059669' : '#DC2626',
            border: `1px solid ${msg.type === 'success' ? '#6EE7B7' : '#FCA5A5'}`
          }}>
            {msg.text}
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="ml-card ml-fade-up" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.75rem', color: 'var(--text)' }}>
            Personal Information
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="ml-field">
              <label className="ml-label">Full Name</label>
              <input className="ml-input" type="text" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} placeholder="Your full name" />
            </div>
            <div className="ml-field">
              <label className="ml-label">Phone Number</label>
              <input className="ml-input" type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+880 1xxx xxxxxx" />
            </div>
            <div className="ml-field">
              <label className="ml-label">Date of Birth</label>
              <input className="ml-input" type="date" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} />
            </div>
            <div className="ml-field">
              <label className="ml-label">Blood Group</label>
              <select className="ml-input" value={form.bloodGroup} onChange={e => setForm({...form, bloodGroup: e.target.value})}>
                <option value="">-- Select Blood Group --</option>
                {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', display: 'grid', gap: '1.25rem' }}>
            <div className="ml-field">
              <label className="ml-label">Known Allergies</label>
              <textarea
                className="ml-input"
                rows={3}
                value={form.allergies}
                onChange={e => setForm({...form, allergies: e.target.value})}
                placeholder="e.g. Penicillin, Peanuts, Latex... (None if not applicable)"
                style={{ resize: 'vertical' }}
              />
            </div>
            <div className="ml-field">
              <label className="ml-label">Emergency Contact</label>
              <input
                className="ml-input"
                type="text"
                value={form.emergencyContact}
                onChange={e => setForm({...form, emergencyContact: e.target.value})}
                placeholder="e.g. Ahmed (Brother) — +880 1700 000000"
              />
            </div>
          </div>

          <button
            type="submit"
            className="ml-btn ml-btn-primary"
            style={{ marginTop: '2rem', width: '100%', padding: '0.85rem' }}
            disabled={saving}
          >
            {saving ? 'Saving...' : '💾 Save Profile Changes'}
          </button>
        </form>
      </div>

      <BottomNav role="patient" />
    </div>
  )
}

export default ProfilePage
