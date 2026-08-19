import type { ArticleStatus } from '../../lib/types'
import { cn } from '../../lib/utils'

const statusStyles: Record<ArticleStatus, string> = {
  published: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  draft: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  archived: 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
}

export function StatusBadge({ status, className }: { status: ArticleStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize',
        statusStyles[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </span>
  )
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300',
        className,
      )}
    >
      {children}
    </span>
  )
}
