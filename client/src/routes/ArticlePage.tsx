import { useParams } from '@tanstack/react-router'
import { router } from '../router'
import { useArticle, useBootstrap } from '../lib/queries'
import { Seo, absoluteUrl } from '../lib/seo'
import { ArticleMeta } from '../components/public/ArticleMeta'
import { ArticleContent } from '../components/public/ArticleContent'
import { ShareButtons } from '../components/public/ShareButtons'
import { RelatedArticles } from '../components/public/RelatedArticles'
import { CategoryLabel } from '../components/public/CategoryLabel'
import { EmptyState } from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import { AdSlot } from '../components/public/AdSlot'
import { readingTime } from '../lib/utils'

export function ArticlePage() {
  const { slug } = useParams({ from: '/public/article/$slug' })
  const { data: article, isLoading, isError } = useArticle(slug)
  const { data: bootstrap } = useBootstrap()

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pt-10 sm:px-6">
        <div className="space-y-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-5 w-2/3" />
        </div>
        <Skeleton className="mt-10 aspect-video w-full rounded-2xl" />
        <div className="mt-8 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    )
  }

  if (isError || !article) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-12 sm:px-6">
        <EmptyState
          icon="alert"
          title="Article not found"
          description="This story may have been unpublished or removed."
          action={{ label: 'Back to all news', onClick: () => router.navigate({ to: '/news', search: { page: 1 } }) }}
        />
      </div>
    )
  }

  const title = article.seo_title || article.title
  const description = article.seo_description || article.excerpt || bootstrap?.settings.default_seo_description
  const image = absoluteUrl(article.social_image_url || article.cover_image_url || bootstrap?.settings.default_social_image)
  const url = `${window.location.origin}/article/${article.slug}`
  const minutes = readingTime(article.content ?? '')
  const category = article.category_name ? { name: article.category_name, slug: article.category_slug } : undefined

  return (
    <>
      <Seo title={title} description={description} image={image} url={url} type="article" />
      <article className="mx-auto w-full max-w-3xl px-4 pb-14 pt-8 sm:px-6 md:pt-12">
        <CategoryLabel category={category} className="text-sm" />
        <h1 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-5xl">
          {article.title}
        </h1>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-stone-200 py-4 dark:border-stone-800">
          <ArticleMeta article={article} minutes={minutes} showAvatar />
          <ShareButtons url={url} title={article.title} compact />
        </div>
        {article.cover_image_url && (
          <figure className="mt-8">
            <img
              src={article.cover_image_url}
              alt={article.title}
              fetchPriority="high"
              decoding="async"
              className="aspect-[16/9] w-full rounded-2xl border border-stone-200 object-cover dark:border-stone-800"
            />
          </figure>
        )}
        <div className="mt-8">
          <ArticleContent html={article.content ?? ''} />
        </div>
        <AdSlot variant="in-article" />
        <div className="mt-12 flex flex-col items-start gap-4 border-t border-stone-200 pt-8 dark:border-stone-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">Enjoyed this story?</h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">Share it with someone who should read it.</p>
          </div>
          <ShareButtons url={url} title={article.title} />
        </div>
      </article>
      <div className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <AdSlot variant="leaderboard" className="mb-10" />
        <RelatedArticles categorySlug={article.category_slug} currentSlug={article.slug} />
      </div>
    </>
  )
}
