import { useParams, useSearch } from '@tanstack/react-router'
import { router } from '../router'
import { useArticles, useBootstrap } from '../lib/queries'
import { Seo } from '../lib/seo'
import { NewsCard } from '../components/public/NewsCard'
import { NewsCardSkeleton } from '../components/ui/Skeleton'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState } from '../components/ui/EmptyState'
import { NotFoundPage } from './NotFoundPage'

export function CategoryPage() {
  const { slug } = useParams({ from: '/public/category/$slug' })
  const { page } = useSearch({ from: '/public/category/$slug' })
  const { data: bootstrap, isLoading: bootstrapLoading } = useBootstrap()
  const category = bootstrap?.categories.find((c) => c.slug === slug)
  const { data, isLoading, isError } = useArticles({ category: slug, page, perPage: 9 }, Boolean(category))

  if (bootstrapLoading) {
    return (
      <div className="mx-auto mt-10 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <NewsCardSkeleton />
      </div>
    )
  }
  if (!category) return <NotFoundPage />

  const changePage = (p: number) => {
    router.navigate({ to: '/category/$slug', params: { slug }, search: { page: p } })
  }

  return (
    <>
      <Seo
        title={`${category.name} — bengvarna`}
        description={category.description || `The latest ${category.name} stories from bengvarna.`}
      />
      <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 md:pt-12 lg:px-8">
        <header className="mb-8 border-b border-stone-200 pb-6 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            {category.color && <span className="size-3 rounded-full" style={{ backgroundColor: category.color }} aria-hidden="true" />}
            <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{category.name}</h1>
          </div>
          {category.description && <p className="mt-3 max-w-2xl text-stone-500 dark:text-stone-400">{category.description}</p>}
          <p className="mt-2 text-xs uppercase tracking-wider text-stone-400 dark:text-stone-500">
            {category.article_count ?? 0} published {category.article_count === 1 ? 'story' : 'stories'}
          </p>
        </header>
        {isLoading ? (
          <div className="divide-y divide-stone-200 dark:divide-stone-800">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="py-7 first:pt-0 last:pb-0">
                <NewsCardSkeleton variant="lead" />
              </div>
            ))}
          </div>
        ) : isError || !data || data.items.length === 0 ? (
          <EmptyState icon="tag" title={`No stories in ${category.name} yet`} description="New articles will appear here as soon as they are published." />
        ) : (
          <>
            <div className="divide-y divide-stone-200 dark:divide-stone-800">
              {data.items.map((article) => (
                <div key={article.id} className="py-7 first:pt-0 last:pb-0">
                  <NewsCard key={article.id} article={article} variant="lead" showExcerpt={true} />
                </div>
              ))}
            </div>
            <Pagination page={page} totalPages={data.totalPages} onChange={changePage} className="mt-12" />
          </>
        )}
      </div>
    </>
  )
}
