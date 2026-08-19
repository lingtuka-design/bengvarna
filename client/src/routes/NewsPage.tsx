import { useSearch } from '@tanstack/react-router'
import { router } from '../router'
import { useArticles } from '../lib/queries'
import { Seo } from '../lib/seo'
import { NewsCard } from '../components/public/NewsCard'
import { NewsCardSkeleton } from '../components/ui/Skeleton'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState } from '../components/ui/EmptyState'

export function NewsPage() {
  const { page } = useSearch({ from: '/public/news' })
  const { data, isLoading, isError } = useArticles({ page, perPage: 9 })

  const changePage = (p: number) => {
    router.navigate({ to: '/news', search: { page: p } })
  }

  return (
    <>
      <Seo title="All news — bengvarna" description="The latest stories from bengvarna, fresh and in full." />
      <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 md:pt-12 lg:px-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">All news</h1>
          <p className="mt-2 text-stone-500 dark:text-stone-400">Every story from the bengvarna newsroom, newest first.</p>
        </div>
        {isLoading ? (
          <div className="divide-y divide-stone-200 dark:divide-stone-800">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="py-7 first:pt-0 last:pb-0">
                <NewsCardSkeleton variant="lead" />
              </div>
            ))}
          </div>
        ) : isError || !data || data.items.length === 0 ? (
          <EmptyState icon="file" title="No articles yet" description="Check back soon for the latest stories." />
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
