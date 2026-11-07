'use client'

import { useMemo, useState } from 'react'
import type { Highlighter } from 'shiki'
import { buildFilename, formatDate, getLanguage } from '../../lib/format'
import { highlightCode } from '../../lib/shiki'
import type { ThemeMode, VaultMeta } from '../../lib/types'
import type { Snippet } from '../../lib/types'
import { useDismiss } from '../../lib/use-dismiss'
import { Icon } from '../ui/Icon'

interface SnippetCardProps {
  snippet: Snippet
  meta: VaultMeta
  crateName: string
  theme: ThemeMode
  highlighter: Highlighter | null
  selected: boolean
  archived: boolean
  favorite: boolean
  activeTag: string | null
  onToggleSelect: (id: string) => void
  onToggleFavorite: (id: string) => void
  onCopy: (snippet: Snippet) => Promise<boolean>
  onEdit: (snippet: Snippet) => void
  onDuplicate: (snippet: Snippet) => void
  onDelete: (snippet: Snippet) => void
  onToggleArchive: (snippet: Snippet) => void
  onTagClick: (tag: string) => void
}

export function SnippetCard({
  snippet,
  meta,
  crateName,
  theme,
  highlighter,
  selected,
  archived,
  favorite,
  activeTag,
  onToggleSelect,
  onToggleFavorite,
  onCopy,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleArchive,
  onTagClick,
}: SnippetCardProps) {
  const [copied, setCopied] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useDismiss(menuOpen, () => setMenuOpen(false))

  const language = getLanguage(snippet.language)
  const version = meta.versions[snippet.id] ?? 1
  const description = meta.descriptions[snippet.id] ?? ''
  const copyCount = meta.copies[snippet.id] ?? 0
  const updatedAt = meta.updatedAt[snippet.id] ?? snippet.created_at
  const filename = buildFilename(snippet.title, snippet.language)

  const highlightedHtml = useMemo(
    () => highlightCode(highlighter, snippet.content, snippet.language, theme),
    [highlighter, snippet.content, snippet.language, theme]
  )

  const handleCopy = async () => {
    const success = await onCopy(snippet)
    if (!success) return

    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <article className={`crate-card ${selected ? 'is-selected' : ''}`}>
      <div className="card-head">
        <div className="card-head-left">
          <input
            type="checkbox"
            className="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(snippet.id)}
            aria-label={`Select ${snippet.title}`}
          />

          <span
            className="chip lang-chip"
            style={{ '--lang-color': `var(${language.colorVar})` } as React.CSSProperties}
          >
            <span className="language-dot" />
            {language.label}
          </span>

          <span className="card-file" title={filename}>{filename}</span>
        </div>

        <div className="card-head-actions">
          <button
            type="button"
            className={`star-btn ${favorite ? 'is-starred' : ''}`}
            onClick={() => onToggleFavorite(snippet.id)}
            aria-label={favorite ? `Remove ${snippet.title} from favorites` : `Add ${snippet.title} to favorites`}
            aria-pressed={favorite}
            title={favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Icon name="star" size={15} filled={favorite} />
          </button>

          <div className="card-menu-wrap" ref={menuRef}>
            <button
              type="button"
              className="btn-icon card-menu-trigger"
              onClick={() => setMenuOpen((value) => !value)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Snippet actions"
              title="More actions"
            >
              <Icon name="moreVertical" size={15} />
            </button>

            {menuOpen && (
              <div className="menu card-menu" role="menu">
                <button
                  type="button"
                  className="menu-item"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    onEdit(snippet)
                  }}
                >
                  <Icon name="pencil" size={13} />
                  Edit snippet
                </button>
                <button
                  type="button"
                  className="menu-item"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    onDuplicate(snippet)
                  }}
                >
                  <Icon name="copy" size={13} />
                  Duplicate crate
                </button>
                <button
                  type="button"
                  className="menu-item"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    void handleCopy()
                  }}
                >
                  <Icon name="code" size={13} />
                  Copy code
                </button>
                <button
                  type="button"
                  className="menu-item"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    onToggleArchive(snippet)
                  }}
                >
                  <Icon name={archived ? 'restore' : 'archive'} size={13} />
                  {archived ? 'Restore from archive' : 'Move to archive'}
                </button>

                <div className="menu-sep" />

                <button
                  type="button"
                  className="menu-item is-danger"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    onDelete(snippet)
                  }}
                >
                  <Icon name="trash" size={13} />
                  Delete snippet
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card-title-row">
        <h3 className="card-title" title={snippet.title}>{snippet.title}</h3>
        {archived ? (
          <span className="archive-badge">Archived</span>
        ) : (
          <span className="version-badge">v{version}</span>
        )}
      </div>

      {description && <p className="card-description">{description}</p>}

      <div className="card-code-wrap">
        <div
          className="code-chamber card-code"
          style={{ '--lang-color': `var(${language.colorVar})` } as React.CSSProperties}
        >
          <div className="code-lines" dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
          <span className="code-watermark">{language.short}</span>
        </div>

        <button
          type="button"
          className={`copy-btn ${copied ? 'is-copied' : ''}`}
          onClick={handleCopy}
          title="Copy code to clipboard"
        >
          <Icon name={copied ? 'check' : 'copy'} size={11} />
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {snippet.tags.length > 0 && (
        <div className="card-tags">
          {snippet.tags.map((tag) => {
            const active = activeTag?.toLowerCase() === tag.toLowerCase()
            return (
              <button
                type="button"
                key={tag}
                className={`chip tag-chip ${active ? 'is-active' : ''}`}
                onClick={() => onTagClick(tag)}
                aria-pressed={active}
                title={`Filter by #${tag}`}
              >
                #{tag}
              </button>
            )
          })}
        </div>
      )}

      <footer className="card-footer">
        <div className="card-meta">
          <Icon name="clock" size={11} />
          <span>Updated {formatDate(updatedAt)}</span>
          {copyCount > 0 && (
            <>
              <span className="meta-sep">·</span>
              <span>{copyCount} {copyCount === 1 ? 'copy' : 'copies'}</span>
            </>
          )}
          <span className="meta-sep">·</span>
          <span className="card-crate">{crateName}</span>
        </div>

        <div className="card-actions">
          <button
            type="button"
            className="card-action"
            onClick={() => onEdit(snippet)}
            aria-label={`Edit ${snippet.title}`}
            title="Edit snippet"
          >
            <Icon name="pencil" size={13} />
          </button>
          <button
            type="button"
            className="card-action is-danger"
            onClick={() => onDelete(snippet)}
            aria-label={`Delete ${snippet.title}`}
            title="Delete snippet"
          >
            <Icon name="trash" size={13} />
          </button>
        </div>
      </footer>
    </article>
  )
}
