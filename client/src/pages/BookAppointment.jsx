import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { API_BASE_URL } from '../config.js'
import { Navbar, BottomNav } from '../components/Navbar.jsx'
import './BookAppointment.css'

function BookAppointment() {
  const [searchParams] = useSearchParams()
  const initialHospital = searchParams.get('hospital') || ''

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    patientName: '',
    dateOfBirth: '',
    gender: '',
    contactNumber: '',
    email: '',
    requestFor: initialHospital ? 'Hospital Inquiry' : '',
    doctorOrService: initialHospital,
    appointmentDate: '',
    appointmentTime: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // ── Doctor search state ──
  const [doctorSearch, setDoctorSearch] = useState(initialHospital)
  const [doctors, setDoctors] = useState([])
  const [selectedDocWH, setSelectedDocWH] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  // Debounced doctor search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDoctors(doctorSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [doctorSearch])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchDoctors = useCallback(async (query) => {
    try {
      setLoadingDoctors(true)
      const params = query ? `?search=${encodeURIComponent(query)}` : ''
      const res = await fetch(`${API_BASE_URL}/doctors${params}`)
      const data = await res.json()
      setDoctors(data.doctors || [])
      setHighlightIndex(-1)
    } catch {
      setDoctors([])
    } finally {
      setLoadingDoctors(false)
    }
  }, [])

  const selectDoctor = (doctor) => {
    setForm((prev) => ({ ...prev, doctorOrService: doctor.fullName }))
    setDoctorSearch(doctor.fullName)
    if (doctor.workingHours) {
      setSelectedDocWH(JSON.parse(doctor.workingHours))
    } else {
      setSelectedDocWH(null)
    }
    setShowDropdown(false)
  }

  const handleDoctorInputChange = (e) => {
    const value = e.target.value
    setDoctorSearch(value)
    setForm((prev) => ({ ...prev, doctorOrService: value }))
    setShowDropdown(true)
  }

  const handleDoctorKeyDown = (e) => {
    if (!showDropdown || doctors.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((prev) => (prev < doctors.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : doctors.length - 1))
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault()
      selectDoctor(doctors[highlightIndex])
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const validateStep1 = () => form.patientName && form.dateOfBirth && form.gender
  const validateStep2 = () => form.contactNumber && form.email
  const validateStep3 = () => {
    if (!form.doctorOrService || !form.appointmentDate || !form.appointmentTime) return false
    if (selectedDocWH) {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const dayName = days[new Date(form.appointmentDate).getDay()]
      const wh = selectedDocWH[dayName]
      if (wh?.off) return false
      
      const apptTime = form.appointmentTime
      if (apptTime < wh.start || apptTime > wh.end) return false
    }
    return true
  }

  const nextStep = () => setStep(s => s + 1)
  const prevStep = () => setStep(s => s - 1)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep3()) return
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      const token = localStorage.getItem('medilink_token')

      const response = await fetch(`${API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data?.message || 'Failed to submit appointment')

      setSuccess('Appointment request submitted successfully! Redirecting...')
      setTimeout(() => {
        setStep(1)
        setSuccess('')
        setForm({ patientName: '', dateOfBirth: '', gender: '', contactNumber: '', email: '', requestFor: '', doctorOrService: '', appointmentDate: '', appointmentTime: '' })
        setDoctorSearch('')
      }, 2500)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="booking-page">
      <Navbar role="patient" />

      <div className="booking-container">
        <div className="booking-header ml-fade-up">
          <h1 className="booking-title">Book an Appointment</h1>
          <p className="booking-sub">Fill out the details below to schedule your consultation</p>
        </div>

        {/* Stepper indicator */}
        {!success && (
          <div className="stepper ml-fade-up">
            <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>1</div>
            <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>2</div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
          </div>
        )}

        <div className="booking-card">
          {success ? (
             <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
               <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
               <h2 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>Confirmed!</h2>
               <p style={{ color: 'var(--text-muted)' }}>{success}</p>
             </div>
          ) : (
            <form className="booking-form" onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()}>
              {error && <div className="ml-alert ml-alert-error">{error}</div>}

              {/* Step 1: Patient details */}
              {step === 1 && (
                <div className="ml-fade-up">
                  <h3 className="step-title">Patient Details</h3>
                  <div className="ml-field mb-1">
                    <label className="ml-label">Patient Name</label>
                    <input className="ml-input" name="patientName" type="text" placeholder="Full name" required value={form.patientName} onChange={handleChange} />
                  </div>
                  <div className="ml-field mb-1">
                    <label className="ml-label">Date of Birth</label>
                    <input className="ml-input" name="dateOfBirth" type="date" required value={form.dateOfBirth} onChange={handleChange} />
                  </div>
                  <div className="ml-field">
                    <label className="ml-label">Gender</label>
                    <select className="ml-input" name="gender" required value={form.gender} onChange={handleChange}>
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="stepper-actions justify-end">
                    <button type="button" className="ml-btn ml-btn-primary" onClick={nextStep} disabled={!validateStep1()}>Next →</button>
                  </div>
                </div>
              )}

              {/* Step 2: Contact info */}
              {step === 2 && (
                <div className="ml-fade-up">
                  <h3 className="step-title">Contact Information</h3>
                  <div className="ml-field mb-1">
                    <label className="ml-label">Contact Number</label>
                    <input className="ml-input" name="contactNumber" type="tel" placeholder="e.g. 01XXXXXXXXX" required value={form.contactNumber} onChange={handleChange} />
                  </div>
                  <div className="ml-field mb-1">
                    <label className="ml-label">Email</label>
                    <input className="ml-input" name="email" type="email" placeholder="you@example.com" required value={form.email} onChange={handleChange} />
                  </div>
                  <div className="stepper-actions">
                    <button type="button" className="ml-btn ml-btn-ghost" onClick={prevStep}>← Back</button>
                    <button type="button" className="ml-btn ml-btn-primary" onClick={nextStep} disabled={!validateStep2()}>Next →</button>
                  </div>
                </div>
              )}

              {/* Step 3: Appointment details */}
              {step === 3 && (
                <div className="ml-fade-up">
                  <h3 className="step-title">Appointment Details</h3>
                  
                  <div className="ml-field mb-1">
                    <label className="ml-label">Request For</label>
                    <input className="ml-input" name="requestFor" type="text" placeholder="e.g. Consultation, Follow-up" value={form.requestFor} onChange={handleChange} />
                  </div>

                  <div className="ml-field mb-1 doctor-search-wrapper" ref={dropdownRef}>
                    <label className="ml-label">Doctor or Service</label>
                    <div className="doctor-input-container">
                      <input
                        className="ml-input"
                        ref={inputRef}
                        type="text"
                        placeholder="Search for a doctor..."
                        autoComplete="off"
                        value={doctorSearch}
                        onChange={handleDoctorInputChange}
                        onFocus={() => { setShowDropdown(true); if (doctors.length === 0) fetchDoctors(doctorSearch) }}
                        onKeyDown={handleDoctorKeyDown}
                      />
                      <span className="doctor-search-icon">🔍</span>
                    </div>

                    {showDropdown && (
                      <div className="doctor-dropdown">
                        {loadingDoctors && <div className="doctor-empty">Searching...</div>}
                        {!loadingDoctors && doctors.length === 0 && <div className="doctor-empty">No doctors found</div>}
                        {!loadingDoctors && doctors.map((doc, idx) => (
                          <div
                            key={doc.id}
                            className={`doctor-dropdown-item${idx === highlightIndex ? ' highlighted' : ''}`}
                            onMouseDown={() => selectDoctor(doc)}
                            onMouseEnter={() => setHighlightIndex(idx)}
                          >
                            <span className="doctor-name">{doc.fullName}</span>
                            <span className="doctor-specialty">{doc.specialty || 'General Practitioner'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }} className="mb-1">
                    <div className="ml-field" style={{ flex: 1 }}>
                      <label className="ml-label">Date</label>
                      <input className="ml-input" name="appointmentDate" type="date" required value={form.appointmentDate} onChange={handleChange} min={new Date().toISOString().split('T')[0]} />
                    </div>
                    <div className="ml-field" style={{ flex: 1 }}>
                      <label className="ml-label">Time</label>
                      <input className="ml-input" name="appointmentTime" type="time" required value={form.appointmentTime} onChange={handleChange} />
                    </div>
                  </div>
                  {selectedDocWH && form.appointmentDate && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', background: 'var(--surface)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      {(() => {
                        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                        const dayName = days[new Date(form.appointmentDate).getDay()]
                        const wh = selectedDocWH[dayName]
                        if (wh?.off) return <span style={{ color: 'var(--error)' }}>⚠️ Doctor is off on this day. Please select another date.</span>
                        
                        let timeError = false
                        if (form.appointmentTime) {
                          if (form.appointmentTime < wh.start || form.appointmentTime > wh.end) {
                            timeError = true
                          }
                        }

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span>🕒 Doctor available from <strong>{wh.start}</strong> to <strong>{wh.end}</strong></span>
                            {timeError && <span style={{ color: 'var(--error)' }}>⚠️ The selected time is outside the doctor's working hours.</span>}
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  <div className="stepper-actions">
                    <button type="button" className="ml-btn ml-btn-ghost" onClick={prevStep}>← Back</button>
                    <button type="submit" className="ml-btn ml-btn-primary" disabled={submitting || !validateStep3()}>
                      {submitting ? 'Submitting...' : 'Confirm Book'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
      <BottomNav role="patient" />
    </div>
  )
}

export default BookAppointment
