import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import type { Env } from '../types'
import { ensureAdmin } from '../db'
import {
  SESSION_COOKIE,
  verifyPassword,
  createSession,
  getSession,
  destroySession,
  setSessionCookie,
  clearSessionCookie,
  consumeLoginAttempt,
  getClientIp,
} from '../auth'

export const authRoutes = new Hono<{ Bindings: Env }>()

authRoutes.post('/login', async (c) => {
  await ensureAdmin(c.env)
  if (!consumeLoginAttempt(getClientIp(c))) {
    return c.json({ error: 'Too many attempts. Please try again later.' }, 429)
  }
  const body = await c.req.json().catch(() => null)
  const username = typeof body?.username === 'string' ? body.username.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!username || !password) return c.json({ error: 'Username and password are required' }, 400)

  const admin = await c.env.DB.prepare('SELECT id, username, password_hash FROM admins WHERE username = ?')
    .bind(username)
    .first<{ id: number; username: string; password_hash: string }>()
  if (!admin || !(await verifyPassword(admin.password_hash, password))) {
    return c.json({ error: 'Invalid username or password' }, 401)
  }

  const token = await createSession(c.env, admin.id)
  setSessionCookie(c, token)
  return c.json({ authenticated: true, username: admin.username })
})

authRoutes.post('/logout', async (c) => {
  await destroySession(c.env, getCookie(c, SESSION_COOKIE))
  clearSessionCookie(c)
  return c.json({ ok: true })
})

authRoutes.get('/session', async (c) => {
  await ensureAdmin(c.env)
  const session = await getSession(c.env, getCookie(c, SESSION_COOKIE))
  if (!session) return c.json({ authenticated: false })
  return c.json({ authenticated: true, username: session.username })
})
