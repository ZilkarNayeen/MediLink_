import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { API_BASE_URL } from '../config.js'
import { Navbar, BottomNav } from '../components/Navbar.jsx'
import { geocodeCity } from '../utils/geocode.js'
import './BloodBank.css'

// Fix default leaflet icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
})

const donorIcon = new L.DivIcon({
  className: 'bb-marker-donor',
  html: '🩸',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
})

const requestIcon = new L.DivIcon({
  className: 'bb-marker-request',
  html: '🚨',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
})

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

function BloodBank() {
  const [activeTab, setActiveTab] = useState('search') // 'search' | 'donate' | 'request'
  const [searchBloodGroup, setSearchBloodGroup] = useState('')
  const [searchCity, setSearchCity] = useState('')
  const [donors, setDonors] = useState([])
  const [requests, setRequests] = useState([])
  const [searching, setSearching] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'list' | 'map'

  const [geocodedDonors, setGeocodedDonors] = useState([])
  const [geocodedRequests, setGeocodedRequests] = useState([])

  const [donorForm, setDonorForm] = useState({ fullName: '', bloodGroup: '', phone: '', city: '', lastDonated: '' })
  const [donorSubmitting, setDonorSubmitting] = useState(false)
  const [donorMsg, setDonorMsg] = useState({ text: '', type: '' })

  const [requestForm, setRequestForm] = useState({ patientName: '', bloodGroup: '', hospital: '', city: '', phone: '', urgency: 'regular' })
  const [requestSubmitting, setRequestSubmitting] = useState(false)
  const [requestMsg, setRequestMsg] = useState({ text: '', type: '' })

  const token = localStorage.getItem('medilink_token')
  const userStr = localStorage.getItem('medilink_user')
  const currentUser = userStr ? JSON.parse(userStr) : null
  const role = currentUser ? 'patient' : 'guest'

  useEffect(() => {
    if (activeTab === 'search') {
      fetchDonors()
      fetchRequests()
    }
  }, [activeTab])

  // Geocode when donors/requests change
  useEffect(() => {
    const geocodeAll = async () => {
      // Donors
      const donMap = []
      for (const d of donors) {
        const coords = await geocodeCity(d.city)
        if (coords) donMap.push({ ...d, coordinates: coords })
      }
      setGeocodedDonors(donMap)

      // Requests
      const reqMap = []
      for (const r of requests) {
        const coords = await geocodeCity(r.city)
        if (coords) reqMap.push({ ...r, coordinates: coords })
      }
      setGeocodedRequests(reqMap)
    }

    if (donors.length > 0 || requests.length > 0) {
      geocodeAll()
    } else {
      setGeocodedDonors([])
      setGeocodedRequests([])
    }
  }, [donors, requests])

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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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

  return (
    <div className="bb-page">
      <Navbar role={role} />

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

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', gap: '0.5rem' }}>
              <button onClick={() => setViewMode('list')} className={`ml-btn ${viewMode === 'list' ? 'ml-btn-primary' : 'ml-btn-ghost'}`}>📄 List View</button>
              <button onClick={() => setViewMode('map')} className={`ml-btn ${viewMode === 'map' ? 'ml-btn-primary' : 'ml-btn-ghost'}`}>🗺️ Map View</button>
            </div>

            {viewMode === 'list' ? (
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
                          <span className="bb-urgency-badge" style={{ backgroundColor: urgencyColor(r.urgency) }}>{r.urgency}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="ml-card" style={{ padding: 0, height: '500px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <MapContainer center={[23.8103, 90.4125]} zoom={7} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                  <TileLayer 
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />
                  {geocodedDonors.map(d => (
                    <Marker key={`d-${d.id}`} position={d.coordinates} icon={donorIcon}>
                      <Popup>
                        <strong>Blood Donor</strong><br/>
                        Name: {d.fullName}<br/>
                        Group: <span style={{ color: '#dc2626', fontWeight: 'bold' }}>{d.bloodGroup}</span><br/>
                        Phone: {d.phone}
                      </Popup>
                    </Marker>
                  ))}
                  {geocodedRequests.map(r => (
                    <Marker key={`r-${r.id}`} position={r.coordinates} icon={requestIcon}>
                      <Popup>
                        <strong>Urgent Request</strong><br/>
                        Patient: {r.patientName}<br/>
                        Group: <span style={{ color: '#dc2626', fontWeight: 'bold' }}>{r.bloodGroup}</span><br/>
                        Hospital: {r.hospital}
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            )}
          </div>
        )}

        {/* ── DONATE TAB ── */}
        {activeTab === 'donate' && (
          <div className="bb-form-wrapper">
            <h2>Register as a Blood Donor</h2>
            <p className="bb-form-sub">Your contact info will be securely shared with patients in your city.</p>
            {donorMsg.text && <div className="ml-alert" style={{ backgroundColor: donorMsg.type === 'success' ? '#fee2e2' : 'var(--danger-bg)', color: donorMsg.type === 'success' ? '#991b1b' : '#DC2626' }}>{donorMsg.text}</div>}
            
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
            <h2>Post a Blood Request</h2>
            <p className="bb-form-sub">Local donors with matching blood types will be able to see your request.</p>
            {requestMsg.text && <div className="ml-alert" style={{ backgroundColor: requestMsg.type === 'success' ? '#fee2e2' : 'var(--danger-bg)', color: requestMsg.type === 'success' ? '#991b1b' : '#DC2626' }}>{requestMsg.text}</div>}
            
            <form className="bb-form" onSubmit={handleRequestSubmit}>
              <div className="bb-field">
                <label>Patient Name *</label>
                <input className="bb-input" type="text" required value={requestForm.patientName} onChange={e => setRequestForm({ ...requestForm, patientName: e.target.value })} placeholder="Patient in need" />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
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
              
              <button className="bb-submit-btn" type="submit" disabled={requestSubmitting} style={{ backgroundColor: '#dc2626' }}>
                {requestSubmitting ? 'Posting Request...' : '🚨 Post Blood Request'}
              </button>
            </form>
          </div>
        )}
      </div>
      
      <BottomNav role={role} />
    </div>
  )
}

export default BloodBank
