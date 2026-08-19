import { cn } from '../../lib/utils'

export function Logo({ className, withDot = true }: { className?: string; withDot?: boolean }) {
  return (
    <span className={cn('font-display text-2xl font-semibold tracking-tight', className)}>
      bengvarna{withDot && <span className="text-accent-500">.</span>}
    </span>
  )
}
