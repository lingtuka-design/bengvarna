import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useArticles, useFeatured } from '../../lib/queries'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'
import { Select } from '../ui/Input'
import { Icon } from '../ui/Icon'
import { Spinner } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'
import { useToast } from '../ui/Toast'
import type { Article } from '../../lib/types'

export function FeaturedManager() {
  const { data: featured, isLoading } = useFeatured()
  const { data: poolData } = useArticles({ perPage: 100 })
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [primaryId, setPrimaryId] = useState<number | null>(null)
  const [secondaryIds, setSecondaryIds] = useState<number[]>([])
  const [addId, setAddId] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (featured && !ready) {
      setPrimaryId(featured.primary?.id ?? null)
      setSecondaryIds(featured.secondary.map((a) => a.id))
      setReady(true)
    }
  }, [featured, ready])

  const pool = useMemo(() => {
    const ids = new Set<number>()
    if (primaryId) ids.add(primaryId)
    secondaryIds.forEach((id) => ids.add(id))
    return (poolData?.items ?? []).filter((a) => !ids.has(a.id))
  }, [poolData, primaryId, secondaryIds])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['featured'] })
    queryClient.invalidateQueries({ queryKey: ['articles'] })
    queryClient.invalidateQueries({ queryKey: ['stats'] })
    queryClient.invalidateQueries({ queryKey: ['bootstrap'] })
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const items: Array<{ article_id: number; position: number }> = []
      if (primaryId) items.push({ article_id: primaryId, position: 0 })
      secondaryIds.forEach((id, i) => items.push({ article_id: id, position: i + 1 }))
      return api.put<{ ok: boolean }>('/api/featured', { items })
    },
    onSuccess: () => {
      invalidate()
      toast('Featured news saved')
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Save failed', 'error'),
  })

  const reset = () => {
    setPrimaryId(featured?.primary?.id ?? null)
    setSecondaryIds(featured?.secondary.map((a) => a.id) ?? [])
  }

  if (isLoading) return <Spinner className="mx-auto mt-12" />

  const primaryArticle: Article | undefined =
    (featured?.primary?.id === primaryId ? featured.primary : undefined) ?? (primaryId ? poolData?.items.find((a) => a.id === primaryId) : undefined)

  const move = (index: number, direction: -1 | 1) => {
    setSecondaryIds((ids) => {
      const next = [...ids]
      const target = index + direction
      if (target < 0 || target >= next.length) return ids
      const [item] = next.splice(index, 1)
      next.splice(target, 0, item!)
      return next
    })
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Featured news</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Choose which published articles appear on the homepage, and their order.
          </p>
        </div>
        <Link to="/" className="inline-flex h-10 items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800">
          <Icon name="eye" className="size-4" />
          Preview homepage
        </Link>
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Icon name="star" className="size-5 text-accent-600" filled />
          Primary story
        </h2>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">The big story at the top of the homepage.</p>
        <Select
          className="mt-4"
          value={String(primaryId ?? '')}
          onChange={(e) => setPrimaryId(e.target.value === '' ? null : Number(e.target.value))}
          options={[
            { value: '', label: 'No primary story' },
            ...(poolData?.items ?? []).map((a) => ({ value: String(a.id), label: a.title })),
          ]}
          aria-label="Primary featured article"
        />
        {primaryArticle && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-stone-50 p-3 dark:bg-stone-800/60">
            {primaryArticle.cover_image_url ? (
              <img src={primaryArticle.cover_image_url} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
            ) : (
              <span className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-stone-200 text-stone-400 dark:bg-stone-700 dark:text-stone-500" aria-hidden="true">
                <Icon name="image" className="size-5" />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold text-stone-800 dark:text-stone-200">{primaryArticle.title}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">{primaryArticle.category_name ?? 'News'} · {primaryArticle.author || 'bengvarna Desk'}</p>
            </div>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Icon name="share" className="size-5 text-accent-600" />
          Secondary stories
        </h2>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Shown next to the primary story, in order. Use the arrows to reorder.</p>

        {secondaryIds.length === 0 ? (
          <div className="mt-4">
            <EmptyState icon="star" title="No secondary stories" description="Add up to three stories from the published articles below." />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {secondaryIds.map((id, index) => {
              const article = poolData?.items.find((a) => a.id === id)
              if (!article) return null
              return (
                <li key={id} className="flex items-center gap-3 rounded-xl border border-stone-200 p-3 dark:border-stone-800">
                  {article.cover_image_url ? (
                    <img src={article.cover_image_url} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-300 dark:bg-stone-800" aria-hidden="true">
                      <Icon name="image" className="size-5" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-stone-800 dark:text-stone-200">{article.title}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">{article.category_name ?? 'News'} · position {index + 1}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up" className="flex size-9 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 disabled:opacity-30 dark:hover:bg-stone-800 dark:hover:text-stone-200">
                      <Icon name="arrow-up" className="size-4" />
                    </button>
                    <button type="button" onClick={() => move(index, 1)} disabled={index === secondaryIds.length - 1} aria-label="Move down" className="flex size-9 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 disabled:opacity-30 dark:hover:bg-stone-800 dark:hover:text-stone-200">
                      <Icon name="arrow-down" className="size-4" />
                    </button>
                    <button type="button" onClick={() => setSecondaryIds((ids) => ids.filter((x) => x !== id))} aria-label="Remove" className="flex size-9 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40">
                      <Icon name="x" className="size-4" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {pool.length > 0 && (
          <div className="mt-5 flex items-end gap-2">
            <Select
              className="flex-1"
              value={addId}
              onChange={(e) => setAddId(e.target.value)}
              options={[{ value: '', label: 'Add a secondary story…' }, ...pool.map((a) => ({ value: String(a.id), label: a.title }))]}
              aria-label="Add secondary featured article"
            />
            <Button
              variant="outline"
              className="h-11"
              disabled={!addId}
              onClick={() => {
                setSecondaryIds((ids) => [...ids, Number(addId)])
                setAddId('')
              }}
            >
              <Icon name="plus" className="size-4" />
              Add
            </Button>
          </div>
        )}
      </section>

      <div className={cn('mt-6 flex flex-wrap items-center justify-end gap-2')}>
        <Button variant="outline" onClick={reset} disabled={saveMutation.isPending}>
          Reset
        </Button>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Saving…' : 'Save featured news'}
        </Button>
      </div>
    </div>
  )
}
