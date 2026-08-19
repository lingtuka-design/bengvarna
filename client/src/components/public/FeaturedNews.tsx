import { Link } from '@tanstack/react-router'
import { useFeatured } from '../../lib/queries'
import { NewsCard } from './NewsCard'
import { NewsCardSkeleton } from '../ui/Skeleton'
import type { Article } from '../../lib/types'
import { cn, formatDate } from '../../lib/utils'
import { Icon } from '../ui/Icon'
import { CategoryLabel } from './CategoryLabel'

function PrimaryStory({ article }: { article: Article }) {
  const category = article.category_name ? { name: article.category_name, slug: article.category_slug } : undefined
  const excerpt = article.excerpt?.trim() || (article.content ? article.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 220) : '')
  return (
    <article className="group">
      <Link to="/article/$slug" params={{ slug: article.slug }}>
        {article.cover_image_url ? (
          <div className="overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800">
            <img
              src={article.cover_image_url}
              alt={article.title}
              loading="eager"
              decoding="async"
              className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </div>
        ) : (
          <div className="flex aspect-[16/10] w-full items-center justify-center rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-100 to-stone-200 text-stone-300 dark:border-stone-800 dark:from-stone-900 dark:to-stone-800 dark:text-stone-600">
            <Icon name="image" className="size-14" />
          </div>
        )}
        <div className="mt-5">
          <CategoryLabel category={category} asLink={false} />
          <h2 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight group-hover:underline md:text-4xl">
            {article.title}
          </h2>
          {excerpt ? <p className="mt-3 line-clamp-2 max-w-2xl text-stone-600 dark:text-stone-400">{excerpt}</p> : null}
          <p className="mt-3.5 text-xs text-stone-400 dark:text-stone-500">{formatDate(article.published_at)}</p>
        </div>
      </Link>
    </article>
  )
}

export function FeaturedNews() {
  const { data, isLoading } = useFeatured()

  if (isLoading) {
    return (
      <section aria-label="Featured news">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <NewsCardSkeleton variant="lead" />
          </div>
          <div className="flex flex-col gap-7 lg:col-span-5">
            <NewsCardSkeleton variant="horizontal" />
            <NewsCardSkeleton variant="horizontal" />
            <NewsCardSkeleton variant="horizontal" />
          </div>
        </div>
      </section>
    )
  }

  const primary = data?.primary ?? null
  const secondary = data?.secondary ?? []
  if (!primary && secondary.length === 0) return null

  return (
    <section aria-label="Featured news">
      <div className={cn('mb-5 flex items-center gap-3')}>
        <h2 className="section-label">Featured</h2>
        <div className="h-px flex-1 bg-stone-200 dark:bg-stone-800" aria-hidden="true" />
      </div>
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
        {primary && (
          <div className="lg:col-span-7">
            <PrimaryStory article={primary} />
          </div>
        )}
        {secondary.length > 0 && (
          <div className="flex flex-col gap-7 lg:col-span-5">
            {secondary.map((a, i) => (
              <NewsCard key={a.id} article={a} variant="horizontal" showExcerpt={true} className={cn(i > 0 && 'border-t border-stone-100 pt-6 dark:border-stone-800')} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
