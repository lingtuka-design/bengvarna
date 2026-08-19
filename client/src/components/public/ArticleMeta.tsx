import type { Article } from '../../lib/types'
import { cn, formatDate, initials, readingTime } from '../../lib/utils'

interface ArticleMetaProps {
  article: Article
  minutes?: number
  showAvatar?: boolean
  className?: string
}

export function ArticleMeta({ article, minutes, showAvatar = false, className }: ArticleMetaProps) {
  const authorName = article.author || 'bengvarna Desk'
  const reading = minutes ?? (article.content ? readingTime(article.content) : undefined)
  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-stone-500 dark:text-stone-400', className)}>
      {showAvatar && (
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-stone-200 text-[11px] font-bold text-stone-600 dark:bg-stone-800 dark:text-stone-300"
        >
          {initials(authorName)}
        </span>
      )}
      <span className="font-semibold text-stone-700 dark:text-stone-200">{authorName}</span>
      {article.published_at && (
        <time dateTime={article.published_at} className="inline-flex items-center gap-1">
          {formatDate(article.published_at)}
        </time>
      )}
      {reading !== undefined && <span aria-label={`${reading} minute read`}>{reading} min read</span>}
    </div>
  )
}
