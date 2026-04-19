import cron from 'node-cron'
import prisma from '../lib/prisma.js'
import { notify } from '../services/notificationService.js'
import {
  appointmentReminderEmail,
  medicationAlertEmail,
} from '../services/emailService.js'
import {
  appointmentReminderSMS,
  medicationAlertSMS,
} from '../services/smsService.js'

// ── Helper: parse "YYYY-MM-DD" + "HH:mm" into a Date ──
function parseAppointmentDateTime(dateStr, timeStr) {
  try {
    const [year, month, day] = dateStr.split('-').map(Number)
    const [hour, minute] = (timeStr || '00:00').split(':').map(Number)
    return new Date(year, month - 1, day, hour, minute)
  } catch {
    return null
  }
}

// ───────────────────────────────────────────
//  JOB 1: Appointment Reminders (every hour)
//  Sends reminders for appointments within 24h
// ───────────────────────────────────────────
async function runAppointmentReminders() {
  try {
    const now = new Date()
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // Find all confirmed appointments that haven't been reminded yet
    const appointments = await prisma.appointment.findMany({
      where: {
        status: 'confirmed',
        reminderSent: false,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
      },
    })

    for (const apt of appointments) {
      const aptDate = parseAppointmentDateTime(apt.appointmentDate, apt.appointmentTime)
      if (!aptDate) continue

      // Check if appointment is within the next 24 hours
      if (aptDate > now && aptDate <= in24h) {
        const emailData = appointmentReminderEmail({
          patientName: apt.patientName,
          doctorOrService: apt.doctorOrService,
          appointmentDate: apt.appointmentDate,
          appointmentTime: apt.appointmentTime,
        })

        const smsBody = appointmentReminderSMS({
          patientName: apt.patientName,
          doctorOrService: apt.doctorOrService,
          appointmentDate: apt.appointmentDate,
          appointmentTime: apt.appointmentTime,
        })

        await notify({
          userId: apt.userId,
          type: 'appointment_reminder',
          channel: 'both',
          appointmentId: apt.id,
          subject: emailData.subject,
          body: smsBody,
          html: emailData.html,
          recipientEmail: apt.email || apt.user?.email,
          recipientPhone: apt.contactNumber || apt.user?.phone,
        })

        // Mark as reminded
        await prisma.appointment.update({
          where: { id: apt.id },
          data: { reminderSent: true },
        })

        console.log(`[SCHEDULER] Reminder sent for appointment ${apt.id}`)
      }
    }
  } catch (error) {
    console.error('[SCHEDULER] Appointment reminder job failed:', error.message)
  }
}

// ───────────────────────────────────────────
//  JOB 2: Medication Alerts (every 30 min)
//  Checks active prescriptions for matching alertTimes
// ───────────────────────────────────────────
async function runMedicationAlerts() {
  try {
    const now = new Date()
    const currentHour = String(now.getHours()).padStart(2, '0')
    const currentMinute = now.getMinutes()
    // Round to nearest 30-min window
    const roundedMinute = currentMinute < 15 ? '00' : currentMinute < 45 ? '30' : '00'
    const currentSlot = `${currentHour}:${roundedMinute}`

    const prescriptions = await prisma.prescription.findMany({
      where: { active: true },
      include: {
        patient: { select: { id: true, fullName: true, email: true, phone: true } },
      },
    })

    for (const rx of prescriptions) {
      // Check if current time matches any alertTime
      if (!rx.alertTimes || !rx.alertTimes.includes(currentSlot)) continue

      // Check date range
      const today = now.toISOString().split('T')[0]
      if (rx.startDate > today) continue
      if (rx.endDate && rx.endDate < today) continue

      const emailData = medicationAlertEmail({
        patientName: rx.patient.fullName,
        medicationName: rx.medicationName,
        dosage: rx.dosage,
        frequency: rx.frequency,
      })

      const smsBody = medicationAlertSMS({
        patientName: rx.patient.fullName,
        medicationName: rx.medicationName,
        dosage: rx.dosage,
      })

      await notify({
        userId: rx.patientId,
        type: 'medication_alert',
        channel: 'both',
        subject: emailData.subject,
        body: smsBody,
        html: emailData.html,
        recipientEmail: rx.patient.email,
        recipientPhone: rx.patient.phone,
      })

      console.log(`[SCHEDULER] Medication alert sent for ${rx.medicationName} to ${rx.patient.fullName}`)
    }
  } catch (error) {
    console.error('[SCHEDULER] Medication alert job failed:', error.message)
  }
}

// ───────────────────────────────────────────
//  JOB 3: Follow-Up Reminders (daily at 9 AM)
//  Reminds patients about approved follow-ups for tomorrow
// ───────────────────────────────────────────
async function runFollowUpReminders() {
  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const followUps = await prisma.followUpRequest.findMany({
      where: {
        status: 'approved',
        preferredDate: tomorrowStr,
      },
      include: {
        patient: { select: { id: true, fullName: true, email: true, phone: true } },
        appointment: { select: { doctorOrService: true } },
      },
    })

    for (const fu of followUps) {
      const subject = `⏰ Reminder: Follow-Up Appointment Tomorrow`
      const body = `MediLink: Hi ${fu.patient.fullName}, reminder — you have an approved follow-up with ${fu.appointment.doctorOrService || 'your doctor'} tomorrow (${tomorrowStr}). Please check MediLink for details.`

      await notify({
        userId: fu.patientId,
        type: 'follow_up_reminder',
        channel: 'both',
        subject,
        body,
        recipientEmail: fu.patient.email,
        recipientPhone: fu.patient.phone,
      })

      console.log(`[SCHEDULER] Follow-up reminder sent to ${fu.patient.fullName}`)
    }
  } catch (error) {
    console.error('[SCHEDULER] Follow-up reminder job failed:', error.message)
  }
}

// ───────────────────────────────────────────
//  Start all scheduled jobs
// ───────────────────────────────────────────
export function startScheduler() {
  // Appointment reminders — every hour at minute 0
  cron.schedule('0 * * * *', () => {
    console.log('[SCHEDULER] Running appointment reminder job...')
    runAppointmentReminders()
  })

  // Medication alerts — every 30 minutes
  cron.schedule('0,30 * * * *', () => {
    console.log('[SCHEDULER] Running medication alert job...')
    runMedicationAlerts()
  })

  // Follow-up reminders — daily at 9:00 AM
  cron.schedule('0 9 * * *', () => {
    console.log('[SCHEDULER] Running follow-up reminder job...')
    runFollowUpReminders()
  })

  console.log('[SCHEDULER] ✅ All cron jobs started')
}
