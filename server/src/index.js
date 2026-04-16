import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import logger from './utils/logger.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import authRouter from './routes/auth.js'
import appointmentsRouter from './routes/appointments.js'
import doctorsRouter from './routes/doctors.js'
import followUpsRouter from './routes/followups.js'
import prescriptionsRouter from './routes/prescriptions.js'
import recordsRouter from './routes/records.js'
import messagesRouter from './routes/messages.js'
import emergencyRouter from './routes/emergency.js'
import referralsRouter from './routes/referrals.js'
import bloodRouter from './routes/blood.js'
import aiRouter from './routes/ai.js'
import profileRouter from './routes/profile.js'
import directoryRouter from './routes/directory.js'
import { startScheduler } from './services/scheduler.js'
import { createServer } from 'http'
import { Server } from 'socket.io'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) throw new Error('FATAL: JWT_SECRET environment variable is not set!')

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL, // set on Render: your Vercel URL
].filter(Boolean)

const corsOptions = {
  origin: (origin, cb) => {
    // allow non-browser tools (Postman) and whitelisted origins
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true)
    cb(new Error(`CORS: Origin ${origin} not allowed`))
  },
  credentials: true,
}

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, { cors: corsOptions })
const PORT = process.env.PORT || 5000

// ── Rate Limiters ──
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please wait 15 minutes.' },
})
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  message: { message: 'AI rate limit exceeded. Please wait a moment.' },
})

app.use(cors(corsOptions))
app.use(express.json({ limit: '16kb' }))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth/login', authLimiter)
app.use('/api/auth/doctor/login', authLimiter)
app.use('/api/auth/admin/login', authLimiter)
app.use('/api/ai', aiLimiter)
app.use('/api/auth', authRouter)
app.use('/api/appointments', appointmentsRouter)
app.use('/api/doctors', doctorsRouter)
app.use('/api/follow-ups', followUpsRouter)
app.use('/api/prescriptions', prescriptionsRouter)
app.use('/api/records', recordsRouter)
app.use('/api/messages', messagesRouter)
app.use('/api/emergency', emergencyRouter)
app.use('/api/referrals', referralsRouter)
app.use('/api/blood', bloodRouter)
app.use('/api/ai', aiRouter)
app.use('/api/profile', profileRouter)
app.use('/api/directory', directoryRouter)

// ── Socket.io JWT Authentication Middleware ──
io.use((socket, next) => {
  const token = socket.handshake.auth?.token
  if (!token) return next(new Error('Socket: Authentication required'))
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    socket.userId = decoded.userId
    socket.userRole = decoded.role
    next()
  } catch {
    next(new Error('Socket: Invalid or expired token'))
  }
})

// Socket.io Real-time Messaging setup
io.on('connection', (socket) => {
  // Automatically join the user's own private room using verified JWT identity
  socket.join(socket.userId)

  socket.on('send_message', (data) => {
    // data = { receiverId, messageData }
    io.to(data.receiverId).emit('receive_message', data.messageData)
  })

  socket.on('disconnect', () => {
    // handled automatically
  })

  // WebRTC Telemedicine Signaling
  socket.on('call_user', (data) => {
    // data = { userToCall, signalData, from, name }
    io.to(data.userToCall).emit('call_user', { signal: data.signalData, from: data.from, name: data.name })
  })

  socket.on('answer_call', (data) => {
    // data = { to, signal }
    io.to(data.to).emit('call_accepted', data.signal)
  })

  socket.on('ice_candidate', (data) => {
    // data = { to, candidate }
    io.to(data.to).emit('ice_candidate', data.candidate)
  })
})

httpServer.listen(PORT, () => {
  logger.info(`🚀 Server listening on http://localhost:${PORT}`)
  startScheduler()
})

// ── Global error handlers — must be LAST ──
app.use(notFound)
app.use(errorHandler)


