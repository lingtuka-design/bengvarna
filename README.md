# bengvarna

A production-ready digital news platform. **Fast to read. Fast to publish. Beautiful everywhere.**

Built with **Vite + React + TypeScript + TanStack Router + Tailwind CSS** on the front end and a **Cloudflare Workers** backend with **D1** (structured data) and **R2** (images).

```
client/   Vite + React + TS + TanStack Router + Tailwind CSS v4 (public site + admin)
worker/   Cloudflare Worker API (Hono), D1 schema + migrations, R2 uploads
```

## Features

- **Public site** — editorial homepage with admin-configurable featured news (1 primary + N secondary stories, reorderable), latest-news grid, category pages, article pages with reading-optimized typography, search, about page, 404, sitemap.
- **Deliberate mobile experience** — continuous single-column feed with horizontal cards, sticky compact header, bottom-sheet menus and bottom navigation in the admin.
- **Admin panel at `/admin`** — dashboard with stats, full article CRUD (draft / published / archived, duplicate, preview, featured toggle), category manager with reordering and colors, featured-news manager with ordering, media library, site settings.
- **Rich text editor** — lightweight custom contentEditable editor (headings, bold/italic/underline, links, blockquotes, lists, alignment, images with captions, horizontal rules, undo/redo) with sanitization on save **and** on render (DOMPurify). Server does a defense-in-depth markup check.
- **R2 uploads** — direct uploads through the worker with MIME + magic-byte validation, 10 MB limit, JPEG/PNG/WebP/AVIF, upload progress, media library with copy-URL and delete.
- **Authentication** — custom session auth (PBKDF2-hashed password, HttpOnly SameSite=Lax session cookie, hashed tokens in D1, login rate limiting, origin check for state-changing requests). Admin API routes return 401; the frontend redirects to `/admin/login`.
- **SEO & sharing** — automatic title/description/canonical/OG/Twitter tags per page, article `og:type=article`, admin-overridable SEO title/description/social image, share buttons for X, Facebook, WhatsApp, Telegram and copy-link, `sitemap.xml`, `robots.txt`.
- **Theme** — light / dark / system with localStorage persistence, pre-paint inline script (no flash), full `prefers-reduced-motion` support.
- **Performance** — route-level code splitting (React.lazy + Suspense), lazy-loaded images, cache headers on public API and media, no heavy UI libraries.
- **Accessibility** — semantic HTML, labeled forms, keyboard-friendly modals/drawers, focus-visible rings, aria-live toasts, alt text, accessible contrast in both themes.

## Requirements

- Node.js 20+
- npm 10+
- A Cloudflare account for deployment (not needed for local development)

## Quick start (local development)

```bash
npm install
npm run db:migrate:local     # apply D1 migrations + seed data to the local D1
```

Two terminals:

```bash
npm run dev:worker           # Cloudflare Worker API on http://localhost:8787
npm run dev                  # Vite dev server on http://localhost:5173
```

Open http://localhost:5173 — the Vite server proxies `/api` and `/media` to the worker.

> Local D1/R2 state lives in `worker/.wrangler/state`. Delete it and re-run the migration to reset.

### Default admin credentials (development only)

```
Username: admin
Password: admin1234
```

The first time the auth endpoint is hit, the worker seeds this admin user from the
`ADMIN_USERNAME` / `ADMIN_PASSWORD` environment variables (falling back to the
defaults above). **Change these before any production deployment** — the defaults
are for local demonstration only.

## Project structure

```
client/src/
  router.tsx                 TanStack Router route tree (lazy routes, search validation)
  main.tsx                   Providers: QueryClient, Theme, Toast, Router
  styles.css                 Tailwind v4 theme, accent palette, article/editor typography
  lib/                       api client, query hooks, types, theme, SEO, sanitizer, utils
  components/ui/             Button, Input, Modal, ConfirmDialog, Toast, Skeleton, Pagination, Icon
  components/public/         Header, Footer, FeaturedNews, NewsCard, SearchModal, ShareButtons, …
  components/admin/          AdminLayout (sidebar + mobile nav), RichTextEditor, ImageUploader, …
  routes/                    Public pages and /admin pages (lazy loaded)

worker/
  wrangler.toml              Worker config: assets, D1, R2, vars
  migrations/                0001_init.sql, 0002_seed.sql (schema + realistic seed content)
  src/index.ts               Hono app, middleware, route mounting, SPA fallback
  src/routes/                auth, articles, categories, featured, media, settings, stats, public
  src/db.ts                  SQL helpers, slug generation, admin/settings seeding
  src/auth.ts                password hashing, sessions, auth middleware, rate limiting
```

## API overview

Public (no auth):

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/bootstrap` | Site settings + active categories with counts |
| GET | `/api/articles` | Published articles; filters: `q`, `category`, `page`, `perPage` |
| GET | `/api/articles/:slug` | Single published article by slug |
| GET | `/api/categories` | Active categories |
| GET | `/api/featured` | `{ primary, secondary }` featured stories |
| GET | `/media/:key` | Streams R2 objects (immutable cache) |
| GET | `/sitemap.xml` | XML sitemap of published articles |

Admin (session cookie required; 401 otherwise):

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/auth/login` · `/logout` · GET `/session` | Auth |
| GET | `/api/articles?all=1` | All articles; filters: `status`, `featured`, `q`, `page`, `perPage` |
| POST | `/api/articles` | Create (auto slug, uniqueness) |
| PUT | `/api/articles/:id` | Partial update (fields omitted keep their values) |
| DELETE | `/api/articles/:id` | Delete |
| POST | `/api/articles/:id/duplicate` | Duplicate as draft |
| GET | `/api/admin/articles/:id` | Any article by id |
| GET/POST/PUT/DELETE | `/api/categories[/:id]` | Category CRUD + `sort_order` reordering |
| PUT | `/api/featured` | Replace featured config `{ items: [{ article_id, position }] }` |
| POST | `/api/featured/toggle` | Quick feature/unfeature `{ article_id, featured }` |
| GET | `/api/media` | Media library (paginated) |
| POST | `/api/media/upload` | Multipart upload (validated) |
| DELETE | `/api/media/:id` | Delete from R2 + D1 |
| GET/PUT | `/api/settings` | Site settings |
| GET | `/api/stats` | Dashboard counts + recent articles |

