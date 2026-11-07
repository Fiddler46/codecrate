'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Highlighter } from 'shiki'
import { createClient } from '../../lib/supabase-browser'
import {
  DEFAULT_CRATES,
  FALLBACK_LANGUAGE,
  LANGUAGE_MAP,
  PAGE_SIZE,
  RECENT_WINDOW_MS,
} from '../lib/constants'
import {
  capitalize,
  formatBytes,
  formatDate,
  formatTime,
  getLanguage,
  pluralize,
} from '../lib/format'
import { parseSearchQuery } from '../lib/parse-search'
import { getHighlighter } from '../lib/shiki'
import type {
  Density,
  ScopeChip,
  Snippet,
  SnippetDraft,
  SortMode,
  ToastMessage,
  ToastTone,
  ViewMode,
} from '../lib/types'
import { useTheme } from '../lib/use-theme'
import { useVaultMeta } from '../lib/vault-meta'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Icon } from '../components/ui/Icon'
import { Toasts } from '../components/ui/Toasts'
import { ScopeBar } from '../components/dashboard/ScopeBar'
import { Sidebar } from '../components/dashboard/Sidebar'
import type { SidebarCrate, SidebarLanguage, SidebarTag } from '../components/dashboard/Sidebar'
import { SnippetCard } from '../components/dashboard/SnippetCard'
import { StatusBar } from '../components/dashboard/StatusBar'
import { Toolbar } from '../components/dashboard/Toolbar'
import { TopBar } from '../components/dashboard/TopBar'
import { SnippetStudio } from '../components/studio/SnippetStudio'

interface ConfirmState {
  title: string
  message: string
  confirmLabel: string
  tone: 'danger' | 'default'
  action: () => Promise<void>
}

interface StudioState {
  mode: 'create' | 'edit'
  snippet?: Snippet
}

function getViewTitle(
  activeView: ViewMode,
  crateFilter: string | null,
  crateNames: Map<string, string>
): string {
  if (crateFilter) return crateNames.get(crateFilter) ?? 'All Snippets'
  if (activeView === 'favorites') return 'Favorites'
  if (activeView === 'recent') return 'Recent'
  if (activeView === 'archive') return 'Trash / Archive'
  return 'All Snippets'
}

