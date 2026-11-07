import { FALLBACK_LANGUAGE, LANGUAGE_MAP } from './constants'
import type { LanguageMeta } from './constants'

export function formatDate(value: string | number | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatTime(value: string | number | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '--:--'

  return new Intl.DateTimeFormat([], {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'untitled'
}

export function getLanguage(languageId: string): LanguageMeta {
  return LANGUAGE_MAP[languageId] ?? FALLBACK_LANGUAGE
}

export function buildFilename(title: string, languageId: string): string {
  const language = getLanguage(languageId)
  return `vault/${slugify(title)}.${language.extension}`
}

export function normalizeTag(value: string): string {
  return value
    .trim()
    .replace(/^#+/, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9_\-.]/g, '')
    .toLowerCase()
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
