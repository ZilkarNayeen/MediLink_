import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config.js'
import { Navbar, BottomNav } from '../components/Navbar.jsx'
import './Dashboard.css' // We can remove this if no longer needed, using global classes instead

function MedicalRecords() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [addRecordModal, setAddRecordModal] = useState(false)
  const [filter, setFilter] = useState('all') // all, lab_result, xray, prescription, doctor_note, other
  const [submitting, setSubmitting] = useState(false)
  const [newRecord, setNewRecord] = useState({ title: '', recordType: 'lab_result', description: '', fileUrl: null })
  const [message, setMessage] = useState({ text: '', type: '' })

  const token = localStorage.getItem('medilink_token')

  useEffect(() => { fetchRecords() }, [])

  const fetchRecords = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/records`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setRecords(data.records || [])
    } catch { setRecords([]) } 
    finally { setLoading(false) }
  }

  const handleAddRecord = async () => {
    if (!newRecord.title || !newRecord.recordType) return
    setSubmitting(true)
    setMessage({ text: '', type: '' })
    try {
      const formData = new FormData()
      formData.append('title', newRecord.title)
      formData.append('recordType', newRecord.recordType)
      if (newRecord.description) formData.append('description', newRecord.description)
      if (newRecord.fileUrl) formData.append('document', newRecord.fileUrl)

      const res = await fetch(`${API_BASE_URL}/records`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      
      setMessage({ text: 'Record added securely!', type: 'success' })
      setAddRecordModal(false)
      setNewRecord({ title: '', recordType: 'lab_result', description: '', fileUrl: null })
      fetchRecords() 
    } catch (err) {
      setMessage({ text: err.message, type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const getRecordIcon = (type) => {
    switch(type) {
      case 'lab_result': return '🧪'
      case 'doctor_note': return '📋'
      case 'xray': return '🦴'
      case 'prescription': return '💊'
      default: return '📄'
    }
  }

  const filteredRecords = filter === 'all' ? records : records.filter(r => r.recordType === filter)

  return (
    <div className="page-wrapper" style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 'var(--bottom-nav-height)', paddingTop: 'var(--navbar-height)' }}>
      <Navbar role="patient" />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }} className="ml-fade-up">
          <div>
            <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 1.8rem)', fontWeight: 800, color: 'var(--text)', marginBottom: '0.25rem' }}>Medical Records</h1>
            <p style={{ color: 'var(--text-muted)' }}>Your comprehensive digital health history in one secure place.</p>
          </div>
          <button className="ml-btn ml-btn-primary" onClick={() => setAddRecordModal(true)}>
            + Upload Record
          </button>
        </div>

        {/* ── Filters ── */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem', scrollbarWidth: 'none' }} className="ml-fade-up">
          <button className={`ml-badge ${filter === 'all' ? 'primary' : 'neutral'}`} style={{ cursor: 'pointer', padding: '0.5rem 1rem' }} onClick={() => setFilter('all')}>All</button>
          <button className={`ml-badge ${filter === 'lab_result' ? 'primary' : 'neutral'}`} style={{ cursor: 'pointer', padding: '0.5rem 1rem' }} onClick={() => setFilter('lab_result')}>Lab Results</button>
          <button className={`ml-badge ${filter === 'xray' ? 'primary' : 'neutral'}`} style={{ cursor: 'pointer', padding: '0.5rem 1rem' }} onClick={() => setFilter('xray')}>Imaging</button>
          <button className={`ml-badge ${filter === 'prescription' ? 'primary' : 'neutral'}`} style={{ cursor: 'pointer', padding: '0.5rem 1rem' }} onClick={() => setFilter('prescription')}>Prescriptions</button>
          <button className={`ml-badge ${filter === 'doctor_note' ? 'primary' : 'neutral'}`} style={{ cursor: 'pointer', padding: '0.5rem 1rem' }} onClick={() => setFilter('doctor_note')}>Notes</button>
        </div>

        {message.text && (
          <div className="ml-alert" style={{ backgroundColor: message.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)', color: message.type === 'success' ? '#047857' : '#DC2626' }}>
            {message.text}
          </div>
        )}

        {loading && <div style={{ color: 'var(--text-muted)' }}>Loading records…</div>}

        {!loading && filteredRecords.length === 0 && (
          <div style={{ padding: '4rem 1rem', background: 'var(--surface)', border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-lg)', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', opacity: 0.6, marginBottom: '0.5rem' }}>📁</div>
            <p>No records found for this category.</p>
          </div>
        )}

        {!loading && filteredRecords.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {filteredRecords.map((r) => (
              <div key={r.id} className="ml-card ml-fade-up" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '2rem', background: 'var(--surface-3)', width: 48, height: 48, borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getRecordIcon(r.recordType)}
                  </div>
                  <span className="ml-badge ml-badge-info" style={{ fontSize: '0.7rem' }}>
                    {r.recordType.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.25rem' }}>{r.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>📅 {new Date(r.createdAt).toLocaleDateString()}</p>
                
                {r.description && <p style={{ fontSize: '0.9rem', color: 'var(--text)', marginBottom: '1rem', flex: 1 }}>{r.description}</p>}
                
                {r.fileUrl && (
                  <a href={r.fileUrl} target="_blank" rel="noreferrer" className="ml-btn ml-btn-ghost" style={{ marginTop: 'auto', justifyContent: 'center', width: '100%' }}>
                    📎 View File
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {addRecordModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setAddRecordModal(false)}>
          <div className="ml-card" style={{ width: '100%', maxWidth: 480, padding: '2rem', animation: 'ml-fadeUp 0.3s cubic-bezier(0.4,0,0.2,1)' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>Upload Record</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Add external lab results, notes, or imaging securely.</p>

            <div className="ml-field mb-1">
              <label className="ml-label">Title *</label>
              <input className="ml-input" type="text" value={newRecord.title} onChange={e => setNewRecord({...newRecord, title: e.target.value})} placeholder="e.g. Annual Blood Test" />
            </div>

            <div className="ml-field mb-1">
              <label className="ml-label">Record Type *</label>
              <select className="ml-input" value={newRecord.recordType} onChange={e => setNewRecord({...newRecord, recordType: e.target.value})}>
                <option value="lab_result">Lab Result</option>
                <option value="xray">X-Ray / Imaging</option>
                <option value="doctor_note">Doctor's Note</option>
                <option value="prescription">External Prescription</option>
                <option value="other">Other Document</option>
              </select>
            </div>

            <div className="ml-field mb-1">
              <label className="ml-label">Notes (optional)</label>
              <textarea className="ml-input" rows={3} value={newRecord.description} onChange={e => setNewRecord({...newRecord, description: e.target.value})} placeholder="Additional details..." />
            </div>

            <div className="ml-field mb-1">
              <label className="ml-label">Attachment Report</label>
              <input className="ml-input" type="file" onChange={e => setNewRecord({...newRecord, fileUrl: e.target.files[0]})} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
              <button className="ml-btn ml-btn-ghost" style={{ flex: 1 }} onClick={() => setAddRecordModal(false)}>Cancel</button>
              <button className="ml-btn ml-btn-primary" style={{ flex: 2 }} onClick={handleAddRecord} disabled={submitting || !newRecord.title}>
                {submitting ? 'Uploading…' : 'Save Record'}
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
