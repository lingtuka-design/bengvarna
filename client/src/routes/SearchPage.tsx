import { useEffect, useState } from 'react'
import { useSearch } from '@tanstack/react-router'
import { router } from '../router'
import { useArticles } from '../lib/queries'
import { Seo } from '../lib/seo'
import { useDebouncedValue } from '../lib/utils'
import { Icon } from '../components/ui/Icon'
import { NewsCard } from '../components/public/NewsCard'
import { NewsCardSkeleton } from '../components/ui/Skeleton'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState } from '../components/ui/EmptyState'

export function SearchPage() {
  const { q, page } = useSearch({ from: '/public/search' })
  const [input, setInput] = useState(q)
  const debounced = useDebouncedValue(input, 300)

  useEffect(() => {
    setInput(q)
  }, [q])

  useEffect(() => {
    if (debounced.trim() !== q) {
      router.navigate({ to: '/search', search: { q: debounced.trim(), page: 1 }, replace: true })
    }
  }, [debounced, q])

  const query = debounced.trim()
  const { data, isLoading, isError } = useArticles({ q: query, page, perPage: 10 }, query.length > 0)

  const changePage = (p: number) => {
    router.navigate({ to: '/search', search: { q, page: p } })
  }

  return (
    <>
      <Seo title={`${query ? `Search: ${query}` : 'Search'} — bengvarna`} description="Search articles across bengvarna." />
      <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-8 sm:px-6 md:pt-12">
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Search</h1>
        <form
          className="mt-6 flex items-center gap-3 rounded-2xl border border-stone-300 bg-white px-4 transition-colors focus-within:border-accent-500 focus-within:ring-2 focus-within:ring-accent-500/25 dark:border-stone-700 dark:bg-stone-900"
          onSubmit={(e) => {
            e.preventDefault()
            router.navigate({ to: '/search', search: { q: input.trim(), page: 1 } })
          }}
          role="search"
        >
          <Icon name="search" className="size-5 shrink-0 text-stone-400" />
          <input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search articles, topics, keywords…"
            aria-label="Search articles"
            autoFocus
            className="h-14 w-full bg-transparent text-base text-stone-900 placeholder:text-stone-400 focus:outline-none dark:text-stone-100"
          />
        </form>

        <div className="mt-8">
          {query.length === 0 ? (
            <p className="text-sm text-stone-500 dark:text-stone-400">Type a keyword to search titles, excerpts and article content.</p>
          ) : isLoading ? (
            <div className="grid gap-x-6 gap-y-10 md:grid-cols-2">
              <NewsCardSkeleton />
              <NewsCardSkeleton />
              <NewsCardSkeleton />
              <NewsCardSkeleton />
            </div>
          ) : isError || !data || data.items.length === 0 ? (
            <EmptyState
              icon="search"
              title={`No results for “${query}”`}
              description="Try a different keyword or browse the latest stories instead."
              action={{ label: 'Browse all news', onClick: () => router.navigate({ to: '/news', search: { page: 1 } }) }}
            />
          ) : (
            <>
              <p className="mb-6 text-sm text-stone-500 dark:text-stone-400">
                {data.total} {data.total === 1 ? 'result' : 'results'} for “{query}”
              </p>
              <div className="grid gap-x-6 gap-y-10 md:grid-cols-2">
                {data.items.map((article) => (
                  <NewsCard key={article.id} article={article} variant="horizontal" showExcerpt={false} />
                ))}
              </div>
              <Pagination page={page} totalPages={data.totalPages} onChange={changePage} className="mt-12" />
            </>
          )}
        </div>
      </div>
    </>
  )
}
