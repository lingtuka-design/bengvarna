import { useEffect, useRef, useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAdminArticle, useCategories } from '../../lib/queries'
import { router } from '../../router'
import { cn, slugify, toLocalInputValue } from '../../lib/utils'
import type { Article, ArticleInput, ArticleStatus } from '../../lib/types'
import { Button } from '../../components/ui/Button'
import { Input, Textarea, Select, Field } from '../../components/ui/Input'
import { StatusBadge } from '../../components/ui/Badge'
import { ImageUploader } from '../../components/admin/ImageUploader'
import { RichTextEditor } from '../../components/admin/RichTextEditor'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Icon } from '../../components/ui/Icon'
import { FullScreenLoader } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'

interface DraftState {
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image_url: string
  social_image_url: string
  category_id: number | ''
  author: string
  status: ArticleStatus
  seo_title: string
  seo_description: string
  featured: boolean
  published_at: string
}

const EMPTY_DRAFT: DraftState = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  cover_image_url: '',
  social_image_url: '',
  category_id: '',
  author: '',
  status: 'draft',
  seo_title: '',
  seo_description: '',
  featured: false,
  published_at: '',
}

function toDraft(article: Article): DraftState {
  return {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content ?? '',
    cover_image_url: article.cover_image_url,
    social_image_url: article.social_image_url,
    category_id: article.category_id ?? '',
    author: article.author,
    status: article.status,
    seo_title: article.seo_title,
    seo_description: article.seo_description,
    featured: article.featured_position !== null,
    published_at: article.published_at ?? '',
  }
}

export function AdminArticleNew() {
  return <ArticleEditorPage />
}

export function AdminArticleEdit() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const match = pathname.match(/\/articles\/(\d+)\/edit/)
  const id = match ? Number(match[1]) : undefined
  return <ArticleEditorPage articleId={Number.isFinite(id) ? id : undefined} />
}

function RestoreBanner({ onRestore, onDiscard }: { onRestore: () => void; onDiscard: () => void }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/40">
      <p className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-200">
        <Icon name="clock" className="size-4 shrink-0" />
        An unsaved draft from a previous session was found.
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onDiscard}>
          Discard
        </Button>
        <Button size="sm" onClick={onRestore}>
          Restore
        </Button>
      </div>
    </div>
  )
}