export default function HomePage() {
  const router = useRouter()
  const supabaseRef = useRef<SupabaseClient | null>(null)
  const getSupabase = useCallback(() => {
    if (!supabaseRef.current) supabaseRef.current = createClient()
    return supabaseRef.current
  }, [])
  const { theme, toggle: toggleTheme } = useTheme()

  const [user, setUser] = useState<User | null>(null)
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [activeView, setActiveView] = useState<ViewMode>('all')
  const [crateFilter, setCrateFilter] = useState<string | null>(null)
  const [languageFilter, setLanguageFilter] = useState<string | null>(null)
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [density, setDensity] = useState<Density>('crates')
  const [sortMode, setSortMode] = useState<SortMode>('updated')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [studio, setStudio] = useState<StudioState | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)
  const [confirmBusy, setConfirmBusy] = useState(false)

  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const toastId = useRef(0)

  const {
    meta,
    toggleFavorite,
    archive: archiveSnippets,
    restore: restoreSnippets,
    toggleArchived,
    recordCopy,
    markCreated,
    markSaved,
    forget,
    addCrate,
  } = useVaultMeta(user?.id ?? null)

  const notify = useCallback((tone: ToastTone, message: string) => {
    const id = toastId.current + 1
    toastId.current = id
    setToasts((current) => [...current, { id, tone, message }].slice(-4))
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const loadSnippets = useCallback(async () => {
    setError(null)
    const response = await fetch('/api/snippets', { cache: 'no-store' })

    if (response.status === 401) {
      router.replace('/login')
      return
    }

    if (!response.ok) throw new Error('Failed to load snippets')

    const data: unknown = await response.json()
    setSnippets(Array.isArray(data) ? (data as Snippet[]) : [])
    setLastSyncedAt(new Date())
  }, [router])

  useEffect(() => {
    let cancelled = false

    const boot = async () => {
      try {
        const { data: { user: currentUser } } = await getSupabase().auth.getUser()
        if (cancelled) return

        setUser(currentUser)
        if (!currentUser) {
          router.replace('/login')
          return
        }

        await loadSnippets()
      } catch (loadError) {
        console.error('Could not open the vault:', loadError)
        if (!cancelled) setError('Could not open your vault. Check your connection and try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void boot()
    return () => {
      cancelled = true
    }
  }, [getSupabase, loadSnippets, router])

  useEffect(() => {
    let cancelled = false
    getHighlighter()
      .then((instance) => {
        if (!cancelled) setHighlighter(instance)
      })
      .catch((highlighterError) => {
        console.error('Could not initialize the syntax highlighter:', highlighterError)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (studio || confirmState) return

      const target = event.target as HTMLElement | null
      const isTyping = target
        ? ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable
        : false

      if (isTyping) return

      if (event.key.toLowerCase() === 'n' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault()
        setStudio({ mode: 'create' })
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [studio, confirmState])

  const archivedSet = useMemo(() => new Set(meta.archived), [meta.archived])
  const favoriteSet = useMemo(() => new Set(meta.favorites), [meta.favorites])
  const crates = useMemo(() => [...DEFAULT_CRATES, ...meta.customCrates], [meta.customCrates])
  const crateNames = useMemo(() => new Map(crates.map((crate) => [crate.id, crate.name])), [crates])
  const parsedQuery = useMemo(() => parseSearchQuery(searchQuery), [searchQuery])

  const activeSnippets = useMemo(
    () => snippets.filter((snippet) => !archivedSet.has(snippet.id)),
    [snippets, archivedSet]
  )

  const crateCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const snippet of activeSnippets) {
      const crateId = meta.crates[snippet.id] ?? 'personal-vault'
      counts[crateId] = (counts[crateId] ?? 0) + 1
    }
    return counts
  }, [activeSnippets, meta.crates])

  const languageItems = useMemo<SidebarLanguage[]>(() => {
    const counts = new Map<string, number>()
    for (const snippet of activeSnippets) {
      counts.set(snippet.language, (counts.get(snippet.language) ?? 0) + 1)
    }

    return Array.from(counts.entries())
      .map(([id, count]) => {
        const language = LANGUAGE_MAP[id] ?? {
          ...FALLBACK_LANGUAGE,
          id,
          label: capitalize(id),
        }
        return { id, label: language.label, colorVar: language.colorVar, count }
      })
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
  }, [activeSnippets])

  const tagItems = useMemo(() => {
    const counts = new Map<string, { tag: string; count: number }>()

    for (const snippet of activeSnippets) {
      for (const tag of snippet.tags) {
        const key = tag.toLowerCase()
        const current = counts.get(key)
        counts.set(key, { tag: current?.tag ?? tag, count: (current?.count ?? 0) + 1 })
      }
    }

    return Array.from(counts.values()).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
  }, [activeSnippets])

  const popularTags = useMemo<SidebarTag[]>(
    () => tagItems.slice(0, 10).map(({ tag, count }) => ({ tag, count })),
    [tagItems]
  )

  const crateItems = useMemo<SidebarCrate[]>(
    () => crates.map((crate) => ({ ...crate, count: crateCounts[crate.id] ?? 0 })),
    [crates, crateCounts]
  )

  const recentCount = useMemo(
    () =>
      activeSnippets.filter((snippet) => {
        const updated = new Date(meta.updatedAt[snippet.id] ?? snippet.created_at).getTime()
        return Date.now() - updated <= RECENT_WINDOW_MS
      }).length,
    [activeSnippets, meta.updatedAt]
  )

  const counts = useMemo(
    () => ({
      all: activeSnippets.length,
      favorites: activeSnippets.filter((snippet) => favoriteSet.has(snippet.id)).length,
      recent: recentCount,
      archive: meta.archived.length,
    }),
    [activeSnippets, favoriteSet, recentCount, meta.archived.length]
  )

  const filteredSnippets = useMemo(() => {
    const now = Date.now()

    return snippets.filter((snippet) => {
      const isArchived = archivedSet.has(snippet.id)

      if (activeView === 'archive') {
        if (!isArchived) return false
      } else if (isArchived) {
        return false
      }

      if (activeView === 'favorites' && !favoriteSet.has(snippet.id)) return false

      if (activeView === 'recent') {
        const updated = new Date(meta.updatedAt[snippet.id] ?? snippet.created_at).getTime()
        if (now - updated > RECENT_WINDOW_MS) return false
      }

      const snippetCrate = meta.crates[snippet.id] ?? 'personal-vault'
      if (crateFilter && snippetCrate !== crateFilter) return false
      if (parsedQuery.crates.length > 0 && !parsedQuery.crates.includes(snippetCrate)) return false

      if (languageFilter && snippet.language !== languageFilter) return false
      if (parsedQuery.languages.length > 0 && !parsedQuery.languages.includes(snippet.language)) return false

      if (tagFilter && !snippet.tags.some((tag) => tag.toLowerCase() === tagFilter.toLowerCase())) {
        return false
      }

      if (
        parsedQuery.tags.length > 0 &&
        !parsedQuery.tags.every((queryTag) =>
          snippet.tags.some((tag) => tag.toLowerCase() === queryTag)
        )
      ) {
        return false
      }

      if (parsedQuery.text) {
        const haystack = [
          snippet.title,
          snippet.content,
          snippet.language,
          snippet.tags.join(' '),
          meta.descriptions[snippet.id] ?? '',
          crateNames.get(snippetCrate) ?? '',
        ]
          .join(' ')
          .toLowerCase()

        if (!haystack.includes(parsedQuery.text)) return false
      }

      return true
    })
  }, [
    snippets,
    activeView,
    archivedSet,
    favoriteSet,
    meta.updatedAt,
    meta.crates,
    meta.descriptions,
    crateFilter,
    languageFilter,
    tagFilter,
    parsedQuery,
    crateNames,
  ])

  const sortedSnippets = useMemo(() => {
    const list = [...filteredSnippets]
    const updatedTime = (snippet: Snippet) =>
      new Date(meta.updatedAt[snippet.id] ?? snippet.created_at).getTime()

    switch (sortMode) {
      case 'created':
        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'title':
        list.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }))
        break
      case 'language':
        list.sort(
          (a, b) =>
            a.language.localeCompare(b.language) ||
            a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
        )
        break
      default:
        list.sort((a, b) => updatedTime(b) - updatedTime(a))
    }

    return list
  }, [filteredSnippets, sortMode, meta.updatedAt])

  const totalPages = Math.max(1, Math.ceil(sortedSnippets.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibleSnippets = useMemo(
    () => sortedSnippets.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [sortedSnippets, safePage]
  )

  const allSelected =
    sortedSnippets.length > 0 && sortedSnippets.every((snippet) => selectedIds.has(snippet.id))
  const someSelected = selectedIds.size > 0

  const copyStats = useMemo(() => {
    const day = 24 * 60 * 60 * 1000
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const days = Array.from({ length: 7 }, (_, index) => {
      const start = today.getTime() - (6 - index) * day
      return { start, end: start + day }
    })

    const dailyCounts = days.map(
      (range) => meta.copyLog.filter((timestamp) => timestamp >= range.start && timestamp < range.end).length
    )
    const week = dailyCounts.reduce((total, count) => total + count, 0)
    const previousStart = today.getTime() - 14 * day
    const previousEnd = today.getTime() - 7 * day
    const previous = meta.copyLog.filter(
      (timestamp) => timestamp >= previousStart && timestamp < previousEnd
    ).length
    const delta = previous === 0 ? (week > 0 ? 100 : 0) : Math.round(((week - previous) / previous) * 100)

    return { counts: dailyCounts, week, delta }
  }, [meta.copyLog])

  const storageBytes = useMemo(
    () => JSON.stringify({ snippets, meta }).length * 2,
    [snippets, meta]
  )

  const scopeChips = useMemo<ScopeChip[]>(() => {
    const chips: ScopeChip[] = []

    if (activeView !== 'all') {
      chips.push({
        key: 'view',
        type: 'view',
        label: 'View',
        value: activeView === 'archive' ? 'Archive' : capitalize(activeView),
        onClear: () => setActiveView('all'),
      })
    }

    if (crateFilter) {
      chips.push({
        key: `crate-${crateFilter}`,
        type: 'crate',
        label: 'Crate',
        value: crateNames.get(crateFilter) ?? crateFilter,
        onClear: () => setCrateFilter(null),
      })
    }

    if (languageFilter) {
      chips.push({
        key: `language-${languageFilter}`,
        type: 'language',
        label: 'Lang',
        value: getLanguage(languageFilter).label,
        onClear: () => setLanguageFilter(null),
      })
    }

    if (tagFilter) {
      chips.push({
        key: `tag-${tagFilter}`,
        type: 'tag',
        label: 'Tag',
        value: `#${tagFilter}`,
        onClear: () => setTagFilter(null),
      })
    }

    if (searchQuery.trim()) {
      chips.push({
        key: 'search',
        type: 'search',
        label: 'Search',
        value: searchQuery.trim(),
        onClear: () => setSearchQuery(''),
      })
    }

    return chips
  }, [activeView, crateFilter, crateNames, languageFilter, tagFilter, searchQuery])

  const viewTitle = getViewTitle(activeView, crateFilter, crateNames)
  const hasFilters = Boolean(searchQuery.trim() || languageFilter || tagFilter || crateFilter)

  useEffect(() => {
    setPage(1)
  }, [searchQuery, languageFilter, tagFilter, crateFilter, activeView, sortMode])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [searchQuery, languageFilter, tagFilter, crateFilter, activeView])

  const handleViewChange = (view: ViewMode) => {
    setActiveView(view)
    setCrateFilter(null)
    setLanguageFilter(null)
    setTagFilter(null)
    setSearchQuery('')
    setSidebarOpen(false)
  }

  const handleCrateSelect = (crateId: string) => {
    setActiveView('all')
    setCrateFilter(crateId)
    setLanguageFilter(null)
    setTagFilter(null)
    setSearchQuery('')
    setSidebarOpen(false)
  }

  const handleLanguageSelect = (languageId: string) => {
    setLanguageFilter((current) => (current === languageId ? null : languageId))
  }

  const handleTagSelect = (tag: string) => {
    setTagFilter((current) => (current?.toLowerCase() === tag.toLowerCase() ? null : tag))
  }

  const handleClearScope = () => {
    setActiveView('all')
    setCrateFilter(null)
    setLanguageFilter(null)
    setTagFilter(null)
    setSearchQuery('')
  }

  const handleToggleSelect = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
      return
    }

    setSelectedIds(new Set(sortedSnippets.map((snippet) => snippet.id)))
  }

  const handleCopy = useCallback(
    async (snippet: Snippet): Promise<boolean> => {
      try {
        await navigator.clipboard.writeText(snippet.content)
        recordCopy(snippet.id)
        return true
      } catch {
        notify('error', 'Clipboard access was blocked by your browser.')
        return false
      }
    },
    [notify, recordCopy]
  )

  const handleToggleArchive = (snippet: Snippet) => {
    const wasArchived = archivedSet.has(snippet.id)
    toggleArchived(snippet.id)
    notify(
      'success',
      wasArchived ? 'Snippet restored to the vault.' : 'Snippet moved to the archive.'
    )
  }

  const handleBulkArchive = () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return

    if (activeView === 'archive') {
      restoreSnippets(ids)
      notify('success', `${ids.length} ${pluralize(ids.length, 'snippet')} restored.`)
    } else {
      archiveSnippets(ids)
      notify('success', `${ids.length} ${pluralize(ids.length, 'snippet')} archived.`)
    }

    setSelectedIds(new Set())
  }

  const handleBulkDelete = () => {
    const selectedSnippets = snippets.filter((snippet) => selectedIds.has(snippet.id))
    requestDelete(selectedSnippets)
  }

  const handleExport = () => {
    if (sortedSnippets.length === 0) return

    const payload = {
      exportedAt: new Date().toISOString(),
      snippets: sortedSnippets.map((snippet) => ({
        id: snippet.id,
        title: snippet.title,
        content: snippet.content,
        language: snippet.language,
        tags: snippet.tags,
        created_at: snippet.created_at,
        crate: crateNames.get(meta.crates[snippet.id] ?? 'personal-vault') ?? 'Personal Vault',
        favorite: favoriteSet.has(snippet.id),
        archived: archivedSet.has(snippet.id),
        description: meta.descriptions[snippet.id] ?? '',
        version: meta.versions[snippet.id] ?? 1,
        updated_at: meta.updatedAt[snippet.id] ?? snippet.created_at,
      })),
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `codecrate-export-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)

    notify('success', `Exported ${sortedSnippets.length} ${pluralize(sortedSnippets.length, 'snippet')}.`)
  }

  const handleAddCrate = (name: string) => {
    const crate = addCrate(name)
    if (!crate) {
      notify('error', 'A crate with that name already exists.')
      return
    }

    setActiveView('all')
    setCrateFilter(crate.id)
    setLanguageFilter(null)
    setTagFilter(null)
    setSearchQuery('')
    notify('success', `Crate “${crate.name}” created.`)
  }

  const handleDuplicate = async (snippet: Snippet) => {
    try {
      const response = await fetch('/api/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${snippet.title} (copy)`,
          content: snippet.content,
          language: snippet.language,
          tags: snippet.tags,
        }),
      })

      if (!response.ok) throw new Error('Duplicate failed')

      const created: Snippet = await response.json()
      setSnippets((current) => [created, ...current])
      markCreated(
        created.id,
        meta.crates[snippet.id] ?? 'personal-vault',
        meta.descriptions[snippet.id] ?? ''
      )
      setLastSyncedAt(new Date())
      notify('success', 'Snippet duplicated into the vault.')
    } catch {
      notify('error', 'Could not duplicate this snippet.')
    }
  }

  const createSnippet = async (draft: SnippetDraft) => {
    setSaving(true)

    try {
      const response = await fetch('/api/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draft.title,
          content: draft.content,
          language: draft.language,
          tags: draft.tags,
        }),
      })

      if (!response.ok) throw new Error('Create failed')

      const created: Snippet = await response.json()
      setSnippets((current) => [created, ...current])
      markCreated(created.id, draft.crateId, draft.description)
      setLastSyncedAt(new Date())
      setStudio(null)
      notify('success', 'Snippet added to your vault.')
    } catch {
      notify('error', 'Could not save the snippet. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const updateSnippet = async (snippet: Snippet, draft: SnippetDraft) => {
    setSaving(true)

    try {
      const response = await fetch(`/api/snippets/${snippet.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draft.title,
          content: draft.content,
          language: draft.language,
          tags: draft.tags,
        }),
      })

      if (!response.ok) throw new Error('Update failed')

      const updated: Snippet = await response.json()
      setSnippets((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      markSaved(updated.id, draft.crateId, draft.description)
      setLastSyncedAt(new Date())
      setStudio(null)
      notify('success', 'Snippet changes saved.')
    } catch {
      notify('error', 'Could not save the snippet. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleStudioSubmit = (draft: SnippetDraft) => {
    if (studio?.mode === 'edit' && studio.snippet) {
      void updateSnippet(studio.snippet, draft)
      return
    }

    void createSnippet(draft)
  }

  const requestDelete = useCallback(
    (snippetsToDelete: Snippet[], closeStudioAfter = false) => {
      if (snippetsToDelete.length === 0) return

      const count = snippetsToDelete.length
      const singleSnippet = count === 1 ? snippetsToDelete[0] : null

      setConfirmState({
        title: singleSnippet ? 'Delete snippet?' : `Delete ${count} snippets?`,
        message: singleSnippet
          ? `“${singleSnippet.title}” will be permanently removed from your vault. This cannot be undone.`
          : `These ${count} snippets will be permanently removed from your vault. This cannot be undone.`,
        confirmLabel: singleSnippet ? 'Delete snippet' : `Delete ${count} snippets`,
        tone: 'danger',
        action: async () => {
          const results = await Promise.all(
            snippetsToDelete.map(async (snippet) => {
              try {
                const response = await fetch(`/api/snippets/${snippet.id}`, { method: 'DELETE' })
                return response.ok
              } catch {
                return false
              }
            })
          )

          const deletedIds = snippetsToDelete
            .filter((_, index) => results[index])
            .map((snippet) => snippet.id)

          if (deletedIds.length > 0) {
            setSnippets((current) => current.filter((snippet) => !deletedIds.includes(snippet.id)))
            forget(deletedIds)
            setSelectedIds((current) => {
              const next = new Set(current)
              deletedIds.forEach((id) => next.delete(id))
              return next
            })
            setLastSyncedAt(new Date())
          }

          if (deletedIds.length === count) {
            notify('success', `${count} ${pluralize(count, 'snippet')} deleted.`)
          } else {
            notify('error', 'Some snippets could not be deleted. Please try again.')
          }

          if (closeStudioAfter && deletedIds.length > 0) setStudio(null)
        },
      })
    },
    [forget, notify]
  )

  const handleConfirm = async () => {
    if (!confirmState || confirmBusy) return

    setConfirmBusy(true)
    try {
      await confirmState.action()
    } finally {
      setConfirmBusy(false)
      setConfirmState(null)
    }
  }

  const handleSignOut = async () => {
    try {
      await getSupabase().auth.signOut()
      router.push('/login')
    } catch {
      notify('error', 'Could not sign out. Please try again.')
    }
  }

  const handleRetry = () => {
    setLoading(true)
    setError(null)
    loadSnippets()
      .catch(() => setError('Could not open your vault. Check your connection and try again.'))
      .finally(() => setLoading(false))
  }

  const emptyState = (() => {
    if (activeView === 'archive') {
      return {
        title: 'Archive is empty',
        text: 'Snippets you move to the archive will wait here until you restore or delete them.',
        actionLabel: 'Back to vault',
        onAction: () => handleViewChange('all'),
      }
    }

    if (activeView === 'favorites') {
      return {
        title: 'No favorites yet',
        text: 'Star the snippets you reach for most and they will be pinned here.',
        actionLabel: 'Browse all snippets',
        onAction: () => handleViewChange('all'),
      }
    }

    if (hasFilters || searchQuery.trim()) {
      return {
        title: 'No crates match this scope',
        text: 'Try a different language, tag, or search phrase. The active scope is shown above the grid.',
        actionLabel: 'Clear scope',
        onAction: handleClearScope,
      }
    }

    return {
      title: 'Your vault is empty',
      text: 'Add your first snippet and start building a searchable workbench for the code you reuse.',
      actionLabel: 'Create first snippet',
      onAction: () => setStudio({ mode: 'create' }),
    }
  })()

  if (loading) {
    return (
      <div className="vault-loading">
        <div className="loading-card">
          <span className="brand-mark" aria-hidden="true">
            <Icon name="box" size={21} />
          </span>
          <span className="spinner" />
          <span>Opening your vault...</span>
        </div>
      </div>
    )
  }

  if (error && snippets.length === 0) {
    return (
      <div className="vault-loading">
        <div className="empty-state error-state">
          <span className="empty-icon is-danger">
            <Icon name="alert" size={24} />
          </span>
          <h2 className="empty-title">The vault did not open</h2>
          <p className="empty-text">{error}</p>
          <button type="button" className="btn btn-primary" onClick={handleRetry}>
            <Icon name="refresh" size={14} />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!user) return null

  const editingSnippet = studio?.mode === 'edit' ? studio.snippet ?? null : null
  const initialCrateId = editingSnippet
    ? meta.crates[editingSnippet.id] ?? 'personal-vault'
    : crateFilter ?? 'personal-vault'
  const initialDescription = editingSnippet ? meta.descriptions[editingSnippet.id] ?? '' : ''

  return (
    <div className="app-shell">
      <Sidebar
        isOpen={sidebarOpen}
        activeView={activeView}
        crateFilter={crateFilter}
        languageFilter={languageFilter}
        tagFilter={tagFilter}
        counts={counts}
        crates={crateItems}
        languages={languageItems}
        popularTags={popularTags}
        snippetCount={snippets.length}
        storageBytes={storageBytes}
        onViewChange={handleViewChange}
        onCrateSelect={handleCrateSelect}
        onLanguageSelect={handleLanguageSelect}
        onTagSelect={handleTagSelect}
        onAddCrate={handleAddCrate}
        onClose={() => setSidebarOpen(false)}
      />

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      <div className="main-col">
        <TopBar
          user={user}
          query={searchQuery}
          languageFilter={languageFilter}
          tagFilter={tagFilter}
          languages={languageItems}
          tags={tagItems}
          onQueryChange={setSearchQuery}
          onLanguageFilter={setLanguageFilter}
          onTagFilter={setTagFilter}
          onNewSnippet={() => setStudio({ mode: 'create' })}
          onSignOut={() => void handleSignOut()}
          onOpenSidebar={() => setSidebarOpen(true)}
          onToggleTheme={toggleTheme}
        />

        <main className="workspace">
          <div className="workspace-bar">
            <div className="breadcrumb">
              <span className="breadcrumb-root">Workspace</span>
              <span className="breadcrumb-sep">/</span>
              <h1 className="breadcrumb-current">{viewTitle}</h1>
              <span className="count-badge">
                {filteredSnippets.length} {activeView === 'archive' ? 'Archived' : 'Active'}
              </span>
            </div>

            {/* <div className="sync-pill">
              <span className="status-dot" />
              <span>{lastSyncedAt ? `Index synced ${formatTime(lastSyncedAt)}` : 'Index syncing...'}</span>
              <span className="sync-meta">
                {snippets.length} {pluralize(snippets.length, 'crate')} indexed
              </span>
            </div> */}
          </div>

          <Toolbar
            density={density}
            sortMode={sortMode}
            selectedCount={selectedIds.size}
            allSelected={allSelected}
            someSelected={someSelected}
            totalCount={sortedSnippets.length}
            activeViewIsArchive={activeView === 'archive'}
            copyStats={copyStats}
            onDensityChange={setDensity}
            onSortChange={setSortMode}
            onToggleSelectAll={handleToggleSelectAll}
            onExport={handleExport}
            onBulkArchive={handleBulkArchive}
            onBulkDelete={handleBulkDelete}
            onClearSelection={() => setSelectedIds(new Set())}
          />

          <ScopeBar chips={scopeChips} onClear={handleClearScope} />

          {visibleSnippets.length > 0 ? (
            <div className={`crate-grid ${density === 'dense' ? 'is-dense' : ''}`}>
              {visibleSnippets.map((snippet) => {
                const crateId = meta.crates[snippet.id] ?? 'personal-vault'
                return (
                  <SnippetCard
                    key={snippet.id}
                    snippet={snippet}
                    meta={meta}
                    crateName={crateNames.get(crateId) ?? 'Personal Vault'}
                    theme={theme}
                    highlighter={highlighter}
                    selected={selectedIds.has(snippet.id)}
                    archived={archivedSet.has(snippet.id)}
                    favorite={favoriteSet.has(snippet.id)}
                    activeTag={tagFilter}
                    onToggleSelect={handleToggleSelect}
                    onToggleFavorite={toggleFavorite}
                    onCopy={handleCopy}
                    onEdit={(item) => setStudio({ mode: 'edit', snippet: item })}
                    onDuplicate={(item) => void handleDuplicate(item)}
                    onDelete={(item) => requestDelete([item])}
                    onToggleArchive={handleToggleArchive}
                    onTagClick={handleTagSelect}
                  />
                )
              })}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">
                <Icon name={activeView === 'archive' ? 'archive' : 'box'} size={25} />
              </span>
              <h2 className="empty-title">{emptyState.title}</h2>
              <p className="empty-text">{emptyState.text}</p>
              <button type="button" className="btn btn-primary" onClick={emptyState.onAction}>
                <Icon name={hasFilters ? 'x' : activeView === 'all' ? 'plus' : 'box'} size={14} />
                {emptyState.actionLabel}
              </button>
            </div>
          )}

          <StatusBar
            page={safePage}
            totalPages={totalPages}
            rendered={visibleSnippets.length}
            total={sortedSnippets.length}
            storageLabel={formatBytes(storageBytes)}
            lastSyncedAt={lastSyncedAt}
            onPageChange={setPage}
          />

          {/* <div className="workspace-footnote">
            <span>Showing {filteredSnippets.length} of {snippets.length} snippets</span>
            <span>·</span>
            <span>{formatDate(new Date())}</span>
            <span>·</span>
            <span>Favorites, notes, and crates are cached locally per user.</span>
          </div> */}
        </main>
      </div>

      {studio && (
        <SnippetStudio
          key={studio.mode === 'edit' ? studio.snippet?.id ?? 'edit' : 'new'}
          mode={studio.mode}
          snippet={editingSnippet}
          crates={crates}
          initialCrateId={initialCrateId}
          initialDescription={initialDescription}
          highlighter={highlighter}
          theme={theme}
          saving={saving}
          onClose={() => setStudio(null)}
          onSubmit={handleStudioSubmit}
          onDelete={editingSnippet ? () => requestDelete([editingSnippet], true) : undefined}
          onNotify={notify}
        />
      )}

      {confirmState && (
        <ConfirmDialog
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          tone={confirmState.tone}
          busy={confirmBusy}
          onCancel={() => {
            if (!confirmBusy) setConfirmState(null)
          }}
          onConfirm={() => void handleConfirm()}
        />
      )}

      <Toasts toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
