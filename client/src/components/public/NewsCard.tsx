import { Link } from '@tanstack/react-router'
import type { Article } from '../../lib/types'
import { cn, formatDate } from '../../lib/utils'
import { Icon } from '../ui/Icon'
import { CategoryLabel } from './CategoryLabel'

type NewsCardVariant = 'default' | 'horizontal' | 'lead'

interface NewsCardProps {
  article: Article
  variant?: NewsCardVariant
  showExcerpt?: boolean
  titleClassName?: string
  className?: string
}

function Cover({ article, className }: { article: Article; className?: string }) {
  if (!article.cover_image_url) {
    return (
      <div className={cn('flex items-center justify-center overflow-hidden rounded-xl border border-stone-200 bg-gradient-to-br from-stone-100 to-stone-200 text-stone-300 dark:border-stone-800 dark:from-stone-900 dark:to-stone-800 dark:text-stone-600', className)}>
        <Icon name="image" className="size-10" />
      </div>
    )
  }
  return (
    <div className={cn('overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800', className)}>
      <img src={article.cover_image_url} alt={article.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
    </div>
  )
}

function getCleanExcerpt(article: Article): string {
  if (article.excerpt && article.excerpt.trim().length > 0) {
    return article.excerpt.trim()
  }
  if (article.content) {
    return article.content
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200)
  }
  return ''
}

export function NewsCard({ article, variant = 'default', showExcerpt = true, titleClassName, className }: NewsCardProps) {
  const category = article.category_name
    ? { name: article.category_name, slug: article.category_slug }
    : undefined
  const excerpt = getCleanExcerpt(article)

  if (variant === 'horizontal') {
    return (
      <article className={cn('group min-w-0', className)}>
        <Link to="/article/$slug" params={{ slug: article.slug }} className="flex items-start gap-4">
          <Cover article={article} className="aspect-[4/3] w-32 shrink-0 sm:w-40" />
          <div className="min-w-0 flex-1 pt-0.5">
            <CategoryLabel category={category} asLink={false} />
            <h3 className={cn('mt-1.5 line-clamp-3 font-display text-lg font-semibold leading-snug tracking-tight group-hover:underline md:text-xl', titleClassName)}>
              {article.title}
            </h3>
            {showExcerpt && excerpt ? (
              <p className="mt-1.5 line-clamp-2 text-sm text-stone-500 dark:text-stone-400">{excerpt}</p>
            ) : null}
            <p className="mt-2 text-xs text-stone-400 dark:text-stone-500">{formatDate(article.published_at)}</p>
          </div>
        </Link>
      </article>
    )
  }

  if (variant === 'lead') {
    return (
      <article className={cn('group min-w-0', className)}>
        <Link to="/article/$slug" params={{ slug: article.slug }} className="grid gap-5 sm:grid-cols-12 sm:items-center sm:gap-6 md:gap-8">
          <Cover article={article} className="aspect-[16/10] w-full sm:col-span-5 md:col-span-5" />
          <div className="min-w-0 sm:col-span-7 md:col-span-7">
            <CategoryLabel category={category} asLink={false} />
            <h3 className={cn('mt-2 font-display text-xl font-semibold leading-snug tracking-tight group-hover:underline sm:text-2xl md:text-3xl', titleClassName)}>
              {article.title}
            </h3>
            {showExcerpt && excerpt ? (
              <p className="mt-2.5 line-clamp-3 text-sm text-stone-600 dark:text-stone-400 sm:text-base">{excerpt}</p>
            ) : null}
            <p className="mt-3 text-xs text-stone-400 dark:text-stone-500">{formatDate(article.published_at)}</p>
          </div>
        </Link>
      </article>
    )
  }

  return (
    <article className={cn('group min-w-0', className)}>
      <Link to="/article/$slug" params={{ slug: article.slug }} className="flex gap-4 md:block">
        <Cover article={article} className="aspect-[4/3] w-28 shrink-0 sm:w-36 md:aspect-video md:w-full" />
        <div className="min-w-0 flex-1 md:mt-4">
          <CategoryLabel category={category} asLink={false} />
          <h3 className={cn('mt-1.5 line-clamp-3 font-display text-lg font-semibold leading-snug tracking-tight group-hover:underline md:line-clamp-2 md:text-xl', titleClassName)}>
            {article.title}
          </h3>
          {showExcerpt && excerpt ? (
            <p className="mt-1.5 line-clamp-2 text-sm text-stone-500 dark:text-stone-400 md:block">{excerpt}</p>
          ) : null}
          <p className="mt-1.5 text-xs text-stone-400 dark:text-stone-500 md:mt-2.5">{formatDate(article.published_at)}</p>
        </div>
      </Link>
    </article>
  )
}
