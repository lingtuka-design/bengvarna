import { Link } from '@tanstack/react-router'
import { Seo } from '../lib/seo'

export function NotFoundPage() {
  return (
    <>
      <Seo title="Page not found — bengvarna" />
      <div className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
        <p className="font-display text-7xl font-semibold tracking-tight text-stone-200 dark:text-stone-800">404</p>
        <h1 className="mt-4 font-display text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-stone-500 dark:text-stone-400">
          The page you are looking for does not exist or has moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-accent-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-500"
          >
            Back to home
          </Link>
          <Link
            to="/news"
            search={{ page: 1 }}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            Browse all news
          </Link>
        </div>
      </div>
    </>
  )
}
