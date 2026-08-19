import type { Env } from './types'

export const ARTICLE_COLS = `
  a.id, a.title, a.slug, a.excerpt, a.cover_image_url, a.social_image_url,
  a.category_id, a.author, a.status, a.seo_title, a.seo_description, a.published_at,
  strftime('%Y-%m-%dT%H:%M:%SZ', a.created_at) AS created_at,
  strftime('%Y-%m-%dT%H:%M:%SZ', a.updated_at) AS updated_at,
  c.name AS category_name, c.slug AS category_slug,
  f.position AS featured_position
`

export const ARTICLE_FROM = `
  FROM articles a
  LEFT JOIN categories c ON c.id = a.category_id
  LEFT JOIN featured_articles f ON f.article_id = a.id
`

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120) || 'article'
  )
}

export async function uniqueSlug(db: D1Database, base: string, excludeId?: number): Promise<string> {
  let slug = base
  let i = 2
  for (;;) {
    const row = excludeId
      ? await db.prepare('SELECT id FROM articles WHERE slug = ? AND id <> ?').bind(slug, excludeId).first()
      : await db.prepare('SELECT id FROM articles WHERE slug = ?').bind(slug).first()
    if (!row) return slug
    slug = `${base}-${i++}`
  }
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return toHex(new Uint8Array(digest))
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 10000, hash: 'SHA-256' },
    key,
    256,
  )
  return toHex(new Uint8Array(bits))
}

export async function ensureAdmin(env: Env): Promise<void> {
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM admins').first<{ n: number }>()
  if (row && row.n > 0) return
  const username = env.ADMIN_USERNAME || 'admin'
  const password = env.ADMIN_PASSWORD || 'admin1234'
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)))
  const hash = await hashPassword(password, salt)
  await env.DB.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').bind(username, `${salt}$${hash}`).run()
  console.warn(`[bengvarna] Seeded admin user "${username}" from environment variables. Set ADMIN_USERNAME/ADMIN_PASSWORD secrets before deploying to production.`)
}

const DEFAULT_SETTINGS: Record<string, string> = {
  site_name: 'bengvarna',
  site_description: 'Fast to read. Fast to publish. Beautiful everywhere.',
  logo_url: '',
  default_social_image: '',
  default_seo_title: 'bengvarna — Modern news, beautifully delivered',
  default_seo_description: 'bengvarna is a fast, elegant digital news platform built for readers on every screen.',
}

export async function ensureSettings(env: Env): Promise<void> {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await env.DB.prepare('INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)').bind(key, value).run()
  }
}

export async function getSettings(env: Env): Promise<Record<string, string>> {
  const { results } = await env.DB.prepare('SELECT key, value FROM site_settings').all<{ key: string; value: string }>()
  const out: Record<string, string> = { ...DEFAULT_SETTINGS }
  for (const row of results) out[row.key] = row.value
  return out
}

export async function fetchArticleById(db: D1Database, id: number) {
  return db
    .prepare(`SELECT ${ARTICLE_COLS}, a.content ${ARTICLE_FROM} WHERE a.id = ?`)
    .bind(id)
    .first()
}
