import express from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { notify } from '../services/notificationService.js'
import { newPrescriptionEmail } from '../services/emailService.js'

const router = express.Router()

router.use(authenticate)

// ── Helper: generate alertTimes from frequency string ──
function generateAlertTimes(frequency) {
  const f = (frequency || '').toLowerCase()
  if (f.includes('once') || f.includes('1') || f.includes('daily')) {
    return ['09:00']
  }
  if (f.includes('twice') || f.includes('2')) {
    return ['09:00', '21:00']
  }
  if (f.includes('three') || f.includes('3') || f.includes('thrice')) {
    return ['08:00', '14:00', '21:00']
  }
  if (f.includes('four') || f.includes('4')) {
    return ['08:00', '12:00', '17:00', '22:00']
  }
  if (f.includes('every') && f.includes('hour')) {
    // Generate every 2 hours
    return ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
  }
  // Default: once daily
  return ['09:00']
}

// ─── POST /api/prescriptions ─── Generate a prescription (Doctor only)
router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can write prescriptions' })
    }

    const {
      appointmentId,
      medicationName,
      dosage,
      frequency,
      startDate,
      endDate,
    } = req.body

    if (!appointmentId || !medicationName || !dosage || !frequency || !startDate) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    // Verify appointment exists and belongs to the current doctor
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { user: true } // get patient details
    })

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' })
    }

    // Auto-generate alert times from frequency
    const alertTimes = generateAlertTimes(frequency)

    // Create the prescription
    const prescription = await prisma.prescription.create({
      data: {
        medicationName,
        dosage,
        frequency,
        alertTimes,
        startDate,
        endDate: endDate || null,
        appointmentId,
        patientId: appointment.userId
      }
    })

    // ── Notify patient about new prescription ──
    const doctor = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { fullName: true },
    })

    const emailData = newPrescriptionEmail({
      patientName: appointment.user.fullName,
      doctorName: doctor?.fullName || 'Your Doctor',
      medicationName,
      dosage,
      frequency,
      startDate,
      endDate,
    })

    notify({
      userId: appointment.userId,
      type: 'new_prescription',
      channel: 'both',
      appointmentId,
      subject: emailData.subject,
      body: `MediLink: New prescription — ${medicationName} (${dosage}), ${frequency}. Start: ${startDate}. Check MediLink for details.`,
      html: emailData.html,
      recipientEmail: appointment.user.email,
      recipientPhone: appointment.user.phone,
    }).catch(err => console.error('[NOTIFY] Prescription notification failed:', err.message))

    return res.status(201).json({ message: 'Prescription generated successfully', prescription })
  } catch (error) {
    console.error('Create prescription error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// ─── GET /api/prescriptions/patient ─── Get prescriptions for logged-in patient
router.get('/patient', async (req, res) => {
  try {
    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: req.user.userId },
      include: { appointment: true },
      orderBy: { createdAt: 'desc' }
    })

    return res.json({ prescriptions })
  } catch (error) {
    console.error('List prescriptions error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// ─── GET /api/prescriptions/appointment/:id ─── Get prescriptions for a specific appointment
router.get('/appointment/:id', async (req, res) => {
  try {
    const prescriptions = await prisma.prescription.findMany({
      where: { appointmentId: req.params.id },
      orderBy: { createdAt: 'desc' }
    })

    return res.json({ prescriptions })
  } catch (error) {
    console.error('List appointment prescriptions error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

export default router
