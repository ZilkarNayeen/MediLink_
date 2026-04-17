import logger from '../utils/logger.js'
import express from 'express'
import { PrismaClient } from '../../generated/prisma/index.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { upload, uploadToCloudinary } from '../services/upload.js'

const prisma = new PrismaClient()
const router = express.Router()

router.use(authenticate)

// ─── GET /api/messages/conversations ───
router.get('/conversations', async (req, res) => {
  try {
    const isDoctor = req.user.role === 'doctor'
    const whereClause = isDoctor ? { doctorId: req.user.userId } : { patientId: req.user.userId }

    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' }
    })

    const otherUserIds = conversations.map(c => isDoctor ? c.patientId : c.doctorId)
    const uniqueIds = [...new Set(otherUserIds)]
    const otherUsers = await prisma.user.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, fullName: true, role: true }
    })

    const userMap = {}
    otherUsers.forEach(u => { userMap[u.id] = u })

    const enrichedConvos = conversations.map(c => ({
      ...c,
      otherUser: userMap[isDoctor ? c.patientId : c.doctorId]
    }))

    return res.json({ conversations: enrichedConvos })
  } catch (error) {
    logger.error('List conversations error:', error)
    return res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
})

// ─── GET /api/messages/:conversationId ───
router.get('/:conversationId', async (req, res) => {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: req.params.conversationId }
    })

    if (!conversation) return res.status(404).json({ message: 'Conversation not found' })
    if (conversation.patientId !== req.user.userId && conversation.doctorId !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: req.params.conversationId },
      orderBy: { createdAt: 'asc' }
    })

    return res.json({ messages })
  } catch (error) {
    logger.error('List messages error:', error)
    return res.status(500).json({ message: 'Something went wrong. Please try again.' })
  }
})

// ─── POST /api/messages ───
router.post('/', upload.single('attachment'), async (req, res) => {
  try {
    const { receiverId, content } = req.body
    if (!receiverId || (!content && !req.file)) {
      return res.status(400).json({ message: 'Missing receiverId or content/attachment' })
    }

    const isDoctor = req.user.role === 'doctor'
    const patientId = isDoctor ? receiverId : req.user.userId
    const doctorId  = isDoctor ? req.user.userId : receiverId

    let conversation = await prisma.conversation.findFirst({ where: { patientId, doctorId } })
    if (!conversation) {
      conversation = await prisma.conversation.create({ data: { patientId, doctorId } })
    }

    // Upload attachment to Cloudinary if provided
    let fileUrl = null
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype, 'medilink_chat')
      fileUrl = result.secure_url
    }

    const message = await prisma.message.create({
      data: {
        content: content || 'File attachment',
        senderId: req.user.userId,
        conversationId: conversation.id,
        hasAttachment: !!fileUrl,
        fileUrl,
      }
    })

    await prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } })
    return res.status(201).json({ message, conversationId: conversation.id })
  } catch (error) {
    logger.error('Send message error:', error)
    return res.status(500).json({ message: error.message?.includes('allowed') ? error.message : 'Something went wrong.' })
  }
})

export default router
