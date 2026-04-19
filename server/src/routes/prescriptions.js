import express from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(authenticate)

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

    // Create the prescription
    const prescription = await prisma.prescription.create({
      data: {
        medicationName,
        dosage,
        frequency,
        alertTimes: [], // Will implement later
        startDate,
        endDate: endDate || null,
        appointmentId,
        patientId: appointment.userId
      }
    })

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
