// app/snippets/new/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewSnippetPage() {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState('')
  const [tags, setTags] = useState('')
  const [content, setContent] = useState('')

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/snippets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        language,
        tags: tags.split(',').map(tag => tag.trim()),
        content,
      }),
    })

    setLoading(false)

    if (res.ok) {
      router.push('/')
    } else {
      alert('Something went wrong!')
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-4">
      <h1 className="text-2xl font-semibold mb-4">Create New Snippet</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Title"
          className="p-2 border rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Language (e.g. JavaScript)"
          className="p-2 border rounded"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Tags (comma-separated)"
          className="p-2 border rounded"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <textarea
          placeholder="Code..."
          className="p-2 border rounded h-48 font-mono"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Snippet'}
        </button>
      </form>
    </div>
  )
}
