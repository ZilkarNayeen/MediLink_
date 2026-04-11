import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { API_BASE_URL } from '../config.js'
import { Navbar, BottomNav } from '../components/Navbar.jsx'
import './Discovery.css'

function HospitalDetails() {
  const { id } = useParams()
  const [hospital, setHospital] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchHospital = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/directory/hospitals/${id}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Failed to load hospital')
        setHospital(data.hospital)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchHospital()
  }, [id])

  if (loading) {
    return <div className="discovery-page"><Navbar /><main className="discovery-main"><p style={{ textAlign: 'center', padding: '2rem' }}>Loading hospital profile...</p></main></div>
  }
  if (error || !hospital) {
    return <div className="discovery-page"><Navbar /><main className="discovery-main"><p style={{ textAlign: 'center', color: 'var(--error)' }}>{error || 'Hospital not found'}</p></main></div>
  }

  // Pre-sort services that came from the DB
  const tests = (hospital.hospitalServices || []).filter(hs => hs.service?.type === 'TEST')
  const operations = (hospital.hospitalServices || []).filter(hs => hs.service?.type === 'OPERATION')

  return (
    <div className="discovery-page">
      <Navbar />

      <main className="discovery-main ml-fade-up">
        <div style={{ marginBottom: '1rem' }}>
          <Link to="/discovery/hospitals" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>← Back to Hospitals</Link>
        </div>

        {/* Hero Section */}
        <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '2rem', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏥</div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: 'var(--text)' }}>{hospital.name}</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            📍 {hospital.address || hospital.city}
            <br />
            📞 {hospital.contactPhone || 'N/A'}
          </p>
          <p style={{ fontSize: '0.95rem', maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
            {hospital.description}
          </p>
          <Link to={`/appointments?hospital=${encodeURIComponent(hospital.name)}`} className="doc-accept-btn" style={{ background: 'linear-gradient(135deg, #1E40AF, #0057B7)', color: 'white', padding: '0.8rem 2rem', border: 'none', borderRadius: '8px', textDecoration: 'none', display: 'inline-block', fontWeight: 600 }}>
            Book Consultation Here
          </Link>
        </div>

        {/* Directory Services */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Tests */}
          <div>
            <h2 style={{ fontSize: '1.3rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>🔬 Diagnostic Tests</h2>
            {tests.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No tests listed.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {tests.map(hs => (
                  <div key={hs.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{hs.service.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{hs.service.description}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--primary)', background: 'rgba(0,191,165,0.1)', padding: '4px 10px', borderRadius: '8px', whiteSpace: 'nowrap' }}>
                      ৳ {hs.price}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Operations */}
          <div>
            <h2 style={{ fontSize: '1.3rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>⚕️ Surgical Operations</h2>
            {operations.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No operations listed.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {operations.map(hs => (
                  <div key={hs.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{hs.service.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{hs.service.description}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--primary)', background: 'rgba(0,191,165,0.1)', padding: '4px 10px', borderRadius: '8px', whiteSpace: 'nowrap' }}>
                      ৳ {hs.price}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      <BottomNav role="patient" />
    </div>
  )
}

export default HospitalDetails
