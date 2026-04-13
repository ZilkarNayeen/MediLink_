import { useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../config.js'
import './AuthPages.css'

function SignupPage() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: form.fullName, email: form.email, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Signup failed')
      if (data.token) localStorage.setItem('medilink_token', data.token)
      setSuccess('Account created! You can now sign in.')
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
          <div className="auth-brand-mark">⚕️</div>
          <span className="auth-brand-name">MediLink</span>
          <span className="auth-brand-tagline">Your Health, Connected</span>
        </Link>

        <h1 className="auth-heading">Create your account</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <p className="auth-error-msg">⚠️ {error}</p>}
          {success && <p className="auth-success-msg">✅ {success}</p>}

          <div className="ml-field">
            <label className="ml-label" htmlFor="signup-name">Full name</label>
            <input className="ml-input" id="signup-name" name="fullName" type="text" required placeholder="John Doe" value={form.fullName} onChange={handleChange} />
          </div>

          <div className="ml-field">
            <label className="ml-label" htmlFor="signup-email">Email address</label>
            <input className="ml-input" id="signup-email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" value={form.email} onChange={handleChange} />
          </div>

          <div className="ml-field">
            <label className="ml-label" htmlFor="signup-password">Password</label>
            <input className="ml-input" id="signup-password" name="password" type="password" autoComplete="new-password" required placeholder="Min 8 characters" value={form.password} onChange={handleChange} />
          </div>

          <div className="ml-field">
            <label className="ml-label" htmlFor="signup-confirm">Confirm password</label>
            <input className="ml-input" id="signup-confirm" name="confirmPassword" type="password" autoComplete="new-password" required placeholder="••••••••" value={form.confirmPassword} onChange={handleChange} />
          </div>

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create Account →'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>

        <div className="auth-features">
          <div className="auth-feature-item"><span className="auth-feature-icon">🔒</span><span>Secure</span></div>
          <div className="auth-feature-item"><span className="auth-feature-icon">📱</span><span>Mobile</span></div>
          <div className="auth-feature-item"><span className="auth-feature-icon">🏥</span><span>Trusted</span></div>
        </div>
      </div>
    </div>
  )
}

export default SignupPage
