import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config.js'
import { Navbar, BottomNav } from '../components/Navbar.jsx'
import './NotificationCenter.css'

const TYPE_META = {
  confirmation:       { icon: '✅', label: 'Confirmation' },
  reminder:           { icon: '⏰', label: 'Reminder' },
  follow_up_reminder: { icon: '📋', label: 'Follow-Up' },
  follow_up:          { icon: '📋', label: 'Follow-Up' },
  medication:         { icon: '💊', label: 'Medication' },
  prescription:       { icon: '📝', label: 'Prescription' },
}

const FILTERS = [
  { key: 'all',           label: 'All' },
  { key: 'confirmation',  label: '✅ Confirmations' },
  { key: 'reminder',      label: '⏰ Reminders' },
  { key: 'follow_up',     label: '📋 Follow-Ups' },
  { key: 'medication',    label: '💊 Medications' },
]

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function NotificationCenter() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)

  const token = window.localStorage.getItem('medilink_token')

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setNotifications(data.notifications || [])
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
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
    } catch {
      // silent
    }
  }

  const markAllRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch {
      // silent
    }
  }

  const handleCardClick = (notif) => {
    if (!notif.read) markAsRead(notif.id)
    setExpandedId((prev) => (prev === notif.id ? null : notif.id))
  }

  const filtered = notifications.filter((n) => {
    if (filter === 'all') return true
    if (filter === 'follow_up') return n.type === 'follow_up' || n.type === 'follow_up_reminder'
    return n.type === filter
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="notif-page">
      <Navbar role="patient" />

      <div className="notif-container ml-fade-up">
        {/* ── Header ── */}
        <div className="notif-header">
          <div>
            <h1 className="notif-title">
              Notifications
              {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </h1>
          </div>
          {unreadCount > 0 && (
            <button className="notif-mark-all" onClick={markAllRead}>
              ✓ Mark all read
            </button>
          )}
        </div>
        <p className="notif-subtitle">
          Stay updated with appointment confirmations, reminders, medication alerts, and follow-up notifications.
        </p>

        {/* ── Filter Tabs ── */}
        <div className="notif-filters">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`notif-filter-btn ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        {loading && <div className="notif-loading">Loading notifications...</div>}

        {!loading && filtered.length === 0 && (
          <div className="notif-empty">
            <div className="notif-empty-icon">🔔</div>
            <p>No notifications yet.</p>
            <p>You'll receive updates about your appointments, medications, and follow-ups here.</p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="notif-list">
            {filtered.map((notif) => {
              const meta = TYPE_META[notif.type] || { icon: '🔔', label: 'Notification' }
              const isExpanded = expandedId === notif.id

              return (
                <div
                  key={notif.id}
                  className={`notif-card type-${notif.type} ${!notif.read ? 'unread' : ''}`}
                  onClick={() => handleCardClick(notif)}
                >
                  <div className={`notif-icon ${notif.type}`}>
                    {meta.icon}
                  </div>
                  <div className="notif-content">
                    <p className="notif-subject">{notif.subject}</p>
                    <p className="notif-body">{notif.body}</p>
                    <span className="notif-time">{timeAgo(notif.sentAt)}</span>

                    {isExpanded && (
                      <div className="notif-detail">
                        <strong>Type:</strong> {meta.label}<br />
                        <strong>Channel:</strong> {notif.channel === 'email' ? '📧 Email' : notif.channel}<br />
                        <strong>Sent:</strong> {new Date(notif.sentAt).toLocaleString()}<br />
                        <strong>Status:</strong> {notif.success ? '✅ Delivered' : `❌ Failed — ${notif.errorMsg || 'Unknown error'}`}
                      </div>
                    )}
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

export default NotificationCenter
