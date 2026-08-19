import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { router } from '../../router'
import { useArticles } from '../../lib/queries'
import { useDebouncedValue } from '../../lib/utils'
import { cn } from '../../lib/utils'
import { ArticleTable } from '../../components/admin/ArticleTable'
import { ArticleTableSkeleton } from '../../components/ui/Skeleton'
import { Pagination } from '../../components/ui/Pagination'
import { EmptyState } from '../../components/ui/EmptyState'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useToast } from '../../components/ui/Toast'
import type { Article } from '../../lib/types'

type StatusFilter = 'all' | 'published' | 'draft' | 'archived' | 'featured'

const FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
  { value: 'featured', label: 'Featured' },
]

export function AdminArticles() {
  const [status, setStatus] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const q = useDebouncedValue(searchInput, 300)
  const [deleting, setDeleting] = useState<Article | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading } = useArticles({
    all: true,
    q: q.trim() || undefined,
    status: status === 'published' || status === 'draft' || status === 'archived' ? status : undefined,
    featured: status === 'featured' ? true : undefined,
    page,
    perPage: 20,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.del<{ ok: boolean }>(`/api/articles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['featured'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      setDeleting(null)
      toast('Article deleted')
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Delete failed', 'error'),
  })

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Articles</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            {data ? `${data.total} ${data.total === 1 ? 'article' : 'articles'}` : 'Loading…'}
          </p>
        </div>
        <Link to="/admin/articles/new">
          <Button>
            <Icon name="plus" className="size-4" />
            New article
          </Button>
        </Link>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 transition-colors focus-within:border-accent-500 focus-within:ring-2 focus-within:ring-accent-500/25 dark:border-stone-700 dark:bg-stone-900">
          <Icon name="search" className="size-4 shrink-0 text-stone-400" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setPage(1)
            }}
            placeholder="Search articles…"
            aria-label="Search articles"
            className="h-11 w-full bg-transparent text-sm focus:outline-none"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto rounded-xl bg-stone-100 p-1 dark:bg-stone-800" role="tablist" aria-label="Filter articles by status">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              role="tab"
              aria-selected={status === f.value}
              onClick={() => {
                setStatus(f.value)
                setPage(1)
              }}
              className={cn(
                'h-9 shrink-0 rounded-lg px-3 text-sm font-semibold transition-colors',
                status === f.value ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-900 dark:text-white' : 'text-stone-500 dark:text-stone-400',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <ArticleTableSkeleton />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon="file"
          title={q ? `No articles match “${q}”` : 'No articles here yet'}
          description="Try a different filter or write a new story."
          action={{ label: 'New article', onClick: () => router.navigate({ to: '/admin/articles/new' }) }}
        />
      ) : (
        <>
          <ArticleTable articles={data.items} onDelete={setDeleting} />
          <Pagination page={page} totalPages={data.totalPages} onChange={setPage} className="mt-6" />
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete this article?"
        message={`"${deleting?.title ?? ''}" will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete article"
        busy={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  )
}
