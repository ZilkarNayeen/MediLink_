import logger from '../utils/logger.js'
import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '../../generated/prisma/index.js'

const prisma = new PrismaClient()
const router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret'
const JWT_EXPIRES_IN = '7d'

router.post('/signup', async (req, res) => {
  try {
    const { fullName, email, password } = req.body

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
      },
    })

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    )

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    logger.error('Signup error:', error)
    return res
      .status(500)
      .json({ message: error?.message || 'Internal server error' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash)

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    )

    return res.json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    logger.error('Login error:', error)
    return res
      .status(500)
      .json({ message: error?.message || 'Internal server error' })
  }
})

// ─── Admin login (hardcoded credentials) ───
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' })
    }

    const ADMIN_USER = process.env.ADMIN_USERNAME
    const ADMIN_PASS = process.env.ADMIN_PASSWORD

    if (!ADMIN_USER || !ADMIN_PASS) {
      return res.status(500).json({ message: 'Admin credentials not configured on server.' })
    }

    if (username !== ADMIN_USER || password !== ADMIN_PASS) {
      return res.status(401).json({ message: 'Invalid admin credentials' })
    }

    const token = jwt.sign(
      { userId: 'admin', email: 'admin@medilink.local', role: 'admin' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    )

    return res.json({
      token,
      user: {
        id: 'admin',
        fullName: 'Administrator',
        email: 'admin@medilink.local',
        role: 'admin',
      },
    })
  } catch (error) {
    logger.error('Admin login error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// ─── Doctor signup (Public) ───
router.post('/doctor/signup', async (req, res) => {
  try {
    const { fullName, email, password, specialty } = req.body

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        role: 'doctor',
        specialty: specialty || 'General Physician',
      },
    })

    return res.status(201).json({
      message: 'Doctor registered successfully',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    logger.error('Doctor signup error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// ─── Doctor login ───
router.post('/doctor/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user || user.role !== 'doctor') {
      return res.status(401).json({ message: 'Invalid doctor credentials' })
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash)

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid doctor credentials' })
    }

    const doctorToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    )

    return res.json({
      token: doctorToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    logger.error('Doctor login error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

export default router

