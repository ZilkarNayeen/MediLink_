import logger from '../utils/logger.js'

/**
 * Global Express error handler.
 * Mount this LAST in index.js — after all routes.
 * Catches any error passed via next(err) or thrown in async routes.
 */
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const statusCode = err.status || err.statusCode || 500

  // Build rich context for the log entry
  const context = {
    method:   req.method,
    path:     req.path,
    ip:       req.ip,
    userId:   req.user?.userId || 'unauthenticated',
    userRole: req.user?.role  || 'none',
    status:   statusCode,
    body:     statusCode < 500 ? undefined : req.body, // only log body on 5xx
  }

  if (statusCode >= 500) {
    logger.error(err.message || 'Unhandled server error', { ...context, stack: err.stack })
  } else if (statusCode >= 400) {
    logger.warn(err.message || 'Client error', context)
  }

  // Never leak internal details to the client in production
  const clientMessage = statusCode >= 500
    ? 'An unexpected error occurred. Our team has been notified.'
    : err.message || 'Request error'

  return res.status(statusCode).json({ message: clientMessage })
}

/**
 * 404 catch-all — mount before errorHandler
 */
export function notFound(req, res, next) {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`)
  err.status = 404
  next(err)
}
