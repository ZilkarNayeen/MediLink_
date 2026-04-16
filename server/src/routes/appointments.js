import logger from '../utils/logger.js'
import express from 'express'
import { PrismaClient } from '../../generated/prisma/index.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { sendNotification } from '../services/notificationService.js'
import { appointmentConfirmationEmail } from '../services/emailTemplates.js'

const prisma = new PrismaClient()
const router = express.Router()

// All appointment routes require authentication
router.use(authenticate)

// ─── POST /api/appointments ─── Create a new appointment
router.post('/', async (req, res) => {
  try {
    const {
      patientName,
      dateOfBirth,
      gender,
      contactNumber,
      email,
      requestFor,
      doctorOrService,
      appointmentDate,
      appointmentTime,
    } = req.body

    // Validate required fields
    if (!patientName || !dateOfBirth || !gender || !contactNumber || !email || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        message: 'Missing required fields: patientName, dateOfBirth, gender, contactNumber, email, appointmentDate, appointmentTime',
      })
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientName,
        dateOfBirth,
        gender,
        contactNumber,
        email,
        requestFor: requestFor || null,
        doctorOrService: doctorOrService || null,
        appointmentDate,
        appointmentTime,
        userId: req.user.userId,
      },
    })

    // ── Send confirmation email (fire-and-forget) ──
    const { subject, html } = appointmentConfirmationEmail({
      patientName: appointment.patientName,
      doctorOrService: appointment.doctorOrService,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
    })

    sendNotification({
      email: appointment.email,
      subject,
      html,
    }).then(() => {
      // Log the notification
      prisma.notification.create({
        data: {
          type: 'confirmation',
          channel: 'email',
          subject,
          body: `Confirmation sent for appointment on ${appointment.appointmentDate}`,
          userId: req.user.userId,
          appointmentId: appointment.id,
        },
      }).catch((err) => logger.error('Notification log error:', err))
    }).catch((err) => logger.error('Confirmation notification error:', err))

    return res.status(201).json({ message: 'Appointment created', appointment })
  } catch (error) {
    logger.error('Create appointment error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// ─── GET /api/appointments ─── List all appointments for the logged-in user
router.get('/', async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
    })

    return res.json({ appointments })
  } catch (error) {
    logger.error('List appointments error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// ─── GET /api/appointments/doctor/all ─── Appointments for this doctor only
router.get('/doctor/all', async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can access this endpoint' })
    }

    // Look up the doctor's full name from the database
    const doctor = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { fullName: true },
    })

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' })
    }

    // Only return appointments where doctorOrService matches this doctor's name
    const appointments = await prisma.appointment.findMany({
      where: { doctorOrService: doctor.fullName },
      orderBy: { createdAt: 'desc' },
    })

    return res.json({ appointments })
  } catch (error) {
    logger.error('Doctor list appointments error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// ─── GET /api/appointments/:id ─── Get a single appointment
router.get('/:id', async (req, res) => {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
    })

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' })
    }

    // Ensure the user owns this appointment
    if (appointment.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    return res.json({ appointment })
  } catch (error) {
    logger.error('Get appointment error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// ─── PUT /api/appointments/:id ─── Update an appointment
router.put('/:id', async (req, res) => {
  try {
    const existing = await prisma.appointment.findUnique({
      where: { id: req.params.id },
    })

    if (!existing) {
      return res.status(404).json({ message: 'Appointment not found' })
    }

    if (existing.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const {
      patientName,
      dateOfBirth,
      gender,
      contactNumber,
      email,
      requestFor,
      doctorOrService,
      appointmentDate,
      appointmentTime,
      status,
    } = req.body

    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data: {
        ...(patientName !== undefined && { patientName }),
        ...(dateOfBirth !== undefined && { dateOfBirth }),
        ...(gender !== undefined && { gender }),
        ...(contactNumber !== undefined && { contactNumber }),
        ...(email !== undefined && { email }),
        ...(requestFor !== undefined && { requestFor }),
        ...(doctorOrService !== undefined && { doctorOrService }),
        ...(appointmentDate !== undefined && { appointmentDate }),
        ...(appointmentTime !== undefined && { appointmentTime }),
        ...(status !== undefined && { status }),
      },
    })

    return res.json({ message: 'Appointment updated', appointment })
  } catch (error) {
    logger.error('Update appointment error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// ─── DELETE /api/appointments/:id ─── Delete an appointment
router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.appointment.findUnique({
      where: { id: req.params.id },
    })

    if (!existing) {
      return res.status(404).json({ message: 'Appointment not found' })
    }

    if (existing.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    await prisma.appointment.delete({
      where: { id: req.params.id },
    })

    return res.json({ message: 'Appointment deleted' })
  } catch (error) {
    logger.error('Delete appointment error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// ─── PATCH /api/appointments/doctor/:id/accept ─── Doctor accepts/confirms an appointment
router.patch('/doctor/:id/accept', async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can accept appointments' })
    }

    const existing = await prisma.appointment.findUnique({
      where: { id: req.params.id },
    })

    if (!existing) {
      return res.status(404).json({ message: 'Appointment not found' })
    }

    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status: 'confirmed' },
    })

    // Notify the patient
    sendNotification({
      email: appointment.email,
      subject: '✅ Appointment Confirmed — MediLink',
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#10B981,#059669);padding:24px;color:white;text-align:center;">
            <h1 style="margin:0;font-size:24px;">✅ Appointment Confirmed</h1>
          </div>
          <div style="padding:24px;">
            <p>Hello <strong>${appointment.patientName}</strong>,</p>
            <p>Your appointment has been <strong style="color:#059669;">confirmed</strong> by your doctor.</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
              <tr><td style="padding:8px;color:#6b7280;">Date</td><td style="padding:8px;font-weight:600;">${appointment.appointmentDate}</td></tr>
              <tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;">Time</td><td style="padding:8px;font-weight:600;">${appointment.appointmentTime}</td></tr>
              <tr><td style="padding:8px;color:#6b7280;">Doctor / Service</td><td style="padding:8px;font-weight:600;">${appointment.doctorOrService || 'General'}</td></tr>
            </table>
            <p style="color:#6b7280;font-size:14px;">Please arrive 10 minutes early.</p>
          </div>
          <div style="background:#f9fafb;padding:16px;text-align:center;font-size:12px;color:#9ca3af;">&copy; MediLink Healthcare</div>
        </div>
      `,
    }).catch((err) => logger.error('Accept notification error:', err))

    return res.json({ message: 'Appointment confirmed', appointment })
  } catch (error) {
    logger.error('Accept appointment error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// ─── PATCH /api/appointments/doctor/:id/reschedule ─── Doctor reschedules an appointment
router.patch('/doctor/:id/reschedule', async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can reschedule appointments' })
    }

    const { appointmentDate, appointmentTime } = req.body

    if (!appointmentDate || !appointmentTime) {
      return res.status(400).json({ message: 'New appointmentDate and appointmentTime are required' })
    }

    const existing = await prisma.appointment.findUnique({
      where: { id: req.params.id },
    })

    if (!existing) {
      return res.status(404).json({ message: 'Appointment not found' })
    }

    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data: {
        appointmentDate,
        appointmentTime,
        status: 'rescheduled',
        reminderSent: false, // reset so the reminder fires again for the new date
      },
    })

    // Notify the patient about rescheduling
    sendNotification({
      email: appointment.email,
      subject: '📅 Appointment Rescheduled — MediLink',
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#F59E0B,#D97706);padding:24px;color:white;text-align:center;">
            <h1 style="margin:0;font-size:24px;">📅 Appointment Rescheduled</h1>
          </div>
          <div style="padding:24px;">
            <p>Hello <strong>${appointment.patientName}</strong>,</p>
            <p>Your appointment has been <strong style="color:#D97706;">rescheduled</strong> by your doctor.</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
              <tr><td style="padding:8px;color:#6b7280;">Previous Date</td><td style="padding:8px;text-decoration:line-through;color:#9ca3af;">${existing.appointmentDate} at ${existing.appointmentTime}</td></tr>
              <tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;">New Date</td><td style="padding:8px;font-weight:600;color:#059669;">${appointmentDate}</td></tr>
              <tr><td style="padding:8px;color:#6b7280;">New Time</td><td style="padding:8px;font-weight:600;color:#059669;">${appointmentTime}</td></tr>
              <tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;">Doctor / Service</td><td style="padding:8px;font-weight:600;">${appointment.doctorOrService || 'General'}</td></tr>
            </table>
            <p style="color:#6b7280;font-size:14px;">If this new time doesn't work for you, please log in to MediLink to request a change.</p>
          </div>
          <div style="background:#f9fafb;padding:16px;text-align:center;font-size:12px;color:#9ca3af;">&copy; MediLink Healthcare</div>
        </div>
      `,
    }).catch((err) => logger.error('Reschedule notification error:', err))

    return res.json({ message: 'Appointment rescheduled', appointment })
  } catch (error) {
    logger.error('Reschedule appointment error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

export default router
