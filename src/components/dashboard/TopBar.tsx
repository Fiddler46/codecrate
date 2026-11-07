'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { SidebarLanguage, SidebarTag } from './Sidebar'
import { getLanguage } from '../../lib/format'
import { useDismiss } from '../../lib/use-dismiss'
import { Icon } from '../ui/Icon'
import { ThemeToggle } from '../ui/ThemeToggle'

interface FilterOption {
  value: string
  label: string
  count: number
  colorVar?: string
  prefix?: string
}

interface TopBarProps {
  user: User
  query: string
  languageFilter: string | null
  tagFilter: string | null
  languages: SidebarLanguage[]
  tags: SidebarTag[]
  onQueryChange: (query: string) => void
  onLanguageFilter: (language: string | null) => void
  onTagFilter: (tag: string | null) => void
  onNewSnippet: () => void
  onSignOut: () => void
  onOpenSidebar: () => void
  onToggleTheme: () => void
}

function FilterDropdown({
  label,
  activeValue,
  options,
  onSelect,
  allLabel,
}: {
  label: string
  activeValue: string | null
  options: FilterOption[]
  onSelect: (value: string | null) => void
  allLabel: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useDismiss(open, () => setOpen(false))
  const activeOption = options.find((option) => option.value === activeValue)

  return (
    <div className="filter-wrap" ref={ref}>
      <button
        type="button"
        className={`filter-btn ${activeValue ? 'is-active' : ''}`}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        title={`Filter by ${label}`}
      >
        <span>{label}:</span>
        <span className="filter-value">
          {activeOption ? (activeOption.prefix ?? '') + activeOption.label : '*'}
        </span>
        <Icon name="chevronDown" size={11} className="filter-chevron" />
      </button>

      {open && (
        <div className="menu filter-menu" role="menu">
          <button
            type="button"
            className={`menu-item ${!activeValue ? 'is-selected' : ''}`}
            onClick={() => {
              onSelect(null)
              setOpen(false)
            }}
            role="menuitem"
          >
            <span className="menu-item-label">All {allLabel}</span>
          </button>

          <div className="menu-sep" />

          <div className="filter-menu-scroll">
            {options.map((option) => (
              <button
                type="button"
                className={`menu-item ${option.value === activeValue ? 'is-selected' : ''}`}
                key={option.value}
                onClick={() => {
                  onSelect(option.value)
                  setOpen(false)
                }}
                role="menuitem"
              >
                {option.colorVar && (
                  <span
                    className="menu-dot"
                    style={{ '--lang-color': `var(${option.colorVar})` } as React.CSSProperties}
                  />
                )}
                <span className="menu-item-label">
                  {option.prefix ?? ''}
                  {option.label}
                </span>
                <span className="menu-count">{option.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function getDisplayName(user: User): string {
  const metadata = user.user_metadata ?? {}
  return metadata.full_name || metadata.name || metadata.user_name || user.email?.split('@')[0] || 'Developer'
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'CC'
}

export function TopBar({
  user,
  query,
  languageFilter,
  tagFilter,
  languages,
  tags,
  onQueryChange,
  onLanguageFilter,
  onTagFilter,
  onNewSnippet,
  onSignOut,
  onOpenSidebar,
  onToggleTheme,
}: TopBarProps) {
  const searchRef = useRef<HTMLInputElement>(null)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useDismiss(accountOpen, () => setAccountOpen(false))

  const displayName = getDisplayName(user)
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined
  const initials = getInitials(displayName)

  const languageOptions = useMemo<FilterOption[]>(
    () =>
      languages.map((language) => ({
        value: language.id,
        label: language.label,
        count: language.count,
        colorVar: language.colorVar,
      })),
    [languages]
  )

  const tagOptions = useMemo<FilterOption[]>(
    () =>
      tags.map(({ tag, count }) => ({
        value: tag,
        label: tag,
        count,
        prefix: '#',
      })),
    [tags]
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTyping = target
        ? ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable
        : false

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
        return
      }

      if (event.key === '/' && !isTyping) {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const languageLabel = languageFilter
    ? getLanguage(languageFilter).label
    : '*'

  return (
    <header className="topbar">
      <button
        type="button"
        className="btn-icon topbar-menu-btn"
        onClick={onOpenSidebar}
        aria-label="Open navigation"
      >
        <Icon name="menu" size={19} />
      </button>

      <div className="search-box">
        <Icon name="search" size={16} className="search-icon" />
        <input
          ref={searchRef}
          className="search-input"
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search snippets, tags, symbols..."
          aria-label="Search snippets"
          spellCheck={false}
        />

        {query && (
          <button
            type="button"
            className="search-clear"
            onClick={() => onQueryChange('')}
            aria-label="Clear search"
          >
            <Icon name="x" size={13} />
          </button>
        )}

        <span className="search-kbd" aria-hidden="true">
          <kbd className="kbd">⌘</kbd>
          <kbd className="kbd">K</kbd>
        </span>
      </div>

      <div className="search-filters">
        <FilterDropdown
          label="lang"
          activeValue={languageFilter}
          options={languageOptions}
          onSelect={onLanguageFilter}
          allLabel="languages"
        />
        <FilterDropdown
          label="tag"
          activeValue={tagFilter}
          options={tagOptions}
          onSelect={onTagFilter}
          allLabel="tags"
        />
      </div>

      <div className="topbar-actions">
        <button type="button" className="btn btn-primary new-snippet-btn" onClick={onNewSnippet} title="New snippet (N)">
          <Icon name="plus" size={15} strokeWidth={2.2} />
          <span>New Snippet</span>
          <kbd className="kbd kbd-on-amber">N</kbd>
        </button>

        <ThemeToggle onToggle={onToggleTheme} />
        <span className="topbar-divider" aria-hidden="true" />

        <div className="account-wrap" ref={accountRef}>
          <button
            type="button"
            className="user-btn"
            onClick={() => setAccountOpen((value) => !value)}
            aria-expanded={accountOpen}
            aria-haspopup="menu"
          >
            <span className="avatar-wrap">
              {avatarUrl ? (
                <img className="avatar avatar-img" src={avatarUrl} alt="" referrerPolicy="no-referrer" />
              ) : (
                <span className="avatar">{initials}</span>
              )}
              <span className="avatar-online" aria-hidden="true" />
            </span>
            <span className="user-meta">
              <span className="user-name">{displayName}</span>
              <span className="user-status">Online</span>
            </span>
            <Icon name="chevronDown" size={12} className="user-chevron" />
          </button>

          {accountOpen && (
            <div className="menu account-menu" role="menu">
              <div className="account-summary">
                <span className="account-name">{displayName}</span>
                <span className="account-email">{user.email}</span>
              </div>
              <div className="menu-sep" />
              <button
                type="button"
                className="menu-item is-danger"
                role="menuitem"
                onClick={() => {
                  setAccountOpen(false)
                  onSignOut()
                }}
              >
                <Icon name="logOut" size={14} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      <span className="sr-only">Search language: {languageLabel}</span>
    </header>
  )
}
