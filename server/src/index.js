import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import recordsRouter from './routes/records.js'
import appointmentsRouter from './routes/appointments.js'
import doctorsRouter from './routes/doctors.js'
import emergencyRouter from './routes/emergency.js'
import bloodRouter from './routes/blood.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// --- STATIC FOLDER ---
const uploadsPath = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true })
app.use('/uploads', express.static(uploadsPath))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/records', recordsRouter)
app.use('/api/appointments', appointmentsRouter)
app.use('/api/doctors', doctorsRouter)
app.use('/api/emergency', emergencyRouter)
app.use('/api/blood', bloodRouter)

app.get('/', (req, res) => {
  res.send('MediLink API is running...')
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
