import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: IconName
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  children?: ReactNode
}

export function EmptyState({ icon = 'file', title, description, action, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-stone-300 px-6 py-14 text-center dark:border-stone-700">
      <div className="flex size-12 items-center justify-center rounded-full bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500">
        <Icon name={icon} className="size-6" />
      </div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {description && <p className="max-w-sm text-sm leading-relaxed text-stone-500 dark:text-stone-400">{description}</p>}
      {action && (
        <Button variant="outline" size="sm" className="mt-1" onClick={action.onClick}>
          <Icon name="plus" className="size-4" />
          {action.label}
        </Button>
      )}
      {children}
    </div>
  )
}
