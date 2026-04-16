import logger from '../utils/logger.js'
import express from 'express'
import Groq from 'groq-sdk'
import { authenticate } from '../middleware/authMiddleware.js'

const router = express.Router()

// Initialize Groq SDK. It automatically grabs GROQ_API_KEY from process.env
const groq = process.env.GROQ_API_KEY ? new Groq() : null

const SYSTEM_PROMPT = `
You are the MediLink AI Symptom Classifier. 
Your tone is empathetic, reassuring, and professional. 
CRITICAL RULE 1: You must NEVER provide a definitive medical diagnosis. 
CRITICAL RULE 2: Your sole purpose is to listen to the user's symptoms, briefly identify potential generic causes, and firmly recommend the exact medical specialist they should book an appointment with on the MediLink platform (e.g., Cardiologist, Dermatologist, General Physician).
CRITICAL RULE 3: If symptoms sound like a severe emergency (e.g. chest pain, severe bleeding, stroke signs), explicitly tell them to use the SOS Dispatch button immediately.
`

router.use(authenticate)

router.post('/symptoms', async (req, res) => {
  try {
    if (!groq) {
      return res.status(503).json({ error: 'AI Service is currently disabled (No API Key).' })
    }

    const { messages } = req.body
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Chat messages payload is required.' })
    }

    // Format the conversation for Groq API
    const conversation = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    ]

    const chatCompletion = await groq.chat.completions.create({
      messages: conversation,
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      max_tokens: 1024,
    })

    const aiMessage = chatCompletion.choices[0]?.message?.content || "I apologize, but I could not formulate a response at this time."

    return res.json({ response: aiMessage })
  } catch (error) {
    logger.error('Groq AI Error:', error)
    return res.status(500).json({ error: 'Failed to process AI request.' })
  }
})

export default router
