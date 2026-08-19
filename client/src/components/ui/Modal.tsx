import { useEffect, type ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { Icon } from './Icon'

interface ModalProps {
  open: boolean
  onClose?: () => void
  children: ReactNode
  labelledBy?: string
  className?: string
  wide?: boolean
}

export function Modal({ open, onClose, children, labelledBy, className, wide = false }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
      <div className="fade-in absolute inset-0 bg-stone-950/60 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={cn(
          'slide-up relative max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl dark:bg-stone-900 sm:rounded-2xl',
          wide ? 'sm:max-w-3xl' : 'sm:max-w-md',
          className,
        )}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800 dark:hover:text-white"
          >
            <Icon name="x" className="size-4" />
          </button>
        )}
        {children}
      </div>
    </div>
  )
}
