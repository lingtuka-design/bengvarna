import { useMemo } from 'react'
import { sanitizeArticleHtml } from '../../lib/sanitize'

export function ArticleContent({ html }: { html: string }) {
  const clean = useMemo(() => sanitizeArticleHtml(html), [html])
  return <div className="article-body" dangerouslySetInnerHTML={{ __html: clean }} />
}
