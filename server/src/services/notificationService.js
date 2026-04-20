import logger from '../utils/logger.js'
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS

// Log whether credentials are present (without revealing them)
console.log(`📧 SMTP_USER: ${SMTP_USER ? SMTP_USER : '⚠️ NOT SET'}`)
console.log(`📧 SMTP_PASS: ${SMTP_PASS ? '****' + SMTP_PASS.slice(-4) : '⚠️ NOT SET'}`)

// ── Gmail transporter ──
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
})

// Verify connection on startup
transporter.verify()
  .then(() => console.log(`📧 Gmail connected as ${SMTP_USER}`))
  .catch((err) => {
    console.error('📧 Gmail connection failed:', err.message)
    console.error('📧 Full error:', err)
  })

/**
 * Send an email via Gmail.
 */
export async function sendEmail({ to, subject, html }) {
  try {
    const info = await transporter.sendMail({
      from: `MediLink <${SMTP_USER}>`,
      to,
      subject,
      html,
    })
    console.log(`📧 Email sent to ${to}: ${info.messageId}`)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error(`📧 Email failed to ${to}:`, error.message)
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
