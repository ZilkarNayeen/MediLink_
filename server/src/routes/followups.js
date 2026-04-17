import logger from '../utils/logger.js'
import express from 'express'
import { PrismaClient } from '../../generated/prisma/index.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { sendNotification } from '../services/notificationService.js'
import {
  followUpApprovedEmail,
  followUpRequestNotifyDoctorEmail,
} from '../services/emailTemplates.js'

const prisma = new PrismaClient()
const router = express.Router()

router.use(authenticate)

// ─── POST /api/follow-ups ─── Patient requests a follow-up from a past appointment
router.post('/', async (req, res) => {
  try {
    const { appointmentId, reason, preferredDate, preferredTime } = req.body

    if (!appointmentId || !reason) {
      return res.status(400).json({ message: 'appointmentId and reason are required' })
    }

    // Verify the original appointment belongs to this patient
    const originalAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    })

    if (!originalAppointment) {
      return res.status(404).json({ message: 'Original appointment not found' })
    }

    if (originalAppointment.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const followUp = await prisma.followUpRequest.create({
      data: {
        reason,
        preferredDate: preferredDate || null,
        preferredTime: preferredTime || null,
        appointmentId,
        patientId: req.user.userId,
      },
    })

    // Notify the doctor via email
    if (originalAppointment.doctorOrService) {
      const doctor = await prisma.user.findFirst({
        where: { fullName: originalAppointment.doctorOrService, role: 'doctor' },
      })

      if (doctor) {
        const { subject, html } = followUpRequestNotifyDoctorEmail({
          patientName: originalAppointment.patientName,
          originalDate: originalAppointment.appointmentDate,
          reason,
        })

        sendNotification({ email: doctor.email, subject, html })
          .catch((err) => logger.error('Follow-up doctor notification error:', err))
      }
    }

    return res.status(201).json({ message: 'Follow-up request submitted', followUp })
  } catch (error) {
    logger.error('Follow-up request error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// ─── GET /api/follow-ups ─── List all follow-up requests for the logged-in patient
router.get('/', async (req, res) => {
  try {
    const followUps = await prisma.followUpRequest.findMany({
      where: { patientId: req.user.userId },
      include: { appointment: true },
      orderBy: { createdAt: 'desc' },
    })

    return res.json({ followUps })
  } catch (error) {
    logger.error('List follow-ups error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// ─── GET /api/follow-ups/doctor ─── Doctor sees follow-up requests for their patients
router.get('/doctor', async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can access this endpoint' })
    }

    const doctor = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { fullName: true },
    })

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' })
    }

    const followUps = await prisma.followUpRequest.findMany({
      where: {
        appointment: { doctorOrService: doctor.fullName },
      },
      include: {
        appointment: true,
        patient: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return res.json({ followUps })
  } catch (error) {
    logger.error('Doctor follow-ups error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// ─── PATCH /api/follow-ups/:id/approve ─── Doctor approves a follow-up request
router.patch('/:id/approve', async (req, res) => {
  try {
    const followUp = await prisma.followUpRequest.update({
      where: { id: req.params.id },
      data: { status: 'approved' },
      include: { patient: true, appointment: true },
    })

    // Notify the patient via email
    const { subject, html } = followUpApprovedEmail({
      patientName: followUp.patient.fullName,
      doctorOrService: followUp.appointment.doctorOrService,
      originalDate: followUp.appointment.appointmentDate,
    })

    sendNotification({ email: followUp.patient.email, subject, html })
      .catch((err) => logger.error('Follow-up approval notification error:', err))

    return res.json({ message: 'Follow-up approved', followUp })
  } catch (error) {
    logger.error('Approve follow-up error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// ─── PATCH /api/follow-ups/:id/reject ─── Doctor rejects a follow-up request
router.patch('/:id/reject', async (req, res) => {
  try {
    const followUp = await prisma.followUpRequest.update({
      where: { id: req.params.id },
      data: { status: 'rejected' },
      include: { patient: true, appointment: true },
    })

    return res.json({ message: 'Follow-up rejected', followUp })
  } catch (error) {
    logger.error('Reject follow-up error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

export default router
