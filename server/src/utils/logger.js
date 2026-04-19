import { createLogger, format, transports } from 'winston'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const logsDir = path.join(__dirname, '../../logs')

// Ensure /logs directory exists
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true })

const { combine, timestamp, errors, json, colorize, printf } = format

// ── Console format (dev) ──
const consoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let out = `${timestamp} [${level}]: ${stack || message}`
  const extras = Object.keys(meta).length ? `\n  ${JSON.stringify(meta)}` : ''
  return out + extras
})

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }), // capture full stack traces
    json()
  ),
  transports: [
    // ── errors-only log (easy to scan during incidents) ──
    new transports.File({
      filename: path.join(logsDir, 'errors.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024,  // 5 MB per file
      maxFiles: 5,                // keep last 5 rotations
      tailable: true,
    }),
    // ── combined log (everything info and above) ──
    new transports.File({
      filename: path.join(logsDir, 'combined.log'),
      level: 'info',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
      tailable: true,
    }),
  ],
  exceptionHandlers: [
    new transports.File({ filename: path.join(logsDir, 'exceptions.log') }),
  ],
  rejectionHandlers: [
    new transports.File({ filename: path.join(logsDir, 'rejections.log') }),
  ],
})

// ── Also print to console in dev ──
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: combine(
      colorize({ all: true }),
      timestamp({ format: 'HH:mm:ss' }),
      errors({ stack: true }),
      consoleFormat
    )
  }))
}

export default logger
