import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiPath, uploadMediaWithProgress } from '../../lib/api'
import { cn } from '../../lib/utils'
import { Icon } from '../ui/Icon'
import { Button } from '../ui/Button'
import { useToast } from '../ui/Toast'
import { MediaPickerModal } from './MediaPickerModal'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

interface ImageUploaderProps {
  value: string
  onChange: (url: string) => void
  label?: string
  hint?: string
}

export function ImageUploader({ value, onChange, label = 'Image', hint }: ImageUploaderProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const handleFile = async (file: File) => {
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
      onChange(item.url)
      toast('Image uploaded')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Upload failed', 'error')
    } finally {
      setProgress(null)
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold text-stone-700 dark:text-stone-300">{label}</span>
      {value ? (
        <div className="group relative overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800">
          <img src={value} alt="" className="aspect-video w-full object-cover" />
          <div className="absolute inset-0 flex items-end justify-center gap-2 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent p-3 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            <Button size="sm" variant="outline" className="bg-white/95 text-stone-800 dark:bg-stone-900/95 dark:text-stone-200" onClick={() => setPickerOpen(true)}>
              <Icon name="image" className="size-4" />
              Library
            </Button>
            <Button size="sm" variant="outline" className="bg-white/95 text-stone-800 dark:bg-stone-900/95 dark:text-stone-200" onClick={() => document.getElementById(`${label}-file-input`)?.click()}>
              <Icon name="upload" className="size-4" />
              Replace
            </Button>
            <Button size="sm" variant="danger" onClick={() => onChange('')}>
              <Icon name="trash" className="size-4" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => document.getElementById(`${label}-file-input`)?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const file = e.dataTransfer.files?.[0]
            if (file) void handleFile(file)
          }}
          className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 text-stone-500 transition-colors hover:border-accent-400 hover:text-accent-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400 dark:hover:border-accent-500"
        >
          <Icon name="upload" className="size-7" />
          <span className="text-sm font-semibold">Tap to upload or drop an image</span>
          <span className="text-xs text-stone-400 dark:text-stone-500">JPEG · PNG · WebP · AVIF · up to 10 MB</span>
        </button>
      )}
      {progress !== null && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
          <div className="h-full rounded-full bg-accent-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      <input
        id={`${label}-file-input`}
        type="file"
        accept={ACCEPTED.join(',')}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ''
        }}
      />
      {hint && <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">{hint}</p>}
      <div className={cn('mt-2 flex items-center justify-between gap-2')}>
        <span className="truncate text-xs text-stone-400 dark:text-stone-500">{value ? value.split('/').pop() : 'No image selected'}</span>
        <Button type="button" variant="ghost" size="sm" onClick={() => setPickerOpen(true)}>
          <Icon name="image" className="size-4" />
          Choose from library
        </Button>
      </div>
      <MediaPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={(url) => onChange(url)} />
    </div>
  )
}
