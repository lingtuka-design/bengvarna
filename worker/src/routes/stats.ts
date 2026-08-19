import { Hono } from 'hono'
import type { Env } from '../types'
import { ARTICLE_COLS, ARTICLE_FROM } from '../db'
import { requireAuth } from '../auth'

export const statsRoutes = new Hono<{ Bindings: Env }>()

statsRoutes.get('/api/stats', requireAuth, async (c) => {
  const db = c.env.DB
  const [total, published, drafts, archived, categories, featured, media] = await Promise.all([
    db.prepare('SELECT COUNT(*) AS n FROM articles').first<{ n: number }>(),
    db.prepare(`SELECT COUNT(*) AS n FROM articles WHERE status = 'published'`).first<{ n: number }>(),
    db.prepare(`SELECT COUNT(*) AS n FROM articles WHERE status = 'draft'`).first<{ n: number }>(),
    db.prepare(`SELECT COUNT(*) AS n FROM articles WHERE status = 'archived'`).first<{ n: number }>(),
    db.prepare('SELECT COUNT(*) AS n FROM categories').first<{ n: number }>(),
    db.prepare('SELECT COUNT(*) AS n FROM featured_articles').first<{ n: number }>(),
    db.prepare('SELECT COUNT(*) AS n FROM media').first<{ n: number }>(),
  ])
  const { results } = await db.prepare(
    `SELECT ${ARTICLE_COLS} ${ARTICLE_FROM} ORDER BY COALESCE(a.published_at, a.created_at) DESC LIMIT 8`,
  ).all()
  c.header('Cache-Control', 'no-store')
  return c.json({
    total_articles: total?.n ?? 0,
    published: published?.n ?? 0,
    drafts: drafts?.n ?? 0,
    archived: archived?.n ?? 0,
    categories: categories?.n ?? 0,
    featured: featured?.n ?? 0,
    media: media?.n ?? 0,
    recent: results,
  })
})
