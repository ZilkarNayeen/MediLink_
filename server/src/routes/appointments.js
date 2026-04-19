import express from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { notify } from '../services/notificationService.js'
import {
  appointmentConfirmationEmail,
  appointmentAcceptedEmail,
  appointmentRescheduledEmail,
} from '../services/emailService.js'
import {
  appointmentConfirmationSMS,
  appointmentAcceptedSMS,
  appointmentRescheduledSMS,
} from '../services/smsService.js'

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

    // ── Send Appointment Confirmation (Email + SMS) ──
    const emailData = appointmentConfirmationEmail({
      patientName,
      doctorOrService,
      appointmentDate,
      appointmentTime,
    })
    const smsBody = appointmentConfirmationSMS({
      patientName,
      doctorOrService,
      appointmentDate,
      appointmentTime,
    })

    notify({
      userId: req.user.userId,
      type: 'appointment_confirmation',
      channel: 'both',
      appointmentId: appointment.id,
      subject: emailData.subject,
      body: smsBody,
      html: emailData.html,
      recipientEmail: email,
      recipientPhone: contactNumber,
    }).catch(err => console.error('[NOTIFY] Appointment confirmation failed:', err.message))

    return res.status(201).json({ message: 'Appointment created', appointment })
  } catch (error) {
    console.error('Create appointment error:', error)
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
    console.error('List appointments error:', error)
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
    console.error('Doctor list appointments error:', error)
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
    console.error('Get appointment error:', error)
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
    console.error('Update appointment error:', error)
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
    console.error('Delete appointment error:', error)
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

    // ── Send "Appointment Accepted" notification ──
    const emailData = appointmentAcceptedEmail({
      patientName: appointment.patientName,
      doctorOrService: appointment.doctorOrService,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
    })
    const smsBody = appointmentAcceptedSMS({
      patientName: appointment.patientName,
      doctorOrService: appointment.doctorOrService,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
    })

    notify({
      userId: appointment.userId,
      type: 'appointment_accepted',
      channel: 'both',
      appointmentId: appointment.id,
      subject: emailData.subject,
      body: smsBody,
      html: emailData.html,
      recipientEmail: appointment.email,
      recipientPhone: appointment.contactNumber,
    }).catch(err => console.error('[NOTIFY] Appointment accepted notification failed:', err.message))

    return res.json({ message: 'Appointment confirmed', appointment })
  } catch (error) {
    console.error('Accept appointment error:', error)
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

    // ── Send "Appointment Rescheduled" notification ──
    const emailData = appointmentRescheduledEmail({
      patientName: appointment.patientName,
      doctorOrService: appointment.doctorOrService,
      oldDate: existing.appointmentDate,
      oldTime: existing.appointmentTime,
      newDate: appointmentDate,
      newTime: appointmentTime,
    })
    const smsBody = appointmentRescheduledSMS({
      patientName: appointment.patientName,
      newDate: appointmentDate,
      newTime: appointmentTime,
    })

    notify({
      userId: appointment.userId,
      type: 'appointment_rescheduled',
      channel: 'both',
      appointmentId: appointment.id,
      subject: emailData.subject,
      body: smsBody,
      html: emailData.html,
      recipientEmail: appointment.email,
      recipientPhone: appointment.contactNumber,
    }).catch(err => console.error('[NOTIFY] Reschedule notification failed:', err.message))

    return res.json({ message: 'Appointment rescheduled', appointment })
  } catch (error) {
    console.error('Reschedule appointment error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

export default router
