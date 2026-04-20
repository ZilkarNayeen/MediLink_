import logger from '../utils/logger.js'
import cron from 'node-cron'
import { PrismaClient } from '../../generated/prisma/index.js'
import { sendNotification } from './notificationService.js'
import {
  appointmentReminderEmail,
  medicationAlertEmail,
  followUpReminderEmail,
} from './emailTemplates.js'

const prisma = new PrismaClient()

export function startScheduler() {
  console.log('⏰ Scheduler started')

  // ── Run every hour: check for 24-hour appointment reminders ──
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Checking for upcoming appointment reminders...')
    try {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0] // "YYYY-MM-DD"

      const appointments = await prisma.appointment.findMany({
        where: {
          appointmentDate: tomorrowStr,
          status: { in: ['pending', 'confirmed'] },
          reminderSent: false,
        },
        include: { user: true },
      })

      for (const apt of appointments) {
        const { subject, html } = appointmentReminderEmail({
          patientName: apt.patientName,
          doctorOrService: apt.doctorOrService,
          appointmentDate: apt.appointmentDate,
          appointmentTime: apt.appointmentTime,
        })

        await sendNotification({
          email: apt.email,
          subject,
          html,
        })

        // Mark reminder as sent so we don't re-send
        await prisma.appointment.update({
          where: { id: apt.id },
          data: { reminderSent: true },
        })

        // Log the notification
        await prisma.notification.create({
          data: {
            type: 'reminder',
            channel: 'email',
            subject,
            body: `24-hour reminder sent for appointment on ${apt.appointmentDate} at ${apt.appointmentTime}`,
            userId: apt.userId,
            appointmentId: apt.id,
          },
        })
      }

      if (appointments.length > 0) {
        console.log(`⏰ Sent ${appointments.length} appointment reminder(s)`)
      }
    } catch (error) {
      logger.error('⏰ Reminder job error:', error)
    }
  })

  // ── Run every 30 minutes: check for medication alerts ──
  cron.schedule('*/30 * * * *', async () => {
    try {
      const now = new Date()
      const currentTime = now.toTimeString().slice(0, 5) // "HH:MM"
      const today = now.toISOString().split('T')[0]

      const prescriptions = await prisma.prescription.findMany({
        where: {
          active: true,
          startDate: { lte: today },
          OR: [
            { endDate: null },
            { endDate: { gte: today } },
          ],
        },
        include: {
          patient: true,
          appointment: true,
        },
      })

      for (const rx of prescriptions) {
        // Check if current time matches any alert time (within a 15-minute window)
        const shouldAlert = rx.alertTimes.some((alertTime) => {
          const [aH, aM] = alertTime.split(':').map(Number)
          const [cH, cM] = currentTime.split(':').map(Number)
          const diffMinutes = Math.abs((aH * 60 + aM) - (cH * 60 + cM))
          return diffMinutes <= 15
        })

        if (shouldAlert) {
          const { subject, html } = medicationAlertEmail({
            patientName: rx.patient.fullName,
            medicationName: rx.medicationName,
            dosage: rx.dosage,
            time: currentTime,
          })

          await sendNotification({
            email: rx.patient.email,
            subject,
            html,
          })

          // Log the medication alert notification
          await prisma.notification.create({
            data: {
              type: 'medication',
              channel: 'email',
              subject,
              body: `Medication reminder for ${rx.medicationName} (${rx.dosage}) at ${currentTime}`,
              userId: rx.patientId,
              appointmentId: rx.appointmentId,
            },
          })

          console.log(`💊 Medication alert sent to ${rx.patient.email} for ${rx.medicationName}`)
        }
      }
    } catch (error) {
      logger.error('⏰ Medication alert job error:', error)
    }
  })

  // ── Run daily at 9 AM: follow-up reminders for completed appointments ──
  cron.schedule('0 9 * * *', async () => {
    console.log('📋 Checking for follow-up reminders...')
    try {
      // Look for appointments from 7 days ago that are confirmed/completed
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const targetDate = sevenDaysAgo.toISOString().split('T')[0]

      const appointments = await prisma.appointment.findMany({
        where: {
          appointmentDate: targetDate,
          status: { in: ['confirmed', 'completed'] },
        },
        include: {
          user: true,
          followUpRequests: true,
        },
      })

      // Filter to only those with NO follow-up requests
      const needsFollowUp = appointments.filter(
        (apt) => apt.followUpRequests.length === 0
      )

      for (const apt of needsFollowUp) {
        const { subject, html } = followUpReminderEmail({
          patientName: apt.patientName,
          doctorOrService: apt.doctorOrService,
          originalDate: apt.appointmentDate,
        })

        await sendNotification({
          email: apt.email,
          subject,
          html,
        })

        // Log the follow-up reminder notification
        await prisma.notification.create({
          data: {
            type: 'follow_up_reminder',
            channel: 'email',
            subject,
            body: `Follow-up reminder sent for appointment on ${apt.appointmentDate} with ${apt.doctorOrService || 'General'}`,
            userId: apt.userId,
            appointmentId: apt.id,
          },
        })
      }

      if (needsFollowUp.length > 0) {
        console.log(`📋 Sent ${needsFollowUp.length} follow-up reminder(s)`)
      }
    } catch (error) {
      logger.error('⏰ Follow-up reminder job error:', error)
    }
  })
}
