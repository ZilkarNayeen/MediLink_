import express from 'express'
import prisma from '../lib/prisma.js'
import { authenticate } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(authenticate)

// ─── GET /api/notifications ─── List all notifications for logged-in user
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10)
    const limit = parseInt(req.query.limit || '20', 10)
    const skip = (page - 1) * limit

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user.userId },
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({
        where: { userId: req.user.userId },
      }),
    ])

    return res.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('List notifications error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// ─── GET /api/notifications/unread ─── Count unread notifications
router.get('/unread', async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: req.user.userId,
        read: false,
      },
    })

    return res.json({ unreadCount: count })
  } catch (error) {
    console.error('Unread notifications error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// ─── PATCH /api/notifications/:id/read ─── Mark a single notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    })

    return res.json({ message: 'Notification marked as read', notification })
  } catch (error) {
    console.error('Mark read error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// ─── PATCH /api/notifications/read-all ─── Mark all notifications as read
router.patch('/read-all', async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.userId, read: false },
      data: { read: true },
    })

    return res.json({ message: 'All notifications marked as read' })
  } catch (error) {
    console.error('Mark all read error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

export default router
