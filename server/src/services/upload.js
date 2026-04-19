import { v2 as cloudinary } from 'cloudinary'
import multer from 'multer'
import { Readable } from 'stream'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// ── Allowed MIME types ──
const ALLOWED_MIMETYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

// ── Store in memory, upload to Cloudinary manually ──
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB cap
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
      return cb(new Error('Only images (JPEG/PNG/WebP), PDFs and Word docs are allowed.'))
    }
    cb(null, true)
  },
})

// ── Helper: upload buffer to Cloudinary ──
export async function uploadToCloudinary(buffer, mimetype, folder = 'medilink_uploads') {
  return new Promise((resolve, reject) => {
    const resourceType = mimetype.startsWith('image/') ? 'image' : 'raw'
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error)
        resolve(result)
      }
    )
    Readable.from(buffer).pipe(stream)
  })
}
