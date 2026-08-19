import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import type { Env } from '../types'
import { ARTICLE_COLS, ARTICLE_FROM, slugify, uniqueSlug, fetchArticleById } from '../db'
import { requireAuth, getSession, SESSION_COOKIE } from '../auth'

export const articlesRoutes = new Hono<{ Bindings: Env }>()

const VALID_STATUSES = ['draft', 'published', 'archived'] as const

function basicHtmlCheck(html: string): boolean {
  if (!html) return true
  const lower = html.toLowerCase()
  if (
    /<\s*script/i.test(lower) ||
    /\son[a-z]+\s*=/i.test(lower) ||
    /javascript\s*:/i.test(lower) ||
    /<\s*(iframe|object|embed|form)/i.test(lower)
  ) {
    return false
  }
  return true
}

function stripHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function parseArticleBody(body: unknown) {
  const b = (body ?? {}) as Record<string, unknown>
  const title = typeof b.title === 'string' ? b.title.trim().slice(0, 300) : ''
  const slug = typeof b.slug === 'string' ? b.slug.trim().slice(0, 160) : ''
  const content = typeof b.content === 'string' ? b.content : ''
  let excerpt = typeof b.excerpt === 'string' ? b.excerpt.trim().slice(0, 500) : ''
  if (!excerpt && content) {
    excerpt = stripHtml(content).slice(0, 240)
  }
  const cover_image_url = typeof b.cover_image_url === 'string' ? b.cover_image_url.slice(0, 600) : ''
  const social_image_url = typeof b.social_image_url === 'string' ? b.social_image_url.slice(0, 600) : ''
  const category_id = b.category_id === null || b.category_id === undefined || b.category_id === '' ? null : Number(b.category_id)
  const author = typeof b.author === 'string' ? b.author.trim().slice(0, 100) : ''
  const status = VALID_STATUSES.includes(b.status as (typeof VALID_STATUSES)[number]) ? (b.status as string) : 'draft'
  const seo_title = typeof b.seo_title === 'string' ? b.seo_title.slice(0, 200) : ''
  const seo_description = typeof b.seo_description === 'string' ? b.seo_description.slice(0, 300) : ''
  const published_at = typeof b.published_at === 'string' && b.published_at ? b.published_at : null
  return { title, slug, excerpt, content, cover_image_url, social_image_url, category_id, author, status, seo_title, seo_description, published_at }
}

async function validateCategory(db: D1Database, categoryId: number | null) {
  if (categoryId === null || !Number.isFinite(categoryId)) return true
  const cat = await db.prepare('SELECT id FROM categories WHERE id = ?').bind(categoryId).first()
  return Boolean(cat)
}

articlesRoutes.get('/api/articles', async (c) => {
  const q = (c.req.query('q') || '').trim()
  const category = (c.req.query('category') || '').trim()
  const all = c.req.query('all') === '1'
  const statusQ = (c.req.query('status') || '').trim()
  const featuredOnly = c.req.query('featured') === '1'
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10) || 1)
  const perPage = Math.min(50, Math.max(1, parseInt(c.req.query('perPage') || '12', 10) || 12))
  const offset = (page - 1) * perPage

  let isAdmin = false
  if (all || statusQ || featuredOnly) {
    const session = await getSession(c.env, getCookie(c, SESSION_COOKIE))
    if (!session) return c.json({ error: 'Unauthorized' }, 401)
    isAdmin = true
  }

  const where: string[] = []
  const binds: (string | number)[] = []
  if (q) {
    const like = `%${q.replace(/[\\%_]/g, (m) => '\\' + m)}%`
    where.push(`(a.title LIKE ? ESCAPE '\\' OR a.excerpt LIKE ? ESCAPE '\\' OR a.content LIKE ? ESCAPE '\\' OR c.name LIKE ? ESCAPE '\\')`)
    binds.push(like, like, like, like)
  }
  if (category) {
    where.push('c.slug = ?')
    binds.push(category)
  }
  if (isAdmin) {
    if (statusQ && VALID_STATUSES.includes(statusQ as (typeof VALID_STATUSES)[number])) {
      where.push('a.status = ?')
      binds.push(statusQ)
    }
    if (featuredOnly) where.push('f.position IS NOT NULL')
  } else {
    where.push(`a.status = 'published'`)
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const countRow = await c.env.DB.prepare(
    `SELECT COUNT(*) AS n FROM articles a LEFT JOIN categories c ON c.id = a.category_id LEFT JOIN featured_articles f ON f.article_id = a.id ${whereSql}`,
  )
    .bind(...binds)
    .first<{ n: number }>()
  const total = countRow?.n ?? 0

  const { results } = await c.env.DB.prepare(
    `SELECT ${ARTICLE_COLS} ${ARTICLE_FROM} ${whereSql} ORDER BY COALESCE(a.published_at, a.created_at) DESC LIMIT ? OFFSET ?`,
  )
    .bind(...binds, perPage, offset)
    .all()

  c.header('Cache-Control', isAdmin ? 'no-store' : 'public, max-age=60')
  return c.json({ items: results, total, page, perPage, totalPages: Math.max(1, Math.ceil(total / perPage)) })
})

