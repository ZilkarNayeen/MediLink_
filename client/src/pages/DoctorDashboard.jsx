import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config.js'
import { Navbar, BottomNav } from '../components/Navbar.jsx'
import './AdminPages.css'

function DoctorDashboard() {
  const doctorName = window.localStorage.getItem('medilink_doctor_name') || 'Doctor'
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMsg, setActionMsg] = useState({ text: '', type: '' })

  // Reschedule modal state
  const [rescheduleModal, setRescheduleModal] = useState(null)
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [rescheduling, setRescheduling] = useState(false)

  // Prescribe modal state
  const [prescribeModal, setPrescribeModal] = useState(null)
  const [prescriptionData, setPrescriptionData] = useState({
    medicationName: '',
    dosage: '',
    frequency: '',
    startDate: '',
    endDate: '',
  })
  const [prescribing, setPrescribing] = useState(false)

  // Referral modal state
  const [referralModal, setReferralModal] = useState(null) // stores the appointment
  const [availableDoctors, setAvailableDoctors] = useState([])
  const [referralData, setReferralData] = useState({ referredToDocId: '', notes: '' })
  const [referring, setReferring] = useState(false)

  // EHR modal state
  const [ehrModal, setEhrModal] = useState(null)
  const [ehrData, setEhrData] = useState(null)
  const [ehrRecords, setEhrRecords] = useState([])
  const [ehrLoading, setEhrLoading] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadType, setUploadType] = useState('Lab Result')
  const [uploading, setUploading] = useState(false)

  // Follow-Ups tab state
  const [activeTab, setActiveTab] = useState('appointments')
  const [followUps, setFollowUps] = useState([])
  const [loadingFollowUps, setLoadingFollowUps] = useState(true)

  // Availability / Working Hours state
  const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
  const defaultDay = { start: '09:00', end: '17:00', off: false }
  const [workingHours, setWorkingHours] = useState(() => {
    const saved = window.localStorage.getItem('medilink_doctor_wh')
    if (saved) return JSON.parse(saved)
    return DAYS.reduce((acc, d) => ({ ...acc, [d]: { ...defaultDay } }), {})
  })
  const [savingWH, setSavingWH] = useState(false)
  const [whMsg, setWhMsg] = useState('')

  const token = window.localStorage.getItem('medilink_doctor_token')
  const doctorStr = window.localStorage.getItem('medilink_doctor')
  const currentDoctor = doctorStr ? JSON.parse(doctorStr) : null

  const fetchAppointments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/doctor/all`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to load appointments')
      }

      setAppointments(data.appointments)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchFollowUps = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/follow-ups/doctor`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.message || 'Failed to load follow-ups')
      setFollowUps(data.followUps)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingFollowUps(false)
    }
  }

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data?.user?.workingHours) {
        setWorkingHours(JSON.parse(data.user.workingHours))
      }
    } catch (err) {
      console.error('Failed to load profile for working hours', err)
    }
  }

  useEffect(() => {
    fetchAppointments()
    fetchFollowUps()
    fetchProfile()
  }, [])

  // ── Accept appointment ──
  const handleAccept = async (aptId) => {
    setActionMsg({ text: '', type: '' })
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/doctor/${aptId}/accept`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      setActionMsg({ text: `Appointment confirmed! Patient has been notified.`, type: 'success' })
      // Update local state
      setAppointments((prev) =>
        prev.map((a) => (a.id === aptId ? { ...a, status: 'confirmed' } : a))
      )
    } catch (err) {
      setActionMsg({ text: err.message, type: 'error' })
    }
  }
  // ── Availability Actions ──
  const handleSaveWH = async () => {
    setSavingWH(true)
    setWhMsg('')
    try {
      const res = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ workingHours })
      })
      if (!res.ok) throw new Error('Failed to save settings')
      window.localStorage.setItem('medilink_doctor_wh', JSON.stringify(workingHours))
      setWhMsg('✅ Availability saved successfully!')
      setTimeout(() => setWhMsg(''), 3000)
    } catch (err) {
      setWhMsg('❌ ' + err.message)
    } finally {
      setSavingWH(false)
    }
  }

  const toggleDayOff = (day) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], off: !prev[day].off }
    }))
  }

  const handleTimeChange = (day, field, value) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }))
  }

  // ── Follow-Up Action ──
  const handleFollowUpAction = async (id, action) => {
    try {
      const res = await fetch(`${API_BASE_URL}/follow-ups/${id}/${action}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      setActionMsg({ text: `Follow-up request ${action}ed successfully!`, type: action === 'approve' ? 'success' : 'error' })
      setFollowUps(prev => prev.map(f => f.id === id ? { ...f, status: action === 'approve' ? 'approved' : 'rejected' } : f))
      if (action === 'approve') fetchAppointments()
    } catch (err) {
      setActionMsg({ text: err.message, type: 'error' })
    }
  }

  // ── Open reschedule modal ──
  const openReschedule = (apt) => {
    setRescheduleModal(apt)
    setNewDate(apt.appointmentDate)
    setNewTime(apt.appointmentTime)
    setActionMsg({ text: '', type: '' })
  }

  // ── Submit reschedule ──
  const handleReschedule = async () => {
    if (!newDate || !newTime) return
    setRescheduling(true)
    try {
      const res = await fetch(`${API_BASE_URL}/appointments/doctor/${rescheduleModal.id}/reschedule`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ appointmentDate: newDate, appointmentTime: newTime }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      setActionMsg({ text: `Appointment rescheduled! Patient has been notified.`, type: 'success' })
      // Update local state
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === rescheduleModal.id
            ? { ...a, appointmentDate: newDate, appointmentTime: newTime, status: 'rescheduled' }
            : a
        )
      )
      setRescheduleModal(null)
    } catch (err) {
      setActionMsg({ text: err.message, type: 'error' })
    } finally {
      setRescheduling(false)
    }
  }

  // ── Open prescribe modal ──
  const openPrescribe = (apt) => {
    setPrescribeModal(apt)
    setPrescriptionData({
      medicationName: '',
      dosage: '',
      frequency: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
    })
    setActionMsg({ text: '', type: '' })
  }

  // ── Submit prescription ──
  const handlePrescribe = async () => {
    const { medicationName, dosage, frequency, startDate } = prescriptionData
    if (!medicationName || !dosage || !frequency || !startDate) return
    
    setPrescribing(true)
    try {
      const res = await fetch(`${API_BASE_URL}/prescriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...prescriptionData, appointmentId: prescribeModal.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      setActionMsg({ text: `Prescription generated and emailed to patient!`, type: 'success' })
      setPrescribeModal(null)
    } catch (err) {
      setActionMsg({ text: err.message, type: 'error' })
    } finally {
      setPrescribing(false)
    }
  }

  // ── Open referral modal ──
  const openReferral = async (apt) => {
    setReferralModal(apt)
    setReferralData({ referredToDocId: '', notes: '' })
    setActionMsg({ text: '', type: '' })
    // Fetch all doctors to pick the specialist
    try {
      const res = await fetch(`${API_BASE_URL}/doctors`)
      const data = await res.json()
      // Exclude self
      const others = (data.doctors || []).filter(d => d.id !== currentDoctor?.id)
      setAvailableDoctors(others)
    } catch (err) {
      console.error('Failed to load doctors', err)
    }
  }

  // ── Submit referral ──
  const handleReferral = async () => {
    if (!referralData.referredToDocId || !referralData.notes.trim()) return
    setReferring(true)
    try {
      const res = await fetch(`${API_BASE_URL}/referrals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          referredToDocId: referralData.referredToDocId,
          patientId: referralModal.userId,
          notes: referralData.notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setActionMsg({ text: data.message, type: 'success' })
      setReferralModal(null)
    } catch (err) {
      setActionMsg({ text: err.message, type: 'error' })
    } finally {
      setReferring(false)
    }
  }

  // ── Open EHR Modal ──
  const openEHR = async (apt) => {
    setEhrModal(apt)
    setEhrLoading(true)
    setEhrData(null)
    setEhrRecords([])
    setActionMsg({ text: '', type: '' })
    
    try {
      const [profileRes, recordsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/profile/patient/${apt.userId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/records/patient/${apt.userId}`, { headers: { Authorization: `Bearer ${token}` } })
      ])
      
      if (profileRes.ok) {
        const prodData = await profileRes.json()
        setEhrData(prodData.profile)
      }
      if (recordsRes.ok) {
        const recData = await recordsRes.json()
        setEhrRecords(recData.records)
      }
    } catch (err) {
      console.error('Failed to load EHR', err)
    } finally {
      setEhrLoading(false)
    }
  }

  // ── Upload Record ──
  const handleUploadRecord = async (e) => {
    e.preventDefault()
    if (!uploadFile || !uploadTitle) return
    setUploading(true)

    const formData = new FormData()
    formData.append('document', uploadFile)
    formData.append('title', uploadTitle)
    formData.append('recordType', uploadType)
    formData.append('appointmentId', ehrModal.id)
    formData.append('targetPatientId', ehrModal.userId)

    try {
      const res = await fetch(`${API_BASE_URL}/records`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      
      setEhrRecords([data.record, ...ehrRecords])
      setUploadFile(null)
      setUploadTitle('')
      setActionMsg({ text: 'Record uploaded successfully to patient EHR!', type: 'success' })
    } catch (err) {
      setActionMsg({ text: err.message, type: 'error' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="doctor-dashboard-page">
      <Navbar role="doctor" />

      {/* ── Hero ── */}
      <div className="doctor-hero">
        <div className="doctor-hero-content">
          <h1 className="doctor-welcome">Welcome, Dr. {doctorName} 👨‍⚕️</h1>
          <p className="doctor-welcome-sub">Manage your patient appointments below</p>
          <div className="doctor-stats">
            <div className="doctor-stat-card">
              <div className="doctor-stat-value">{appointments.length}</div>
              <div className="doctor-stat-label">Total</div>
            </div>
            <div className="doctor-stat-card">
              <div className="doctor-stat-value">{appointments.filter(a => a.status === 'pending').length}</div>
              <div className="doctor-stat-label">Pending</div>
            </div>
            <div className="doctor-stat-card">
              <div className="doctor-stat-value">{appointments.filter(a => a.status === 'confirmed').length}</div>
              <div className="doctor-stat-label">Confirmed</div>
            </div>
          </div>
        </div>
      </div>
      <div className="doctor-content">
        <div className="doctor-tabs">
          <button
            className={`doctor-tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            Appointments
          </button>
          <button
            className={`doctor-tab-btn ${activeTab === 'followUps' ? 'active' : ''}`}
            onClick={() => setActiveTab('followUps')}
          >
            Follow-Up Queue
            {followUps.filter(f => f.status === 'pending').length > 0 && (
              <span style={{ background: 'var(--error)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', marginLeft: '6px' }}>
                {followUps.filter(f => f.status === 'pending').length}
              </span>
            )}
          </button>
          <button
            className={`doctor-tab-btn ${activeTab === 'availability' ? 'active' : ''}`}
            onClick={() => setActiveTab('availability')}
          >
            🗓️ Availability
          </button>
        </div>

        {actionMsg.text && (
          <div className={`doc-action-msg ${actionMsg.type}`}>
            {actionMsg.type === 'success' ? '✅ ' : '⚠️ '}
            {actionMsg.text}
          </div>
        )}

        {activeTab === 'appointments' && (
          <>
            {loading && <p style={{ color: 'var(--text-muted)' }}>Loading appointments…</p>}
        {error && <p className="doctor-signup-error" style={{ maxWidth: 600 }}>{error}</p>}

        {!loading && !error && appointments.length === 0 && (
          <p style={{ color: 'var(--text-muted)' }}>No appointments yet.</p>
        )}

        {!loading && appointments.length > 0 && (
          <>
            {/* Desktop Table */}
            <div className="appointments-table-wrapper">
              <table className="appointments-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Patient</th>
                    <th>Email</th>
                    <th>Contact</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Request</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((apt, i) => (
                    <tr key={apt.id}>
                      <td>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{apt.patientName}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{apt.email}</td>
                      <td>{apt.contactNumber}</td>
                      <td>{apt.appointmentDate}</td>
                      <td>{apt.appointmentTime}</td>
                      <td>{apt.requestFor || '—'}</td>
                      <td>
                        <span className={`status-badge status-${apt.status}`}>{apt.status}</span>
                      </td>
                      <td>
                        <div className="doc-actions-cell">
                          {(apt.status === 'pending' || apt.status === 'rescheduled') && (
                            <button className="doc-accept-btn" onClick={() => handleAccept(apt.id)}>✓ Accept</button>
                          )}
                          {apt.status !== 'cancelled' && (
                            <button className="doc-reschedule-btn" onClick={() => openReschedule(apt)}>📅 Reschedule</button>
                          )}
                          {apt.status === 'confirmed' && (
                            <>
                              <button className="doc-accept-btn" style={{ background: 'var(--success-bg)', color: '#059669' }} onClick={() => openPrescribe(apt)}>✍️ Prescribe</button>
                              <button className="doc-accept-btn" style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#0284c7' }} onClick={() => openEHR(apt)}>🏥 View EHR</button>
                              <button className="doc-accept-btn" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1' }} onClick={() => openReferral(apt)}>🔀 Refer</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="appointments-mobile-list">
              {appointments.map(apt => (
                <div key={apt.id} className="appt-mobile-card">
                  <div className="appt-mobile-card-header">
                    <span className="appt-mobile-card-name">{apt.patientName}</span>
                    <span className={`status-badge status-${apt.status}`}>{apt.status}</span>
                  </div>
                  <p className="appt-mobile-card-meta">📅 {apt.appointmentDate} at {apt.appointmentTime}</p>
                  <p className="appt-mobile-card-meta">📋 {apt.requestFor || 'General Consultation'}</p>
                  <div className="appt-mobile-actions">
                    {(apt.status === 'pending' || apt.status === 'rescheduled') && (
                      <button className="doc-accept-btn" onClick={() => handleAccept(apt.id)}>✓ Accept</button>
                    )}
                    {apt.status !== 'cancelled' && (
                      <button className="doc-reschedule-btn" onClick={() => openReschedule(apt)}>📅 Reschedule</button>
                    )}
                    {apt.status === 'confirmed' && (
                      <>
                        <button className="doc-accept-btn" style={{ background: 'var(--success-bg)', color: '#059669' }} onClick={() => openPrescribe(apt)}>✍️ Prescribe</button>
                        <button className="doc-accept-btn" style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#0284c7' }} onClick={() => openEHR(apt)}>🏥 View EHR</button>
                        <button className="doc-accept-btn" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1' }} onClick={() => openReferral(apt)}>🔀 Refer</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        </>
      )}

        {/* ── Follow-Up Queue Tab ── */}
        {activeTab === 'followUps' && (
          <>
            {loadingFollowUps && <p style={{ color: 'var(--text-muted)' }}>Loading follow-ups…</p>}
            {!loadingFollowUps && followUps.length === 0 && (
              <p style={{ color: 'var(--text-muted)' }}>No follow-up requests in queue.</p>
            )}
            {!loadingFollowUps && followUps.length > 0 && (
              <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {followUps.map(f => (
                  <div key={f.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{f.patient?.fullName || 'Patient'}</h3>
                      <span className={`status-badge status-${f.status}`}>{f.status}</span>
                    </div>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      <strong>Original:</strong> {f.appointment?.appointmentDate} at {f.appointment?.appointmentTime}
                    </p>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      <strong>Preferred:</strong> {f.preferredDate ? `${f.preferredDate} at ${f.preferredTime}` : 'Anytime'}
                    </p>
                    <div style={{ background: 'var(--bg-main)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', margin: '1rem 0' }}>
                      <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Reason for Follow-Up:</strong>
                      {f.reason}
                    </div>

                    {f.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <button className="doc-accept-btn" onClick={() => handleFollowUpAction(f.id, 'approve')} style={{ flex: 1 }}>
                          ✓ Approve
                        </button>
                        <button className="doc-reschedule-btn" onClick={() => handleFollowUpAction(f.id, 'reject')} style={{ flex: 1, color: 'var(--error)', background: 'var(--error-glow)' }}>
                          ✕ Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Availability Tab ── */}
        {activeTab === 'availability' && (
          <div style={{ maxWidth: '600px' }}>
            <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h2 style={{ margin: '0 0 1rem 0' }}>Working Hours</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Define your exact shift times. Patients will only be able to book 30-minute slots within these windows.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {DAYS.map(day => (
                  <div
                    key={day}
                    className="avail-day-row"
                    style={{ background: workingHours[day].off ? 'var(--bg-main)' : 'var(--surface)', color: workingHours[day].off ? 'var(--text-muted)' : 'var(--text)' }}
                  >
                    <div className="avail-day-name">{day}</div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={workingHours[day].off} onChange={() => toggleDayOff(day)} />
                      <span style={{ fontSize: '0.9rem' }}>Off</span>
                    </label>
                    {!workingHours[day].off && (
                      <div className="avail-times">
                        <input type="time" value={workingHours[day].start} onChange={(e) => handleTimeChange(day, 'start', e.target.value)} style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
                        <span>-</span>
                        <input type="time" value={workingHours[day].end} onChange={(e) => handleTimeChange(day, 'end', e.target.value)} style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border)' }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={handleSaveWH} disabled={savingWH} className="doc-accept-btn" style={{ background: 'linear-gradient(135deg, #1E40AF, #0057B7)', color: 'white', padding: '0.75rem 2rem', border: 'none', cursor: 'pointer', borderRadius: '8px' }}>
                  {savingWH ? 'Saving...' : 'Save Schedule'}
                </button>
                {whMsg && <span style={{ fontWeight: 500, color: whMsg.startsWith('✅') ? '#059669' : 'var(--error)' }}>{whMsg}</span>}
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNav role="doctor" />

      {/* ── Reschedule Modal ── */}
      {rescheduleModal && (
        <div className="doc-modal-overlay" onClick={() => setRescheduleModal(null)}>
          <div className="doc-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Reschedule Appointment</h2>
            <p className="doc-modal-sub">
              Patient: <strong>{rescheduleModal.patientName}</strong>
              <br />
              Current: <strong>{rescheduleModal.appointmentDate}</strong> at{' '}
              <strong>{rescheduleModal.appointmentTime}</strong>
            </p>

            <div className="doc-modal-field">
              <label htmlFor="reschedule-date">New Date</label>
              <input
                id="reschedule-date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>

            <div className="doc-modal-field">
              <label htmlFor="reschedule-time">New Time</label>
              <input
                id="reschedule-time"
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
            </div>

            <div className="doc-modal-actions">
              <button
                className="doc-modal-cancel"
                onClick={() => setRescheduleModal(null)}
              >
                Cancel
              </button>
              <button
                className="doc-modal-submit"
                onClick={handleReschedule}
                disabled={rescheduling || !newDate || !newTime}
              >
                {rescheduling ? 'Saving...' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Prescribe Modal ── */}
      {prescribeModal && (
        <div className="doc-modal-overlay" onClick={() => setPrescribeModal(null)}>
          <div className="doc-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Write Prescription</h2>
            <p className="doc-modal-sub">
              Patient: <strong>{prescribeModal.patientName}</strong>
            </p>

            <div className="doc-modal-field">
              <label>Medication Name *</label>
              <input
                type="text"
                value={prescriptionData.medicationName}
                onChange={(e) => setPrescriptionData({ ...prescriptionData, medicationName: e.target.value })}
                placeholder="e.g. Amoxicillin"
              />
            </div>
            
            <div className="doc-modal-field">
              <label>Dosage *</label>
              <input
                type="text"
                value={prescriptionData.dosage}
                onChange={(e) => setPrescriptionData({ ...prescriptionData, dosage: e.target.value })}
                placeholder="e.g. 500mg"
              />
            </div>

            <div className="doc-modal-field">
              <label>Frequency *</label>
              <input
                type="text"
                value={prescriptionData.frequency}
                onChange={(e) => setPrescriptionData({ ...prescriptionData, frequency: e.target.value })}
                placeholder="e.g. Twice a day after meals"
              />
            </div>

            <div className="doc-modal-field" style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label>Start Date *</label>
                <input
                  type="date"
                  value={prescriptionData.startDate}
                  onChange={(e) => setPrescriptionData({ ...prescriptionData, startDate: e.target.value })}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label>End Date</label>
                <input
                  type="date"
                  value={prescriptionData.endDate}
                  onChange={(e) => setPrescriptionData({ ...prescriptionData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="doc-modal-actions">
              <button className="doc-modal-cancel" onClick={() => setPrescribeModal(null)}>
                Cancel
              </button>
              <button
                className="doc-modal-submit"
                onClick={handlePrescribe}
                disabled={prescribing || !prescriptionData.medicationName || !prescriptionData.dosage || !prescriptionData.frequency || !prescriptionData.startDate}
              >
                {prescribing ? 'Sending...' : 'Issue & Email Prescription'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Referral Modal ── */}
      {referralModal && (
        <div className="doc-modal-overlay" onClick={() => setReferralModal(null)}>
          <div className="doc-modal" onClick={(e) => e.stopPropagation()}>
            <h2>🔀 Refer to Specialist</h2>
            <p className="doc-modal-sub">
              Patient: <strong>{referralModal.patientName}</strong>
            </p>

            <div className="doc-modal-field">
              <label>Select Specialist *</label>
              <select
                value={referralData.referredToDocId}
                onChange={(e) => setReferralData({ ...referralData, referredToDocId: e.target.value })}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="">-- Choose a specialist --</option>
                {availableDoctors.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.fullName} {doc.specialty ? `— ${doc.specialty}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="doc-modal-field">
              <label>Referral Notes *</label>
              <textarea
                rows={3}
                placeholder="Reason for referral, relevant history..."
                value={referralData.notes}
                onChange={(e) => setReferralData({ ...referralData, notes: e.target.value })}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #d1d5db', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            <div className="doc-modal-actions">
              <button className="doc-modal-cancel" onClick={() => setReferralModal(null)}>Cancel</button>
              <button
                className="doc-modal-submit"
                style={{ backgroundColor: '#6366F1' }}
                onClick={handleReferral}
                disabled={referring || !referralData.referredToDocId || !referralData.notes.trim()}
              >
                {referring ? 'Sending...' : 'Send Referral'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EHR Modal ── */}
      {ehrModal && (
        <div className="doc-modal-overlay" onClick={() => setEhrModal(null)}>
          <div className="doc-modal" style={{ maxWidth: '600px', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>🏥 Patient EHR</h2>
              <button onClick={() => setEhrModal(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
            </div>
            
            {ehrLoading ? (
               <p style={{ color: 'var(--text-muted)' }}>Loading records...</p>
            ) : (
              <div style={{ maxHeight: '65vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {ehrData && (
                  <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1rem 0' }}>{ehrData.fullName}</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.9rem' }}>
                      <div style={{ flex: '1 1 45%' }}><strong>Blood Group:</strong> {ehrData.bloodGroup || 'N/A'}</div>
                      <div style={{ flex: '1 1 45%' }}><strong>DOB:</strong> {ehrData.dateOfBirth || 'N/A'}</div>
                      <div style={{ flex: '1 1 100%', color: 'var(--error)' }}><strong>Allergies:</strong> {ehrData.allergies || 'None recorded'}</div>
                    </div>
                  </div>
                )}
                
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Upload Clinical Note</h3>
                <form onSubmit={handleUploadRecord} style={{ background: 'rgba(99,102,241,0.05)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                   <input type="text" placeholder="Record Title (e.g. Lab Results)" required value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #d1d5db' }}/>
                   <select value={uploadType} onChange={e => setUploadType(e.target.value)} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                     <option>Lab Result</option><option>Prescription</option><option>Clinical Note</option><option>Other</option>
                   </select>
                   <input type="file" required onChange={e => setUploadFile(e.target.files[0])} style={{ padding: '0.6rem', border: '1px lightly dashed #d1d5db', borderRadius: '6px' }} />
                   <button type="submit" className="doc-modal-submit" disabled={uploading} style={{ alignSelf: 'flex-start' }}>{uploading ? 'Uploading...' : 'Upload Record'}</button>
                </form>

                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Past Records</h3>
                {ehrRecords.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No records uploaded.</p> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {ehrRecords.map(rec => (
                      <div key={rec.id} style={{ padding: '1rem', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{rec.title}</strong> <span style={{ fontSize: '0.8rem', color: 'var(--primary)', background: 'var(--primary-glow)', padding: '2px 6px', borderRadius: '4px', marginLeft: '0.5rem' }}>{rec.recordType}</span>
                          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(rec.createdAt).toLocaleDateString()}</p>
                        </div>
                        {rec.fileUrl && <a href={rec.fileUrl} target="_blank" rel="noreferrer" style={{ color: '#6366F1', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>View file &rarr;</a>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {actionMsg.text && <p style={{ marginTop: '1rem', padding: '0.5rem', borderRadius: '6px', background: actionMsg.type === 'error' ? 'var(--error-glow)' : 'var(--success-bg)', color: actionMsg.type === 'error' ? 'var(--error)' : 'green' }}>{actionMsg.text}</p>}
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorDashboard
