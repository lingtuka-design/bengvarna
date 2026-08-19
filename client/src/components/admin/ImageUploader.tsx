import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { uploadMediaWithProgress } from '../../lib/api'
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

export function ImageUploader({ value, onChange, label = 'Cover image', hint }: ImageUploaderProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const inputId = `${label.toLowerCase().replace(/\s+/g, '-')}-file-input`

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
      <div className="mb-2 flex items-center justify-between">
        <span className="block text-sm font-semibold text-stone-700 dark:text-stone-300">{label}</span>
        {hint && <span className="text-xs text-stone-400 dark:text-stone-500">{hint}</span>}
      </div>

      {value ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-stone-200 bg-stone-50/70 p-3 dark:border-stone-800 dark:bg-stone-900/60">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-200 dark:border-stone-700 dark:bg-stone-800 sm:h-16 sm:w-24">
              <img src={value} alt="" className="size-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-stone-800 dark:text-stone-200">
                {value.split('/').pop()}
              </p>
              <p className="mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <Icon name="check" className="size-3" /> Image attached
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => document.getElementById(inputId)?.click()}
              className="h-8 text-xs font-semibold"
            >
              <Icon name="upload" className="size-3.5" />
              Upload new
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setPickerOpen(true)}
              className="h-8 text-xs font-semibold"
            >
              <Icon name="image" className="size-3.5" />
              Library
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onChange('')}
              className="h-8 text-xs font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
            >
              <Icon name="trash" className="size-3.5" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            const file = e.dataTransfer.files?.[0]
            if (file) void handleFile(file)
          }}
          className={cn(
            'flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed p-3 transition-colors sm:px-4 sm:py-3.5',
            dragOver
              ? 'border-accent-500 bg-accent-50/50 dark:border-accent-400 dark:bg-accent-950/20'
              : 'border-stone-300 bg-stone-50/60 hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900/40',
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-stone-200/80 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
              <Icon name="image" className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Add a cover photo for this story
              </p>
              <p className="text-[11px] text-stone-400 dark:text-stone-500">
                Drag &amp; drop or click upload (JPG, PNG, WebP up to 10MB)
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setPickerOpen(true)}
              className="h-8 text-xs font-semibold"
            >
              <Icon name="image" className="size-3.5" />
              Library
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => document.getElementById(inputId)?.click()}
              className="h-8 text-xs font-semibold"
            >
              <Icon name="upload" className="size-3.5" />
              Upload
            </Button>
          </div>
        </div>
      )}

      {progress !== null && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
          <div className="h-full rounded-full bg-accent-500 transition-all duration-150" style={{ width: `${progress}%` }} />
        </div>
      )}

      <input
        id={inputId}
        type="file"
        accept={ACCEPTED.join(',')}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ''
        }}
      />

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => {
          onChange(url)
          setPickerOpen(false)
        }}
      />
    </div>
  )
}
