import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config.js'
import { Navbar, BottomNav } from '../components/Navbar.jsx'
import './ConsultationHistory.css'

function ConsultationHistory() {
  const [appointments, setAppointments] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [followUps, setFollowUps] = useState([])
  const [loading, setLoading] = useState(true)
  const [followUpModal, setFollowUpModal] = useState(null)
  const [viewPrescriptionModal, setViewPrescriptionModal] = useState(null)
  const [reason, setReason] = useState('')
  const [prefDate, setPrefDate] = useState('')
  const [prefTime, setPrefTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  const token = window.localStorage.getItem('medilink_token')

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const [aptRes, precRes, fuRes] = await Promise.all([
        fetch(`${API_BASE_URL}/appointments`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/prescriptions/patient`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/follow-ups`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const aptData = await aptRes.json()
      setAppointments(aptData.appointments || [])

      const precData = await precRes.json()
      setPrescriptions(precData.prescriptions || [])

      const fuData = await fuRes.json()
      setFollowUps(fuData.followUps || [])
    } catch {
      setAppointments([])
      setPrescriptions([])
      setFollowUps([])
    } finally {
      setLoading(false)
    }
  }

  const getPrescriptionForAppt = (aptId) => {
    return prescriptions.find(p => p.appointmentId === aptId)
  }

  const getFollowUpForAppt = (aptId) => {
    return followUps.find(f => f.appointmentId === aptId)
  }

  const openFollowUpModal = (apt) => {
    setFollowUpModal(apt)
    setReason('')
    setPrefDate('')
    setPrefTime('')
    setMessage({ text: '', type: '' })
  }

  const requestFollowUp = async () => {
    if (!reason.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/follow-ups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          appointmentId: followUpModal.id,
          reason,
          preferredDate: prefDate || undefined,
          preferredTime: prefTime || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setMessage({ text: 'Follow-up request submitted successfully! Your doctor will be notified via email.', type: 'success' })
      setFollowUpModal(null)
      // Refresh follow-ups
      const fuRes = await fetch(`${API_BASE_URL}/follow-ups`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const fuData = await fuRes.json()
      setFollowUps(fuData.followUps || [])
    } catch (err) {
      setMessage({ text: err.message || 'Something went wrong.', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const getFollowUpStatusBadge = (fu) => {
    if (!fu) return null
    const statusMap = {
      pending:  { class: 'pending', label: '⏳ Follow-Up Pending', detail: 'Your follow-up request is being reviewed by your doctor.' },
      approved: { class: 'approved', label: '✅ Follow-Up Approved', detail: `Approved! Please book your follow-up appointment.${fu.preferredDate ? ` Preferred date: ${fu.preferredDate}` : ''}` },
      rejected: { class: 'rejected', label: '❌ Follow-Up Rejected', detail: 'Your doctor has declined this follow-up request.' },
    }
    return statusMap[fu.status] || null
  }

  return (
    <div className="history-page">
      <Navbar role="patient" />

      {/* ── Content ── */}
      <div className="history-container ml-fade-up">
        <h1 className="history-title">Consultation History</h1>
        <p className="history-subtitle">
          View your past appointments, prescriptions, and request follow-ups directly from any consultation.
        </p>

        {message.text && (
          <div className={`history-message ${message.type}`}>
            {message.text}
          </div>
        )}

        {loading && <div className="history-loading">Loading your consultations...</div>}

        {!loading && appointments.length === 0 && (
          <div className="history-empty">
            <div className="history-empty-icon">📋</div>
            <p>No consultations found yet.</p>
            <p>Book your first appointment to get started!</p>
          </div>
        )}

        {!loading && appointments.length > 0 && (
          <div className="history-cards">
            {appointments.map((apt) => {
              const fu = getFollowUpForAppt(apt.id)
              const fuBadge = getFollowUpStatusBadge(fu)

              return (
                <div className="history-card" key={apt.id}>
                  <div className={`history-card-accent ${apt.status}`} />
                  <div className="history-card-body">
                    <div className="history-card-header">
                      <h3 className="history-card-doctor">
                        {apt.doctorOrService || 'General Consultation'}
                      </h3>
                      <span className={`history-status ${apt.status}`}>
                        {apt.status}
                      </span>
                    </div>

                    <div className="history-card-meta">
                      <span>📅 {apt.appointmentDate}</span>
                      <span>🕐 {apt.appointmentTime}</span>
                    </div>

                    {apt.requestFor && (
                      <p className="history-card-reason">
                        <strong>Request:</strong> {apt.requestFor}
                      </p>
                    )}

                    {/* ── Follow-Up Status Badge ── */}
                    {fuBadge && (
                      <div className={`history-followup-status ${fuBadge.class}`}>
                        <span className="history-followup-label">{fuBadge.label}</span>
                        <span className="history-followup-detail">{fuBadge.detail}</span>
                      </div>
                    )}

                    <div className="history-actions">
                      {fu ? (
                        <button
                          className="history-btn disabled"
                          disabled
                          title="Follow-up already requested"
                        >
                          📋 Follow-Up {fu.status === 'pending' ? 'Pending' : fu.status === 'approved' ? 'Approved' : 'Rejected'}
                        </button>
                      ) : (
                        <button
                          className="history-btn primary"
                          onClick={() => openFollowUpModal(apt)}
                        >
                          📋 Request Follow-Up
                        </button>
                      )}
                      {getPrescriptionForAppt(apt.id) && (
                        <button
                          className="history-btn success"
                          onClick={() => setViewPrescriptionModal(getPrescriptionForAppt(apt.id))}
                        >
                          💊 View Prescription
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Follow-Up Modal ── */}
      {followUpModal && (
        <div className="history-modal-overlay" onClick={() => setFollowUpModal(null)}>
          <div className="history-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Request Follow-Up</h2>
            <p>
              From your appointment on <strong>{followUpModal.appointmentDate}</strong>
              {followUpModal.doctorOrService && <> with <strong>{followUpModal.doctorOrService}</strong></>}
            </p>

            <div className="ml-field" style={{ marginBottom: '1rem' }}>
              <label className="ml-label" htmlFor="followup-reason">Reason *</label>
              <textarea
                className="ml-input"
                id="followup-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe why you need a follow-up appointment..."
                rows={3}
              />
            </div>

            <div className="ml-field" style={{ marginBottom: '1rem' }}>
              <label className="ml-label" htmlFor="followup-date">Preferred Date (optional)</label>
              <input
                className="ml-input"
                id="followup-date"
                type="date"
                value={prefDate}
                onChange={(e) => setPrefDate(e.target.value)}
              />
            </div>

            <div className="ml-field">
              <label className="ml-label" htmlFor="followup-time">Preferred Time (optional)</label>
              <input
                className="ml-input"
                id="followup-time"
                type="time"
                value={prefTime}
                onChange={(e) => setPrefTime(e.target.value)}
              />
            </div>

            <div className="history-modal-actions">
              <button className="ml-btn ml-btn-ghost" style={{ flex: 1 }} onClick={() => setFollowUpModal(null)}>Cancel</button>
              <button 
                className="ml-btn ml-btn-primary" 
                style={{ flex: 2 }} 
                onClick={requestFollowUp} 
                disabled={submitting || !reason.trim()}
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Prescription Modal ── */}
      {viewPrescriptionModal && (
        <div className="history-modal-overlay" onClick={() => setViewPrescriptionModal(null)}>
          <div className="history-modal" onClick={(e) => e.stopPropagation()}>
            <h2>💊 Prescription Details</h2>
            <div style={{ margin: '16px 0', padding: '16px', backgroundColor: 'var(--success-bg)', borderRadius: 'var(--radius)', borderLeft: '4px solid #10B981' }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#047857' }}>{viewPrescriptionModal.medicationName}</h3>
              <p style={{ margin: '4px 0', color: 'var(--text)' }}><strong>Dosage:</strong> {viewPrescriptionModal.dosage}</p>
              <p style={{ margin: '4px 0', color: 'var(--text)' }}><strong>Frequency:</strong> {viewPrescriptionModal.frequency}</p>
              <p style={{ margin: '4px 0', color: 'var(--text)' }}><strong>Start Date:</strong> {viewPrescriptionModal.startDate}</p>
              {viewPrescriptionModal.endDate && <p style={{ margin: '4px 0', color: 'var(--text)' }}><strong>End Date:</strong> {viewPrescriptionModal.endDate}</p>}
            </div>
            
            <div className="history-modal-actions">
              <button className="ml-btn ml-btn-ghost" style={{ width: '100%' }} onClick={() => setViewPrescriptionModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
      
      <BottomNav role="patient" />
    </div>
  )
}

export default ConsultationHistory
