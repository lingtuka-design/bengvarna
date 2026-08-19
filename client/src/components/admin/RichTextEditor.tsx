import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { Icon, type IconName } from '../ui/Icon'
import { useToast } from '../ui/Toast'
import { MediaPickerModal } from './MediaPickerModal'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  className?: string
  minHeight?: string
}

interface ToolButtonProps {
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}

function ToolButton({ label, active, disabled, onClick, children }: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-stone-600 transition-colors hover:bg-stone-200/70 hover:text-stone-900 disabled:opacity-30 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-white',
        active && 'bg-stone-200 text-stone-900 dark:bg-stone-800 dark:text-white',
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span className="mx-1 h-6 w-px shrink-0 bg-stone-200 dark:bg-stone-700" aria-hidden="true" />
}

function getSelectedElement(): Element | null {
  const sel = document.getSelection()
  const node = sel?.anchorNode
  if (!node) return null
  return node.nodeType === 3 ? node.parentElement : (node as Element)
}

export function RichTextEditor({ value, onChange, className, minHeight = '18rem' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<Record<string, boolean>>({})
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [mediaOpen, setMediaOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    if (el.innerHTML !== value) {
      el.innerHTML = value || '<p><br></p>'
    }
  }, [value])

  useEffect(() => {
    try {
      document.execCommand('styleWithCSS', false, 'false')
    } catch {
      /* noop */
    }
  }, [])

  const refresh = useCallback(() => {
    const sel = document.getSelection()
    setActive({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      ul: document.queryCommandState('insertUnorderedList'),
      ol: document.queryCommandState('insertOrderedList'),
      quote: document.queryCommandValue('formatBlock') === 'blockquote',
      h2: document.queryCommandValue('formatBlock') === 'h2',
      h3: document.queryCommandValue('formatBlock') === 'h3',
      p: document.queryCommandValue('formatBlock') === 'p',
      left: document.queryCommandState('justifyLeft'),
      center: document.queryCommandState('justifyCenter'),
      right: document.queryCommandState('justifyRight'),
      undo: document.queryCommandEnabled('undo'),
      redo: document.queryCommandEnabled('redo'),
    })
    const figure = getSelectedElement()?.closest('figure') ?? null
    setActive((a) => ({ ...a, figure: Boolean(figure) }))
  }, [])

  useEffect(() => {
    document.addEventListener('selectionchange', refresh)
    return () => document.removeEventListener('selectionchange', refresh)
  }, [refresh])

  const handleInput = useCallback(() => {
    const el = editorRef.current
    if (!el) return
    if (!el.innerHTML || el.innerHTML === '<br>') el.innerHTML = '<p><br></p>'
    onChange(el.innerHTML)
    refresh()
  }, [onChange, refresh])

  const exec = useCallback(
    (command: string, val?: string) => {
      const el = editorRef.current
      if (!el) return
      el.focus()
      document.execCommand(command, false, val)
      handleInput()
    },
    [handleInput],
  )

  const insertFigure = useCallback(
    (url: string) => {
      const el = editorRef.current
      if (!el) return
      el.focus()
      const sel = document.getSelection()
      const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null
      if (!range) return
      const figure = document.createElement('figure')
      figure.className = 'editor-figure'
      const img = document.createElement('img')
      img.src = url
      img.alt = ''
      img.loading = 'lazy'
      const cap = document.createElement('figcaption')
      cap.className = 'editor-figcaption'
      cap.textContent = 'Caption'
      cap.contentEditable = 'true'
      cap.setAttribute('aria-label', 'Image caption')
      figure.append(img, cap)
      range.deleteContents()
      range.insertNode(figure)
      const p = document.createElement('p')
      p.innerHTML = '<br>'
      figure.after(p)
      const newRange = document.createRange()
      newRange.setStart(p, 0)
      newRange.collapse(true)
      sel?.removeAllRanges()
      sel?.addRange(newRange)
      handleInput()
    },
    [handleInput],
  )

  const toggleCaption = useCallback(() => {
    const figure = getSelectedElement()?.closest('figure') ?? null
    if (!figure) return
    let cap = figure.querySelector('figcaption') as HTMLElement | null
    if (!cap) {
      cap = document.createElement('figcaption')
      cap.className = 'editor-figcaption'
      cap.textContent = 'Caption'
      cap.contentEditable = 'true'
      figure.append(cap)
    }
    cap.focus()
    const range = document.createRange()
    range.selectNodeContents(cap)
    const s = document.getSelection()
    s?.removeAllRanges()
    s?.addRange(range)
  }, [])

  const openLink = useCallback(() => {
    const sel = document.getSelection()
    const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null
    if (!range || range.collapsed) {
      toast('Select some text first, then add a link', 'info')
      return
    }
    const anchor = getSelectedElement()?.closest('a') ?? null
    setLinkUrl((anchor as HTMLAnchorElement | null)?.getAttribute('href') ?? '')
    setLinkOpen(true)
  }, [toast])

  const applyLink = useCallback(() => {
    const url = linkUrl.trim()
    if (!/^https?:\/\//.test(url)) {
      toast('Enter a valid URL starting with http:// or https://', 'error')
      return
    }
    exec('createLink', url)
    setLinkOpen(false)
  }, [linkUrl, exec, toast])

  const handleFocusOut = useCallback(
    (e: React.FocusEvent) => {
      const target = e.target as HTMLElement
      const cap = target.closest?.('figcaption')
      if (cap && !cap.textContent?.trim()) cap.remove()
      refresh()
      handleInput()
    },
    [refresh, handleInput],
  )

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900', className)}>
      <div
        role="toolbar"
        aria-label="Formatting tools"
        className="flex items-center gap-0.5 overflow-x-auto border-b border-stone-200 bg-stone-50 px-2 py-1.5 dark:border-stone-800 dark:bg-stone-900"
      >
        <ToolButton label="Bold" active={active.bold} onClick={() => exec('bold')}>
          <span className="font-bold">B</span>
        </ToolButton>
        <ToolButton label="Italic" active={active.italic} onClick={() => exec('italic')}>
          <span className="italic">I</span>
        </ToolButton>
        <ToolButton label="Underline" active={active.underline} onClick={() => exec('underline')}>
          <span className="underline">U</span>
        </ToolButton>
        <Divider />
        <ToolButton label="Heading 2" active={active.h2} onClick={() => exec('formatBlock', 'h2')}>
          <span className="font-display text-sm font-semibold">H2</span>
        </ToolButton>
        <ToolButton label="Heading 3" active={active.h3} onClick={() => exec('formatBlock', 'h3')}>
          <span className="font-display text-sm font-semibold">H3</span>
        </ToolButton>
        <ToolButton label="Paragraph" active={active.p} onClick={() => exec('formatBlock', 'p')}>
          <span>¶</span>
        </ToolButton>
        <ToolButton label="Blockquote" active={active.quote} onClick={() => exec('formatBlock', 'blockquote')}>
          <Icon name="quote" className="size-4" />
        </ToolButton>
        <Divider />
        <ToolButton label="Bulleted list" active={active.ul} onClick={() => exec('insertUnorderedList')}>
          <span className="text-xs">•≔</span>
        </ToolButton>
        <ToolButton label="Numbered list" active={active.ol} onClick={() => exec('insertOrderedList')}>
          <span className="text-xs">1.</span>
        </ToolButton>
        <Divider />
        <ToolButton label="Align left" active={active.left} onClick={() => exec('justifyLeft')}>
          <Icon name="align-left" className="size-4" />
        </ToolButton>
        <ToolButton label="Align center" active={active.center} onClick={() => exec('justifyCenter')}>
          <Icon name="align-center" className="size-4" />
        </ToolButton>
        <ToolButton label="Align right" active={active.right} onClick={() => exec('justifyRight')}>
          <Icon name="align-right" className="size-4" />
        </ToolButton>
        <Divider />
        <ToolButton label="Insert image" onClick={() => setMediaOpen(true)}>
          <Icon name="image" className="size-4" />
        </ToolButton>
        <ToolButton label="Add caption to image" active={active.figure} disabled={!active.figure} onClick={toggleCaption}>
          <span className="text-xs">✎</span>
        </ToolButton>
        <ToolButton label="Insert link" onClick={openLink}>
          <Icon name="link" className="size-4" />
        </ToolButton>
        <ToolButton label="Horizontal rule" onClick={() => exec('insertHorizontalRule')}>
          <Icon name="minus" className="size-4" />
        </ToolButton>
        <Divider />
        <ToolButton label="Undo" disabled={!active.undo} onClick={() => exec('undo')}>
          <Icon name="undo" className="size-4" />
        </ToolButton>
        <ToolButton label="Redo" disabled={!active.redo} onClick={() => exec('redo')}>
          <Icon name="redo" className="size-4" />
        </ToolButton>
      </div>

      {linkOpen && (
        <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 bg-stone-50 px-3 py-2 dark:border-stone-800 dark:bg-stone-900">
          <Icon name="link" className="size-4 shrink-0 text-stone-500" />
          <input
            autoFocus
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                applyLink()
              }
              if (e.key === 'Escape') setLinkOpen(false)
            }}
            placeholder="https://…"
            aria-label="Link URL"
            className="h-9 min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-2.5 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/25 dark:border-stone-700 dark:bg-stone-800"
          />
          <button type="button" onClick={applyLink} className="h-9 rounded-lg bg-accent-600 px-3 text-sm font-semibold text-white hover:bg-accent-500">
            Apply
          </button>
          <button type="button" onClick={() => { exec('unlink'); setLinkOpen(false) }} className="h-9 rounded-lg border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200">
            Remove
          </button>
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Article content"
        data-placeholder="Write your story…"
        className="editor-content w-full px-4 py-4 outline-none sm:px-6"
        style={{ minHeight }}
        onInput={handleInput}
        onKeyUp={refresh}
        onMouseUp={refresh}
        onBlurCapture={handleFocusOut}
      />

      <MediaPickerModal
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={(url) => {
          insertFigure(url)
          setMediaOpen(false)
        }}
      />
    </div>
  )
}
