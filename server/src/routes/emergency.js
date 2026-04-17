import logger from '../utils/logger.js'
import express from 'express'
import { PrismaClient } from '../../generated/prisma/index.js'
import { authenticate } from '../middleware/authMiddleware.js'

const prisma = new PrismaClient()
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

    // In a real world app, this would dispatch WebSocket events to hospital admins
    // For now, logging will mimic the dispatch process.
    console.log(`EMERGENCY SOS RECEIVED: User ${req.user.userId} at [${latitude}, ${longitude}]`)

    return res.status(201).json({ message: 'Emergency SOS Dispatched successfully!', emergencyId: emergency.id })
  } catch (error) {
    logger.error('Create emergency error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// ─── GET /api/emergency/active ─── (Admin/Hospital feature to view dispatched ambulances)
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
    logger.error('List emergencies error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// ─── POST /api/emergency/:id/resolve ─── (Admin feature to acknowledge/resolve SOS)
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
    logger.error('Resolve emergency error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

export default router
