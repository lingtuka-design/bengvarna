import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useBootstrap } from '../../lib/queries'
import { useLockBodyScroll } from '../../lib/utils'
import { Icon } from '../ui/Icon'
import { Logo } from './Logo'
import { SearchButton } from './SearchButton'
import { ThemeToggle } from './ThemeToggle'
import { SearchModal } from './SearchModal'

function NavLinks({ categories, onNavigate }: { categories: Array<{ slug: string; name: string }>; onNavigate?: () => void }) {
  return (
    <>
      <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: 'text-accent-600 dark:text-accent-400' }} onClick={onNavigate} className="text-sm font-semibold text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-300 dark:hover:text-white">
        Home
      </Link>
      <Link to="/news" search={{ page: 1 }} activeProps={{ className: 'text-accent-600 dark:text-accent-400' }} onClick={onNavigate} className="text-sm font-semibold text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-300 dark:hover:text-white">
        News
      </Link>
      {categories.map((c) => (
        <Link key={c.slug} to="/category/$slug" params={{ slug: c.slug }} search={{ page: 1 }} activeProps={{ className: 'text-accent-600 dark:text-accent-400' }} onClick={onNavigate} className="text-sm font-semibold text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-300 dark:hover:text-white">
          {c.name}
        </Link>
      ))}
      <Link to="/about" activeProps={{ className: 'text-accent-600 dark:text-accent-400' }} onClick={onNavigate} className="text-sm font-semibold text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-300 dark:hover:text-white">
        About
      </Link>
    </>
  )
}

export function Header() {
  const { data: bootstrap } = useBootstrap()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  useLockBodyScroll(menuOpen)
  const categories = bootstrap?.categories ?? []

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/85 backdrop-blur dark:border-stone-800/80 dark:bg-stone-950/85">
      <div className="hidden md:block">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-6 lg:px-8">
          <Link to="/" className="shrink-0">
            <Logo />
          </Link>
          <nav aria-label="Main navigation" className="flex items-center gap-5">
            <NavLinks categories={categories.slice(0, 4)} />
          </nav>
          <div className="flex shrink-0 items-center gap-1.5">
            <SearchButton onClick={() => setSearchOpen(true)} />
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen} className="inline-flex size-10 items-center justify-center rounded-full text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800">
            <Icon name="menu" className="size-5" />
          </button>
          <Link to="/" className="shrink-0">
            <Logo className="text-xl" />
          </Link>
          <div className="flex items-center gap-0.5">
            <SearchButton compact onClick={() => setSearchOpen(true)} />
            <ThemeToggle className="size-10" />
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-[70] md:hidden">
          <div className="fade-in absolute inset-0 bg-stone-950/60" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <div className="slide-from-left absolute inset-y-0 left-0 flex w-80 max-w-[85%] flex-col overflow-y-auto bg-white shadow-2xl dark:bg-stone-950">
            <div className="flex h-14 items-center justify-between border-b border-stone-200 px-4 dark:border-stone-800">
              <Logo className="text-xl" />
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="inline-flex size-10 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800">
                <Icon name="x" className="size-5" />
              </button>
            </div>
            <nav aria-label="Mobile navigation" className="flex flex-col gap-1 px-3 py-4">
              <NavLinks categories={categories} onNavigate={() => setMenuOpen(false)} />
            </nav>
            <div className="mt-auto border-t border-stone-200 px-4 py-4 dark:border-stone-800">
              <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">Categories</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link to="/category/$slug" params={{ slug: c.slug }} search={{ page: 1 }} onClick={() => setMenuOpen(false)} className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-700 dark:border-stone-800 dark:text-stone-300">
                      {c.color && <span className="size-2 rounded-full" style={{ backgroundColor: c.color }} aria-hidden="true" />}
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  )
}
