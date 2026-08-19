import { Hono } from 'hono'
import type { Env } from '../types'
import { ARTICLE_COLS } from '../db'
import { requireAuth } from '../auth'

export const featuredRoutes = new Hono<{ Bindings: Env }>()

export async function assignFeaturedType(db: D1Database, articleId: number, type: 'none' | 'top' | 'sub') {
  if (type === 'none') {
    await db.prepare('DELETE FROM featured_articles WHERE article_id = ?').bind(articleId).run()
    return
  }

  if (type === 'top') {
    // 1. Remove whatever was at position 0 (Top Featured)
    // 2. Remove this article from anywhere in featured_articles
    // 3. Insert this article at position 0
    await db.batch([
      db.prepare('DELETE FROM featured_articles WHERE position = 0 OR article_id = ?').bind(articleId),
      db.prepare('INSERT INTO featured_articles (article_id, position) VALUES (?, 0)').bind(articleId),
    ])
    return
  }

  if (type === 'sub') {
    // 1. Fetch current sub-featured articles excluding this article
    const { results } = await db
      .prepare('SELECT article_id FROM featured_articles WHERE position >= 1 AND article_id <> ? ORDER BY position ASC')
      .bind(articleId)
      .all<{ article_id: number }>()

    // Keep at most 2 previous sub-featured articles (the 3rd is pushed out)
    const existing = results.slice(0, 2).map((r) => r.article_id)

    const batch: D1PreparedStatement[] = [
      // Remove this article and existing sub featured entries
      db.prepare('DELETE FROM featured_articles WHERE position >= 1 OR article_id = ?').bind(articleId),
      // New article takes position 1
      db.prepare('INSERT INTO featured_articles (article_id, position) VALUES (?, 1)').bind(articleId),
    ]

    // Shift existing: 1st becomes 2, 2nd becomes 3
    if (existing[0]) {
      batch.push(db.prepare('INSERT INTO featured_articles (article_id, position) VALUES (?, 2)').bind(existing[0]))
    }
    if (existing[1]) {
      batch.push(db.prepare('INSERT INTO featured_articles (article_id, position) VALUES (?, 3)').bind(existing[1]))
    }

    await db.batch(batch)
  }
}

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
  c.header('Cache-Control', 'public, max-age=10, s-maxage=30, stale-while-revalidate=60')
  const primary = results.find((r) => Number(r.featured_position) === 0) ?? (results.length > 0 ? results[0] : null)
  const secondary = results.filter((r) => r !== primary).slice(0, 3)
  return c.json({ primary, secondary })
})

featuredRoutes.post('/api/featured/assign', requireAuth, async (c) => {
  const body = await c.req.json().catch(() => null)
  const articleId = Number(body?.article_id)
  const type = body?.type as 'none' | 'top' | 'sub'
  if (!Number.isFinite(articleId) || !['none', 'top', 'sub'].includes(type)) {
    return c.json({ error: 'Invalid payload' }, 400)
  }

  const article = await c.env.DB.prepare('SELECT id, status FROM articles WHERE id = ?').bind(articleId).first<{ id: number; status: string }>()
  if (!article) return c.json({ error: 'Article not found' }, 404)

  if (type !== 'none' && article.status !== 'published') {
    return c.json({ error: 'Only published articles can be featured' }, 400)
  }

  await assignFeaturedType(c.env.DB, articleId, type)
  return c.json({ ok: true })
})
