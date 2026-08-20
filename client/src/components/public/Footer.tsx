import { Link } from '@tanstack/react-router'
import { useBootstrap } from '../../lib/queries'
import { Logo } from './Logo'

export function Footer() {
  const { data: bootstrap } = useBootstrap()
  const categories = (bootstrap?.categories ?? []).filter((c) => c.slug.toLowerCase() !== 'news')

  return (
    <footer className="mt-16 border-t border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-stone-500 dark:text-stone-400">
            {bootstrap?.settings.site_description ?? 'Fast to read. Fast to publish. Beautiful everywhere.'}
          </p>
        </div>
        <nav aria-label="Categories">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">Categories</h2>
          <ul className="mt-4 space-y-2.5">
            {categories.slice(0, 6).map((c) => (
              <li key={c.id}>
                <Link to="/category/$slug" params={{ slug: c.slug }} search={{ page: 1 }} className="text-sm text-stone-600 transition-colors hover:text-accent-600 dark:text-stone-300 dark:hover:text-accent-400">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Company">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">Company</h2>
          <ul className="mt-4 space-y-2.5">
            <li>
              <Link to="/news" search={{ page: 1 }} className="text-sm text-stone-600 transition-colors hover:text-accent-600 dark:text-stone-300 dark:hover:text-accent-400">
                All news
              </Link>
            </li>
            <li>
              <Link to="/about" className="text-sm text-stone-600 transition-colors hover:text-accent-600 dark:text-stone-300 dark:hover:text-accent-400">
                About bengvarna
              </Link>
            </li>
            <li>
              <Link to="/search" search={{ q: '', page: 1 }} className="text-sm text-stone-600 transition-colors hover:text-accent-600 dark:text-stone-300 dark:hover:text-accent-400">
                Search
              </Link>
            </li>
          </ul>
        </nav>
        <div className="space-y-3 text-sm text-stone-500 dark:text-stone-400">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">About</h2>
          <p className="max-w-xs leading-relaxed">
            bengvarna is an independent digital news platform designed for fast reading and beautiful storytelling on every screen.
          </p>
        </div>
      </div>
      <div className="border-t border-stone-200 py-6 dark:border-stone-800">
        <p className="px-4 text-center text-xs text-stone-400 dark:text-stone-500">
          © {new Date().getFullYear()} bengvarna. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
