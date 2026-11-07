'use client'

import { useEffect, useRef, useState } from 'react'
import type { Highlighter } from 'shiki'
import { getLanguage } from '../../lib/format'
import { highlightCode, plainCodeHtml } from '../../lib/shiki'
import type { ThemeMode } from '../../lib/types'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
  theme: ThemeMode
  highlighter: Highlighter | null
  placeholder?: string
}

export function CodeEditor({
  value,
  onChange,
  language,
  theme,
  highlighter,
  placeholder = 'Write or paste your snippet here...',
}: CodeEditorProps) {
  const highlightRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [html, setHtml] = useState(() => plainCodeHtml(value))

  useEffect(() => {
    // Highlight synchronously: highlightCode() is sync once the highlighter
    // is loaded, so this keeps the colored layer in lockstep with typing.
    // A debounce here makes the highlight layer show stale lines mid-edit.
    setHtml(highlightCode(highlighter, value, language, theme))
  }, [value, language, theme, highlighter])

  const syncScroll = (event: React.UIEvent<HTMLTextAreaElement>) => {
    if (!highlightRef.current) return
    highlightRef.current.scrollTop = event.currentTarget.scrollTop
    highlightRef.current.scrollLeft = event.currentTarget.scrollLeft
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Tab') return

    event.preventDefault()
    const textarea = event.currentTarget
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const nextValue = `${value.slice(0, start)}  ${value.slice(end)}`

    onChange(nextValue)
    window.requestAnimationFrame(() => {
      textarea.selectionStart = start + 2
      textarea.selectionEnd = start + 2
    })
  }

  const languageMeta = getLanguage(language)

  return (
    <div className="editor-body">
      <div
        ref={highlightRef}
        className="editor-highlight code-lines"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <span
        className="editor-watermark"
        style={{ '--lang-color': `var(${languageMeta.colorVar})` } as React.CSSProperties}
      >
        {languageMeta.short}
      </span>

      <textarea
        ref={textareaRef}
        className="editor-textarea"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onScroll={syncScroll}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        spellCheck={false}
        wrap="off"
        aria-label="Snippet code"
      />
    </div>
  )
}
