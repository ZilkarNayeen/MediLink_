import prisma from '../lib/prisma.js'
import { sendEmail } from './emailService.js'
import { sendSMS } from './smsService.js'

/**
 * Unified notification dispatcher.
 * Sends via email and/or SMS, then logs to the Notification table.
 *
 * @param {Object} opts
 * @param {string} opts.userId         - Recipient user ID (for DB logging)
 * @param {string} opts.type           - 'appointment_confirmation' | 'appointment_accepted' | 'appointment_rescheduled' | 'appointment_reminder' | 'follow_up_request' | 'follow_up_approved' | 'follow_up_rejected' | 'medication_alert' | 'new_prescription'
 * @param {string} opts.channel        - 'email' | 'sms' | 'both'
 * @param {string} [opts.appointmentId] - Related appointment ID
 * @param {string} opts.subject        - Notification subject (used for email subject & DB)
 * @param {string} opts.body           - Plain-text body (used for SMS & DB)
 * @param {string} [opts.html]         - HTML body (used for email)
 * @param {string} [opts.recipientEmail] - Override email address
 * @param {string} [opts.recipientPhone] - Override phone number
 */
export async function notify({
  userId,
  type,
  channel = 'email',
  appointmentId = null,
  subject,
  body,
  html,
  recipientEmail,
  recipientPhone,
}) {
  // Resolve recipient details from DB if not provided
  let email = recipientEmail
  let phone = recipientPhone

  if (!email || !phone) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, phone: true },
      })
      if (user) {
        email = email || user.email
        phone = phone || user.phone
      }
    } catch (err) {
      console.error('[NOTIFY] Failed to look up user:', err.message)
    }
  }

  let emailResult = null
  let smsResult = null

  // ── Send Email ──
  if ((channel === 'email' || channel === 'both') && email) {
    emailResult = await sendEmail({
      to: email,
      subject,
      html: html || `<p>${body}</p>`,
    })

    // Log to DB
    try {
      await prisma.notification.create({
        data: {
          type,
          channel: 'email',
          subject,
          body: body || subject,
          success: emailResult.success,
          errorMsg: emailResult.error || null,
          appointmentId,
          userId,
        },
      })
    } catch (dbErr) {
      console.error('[NOTIFY] Failed to log email notification:', dbErr.message)
    }
  }

  // ── Send SMS ──
  if ((channel === 'sms' || channel === 'both') && phone) {
    smsResult = await sendSMS({ to: phone, body })

    // Log to DB
    try {
      await prisma.notification.create({
        data: {
          type,
          channel: 'sms',
          subject,
          body,
          success: smsResult.success,
          errorMsg: smsResult.error || null,
          appointmentId,
          userId,
        },
      })
    } catch (dbErr) {
      console.error('[NOTIFY] Failed to log SMS notification:', dbErr.message)
    }
  }

  return { emailResult, smsResult }
}
