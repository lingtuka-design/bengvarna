import { Hono } from 'hono'
import type { Env } from '../types'
import { ARTICLE_COLS } from '../db'
import { requireAuth } from '../auth'

export const featuredRoutes = new Hono<{ Bindings: Env }>()

featuredRoutes.get('/api/featured', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT ${ARTICLE_COLS}
     FROM featured_articles f0
     JOIN articles a ON a.id = f0.article_id
     LEFT JOIN categories c ON c.id = a.category_id
     LEFT JOIN featured_articles f ON f.article_id = a.id
     WHERE a.status = 'published'
     ORDER BY f0.position ASC`,
  ).all()
  c.header('Cache-Control', 'no-cache, no-store, must-revalidate')
  const primary = results.length > 0 ? results[0] : null
  const secondary = results.slice(1)
  return c.json({ primary, secondary })
})

featuredRoutes.put('/api/featured', requireAuth, async (c) => {
  const body = await c.req.json().catch(() => null)
  const items = (body?.items ?? []) as Array<{ article_id: number; position: number }>
  if (!Array.isArray(items) || items.length > 20) return c.json({ error: 'Invalid payload' }, 400)

  const seen = new Set<number>()
  const validItems: Array<{ article_id: number; position: number }> = []
  for (const item of items) {
    if (Number.isFinite(item.article_id) && Number.isFinite(item.position) && item.position >= 0 && !seen.has(item.article_id)) {
      seen.add(item.article_id)
      validItems.push(item)
    }
  }

  if (validItems.length > 0) {
    const ids = validItems.map((i) => i.article_id)
    const placeholders = ids.map(() => '?').join(', ')
    const { results } = await c.env.DB.prepare(
      `SELECT id FROM articles WHERE id IN (${placeholders})`,
    )
      .bind(...ids)
      .all<{ id: number }>()
    const existingIds = new Set(results.map((r) => r.id))
    const existingItems = validItems.filter((item) => existingIds.has(item.article_id))

    const batch: D1PreparedStatement[] = [c.env.DB.prepare('DELETE FROM featured_articles')]
    for (const item of existingItems) {
      batch.push(c.env.DB.prepare('INSERT INTO featured_articles (article_id, position) VALUES (?, ?)').bind(item.article_id, item.position))
    }
    await c.env.DB.batch(batch)
    return c.json({ ok: true })
  }

  await c.env.DB.prepare('DELETE FROM featured_articles').run()
  return c.json({ ok: true })
})

featuredRoutes.post('/api/featured/toggle', requireAuth, async (c) => {
  const body = await c.req.json().catch(() => null)
  const articleId = Number(body?.article_id)
  const featured = Boolean(body?.featured)
  if (!Number.isFinite(articleId)) return c.json({ error: 'Invalid article id' }, 400)

  const article = await c.env.DB.prepare('SELECT id, status FROM articles WHERE id = ?').bind(articleId).first<{ id: number; status: string }>()
  if (!article) return c.json({ error: 'Article not found' }, 404)

  if (featured) {
    if (article.status !== 'published') return c.json({ error: 'Only published articles can be featured' }, 400)
    const existing = await c.env.DB.prepare('SELECT id FROM featured_articles WHERE article_id = ?').bind(articleId).first()
    if (!existing) {
      const maxRow = await c.env.DB.prepare('SELECT COALESCE(MAX(position) + 1, 0) AS p FROM featured_articles').first<{ p: number }>()
      await c.env.DB.prepare('INSERT INTO featured_articles (article_id, position) VALUES (?, ?)').bind(articleId, maxRow?.p ?? 0).run()
    }
  } else {
    await c.env.DB.prepare('DELETE FROM featured_articles WHERE article_id = ?').bind(articleId).run()
  }
  return c.json({ ok: true })
})
