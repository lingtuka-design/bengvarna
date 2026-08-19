import { cn } from '../../lib/utils'
import { Icon } from './Icon'

interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
  className?: string
}

function pageWindow(page: number, totalPages: number): Array<number | '…'> {
  const windowSize = 5
  let start = Math.max(1, page - 2)
  let end = Math.min(totalPages, start + windowSize - 1)
  start = Math.max(1, end - windowSize + 1)
  const pages: Array<number | '…'> = []
  if (start > 1) {
    pages.push(1)
    if (start > 2) pages.push('…')
  }
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < totalPages) {
    if (end < totalPages - 1) pages.push('…')
    pages.push(totalPages)
  }
  return pages
}

export function Pagination({ page, totalPages, onChange, className }: PaginationProps) {
  if (totalPages <= 1) return null
  const go = (p: number) => {
    if (p >= 1 && p <= totalPages && p !== page) onChange(p)
  }
  return (
    <nav aria-label="Pagination" className={cn('flex items-center justify-between gap-2', className)}>
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="inline-flex h-10 items-center gap-1 rounded-xl border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100 disabled:pointer-events-none disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
      >
        <Icon name="chevron-left" className="size-4" />
        <span className="hidden sm:inline">Prev</span>
      </button>
      <div className="hidden items-center gap-1 sm:flex" role="list">
        {pageWindow(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`e-${i}`} className="px-1.5 text-sm text-stone-400" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => go(p)}
              aria-current={p === page ? 'page' : undefined}
              className={cn(
                'h-10 min-w-10 rounded-xl px-2 text-sm font-semibold transition-colors',
                p === page
                  ? 'bg-accent-600 text-white dark:bg-accent-500'
                  : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800',
              )}
            >
              {p}
            </button>
          ),
        )}
      </div>
      <div className="text-sm text-stone-500 dark:text-stone-400 sm:hidden">
        Page {page} of {totalPages}
      </div>
      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="inline-flex h-10 items-center gap-1 rounded-xl border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100 disabled:pointer-events-none disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
      >
        <span className="hidden sm:inline">Next</span>
        <Icon name="chevron-right" className="size-4" />
      </button>
    </nav>
  )
}
