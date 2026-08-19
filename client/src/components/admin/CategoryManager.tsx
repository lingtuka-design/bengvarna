import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useCategories } from '../../lib/queries'
import { slugify } from '../../lib/utils'
import type { Category } from '../../lib/types'
import { Button } from '../ui/Button'
import { Input, Textarea } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { Icon } from '../ui/Icon'
import { Spinner } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'
import { useToast } from '../ui/Toast'

const PALETTE = ['#cc3f3f', '#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777', '#0d9488', '#4f46e5']

interface CategoryFormState {
  name: string
  slug: string
  description: string
  color: string
  is_active: boolean
}

function emptyForm(): CategoryFormState {
  return { name: '', slug: '', description: '', color: PALETTE[0]!, is_active: true }
}

function toForm(c: Category): CategoryFormState {
  return { name: c.name, slug: c.slug, description: c.description, color: c.color, is_active: Boolean(c.is_active) }
}

export function CategoryManager() {
  const { data: categories, isLoading } = useCategories(true)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [editing, setEditing] = useState<Category | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<CategoryFormState>(emptyForm())
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] })
    queryClient.invalidateQueries({ queryKey: ['bootstrap'] })
    queryClient.invalidateQueries({ queryKey: ['articles'] })
  }

  const openCreate = () => {
    setForm(emptyForm())
    setCreating(true)
  }

  const openEdit = (c: Category) => {
    setForm(toForm(c))
    setEditing(c)
  }

  const saveMutation = useMutation({
    mutationFn: (body: CategoryFormState & { sort_order?: number }) =>
      editing ? api.put<Category>(`/api/categories/${editing.id}`, body) : api.post<Category>('/api/categories', body),
    onSuccess: () => {
      invalidate()
      setCreating(false)
      setEditing(null)
      toast('Category saved')
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Failed to save category', 'error'),
  })

  const move = useMutation({
    mutationFn: ({ id, sortOrder }: { id: number; sortOrder: number }) =>
      api.put<Category>(`/api/categories/${id}`, { sort_order: sortOrder }),
    onSuccess: () => invalidate(),
    onError: (e) => toast(e instanceof Error ? e.message : 'Reorder failed', 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.del<{ ok: boolean }>(`/api/categories/${id}`),
    onSuccess: () => {
      invalidate()
      setConfirmDelete(false)
      toast('Category deleted')
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Delete failed', 'error'),
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast('Name is required', 'error')
      return
    }
    saveMutation.mutate({ ...form, slug: form.slug || slugify(form.name) })
  }

  const list = categories ?? []
  const sorted = [...list].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Categories</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{list.length} categories</p>
        </div>
        <Button onClick={openCreate}>
          <Icon name="plus" className="size-4" />
          New category
        </Button>
      </div>

      {isLoading ? (
        <Spinner className="mx-auto mt-12" />
      ) : sorted.length === 0 ? (
        <EmptyState icon="tag" title="No categories yet" description="Create a category to organize your articles." action={{ label: 'Create category', onClick: openCreate }} />
      ) : (
        <ul className="space-y-3">
          {sorted.map((c, i) => (
            <li key={c.id} className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
              <div className="flex items-center gap-3">
                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    onClick={() => move.mutate({ id: c.id, sortOrder: (sorted[i - 1]?.sort_order ?? c.sort_order) })}
                    disabled={i === 0 || move.isPending}
                    aria-label={`Move ${c.name} up`}
                    className="flex size-7 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 disabled:opacity-30 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                  >
                    <Icon name="arrow-up" className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move.mutate({ id: c.id, sortOrder: (sorted[i + 1]?.sort_order ?? c.sort_order) })}
                    disabled={i === sorted.length - 1 || move.isPending}
                    aria-label={`Move ${c.name} down`}
                    className="flex size-7 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 disabled:opacity-30 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                  >
                    <Icon name="arrow-down" className="size-4" />
                  </button>
                </div>
                <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: c.color || '#d4d4d4' }} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-stone-800 dark:text-stone-200">{c.name}</h2>
                    <span className="text-xs text-stone-400 dark:text-stone-500">/{c.slug}</span>
                    {!c.is_active && (
                      <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                        Inactive
                      </span>
                    )}
                  </div>
                  {c.description && <p className="mt-0.5 line-clamp-1 text-sm text-stone-500 dark:text-stone-400">{c.description}</p>}
                </div>
                <span className="hidden shrink-0 text-xs text-stone-400 sm:block dark:text-stone-500">{c.article_count ?? 0} articles</span>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => saveMutation.mutate({ ...toForm(c), is_active: !c.is_active })}
                    disabled={saveMutation.isPending}
                    className={c.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400 dark:text-stone-500'}
                  >
                    <Icon name="check" className="size-4" />
                    {c.is_active ? 'Active' : 'Activate'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(c)} aria-label={`Edit ${c.name}`}>
                    <Icon name="pencil" className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500 dark:text-red-400"
                    onClick={() => {
                      setDeleting(c)
                      setConfirmDelete(true)
                    }}
                    aria-label={`Delete ${c.name}`}
                  >
                    <Icon name="trash" className="size-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={creating || editing !== null}
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
        labelledBy="category-form-title"
      >
        <form onSubmit={submit} className="p-6">
          <h2 id="category-form-title" className="pr-10 font-display text-xl font-semibold">
            {editing ? `Edit “${editing.name}”` : 'New category'}
          </h2>
          <div className="mt-5 space-y-4">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Technology"
              autoFocus
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  label="Slug"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                  placeholder="auto-generated"
                />
              </div>
              <div className="self-end pb-0.5">
                <Button type="button" variant="outline" onClick={() => setForm((f) => ({ ...f, slug: slugify(f.name) }))}>
                  Auto
                </Button>
              </div>
            </div>
            <Textarea label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Shown on the category page" />
            <fieldset>
              <legend className="mb-1.5 text-sm font-semibold text-stone-700 dark:text-stone-300">Color</legend>
              <div className="flex flex-wrap gap-2">
                {PALETTE.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, color }))}
                    aria-label={`Use color ${color}`}
                    aria-pressed={form.color === color}
                    className={form.color === color ? 'size-8 rounded-full ring-2 ring-accent-500 ring-offset-2 dark:ring-offset-stone-900' : 'size-8 rounded-full ring-1 ring-stone-300 dark:ring-stone-700'}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: '' }))}
                  aria-pressed={form.color === ''}
                  className={form.color === '' ? 'flex size-8 items-center justify-center rounded-full ring-2 ring-accent-500 ring-offset-2 dark:ring-offset-stone-900' : 'flex size-8 items-center justify-center rounded-full ring-1 ring-stone-300 dark:ring-stone-700'}
                  aria-label="No color"
                >
                  <Icon name="x" className="size-4 text-stone-400" />
                </button>
              </div>
            </fieldset>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="size-4 accent-[--color-accent-600]" />
              Active (visible on the public site)
            </label>
          </div>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setCreating(false)
                setEditing(null)
              }}
              disabled={saveMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : 'Save category'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Delete “${deleting?.name ?? ''}”?`}
        message="Articles in this category will be kept but marked uncategorized."
        confirmLabel="Delete category"
        busy={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  )
}
