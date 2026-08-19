import { Icon } from '../ui/Icon'
import { cn } from '../../lib/utils'

interface SearchButtonProps {
  onClick: () => void
  compact?: boolean
}

export function SearchButton({ onClick, compact = false }: SearchButtonProps) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Open search"
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/40 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-white"
      >
        <Icon name="search" className="size-5" />
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-stone-200 bg-white px-4 text-sm font-medium text-stone-500 transition-colors hover:border-stone-300 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/40 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400 dark:hover:border-stone-600 dark:hover:text-stone-200',
      )}
    >
      <Icon name="search" className="size-4" />
      Search
      <kbd className="hidden rounded-md border border-stone-200 bg-stone-50 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-stone-400 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-500 lg:inline">
        Ctrl K
      </kbd>
    </button>
  )
}
