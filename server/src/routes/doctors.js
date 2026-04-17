import logger from '../utils/logger.js'
import express from 'express'
import { PrismaClient } from '../../generated/prisma/index.js'

const prisma = new PrismaClient()
const router = express.Router()

// ─── GET /api/doctors?search=...&specialty=... ─── Search doctors by name or specialty
router.get('/', async (req, res) => {
  try {
    const { search, specialty } = req.query

    const doctors = await prisma.user.findMany({
      where: {
        role: 'doctor',
        ...(specialty ? { specialty } : {}),
        ...(search
          ? {
              fullName: {
                contains: search,
                mode: 'insensitive',
              },
            }
          : {}),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        specialty: true,
        workingHours: true,
      },
      orderBy: { fullName: 'asc' },
      take: 20,
    })

    return res.json({ doctors })
  } catch (error) {
    logger.error('List doctors error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

export default router
