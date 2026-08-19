import { useToast } from '../ui/Toast'
import { Icon, type IconName } from '../ui/Icon'
import { cn } from '../../lib/utils'

interface ShareButtonsProps {
  url: string
  title: string
  compact?: boolean
  className?: string
}

export function ShareButtons({ url, title, compact = false, className }: ShareButtonsProps) {
  const { toast } = useToast()

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const items: Array<{ label: string; icon: IconName; href: string }> = [
    {
      label: 'Share on X',
      icon: 'twitter',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      label: 'Share on Facebook',
      icon: 'facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: 'Share on WhatsApp',
      icon: 'phone',
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      label: 'Share on Telegram',
      icon: 'send',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    },
  ]

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast('Link copied to clipboard')
    } catch {
      toast('Could not copy the link', 'error')
    }
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)} role="group" aria-label="Share article">
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={item.label}
          title={item.label}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-600 dark:hover:text-white"
        >
          <Icon name={item.icon} className={cn(compact ? 'size-4' : 'size-[18px]')} />
        </a>
      ))}
      <button
        type="button"
        onClick={copyLink}
        aria-label="Copy link"
        title="Copy link"
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 transition-colors hover:border-stone-300 hover:text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-600 dark:hover:text-white"
      >
        <Icon name="link" className={cn(compact ? 'size-4' : 'size-[18px]')} />
      </button>
    </div>
  )
}
