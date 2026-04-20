import logger from '../utils/logger.js'
import express from 'express'
import { PrismaClient } from '../../generated/prisma/index.js'
import { authenticate } from '../middleware/authMiddleware.js'

const prisma = new PrismaClient()
const router = express.Router()

router.use(authenticate)

// ─── GET /api/notifications ─── List all notifications for the logged-in user
router.get('/', async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.userId },
      orderBy: { sentAt: 'desc' },
      take: 100,
    })

    return res.json({ notifications })
  } catch (error) {
    logger.error('List notifications error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// ─── GET /api/notifications/unread-count ─── Count unread notifications
router.get('/unread-count', async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: req.user.userId,
        read: false,
      },
    })

    return res.json({ count })
  } catch (error) {
    logger.error('Unread count error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// ─── PATCH /api/notifications/:id/read ─── Mark a single notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
    })

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' })
    }

    if (notification.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    })

    return res.json({ message: 'Notification marked as read', notification: updated })
  } catch (error) {
    logger.error('Mark read error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

// ─── PATCH /api/notifications/read-all ─── Mark all notifications as read
router.patch('/read-all', async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.userId,
        read: false,
      },
      data: { read: true },
    })

    return res.json({ message: 'All notifications marked as read' })
  } catch (error) {
    logger.error('Mark all read error:', error)
    return res.status(500).json({ message: error?.message || 'Internal server error' })
  }
})

export default router
