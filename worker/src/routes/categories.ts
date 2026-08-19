import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import type { Env } from '../types'
import { slugify } from '../db'
import { requireAuth, getSession, SESSION_COOKIE } from '../auth'

export const categoriesRoutes = new Hono<{ Bindings: Env }>()

categoriesRoutes.get('/api/categories', async (c) => {
  const all = c.req.query('all') === '1'
  let sql = `SELECT c.id, c.name, c.slug, c.description, c.color, c.sort_order, c.is_active,
       (SELECT COUNT(*) FROM articles a WHERE a.category_id = c.id) AS article_count
     FROM categories c`
  if (all) {
    const session = await getSession(c.env, getCookie(c, SESSION_COOKIE))
    if (!session) return c.json({ error: 'Unauthorized' }, 401)
    sql += ' ORDER BY c.sort_order ASC, c.name ASC'
    c.header('Cache-Control', 'no-store')
  } else {
    sql += ' WHERE c.is_active = 1 ORDER BY c.sort_order ASC, c.name ASC'
    c.header('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=120')
  }
  const { results } = await c.env.DB.prepare(sql).all()
  return c.json(results)
})

function parseCategoryBody(body: unknown) {
  const b = (body ?? {}) as Record<string, unknown>
  return {
    name: typeof b.name === 'string' ? b.name.trim().slice(0, 100) : '',
    slug: typeof b.slug === 'string' ? b.slug.trim().slice(0, 160) : '',
    description: typeof b.description === 'string' ? b.description.trim().slice(0, 500) : '',
    color: typeof b.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(b.color) ? b.color : '',
    sort_order: typeof b.sort_order === 'number' && Number.isFinite(b.sort_order) ? Math.floor(b.sort_order) : undefined,
    is_active: typeof b.is_active === 'boolean' ? (b.is_active ? 1 : 0) : 1,
  }
}

async function categorySlug(db: D1Database, base: string, excludeId?: number): Promise<string> {
  let slug = base
  let i = 2
  for (;;) {
    const row = excludeId
      ? await db.prepare('SELECT id FROM categories WHERE slug = ? AND id <> ?').bind(slug, excludeId).first()
      : await db.prepare('SELECT id FROM categories WHERE slug = ?').bind(slug).first()
    if (!row) return slug
    slug = `${base}-${i++}`
  }
}

categoriesRoutes.post('/api/categories', requireAuth, async (c) => {
  const body = await c.req.json().catch(() => null)
  const input = parseCategoryBody(body)
  if (!input.name) return c.json({ error: 'Name is required' }, 400)
  const slug = await categorySlug(c.env.DB, input.slug ? slugify(input.slug) : slugify(input.name))
  const maxRow = await c.env.DB.prepare('SELECT COALESCE(MAX(sort_order), 0) AS m FROM categories').first<{ m: number }>()
  const sortOrder = input.sort_order ?? (maxRow?.m ?? 0) + 1
  const res = await c.env.DB.prepare(
    'INSERT INTO categories (name, slug, description, color, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(input.name, slug, input.description, input.color, sortOrder, input.is_active)
    .run()
  const row = await c.env.DB.prepare(
    `SELECT c.id, c.name, c.slug, c.description, c.color, c.sort_order, c.is_active,
       (SELECT COUNT(*) FROM articles a WHERE a.category_id = c.id) AS article_count FROM categories c WHERE c.id = ?`,
  )
    .bind(res.meta.last_row_id)
    .first()
  return c.json(row, 201)
})

categoriesRoutes.put('/api/categories/:id', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400)
  const existing = await c.env.DB.prepare('SELECT * FROM categories WHERE id = ?').bind(id).first<Record<string, unknown>>()
  if (!existing) return c.json({ error: 'Category not found' }, 404)
  const body = await c.req.json().catch(() => null)
  const input = parseCategoryBody(body)
  const b = (body ?? {}) as Record<string, unknown>

  const name = b.name !== undefined ? input.name : String(existing.name ?? '')
  if (!name) return c.json({ error: 'Name is required' }, 400)
  let slug = String(existing.slug ?? '')
  if (b.slug !== undefined && b.slug !== null && input.slug) {
    slug = await categorySlug(c.env.DB, slugify(input.slug), id)
  }
  const description = b.description !== undefined ? input.description : String(existing.description ?? '')
  const color = b.color !== undefined ? input.color : String(existing.color ?? '')
  const sortOrder = b.sort_order !== undefined ? (input.sort_order ?? Number(existing.sort_order ?? 0)) : Number(existing.sort_order ?? 0)
  const isActive = b.is_active !== undefined ? input.is_active : Number(existing.is_active ?? 1)

  await c.env.DB.prepare('UPDATE categories SET name = ?, slug = ?, description = ?, color = ?, sort_order = ?, is_active = ? WHERE id = ?')
    .bind(name, slug, description, color, sortOrder, isActive, id)
    .run()
  const row = await c.env.DB.prepare(
    `SELECT c.id, c.name, c.slug, c.description, c.color, c.sort_order, c.is_active,
       (SELECT COUNT(*) FROM articles a WHERE a.category_id = c.id) AS article_count FROM categories c WHERE c.id = ?`,
  )
    .bind(id)
    .first()
  return c.json(row)
})

categoriesRoutes.delete('/api/categories/:id', requireAuth, async (c) => {
  const id = Number(c.req.param('id'))
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400)
  const existing = await c.env.DB.prepare('SELECT id FROM categories WHERE id = ?').bind(id).first()
  if (!existing) return c.json({ error: 'Category not found' }, 404)
  const count = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM articles WHERE category_id = ?').bind(id).first<{ n: number }>()
  if ((count?.n ?? 0) > 0) {
    return c.json({ error: 'This category is used by articles. Reassign or delete those articles first.' }, 409)
  }
  await c.env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run()
  return c.json({ ok: true })
})
