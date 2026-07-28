'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '../../lib/supabase-browser'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createHighlighter, type Highlighter } from 'shiki'

interface Snippet {
  id: string
  title: string
  content: string
  language: string
  tags: string[]
  created_at: string
}

const LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'cpp',
  'css', 'html', 'json', 'markdown', 'sql', 'bash', 'yaml',
]

function KebabIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="8" cy="3" r="1.5" />
      <circle cx="8" cy="8" r="1.5" />
      <circle cx="8" cy="13" r="1.5" />
    </svg>
  )
}

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Form states
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [tags, setTags] = useState('')
  const [content, setContent] = useState('')
  const [creating, setCreating] = useState(false)

  // Shiki states
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null)
  const [highlightedCode, setHighlightedCode] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const preRef = useRef<HTMLDivElement>(null)

  // Kebab menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  // Edit modal state
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editLanguage, setEditLanguage] = useState('javascript')
  const [editTags, setEditTags] = useState('')
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)
  const editTextareaRef = useRef<HTMLTextAreaElement>(null)
  const editPreRef = useRef<HTMLDivElement>(null)
  const [editHighlightedCode, setEditHighlightedCode] = useState('')

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (!user) {
        router.push('/login')
      } else {
        fetchSnippets()
      }
      setLoading(false)
    }
    getUser()
  }, [])

  useEffect(() => {
    const initHighlighter = async () => {
      try {
        const h = await createHighlighter({
          themes: ['github-dark', 'github-light', 'nord', 'dracula', 'monokai'],
          langs: LANGUAGES,
        })
        setHighlighter(h)
      } catch (error) {
        console.error('Failed to initialize highlighter:', error)
      }
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDarkMode(mediaQuery.matches)
    const handleThemeChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches)
    mediaQuery.addEventListener('change', handleThemeChange)
    initHighlighter()
    return () => mediaQuery.removeEventListener('change', handleThemeChange)
  }, [])

  // Close kebab menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openMenuId && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenuId])

  // Highlight create form code
  useEffect(() => {
    const id = setTimeout(() => {
      if (!highlighter || !content) { setHighlightedCode(''); return }
      try {
        const html = highlighter.codeToHtml(content, {
          lang: language.toLowerCase(),
          theme: isDarkMode ? 'github-dark' : 'github-light',
        })
        const doc = new DOMParser().parseFromString(html, 'text/html')
        setHighlightedCode(doc.querySelector('pre')?.innerHTML || '')
      } catch {
        setHighlightedCode(content)
      }
    }, 1)
    return () => clearTimeout(id)
  }, [content, language, isDarkMode, highlighter])

  // Highlight edit modal code
  useEffect(() => {
    const id = setTimeout(() => {
      if (!highlighter || !editContent) { setEditHighlightedCode(''); return }
      try {
        const html = highlighter.codeToHtml(editContent, {
          lang: editLanguage.toLowerCase(),
          theme: isDarkMode ? 'github-dark' : 'github-light',
        })
        const doc = new DOMParser().parseFromString(html, 'text/html')
        setEditHighlightedCode(doc.querySelector('pre')?.innerHTML || '')
      } catch {
        setEditHighlightedCode(editContent)
      }
    }, 1)
    return () => clearTimeout(id)
  }, [editContent, editLanguage, isDarkMode, highlighter])

  const fetchSnippets = async (search?: string) => {
    try {
      const url = search ? `/api/snippets?search=${encodeURIComponent(search)}` : '/api/snippets'
      const res = await fetch(url)
      if (res.ok) setSnippets(await res.json())
    } catch (error) {
      console.error('Error fetching snippets:', error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchSnippets(searchQuery)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleCreateSnippet = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          language,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          content,
        }),
      })
      if (res.ok) {
        setTitle(''); setLanguage('javascript'); setTags(''); setContent('')
        setShowCreateForm(false)
        fetchSnippets()
      } else {
        alert('Failed to create snippet!')
      }
    } catch (error) {
      console.error('Error creating snippet:', error)
      alert('Error creating snippet!')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteSnippet = async (id: string) => {
    setOpenMenuId(null)
    if (!confirm('Delete this snippet?')) return
    try {
      const res = await fetch(`/api/snippets/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setSnippets(prev => prev.filter(s => s.id !== id))
        setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next })
      } else {
        alert('Failed to delete snippet.')
      }
    } catch (error) {
      console.error('Error deleting snippet:', error)
      alert('Error deleting snippet.')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Delete ${selectedIds.size} selected snippet${selectedIds.size > 1 ? 's' : ''}?`)) return
    setBulkDeleting(true)
    try {
      await Promise.all(
        Array.from(selectedIds).map(id =>
          fetch(`/api/snippets/${id}`, { method: 'DELETE' })
        )
      )
      setSnippets(prev => prev.filter(s => !selectedIds.has(s.id)))
      setSelectedIds(new Set())
    } catch (error) {
      console.error('Error bulk deleting snippets:', error)
      alert('Some snippets could not be deleted.')
    } finally {
      setBulkDeleting(false)
    }
  }

  const openEditModal = (snippet: Snippet) => {
    setOpenMenuId(null)
    setEditingSnippet(snippet)
    setEditTitle(snippet.title)
    setEditLanguage(snippet.language)
    setEditTags(snippet.tags.join(', '))
    setEditContent(snippet.content)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSnippet) return
    setSaving(true)
    try {
      const res = await fetch(`/api/snippets/${editingSnippet.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          language: editLanguage,
          tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
          content: editContent,
        }),
      })
      if (res.ok) {
        const updated: Snippet = await res.json()
        setSnippets(prev => prev.map(s => s.id === updated.id ? updated : s))
        setEditingSnippet(null)
      } else {
        alert('Failed to save changes.')
      }
    } catch (error) {
      console.error('Error updating snippet:', error)
      alert('Error saving changes.')
    } finally {
      setSaving(false)
    }
  }

  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop
      preRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }

  const handleEditScroll = () => {
    if (editTextareaRef.current && editPreRef.current) {
      editPreRef.current.scrollTop = editTextareaRef.current.scrollTop
      editPreRef.current.scrollLeft = editTextareaRef.current.scrollLeft
    }
  }

  const makeKeyDownHandler = (
    getValue: () => string,
    setValue: (v: string) => void,
    ref: React.RefObject<HTMLTextAreaElement | null>
  ) => (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.currentTarget.selectionStart
      const end = e.currentTarget.selectionEnd
      const next = getValue().substring(0, start) + '  ' + getValue().substring(end)
      setValue(next)
      setTimeout(() => {
        if (ref.current) ref.current.selectionStart = ref.current.selectionEnd = start + 2
      }, 0)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === snippets.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(snippets.map(s => s.id)))
    }
  }

  const codeEditorStyle: React.CSSProperties = {
    lineHeight: '1.5',
    fontSize: '14px',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) return null

  const allSelected = snippets.length > 0 && selectedIds.size === snippets.length
  const someSelected = selectedIds.size > 0

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-zinc-900">CodeCrate</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-600">Welcome, {user.user_metadata?.full_name || user.email}</span>
              <button onClick={handleSignOut} className="text-sm text-zinc-600 hover:text-zinc-900">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search + New Snippet */}
        <div className="mb-8">
          <div className="flex gap-4 mb-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="Search snippets by title or tags..."
                className="flex-1 p-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="px-6 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800">
                Search
              </button>
            </form>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {showCreateForm ? 'Cancel' : 'New Snippet'}
            </button>
          </div>

          {showCreateForm && (
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
              <h2 className="text-xl font-semibold mb-4">Create New Snippet</h2>
              <form onSubmit={handleCreateSnippet} className="space-y-4">
                <input
                  type="text"
                  placeholder="Title"
                  className="w-full p-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
                <select
                  className="w-full p-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  required
                >
                  {LANGUAGES.map(l => (
                    <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Tags (comma-separated)"
                  className="w-full p-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
                <div className="relative">
                  <div
                    ref={preRef}
                    className="absolute top-0 left-0 w-full h-48 p-3 pointer-events-none overflow-auto rounded-lg"
                    style={codeEditorStyle}
                  >
                    <pre className="shiki" style={{ backgroundColor: 'transparent' }}>
                      <code dangerouslySetInnerHTML={{ __html: highlightedCode || '<span></span>' }} />
                    </pre>
                  </div>
                  <textarea
                    ref={textareaRef}
                    placeholder="Write your code here..."
                    className="w-full p-3 border border-zinc-300 rounded-lg h-48 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-transparent"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={makeKeyDownHandler(() => content, setContent, textareaRef)}
                    onScroll={handleScroll}
                    spellCheck={false}
                    required
                    style={{
                      ...codeEditorStyle,
                      color: 'rgba(0,0,0,0.1)',
                      position: 'relative',
                      backgroundColor: 'transparent',
                      caretColor: isDarkMode ? 'white' : 'black',
                      WebkitTextFillColor: 'transparent',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create Snippet'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Bulk actions toolbar */}
        {snippets.length > 0 && (
          <div className="flex items-center gap-3 mb-4">
            <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-zinc-600">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded accent-blue-600"
              />
              {allSelected ? 'Deselect all' : 'Select all'}
            </label>
            {someSelected && (
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                  <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                </svg>
                {bulkDeleting ? 'Deleting...' : `Delete ${selectedIds.size} selected`}
              </button>
            )}
          </div>
        )}

        {/* Snippet grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {snippets.map((snippet) => {
            let highlightedSnippet = snippet.content
            if (highlighter) {
              try {
                highlightedSnippet = highlighter.codeToHtml(snippet.content, {
                  lang: snippet.language.toLowerCase(),
                  theme: isDarkMode ? 'github-dark' : 'github-light',
                })
              } catch {
                highlightedSnippet = `<pre><code>${snippet.content}</code></pre>`
              }
            }

            const isSelected = selectedIds.has(snippet.id)

            return (
              <div
                key={snippet.id}
                className={`bg-white p-6 rounded-lg shadow-sm border transition-colors ${isSelected ? 'ring-2 ring-blue-500 border-blue-300' : ''}`}
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(snippet.id)}
                      className="mt-1 w-4 h-4 flex-shrink-0 rounded accent-blue-600 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-zinc-900 truncate">{snippet.title}</h3>
                      <span className="text-sm text-zinc-500">{snippet.language}</span>
                    </div>
                  </div>

                  {/* Kebab menu */}
                  <div className="relative flex-shrink-0" ref={openMenuId === snippet.id ? menuRef : undefined}>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === snippet.id ? null : snippet.id)}
                      className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                      aria-label="Options"
                    >
                      <KebabIcon />
                    </button>
                    {openMenuId === snippet.id && (
                      <div className="absolute right-0 top-8 z-10 w-36 bg-white border border-zinc-200 rounded-lg shadow-lg py-1">
                        <button
                          onClick={() => openEditModal(snippet)}
                          className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2"
                        >
                          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSnippet(snippet.id)}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                          </svg>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {snippet.tags.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {snippet.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-zinc-100 text-zinc-700 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div
                  className="snippet-code text-sm overflow-x-auto rounded"
                  dangerouslySetInnerHTML={{ __html: highlightedSnippet }}
                />

                <div className="mt-3 text-xs text-zinc-500">
                  {new Date(snippet.created_at).toLocaleDateString()}
                </div>
              </div>
            )
          })}
        </div>

        {snippets.length === 0 && (
          <div className="text-center py-12">
            <p className="text-zinc-500">
              {searchQuery ? 'No snippets found for your search.' : 'No snippets yet. Create your first one!'}
            </p>
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {editingSnippet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-zinc-900">Edit Snippet</h2>
              <button
                onClick={() => setEditingSnippet(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <input
                type="text"
                placeholder="Title"
                className="w-full p-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
              />
              <select
                className="w-full p-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={editLanguage}
                onChange={(e) => setEditLanguage(e.target.value)}
              >
                {LANGUAGES.map(l => (
                  <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Tags (comma-separated)"
                className="w-full p-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
              />
              <div className="relative">
                <div
                  ref={editPreRef}
                  className="absolute top-0 left-0 w-full h-48 p-3 pointer-events-none overflow-auto rounded-lg"
                  style={codeEditorStyle}
                >
                  <pre className="shiki" style={{ backgroundColor: 'transparent' }}>
                    <code dangerouslySetInnerHTML={{ __html: editHighlightedCode || '<span></span>' }} />
                  </pre>
                </div>
                <textarea
                  ref={editTextareaRef}
                  placeholder="Write your code here..."
                  className="w-full p-3 border border-zinc-300 rounded-lg h-48 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={makeKeyDownHandler(() => editContent, setEditContent, editTextareaRef)}
                  onScroll={handleEditScroll}
                  spellCheck={false}
                  required
                  style={{
                    ...codeEditorStyle,
                    color: 'rgba(0,0,0,0.1)',
                    position: 'relative',
                    backgroundColor: 'transparent',
                    caretColor: isDarkMode ? 'white' : 'black',
                    WebkitTextFillColor: 'transparent',
                  }}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSnippet(null)}
                  className="flex-1 px-4 py-3 border border-zinc-300 text-zinc-700 rounded-lg hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
