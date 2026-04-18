import logger from '../utils/logger.js'
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

// ── Gmail transporter ──
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// Verify connection on startup
transporter.verify()
  .then(() => console.log(`📧 Gmail connected as ${process.env.SMTP_USER}`))
  .catch((err) => logger.error('📧 Gmail connection failed:', err.message))

/**
 * Send an email via Gmail.
 */
export async function sendEmail({ to, subject, html }) {
  try {
    const info = await transporter.sendMail({
      from: `MediLink <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    })
    console.log(`📧 Email sent to ${to}: ${info.messageId}`)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    logger.error(`📧 Email failed to ${to}:`, error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Send notification via email.
 */
export async function sendNotification({ email, subject, html }) {
  const results = { email: null }

  if (email) {
    results.email = await sendEmail({ to: email, subject, html })
  }

  return results
}
