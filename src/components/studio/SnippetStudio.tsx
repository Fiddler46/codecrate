'use client'

import { useEffect, useRef, useState } from 'react'
import type { Highlighter } from 'shiki'
import { LANGUAGES, LANGUAGE_MAP, TAG_SUGGESTIONS } from '../../lib/constants'
import { buildFilename } from '../../lib/format'
import type { Crate, Snippet, SnippetDraft, ThemeMode } from '../../lib/types'
import { Icon } from '../ui/Icon'
import { TagInput } from '../ui/TagInput'
import { CodeEditor } from '../ui/CodeEditor'

interface SnippetStudioProps {
  mode: 'create' | 'edit'
  snippet: Snippet | null
  crates: Crate[]
  initialCrateId: string
  initialDescription: string
  highlighter: Highlighter | null
  theme: ThemeMode
  saving: boolean
  onClose: () => void
  onSubmit: (draft: SnippetDraft) => void
  onDelete?: () => void
  onNotify: (tone: 'success' | 'error' | 'info', message: string) => void
}

export function SnippetStudio({
  mode,
  snippet,
  crates,
  initialCrateId,
  initialDescription,
  highlighter,
  theme,
  saving,
  onClose,
  onSubmit,
  onDelete,
  onNotify,
}: SnippetStudioProps) {
  const [title, setTitle] = useState(snippet?.title ?? '')
  const [language, setLanguage] = useState(() =>
    snippet && LANGUAGE_MAP[snippet.language] ? snippet.language : 'javascript'
  )
  const [crateId, setCrateId] = useState(initialCrateId)
  const [tags, setTags] = useState<string[]>(snippet?.tags ?? [])
  const [content, setContent] = useState(snippet?.content ?? '')
  const [description, setDescription] = useState(initialDescription)
  const [copied, setCopied] = useState(false)
  const [formatted, setFormatted] = useState(false)

  const formRef = useRef<HTMLFormElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  const lineCount = content ? content.split('\n').length : 1
  const canSave = title.trim().length > 0 && content.trim().length > 0 && !saving

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusTimer = window.setTimeout(() => titleRef.current?.focus(), 60)

    return () => {
      document.body.style.overflow = previousOverflow
      window.clearTimeout(focusTimer)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) {
        event.preventDefault()
        onClose()
        return
      }

      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault()
        formRef.current?.requestSubmit()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, saving])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSave) return

    onSubmit({
      title: title.trim(),
      language,
      tags,
      content,
      crateId,
      description: description.trim(),
    })
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      onNotify('error', 'Clipboard access was blocked by your browser.')
    }
  }

  const handleFormat = () => {
    let next = content.replace(/[ \t]+$/gm, '').replace(/\r\n?/g, '\n')

    if (language === 'json') {
      try {
        next = JSON.stringify(JSON.parse(next), null, 2)
      } catch {
        // Invalid JSON is left as-is; formatting is best-effort.
      }
    }

    if (next && !next.endsWith('\n')) next += '\n'
    setContent(next)
    setFormatted(true)
    window.setTimeout(() => setFormatted(false), 900)
  }

  const handleBackdrop = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !saving) onClose()
  }

  return (
    <div className="modal-backdrop" onMouseDown={handleBackdrop}>
      <section
        className="studio"
        role="dialog"
        aria-modal="true"
        aria-labelledby="studio-title"
      >
        <div className="studio-accent" />

        <header className="studio-head">
          <div className="studio-title">
            <span className="studio-title-icon">
              <Icon name="code" size={17} />
            </span>
            <h2 id="studio-title">
              {mode === 'edit' ? (
                <>Edit Snippet: <span>{title || snippet?.title || 'Untitled'}</span></>
              ) : (
                <>New Snippet: <span>Untitled crate</span></>
              )}
            </h2>
          </div>

          <button
            type="button"
            className="btn-icon studio-close"
            onClick={onClose}
            aria-label="Close snippet studio"
            disabled={saving}
          >
            <Icon name="x" size={18} />
          </button>
        </header>

        <form className="studio-form" ref={formRef} onSubmit={handleSubmit}>
          <div className="studio-deck">
            <div className="studio-field span-7">
              <label className="field-label" htmlFor="snippet-title">
                <span className="field-dot is-amber" />
                Snippet title
              </label>
              <div className="input-icon-wrap">
                <input
                  ref={titleRef}
                  id="snippet-title"
                  className="field-input"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g., Quick Axios retry wrapper"
                  maxLength={160}
                  required
                />
                <Icon name="pencil" size={14} className="input-icon" />
              </div>
            </div>

            <div className="studio-field span-5">
              <label className="field-label" htmlFor="snippet-language">
                <span className="field-dot is-cyan" />
                Language engine
              </label>
              <div className="studio-select-wrap">
                <select
                  id="snippet-language"
                  className="field-select"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                >
                  {LANGUAGES.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label} (.{option.extension})
                    </option>
                  ))}
                </select>
                <Icon name="chevronDown" size={14} className="select-chevron" />
              </div>
            </div>

            <div className="studio-field span-5">
              <label className="field-label" htmlFor="snippet-crate">
                <span className="field-dot is-emerald" />
                Assigned crate vault
              </label>
              <div className="studio-select-wrap">
                <select
                  id="snippet-crate"
                  className="field-select"
                  value={crateId}
                  onChange={(event) => setCrateId(event.target.value)}
                >
                  {crates.map((crate) => (
                    <option key={crate.id} value={crate.id}>
                      {crate.name}
                    </option>
                  ))}
                </select>
                <Icon name="chevronDown" size={14} className="select-chevron" />
              </div>
            </div>

            <div className="studio-field span-7">
              <div className="studio-field-row">
                <span className="field-label">
                  <span className="field-dot is-amber" />
                  Tags & descriptors
                </span>
                <span className="studio-hint">Press Enter or comma</span>
              </div>
              <TagInput value={tags} onChange={setTags} suggestions={TAG_SUGGESTIONS} />
            </div>
          </div>

          <div className="editor-chamber">
            <div className="editor-toolbar">
              <div className="editor-toolbar-left">
                <span className="editor-tab">
                  <Icon name="code" size={11} />
                  {buildFilename(title || 'untitled', language)}
                </span>
                <span className="editor-encoding">UTF-8 · LF</span>
              </div>

              <div className="editor-toolbar-right">
                <span className="editor-lines-badge">
                  <Icon name="circleCheck" size={11} />
                  {lineCount} {lineCount === 1 ? 'Line' : 'Lines'}
                </span>

                <button
                  type="button"
                  className={`editor-tool ${formatted ? 'is-success' : ''}`}
                  onClick={handleFormat}
                  title="Trim whitespace and format JSON when applicable"
                >
                  <Icon name="sparkles" size={12} />
                  <span>Format</span>
                </button>

                <button
                  type="button"
                  className={`editor-tool ${copied ? 'is-success' : ''}`}
                  onClick={handleCopy}
                  title="Copy code to clipboard"
                >
                  <Icon name={copied ? 'check' : 'copy'} size={12} />
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <CodeEditor
              value={content}
              onChange={setContent}
              language={language}
              theme={theme}
              highlighter={highlighter}
            />
          </div>

          <div className="studio-field studio-notes">
            <div className="studio-field-row">
              <label className="field-label" htmlFor="snippet-notes">
                <Icon name="document" size={13} />
                Documentation & context notes
              </label>
              <span className="studio-hint">Markdown supported</span>
            </div>
            <textarea
              id="snippet-notes"
              className="field-textarea"
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add usage details, environment notes, or context for future you..."
            />
          </div>

          <footer className="studio-footer">
            <div className="studio-footer-left">
              {mode === 'edit' && onDelete && (
                <button type="button" className="btn btn-danger btn-sm" onClick={onDelete} disabled={saving}>
                  <Icon name="trash" size={14} />
                  Delete snippet
                </button>
              )}

              <span className="studio-shortcut">
                <kbd className="kbd">⌘</kbd>
                <span>+</span>
                <kbd className="kbd">↵</kbd>
                <span>to quick-save</span>
              </span>
            </div>

            <div className="studio-footer-right">
              <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={!canSave}>
                {saving ? (
                  <>
                    <span className="spinner spinner-light" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Icon name="save" size={15} />
                    {mode === 'edit' ? 'Save snippet changes' : 'Add to vault'}
                  </>
                )}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  )
}
