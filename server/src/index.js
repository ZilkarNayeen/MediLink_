import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)

app.get('/', (req, res) => {
  res.send('MediLink API is running...')
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