function ArticleEditorPage({ articleId }: { articleId?: number }) {
  const { data: article, isLoading } = useAdminArticle(articleId)
  const { data: categories } = useCategories(true)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT)
  const [loaded, setLoaded] = useState(false)
  const [backup, setBackup] = useState<DraftState | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)
  const storageKey = `bengvarna-draft-${articleId ?? 'new'}`
  const initialFeaturedRef = useRef(false)

  const readBackup = (): DraftState | null => {
    try {
      const raw = localStorage.getItem(storageKey)
      return raw ? (JSON.parse(raw) as DraftState) : null
    } catch {
      return null
    }
  }

  useEffect(() => {
    if (isLoading || loaded) return
    const source = article ? toDraft(article) : EMPTY_DRAFT
    const stored = readBackup()
    if (stored && JSON.stringify(stored) !== JSON.stringify(source)) {
      setBackup(stored)
    } else {
      setDraft(source)
      setLoaded(true)
    }
    if (article) initialFeaturedRef.current = article.featured_position !== null
  }, [article, isLoading, loaded, storageKey])

  useEffect(() => {
    if (!loaded || saving) return
    const t = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(draft))
      } catch {
        /* noop */
      }
    }, 1500)
    return () => clearTimeout(t)
  }, [draft, loaded, storageKey, saving])

  useEffect(() => {
    if (backup) setDraft(backup)
  }, [backup])

  const set = <K extends keyof DraftState>(key: K, value: DraftState[K]) => {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  const saveMutation = useMutation({
    mutationFn: async ({ status, publishedAt }: { status: ArticleStatus; publishedAt?: string | null }) => {
      const payload: ArticleInput = {
        title: draft.title,
        slug: draft.slug,
        excerpt: draft.excerpt,
        content: draft.content,
        cover_image_url: draft.cover_image_url,
        social_image_url: draft.social_image_url,
        category_id: draft.category_id === '' ? null : Number(draft.category_id),
        author: draft.author,
        status,
        seo_title: draft.seo_title,
        seo_description: draft.seo_description,
        published_at: publishedAt ?? undefined,
      }
      return articleId
        ? api.put<Article>(`/api/articles/${articleId}`, payload)
        : api.post<Article>('/api/articles', payload)
    },
    onSuccess: async (saved) => {
      try {
        localStorage.removeItem(storageKey)
      } catch {
        /* noop */
      }
      const wantFeatured = draft.featured
      if (wantFeatured !== initialFeaturedRef.current) {
        await api
          .post<{ ok: boolean }>('/api/featured/toggle', { article_id: saved.id, featured: wantFeatured })
          .catch(() => null)
      }
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['featured'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['bootstrap'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      if (!articleId) {
        router.navigate({ to: '/admin/articles/$id/edit', params: { id: String(saved.id) }, replace: true })
      } else {
        initialFeaturedRef.current = wantFeatured
        setDraft((d) => ({ ...d, status: saved.status, published_at: saved.published_at ?? '' }))
      }
      toast(saved.status === 'published' ? 'Article published' : 'Article saved')
    },
    onError: (e) => {
      toast(e instanceof Error ? e.message : 'Failed to save article', 'error')
    },
    onSettled: () => setSaving(false),
  })

  const save = (status: ArticleStatus) => {
    if (!draft.title.trim()) {
      toast('A headline is required', 'error')
      return
    }
    setSaving(true)
    const isPublishing = status === 'published' && draft.status !== 'published'
    saveMutation.mutate({ status, publishedAt: isPublishing ? (draft.published_at || new Date().toISOString()) : undefined })
  }

  const deleteMutation = useMutation({
    mutationFn: () => api.del<{ ok: boolean }>(`/api/articles/${articleId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['featured'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      toast('Article deleted')
      router.navigate({ to: '/admin/articles' })
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Delete failed', 'error'),
  })

  const duplicateMutation = useMutation({
    mutationFn: () => api.post<Article>(`/api/articles/${articleId}/duplicate`),
    onSuccess: (dup) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      toast('Article duplicated')
      router.navigate({ to: '/admin/articles/$id/edit', params: { id: String(dup.id) } })
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Duplicate failed', 'error'),
  })

  if (isLoading) return <FullScreenLoader />

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/admin/articles"
            aria-label="Back to articles"
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-white"
          >
            <Icon name="chevron-left" className="size-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-semibold">{articleId ? 'Edit article' : 'New article'}</h1>
            <StatusBadge status={draft.status} className="mt-0.5" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (draft.status === 'published' && draft.slug) {
                window.open(`/article/${draft.slug}`, '_blank', 'noopener')
              } else {
                toast('Publish the article first to preview it', 'info')
              }
            }}
          >
            <Icon name="eye" className="size-4" />
            Preview
          </Button>
          <Button variant="ghost" size="sm" onClick={() => duplicateMutation.mutate()} disabled={!articleId || duplicateMutation.isPending}>
            <Icon name="copy" className="size-4" />
            Duplicate
          </Button>
          <Button variant="ghost" size="sm" className="text-red-600 dark:text-red-400" onClick={() => setConfirmDelete(true)} disabled={!articleId}>
            <Icon name="trash" className="size-4" />
            Delete
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => save('draft')}
            disabled={saving || draft.status === 'published'}
            className="hidden sm:inline-flex"
          >
            Save draft
          </Button>
          <Button size="sm" onClick={() => save('published')} disabled={saving}>
            {saving ? 'Saving…' : draft.status === 'published' ? 'Update' : 'Publish'}
          </Button>
        </div>
      </div>

      {backup && (
        <RestoreBanner
          onRestore={() => {
            setBackup(null)
            setLoaded(true)
            setDraft(backup)
          }}
          onDiscard={() => {
            try {
              localStorage.removeItem(storageKey)
            } catch {
              /* noop */
            }
            setBackup(null)
            setLoaded(true)
            setDraft(article ? toDraft(article) : EMPTY_DRAFT)
          }}
        />
      )}

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault()
          save(draft.status === 'published' ? 'published' : 'draft')
        }}
      >
        <section className="space-y-5 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 sm:p-6">
          <Field label="Headline">
            <input
              type="text"
              value={draft.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Enter a headline"
              autoFocus
              className="w-full rounded-xl border border-transparent bg-stone-100 px-4 py-3 font-display text-2xl font-semibold leading-tight text-stone-900 placeholder:text-stone-400 focus:border-accent-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-500/25 dark:bg-stone-800 dark:text-stone-100 dark:focus:bg-stone-800"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Slug" hint="Used in the article URL.">
              <div className="flex gap-2">
                <Input
                  value={draft.slug}
                  onChange={(e) => set('slug', slugify(e.target.value))}
                  placeholder="auto-generated"
                  className="h-11"
                  aria-label="Article slug"
                />
                <Button type="button" variant="outline" onClick={() => set('slug', slugify(draft.title))} className="h-11 shrink-0">
                  Auto
                </Button>
              </div>
            </Field>
            <Select
              label="Category"
              value={String(draft.category_id)}
              onChange={(e) => set('category_id', e.target.value === '' ? '' : Number(e.target.value))}
              options={[
                { value: '', label: 'Uncategorized' },
                ...(categories ?? []).map((c) => ({ value: String(c.id), label: c.name })),
              ]}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Author" value={draft.author} onChange={(e) => set('author', e.target.value)} placeholder="Byline (optional)" />
            <Input
              label="Published at"
              type="datetime-local"
              value={toLocalInputValue(draft.published_at)}
              onChange={(e) => set('published_at', e.target.value ? new Date(e.target.value).toISOString() : '')}
              hint="Optional. Set for scheduling; defaults to now on publish."
            />
          </div>
          <Textarea
            label="Excerpt"
            value={draft.excerpt}
            onChange={(e) => set('excerpt', e.target.value)}
            rows={3}
            maxLength={500}
            hint={`Short summary shown in cards and search results. ${500 - draft.excerpt.length} characters left.`}
            placeholder="One or two sentences that make someone want to read more…"
          />
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 sm:p-6">
          <ImageUploader
            label="Cover image"
            value={draft.cover_image_url}
            onChange={(url) => set('cover_image_url', url)}
            hint="Appears on cards, the homepage and social previews. Landscape 16:9 works best."
          />
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 sm:p-6">
          <h2 className="mb-3 font-display text-lg font-semibold">Article content</h2>
          <RichTextEditor value={draft.content} onChange={(html) => set('content', html)} />
        </section>

        <details className="group rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900" open={false}>
          <summary className="flex cursor-pointer select-none items-center gap-2 p-4 font-display text-lg font-semibold sm:p-6">
            <Icon name="sliders" className="size-5 text-stone-400" />
            SEO &amp; advanced
            <Icon name="chevron-down" className="ml-auto size-5 text-stone-400 transition-transform group-open:rotate-180" />
          </summary>
          <div className="space-y-5 px-4 pb-5 sm:px-6 sm:pb-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="SEO title" value={draft.seo_title} onChange={(e) => set('seo_title', e.target.value)} maxLength={200} hint="Overrides the title in search results and social shares." />
              <Input label="SEO description" value={draft.seo_description} onChange={(e) => set('seo_description', e.target.value)} maxLength={300} hint="Overrides the description shown when the link is shared." />
            </div>
            <ImageUploader
              label="Social image"
              value={draft.social_image_url}
              onChange={(url) => set('social_image_url', url)}
              hint="Optional. Shown in WhatsApp, Facebook and X previews. 1200×630 works best."
            />
            <label className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 px-4 py-3 dark:border-stone-800">
              <span>
                <span className="block text-sm font-semibold">Featured story</span>
                <span className="block text-xs text-stone-500 dark:text-stone-400">Show on the homepage featured section (only when published).</span>
              </span>
              <input type="checkbox" checked={draft.featured} onChange={(e) => set('featured', e.target.checked)} className="size-5 accent-[--color-accent-600]" aria-label="Mark as featured" />
            </label>
          </div>
        </details>

        <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 flex gap-2 border-t border-stone-200 bg-white/95 p-3 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95 lg:hidden">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => save('draft')}
            disabled={saving || draft.status === 'published'}
          >
            Save draft
          </Button>
          <Button className="flex-1" onClick={() => save('published')} disabled={saving}>
            {saving ? 'Saving…' : draft.status === 'published' ? 'Update' : 'Publish'}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this article?"
        message={`"${draft.title || 'Untitled'}" will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete article"
        busy={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  )
}
