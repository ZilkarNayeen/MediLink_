import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { API_BASE_URL } from '../config.js'
import { Navbar, BottomNav } from '../components/Navbar.jsx'
import './Discovery.css'

const BD_CITIES = [
  'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 
  'Khulna', 'Barishal', 'Rangpur', 'Mymensingh'
]

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name A → Z' },
  { value: 'name-desc', label: 'Name Z → A' },
  { value: 'price-asc', label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'hospitals-desc', label: 'Most Available' },
]

function ServicesDirectory() {
  const [searchParams] = useSearchParams()
  const type = searchParams.get('type') || 'TEST'

  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [sort, setSort] = useState('name-asc')
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true)
      try {
        let url = `${API_BASE_URL}/directory/services?type=${type}&`
        if (search) url += `search=${encodeURIComponent(search)}&`
        if (cityFilter) url += `city=${encodeURIComponent(cityFilter)}`
        const res = await fetch(url)
        const data = await res.json()
        setServices(data.services || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    const timer = setTimeout(fetchServices, 300)
    return () => clearTimeout(timer)
  }, [search, cityFilter, type])

  const sortedServices = [...services].sort((a, b) => {
    const aMin = a.hospitalServices?.reduce((m, h) => Math.min(m, h.price), Infinity) || 0
    const bMin = b.hospitalServices?.reduce((m, h) => Math.min(m, h.price), Infinity) || 0
    if (sort === 'name-asc') return a.name.localeCompare(b.name)
    if (sort === 'name-desc') return b.name.localeCompare(a.name)
    if (sort === 'price-asc') return aMin - bMin
    if (sort === 'price-desc') return bMin - aMin
    if (sort === 'hospitals-desc') return (b.hospitalServices?.length || 0) - (a.hospitalServices?.length || 0)
    return 0
  })

  const icon = type === 'TEST' ? '🔬' : '⚕️'
  const title = type === 'TEST' ? 'Diagnostic Tests' : 'Surgical Operations'
  const subtitle = type === 'TEST'
    ? 'Compare prices for diagnostic tests across Bangladesh. Click any test to see available hospitals.'
    : 'Find hospitals equipped for major procedures and compare base costs.'

  return (
    <div className="discovery-page">
      <Navbar />

      <main className="discovery-main ml-fade-up">
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to="/discovery" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>← Back to Hub</Link>
        </div>

        <header className="discovery-header" style={{ textAlign: 'left' }}>
          <h1>{icon} {title}</h1>
          <p>{subtitle}</p>
        </header>

        {/* Toolbar */}
        <div className="dir-toolbar" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <div className="dir-search-wrap" style={{ flex: 1, minWidth: '180px' }}>
            <input 
              type="text" 
              placeholder={`Search ${title.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="dir-select" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
            <option value="">Any City in BD</option>
            {BD_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="dir-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Results count */}
        {!loading && (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 600 }}>
            {sortedServices.length} {title.toLowerCase()} found {cityFilter && `in ${cityFilter}`}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            Loading {title.toLowerCase()}...
          </div>
        ) : sortedServices.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', border: '2px dashed var(--border)', borderRadius:'16px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔍</div>
            No matches found. Try a different search or remove filters.
          </div>
        ) : (
          <div className="dir-list">
            {sortedServices.map(s => {
              const minPrice = s.hospitalServices?.reduce((m, h) => Math.min(m, h.price), Infinity)
              const maxPrice = s.hospitalServices?.reduce((m, h) => Math.max(m, 0), 0)
              const isExpanded = expandedId === s.id
              const sorted = [...(s.hospitalServices || [])].sort((a, b) => a.price - b.price)

              return (
                <div key={s.id} className="dir-item-card" style={{ cursor: 'pointer' }} onClick={() => setExpandedId(isExpanded ? null : s.id)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <h2 style={{ marginBottom: '0.35rem' }}>{s.name}</h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>{s.description}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', flexShrink: 0 }}>
                      {minPrice !== Infinity && (
                        <span style={{ fontWeight: 800, color: 'var(--primary)', background: 'rgba(0,191,165,0.08)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.95rem' }}>
                          From ৳{minPrice.toLocaleString()}
                        </span>
                      )}
                      <span className="dir-item-badge">{s.hospitalServices?.length || 0} Hospitals</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                    <span>{isExpanded ? '▲ Hide hospitals' : '▼ Show available hospitals & prices'}</span>
                  </div>

                  {isExpanded && sorted.length > 0 && (
                    <div className="dir-services-list" style={{ marginTop: '1rem' }}>
                      <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.83rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Available at {sorted.length} location{sorted.length > 1 ? 's' : ''} {cityFilter && `in ${cityFilter}`} — sorted by price
                      </h4>
                      {sorted.map(hs => (
                        <Link
                          to={`/discovery/hospitals/${hs.hospital.id}`}
                          key={hs.id}
                          className="dir-srv-row"
                          style={{ textDecoration: 'none', color: 'inherit', display: 'flex' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div style={{ flex: 1 }}>
                            <div className="dir-srv-name" style={{ color: 'var(--primary)', fontWeight: 700 }}>{hs.hospital.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📍 {hs.hospital.city} — View Hospital →</div>
                          </div>
                          <span className="dir-srv-price">৳ {hs.price.toLocaleString()}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      <BottomNav role="patient" />
    </div>
  )
}

export default ServicesDirectory
