import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../config.js'
import { Navbar, BottomNav } from '../components/Navbar.jsx'
import './Discovery.css'

const BD_CITIES = [
  'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 
  'Khulna', 'Barishal', 'Rangpur', 'Mymensingh'
]

function HospitalsDirectory() {
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('')

  useEffect(() => {
    const fetchHopsitals = async () => {
      setLoading(true)
      try {
        let url = `${API_BASE_URL}/directory/hospitals?`
        if (search) url += `search=${encodeURIComponent(search)}&`
        if (cityFilter) url += `city=${encodeURIComponent(cityFilter)}`

        const res = await fetch(url)
        const data = await res.json()
        setHospitals(data.hospitals || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(fetchHopsitals, 300)
    return () => clearTimeout(timer)
  }, [search, cityFilter])

  return (
    <div className="discovery-page">
      <Navbar />

      <main className="discovery-main ml-fade-up">
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to="/discovery" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>← Back to Hub</Link>
        </div>

        <header className="discovery-header" style={{ textAlign: 'left' }}>
          <h1>🏥 Hospitals & Clinics</h1>
          <p>Find the best medical facilities across Bangladesh.</p>
        </header>

        <div className="dir-toolbar">
          <div className="dir-search-wrap">
            <input 
              type="text" 
              placeholder="Search hospitals by name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="dir-select" 
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          >
            <option value="">All Divisions</option>
            {BD_CITIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading hospitals...</div>
        ) : hospitals.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No hospitals found. Try adjusting your search.</div>
        ) : (
          <div className="dir-list">
            {hospitals.map(h => (
              <Link to={`/discovery/hospitals/${h.id}`} key={h.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="dir-item-card" style={{ transition: 'transform 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h2>{h.name}</h2>
                      <div className="dir-item-meta">
                        📍 {h.city} • 📞 {h.contactPhone || 'N/A'}
                      </div>
                    </div>
                    <span className="dir-item-badge">{h.hospitalServices?.length || 0} Services</span>
                  </div>
                  
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1rem' }}>
                    {h.description || h.address}
                  </p>

                  <div style={{ textAlign: 'right', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>
                    View Profile & Services →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <BottomNav role="patient" />
    </div>
  )
}

export default HospitalsDirectory
