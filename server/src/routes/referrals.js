import logger from '../utils/logger.js'
import express from 'express'
import { PrismaClient } from '../../generated/prisma/index.js'
import { authenticate } from '../middleware/authMiddleware.js'

const prisma = new PrismaClient()
const router = express.Router()

router.use(authenticate)

// ─── POST /api/referrals ─── Doctor refers a patient to a specialist
router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can create referrals' })
    }

    const { referredToDocId, patientId, notes } = req.body

    if (!referredToDocId || !patientId || !notes) {
      return res.status(400).json({ message: 'Missing required fields: referredToDocId, patientId, notes' })
    }

    // Validate the target doctor exists
    const targetDoctor = await prisma.user.findUnique({
      where: { id: referredToDocId },
      select: { id: true, fullName: true, specialty: true, role: true }
    })

    if (!targetDoctor || targetDoctor.role !== 'doctor') {
      return res.status(404).json({ message: 'Target specialist not found' })
    }

    const referral = await prisma.referral.create({
      data: {
        referringDocId: req.user.userId,
        referredToDocId,
        patientId,
        notes,
      }
    })

    return res.status(201).json({
      message: `Referral to ${targetDoctor.fullName} created successfully`,
      referral
    })
  } catch (error) {
    logger.error('Create referral error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// ─── GET /api/referrals ─── Doctor gets referrals they've sent
router.get('/', async (req, res) => {
  try {
    let referrals

    if (req.user.role === 'doctor') {
      referrals = await prisma.referral.findMany({
        where: { referringDocId: req.user.userId },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      // Patient can view referrals about them
      referrals = await prisma.referral.findMany({
        where: { patientId: req.user.userId },
        orderBy: { createdAt: 'desc' }
      })
    }

    // Enrich with doctor & patient names
    const docIds = [...new Set([
      ...referrals.map(r => r.referringDocId),
      ...referrals.map(r => r.referredToDocId)
    ])]
    const patientIds = [...new Set(referrals.map(r => r.patientId))]

    const users = await prisma.user.findMany({
      where: { id: { in: [...docIds, ...patientIds] } },
      select: { id: true, fullName: true, specialty: true, role: true }
    })

    const userMap = {}
    users.forEach(u => { userMap[u.id] = u })

    const enriched = referrals.map(r => ({
      ...r,
      referringDoc: userMap[r.referringDocId],
      referredToDoc: userMap[r.referredToDocId],
      patient: userMap[r.patientId],
    }))

    return res.json({ referrals: enriched })
  } catch (error) {
    logger.error('List referrals error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

export default router
