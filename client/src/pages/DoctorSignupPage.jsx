import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config.js'
import './AuthPages.css'

function DoctorSignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', specialty: '' })
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
      const res = await fetch(`${API_BASE_URL}/auth/doctor/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: form.fullName, email: form.email, password: form.password, specialty: form.specialty }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Signup failed')
      setSuccess('Account created! You can now sign in as a doctor.')
      setTimeout(() => navigate('/doctor'), 2000)
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

        <h1 className="auth-heading">Join MediLink Network</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <p className="auth-error-msg">⚠️ {error}</p>}
          {success && <p className="auth-success-msg">✅ {success}</p>}

          <div className="ml-field">
            <label className="ml-label" htmlFor="doc-signup-name">Full Name</label>
            <input className="ml-input" id="doc-signup-name" name="fullName" type="text" required placeholder="Dr. Jane Doe" value={form.fullName} onChange={handleChange} />
          </div>

          <div className="ml-field">
            <label className="ml-label" htmlFor="doc-signup-specialty">Specialty</label>
            <input className="ml-input" id="doc-signup-specialty" name="specialty" type="text" required placeholder="e.g. Cardiologist" value={form.specialty} onChange={handleChange} />
          </div>

          <div className="ml-field">
            <label className="ml-label" htmlFor="doc-signup-email">Provider Email</label>
            <input className="ml-input" id="doc-signup-email" name="email" type="email" required placeholder="jane@hospital.com" value={form.email} onChange={handleChange} />
          </div>

          <div className="ml-field">
            <label className="ml-label" htmlFor="doc-signup-password">Password</label>
            <input className="ml-input" id="doc-signup-password" name="password" type="password" required placeholder="Min 8 characters" value={form.password} onChange={handleChange} />
          </div>

          <div className="ml-field">
            <label className="ml-label" htmlFor="doc-signup-confirm">Confirm password</label>
            <input className="ml-input" id="doc-signup-confirm" name="confirmPassword" type="password" required placeholder="••••••••" value={form.confirmPassword} onChange={handleChange} />
          </div>

          <button type="submit" className="auth-submit" style={{ background: 'linear-gradient(135deg, #1E40AF, #0057B7)' }} disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create Provider Account →'}
          </button>
        </form>

        <p className="auth-footer" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
          Already registered? <Link to="/doctor">Sign in</Link>
        </p>
        <p className="auth-footer" style={{ margin: 0 }}>
          Patient? <Link to="/signup">Go to Patient Signup</Link>
        </p>
      </div>
    </div>
  )
}

export default DoctorSignupPage
