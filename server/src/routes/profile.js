import express from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(authenticate)

// GET /api/profile — fetch current user's full profile
router.get('/', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        specialty: true,
        createdAt: true,
        workingHours: true,
      }
    })
    if (!user) return res.status(404).json({ message: 'User not found' })
    return res.json({ user })
  } catch (error) {
    console.error('Get profile error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// PUT /api/profile — update current user's profile
router.put('/', async (req, res) => {
  try {
    const { fullName, phone, specialty, workingHours } = req.body

    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        ...(fullName && { fullName }),
        ...(phone !== undefined && { phone }),
        ...(specialty !== undefined && { specialty }),
        ...(workingHours !== undefined && { workingHours: JSON.stringify(workingHours) }),
      },
      select: {
        id: true, fullName: true, email: true, phone: true,
        role: true, specialty: true, workingHours: true,
      }
    })

    return res.json({ message: 'Profile updated successfully', user: updated })
  } catch (error) {
    console.error('Update profile error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// GET /api/profile/patient/:id — Doctor fetches a specific patient's profile
router.get('/patient/:id', async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can fetch patient profiles' })
    }

    const patientId = req.params.id

    // Check if the doctor is currently treating or has treated this patient
    const doctorObj = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { fullName: true } })
    const linked = await prisma.appointment.findFirst({
      where: { userId: patientId, doctorOrService: doctorObj.fullName }
    })

    if (!linked) {
      return res.status(403).json({ message: 'Access denied: You do not have any appointments with this patient.' })
    }

    const patient = await prisma.user.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
      }
    })

    if (!patient) return res.status(404).json({ message: 'Patient not found' })
    return res.json({ profile: patient })
  } catch (error) {
    console.error('Doctor fetch patient profile error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

export default router
