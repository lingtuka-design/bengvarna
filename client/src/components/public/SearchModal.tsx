import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useArticles } from '../../lib/queries'
import { useDebouncedValue, useLockBodyScroll, formatDate } from '../../lib/utils'
import { Icon } from '../ui/Icon'
import { Spinner } from '../ui/Skeleton'

interface SearchModalProps {
  open: boolean
  onClose: () => void
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [q, setQ] = useState('')
  const debounced = useDebouncedValue(q, 250)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { data, isLoading } = useArticles({ q: debounced.trim(), perPage: 6 }, debounced.trim().length > 1)

  useLockBodyScroll(open)

  useEffect(() => {
    if (open) {
      setQ('')
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const submit = () => {
    if (!debounced.trim()) return
    onClose()
    navigate({ to: '/search', search: { q: debounced.trim(), page: 1 } })
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center p-4 pt-[10dvh]" role="dialog" aria-modal="true" aria-label="Search">
      <div className="fade-in absolute inset-0 bg-stone-950/60 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div className="slide-up relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-stone-900">
        <form
          className="flex items-center gap-3 border-b border-stone-200 px-4 dark:border-stone-800"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <Icon name="search" className="size-5 shrink-0 text-stone-400" />
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search articles, topics, keywords…"
            aria-label="Search articles"
            className="h-14 w-full bg-transparent text-base text-stone-900 placeholder:text-stone-400 focus:outline-none dark:text-stone-100"
          />
          <button type="button" onClick={onClose} aria-label="Close search" className="flex size-9 shrink-0 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800">
            <Icon name="x" className="size-5" />
          </button>
        </form>
        <div className="max-h-[50dvh] overflow-y-auto">
          {debounced.trim().length <= 1 ? (
            <p className="px-5 py-8 text-center text-sm text-stone-400 dark:text-stone-500">Type at least 2 characters to search</p>
          ) : isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : data && data.items.length > 0 ? (
            <ul>
              {data.items.map((a) => (
                <li key={a.id} className="border-b border-stone-100 last:border-0 dark:border-stone-800">
                  <Link
                    to="/article/$slug"
                    params={{ slug: a.slug }}
                    onClick={onClose}
                    className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-stone-50 dark:hover:bg-stone-800/50"
                  >
                    {a.cover_image_url ? (
                      <img src={a.cover_image_url} alt="" loading="lazy" className="size-14 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-300 dark:bg-stone-800" aria-hidden="true">
                        <Icon name="image" className="size-6" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-stone-800 dark:text-stone-200">{a.title}</span>
                      <span className="mt-0.5 block text-xs text-stone-500 dark:text-stone-400">
                        {a.category_name ?? 'News'} · {formatDate(a.published_at)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-stone-400 dark:text-stone-500">No results for “{debounced.trim()}”</p>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-stone-200 px-4 py-2.5 dark:border-stone-800">
          <p className="text-xs text-stone-400 dark:text-stone-500">Search the whole site</p>
          <button type="button" onClick={submit} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent-600 px-3 text-sm font-semibold text-white hover:bg-accent-500">
            <Icon name="chevron-right" className="size-4" />
            View all results
          </button>
        </div>
      </div>
    </div>
  )
}
