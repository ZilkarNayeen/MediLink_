import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma.js'

const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// --- MULTER SETUP (Local Storage) ---
const uploadsPath = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsPath),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`)
})
const upload = multer({ storage })

// --- AUTH HELPER ---
const getUserIdFromToken = (req) => {
  const token = req.header('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    return decoded.userId
  } catch (err) {
    return null
  }
}

// ─── GET /api/records ─── Get records for the logged-in patient
router.get('/', async (req, res) => {
  const userId = getUserIdFromToken(req)
  if (!userId) return res.status(401).json({ message: 'Authentication required' })
  
  try {
    const records = await prisma.medicalRecord.findMany({
      where: { patientId: userId },
      orderBy: { createdAt: 'desc' }
    })
    return res.json({ records })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch records' })
  }
})

// ─── POST /api/records ─── Upload a medical record
router.post('/', upload.single('document'), async (req, res) => {
  const userId = getUserIdFromToken(req)
  if (!userId) return res.status(401).json({ message: 'Authentication required' })

  try {
    const { title, description, recordType } = req.body

    if (!title || !recordType) {
      return res.status(400).json({ message: 'Missing required fields: title, recordType' })
    }

    let fileUrl = null
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`
    }

    const record = await prisma.medicalRecord.create({
      data: { 
        title, 
        description, 
        recordType, 
        fileUrl, 
        patientId: userId 
      }
    })

    return res.status(201).json({ message: 'Medical record added successfully', record })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})

export default router
