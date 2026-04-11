import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config.js'
import './AuthPages.css'

function DoctorLoginPage() {
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
      const res = await fetch(`${API_BASE_URL}/auth/doctor/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Login failed')
      localStorage.setItem('medilink_doctor_token', data.token)
      localStorage.setItem('medilink_doctor_name', data.user.fullName)
      if (data.user) localStorage.setItem('medilink_doctor', JSON.stringify(data.user))
      navigate('/doctor/dashboard')
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
          <div className="auth-brand-mark" style={{ background: 'linear-gradient(135deg, #1E40AF, #0057B7)' }}>👨‍⚕️</div>
          <span className="auth-brand-name">MediLink</span>
          <span className="auth-brand-tagline">Doctor Portal</span>
        </Link>

        <h1 className="auth-heading">Doctor Sign In</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <p className="auth-error-msg">⚠️ {error}</p>}

          <div className="ml-field">
            <label className="ml-label" htmlFor="doctor-email">Email address</label>
            <input
              className="ml-input"
              id="doctor-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="doctor@hospital.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="ml-field">
            <label className="ml-label" htmlFor="doctor-password">Password</label>
            <input
              className="ml-input"
              id="doctor-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="auth-submit" style={{ background: 'linear-gradient(135deg, #1E40AF, #0057B7)' }} disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <p className="auth-footer" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
          Don't have an account? <Link to="/doctor/signup">Create one</Link>
        </p>
        <p className="auth-footer" style={{ margin: 0 }}>
          Patient? <Link to="/login">Go to Patient Login</Link>
        </p>
      </div>
    </div>
  )
}

export default DoctorLoginPage
