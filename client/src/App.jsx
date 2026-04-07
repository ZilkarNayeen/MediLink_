import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import BookAppointment from './pages/BookAppointment.jsx'
import ConsultationHistory from './pages/ConsultationHistory.jsx'
import MedicalRecords from './pages/MedicalRecords.jsx'
import Messages from './pages/Messages.jsx'
import MySchedule from './pages/MySchedule.jsx'
import BloodBank from './pages/BloodBank.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import AdminLoginPage from './pages/AdminLoginPage.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import DoctorLoginPage from './pages/DoctorLoginPage.jsx'
import DoctorSignupPage from './pages/DoctorSignupPage.jsx'
import DoctorDashboard from './pages/DoctorDashboard.jsx'
import DiscoveryHub from './pages/DiscoveryHub.jsx'
import HospitalsDirectory from './pages/HospitalsDirectory.jsx'
import HospitalDetails from './pages/HospitalDetails.jsx'
import ServicesDirectory from './pages/ServicesDirectory.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/appointments" element={<BookAppointment />} />
      <Route path="/consultation-history" element={<ConsultationHistory />} />
      <Route path="/records" element={<MedicalRecords />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/schedule" element={<MySchedule />} />
      <Route path="/blood-bank" element={<BloodBank />} />
      <Route path="/discovery" element={<DiscoveryHub />} />
      <Route path="/discovery/hospitals" element={<HospitalsDirectory />} />
      <Route path="/discovery/hospitals/:id" element={<HospitalDetails />} />
      <Route path="/discovery/services" element={<ServicesDirectory />} />

      {/* Admin */}
      <Route path="/admin" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />

      {/* Doctor */}
      <Route path="/doctor" element={<DoctorLoginPage />} />
      <Route path="/doctor/signup" element={<DoctorSignupPage />} />
      <Route path="/doctor/dashboard" element={<DoctorDashboard />} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
