import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config.js'
import './AuthPages.css'

function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Login failed')
      if (data.token) {
        localStorage.setItem('medilink_token', data.token)
        if (data.user) localStorage.setItem('medilink_user', JSON.stringify(data.user))
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card ml-fade-up">
        {/* Brand */}
        <Link to="/" className="auth-brand" style={{ textDecoration: 'none' }}>
          <div className="auth-brand-mark">⚕️</div>
          <span className="auth-brand-name">MediLink</span>
          <span className="auth-brand-tagline">Your Health, Connected</span>
        </Link>

        <h1 className="auth-heading">Welcome back</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <p className="auth-error-msg">⚠️ {error}</p>}

          <div className="ml-field">
            <label className="ml-label" htmlFor="login-email">Email address</label>
            <input
              className="ml-input"
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="ml-field">
            <label className="ml-label" htmlFor="login-password">Password</label>
            <input
              className="ml-input"
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Create one</Link>
        </p>

        <div className="auth-features">
          <div className="auth-feature-item">
            <span className="auth-feature-icon">🔒</span>
            <span>Secure</span>
          </div>
          <div className="auth-feature-item">
            <span className="auth-feature-icon">📱</span>
            <span>Mobile</span>
          </div>
          <div className="auth-feature-item">
            <span className="auth-feature-icon">🏥</span>
            <span>Trusted</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
