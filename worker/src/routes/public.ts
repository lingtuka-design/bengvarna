import { Hono } from 'hono'
import type { Env } from '../types'
import { ensureSettings, getSettings } from '../db'

export const publicRoutes = new Hono<{ Bindings: Env }>()

publicRoutes.get('/api/bootstrap', async (c) => {
  await ensureSettings(c.env)
  const settings = await getSettings(c.env)
  const categories = await c.env.DB.prepare(
    `SELECT c.id, c.name, c.slug, c.description, c.color, c.sort_order, c.is_active,
       (SELECT COUNT(*) FROM articles a WHERE a.category_id = c.id AND a.status = 'published') AS article_count
     FROM categories c
     WHERE c.is_active = 1
     ORDER BY c.sort_order ASC, c.name ASC`,
  ).all()
  c.header('Cache-Control', 'public, max-age=300')
  return c.json({ settings, categories: categories.results })
})

publicRoutes.get('/media/*', async (c) => {
  const key = c.req.path.slice('/media/'.length)
  if (!key) return c.notFound()
  const obj = await c.env.MEDIA.get(key)
  if (!obj) return c.notFound()
  const headers = new Headers()
  headers.set('Content-Type', obj.httpMetadata?.contentType || 'application/octet-stream')
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  headers.set('Content-Length', String(obj.size))
  if (obj.httpEtag) headers.set('ETag', obj.httpEtag)
  return new Response(obj.body as ReadableStream, { headers })
})

publicRoutes.get('/sitemap.xml', async (c) => {
  const base = (c.env.PUBLIC_SITE_URL || new URL(c.req.url).origin).replace(/\/$/, '')
  const { results } = await c.env.DB.prepare(
    `SELECT slug, strftime('%Y-%m-%dT%H:%M:%SZ', updated_at) AS updated_at
     FROM articles WHERE status = 'published' ORDER BY COALESCE(published_at, created_at) DESC`,
  ).all<{ slug: string; updated_at: string }>()
  const urls = results
    .map((r) => `  <url><loc>${base}/article/${r.slug}</loc><lastmod>${r.updated_at.slice(0, 10)}</lastmod></url>`)
    .join('\n')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${base}/</loc></url>\n  <url><loc>${base}/news</loc></url>\n  <url><loc>${base}/search</loc></url>\n  <url><loc>${base}/about</loc></url>\n${urls}\n</urlset>`
  c.header('Content-Type', 'application/xml; charset=utf-8')
  c.header('Cache-Control', 'public, max-age=3600')
  return c.body(xml)
})
