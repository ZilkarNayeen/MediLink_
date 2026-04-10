import { Link } from 'react-router-dom'
import { Navbar, BottomNav } from '../components/Navbar.jsx'
import './Discovery.css'

const HUB_ITEMS = [
  {
    to: '/discovery/hospitals',
    icon: '🏥',
    title: 'Hospitals & Clinics',
    desc: 'Browse top-rated medical facilities by city across all 8 Bangladesh divisions.',
    badge: 'Browse',
    color: 'rgba(59,130,246,0.15)',
    borderColor: 'rgba(59,130,246,0.3)',
    iconBg: 'rgba(59,130,246,0.1)',
  },
  {
    to: '/discovery/services?type=TEST',
    icon: '🔬',
    title: 'Diagnostic Tests',
    desc: 'Compare prices for blood tests, MRI, CT scans, ECG, ultrasounds and more.',
    badge: 'Tests',
    color: 'rgba(16,185,129,0.15)',
    borderColor: 'rgba(16,185,129,0.3)',
    iconBg: 'rgba(16,185,129,0.1)',
  },
  {
    to: '/discovery/services?type=OPERATION',
    icon: '⚕️',
    title: 'Surgical Operations',
    desc: 'Find hospitals equipped for major procedures. Compare base operation costs.',
    badge: 'Surgery',
    color: 'rgba(239,68,68,0.15)',
    borderColor: 'rgba(239,68,68,0.3)',
    iconBg: 'rgba(239,68,68,0.1)',
  },
  {
    to: '/blood-bank',
    icon: '🩸',
    title: 'Blood Bank',
    desc: 'Find live compatible blood donors near you or submit urgent blood requests.',
    badge: 'Urgent',
    color: 'rgba(225,29,72,0.15)',
    borderColor: 'rgba(225,29,72,0.3)',
    iconBg: 'rgba(225,29,72,0.1)',
  },
  {
    to: '/appointments',
    icon: '👨‍⚕️',
    title: 'Find a Specialist',
    desc: 'Search by specialty or doctor name and book a secure online or in-person consultation.',
    badge: 'Book',
    color: 'rgba(139,92,246,0.15)',
    borderColor: 'rgba(139,92,246,0.3)',
    iconBg: 'rgba(139,92,246,0.1)',
  },
  {
    to: '/messages',
    icon: '💬',
    title: 'Chat with Your Doctor',
    desc: 'Encrypted direct messaging with your assigned physician. Attach files and images.',
    badge: 'Secure',
    color: 'rgba(14,165,233,0.15)',
    borderColor: 'rgba(14,165,233,0.3)',
    iconBg: 'rgba(14,165,233,0.1)',
  },
]

function DiscoveryHub() {
  return (
    <div className="discovery-page">
      <Navbar />

      <main className="discovery-main ml-fade-up">
        <header className="discovery-header" style={{ textAlign: 'left' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            🇧🇩 Bangladesh Medical Directory
          </span>
          <h1 style={{ marginTop: '0.5rem' }}>What are you looking for?</h1>
          <p>Your central hub to discover hospitals, compare test prices, and connect with specialists.</p>
        </header>

        <div className="discovery-hub-grid">
          {HUB_ITEMS.map(item => (
            <Link to={item.to} key={item.to} className="discovery-hub-card" style={{
              borderColor: item.borderColor,
              background: item.color,
            }}>
              <div className="discovery-hub-icon" style={{ background: item.iconBg }}>
                {item.icon}
              </div>
              <div className="discovery-hub-content">
                <div className="discovery-hub-badge">{item.badge}</div>
                <h2>{item.title}</h2>
                <p>{item.desc}</p>
              </div>
              <div className="discovery-hub-arrow">→</div>
            </Link>
          ))}
        </div>

        {/* Quick tip */}
        <div style={{
          marginTop: '2rem', padding: '1.25rem', borderRadius: '12px',
          background: 'var(--surface)', border: '1px solid var(--border)',
          display: 'flex', gap: '1rem', alignItems: 'flex-start'
        }}>
          <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>💡</span>
          <div>
            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Pro Tip</strong>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Click any Hospital card to view its <strong>full profile</strong> — including all available tests, operations, and exact pricing. You can then book directly from that page.
            </span>
          </div>
        </div>
      </main>

      <BottomNav role="patient" />
    </div>
  )
}

export default DiscoveryHub
