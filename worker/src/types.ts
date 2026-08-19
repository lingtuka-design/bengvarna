export interface Env {
  DB: D1Database
  MEDIA: R2Bucket
  ASSETS?: Fetcher
  ADMIN_USERNAME?: string
  ADMIN_PASSWORD?: string
  SESSION_SECRET?: string
  PUBLIC_SITE_URL?: string
}

export interface SessionRow {
  id: string
  admin_id: number
  expires_at_ms: number
  username: string
}
