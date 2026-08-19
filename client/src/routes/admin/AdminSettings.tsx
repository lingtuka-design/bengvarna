import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useSettings } from '../../lib/queries'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { ImageUploader } from '../../components/admin/ImageUploader'
import { Spinner } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import type { SiteSettings } from '../../lib/types'

const EMPTY: SiteSettings = {
  site_name: '',
  site_description: '',
  logo_url: '',
  default_social_image: '',
  default_seo_title: '',
  default_seo_description: '',
}

export function AdminSettings() {
  const { data, isLoading } = useSettings()
  const [form, setForm] = useState<SiteSettings>(EMPTY)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (data) setForm({ ...EMPTY, ...data })
  }, [data])

  const saveMutation = useMutation({
    mutationFn: (body: SiteSettings) => api.put<SiteSettings>('/api/settings', body),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      queryClient.invalidateQueries({ queryKey: ['bootstrap'] })
      toast('Settings saved')
      setForm(saved)
    },
    onError: (e) => toast(e instanceof Error ? e.message : 'Failed to save settings', 'error'),
  })

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  if (isLoading) return <Spinner className="mx-auto mt-12" />

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Site settings</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">These values are used across the public site, SEO and social previews.</p>
      </div>

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault()
          saveMutation.mutate(form)
        }}
      >
        <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900 sm:p-6">
          <h2 className="font-display text-lg font-semibold">Identity</h2>
          <Input label="Site name" value={form.site_name} onChange={(e) => set('site_name', e.target.value)} />
          <Input label="Site description" value={form.site_description} onChange={(e) => set('site_description', e.target.value)} hint="Used in the footer and about page." />
          <ImageUploader label="Logo" value={form.logo_url} onChange={(url) => set('logo_url', url)} hint="Optional. Not currently rendered in the header." />
        </section>

        <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900 sm:p-6">
          <h2 className="font-display text-lg font-semibold">SEO &amp; social</h2>
          <Input label="Default SEO title" value={form.default_seo_title} onChange={(e) => set('default_seo_title', e.target.value)} maxLength={200} />
          <Input label="Default SEO description" value={form.default_seo_description} onChange={(e) => set('default_seo_description', e.target.value)} maxLength={300} />
          <ImageUploader
            label="Default social image"
            value={form.default_social_image}
            onChange={(url) => set('default_social_image', url)}
            hint="Used when an article has no cover image. 1200×630 works best."
          />
        </section>

        <div className="flex justify-end">
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving…' : 'Save settings'}
          </Button>
        </div>
      </form>

      <section className="mt-10 rounded-2xl border border-stone-200 bg-white p-5 text-sm leading-relaxed text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
        <h2 className="font-display text-lg font-semibold text-stone-800 dark:text-stone-100">Server configuration</h2>
        <p className="mt-2">
          Admin credentials and session security are configured on the server via environment variables and Cloudflare secrets.
          See <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs dark:bg-stone-800">README.md</code> for the full list, and change the
          default <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs dark:bg-stone-800">admin / admin1234</code> password before going live.
        </p>
      </section>
    </div>
  )
}
