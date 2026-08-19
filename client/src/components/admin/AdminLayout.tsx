import { useState } from 'react'
import { Link, Navigate, Outlet, useRouterState } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '../../lib/queries'
import { api } from '../../lib/api'
import { router } from '../../router'
import { cn } from '../../lib/utils'
import { Icon, type IconName } from '../ui/Icon'
import { FullScreenLoader } from '../ui/Skeleton'
import { ThemeToggle } from '../public/ThemeToggle'
import { Logo } from '../public/Logo'

interface NavItem {
  to: string
  label: string
  icon: IconName
  exact?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/admin/articles', label: 'Articles', icon: 'file' },
  { to: '/admin/categories', label: 'Categories', icon: 'tag' },
  { to: '/admin/featured', label: 'Featured', icon: 'star' },
  { to: '/admin/media', label: 'Media', icon: 'image' },
  { to: '/admin/settings', label: 'Settings', icon: 'sliders' },
]

function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.to
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

export function AdminLayout() {
  const { data: session, isLoading } = useSession()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const queryClient = useQueryClient()

  const logout = useMutation({
    mutationFn: () => api.post<{ ok: boolean }>('/api/auth/logout'),
    onSuccess: () => {
      queryClient.setQueryData(['session'], { authenticated: false })
      queryClient.clear()
      router.navigate({ to: '/admin/login', search: { redirect: '/admin/dashboard' } })
    },
    onError: () => {
      queryClient.setQueryData(['session'], { authenticated: false })
      router.navigate({ to: '/admin/login', search: { redirect: '/admin/dashboard' } })
    },
  })

  if (isLoading) return <FullScreenLoader />
  if (!session?.authenticated) {
    return <Navigate to="/admin/login" search={{ redirect: pathname }} replace />
  }

  const drawerLinks = (
    <nav aria-label="Admin" className="flex flex-col gap-0.5">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={() => setDrawerOpen(false)}
          className={cn(
            'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors',
            isActive(pathname, item)
              ? 'bg-accent-600 text-white dark:bg-accent-500'
              : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-white',
          )}
        >
          <Icon name={item.icon} className="size-5 shrink-0" />
          {item.label}
        </Link>
      ))}
    </nav>
  )

  const drawerFooter = (
    <div className="space-y-1 border-t border-stone-200 pt-3 dark:border-stone-800">
      <Link
        to="/"
        className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-white"
      >
        <Icon name="external" className="size-5 shrink-0" />
        View site
      </Link>
      <button
        type="button"
        onClick={() => logout.mutate()}
        className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
      >
        <Icon name="logout" className="size-5 shrink-0" />
        Sign out
      </button>
    </div>
  )

  return (
    <div className="min-h-dvh bg-stone-100 dark:bg-stone-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-stone-200 bg-white px-3 py-5 dark:border-stone-800 dark:bg-stone-950 lg:flex">
        <Link to="/admin/dashboard" className="px-3">
          <Logo className="text-xl" />
          <span className="mt-1 inline-block rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:bg-stone-800 dark:text-stone-400">
            Admin
          </span>
        </Link>
        <div className="mt-6 flex-1">{drawerLinks}</div>
        <div className="mt-4 flex items-center justify-between px-3">
          <span className="truncate text-xs font-semibold text-stone-400 dark:text-stone-500">{session.username}</span>
          <ThemeToggle className="size-9" />
        </div>
        <div className="mt-2">{drawerFooter}</div>
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-stone-200 bg-white/90 px-4 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90 lg:hidden">
        <Link to="/admin/dashboard" className="flex items-center gap-2">
          <Logo className="text-lg" />
          <span className="rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-700 dark:bg-accent-900/40 dark:text-accent-300">
            Admin
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle className="size-9" />
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open admin menu"
            aria-expanded={drawerOpen}
            className="inline-flex size-10 items-center justify-center rounded-full text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            <Icon name="menu" className="size-5" />
          </button>
        </div>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="fade-in absolute inset-0 bg-stone-950/60" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <div className="slide-from-left absolute inset-y-0 left-0 flex w-80 max-w-[85%] flex-col overflow-y-auto bg-white px-3 py-5 shadow-2xl dark:bg-stone-950">
            <div className="flex items-center justify-between px-3">
              <Logo className="text-lg" />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close admin menu"
                className="inline-flex size-9 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <Icon name="x" className="size-5" />
              </button>
            </div>
            <div className="mt-5 flex-1">{drawerLinks}</div>
            {drawerFooter}
          </div>
        </div>
      )}

      <main className="px-4 pb-12 pt-6 sm:px-6 lg:ml-60 lg:px-10 lg:pb-16 lg:pt-10">
        <div className="mx-auto w-full max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
