'use client'

import { useState } from 'react'
import { TAG_SUGGESTIONS } from '../../lib/constants'
import { normalizeTag } from '../../lib/format'
import { Icon } from './Icon'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
}

export function TagInput({ value, onChange, suggestions = TAG_SUGGESTIONS }: TagInputProps) {
  const [input, setInput] = useState('')

  const addTag = (raw: string) => {
    const tag = normalizeTag(raw)
    if (!tag) return

    if (!value.some((existing) => existing.toLowerCase() === tag)) {
      onChange([...value, tag])
    }
    setInput('')
  }

  const removeTag = (tag: string) => {
    onChange(value.filter((existing) => existing !== tag))
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTag(input)
      return
    }

    if (event.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  const availableSuggestions = suggestions
    .filter((suggestion) => !value.some((tag) => tag.toLowerCase() === suggestion))
    .slice(0, 4)

  return (
    <div>
      <div className="tag-input-shell">
        {value.map((tag) => (
          <span className="tag-input-chip" key={tag}>
            #{tag}
            <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag} tag`}>
              <Icon name="x" size={11} />
            </button>
          </span>
        ))}

        <input
          className="tag-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="+ add tag..."
          aria-label="Add a tag"
          spellCheck={false}
        />
      </div>

      {availableSuggestions.length > 0 && (
        <div className="tag-suggestions">
          <span className="tag-suggestions-label">Suggest:</span>
          {availableSuggestions.map((suggestion) => (
            <button
              type="button"
              className="tag-suggestion"
              key={suggestion}
              onClick={() => addTag(suggestion)}
            >
              + #{suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
