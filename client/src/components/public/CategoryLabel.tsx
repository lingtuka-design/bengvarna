import { Link } from '@tanstack/react-router'
import type { Category } from '../../lib/types'

export function CategoryLabel({
  category,
  className,
  asLink = true,
}: {
  category?: { name?: string | null; slug?: string | null; color?: string | null }
  className?: string
  asLink?: boolean
}) {
  if (!category?.name || !category.slug) return null
  const classes = `inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent-600 transition-colors dark:text-accent-400 ${className ?? ''}`
  const content = (
    <>
      {category.color && <span className="size-1.5 rounded-full" style={{ backgroundColor: category.color }} aria-hidden="true" />}
      {category.name}
    </>
  )
  if (!asLink) {
    return (
      <span className={classes} role="text">
        {content}
      </span>
    )
  }
  return (
    <Link to="/category/$slug" params={{ slug: category.slug }} search={{ page: 1 }} className={`${classes} hover:text-accent-500`}>
      {content}
    </Link>
  )
}

export function CategoryChips({ categories, className }: { categories?: Category[]; className?: string }) {
  if (!categories || categories.length === 0) return null
  return (
    <nav aria-label="Categories" className={className}>
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0">
        {categories.map((c) => (
          <li key={c.id} className="shrink-0">
            <Link
              to="/category/$slug"
              params={{ slug: c.slug }}
              search={{ page: 1 }}
              className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-stone-300 hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              {c.color && <span className="size-2 rounded-full" style={{ backgroundColor: c.color }} aria-hidden="true" />}
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
