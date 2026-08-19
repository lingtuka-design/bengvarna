import { cn } from '../../lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-stone-200 dark:bg-stone-800', className)} />
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block size-6 shrink-0 animate-spin rounded-full border-2 border-stone-300 border-t-accent-600 dark:border-stone-700 dark:border-t-accent-400',
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  )
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-stone-500 dark:text-stone-400">
      <Spinner />
      {label}
    </div>
  )
}

export function FullScreenLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-stone-50 dark:bg-stone-950">
      <Spinner className="size-8" />
    </div>
  )
}

export function NewsCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'horizontal' | 'lead' }) {
  if (variant === 'horizontal') {
    return (
      <div className="flex gap-4">
        <Skeleton className="aspect-[4/3] w-32 shrink-0 rounded-xl sm:w-40" />
        <div className="min-w-0 flex-1 space-y-2.5 py-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
        </div>
      </div>
    )
  }
  if (variant === 'lead') {
    return (
      <div className="grid gap-5 sm:grid-cols-12 sm:items-center sm:gap-6 md:gap-8">
        <Skeleton className="aspect-[16/10] w-full rounded-xl sm:col-span-5 md:col-span-5" />
        <div className="space-y-3 sm:col-span-7 md:col-span-7">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-full sm:h-8 md:h-9" />
          <Skeleton className="h-7 w-3/4 sm:h-8 md:h-9" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-video w-full rounded-2xl" />
      <div className="space-y-2.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8', className)}>
      <div className="space-y-3">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <NewsCardSkeleton />
        <NewsCardSkeleton />
        <NewsCardSkeleton />
        <NewsCardSkeleton />
        <NewsCardSkeleton />
        <NewsCardSkeleton />
      </div>
    </div>
  )
}

export function ArticleTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-2xl" />
      ))}
    </div>
  )
}
