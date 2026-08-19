import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type Variant = 'primary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-accent-600 text-white hover:bg-accent-500 active:bg-accent-700 focus-visible:ring-accent-500/40 dark:bg-accent-500 dark:hover:bg-accent-400 dark:active:bg-accent-600',
  outline:
    'border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 focus-visible:ring-stone-400/40 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800',
  ghost:
    'text-stone-600 hover:bg-stone-100 hover:text-stone-900 focus-visible:ring-stone-400/40 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-white',
  danger: 'bg-red-600 text-white hover:bg-red-500 active:bg-red-700 focus-visible:ring-red-500/40',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 gap-1.5 rounded-lg px-3 text-sm',
  md: 'h-11 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-6 text-base',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...rest}
    />
  )
})
