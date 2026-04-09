import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { API_BASE_URL } from '../config.js'
import './AuthPages.css'

function AdminLoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.message || 'Login failed')
      }

      localStorage.setItem('medilink_admin_token', data.token)
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card ml-fade-up">
        <Link to="/" className="auth-brand" style={{ textDecoration: 'none' }}>
          <div className="auth-brand-mark" style={{ background: 'linear-gradient(135deg, #0f172a, #334155)', color: 'white' }}>🛡️</div>
          <span className="auth-brand-name" style={{ backgroundImage: 'linear-gradient(135deg, #334155, #0f172a)' }}>MediLink</span>
          <span className="auth-brand-tagline">Admin Portal</span>
        </Link>

        <h1 className="auth-heading">System Administrator</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <p className="auth-error-msg">⚠️ {error}</p>}

          <div className="ml-field">
            <label className="ml-label" htmlFor="admin-username">Username</label>
            <input
              className="ml-input"
              id="admin-username"
              name="username"
              type="text"
              autoComplete="username"
              required
              placeholder="Admin username"
              value={form.username}
              onChange={handleChange}
            />
          </div>

          <div className="ml-field">
            <label className="ml-label" htmlFor="admin-password">Password</label>
            <input
              className="ml-input"
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="auth-submit" style={{ background: 'var(--text)' }} disabled={submitting}>
            {submitting ? 'Authenticating...' : 'Secure Login →'}
          </button>
        </form>

        <p className="auth-footer" style={{ marginTop: '2rem' }}>
          Restricted access. Authorized personnel only.
        </p>
      </div>
    </div>
  )
}

export default AdminLoginPage
