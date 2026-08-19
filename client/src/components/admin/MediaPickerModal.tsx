import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { uploadMediaWithProgress } from '../../lib/api'
import { useMedia } from '../../lib/queries'
import { formatBytes, cn } from '../../lib/utils'
import { Modal } from '../ui/Modal'
import { Spinner } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { useToast } from '../ui/Toast'
import type { MediaItem } from '../../lib/types'

interface MediaPickerModalProps {
  open: boolean
  onClose: () => void
  onSelect: (url: string, item: MediaItem) => void
}

export function MediaPickerModal({ open, onClose, onSelect }: MediaPickerModalProps) {
  const [tab, setTab] = useState<'library' | 'upload'>('library')
  const [page, setPage] = useState(1)
  const [progress, setProgress] = useState<number | null>(null)
  const { data, isLoading } = useMedia(page)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const handleFile = async (file: File) => {
    const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
    if (!ACCEPTED.includes(file.type)) {
      toast('Only JPEG, PNG, WebP or AVIF images are supported', 'error')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast('Image must be smaller than 10 MB', 'error')
      return
    }
    setProgress(0)
    try {
      const item = await uploadMediaWithProgress(file, setProgress)
      queryClient.invalidateQueries({ queryKey: ['media'] })
      toast('Image uploaded')
      onSelect(item.url, item)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Upload failed', 'error')
    } finally {
      setProgress(null)
    }
  }

  return (
    <Modal open={open} onClose={onClose} wide labelledBy="media-picker-title">
      <div className="p-5 sm:p-6">
        <h2 id="media-picker-title" className="pr-10 font-display text-xl font-semibold">
          Media library
        </h2>
        <div className="mt-4 flex gap-2 rounded-xl bg-stone-100 p-1 dark:bg-stone-800" role="tablist" aria-label="Media source">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'library'}
            onClick={() => setTab('library')}
            className={cn(
              'flex h-10 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors',
              tab === 'library' ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-900 dark:text-white' : 'text-stone-500 dark:text-stone-400',
            )}
          >
            <Icon name="image" className="size-4" />
            Library
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'upload'}
            onClick={() => setTab('upload')}
            className={cn(
              'flex h-10 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors',
              tab === 'upload' ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-900 dark:text-white' : 'text-stone-500 dark:text-stone-400',
            )}
          >
            <Icon name="upload" className="size-4" />
            Upload
          </button>
        </div>

        {tab === 'upload' ? (
          <div className="mt-5">
            <label className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 text-stone-500 transition-colors hover:border-accent-400 hover:text-accent-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400">
              <Icon name="upload" className="size-7" />
              <span className="text-sm font-semibold">Tap to choose from your camera or gallery</span>
              <span className="text-xs text-stone-400 dark:text-stone-500">JPEG · PNG · WebP · AVIF · up to 10 MB</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleFile(file)
                  e.target.value = ''
                }}
              />
            </label>
            {progress !== null && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
                <div className="h-full rounded-full bg-accent-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              icon="image"
              title="No images yet"
              description="Upload an image from your phone or computer, then pick it from the library."
              action={{ label: 'Upload an image', onClick: () => setTab('upload') }}
            />
          </div>
        ) : (
          <>
            <ul className="mt-5 grid grid-cols-3 gap-3">
              {data.items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item.url, item)}
                    className="group w-full overflow-hidden rounded-xl border border-stone-200 bg-white text-left dark:border-stone-800 dark:bg-stone-900"
                  >
                    <img src={item.url} alt={item.original_name} loading="lazy" className="aspect-square w-full object-cover transition-transform group-hover:scale-105" />
                    <div className="border-t border-stone-100 px-2.5 py-2 dark:border-stone-800">
                      <p className="truncate text-xs font-semibold text-stone-700 dark:text-stone-300">{item.original_name}</p>
                      <p className="text-[11px] text-stone-400 dark:text-stone-500">{formatBytes(item.size)}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            {(data.page > 1 || data.page < data.totalPages) && (
              <div className="mt-4 flex items-center justify-between">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <Icon name="chevron-left" className="size-4" />
                  Previous
                </Button>
                <span className="text-xs text-stone-400 dark:text-stone-500">
                  Page {data.page} of {data.totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                  <Icon name="chevron-right" className="size-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
