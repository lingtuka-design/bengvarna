import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { Icon } from './Icon'

export type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toastStyles: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-white text-stone-900 dark:border-emerald-900 dark:bg-stone-900 dark:text-stone-100',
  error: 'border-red-200 bg-white text-stone-900 dark:border-red-900 dark:bg-stone-900 dark:text-stone-100',
  info: 'border-stone-200 bg-white text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100',
}

const toastIcons: Record<ToastType, 'check' | 'alert' | 'clock'> = {
  success: 'check',
  error: 'alert',
  info: 'clock',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++idRef.current
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[100] flex flex-col items-center gap-2 px-4 lg:bottom-6"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'toast-enter pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-full border px-4 py-2.5 text-sm font-medium shadow-lg',
              toastStyles[t.type],
            )}
          >
            <Icon name={toastIcons[t.type]} className={cn('size-4 shrink-0', t.type === 'success' && 'text-emerald-500', t.type === 'error' && 'text-red-500', t.type === 'info' && 'text-stone-400')} />
            <span className="line-clamp-2">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
