import logger from '../utils/logger.js'
import express from 'express'
import { PrismaClient } from '../../generated/prisma/index.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { upload, uploadToCloudinary } from '../services/upload.js'

const prisma = new PrismaClient()
const router = express.Router()

router.use(authenticate)

// ─── GET /api/records ─── Get records for the logged-in patient
router.get('/', async (req, res) => {
  try {
    if (req.user.role === 'doctor') {
      return res.status(403).json({ message: 'Use doctor-specific routes to view patient records' })
    }
    const records = await prisma.medicalRecord.findMany({
      where: { patientId: req.user.userId },
      include: { appointment: { select: { doctorOrService: true, appointmentDate: true } } },
      orderBy: { createdAt: 'desc' }
    })
    return res.json({ records })
  } catch (error) {
    logger.error('List records error:', error)
    return res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
})

// ─── GET /api/records/patient/:id ─── Get records of a patient (Doctor only)
router.get('/patient/:id', async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can access patient records.' })
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

    const records = await prisma.medicalRecord.findMany({
      where: { patientId },
      include: { appointment: { select: { doctorOrService: true, appointmentDate: true } } },
      orderBy: { createdAt: 'desc' }
    })
    
    return res.json({ records })
  } catch (error) {
    logger.error('Doctor list patient records error:', error)
    return res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
})

// ─── POST /api/records ─── Upload a medical record
router.post('/', upload.single('document'), async (req, res) => {
  try {
    const { title, description, recordType, appointmentId, targetPatientId } = req.body

    if (!title || !recordType) {
      return res.status(400).json({ message: 'Missing required fields: title, recordType' })
    }

    let patientId = req.user.userId

    if (req.user.role === 'doctor') {
      if (!targetPatientId) {
        return res.status(400).json({ message: 'Doctors must specify a targetPatientId' })
      }
      // IDOR fix: verify the patient has an appointment with this doctor
      const doctorObj = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { fullName: true } })
      const linked = await prisma.appointment.findFirst({
        where: { userId: targetPatientId, doctorOrService: doctorObj.fullName }
      })
      if (!linked) {
        return res.status(403).json({ message: 'You can only add records for your own patients.' })
      }
      patientId = targetPatientId
    }

    // Upload file to Cloudinary if provided
    let fileUrl = null
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype)
      fileUrl = result.secure_url
    }

    const record = await prisma.medicalRecord.create({
      data: { title, description, recordType, fileUrl, appointmentId: appointmentId || null, patientId }
    })

    return res.status(201).json({ message: 'Medical record added successfully', record })
  } catch (error) {
    logger.error('Create record error:', error)
    return res.status(500).json({ message: error.message?.includes('allowed') ? error.message : 'Something went wrong.' })
  }
})

export default router
