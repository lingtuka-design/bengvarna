import { useEffect, useRef } from 'react'
import { cn } from '../../lib/utils'

interface AdSlotProps {
  variant?: 'leaderboard' | 'in-feed' | 'in-article' | 'rectangle' | 'half-page' | 'sticky-sidebar'
  className?: string
  slotId?: string
}

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

export function AdSlot({ variant = 'leaderboard', className, slotId }: AdSlotProps) {
  const adRef = useRef<HTMLModElement>(null)

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle && adRef.current) {
        // Only push if not already loaded
        if (!adRef.current.getAttribute('data-adsbygoogle-status')) {
          (window.adsbygoogle = window.adsbygoogle || []).push({})
        }
      }
    } catch {
      /* noop */
    }
  }, [variant, slotId])

  if (variant === 'sticky-sidebar') {
    return (
      <div className={cn('sticky top-24 space-y-6', className)}>
        <AdSlot variant="rectangle" slotId={slotId} />
        <AdSlot variant="half-page" slotId={slotId} />
      </div>
    )
  }

  if (variant === 'half-page') {
    return (
      <div className={cn('flex flex-col items-center justify-center text-center', className)}>
        <span className="text-[10px] font-medium tracking-widest text-stone-400 uppercase">Advertisement</span>
        <div className="mt-1.5 flex min-h-[300px] sm:min-h-[600px] w-full max-w-[300px] flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-stone-300 bg-stone-100/80 p-2 dark:border-stone-700 dark:bg-stone-800/40">
          <ins
            ref={adRef}
            className="adsbygoogle"
            style={{ display: 'block', minWidth: '250px', minHeight: '250px' }}
            data-ad-client="ca-pub-5538940850178274"
            data-ad-slot={slotId || '1234567890'}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      </div>
    )
  }

  if (variant === 'leaderboard') {
    return (
      <div className={cn('my-6 flex flex-col items-center justify-center text-center', className)}>
        <span className="text-[10px] font-medium tracking-widest text-stone-400 uppercase">Advertisement</span>
        <div className="mt-1.5 flex min-h-[90px] w-full max-w-[728px] items-center justify-center overflow-hidden rounded-lg border border-dashed border-stone-300 bg-stone-100/70 p-2 dark:border-stone-700 dark:bg-stone-800/40">
          <ins
            ref={adRef}
            className="adsbygoogle"
            style={{ display: 'block', width: '100%' }}
            data-ad-client="ca-pub-5538940850178274"
            data-ad-slot={slotId || '1234567890'}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      </div>
    )
  }

  if (variant === 'in-feed') {
    return (
      <div className={cn('my-6 flex flex-col items-center justify-center text-center', className)}>
        <span className="text-[10px] font-medium tracking-widest text-stone-400 uppercase">Sponsored / Ad</span>
        <div className="mt-1.5 w-full overflow-hidden rounded-xl border border-dashed border-amber-300 bg-amber-50/40 p-3 sm:p-4 dark:border-amber-900/50 dark:bg-amber-950/10">
          <ins
            ref={adRef}
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-format="fluid"
            data-ad-layout-key="-fb+5w+4e-db+86"
            data-ad-client="ca-pub-5538940850178274"
            data-ad-slot={slotId || '1234567890'}
          />
        </div>
      </div>
    )
  }

  if (variant === 'in-article') {
    return (
      <div className={cn('my-8 flex flex-col items-center justify-center text-center', className)}>
        <span className="text-[10px] font-medium tracking-widest text-stone-400 uppercase">Advertisement</span>
        <div className="mt-1.5 flex min-h-[120px] w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-stone-300 bg-stone-100/60 p-3 dark:border-stone-700 dark:bg-stone-800/40">
          <ins
            ref={adRef}
            className="adsbygoogle"
            style={{ display: 'block', textAlign: 'center' }}
            data-ad-layout="in-article"
            data-ad-format="fluid"
            data-ad-client="ca-pub-5538940850178274"
            data-ad-slot={slotId || '1234567890'}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('my-6 flex flex-col items-center justify-center text-center', className)}>
      <span className="text-[10px] font-medium tracking-widest text-stone-400 uppercase">Advertisement</span>
      <div className="mt-1.5 flex min-h-[250px] w-full max-w-[300px] flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-stone-300 bg-stone-100/80 p-3 text-center dark:border-stone-700 dark:bg-stone-800/40">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-5538940850178274"
          data-ad-slot={slotId || '1234567890'}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  )
}
