import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../config.js'
import { Navbar, BottomNav } from '../components/Navbar.jsx'
import './MySchedule.css'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function parseDate(dateStr) {
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return { day: parseInt(parts[2], 10), month: MONTH_NAMES[parseInt(parts[1], 10) - 1] || '', year: parts[0] }
  }
  return { day: '', month: '', year: '' }
}

function MySchedule() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const token = localStorage.getItem('medilink_token')

  useEffect(() => {
    fetchSchedule()
  }, [])

  const fetchSchedule = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setAppointments(data.appointments || [])
    } catch {
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  const counts = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === 'pending' || a.status === 'rescheduled').length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
  }

  const filtered = filter === 'all'
    ? appointments
    : appointments.filter((a) => {
        if (filter === 'pending') return a.status === 'pending' || a.status === 'rescheduled'
        return a.status === filter
      })

  return (
    <div className="schedule-page">
      <Navbar role="patient" />

      {/* ── Summary Row ── */}
      <div className="schedule-header ml-fade-up">
        <h1 className="schedule-title">My Schedule</h1>
        <p className="schedule-subtitle">Track and manage all your upcoming and past appointments.</p>

        <div className="schedule-summary">
          <div className="summary-card">
            <div className="summary-icon total">📋</div>
            <div className="summary-info">
              <span className="summary-count">{counts.total}</span>
              <span className="summary-label">Total</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon pending">⌛</div>
            <div className="summary-info">
              <span className="summary-count">{counts.pending}</span>
              <span className="summary-label">Pending</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon confirmed">✅</div>
            <div className="summary-info">
              <span className="summary-count">{counts.confirmed}</span>
              <span className="summary-label">Confirmed</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon completed">✔️</div>
            <div className="summary-info">
              <span className="summary-count">{counts.completed}</span>
              <span className="summary-label">Completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="schedule-filters ml-fade-up" style={{ animationDelay: '0.1s' }}>
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((f) => (
          <button
            key={f}
            className={`filter-tab${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Cards ── */}
      <div className="schedule-container ml-fade-up" style={{ animationDelay: '0.2s' }}>
        {loading && <div className="schedule-loading">Loading your schedule...</div>}

        {!loading && filtered.length === 0 && (
          <div className="schedule-empty">
            <div className="schedule-empty-icon">📅</div>
            <p>No appointments found{filter !== 'all' ? ` for "${filter}"` : ''}.</p>
            <Link to="/appointments" className="ml-btn ml-btn-primary" style={{ marginTop: '1rem', textDecoration: 'none' }}>
              Book an Appointment
            </Link>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="schedule-cards">
            {filtered.map((apt) => {
              const { day, month } = parseDate(apt.appointmentDate)
              return (
                <div className="schedule-card" key={apt.id}>
                  <div className="schedule-date-block">
                    <div className="schedule-date-day">{day}</div>
                    <div className="schedule-date-month">{month}</div>
                  </div>

                  <div className="schedule-card-body">
                    <div className="schedule-card-top">
                      <h3 className="schedule-card-doctor">
                        {apt.doctorOrService || 'General Consultation'}
                      </h3>
                      <span className="schedule-card-time">🕐 {apt.appointmentTime}</span>
                    </div>
                    <div className="schedule-card-meta">
                      <span>👤 {apt.patientName}</span>
                      {apt.requestFor && <span>📝 {apt.requestFor}</span>}
                      <span>📞 {apt.contactNumber}</span>
                    </div>
                  </div>

                  <div className="schedule-status">
                    <span className={`schedule-badge ${apt.status}`}>
                      {apt.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <BottomNav role="patient" />
    </div>
  )
}

export default MySchedule
