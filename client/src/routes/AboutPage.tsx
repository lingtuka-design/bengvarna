import { Link } from '@tanstack/react-router'
import { useBootstrap } from '../lib/queries'
import { Seo } from '../lib/seo'
import { Logo } from '../components/public/Logo'

export function AboutPage() {
  const { data: bootstrap } = useBootstrap()
  const settings = bootstrap?.settings

  return (
    <>
      <Seo title={`About — ${settings?.site_name ?? 'bengvarna'}`} description={settings?.site_description} />
      <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-10 sm:px-6 md:pt-16">
        <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
          About <Logo className="text-4xl md:text-5xl" withDot={false} />
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-stone-600 dark:text-stone-300">
          {settings?.site_description ?? 'Fast to read. Fast to publish. Beautiful everywhere.'}
        </p>
        <div className="article-body mt-8">
          <p>
            bengvarna is an independent digital news platform built for the way people actually read today — quickly on a phone, deeply on a laptop, comfortably in the dark.
          </p>
          <h2>Fast to read</h2>
          <p>
            Every page is engineered for speed: no tracking clutter, no autoplay noise, no pop-ups interrupting the paragraph you were about to finish. Just clear typography, generous whitespace and stories that load in the time it takes to blink.
          </p>
          <h2>Fast to publish</h2>
          <p>
            Our editorial tools are designed for journalists on the move. The entire publishing workflow — write, upload, publish — fits on a phone, with autosaving drafts, a fast image pipeline and a clean rich text editor.
          </p>
          <h2>Beautiful everywhere</h2>
          <p>
            From a 6-inch screen on a crowded train to a 27-inch display at midnight, the same story should feel considered. bengvarna adapts its layout, not just its size, at every breakpoint.
          </p>
          <blockquote>Good journalism deserves good design. Good design respects the reader. That is the whole philosophy.</blockquote>
          <p>
            Questions, corrections or story tips? We would love to hear from you. Reach out through any of the channels in the footer, or simply read on — the best conversation starts with a story.
          </p>
          <h2>More</h2>
          <ul>
            <li>
              <Link to="/news" search={{ page: 1 }} className="text-accent-600 underline dark:text-accent-400">Browse all news</Link>
            </li>
            <li>
              <Link to="/search" search={{ q: '', page: 1 }} className="text-accent-600 underline dark:text-accent-400">Search the archive</Link>
            </li>
          </ul>
        </div>
      </div>
    </>
  )
}
