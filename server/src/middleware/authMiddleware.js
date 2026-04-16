import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) throw new Error('FATAL: JWT_SECRET environment variable is not set!')

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded // { userId, email, role }
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}
