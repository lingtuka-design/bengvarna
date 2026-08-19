import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, uploadMediaWithProgress } from '../../lib/api'
import { useMedia } from '../../lib/queries'
import { formatBytes, cn } from '../../lib/utils'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { Spinner } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Pagination } from '../../components/ui/Pagination'
import { useToast } from '../../components/ui/Toast'
import type { MediaItem } from '../../lib/types'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

export function AdminMedia() {
  const [page, setPage] = useState(1)
  const [uploads, setUploads] = useState<Array<{ name: string; progress: number; error?: string }>>([])
  const [deleting, setDeleting] = useState<MediaItem | null>(null)
  const { data, isLoading } = useMedia(page)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files)
    setUploads((u) => [...u, ...list.map((f) => ({ name: f.name, progress: 0 }))])
    for (const file of list) {
      if (!ACCEPTED.includes(file.type)) {
        setUploads((u) => u.map((x) => (x.name === file.name ? { ...x, error: 'Unsupported type' } : x)))
        toast(`${file.name}: unsupported format`, 'error')
        continue
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploads((u) => u.map((x) => (x.name === file.name ? { ...x, error: 'Too large' } : x)))
        toast(`${file.name}: larger than 10 MB`, 'error')
        continue
      }
      try {
        await uploadMediaWithProgress(file, (pct) => {
          setUploads((u) => u.map((x) => (x.name === file.name ? { ...x, progress: pct } : x)))
        })
        queryClient.invalidateQueries({ queryKey: ['media'] })
        setUploads((u) => u.filter((x) => x.name !== file.name))
        toast(`${file.name} uploaded`)
      } catch (e) {
        setUploads((u) => u.map((x) => (x.name === file.name ? { ...x, error: e instanceof Error ? e.message : 'Failed' } : x)))
      }
    }
  }

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.del<{ ok: boolean }>(`/api/media/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
      setDeleting(null)
      toast('File deleted')
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Delete failed', 'error'),
  })

  const copyUrl = async (item: MediaItem) => {
    try {
      await navigator.clipboard.writeText(item.url)
      toast('URL copied')
    } catch {
      toast('Could not copy URL', 'error')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Media</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          {data ? `${data.total} files` : ''} — uploaded directly to Cloudflare R2. Use images in articles, covers and social previews.
        </p>
      </div>

      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-stone-300 bg-white px-4 py-8 text-stone-500 transition-colors hover:border-accent-400 hover:text-accent-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400">
        <Icon name="upload" className="size-7" />
        <span className="text-sm font-semibold">Tap to upload from your phone or computer</span>
        <span className="text-xs text-stone-400 dark:text-stone-500">JPEG · PNG · WebP · AVIF · up to 10 MB · multiple files</span>
        <input
          type="file"
          multiple
          accept={ACCEPTED.join(',')}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) void handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </label>

      {uploads.length > 0 && (
        <ul className="mt-4 space-y-2">
          {uploads.map((u) => (
            <li key={u.name} className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-900">
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{u.name}</span>
              {u.error ? (
                <span className="text-xs font-semibold text-red-500">{u.error}</span>
              ) : (
                <div className="h-1.5 w-32 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800" role="progressbar" aria-valuenow={u.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Uploading ${u.name}`}>
                  <div className="h-full rounded-full bg-accent-500 transition-all" style={{ width: `${u.progress}%` }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {isLoading ? (
        <Spinner className="mx-auto mt-12" />
      ) : !data || data.items.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon="image" title="No images yet" description="Upload images and they will appear here for use in articles." />
        </div>
      ) : (
        <>
          <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.items.map((item) => (
              <li key={item.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
                <img src={item.url} alt={item.original_name} loading="lazy" className="aspect-square w-full object-cover" />
                <div className="space-y-1 border-t border-stone-100 p-3 dark:border-stone-800">
                  <p className="truncate text-xs font-semibold text-stone-700 dark:text-stone-300">{item.original_name}</p>
                  <p className="text-[11px] text-stone-400 dark:text-stone-500">
                    {formatBytes(item.size)} · {item.content_type.replace('image/', '').toUpperCase()}
                  </p>
                  <div className="flex items-center gap-1 pt-1">
                    <button type="button" onClick={() => copyUrl(item)} aria-label="Copy URL" className="flex size-8 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-white">
                      <Icon name="copy" className="size-4" />
                    </button>
                    <button type="button" onClick={() => setDeleting(item)} aria-label="Delete file" className="flex size-8 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40">
                      <Icon name="trash" className="size-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={page} totalPages={data.totalPages} onChange={setPage} className="mt-6" />
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete this file?"
        message={`"${deleting?.original_name ?? ''}" will be removed from storage. Articles that already use this image may show a broken image.`}
        confirmLabel="Delete file"
        busy={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  )
}
