import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config.js'
import { Navbar, BottomNav } from '../components/Navbar.jsx'
import './BloodBank.css'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

function BloodBank() {
  const [activeTab, setActiveTab] = useState('search') // 'search' | 'donate' | 'request'
  const [searchBloodGroup, setSearchBloodGroup] = useState('')
  const [searchCity, setSearchCity] = useState('')
  const [donors, setDonors] = useState([])
  const [requests, setRequests] = useState([])
  const [searching, setSearching] = useState(false)

  const [donorForm, setDonorForm] = useState({ fullName: '', bloodGroup: '', phone: '', city: '', lastDonated: '' })
  const [donorSubmitting, setDonorSubmitting] = useState(false)
  const [donorMsg, setDonorMsg] = useState({ text: '', type: '' })

  const [requestForm, setRequestForm] = useState({ patientName: '', bloodGroup: '', hospital: '', city: '', phone: '', urgency: 'regular' })
  const [requestSubmitting, setRequestSubmitting] = useState(false)
  const [requestMsg, setRequestMsg] = useState({ text: '', type: '' })

  const token = localStorage.getItem('medilink_token')

  useEffect(() => {
    if (activeTab === 'search') {
      fetchDonors()
      fetchRequests()
    }
  }, [activeTab])

  const fetchDonors = async () => {
    setSearching(true)
    try {
      const params = new URLSearchParams()
      if (searchBloodGroup) params.append('bloodGroup', searchBloodGroup)
      if (searchCity) params.append('city', searchCity)
      const res = await fetch(`${API_BASE_URL}/blood/donors?${params}`)
      const data = await res.json()
      setDonors(data.donors || [])
    } catch { setDonors([]) }
    finally { setSearching(false) }
  }

  const fetchRequests = async () => {
    try {
      const params = new URLSearchParams()
      if (searchBloodGroup) params.append('bloodGroup', searchBloodGroup)
      if (searchCity) params.append('city', searchCity)
      const res = await fetch(`${API_BASE_URL}/blood/requests?${params}`)
      const data = await res.json()
      setRequests(data.requests || [])
    } catch { setRequests([]) }
  }

  const handleDonorSubmit = async (e) => {
    e.preventDefault()
    setDonorSubmitting(true)
    setDonorMsg({ text: '', type: '' })
    try {
      const res = await fetch(`${API_BASE_URL}/blood/donors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(donorForm)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setDonorMsg({ text: '🩸 Thank you! You are now registered as a blood donor.', type: 'success' })
      setDonorForm({ fullName: '', bloodGroup: '', phone: '', city: '', lastDonated: '' })
    } catch (err) {
      setDonorMsg({ text: err.message, type: 'error' })
    } finally {
      setDonorSubmitting(false)
    }
  }

  const handleRequestSubmit = async (e) => {
    e.preventDefault()
    setRequestSubmitting(true)
    setRequestMsg({ text: '', type: '' })
    try {
      const res = await fetch(`${API_BASE_URL}/blood/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(requestForm)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setRequestMsg({ text: '✅ Blood request posted! Donors will be notified.', type: 'success' })
      setRequestForm({ patientName: '', bloodGroup: '', hospital: '', city: '', phone: '', urgency: 'regular' })
    } catch (err) {
      setRequestMsg({ text: err.message, type: 'error' })
    } finally {
      setRequestSubmitting(false)
    }
  }

  const urgencyColor = (urgency) => {
    if (urgency === 'emergency') return '#dc2626'
    if (urgency === 'urgent') return '#d97706'
    return 'var(--text-muted)'
  }

  const urgencyLabel = (urgency) => {
    if (urgency === 'emergency') return '🚨 Emergency'
    if (urgency === 'urgent') return '⚠️ Urgent'
    return 'Regular'
  }

  return (
    <div className="bb-page">
      <Navbar role="patient" />

      <header className="bb-hero">
        <h1 className="ml-fade-up">Every <span>Drop</span> Counts</h1>
        <p className="ml-fade-up" style={{ animationDelay: '0.1s' }}>Find donors, register to donate, or post an urgent blood request — all securely connected.</p>
      </header>

      <div className="bb-content ml-fade-up" style={{ animationDelay: '0.2s' }}>

        <div className="bb-tabs">
          <button className={`bb-tab ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>🔍 Find Donors & Requests</button>
          <button className={`bb-tab ${activeTab === 'donate' ? 'active' : ''}`} onClick={() => setActiveTab('donate')}>🩸 Register as Donor</button>
          <button className={`bb-tab ${activeTab === 'request' ? 'active' : ''}`} onClick={() => setActiveTab('request')}>🚨 Post Blood Request</button>
        </div>

        {/* ── SEARCH TAB ── */}
        {activeTab === 'search' && (
          <div>
            <div className="bb-search-row">
              <div className="bb-search-col">
                <label>Blood Group</label>
                <select value={searchBloodGroup} onChange={e => setSearchBloodGroup(e.target.value)} className="bb-select">
                  <option value="">All Groups</option>
                  {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="bb-search-col">
                <label>City / Location</label>
                <input className="bb-input" type="text" placeholder="Filter by city..." value={searchCity} onChange={e => setSearchCity(e.target.value)} />
              </div>
              <button className="bb-search-btn" onClick={() => { fetchDonors(); fetchRequests() }} disabled={searching}>
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>

            <div className="bb-two-col">
              <div>
                <h2 className="bb-section-title">🩸 Available Donors <span style={{fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500}}>({donors.length})</span></h2>
                {donors.length === 0 ? (
                  <div className="bb-empty">No donors found matching criteria.</div>
                ) : (
                  donors.map(d => (
                    <div key={d.id} className="bb-card">
                      <div className="bb-card-blood-badge">{d.bloodGroup}</div>
                      <div className="bb-card-info">
                        <p className="bb-card-name" title={d.fullName}>{d.fullName}</p>
                        <p className="bb-card-meta">📍 {d.city}</p>
                        <p className="bb-card-meta">📞 {d.phone}</p>
                        {d.lastDonated && <p className="bb-card-meta">📅 Last donated: {new Date(d.lastDonated).toLocaleDateString()}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div>
                <h2 className="bb-section-title">🚨 Urgent Requests <span style={{fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500}}>({requests.length})</span></h2>
                {requests.length === 0 ? (
                  <div className="bb-empty">No active requests right now.</div>
                ) : (
                  requests.map(r => (
                    <div key={r.id} className="bb-card">
                      <div className="bb-card-blood-badge" style={{ backgroundColor: urgencyColor(r.urgency), color: 'white', borderColor: 'transparent' }}>{r.bloodGroup}</div>
                      <div className="bb-card-info">
                        <p className="bb-card-name" title={r.patientName}>{r.patientName}</p>
                        <p className="bb-card-meta">🏥 {r.hospital}</p>
                        <p className="bb-card-meta">📍 {r.city}</p>
                        <p className="bb-card-meta">📞 {r.phone}</p>
                        <span className="bb-urgency-badge" style={{ backgroundColor: urgencyColor(r.urgency) }}>{urgencyLabel(r.urgency)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── DONATE TAB ── */}
        {activeTab === 'donate' && (
          <div className="bb-form-wrapper">
            <div className="bb-form-icon">🩸</div>
            <h2>Register as a Blood Donor</h2>
            <p className="bb-form-sub">Your contact info will be securely shared with patients in your city.</p>
            {donorMsg.text && (
              <div className={`ml-alert ${donorMsg.type === 'success' ? 'ml-alert-success' : 'ml-alert-error'}`}>
                {donorMsg.text}
              </div>
            )}

            <form className="bb-form" onSubmit={handleDonorSubmit}>
              <div className="bb-field">
                <label>Full Name *</label>
                <input className="bb-input" type="text" required value={donorForm.fullName} onChange={e => setDonorForm({ ...donorForm, fullName: e.target.value })} placeholder="Your full name" />
              </div>
              <div className="bb-field">
                <label>Blood Group *</label>
                <select className="bb-select" required value={donorForm.bloodGroup} onChange={e => setDonorForm({ ...donorForm, bloodGroup: e.target.value })}>
                  <option value="">-- Select --</option>
                  {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="bb-field">
                <label>Contact Phone *</label>
                <input className="bb-input" type="tel" required value={donorForm.phone} onChange={e => setDonorForm({ ...donorForm, phone: e.target.value })} placeholder="Emergency contact number" />
              </div>
              <div className="bb-field">
                <label>City / Area *</label>
                <input className="bb-input" type="text" required value={donorForm.city} onChange={e => setDonorForm({ ...donorForm, city: e.target.value })} placeholder="e.g. Dhaka, Mirpur" />
              </div>
              <div className="bb-field">
                <label>Last Donation Date (optional)</label>
                <input className="bb-input" type="date" value={donorForm.lastDonated} onChange={e => setDonorForm({ ...donorForm, lastDonated: e.target.value })} />
              </div>
              <button className="bb-submit-btn" type="submit" disabled={donorSubmitting}>
                {donorSubmitting ? 'Registering...' : '🩸 Register to Save Lives'}
              </button>
            </form>
          </div>
        )}

        {/* ── REQUEST TAB ── */}
        {activeTab === 'request' && (
          <div className="bb-form-wrapper">
            <div className="bb-form-icon" style={{ background: 'rgba(220,38,38,0.12)' }}>🚨</div>
            <h2>Post a Blood Request</h2>
            <p className="bb-form-sub">Local donors with matching blood types will be able to see your request.</p>
            {requestMsg.text && (
              <div className={`ml-alert ${requestMsg.type === 'success' ? 'ml-alert-success' : 'ml-alert-error'}`}>
                {requestMsg.text}
              </div>
            )}

            <form className="bb-form" onSubmit={handleRequestSubmit}>
              <div className="bb-field">
                <label>Patient Name *</label>
                <input className="bb-input" type="text" required value={requestForm.patientName} onChange={e => setRequestForm({ ...requestForm, patientName: e.target.value })} placeholder="Patient in need" />
              </div>
              <div className="bb-form-row">
                <div className="bb-field" style={{ flex: 1 }}>
                  <label>Blood Group *</label>
                  <select className="bb-select" required value={requestForm.bloodGroup} onChange={e => setRequestForm({ ...requestForm, bloodGroup: e.target.value })}>
                    <option value="">-- Select --</option>
                    {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="bb-field" style={{ flex: 1.5 }}>
                  <label>Urgency Level</label>
                  <select className="bb-select" value={requestForm.urgency} onChange={e => setRequestForm({ ...requestForm, urgency: e.target.value })}>
                    <option value="regular">Regular</option>
                    <option value="urgent">Urgent</option>
                    <option value="emergency">🚨 Emergency</option>
                  </select>
                </div>
              </div>
              <div className="bb-field">
                <label>Hospital Details *</label>
                <input className="bb-input" type="text" required value={requestForm.hospital} onChange={e => setRequestForm({ ...requestForm, hospital: e.target.value })} placeholder="Hospital Name & Ward/Room" />
              </div>
              <div className="bb-field">
                <label>City / Area *</label>
                <input className="bb-input" type="text" required value={requestForm.city} onChange={e => setRequestForm({ ...requestForm, city: e.target.value })} placeholder="e.g. Dhaka, Gulshan" />
              </div>
              <div className="bb-field">
                <label>Attendant Phone *</label>
                <input className="bb-input" type="tel" required value={requestForm.phone} onChange={e => setRequestForm({ ...requestForm, phone: e.target.value })} placeholder="Direct contact number" />
              </div>

              <button className="bb-submit-btn bb-submit-btn-danger" type="submit" disabled={requestSubmitting}>
                {requestSubmitting ? 'Posting Request...' : '🚨 Post Blood Request'}
              </button>
            </form>
          </div>
        )}
      </div>

      <BottomNav role="patient" />
    </div>
  )
}

export default BloodBank
