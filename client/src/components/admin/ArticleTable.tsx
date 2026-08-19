import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { api } from '../../lib/api'
import { cn, formatDate } from '../../lib/utils'
import type { Article } from '../../lib/types'
import { StatusBadge } from '../ui/Badge'
import { Icon } from '../ui/Icon'
import { Button } from '../ui/Button'
import { useToast } from '../ui/Toast'

interface ArticleTableProps {
  articles: Article[]
  onDelete: (article: Article) => void
}

export function ArticleTable({ articles, onDelete }: ArticleTableProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['articles'] })
    queryClient.invalidateQueries({ queryKey: ['featured'] })
    queryClient.invalidateQueries({ queryKey: ['stats'] })
  }

  const togglePublish = useMutation({
    mutationFn: (a: Article) =>
      api.put<Article>(`/api/articles/${a.id}`, { status: a.status === 'published' ? 'draft' : 'published' }),
    onSuccess: (saved) => {
      invalidate()
      toast(saved.status === 'published' ? 'Article published' : 'Article unpublished')
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Update failed', 'error'),
  })

  const toggleFeatured = useMutation({
    mutationFn: (a: Article) =>
      api.post<{ ok: boolean }>('/api/featured/toggle', { article_id: a.id, featured: a.featured_position === null }),
    onSuccess: (_data, a) => {
      invalidate()
      toast(a.featured_position === null ? 'Added to featured news' : 'Removed from featured news')
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Update failed', 'error'),
  })

  const duplicate = useMutation({
    mutationFn: (a: Article) => api.post<Article>(`/api/articles/${a.id}/duplicate`),
    onSuccess: () => {
      invalidate()
      toast('Article duplicated')
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Duplicate failed', 'error'),
  })

  const iconButton = 'inline-flex size-9 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 disabled:opacity-40 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-white'

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400">
              <th scope="col" className="px-4 py-3">Article</th>
              <th scope="col" className="px-4 py-3">Category</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Published</th>
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
            {articles.map((a) => (
              <tr key={a.id} className="transition-colors hover:bg-stone-50 dark:hover:bg-stone-800/40">
                <td className="max-w-md px-4 py-3">
                  <div className="flex items-center gap-3">
                    {a.cover_image_url ? (
                      <img src={a.cover_image_url} alt="" loading="lazy" className="h-11 w-16 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <span className="flex h-11 w-16 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-300 dark:bg-stone-800" aria-hidden="true">
                        <Icon name="image" className="size-5" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <Link to="/admin/articles/$id/edit" params={{ id: String(a.id) }} className="line-clamp-2 font-semibold text-stone-800 hover:text-accent-600 dark:text-stone-200 dark:hover:text-accent-400">
                        {a.title}
                      </Link>
                      {a.featured_position !== null && (
                        <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-accent-600 dark:text-accent-400">
                          <Icon name="star" className="size-3" filled /> Featured
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-stone-500 dark:text-stone-400">{a.category_name ?? '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                <td className="px-4 py-3 text-stone-500 dark:text-stone-400">{formatDate(a.published_at) || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-0.5">
                    <Link to="/admin/articles/$id/edit" params={{ id: String(a.id) }} className={iconButton} aria-label="Edit article" title="Edit">
                      <Icon name="pencil" className="size-4" />
                    </Link>
                    {a.status === 'published' && (
                      <a href={`/article/${a.slug}`} target="_blank" rel="noopener noreferrer" className={iconButton} aria-label="Preview article" title="Preview">
                        <Icon name="eye" className="size-4" />
                      </a>
                    )}
                    <button type="button" className={iconButton} onClick={() => togglePublish.mutate(a)} disabled={togglePublish.isPending} aria-label={a.status === 'published' ? 'Unpublish article' : 'Publish article'} title={a.status === 'published' ? 'Unpublish' : 'Publish'}>
                      <Icon name="upload" className={cn('size-4', a.status === 'published' && 'rotate-180')} />
                    </button>
                    <button
                      type="button"
                      className={cn(iconButton, a.featured_position !== null && 'text-accent-600 dark:text-accent-400')}
                      onClick={() => toggleFeatured.mutate(a)}
                      disabled={toggleFeatured.isPending || a.status !== 'published'}
                      aria-label={a.featured_position !== null ? 'Remove from featured' : 'Add to featured'}
                      title={a.featured_position !== null ? 'Remove from featured' : 'Add to featured'}
                    >
                      <Icon name="star" className="size-4" filled={a.featured_position !== null} />
                    </button>
                    <button type="button" className={iconButton} onClick={() => duplicate.mutate(a)} disabled={duplicate.isPending} aria-label="Duplicate article" title="Duplicate">
                      <Icon name="copy" className="size-4" />
                    </button>
                    <button type="button" className={cn(iconButton, 'text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40')} onClick={() => onDelete(a)} aria-label="Delete article" title="Delete">
                      <Icon name="trash" className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {articles.map((a) => (
          <article key={a.id} className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
            <div className="flex items-start gap-3">
              {a.cover_image_url ? (
                <img src={a.cover_image_url} alt="" loading="lazy" className="h-16 w-24 shrink-0 rounded-xl object-cover" />
              ) : (
                <span className="flex h-16 w-24 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-300 dark:bg-stone-800" aria-hidden="true">
                  <Icon name="image" className="size-6" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <Link to="/admin/articles/$id/edit" params={{ id: String(a.id) }} className="line-clamp-3 font-display text-base font-semibold leading-snug text-stone-800 hover:text-accent-600 dark:text-stone-200 dark:hover:text-accent-400">
                  {a.title}
                </Link>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                  {a.category_name && <span>{a.category_name}</span>}
                  {a.category_name && <span aria-hidden="true">·</span>}
                  <span>{formatDate(a.published_at) || 'Draft'}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3 dark:border-stone-800">
              <StatusBadge status={a.status} />
              <div className="flex items-center gap-1">
                <Button size="sm" variant="outline" onClick={() => togglePublish.mutate(a)} disabled={togglePublish.isPending}>
                  {a.status === 'published' ? 'Unpublish' : 'Publish'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleFeatured.mutate(a)}
                  disabled={toggleFeatured.isPending || a.status !== 'published'}
                  className={cn(a.featured_position !== null && 'border-accent-500 text-accent-600 dark:border-accent-500 dark:text-accent-400')}
                >
                  <Icon name="star" className="size-4" filled={a.featured_position !== null} />
                  {a.featured_position !== null ? 'Featured' : 'Feature'}
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
