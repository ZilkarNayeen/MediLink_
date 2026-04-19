import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import http from 'http'
import { Server } from 'socket.io'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import recordsRouter from './routes/records.js'
import appointmentsRouter from './routes/appointments.js'
import doctorsRouter from './routes/doctors.js'
import emergencyRouter from './routes/emergency.js'
import prescriptionsRouter from './routes/prescriptions.js'
import followUpsRouter from './routes/followups.js'
import messagesRouter from './routes/messages.js'
import bloodRouter from './routes/blood.js'
import referralsRouter from './routes/referrals.js'
import profileRouter from './routes/profile.js'
import notificationsRouter from './routes/notifications.js'
import { startScheduler } from './jobs/scheduler.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
})

const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// --- STATIC FOLDERS ---
const uploadsPath = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true })
app.use('/uploads', express.static(uploadsPath))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/records', recordsRouter)
app.use('/api/appointments', appointmentsRouter)
app.use('/api/doctors', doctorsRouter)
app.use('/api/emergency', emergencyRouter)
app.use('/api/prescriptions', prescriptionsRouter)
app.use('/api/follow-ups', followUpsRouter)
app.use('/api/messages', messagesRouter)
app.use('/api/blood', bloodRouter)
app.use('/api/referrals', referralsRouter)
app.use('/api/profile', profileRouter)
app.use('/api/notifications', notificationsRouter)

app.get('/', (req, res) => {
  res.send('MediLink API is running...')
})

// ── Socket.IO real-time messaging ──
io.on('connection', (socket) => {
  socket.on('join_chat', (userId) => {
    socket.join(userId)
  })

  socket.on('send_message', ({ receiverId, messageData }) => {
    io.to(receiverId).emit('receive_message', messageData)
  })

  // WebRTC signaling
  socket.on('call_user', ({ userToCall, signalData, from, name }) => {
    io.to(userToCall).emit('call_user', { signal: signalData, from, name })
  })

  socket.on('answer_call', ({ to, signal }) => {
    io.to(to).emit('call_accepted', signal)
  })

  socket.on('ice_candidate', ({ to, candidate }) => {
    io.to(to).emit('ice_candidate', candidate)
  })
})

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  startScheduler()
})
