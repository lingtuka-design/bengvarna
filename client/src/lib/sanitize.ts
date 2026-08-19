import DOMPurify from 'dompurify'

const ALLOWED_TAGS = [
  'p', 'br', 'h2', 'h3', 'h4',
  'strong', 'b', 'em', 'i', 'u',
  'a', 'blockquote', 'ul', 'ol', 'li',
  'img', 'figure', 'figcaption', 'hr', 'span',
]

let configured = false

function configure() {
  if (configured) return
  configured = true
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank')
      node.setAttribute('rel', 'noopener noreferrer')
      const href = node.getAttribute('href') || ''
      if (!/^https?:\/\//i.test(href)) node.removeAttribute('href')
    }
    if (node.tagName === 'IMG') {
      const src = node.getAttribute('src') || ''
      if (!/^(https?:\/\/|\/)/i.test(src)) node.removeAttribute('src')
      if (!node.hasAttribute('alt')) node.setAttribute('alt', '')
    }
    if (node.hasAttribute('style')) {
      const style = node.getAttribute('style') || ''
      const match = style.match(/text-align:\s*(left|right|center|justify)/i)
      if (match) node.setAttribute('style', `text-align: ${match[1]!.toLowerCase()}`)
      else node.removeAttribute('style')
    }
  })
}

export function sanitizeArticleHtml(html: string): string {
  configure()
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'style', 'loading', 'decoding'],
  })
}