articlesRoutes.get('/api/admin/articles/:id', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400)
  const row = await fetchArticleById(c.env.DB, id)
  if (!row) return c.json({ error: 'Article not found' }, 404)
  return c.json(row)
})

articlesRoutes.get('/api/articles/:slug', async (c) => {
  const slug = c.req.param('slug')
  const row = await c.env.DB.prepare(
    `SELECT ${ARTICLE_COLS}, a.content ${ARTICLE_FROM} WHERE a.slug = ? AND a.status = 'published'`,
  )
    .bind(slug)
    .first()
  if (!row) return c.json({ error: 'Article not found' }, 404)
  c.header('Cache-Control', 'public, max-age=60')
  return c.json(row)
})

articlesRoutes.post('/api/articles', requireAuth, async (c) => {
  const body = await c.req.json().catch(() => null)
  if (!body || typeof body !== 'object') return c.json({ error: 'Invalid request' }, 400)
  const input = parseArticleBody(body)
  if (!input.title) return c.json({ error: 'Title is required' }, 400)
  if (!basicHtmlCheck(input.content)) return c.json({ error: 'Content contains unsafe markup' }, 400)
  if (input.category_id !== null && !Number.isFinite(input.category_id)) return c.json({ error: 'Invalid category' }, 400)
  if (!(await validateCategory(c.env.DB, input.category_id))) return c.json({ error: 'Category not found' }, 400)

  const slug = await uniqueSlug(c.env.DB, input.slug ? slugify(input.slug) : slugify(input.title))
  let publishedAt: string | null = null
  if (input.status === 'published') {
    const provided = input.published_at ? new Date(input.published_at) : null
    publishedAt = provided && !Number.isNaN(provided.getTime()) ? provided.toISOString() : new Date().toISOString()
  }

  const res = await c.env.DB.prepare(
    `INSERT INTO articles (title, slug, excerpt, content, cover_image_url, social_image_url, category_id, author, status, seo_title, seo_description, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(input.title, slug, input.excerpt, input.content, input.cover_image_url, input.social_image_url, input.category_id, input.author, input.status, input.seo_title, input.seo_description, publishedAt)
    .run()
  const id = Number(res.meta.last_row_id)
  const row = await fetchArticleById(c.env.DB, id)
  return c.json(row, 201)
})

articlesRoutes.put('/api/articles/:id', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400)
  const existing = await c.env.DB.prepare('SELECT * FROM articles WHERE id = ?').bind(id).first<Record<string, unknown>>()
  if (!existing) return c.json({ error: 'Article not found' }, 404)

  const body = await c.req.json().catch(() => null)
  if (!body || typeof body !== 'object') return c.json({ error: 'Invalid request' }, 400)
  const input = parseArticleBody(body)
  const b = body as Record<string, unknown>

  const title = b.title !== undefined ? input.title : String(existing.title ?? '')
  if (!title) return c.json({ error: 'Title is required' }, 400)
  const content = b.content !== undefined ? input.content : String(existing.content ?? '')
  if (!basicHtmlCheck(content)) return c.json({ error: 'Content contains unsafe markup' }, 400)

  const categoryId = b.category_id !== undefined ? input.category_id : (existing.category_id as number | null)
  if (categoryId !== null && !Number.isFinite(categoryId)) return c.json({ error: 'Invalid category' }, 400)
  if (!(await validateCategory(c.env.DB, categoryId))) return c.json({ error: 'Category not found' }, 400)

  let slug = String(existing.slug ?? '')
  if (b.slug !== undefined && b.slug !== null && input.slug) {
    slug = await uniqueSlug(c.env.DB, slugify(input.slug), id)
  }

  const status = b.status !== undefined ? input.status : String(existing.status ?? 'draft')
  let publishedAt = (existing.published_at as string | null) ?? null
  if (status === 'published') {
    if (b.published_at !== undefined && input.published_at) {
      const provided = new Date(input.published_at)
      publishedAt = Number.isNaN(provided.getTime()) ? publishedAt ?? new Date().toISOString() : provided.toISOString()
    }
    if (!publishedAt) publishedAt = new Date().toISOString()
  } else {
    publishedAt = null
  }

  const excerpt = b.excerpt !== undefined ? input.excerpt : String(existing.excerpt ?? '')
  const cover_image_url = b.cover_image_url !== undefined ? input.cover_image_url : String(existing.cover_image_url ?? '')
  const social_image_url = b.social_image_url !== undefined ? input.social_image_url : String(existing.social_image_url ?? '')
  const author = b.author !== undefined ? input.author : String(existing.author ?? '')
  const seo_title = b.seo_title !== undefined ? input.seo_title : String(existing.seo_title ?? '')
  const seo_description = b.seo_description !== undefined ? input.seo_description : String(existing.seo_description ?? '')

  await c.env.DB.prepare(
    `UPDATE articles SET title = ?, slug = ?, excerpt = ?, content = ?, cover_image_url = ?, social_image_url = ?,
       category_id = ?, author = ?, status = ?, seo_title = ?, seo_description = ?, published_at = ?, updated_at = datetime('now')
     WHERE id = ?`,
  )
    .bind(title, slug, excerpt, content, cover_image_url, social_image_url, categoryId, author, status, seo_title, seo_description, publishedAt, id)
    .run()

  const row = await fetchArticleById(c.env.DB, id)
  return c.json(row)
})

articlesRoutes.delete('/api/articles/:id', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400)
  const existing = await c.env.DB.prepare('SELECT id FROM articles WHERE id = ?').bind(id).first()
  if (!existing) return c.json({ error: 'Article not found' }, 404)
  await c.env.DB.prepare('DELETE FROM articles WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})

articlesRoutes.post('/api/articles/:id/duplicate', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400)
  const src = await c.env.DB.prepare('SELECT * FROM articles WHERE id = ?').bind(id).first<Record<string, string | number | null>>()
  if (!src) return c.json({ error: 'Article not found' }, 404)
  const slug = await uniqueSlug(c.env.DB, `${src.slug}-copy`)
  const res = await c.env.DB.prepare(
    `INSERT INTO articles (title, slug, excerpt, content, cover_image_url, social_image_url, category_id, author, status, seo_title, seo_description, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, NULL)`,
  )
    .bind(`${src.title} (Copy)`, slug, src.excerpt, src.content, src.cover_image_url, src.social_image_url, src.category_id, src.author, src.seo_title, src.seo_description)
    .run()
  const row = await fetchArticleById(c.env.DB, Number(res.meta.last_row_id))
  return c.json(row, 201)
})
