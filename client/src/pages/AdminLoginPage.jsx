import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { API_BASE_URL } from '../config.js'
import './AdminPages.css'

function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Login failed')

      // Check if the user has admin role
      if (data.user.role !== 'admin') {
        throw new Error('Access denied. Admin credentials required.')
      }

      localStorage.setItem('medilink_admin_token', data.token)
      localStorage.setItem('medilink_admin', JSON.stringify(data.user))
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card ml-scale-in">
        <div className="admin-login-header">
          <div className="admin-login-icon">🛡️</div>
          <h1 className="admin-login-title">Admin Portal</h1>
          <p className="admin-login-subtitle">MediLink Emergency Command Center</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          {error && (
            <div className="ml-alert ml-alert-error">{error}</div>
          )}

          <div className="ml-field mb-1">
            <label className="ml-label">Email Address</label>
            <input
              className="ml-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@medilink.com"
              required
            />
          </div>

          <div className="ml-field mb-1">
            <label className="ml-label">Password</label>
            <input
              className="ml-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
            />
          </div>

          <button
            type="submit"
            className="ml-btn ml-btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating…' : '🔐 Access Admin Panel'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/login" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            ← Back to Patient Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AdminLoginPage
