import { useMemo } from 'react'
import { useArticles } from '../../lib/queries'
import type { Article } from '../../lib/types'
import { NewsCard } from './NewsCard'
import { NewsCardSkeleton } from '../ui/Skeleton'

interface RelatedArticlesProps {
  categorySlug?: string | null
  currentSlug: string
}

export function RelatedArticles({ categorySlug, currentSlug }: RelatedArticlesProps) {
  const sameCategory = useArticles({ category: categorySlug ?? '', perPage: 6 }, Boolean(categorySlug))
  const latest = useArticles({ perPage: 6 })
  const loading = sameCategory.isLoading || latest.isLoading

  const related = useMemo(() => {
    const seen = new Set<string>([currentSlug])
    const items: Article[] = []
    const push = (a: Article) => {
      if (!seen.has(a.slug)) {
        seen.add(a.slug)
        items.push(a)
      }
    }
    ;(sameCategory.data?.items ?? []).forEach(push)
    ;(latest.data?.items ?? []).forEach(push)
    return items.slice(0, 3)
  }, [sameCategory.data, latest.data, currentSlug])

  if (loading) {
    return (
      <div className="mt-4 grid gap-6 sm:grid-cols-3">
        <NewsCardSkeleton />
        <NewsCardSkeleton />
        <NewsCardSkeleton />
      </div>
    )
  }
  if (related.length === 0) return null

  return (
    <section aria-label="Related articles" className="mt-6">
      <div className="mb-5 flex items-center gap-3">
        <h2 className="section-label">Related</h2>
        <div className="h-px flex-1 bg-stone-200 dark:bg-stone-800" aria-hidden="true" />
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        {related.map((a) => (
          <NewsCard key={a.id} article={a} showExcerpt={false} titleClassName="md:text-lg" />
        ))}
      </div>
    </section>
  )
}
