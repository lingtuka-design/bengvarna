import { Link } from '@tanstack/react-router'
import { useArticles, useBootstrap, useFeatured } from '../lib/queries'
import { Seo, absoluteUrl } from '../lib/seo'
import { FeaturedNews } from '../components/public/FeaturedNews'
import { NewsCard } from '../components/public/NewsCard'
import { NewsCardSkeleton } from '../components/ui/Skeleton'
import { EmptyState } from '../components/ui/EmptyState'
import { AdSlot } from '../components/public/AdSlot'

function LatestNews() {
  const { data, isLoading, isError } = useArticles({ page: 1, perPage: 12, exclude_featured: 1 })

  if (isLoading) {
    return (
      <div className="divide-y divide-stone-200 dark:divide-stone-800">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="py-7 first:pt-0 last:pb-0">
            <NewsCardSkeleton variant="lead" />
          </div>
        ))}
      </div>
    )
  }

  if (isError || !data || data.items.length === 0) {
    return (
      <EmptyState
        icon="file"
        title="No articles yet"
        description="The newsroom is warming up. Check back soon for the latest stories."
      />
    )
  }

  return (
    <div className="divide-y divide-stone-200 dark:divide-stone-800">
      {data.items.map((article, index) => (
        <div key={article.id}>
          <div className="py-7 first:pt-0 last:pb-0">
            <NewsCard
              article={article}
              variant="lead"
              showExcerpt={true}
            />
          </div>
          {index === 2 && (
            <div className="py-4">
              <AdSlot variant="in-feed" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export function HomePage() {
  const { data: bootstrap } = useBootstrap()
  const { data: featured } = useFeatured()
  const settings = bootstrap?.settings
  const siteName = settings?.site_name || 'bengvarna'

  return (
    <>
      <Seo
        title={settings?.default_seo_title || `${siteName} — Modern news, beautifully delivered`}
        description={settings?.default_seo_description}
        image={absoluteUrl(settings?.default_social_image)}
        url={window.location.origin}
      />
      <div className="mx-auto w-full max-w-7xl px-4 pt-8 sm:px-6 md:pt-10 lg:px-8">
        {featured?.primary || (featured?.secondary.length ?? 0) > 0 ? (
          <FeaturedNews />
        ) : null}
        <AdSlot variant="leaderboard" className="mt-8" />
        <section className="mt-10" aria-label="Latest news">
          <div className="mb-8 flex items-center gap-3">
            <h2 className="section-label">Latest</h2>
            <div className="h-px flex-1 bg-stone-200 dark:bg-stone-800" aria-hidden="true" />
            <Link
              to="/news"
              search={{ page: 1 }}
              className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-accent-600 transition-colors hover:text-accent-500 dark:text-accent-400"
            >
              All news
              <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <LatestNews />
            </div>
            <aside className="hidden lg:col-span-4 lg:block" aria-label="Sidebar advertisements">
              <div className="sticky top-24 space-y-8">
                <div className="flex items-center gap-2 border-b border-stone-200 pb-2 dark:border-stone-800">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">Sponsored / Ads</span>
                </div>
                <AdSlot variant="rectangle" />
                <AdSlot variant="half-page" />
              </div>
            </aside>
          </div>
        </section>
      </div>
    </>
  )
}
