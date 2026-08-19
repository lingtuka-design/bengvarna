import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import type { Context, MiddlewareHandler } from 'hono'
import type { Env, SessionRow } from './types'
import { sha256Hex, toHex, ensureAdmin } from './db'

export const SESSION_COOKIE = 'bengvarna_session'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

export async function verifyPassword(stored: string, password: string): Promise<boolean> {
  const [salt, hash] = stored.split('$')
  if (!salt || !hash) return false
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 120000, hash: 'SHA-256' },
    key,
    256,
  )
  return safeEqual(toHex(new Uint8Array(bits)), hash)
}

function safeEqual(a: string, b: string): boolean {
  const ua = new TextEncoder().encode(a)
  const ub = new TextEncoder().encode(b)
  if (ua.length !== ub.length) return false
  let diff = 0
  for (let i = 0; i < ua.length; i++) diff |= ua[i]! ^ ub[i]!
  return diff === 0
}

export async function createSession(env: Env, adminId: number): Promise<string> {
  const token = toHex(crypto.getRandomValues(new Uint8Array(32)))
  const tokenHash = await sha256Hex(token)
  await env.DB.prepare('INSERT INTO sessions (id, token_hash, admin_id, expires_at_ms) VALUES (?, ?, ?, ?)')
    .bind(crypto.randomUUID(), tokenHash, adminId, Date.now() + SESSION_TTL_MS)
    .run()
  return token
}

export async function getSession(env: Env, token: string | undefined): Promise<SessionRow | null> {
  if (!token) return null
  const hash = await sha256Hex(token)
  const row = await env.DB.prepare(
    `SELECT s.id, s.admin_id, s.expires_at_ms, a.username
     FROM sessions s JOIN admins a ON a.id = s.admin_id
     WHERE s.token_hash = ?`,
  )
    .bind(hash)
    .first<SessionRow>()
  if (!row) return null
  if (row.expires_at_ms < Date.now()) {
    await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(row.id).run()
    return null
  }
  return row
}

export async function destroySession(env: Env, token: string | undefined): Promise<void> {
  if (!token) return
  const hash = await sha256Hex(token)
  await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(hash).run()
}

export function setSessionCookie(c: Context, token: string): void {
  const secure = new URL(c.req.url).protocol === 'https:'
  setCookie(c, SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    secure,
    sameSite: 'Lax',
    maxAge: SESSION_TTL_MS / 1000,
  })
}

export function clearSessionCookie(c: Context): void {
  deleteCookie(c, SESSION_COOKIE, { path: '/' })
}

export const requireAuth: MiddlewareHandler<{ Bindings: Env; Variables: { adminId: number } }> = async (c, next) => {
  await ensureAdmin(c.env)
  const session = await getSession(c.env, getCookie(c, SESSION_COOKIE))
  if (!session) return c.json({ error: 'Unauthorized' }, 401)
  c.set('adminId', session.admin_id)
  await next()
}

const attempts = new Map<string, { count: number; resetAt: number }>()
const RATE_MAX = 10
const RATE_WINDOW_MS = 15 * 60 * 1000

export function consumeLoginAttempt(key: string): boolean {
  const now = Date.now()
  const rec = attempts.get(key)
  if (!rec || now > rec.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  if (rec.count >= RATE_MAX) return false
  rec.count += 1
  return true
}

export function getClientIp(c: Context): string {
  return c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}
