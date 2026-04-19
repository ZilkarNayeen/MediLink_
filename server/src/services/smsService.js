// ── SMS Service (Mock Mode) ──
// This service logs SMS messages to the console.
// To enable real SMS, install `twilio` and set TWILIO_* env vars.

export async function sendSMS({ to, body }) {
  try {
    // Check for Twilio credentials
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      // Dynamic import so the app doesn't crash if twilio isn't installed
      try {
        const { default: Twilio } = await import('twilio')
        const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

        const message = await client.messages.create({
          body,
          from: process.env.TWILIO_PHONE_NUMBER,
          to,
        })

        console.log(`[SMS] Sent to ${to} — SID: ${message.sid}`)
        return { success: true, sid: message.sid }
      } catch (importErr) {
        console.log(`[SMS-MOCK] Twilio not installed. Logging instead.`)
      }
    }

    // Mock mode — just log the SMS
    console.log(`[SMS-MOCK] To: ${to} | Message: ${body}`)
    return { success: true, mock: true }
  } catch (error) {
    console.error(`[SMS-ERROR] Failed to send to ${to}:`, error.message)
    return { success: false, error: error.message }
  }
}

// ── SMS message templates ──

export function appointmentConfirmationSMS({ patientName, doctorOrService, appointmentDate, appointmentTime }) {
  return `MediLink: Hi ${patientName}, your appointment with ${doctorOrService || 'General Consultation'} on ${appointmentDate} at ${appointmentTime} has been confirmed.`
}

export function appointmentAcceptedSMS({ patientName, doctorOrService, appointmentDate, appointmentTime }) {
  return `MediLink: Hi ${patientName}, Dr. ${doctorOrService} has accepted your appointment on ${appointmentDate} at ${appointmentTime}.`
}

export function appointmentRescheduledSMS({ patientName, newDate, newTime }) {
  return `MediLink: Hi ${patientName}, your appointment has been rescheduled to ${newDate} at ${newTime}. Check MediLink for details.`
}

export function appointmentReminderSMS({ patientName, doctorOrService, appointmentDate, appointmentTime }) {
  return `MediLink: Reminder — ${patientName}, you have an appointment tomorrow with ${doctorOrService || 'your doctor'} on ${appointmentDate} at ${appointmentTime}. Please arrive 10 min early.`
}

export function medicationAlertSMS({ patientName, medicationName, dosage }) {
  return `MediLink: Hi ${patientName}, time to take your medication — ${medicationName} (${dosage}). Stay healthy! 💊`
}

export function followUpApprovedSMS({ patientName, doctorName }) {
  return `MediLink: Hi ${patientName}, your follow-up request has been approved by Dr. ${doctorName}. Check MediLink for details.`
}

export function followUpRejectedSMS({ patientName, doctorName }) {
  return `MediLink: Hi ${patientName}, your follow-up request was not approved by Dr. ${doctorName}. You may book a new appointment.`
}
