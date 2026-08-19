import { Hono } from 'hono'
import type { Env } from '../types'
import { requireAuth } from '../auth'
import { ensureSettings, getSettings } from '../db'

export const settingsRoutes = new Hono<{ Bindings: Env }>()

const ALLOWED_KEYS = [
  'site_name',
  'site_description',
  'logo_url',
  'default_social_image',
  'default_seo_title',
  'default_seo_description',
]

settingsRoutes.get('/api/settings', requireAuth, async (c) => {
  await ensureSettings(c.env)
  return c.json(await getSettings(c.env))
})

settingsRoutes.put('/api/settings', requireAuth, async (c) => {
  const body = await c.req.json().catch(() => null)
  if (!body || typeof body !== 'object') return c.json({ error: 'Invalid request' }, 400)
  const batch: D1PreparedStatement[] = []
  for (const key of ALLOWED_KEYS) {
    const value = (body as Record<string, unknown>)[key]
    if (typeof value === 'string') {
      batch.push(c.env.DB.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').bind(key, value.slice(0, 1000)))
    }
  }
  if (batch.length) await c.env.DB.batch(batch)
  return c.json(await getSettings(c.env))
})
