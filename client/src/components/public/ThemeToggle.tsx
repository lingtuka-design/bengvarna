import { useTheme, type Theme } from '../../lib/theme'
import { Icon } from '../ui/Icon'
import { cn } from '../../lib/utils'

const order: Theme[] = ['light', 'dark', 'system']

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const next = order[(order.indexOf(theme) + 1) % order.length]

  const labels: Record<Theme, string> = {
    light: 'Switch to dark mode',
    dark: 'Switch to system theme',
    system: 'Switch to light mode',
  }

  const icons: Record<Theme, 'sun' | 'moon' | 'monitor'> = {
    light: 'sun',
    dark: 'moon',
    system: 'monitor',
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={labels[theme]}
      title={labels[theme]}
      className={cn(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-full text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/40 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-white',
        className,
      )}
    >
      <Icon name={icons[theme]} className="size-5" />
    </button>
  )
}
