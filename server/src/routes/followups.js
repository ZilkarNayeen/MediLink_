import express from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { notify } from '../services/notificationService.js'
import {
  followUpRequestEmail,
  followUpApprovedEmail,
  followUpRejectedEmail,
} from '../services/emailService.js'
import {
  followUpApprovedSMS,
  followUpRejectedSMS,
} from '../services/smsService.js'

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

    // ── Notify the doctor via email ──
    if (originalAppointment.doctorOrService) {
      const doctor = await prisma.user.findFirst({
        where: { fullName: originalAppointment.doctorOrService, role: 'doctor' },
      })

      if (doctor) {
        const emailData = followUpRequestEmail({
          patientName: originalAppointment.patientName,
          reason,
          preferredDate,
          preferredTime,
          originalDate: originalAppointment.appointmentDate,
        })

        notify({
          userId: doctor.id,
          type: 'follow_up_request',
          channel: 'email',
          appointmentId,
          subject: emailData.subject,
          body: `Follow-up request from ${originalAppointment.patientName}: ${reason}`,
          html: emailData.html,
          recipientEmail: doctor.email,
        }).catch(err => console.error('[NOTIFY] Follow-up request to doctor failed:', err.message))
      }
    }

    return res.status(201).json({ message: 'Follow-up request submitted', followUp })
  } catch (error) {
    console.error('Follow-up request error:', error)
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
    console.error('List follow-ups error:', error)
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
    console.error('Doctor follow-ups error:', error)
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

    // ── Notify patient of approval ──
    const doctor = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { fullName: true },
    })

    const doctorName = doctor?.fullName || 'Your Doctor'

    const emailData = followUpApprovedEmail({
      patientName: followUp.patient.fullName,
      doctorName,
    })
    const smsBody = followUpApprovedSMS({
      patientName: followUp.patient.fullName,
      doctorName,
    })

    notify({
      userId: followUp.patientId,
      type: 'follow_up_approved',
      channel: 'both',
      appointmentId: followUp.appointmentId,
      subject: emailData.subject,
      body: smsBody,
      html: emailData.html,
    }).catch(err => console.error('[NOTIFY] Follow-up approved notification failed:', err.message))

    return res.json({ message: 'Follow-up approved', followUp })
  } catch (error) {
    console.error('Approve follow-up error:', error)
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

    // ── Notify patient of rejection ──
    const doctor = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { fullName: true },
    })

    const doctorName = doctor?.fullName || 'Your Doctor'

    const emailData = followUpRejectedEmail({
      patientName: followUp.patient.fullName,
      doctorName,
    })
    const smsBody = followUpRejectedSMS({
      patientName: followUp.patient.fullName,
      doctorName,
    })

    notify({
      userId: followUp.patientId,
      type: 'follow_up_rejected',
      channel: 'both',
      appointmentId: followUp.appointmentId,
      subject: emailData.subject,
      body: smsBody,
      html: emailData.html,
    }).catch(err => console.error('[NOTIFY] Follow-up rejected notification failed:', err.message))

    return res.json({ message: 'Follow-up rejected', followUp })
  } catch (error) {
    console.error('Reject follow-up error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

export default router
