import { Link } from '@tanstack/react-router'
import { router } from '../../router'
import { useStats } from '../../lib/queries'
import { formatDate } from '../../lib/utils'
import { Icon, type IconName } from '../../components/ui/Icon'
import { StatusBadge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { Button } from '../../components/ui/Button'

interface StatCard {
  label: string
  value: number | undefined
  icon: IconName
  to?: string
  accent?: string
}

export function AdminDashboard() {
  const { data: stats, isLoading } = useStats()

  const cards: StatCard[] = [
    { label: 'Total articles', value: stats?.total_articles, icon: 'file', to: '/admin/articles' },
    { label: 'Published', value: stats?.published, icon: 'check', to: '/admin/articles', accent: 'text-emerald-500' },
    { label: 'Drafts', value: stats?.drafts, icon: 'pencil', to: '/admin/articles', accent: 'text-amber-500' },
    { label: 'Categories', value: stats?.categories, icon: 'tag', to: '/admin/categories' },
    { label: 'Featured stories', value: stats?.featured, icon: 'star', to: '/admin/featured', accent: 'text-accent-500' },
    { label: 'Media files', value: stats?.media, icon: 'image', to: '/admin/media' },
  ]

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Your newsroom at a glance.</p>
        </div>
        <Link to="/admin/articles/new">
          <Button>
            <Icon name="plus" className="size-4" />
            New article
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
            <div className="flex items-center gap-2">
              <Icon name={card.icon} className={`size-4 ${card.accent ?? 'text-stone-400'}`} />
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">{card.label}</span>
            </div>
            {isLoading ? <Skeleton className="mt-2 h-7 w-12" /> : <p className="mt-2 font-display text-3xl font-semibold">{card.value ?? 0}</p>}
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link to="/admin/articles/new">
          <Button size="sm">
            <Icon name="plus" className="size-4" />
            New article
          </Button>
        </Link>
        <Link to="/admin/articles">
          <Button size="sm" variant="outline">
            Manage articles
          </Button>
        </Link>
        <Link to="/admin/categories">
          <Button size="sm" variant="outline">
            Manage categories
          </Button>
        </Link>
        <Link to="/admin/featured">
          <Button size="sm" variant="outline">
            <Icon name="star" className="size-4" />
            Featured news
          </Button>
        </Link>
      </div>

      <section className="mt-8" aria-label="Recent articles">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Recent articles</h2>
          <Link to="/admin/articles" className="text-sm font-semibold text-accent-600 hover:text-accent-500 dark:text-accent-400">
            View all
          </Link>
        </div>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : !stats || stats.recent.length === 0 ? (
          <EmptyState
            icon="file"
            title="No articles yet"
            description="Write your first story — it only takes a minute."
            action={{ label: 'Write an article', onClick: () => router.navigate({ to: '/admin/articles/new' }) }}
          />
        ) : (
          <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900">
            {stats.recent.map((a) => (
              <li key={a.id}>
                <Link to="/admin/articles/$id/edit" params={{ id: String(a.id) }} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-stone-50 dark:hover:bg-stone-800/40">
                  {a.cover_image_url ? (
                    <img src={a.cover_image_url} alt="" loading="lazy" className="h-10 w-14 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-300 dark:bg-stone-800" aria-hidden="true">
                      <Icon name="image" className="size-4" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-stone-800 dark:text-stone-200">{a.title}</p>
                    <p className="text-xs text-stone-400 dark:text-stone-500">{a.category_name ?? 'Uncategorized'} · {formatDate(a.published_at) || 'Not published'}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
