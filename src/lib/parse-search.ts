import { LANGUAGE_ALIASES } from './constants'
import { normalizeTag } from './format'

export interface ParsedSearch {
  text: string
  languages: string[]
  tags: string[]
  crates: string[]
}

function normalizeLanguage(value: string): string {
  const clean = value.toLowerCase().replace(/^["']|["']$/g, '')
  return LANGUAGE_ALIASES[clean] ?? clean
}

/**
 * Supports a lightweight query language alongside free text:
 *   lang:typescript tag:auth crate:node-backend bearer interceptor
 */
export function parseSearchQuery(raw: string): ParsedSearch {
  const tokens = raw.match(/(?:[^\s"]+|"[^"]*")+/g) ?? []
  const text: string[] = []
  const languages: string[] = []
  const tags: string[] = []
  const crates: string[] = []

  for (const token of tokens) {
    const clean = token.replace(/^["']|["']$/g, '')
    const lower = clean.toLowerCase()

    if (lower.startsWith('lang:')) {
      const value = normalizeLanguage(clean.slice(5))
      if (value && value !== '*') languages.push(value)
      continue
    }

    if (lower.startsWith('tag:')) {
      const value = normalizeTag(clean.slice(4))
      if (value) tags.push(value)
      continue
    }

    if (lower.startsWith('crate:')) {
      const value = clean.slice(6).toLowerCase()
      if (value && value !== '*') crates.push(value)
      continue
    }

    text.push(clean)
  }

  return {
    text: text.join(' ').toLowerCase(),
    languages,
    tags,
    crates,
  }
}
