import { Hono } from 'hono'
import type { Env } from '../types'
import { requireAuth } from '../auth'

export const mediaRoutes = new Hono<{ Bindings: Env }>()

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const MAX_SIZE = 10 * 1024 * 1024

function magicBytesOk(bytes: Uint8Array, mime: string): boolean {
  switch (mime) {
    case 'image/jpeg':
      return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    case 'image/png':
      return bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    case 'image/webp':
      return (
        bytes.length >= 12 &&
        String.fromCharCode(bytes[0]!, bytes[1]!, bytes[2]!, bytes[3]!) === 'RIFF' &&
        String.fromCharCode(bytes[8]!, bytes[9]!, bytes[10]!, bytes[11]!) === 'WEBP'
      )
    case 'image/avif':
      return (
        bytes.length >= 12 &&
        String.fromCharCode(bytes[4]!, bytes[5]!, bytes[6]!, bytes[7]!) === 'ftyp' &&
        bytes[8] === 0x61 &&
        bytes[9] === 0x76 &&
        bytes[10] === 0x69
      )
    default:
      return false
  }
}

function extFromType(mime: string): string {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/avif':
      return 'avif'
    default:
      return 'bin'
  }
}

mediaRoutes.get('/api/media', requireAuth, async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10) || 1)
  const perPage = Math.min(100, Math.max(1, parseInt(c.req.query('perPage') || '24', 10) || 24))
  const offset = (page - 1) * perPage
  const countRow = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM media').first<{ n: number }>()
  const total = countRow?.n ?? 0
  const { results } = await c.env.DB.prepare(
    `SELECT id, object_key, original_name, content_type, size, alt_text, url,
       strftime('%Y-%m-%dT%H:%M:%SZ', created_at) AS created_at
     FROM media ORDER BY created_at DESC LIMIT ? OFFSET ?`,
  )
    .bind(perPage, offset)
    .all()
  c.header('Cache-Control', 'no-store')
  return c.json({ items: results, total, page, perPage, totalPages: Math.max(1, Math.ceil(total / perPage)) })
})

mediaRoutes.post('/api/media/upload', requireAuth, async (c) => {
  const form = await c.req.formData().catch(() => null)
  if (!form) return c.json({ error: 'Invalid form data' }, 400)
  const file = form.get('file') as unknown as File | null
  if (!file) return c.json({ error: 'No file provided' }, 400)
  if (!ALLOWED_TYPES.includes(file.type)) {
    return c.json({ error: 'Only JPEG, PNG, WebP and AVIF images are allowed' }, 415)
  }
  if (file.size === 0 || file.size > MAX_SIZE) {
    return c.json({ error: 'Image must be between 1 byte and 10 MB' }, 413)
  }
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  if (!magicBytesOk(head, file.type)) {
    return c.json({ error: 'File content does not match its declared type' }, 415)
  }

  const now = new Date()
  const key = `uploads/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${crypto.randomUUID()}.${extFromType(file.type)}`
  await c.env.MEDIA.put(key, file.stream(), {
    httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' },
  })

  const alt = typeof form.get('alt') === 'string' ? (form.get('alt') as string).slice(0, 300) : ''
  const url = `/media/${key}`
  const res = await c.env.DB.prepare(
    'INSERT INTO media (object_key, original_name, content_type, size, alt_text, url) VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(key, file.name.slice(0, 300), file.type, file.size, alt, url)
    .run()
  return c.json(
    { id: Number(res.meta.last_row_id), object_key: key, original_name: file.name, content_type: file.type, size: file.size, alt_text: alt, url },
    201,
  )
})

mediaRoutes.delete('/api/media/:id', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400)
  const row = await c.env.DB.prepare('SELECT id, object_key FROM media WHERE id = ?').bind(id).first<{ id: number; object_key: string }>()
  if (!row) return c.json({ error: 'File not found' }, 404)
  await c.env.MEDIA.delete(row.object_key).catch(() => null)
  await c.env.DB.prepare('DELETE FROM media WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})
