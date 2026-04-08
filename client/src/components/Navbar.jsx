import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../ThemeContext.jsx'
import './Navbar.css'

/* ── Top Navbar (sticky, all screen sizes) ── */
export function Navbar({ role = 'patient' }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="ml-navbar">
      <div className="ml-navbar-inner">
        <Link to={role === 'doctor' ? '/doctor/dashboard' : '/dashboard'} className="ml-navbar-brand">
          <span className="ml-navbar-logo-icon">⚕️</span>
          <span className="ml-navbar-logo-text">MediLink</span>
        </Link>

        {/* Desktop links */}
        <nav className="ml-navbar-links">
          {role === 'patient' && (
            <>
              <Link to="/dashboard" className="ml-navbar-link">Home</Link>
              <Link to="/discovery" className="ml-navbar-link">Directory</Link>
              <Link to="/appointments" className="ml-navbar-link">Book</Link>
              <Link to="/consultation-history" className="ml-navbar-link">History</Link>
              <Link to="/records" className="ml-navbar-link">Records</Link>
              <Link to="/messages" className="ml-navbar-link">Messages</Link>
              <Link to="/profile" className="ml-navbar-link">Profile</Link>
            </>
          )}
          {role === 'doctor' && (
            <>
              <Link to="/doctor/dashboard" className="ml-navbar-link">Dashboard</Link>
              <Link to="/messages" className="ml-navbar-link">Messages</Link>
            </>
          )}
          {role === 'admin' && (
            <>
              <Link to="/admin/dashboard" className="ml-navbar-link">Dashboard</Link>
            </>
          )}
        </nav>

        <div className="ml-navbar-actions">
          <button onClick={toggleTheme} className="ml-theme-btn" aria-label="Toggle dark mode">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <Link
            to={role === 'doctor' ? '/doctor' : role === 'admin' ? '/admin' : '/login'}
            className="ml-navbar-logout"
            onClick={() => {
              localStorage.removeItem('medilink_token')
              localStorage.removeItem('medilink_user')
              localStorage.removeItem('medilink_doctor_token')
              localStorage.removeItem('medilink_doctor')
              localStorage.removeItem('medilink_doctor_name')
            }}
          >
            Logout
          </Link>
        </div>
      </div>
    </header>
  )
}

/* ── Bottom Tab Bar (mobile only ≤768px) ── */
const patientTabs = [
  { to: '/dashboard',            icon: '🏠', label: 'Home'     },
  { to: '/discovery',            icon: '🔍', label: 'Discovery'},
  { to: '/appointments',         icon: '📅', label: 'Book'     },
  { to: '/messages',             icon: '💬', label: 'Messages' },
  { to: '/profile',              icon: '👤', label: 'Profile'  },
]

const doctorTabs = [
  { to: '/doctor/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/messages',         icon: '💬', label: 'Messages'  },
]

const adminTabs = [
  { to: '/admin/dashboard', icon: '🛡️', label: 'Dashboard' },
]

export function BottomNav({ role = 'patient' }) {
  const location = useLocation()
  let tabs = patientTabs
  if (role === 'doctor') tabs = doctorTabs
  if (role === 'admin') tabs = adminTabs

  return (
    <nav className="ml-bottom-nav">
      {tabs.map(tab => {
        const isActive = location.pathname === tab.to ||
          (tab.to !== '/dashboard' && tab.to !== '/doctor/dashboard' && tab.to !== '/admin/dashboard' && location.pathname.startsWith(tab.to))
        return (
          <Link key={tab.to} to={tab.to} className={`ml-bottom-tab ${isActive ? 'active' : ''}`}>
            <span className="ml-bottom-tab-icon">{tab.icon}</span>
            <span className="ml-bottom-tab-label">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

