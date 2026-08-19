import { cn } from '../../lib/utils'

interface AdSlotProps {
  variant?: 'leaderboard' | 'in-feed' | 'in-article' | 'rectangle' | 'half-page' | 'sticky-sidebar'
  className?: string
}

export function AdSlot({ variant = 'leaderboard', className }: AdSlotProps) {
  if (variant === 'half-page') {
    return (
      <div className={cn('flex flex-col items-center justify-center text-center', className)}>
        <span className="text-[10px] font-medium tracking-widest text-stone-400 uppercase">Advertisement</span>
        <div className="mt-1.5 flex h-[600px] w-full max-w-[300px] flex-col justify-between rounded-xl border border-dashed border-stone-300 bg-stone-100/80 p-5 text-center dark:border-stone-700 dark:bg-stone-800/40">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3 dark:border-stone-700">
            <span className="rounded bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">Ad</span>
            <span className="text-xs text-stone-400">Google AdSense</span>
          </div>
          <div className="my-auto space-y-3 py-6">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 font-bold text-white shadow-md">
              300×600
            </div>
            <h4 className="font-display text-lg font-semibold text-stone-800 dark:text-stone-200">
              Half-Page / Skyscraper Display Unit
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Premium high-impact vertical ad slot with high viewability and engagement.
            </p>
          </div>
          <button type="button" className="w-full rounded-lg bg-blue-600 py-2.5 text-xs font-semibold text-white shadow hover:bg-blue-700">
            Learn More
          </button>
        </div>
      </div>
    )
  }

  if (variant === 'sticky-sidebar') {
    return (
      <div className={cn('sticky top-24 space-y-6', className)}>
        <AdSlot variant="rectangle" />
        <AdSlot variant="half-page" />
      </div>
    )
  }

  if (variant === 'leaderboard') {
    return (
      <div className={cn('my-6 flex flex-col items-center justify-center text-center', className)}>
        <span className="text-[10px] font-medium tracking-widest text-stone-400 uppercase">Advertisement</span>
        <div className="mt-1.5 flex h-[90px] w-full max-w-[728px] items-center justify-between overflow-hidden rounded-lg border border-dashed border-stone-300 bg-stone-100/70 p-4 dark:border-stone-700 dark:bg-stone-800/40">
          <div className="flex items-center gap-3 text-left">
            <div className="flex size-12 shrink-0 items-center justify-center rounded bg-blue-500 font-bold text-white shadow-sm">
              Ad
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">Google AdSense Leaderboard (728x90)</p>
              <p className="hidden text-xs text-stone-500 dark:text-stone-400 sm:block">Reach high-intent audiences with automated responsive display ads.</p>
            </div>
          </div>
          <span className="shrink-0 rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-blue-700">
            Learn More
          </span>
        </div>
      </div>
    )
  }

  if (variant === 'in-feed') {
    return (
      <div className={cn('my-6 flex flex-col items-center justify-center text-center', className)}>
        <span className="text-[10px] font-medium tracking-widest text-stone-400 uppercase">Sponsored / Ad</span>
        <div className="mt-1.5 grid w-full gap-5 rounded-xl border border-dashed border-amber-300 bg-amber-50/40 p-4 sm:grid-cols-12 sm:items-center sm:gap-6 dark:border-amber-900/50 dark:bg-amber-950/10">
          <div className="flex aspect-[16/10] w-full items-center justify-center rounded-xl bg-amber-200/60 sm:col-span-5 dark:bg-amber-900/30">
            <span className="font-mono text-xs font-bold text-amber-800 dark:text-amber-300">In-Feed Native Ad</span>
          </div>
          <div className="text-left sm:col-span-7">
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide dark:text-amber-400">Sponsored Content</span>
            <h4 className="mt-1 font-display text-lg font-semibold text-stone-900 dark:text-stone-100">
              Modern Solutions for Digital Media & Online Publishing
            </h4>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              Native in-feed ad seamlessly blending into the editorial stream.
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <span className="rounded bg-stone-900 px-3 py-1 text-xs font-medium text-white dark:bg-stone-100 dark:text-stone-900">
                Visit Sponsor →
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'in-article') {
    return (
      <div className={cn('my-8 flex flex-col items-center justify-center text-center', className)}>
        <span className="text-[10px] font-medium tracking-widest text-stone-400 uppercase">Advertisement</span>
        <div className="mt-1.5 flex min-h-[140px] w-full items-center justify-between rounded-xl border border-dashed border-stone-300 bg-stone-100/60 p-6 text-left dark:border-stone-700 dark:bg-stone-800/40">
          <div className="space-y-1.5">
            <span className="inline-block rounded bg-stone-200 px-1.5 py-0.5 text-[10px] font-bold text-stone-700 dark:bg-stone-700 dark:text-stone-300">Ad</span>
            <h4 className="text-base font-semibold text-stone-800 dark:text-stone-200">In-Article Google Responsive Ad</h4>
            <p className="text-xs text-stone-500 dark:text-stone-400">Targeted mid-paragraph display ad optimized for article engagement.</p>
          </div>
          <span className="shrink-0 rounded bg-stone-900 px-3.5 py-2 text-xs font-medium text-white shadow hover:bg-stone-800 dark:bg-white dark:text-stone-900">
            Open
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('my-6 flex flex-col items-center justify-center text-center', className)}>
      <span className="text-[10px] font-medium tracking-widest text-stone-400 uppercase">Advertisement</span>
      <div className="mt-1.5 flex h-[250px] w-full max-w-[300px] flex-col justify-between rounded-xl border border-dashed border-stone-300 bg-stone-100/80 p-4 text-center dark:border-stone-700 dark:bg-stone-800/40">
        <div className="flex items-center justify-between border-b border-stone-200 pb-2 dark:border-stone-700">
          <span className="rounded bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">Ad</span>
          <span className="text-xs text-stone-400">300×250</span>
        </div>
        <div className="my-auto">
          <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">Medium Rectangle Ad</p>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">Standard Google display unit</p>
        </div>
        <button type="button" className="w-full rounded bg-stone-900 py-1.5 text-xs font-medium text-white dark:bg-stone-100 dark:text-stone-900">
          View
        </button>
      </div>
    </div>
  )
}
