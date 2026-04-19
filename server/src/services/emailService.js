import nodemailer from 'nodemailer'

// ── Transporter (created lazily, cached) ──
let transporter = null

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false, // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }
  return transporter
}

// ── Generic send ──
export async function sendEmail({ to, subject, html }) {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`[EMAIL-MOCK] To: ${to} | Subject: ${subject}`)
      return { success: true, mock: true }
    }

    const info = await getTransporter().sendMail({
      from: `"MediLink" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    })

    console.log(`[EMAIL] Sent to ${to} — messageId: ${info.messageId}`)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error(`[EMAIL-ERROR] Failed to send to ${to}:`, error.message)
    return { success: false, error: error.message }
  }
}

// ───────────────────────────────────────────
//  HTML Email Templates
// ───────────────────────────────────────────

function baseTemplate(title, bodyContent) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 0;">
      <tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">🏥 MediLink</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">${title}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${bodyContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background:#f8fafc;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} MediLink — Smart Healthcare Platform</p>
              <p style="margin:4px 0 0;color:#94a3b8;font-size:11px;">This is an automated notification. Please do not reply directly.</p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
  </html>`
}

// ── Appointment Confirmation ──
export function appointmentConfirmationEmail({ patientName, doctorOrService, appointmentDate, appointmentTime }) {
  const body = `
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">Appointment Confirmed! ✅</h2>
    <p style="color:#475569;line-height:1.6;margin:0 0 20px;">
      Hello <strong>${patientName}</strong>, your appointment has been successfully booked.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-radius:12px;padding:20px;margin-bottom:20px;">
      <tr><td>
        <p style="margin:0 0 8px;color:#64748b;font-size:13px;">DOCTOR / SERVICE</p>
        <p style="margin:0 0 16px;color:#1e293b;font-size:16px;font-weight:600;">${doctorOrService || 'General Consultation'}</p>
        <p style="margin:0 0 8px;color:#64748b;font-size:13px;">DATE & TIME</p>
        <p style="margin:0;color:#1e293b;font-size:16px;font-weight:600;">📅 ${appointmentDate} &nbsp; 🕐 ${appointmentTime}</p>
      </td></tr>
    </table>
    <p style="color:#475569;line-height:1.6;margin:0;">
      You will receive a reminder 24 hours before your appointment. Please arrive 10 minutes early.
    </p>`
  return {
    subject: `✅ Appointment Confirmed — ${appointmentDate}`,
    html: baseTemplate('Appointment Confirmation', body),
  }
}

// ── Appointment Accepted by Doctor ──
export function appointmentAcceptedEmail({ patientName, doctorOrService, appointmentDate, appointmentTime }) {
  const body = `
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">Your Doctor Accepted! 🎉</h2>
    <p style="color:#475569;line-height:1.6;margin:0 0 20px;">
      Hello <strong>${patientName}</strong>, your appointment with <strong>${doctorOrService}</strong> has been confirmed by your doctor.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#ecfdf5;border-radius:12px;padding:20px;border-left:4px solid #10b981;margin-bottom:20px;">
      <tr><td>
        <p style="margin:0 0 8px;color:#047857;font-size:14px;font-weight:600;">📅 ${appointmentDate}</p>
        <p style="margin:0;color:#047857;font-size:14px;font-weight:600;">🕐 ${appointmentTime}</p>
      </td></tr>
    </table>
    <p style="color:#475569;line-height:1.6;margin:0;">
      Please make sure to arrive on time. You'll receive a reminder 24 hours before.
    </p>`
  return {
    subject: `🎉 Appointment Accepted by ${doctorOrService} — ${appointmentDate}`,
    html: baseTemplate('Appointment Accepted', body),
  }
}

// ── Appointment Rescheduled ──
export function appointmentRescheduledEmail({ patientName, doctorOrService, oldDate, oldTime, newDate, newTime }) {
  const body = `
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">Appointment Rescheduled 📅</h2>
    <p style="color:#475569;line-height:1.6;margin:0 0 20px;">
      Hello <strong>${patientName}</strong>, your appointment has been rescheduled by <strong>${doctorOrService || 'your doctor'}</strong>.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border-radius:12px;padding:16px;border-left:4px solid #f59e0b;margin-bottom:12px;">
      <tr><td>
        <p style="margin:0;color:#92400e;font-size:13px;font-weight:600;">PREVIOUS SCHEDULE</p>
        <p style="margin:4px 0 0;color:#92400e;font-size:14px;text-decoration:line-through;">📅 ${oldDate} &nbsp; 🕐 ${oldTime}</p>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#ecfdf5;border-radius:12px;padding:16px;border-left:4px solid #10b981;margin-bottom:20px;">
      <tr><td>
        <p style="margin:0;color:#047857;font-size:13px;font-weight:600;">NEW SCHEDULE</p>
        <p style="margin:4px 0 0;color:#047857;font-size:16px;font-weight:700;">📅 ${newDate} &nbsp; 🕐 ${newTime}</p>
      </td></tr>
    </table>`
  return {
    subject: `📅 Appointment Rescheduled — New Date: ${newDate}`,
    html: baseTemplate('Appointment Rescheduled', body),
  }
}

// ── Appointment Reminder (24h before) ──
export function appointmentReminderEmail({ patientName, doctorOrService, appointmentDate, appointmentTime }) {
  const body = `
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">Reminder: Appointment Tomorrow ⏰</h2>
    <p style="color:#475569;line-height:1.6;margin:0 0 20px;">
      Hello <strong>${patientName}</strong>, this is a reminder that you have an appointment tomorrow.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#ede9fe,#e0e7ff);border-radius:12px;padding:20px;margin-bottom:20px;">
      <tr><td>
        <p style="margin:0 0 8px;color:#4338ca;font-size:14px;font-weight:600;">👨‍⚕️ ${doctorOrService || 'General Consultation'}</p>
        <p style="margin:0 0 8px;color:#4338ca;font-size:14px;font-weight:600;">📅 ${appointmentDate}</p>
        <p style="margin:0;color:#4338ca;font-size:14px;font-weight:600;">🕐 ${appointmentTime}</p>
      </td></tr>
    </table>
    <p style="color:#475569;line-height:1.6;margin:0;">
      Please remember to arrive 10 minutes early. If you need to reschedule, contact your doctor as soon as possible.
    </p>`
  return {
    subject: `⏰ Reminder: Appointment Tomorrow — ${appointmentDate}`,
    html: baseTemplate('Appointment Reminder', body),
  }
}

// ── Follow-Up Request (to doctor) ──
export function followUpRequestEmail({ patientName, reason, preferredDate, preferredTime, originalDate }) {
  const body = `
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">New Follow-Up Request 📋</h2>
    <p style="color:#475569;line-height:1.6;margin:0 0 20px;">
      Patient <strong>${patientName}</strong> has requested a follow-up appointment from the consultation on <strong>${originalDate}</strong>.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-radius:12px;padding:20px;margin-bottom:20px;">
      <tr><td>
        <p style="margin:0 0 8px;color:#64748b;font-size:13px;">REASON</p>
        <p style="margin:0 0 16px;color:#1e293b;font-size:15px;">${reason}</p>
        ${preferredDate ? `<p style="margin:0 0 4px;color:#64748b;font-size:13px;">PREFERRED DATE: <strong style="color:#1e293b;">${preferredDate}</strong></p>` : ''}
        ${preferredTime ? `<p style="margin:0;color:#64748b;font-size:13px;">PREFERRED TIME: <strong style="color:#1e293b;">${preferredTime}</strong></p>` : ''}
      </td></tr>
    </table>
    <p style="color:#475569;line-height:1.6;margin:0;">
      Please log in to your MediLink dashboard to approve or decline this request.
    </p>`
  return {
    subject: `📋 Follow-Up Request from ${patientName}`,
    html: baseTemplate('Follow-Up Request', body),
  }
}

// ── Follow-Up Approved (to patient) ──
export function followUpApprovedEmail({ patientName, doctorName }) {
  const body = `
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">Follow-Up Approved! ✅</h2>
    <p style="color:#475569;line-height:1.6;margin:0 0 20px;">
      Hello <strong>${patientName}</strong>, your follow-up request has been <strong style="color:#10b981;">approved</strong> by <strong>${doctorName}</strong>.
    </p>
    <p style="color:#475569;line-height:1.6;margin:0;">
      Please check your MediLink dashboard for the appointment details. You will receive further notifications once the appointment is scheduled.
    </p>`
  return {
    subject: `✅ Follow-Up Approved by ${doctorName}`,
    html: baseTemplate('Follow-Up Approved', body),
  }
}

// ── Follow-Up Rejected (to patient) ──
export function followUpRejectedEmail({ patientName, doctorName }) {
  const body = `
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">Follow-Up Request Update</h2>
    <p style="color:#475569;line-height:1.6;margin:0 0 20px;">
      Hello <strong>${patientName}</strong>, unfortunately your follow-up request was <strong style="color:#ef4444;">not approved</strong> by <strong>${doctorName}</strong> at this time.
    </p>
    <p style="color:#475569;line-height:1.6;margin:0;">
      If you believe you need further medical attention, please book a new appointment or contact your doctor through MediLink messaging.
    </p>`
  return {
    subject: `Follow-Up Request Update from ${doctorName}`,
    html: baseTemplate('Follow-Up Update', body),
  }
}

// ── Medication Alert ──
export function medicationAlertEmail({ patientName, medicationName, dosage, frequency }) {
  const body = `
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">Medication Reminder 💊</h2>
    <p style="color:#475569;line-height:1.6;margin:0 0 20px;">
      Hello <strong>${patientName}</strong>, it's time to take your medication.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#ecfdf5;border-radius:12px;padding:20px;border-left:4px solid #10b981;margin-bottom:20px;">
      <tr><td>
        <p style="margin:0 0 8px;color:#047857;font-size:18px;font-weight:700;">💊 ${medicationName}</p>
        <p style="margin:0 0 4px;color:#065f46;font-size:14px;"><strong>Dosage:</strong> ${dosage}</p>
        <p style="margin:0;color:#065f46;font-size:14px;"><strong>Frequency:</strong> ${frequency}</p>
      </td></tr>
    </table>
    <p style="color:#475569;line-height:1.6;margin:0;">
      Please take your medication as prescribed. If you experience any side effects, contact your doctor immediately.
    </p>`
  return {
    subject: `💊 Medication Reminder — ${medicationName}`,
    html: baseTemplate('Medication Reminder', body),
  }
}

// ── New Prescription (to patient) ──
export function newPrescriptionEmail({ patientName, doctorName, medicationName, dosage, frequency, startDate, endDate }) {
  const body = `
    <h2 style="margin:0 0 16px;color:#1e293b;font-size:20px;">New Prescription Issued 📝</h2>
    <p style="color:#475569;line-height:1.6;margin:0 0 20px;">
      Hello <strong>${patientName}</strong>, <strong>${doctorName}</strong> has issued a new prescription for you.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-radius:12px;padding:20px;margin-bottom:20px;">
      <tr><td>
        <p style="margin:0 0 12px;color:#6366f1;font-size:18px;font-weight:700;">💊 ${medicationName}</p>
        <p style="margin:0 0 6px;color:#1e293b;font-size:14px;"><strong>Dosage:</strong> ${dosage}</p>
        <p style="margin:0 0 6px;color:#1e293b;font-size:14px;"><strong>Frequency:</strong> ${frequency}</p>
        <p style="margin:0 0 6px;color:#1e293b;font-size:14px;"><strong>Start Date:</strong> ${startDate}</p>
        ${endDate ? `<p style="margin:0;color:#1e293b;font-size:14px;"><strong>End Date:</strong> ${endDate}</p>` : ''}
      </td></tr>
    </table>
    <p style="color:#475569;line-height:1.6;margin:0;">
      You will receive automated medication reminders. View your full prescription on your MediLink dashboard.
    </p>`
  return {
    subject: `📝 New Prescription — ${medicationName}`,
    html: baseTemplate('New Prescription', body),
  }
}
