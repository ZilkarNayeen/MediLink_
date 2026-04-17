import logger from '../utils/logger.js'
import express from 'express'
import { PrismaClient } from '../../generated/prisma/index.js'
import { authenticate } from '../middleware/authMiddleware.js'

const prisma = new PrismaClient()
const router = express.Router()

// ─── PUBLIC ROUTES ───

// GET /api/blood/donors — search donors by blood group / city
router.get('/donors', async (req, res) => {
  try {
    const { bloodGroup, city } = req.query

    const where = {}
    if (bloodGroup) where.bloodGroup = bloodGroup
    if (city) where.city = { contains: city, mode: 'insensitive' }

    const donors = await prisma.bloodDonor.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return res.json({ donors })
  } catch (error) {
    logger.error('List donors error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// POST /api/blood/donors — register as a donor (requires login)
router.post('/donors', authenticate, async (req, res) => {
  try {
    const { fullName, bloodGroup, phone, city, lastDonated } = req.body

    if (!fullName || !bloodGroup || !phone || !city) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const donor = await prisma.bloodDonor.create({
      data: {
        fullName,
        bloodGroup,
        phone,
        city,
        lastDonated: lastDonated ? new Date(lastDonated) : null,
      }
    })

    return res.status(201).json({ message: 'Registered as blood donor successfully!', donor })
  } catch (error) {
    logger.error('Create donor error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// GET /api/blood/requests — view open blood requests
router.get('/requests', async (req, res) => {
  try {
    const { bloodGroup, city } = req.query

    const where = { status: 'open' }
    if (bloodGroup) where.bloodGroup = bloodGroup
    if (city) where.city = { contains: city, mode: 'insensitive' }

    const requests = await prisma.bloodRequest.findMany({
      where,
      orderBy: [{ urgency: 'desc' }, { createdAt: 'desc' }]
    })

    return res.json({ requests })
  } catch (error) {
    logger.error('List blood requests error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// POST /api/blood/requests — post a blood request (requires login)
router.post('/requests', authenticate, async (req, res) => {
  try {
    const { patientName, bloodGroup, hospital, city, phone, urgency } = req.body

    if (!patientName || !bloodGroup || !hospital || !city || !phone) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const request = await prisma.bloodRequest.create({
      data: {
        patientName,
        bloodGroup,
        hospital,
        city,
        phone,
        urgency: urgency || 'regular',
      }
    })

    return res.status(201).json({ message: 'Blood request posted!', request })
  } catch (error) {
    logger.error('Create blood request error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// PATCH /api/blood/requests/:id/close — mark request as fulfilled (authenticated)
router.patch('/requests/:id/close', authenticate, async (req, res) => {
  try {
    const updated = await prisma.bloodRequest.update({
      where: { id: req.params.id },
      data: { status: 'fulfilled' }
    })
    return res.json({ message: 'Request marked as fulfilled', request: updated })
  } catch (error) {
    logger.error('Close blood request error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

export default router
