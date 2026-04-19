import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config.js'
import { Navbar, BottomNav } from '../components/Navbar.jsx'
import './NotificationCenter.css'

const TYPE_ICONS = {
  appointment_confirmation: '✅',
  appointment_accepted: '🎉',
  appointment_rescheduled: '📅',
  appointment_reminder: '⏰',
  follow_up_request: '📋',
  follow_up_approved: '✅',
  follow_up_rejected: '❌',
  follow_up_reminder: '🔔',
  medication_alert: '💊',
  new_prescription: '📝',
}

const TYPE_LABELS = {
  appointment_confirmation: 'Confirmation',
  appointment_accepted: 'Accepted',
  appointment_rescheduled: 'Rescheduled',
  appointment_reminder: 'Reminder',
  follow_up_request: 'Follow-Up',
  follow_up_approved: 'Approved',
  follow_up_rejected: 'Rejected',
  follow_up_reminder: 'Follow-Up',
  medication_alert: 'Medication',
  new_prescription: 'Prescription',
}

const FILTER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'appointment', label: '📅 Appointments' },
  { key: 'follow_up', label: '📋 Follow-Ups' },
  { key: 'medication', label: '💊 Medication' },
]

function formatTime(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now - d
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function NotificationCenter() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({})

  const token = window.localStorage.getItem('medilink_token')
  const userRole = (() => {
    try {
      const payload = JSON.parse(atob(token?.split('.')[1] || ''))
      return payload.role
    } catch { return 'patient' }
  })()

  useEffect(() => {
    fetchNotifications()
  }, [page])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/notifications?page=${page}&limit=15`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setNotifications(data.notifications || [])
      setPagination(data.pagination || {})
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
    } catch (err) {
      console.error('Mark read failed:', err)
    }
  }

  const markAllRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (err) {
      console.error('Mark all read failed:', err)
    }
  }

  // Filter notifications
  const filtered = notifications.filter(n => {
    if (filter === 'all') return true
    if (filter === 'appointment') return n.type.startsWith('appointment')
    if (filter === 'follow_up') return n.type.startsWith('follow_up')
    if (filter === 'medication') return n.type === 'medication_alert' || n.type === 'new_prescription'
    return true
  })

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="notif-page">
      <Navbar role={userRole} />

      <div className="notif-container ml-fade-up">
        <h1 className="notif-title">Notifications</h1>
        <p className="notif-subtitle">
          Your appointment confirmations, reminders, and medication alerts
          {unreadCount > 0 && <> — <strong>{unreadCount} unread</strong></>}
        </p>

        {/* ── Filters & Actions ── */}
        <div className="notif-header-actions">
          <div className="notif-filters">
            {FILTER_OPTIONS.map(opt => (
              <button
                key={opt.key}
                className={`notif-filter-btn ${filter === opt.key ? 'active' : ''}`}
                onClick={() => setFilter(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <button className="notif-mark-all-btn" onClick={markAllRead}>
              ✓ Mark All Read
            </button>
          )}
        </div>

        {/* ── Loading ── */}
        {loading && <div className="notif-loading">Loading notifications...</div>}

        {/* ── Empty ── */}
        {!loading && filtered.length === 0 && (
          <div className="notif-empty">
            <div className="notif-empty-icon">🔔</div>
            <p>No notifications yet.</p>
            <p>You'll see appointment confirmations, reminders, and alerts here.</p>
          </div>
        )}

        {/* ── Notification List ── */}
        {!loading && filtered.length > 0 && (
          <div className="notif-list">
            {filtered.map(notif => (
              <div
                key={notif.id}
                className={`notif-card ${!notif.read ? 'unread' : ''}`}
                onClick={() => !notif.read && markAsRead(notif.id)}
              >
                <div className={`notif-icon ${notif.type}`}>
                  {TYPE_ICONS[notif.type] || '🔔'}
                </div>
                <div className="notif-body">
                  <p className="notif-subject">{notif.subject}</p>
                  <p className="notif-text">{notif.body}</p>
                  <div className="notif-meta">
                    <span>{formatTime(notif.sentAt)}</span>
                    <span className={`notif-channel-badge ${notif.channel}`}>
                      {notif.channel}
                    </span>
                    <span className={`notif-status ${notif.success ? 'success' : 'failed'}`}>
                      {notif.success ? '● Sent' : '● Failed'}
                    </span>
                    {TYPE_LABELS[notif.type] && (
                      <span style={{ opacity: 0.7 }}>{TYPE_LABELS[notif.type]}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {pagination.totalPages > 1 && (
          <div className="notif-pagination">
            <button
              className="notif-page-btn"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              ← Previous
            </button>
            <span className="notif-page-info">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              className="notif-page-btn"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      <BottomNav role={userRole} />
    </div>
  )
}

export default NotificationCenter