## Configuration

### wrangler.toml (worker/wrangler.toml)

```toml
[assets]                      # serves ../client/dist (SPA fallback)
binding = "ASSETS"

[[d1_databases]]
binding = "DB"
database_name = "bengvarna-db"
database_id = "<your-d1-database-id>"   # created via `wrangler d1 create`

[[r2_buckets]]
binding = "MEDIA"
bucket_name = "bengvarna-media"         # created via `wrangler r2 bucket create`

[vars]
PUBLIC_SITE_URL = "https://your-domain.com"   # used for sitemap/canonical URLs + origin checks
```

### Environment / secrets

Local: copy `worker/.dev.vars.example` to `worker/.dev.vars`.

Production: set as secrets with `wrangler secret put <NAME>`.

| Variable | Purpose | Default (dev) |
| --- | --- | --- |
| `ADMIN_USERNAME` | Admin username, hashed at first boot | `admin` |
| `ADMIN_PASSWORD` | Admin password, PBKDF2-hashed before storing | `admin1234` ⚠️ |
| `SESSION_SECRET` | Reserved for future signing needs (cookie token is a random 64-hex value, stored hashed) | — |
| `PUBLIC_SITE_URL` | Canonical origin for SEO, sitemap, share links and CSRF origin checks | `http://localhost:8787` |

Optional client env (`client/.env`): `VITE_API_BASE` — only needed if the frontend and API live on different origins (the default setup serves both from the same Worker).

## Deploying to Cloudflare

1. **Create the resources**

   ```bash
   npx wrangler login
   cd worker
   npx wrangler d1 create bengvarna-db        # copy the database_id into wrangler.toml
   npx wrangler r2 bucket create bengvarna-media
   ```

2. **Apply migrations + seed to remote D1**

   ```bash
   npm run db:migrate:remote
   ```

3. **Set secrets** (never leave the default admin password live):

   ```bash
   npx wrangler secret put ADMIN_USERNAME
   npx wrangler secret put ADMIN_PASSWORD
   npx wrangler secret put SESSION_SECRET
   ```

4. **Build the client and deploy the Worker** (it serves both the API and the static site):

   ```bash
   npm run build
   npm run deploy -w worker
   ```

5. Point your domain at the Worker (Cloudflare → Workers → bengvarna → Settings → Domains), then update `PUBLIC_SITE_URL` in `wrangler.toml` to `https://your-domain.com` and redeploy.

## Serving media

Uploaded images are stored in R2 and streamed through the Worker at `/media/:key` with
`Cache-Control: public, max-age=31536000, immutable`, so Cloudflare's CDN caches them
for free. For on-the-fly resizing/AVIF, add the **Cloudflare Images** binding and swap
the `cover_image_url` values for image delivery URLs — nothing else needs to change.

## Notes & decisions

- **Public caching** — list/featured/bootstrap endpoints send `Cache-Control: public, max-age=…`; admin endpoints are `no-store`.
- **Search** — lightweight `LIKE` search over title/excerpt/content/category with escaping; plenty for this scale, swap for a search binding later if needed.
- **Sanitization** — content is sanitized with DOMPurify (client-side, both in the editor flow and on render) and the worker rejects `<script>`, inline handlers, `javascript:` URIs, iframes, forms, objects and embeds as defense in depth.
- **CSRF** — state-changing requests are rejected when the `Origin` header (sent by browsers) does not match `PUBLIC_SITE_URL`; the session cookie is `SameSite=Lax` + `HttpOnly`. Enforced on https only, so local http dev works untouched.
- **Seed data** — `0002_seed.sql` inserts 5 categories, 15 articles (12 published, 2 drafts, 1 archived), 4 featured stories and default site settings. Cover images point at Unsplash hotlinks; replace with your own uploads via the admin media library.
- **Login rate limit** — 10 attempts per 15 minutes per client IP (in-memory; fine for a single Worker, documentable scale).
- Media files deleted from the library are removed from R2 and D1; articles that referenced them will show a placeholder rather than breaking.

## Scripts (root)

| Script | Description |
| --- | --- |
| `npm run dev` | Vite dev server (port 5173) |
| `npm run dev:worker` | `wrangler dev` (port 8787) |
| `npm run db:migrate:local` | Apply migrations to the local D1 |
| `npm run db:migrate:remote` | Apply migrations to the remote D1 |
| `npm run build` | Production build of the client |
| `npm run typecheck` | TypeScript checks for client + worker |
| `npm run deploy` | Build client + deploy worker (serves site + API) |

## Security checklist before launch

- [ ] `ADMIN_USERNAME` / `ADMIN_PASSWORD` set as secrets — defaults are dev-only
- [ ] `SESSION_SECRET` set
- [ ] `PUBLIC_SITE_URL` set to the real domain
- [ ] D1 `database_id` in `wrangler.toml`
- [ ] A review of the `admin` user list in the D1 `admins` table
