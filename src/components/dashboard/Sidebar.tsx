'use client'

import { useEffect, useState } from 'react'
import { LOCAL_STORAGE_BUDGET } from '../../lib/constants'
import { formatBytes, pluralize } from '../../lib/format'
import type { Crate, ViewMode } from '../../lib/types'
import { Icon } from '../ui/Icon'
import type { IconName } from '../ui/Icon'

export interface SidebarLanguage {
  id: string
  label: string
  colorVar: string
  count: number
}

export interface SidebarTag {
  tag: string
  count: number
}

export interface SidebarCrate extends Crate {
  count: number
}

interface SidebarProps {
  isOpen: boolean
  activeView: ViewMode
  crateFilter: string | null
  languageFilter: string | null
  tagFilter: string | null
  counts: {
    all: number
    favorites: number
    recent: number
    archive: number
  }
  crates: SidebarCrate[]
  languages: SidebarLanguage[]
  popularTags: SidebarTag[]
  snippetCount: number
  storageBytes: number
  onViewChange: (view: ViewMode) => void
  onCrateSelect: (crateId: string) => void
  onLanguageSelect: (languageId: string) => void
  onTagSelect: (tag: string) => void
  onAddCrate: (name: string) => void
  onClose: () => void
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="sidebar-section-head">
      <span className="sidebar-section-title">{title}</span>
      {action}
    </div>
  )
}

function NavItem({
  icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: IconName
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`nav-item ${active ? 'is-active' : ''}`}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
    >
      <Icon name={icon} size={15} className="nav-icon" />
      <span className="nav-label">{label}</span>
      <span className="nav-count">{count}</span>
    </button>
  )
}

export function Sidebar({
  isOpen,
  activeView,
  crateFilter,
  languageFilter,
  tagFilter,
  counts,
  crates,
  languages,
  popularTags,
  snippetCount,
  storageBytes,
  onViewChange,
  onCrateSelect,
  onLanguageSelect,
  onTagSelect,
  onAddCrate,
  onClose,
}: SidebarProps) {
  const [addingCrate, setAddingCrate] = useState(false)
  const [crateName, setCrateName] = useState('')

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  const submitCrate = (event: React.FormEvent) => {
    event.preventDefault()
    const name = crateName.trim()
    if (!name) return

    onAddCrate(name)
    setCrateName('')
    setAddingCrate(false)
  }

  const storagePercent = Math.min(100, (storageBytes / LOCAL_STORAGE_BUDGET) * 100)
  const storageLabel = storagePercent < 0.1 ? '<0.1' : storagePercent.toFixed(1)

  const handleView = (view: ViewMode) => {
    onViewChange(view)
    onClose()
  }

  return (
    <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
      <div className="sidebar-brand">
        <span className="brand-mark" aria-hidden="true">
          <Icon name="box" size={19} strokeWidth={1.9} />
        </span>

        <div className="brand-copy">
          <div className="brand-name">CodeCrate</div>
          <div className="brand-meta">
          </div>
        </div>

        <button type="button" className="sidebar-close" onClick={onClose} aria-label="Close sidebar">
          <Icon name="x" size={16} />
        </button>
      </div>

      <div className="sidebar-scroll">
        <section className="sidebar-section">
          <SectionHeader title="Library" />
          <nav className="sidebar-nav" aria-label="Library">
            <NavItem
              icon="box"
              label="All Snippets"
              count={counts.all}
              active={activeView === 'all' && !crateFilter}
              onClick={() => handleView('all')}
            />
            <NavItem
              icon="star"
              label="Favorites"
              count={counts.favorites}
              active={activeView === 'favorites'}
              onClick={() => handleView('favorites')}
            />
            <NavItem
              icon="clock"
              label="Recent"
              count={counts.recent}
              active={activeView === 'recent'}
              onClick={() => handleView('recent')}
            />
            <NavItem
              icon="archive"
              label="Trash / Archive"
              count={counts.archive}
              active={activeView === 'archive'}
              onClick={() => handleView('archive')}
            />
          </nav>
        </section>

        <section className="sidebar-section">
          <SectionHeader
            title="Crates & Collections"
            action={
              <button
                type="button"
                className="sidebar-add"
                onClick={() => setAddingCrate((value) => !value)}
                aria-label="Create a crate"
                title="Create a crate"
              >
                <Icon name="plus" size={14} />
              </button>
            }
          />

          {addingCrate && (
            <form className="crate-create-form" onSubmit={submitCrate}>
              <input
                className="crate-create-input"
                value={crateName}
                onChange={(event) => setCrateName(event.target.value)}
                placeholder="New crate name"
                autoFocus
                aria-label="New crate name"
              />
              <button type="submit" className="crate-create-submit" aria-label="Create crate">
                <Icon name="check" size={13} />
              </button>
            </form>
          )}

          <div className="sidebar-nav">
            {crates.map((crate) => {
              const active = crateFilter === crate.id
              return (
                <button
                  type="button"
                  key={crate.id}
                  className={`nav-item ${active ? 'is-active' : ''}`}
                  onClick={() => {
                    onCrateSelect(crate.id)
                    onClose()
                  }}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon name={crate.icon as IconName} size={15} className="nav-icon" />
                  <span className="nav-label">{crate.name}</span>
                  <span className="nav-count">{crate.count}</span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="sidebar-section">
          <SectionHeader
            title="Languages"
            action={<span className="sidebar-filter-label">Filter</span>}
          />

          {languages.length > 0 ? (
            <div className="language-list">
              {languages.map((language) => {
                const active = languageFilter === language.id
                return (
                  <button
                    type="button"
                    key={language.id}
                    className={`language-row ${active ? 'is-active' : ''}`}
                    onClick={() => {
                      onLanguageSelect(language.id)
                      onClose()
                    }}
                    aria-pressed={active}
                  >
                    <span
                      className="language-dot"
                      style={{ '--lang-color': `var(${language.colorVar})` } as React.CSSProperties}
                    />
                    <span className="language-name">{language.label}</span>
                    <span className="language-count">{language.count}</span>
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="sidebar-empty">No languages indexed yet.</p>
          )}
        </section>

        <section className="sidebar-section">
          <SectionHeader title="Popular Tags" />

          {popularTags.length > 0 ? (
            <div className="sidebar-tags">
              {popularTags.map(({ tag, count }) => {
                const active = tagFilter?.toLowerCase() === tag.toLowerCase()
                return (
                  <button
                    type="button"
                    key={tag}
                    className={`sidebar-tag ${active ? 'is-active' : ''}`}
                    onClick={() => {
                      onTagSelect(tag)
                      onClose()
                    }}
                    aria-pressed={active}
                    title={`${count} ${pluralize(count, 'snippet')}`}
                  >
                    #{tag}
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="sidebar-empty">Tags will appear as you add them.</p>
          )}
        </section>
      </div>

      <div className="sidebar-storage">
        <div className="storage-head">
          <span className="storage-title">
            <Icon name="database" size={12} />
            Local Storage
          </span>
          <span className="storage-percent">{storageLabel}% used</span>
        </div>

        <div className="storage-bar" aria-hidden="true">
          <span className="storage-fill" style={{ width: `${Math.max(1.5, storagePercent)}%` }} />
        </div>

        <div className="storage-meta">
          <span>{snippetCount} {pluralize(snippetCount, 'snippet')} saved</span>
          <span>{formatBytes(storageBytes)}</span>
        </div>
      </div>
    </aside>
  )
}
