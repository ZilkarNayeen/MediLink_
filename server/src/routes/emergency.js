import express from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(authenticate)

// ─── POST /api/emergency ─── Patient requests an ambulance
router.post('/', async (req, res) => {
  try {
    const { latitude, longitude } = req.body

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'GPS coordinates are required for an SOS emergency request.' })
    }

    const emergency = await prisma.emergencyRequest.create({
      data: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        userId: req.user.userId,
      }
    })

    console.log(`EMERGENCY SOS RECEIVED: User ${req.user.userId} at [${latitude}, ${longitude}]`)

    return res.status(201).json({ message: 'Emergency SOS Dispatched successfully!', emergencyId: emergency.id })
  } catch (error) {
    console.error('Create emergency error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// ─── GET /api/emergency/active ─── Admin views all pending SOS signals
router.get('/active', async (req, res) => {
  try {
    if (req.user.role === 'patient') {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    const emergencies = await prisma.emergencyRequest.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' }
    })

    return res.json({ emergencies })
  } catch (error) {
    console.error('List emergencies error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// ─── POST /api/emergency/:id/resolve ─── Admin acknowledges & resolves an SOS
router.post('/:id/resolve', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can resolve emergencies.' })
    }

    const { id } = req.params

    const emergency = await prisma.emergencyRequest.update({
      where: { id },
      data: { status: 'RESOLVED' }
    })

    return res.json({ message: 'Emergency marked as resolved', emergency })
  } catch (error) {
    console.error('Resolve emergency error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// ─── GET /api/emergency/stats ─── Admin stats: count of emergencies
router.get('/stats', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    const [patients, doctors, appointments, emergencies] = await Promise.all([
      prisma.user.count({ where: { role: 'patient' } }),
      prisma.user.count({ where: { role: 'doctor' } }),
      prisma.appointment.count(),
      prisma.emergencyRequest.count(),
    ])

    const recentPatients = await prisma.user.findMany({
      where: { role: 'patient' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, fullName: true, email: true, createdAt: true }
    })

    return res.json({
      stats: { patients, doctors, appointments, emergencies },
      recentPatients
    })
  } catch (error) {
    console.error('Stats error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

export default router
