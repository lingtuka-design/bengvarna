import { Hono } from 'hono'
import type { Env } from './types'
import { authRoutes } from './routes/auth'
import { articlesRoutes } from './routes/articles'
import { categoriesRoutes } from './routes/categories'
import { featuredRoutes } from './routes/featured'
import { mediaRoutes } from './routes/media'
import { settingsRoutes } from './routes/settings'
import { statsRoutes } from './routes/stats'
import { publicRoutes } from './routes/public'

const app = new Hono<{ Bindings: Env }>()

app.onError((err, c) => {
  console.error('[bengvarna]', err)
  return c.json({ error: 'Internal server error' }, 500)
})

app.use('/api/*', async (c, next) => {
  await next()
  c.header('X-Content-Type-Options', 'nosniff')
})

app.use('/api/*', async (c, next) => {
  const method = c.req.method
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    const url = new URL(c.req.url)
    if (url.protocol === 'https:') {
      const origin = c.req.header('origin')
      const allowed = c.env.PUBLIC_SITE_URL ? new URL(c.env.PUBLIC_SITE_URL).origin : url.origin
      if (origin && origin !== allowed) return c.json({ error: 'Invalid origin' }, 403)
    }
  }
  await next()
})

app.route('/api/auth', authRoutes)
app.route('/', publicRoutes)
app.route('/', articlesRoutes)
app.route('/', categoriesRoutes)
app.route('/', featuredRoutes)
app.route('/', mediaRoutes)
app.route('/', settingsRoutes)
app.route('/', statsRoutes)

app.get('*', async (c) => {
  const path = new URL(c.req.url).pathname
  if (path.startsWith('/api/') || path.startsWith('/media/')) return c.json({ error: 'Not found' }, 404)
  if (!c.env.ASSETS) return new Response('Not found', { status: 404 })
  return c.env.ASSETS.fetch(c.req.raw)
})

export default app
