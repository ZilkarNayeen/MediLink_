import logger from '../utils/logger.js'
import express from 'express'
import { PrismaClient } from '../../generated/prisma/index.js'

const prisma = new PrismaClient()
const router = express.Router()

// GET /api/directory/hospitals?city=Dhaka
router.get('/hospitals', async (req, res) => {
  try {
    const { city, search } = req.query

    const whereClause = {}
    if (city) {
      whereClause.city = city
    }
    if (search) {
      whereClause.name = { contains: search, mode: 'insensitive' }
    }

    const hospitals = await prisma.hospital.findMany({
      where: whereClause,
      include: {
        hospitalServices: {
          include: {
            service: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return res.json({ hospitals })
  } catch (error) {
    logger.error('Fetch hospitals error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// GET /api/directory/services?type=TEST
router.get('/services', async (req, res) => {
  try {
    const { type, search, city } = req.query

    const whereClause = {}
    if (type) {
      whereClause.type = type.toUpperCase() // "TEST" or "OPERATION"
    }
    if (search) {
      whereClause.name = { contains: search, mode: 'insensitive' }
    }

    // We fetch the services and eagerly load the hospitals that provide them
    // so patients can easily see where to get a specific operation or test.
    const services = await prisma.service.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
      include: {
        hospitalServices: {
          where: { available: true },
          include: {
            hospital: true
          }
        }
      }
    })

    // If a city filter is applied, we filter out hospital mappings not in that city
    let filteredServices = services
    if (city) {
      filteredServices = services.map(s => ({
        ...s,
        hospitalServices: s.hospitalServices.filter(hs => hs.hospital.city === city)
      }))
    }

    return res.json({ services: filteredServices })
  } catch (error) {
    logger.error('Fetch services error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// GET /api/directory/hospitals/:id
router.get('/hospitals/:id', async (req, res) => {
  try {
    const { id } = req.params
    const hospital = await prisma.hospital.findUnique({
      where: { id },
      include: {
        hospitalServices: {
          include: {
            service: true
          }
        }
      }
    })

    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' })
    }

    // Sort services alphabetically within the response
    hospital.hospitalServices.sort((a, b) => a.service.name.localeCompare(b.service.name))

    return res.json({ hospital })
  } catch (error) {
    logger.error('Fetch hospital by ID error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

export default router
