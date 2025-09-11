
'use client'

import { useState, useEffect, useRef } from 'react'
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
        const highlighterInstance = await createHighlighter({
          themes: ['github-dark', 'github-light', 'nord', 'dracula', 'monokai'],
          langs: ['javascript', 'typescript', 'python', 'java', 'cpp', 'css', 'html', 'json', 'markdown', 'sql', 'bash', 'yaml'],
        })
        setHighlighter(highlighterInstance)
      } catch (error) {
        console.error('Failed to initialize highlighter:', error)
      }
    }

    // Detect system theme preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDarkMode(mediaQuery.matches)

    const handleThemeChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches)
    }

    mediaQuery.addEventListener('change', handleThemeChange)
    initHighlighter()

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange)
    }
  }, [])

  useEffect(() => {
    if (highlighter && content) {
      try {
        const highlighted = highlighter.codeToHtml(content, {
          lang: language.toLowerCase(),
          theme: isDarkMode ? 'github-dark' : 'github-light'
        })
        setHighlightedCode(highlighted)
      } catch (error) {
        console.error('Highlighting error:', error)
        setHighlightedCode(`<pre><code>${content}</code></pre>`)
      }
    } else {
      setHighlightedCode('')
    }
  }, [highlighter, content, language, isDarkMode])

  const fetchSnippets = async (search?: string) => {
    try {
      const url = search ? `/api/snippets?search=${encodeURIComponent(search)}` : '/api/snippets'
      const res = await fetch(url)
      
      if (res.ok) {
        const data = await res.json()
        setSnippets(data)
      }
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
          tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
          content,
        }),
      })

      if (res.ok) {
        setTitle('')
        setLanguage('javascript')
        setTags('')
        setContent('')
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

  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop
      preRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-zinc-900">CodeCrate</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-600">Welcome, {user.user_metadata?.full_name || user.email}</span>
              <button
                onClick={handleSignOut}
                className="text-sm text-zinc-600 hover:text-zinc-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <button
                type="submit"
                className="px-6 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800"
              >
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
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="css">CSS</option>
                  <option value="html">HTML</option>
                  <option value="json">JSON</option>
                  <option value="markdown">Markdown</option>
                  <option value="sql">SQL</option>
                  <option value="bash">Bash</option>
                  <option value="yaml">YAML</option>
                </select>
                <input
                  type="text"
                  placeholder="Tags (comma-separated)"
                  className="w-full p-3 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
                <div className="relative">
                  {highlightedCode ? (
                    <div className="relative">
                      <textarea
                        ref={textareaRef}
                        placeholder="Write your code here..."
                        className="w-full p-3 border border-zinc-300 rounded-lg h-48 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-transparent relative z-10 text-transparent caret-black"
                        value={content}
                        onChange={handleInput}
                        onScroll={handleScroll}
                        required
                        style={{
                          color: 'transparent',
                          caretColor: '#000',
                          lineHeight: '1.5',
                          fontSize: '14px',
                          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
                        }}
                      />
                      <div
                        ref={preRef}
                        className="absolute top-0 left-0 w-full h-48 p-3 pointer-events-none overflow-auto rounded-lg border border-transparent"
                        style={{
                          lineHeight: '1.5',
                          fontSize: '14px',
                          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
                        }}
                        dangerouslySetInnerHTML={{
                          __html: highlightedCode
                        }}
                      />
                    </div>
                  ) : (
                    <textarea
                      ref={textareaRef}
                      placeholder="Write your code here..."
                      className="w-full p-3 border border-zinc-300 rounded-lg h-48 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white text-gray-900"
                      value={content}
                      onChange={handleInput}
                      required
                      style={{
                        lineHeight: '1.5',
                        fontSize: '14px',
                        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
                      }}
                    />
                  )}
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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {snippets.map((snippet) => {
            let highlightedSnippet = snippet.content
            if (highlighter) {
              try {
                highlightedSnippet = highlighter.codeToHtml(snippet.content, {
                  lang: snippet.language.toLowerCase(),
                  theme: isDarkMode ? 'github-dark' : 'github-light'
                })
              } catch (error) {
                console.error('Snippet highlighting error:', error)
                highlightedSnippet = `<pre><code>${snippet.content}</code></pre>`
              }
            }
            
            return (
              <div key={snippet.id} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-zinc-900">{snippet.title}</h3>
                  <span className="text-sm text-zinc-500">{snippet.language}</span>
                </div>
                
                {snippet.tags.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {snippet.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-zinc-100 text-zinc-700 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div
                  className="snippet-code text-sm overflow-x-auto rounded"
                  dangerouslySetInnerHTML={{
                    __html: highlightedSnippet
                  }}
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
    </div>
  )
}
