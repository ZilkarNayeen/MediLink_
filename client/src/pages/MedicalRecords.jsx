import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config.js'
import { Navbar, BottomNav } from '../components/Navbar.jsx'
import './Dashboard.css'

// Medical records page view
function MedicalRecords() {
  // Main page data states
  const [records, setRecords] = useState([]) // List of patient records
  const [loading, setLoading] = useState(true) // Data loading status state
  const [addRecordModal, setAddRecordModal] = useState(false) // Toggle the upload modal
  const [filter, setFilter] = useState('all') // Currently active category filter
  const [submitting, setSubmitting] = useState(false) // Tracking the submission status
  
  // New record input form
  const [newRecord, setNewRecord] = useState({ 
    title: '', 
    recordType: 'lab_result', 
    description: '', 
    fileUrl: null // Currently selected file object
  })
  
  // User feedback alert messages
  const [message, setMessage] = useState({ text: '', type: '' })

  // User authentication bearer token
  const token = localStorage.getItem('medilink_token')

  // Load initial record data
  useEffect(() => { 
    fetchRecords() 
  }, [])

  // Fetch records from API
  const fetchRecords = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/records`, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
      const data = await res.json()
      setRecords(data.records || [])
    } catch (err) { 
      setRecords([]) 
    } finally { 
      setLoading(false) 
    }
  }

  // Upload a new record
  const handleAddRecord = async () => {
    // Basic form field verification
    if (!newRecord.title || !newRecord.recordType) return
    
    setSubmitting(true)
    setMessage({ text: '', type: '' })

    try {
      // Build multipart form data
      const formData = new FormData()
      formData.append('title', newRecord.title)
      formData.append('recordType', newRecord.recordType)
      if (newRecord.description) formData.append('description', newRecord.description)
      
      // Attach the binary file
      if (newRecord.fileUrl) formData.append('document', newRecord.fileUrl)

      const res = await fetch(`${API_BASE_URL}/records`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      
      // Clear the input form
      setMessage({ text: 'Record added!', type: 'success' })
      setAddRecordModal(false)
      setNewRecord({ title: '', recordType: 'lab_result', description: '', fileUrl: null })
      fetchRecords() 
    } catch (err) {
      setMessage({ text: err.message, type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  // Map icons to types
  const getRecordIcon = (type) => {
    switch(type) {
      case 'lab_result': return '🧪'
      case 'doctor_note': return '📋'
      case 'xray': return '🦴'
      case 'prescription': return '💊'
      default: return '📄'
    }
  }

  // Filter the records list
  const filteredRecords = filter === 'all' ? records : records.filter(r => r.recordType === filter)

  return (
    <div className="page-wrapper" style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 'var(--bottom-nav-height)', paddingTop: 'var(--navbar-height)' }}>
      <Navbar role="patient" />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.25rem' }}>
        {/* Main page header content */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }} className="ml-fade-up">
          <div>
            <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 1.8rem)', fontWeight: 800, color: 'var(--text)', marginBottom: '0.25rem' }}>Medical Records</h1>
            <p style={{ color: 'var(--text-muted)' }}>Secure health history log.</p>
          </div>
          <button className="ml-btn ml-btn-primary" onClick={() => setAddRecordModal(true)}>
            + Upload
          </button>
        </div>

        {/* Category filter button group */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem', scrollbarWidth: 'none' }} className="ml-fade-up">
          <button className={`ml-badge ${filter === 'all' ? 'primary' : 'neutral'}`} onClick={() => setFilter('all')}>All</button>
          <button className={`ml-badge ${filter === 'lab_result' ? 'primary' : 'neutral'}`} onClick={() => setFilter('lab_result')}>Labs</button>
          <button className={`ml-badge ${filter === 'xray' ? 'primary' : 'neutral'}`} onClick={() => setFilter('xray')}>Imaging</button>
          <button className={`ml-badge ${filter === 'prescription' ? 'primary' : 'neutral'}`} onClick={() => setFilter('prescription')}>Medics</button>
          <button className={`ml-badge ${filter === 'doctor_note' ? 'primary' : 'neutral'}`} onClick={() => setFilter('doctor_note')}>Notes</button>
        </div>

        {/* User global status alert */}
        {message.text && (
          <div className="ml-alert" style={{ backgroundColor: message.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)', color: message.type === 'success' ? '#047857' : '#DC2626' }}>
            {message.text}
          </div>
        )}

        {/* Current data loading UI */}
        {loading && <div style={{ color: 'var(--text-muted)' }}>Loading…</div>}

        {/* No record results found */}
        {!loading && filteredRecords.length === 0 && (
          <div style={{ padding: '4rem 1rem', background: 'var(--surface)', border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-lg)', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>No records found.</p>
          </div>
        )}

        {/* Medical records cards grid */}
        {!loading && filteredRecords.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {filteredRecords.map((r) => (
              <div key={r.id} className="ml-card ml-fade-up" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '2rem', background: 'var(--surface-3)', width: 48, height: 48, borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getRecordIcon(r.recordType)}
                  </div>
                  <span className="ml-badge ml-badge-info" style={{ fontSize: '0.7rem' }}>
                    {r.recordType.toUpperCase()}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.25rem' }}>{r.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{new Date(r.createdAt).toLocaleDateString()}</p>
                
                {r.description && <p style={{ fontSize: '0.9rem', color: 'var(--text)', marginBottom: '1rem', flex: 1 }}>{r.description}</p>}
                
                {/* Cloud document file link */}
                {r.fileUrl && (
                  <a href={r.fileUrl} target="_blank" rel="noreferrer" className="ml-btn ml-btn-ghost" style={{ marginTop: 'auto', justifyContent: 'center', width: '100%' }}>
                    View File
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record upload popup modal */}
      {addRecordModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setAddRecordModal(false)}>
          <div className="ml-card" style={{ width: '100%', maxWidth: 480, padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.5rem' }}>Upload Record</h2>

            <div className="ml-field mb-1">
              <label className="ml-label">Title</label>
              <input className="ml-input" type="text" value={newRecord.title} onChange={e => setNewRecord({...newRecord, title: e.target.value})} />
            </div>

            <div className="ml-field mb-1">
              <label className="ml-label">Type</label>
              <select className="ml-input" value={newRecord.recordType} onChange={e => setNewRecord({...newRecord, recordType: e.target.value})}>
                <option value="lab_result">Lab Result</option>
                <option value="xray">Imaging</option>
                <option value="doctor_note">Note</option>
                <option value="prescription">Prescription</option>
              </select>
            </div>

            <div className="ml-field mb-1">
              <label className="ml-label">File</label>
              <input className="ml-input" type="file" onChange={e => setNewRecord({...newRecord, fileUrl: e.target.files[0]})} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
              <button className="ml-btn ml-btn-ghost" style={{ flex: 1 }} onClick={() => setAddRecordModal(false)}>Cancel</button>
              <button className="ml-btn ml-btn-primary" style={{ flex: 2 }} onClick={handleAddRecord} disabled={submitting}>
                {submitting ? 'Working…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav role="patient" />
    </div>
  )
}

export default MedicalRecords
