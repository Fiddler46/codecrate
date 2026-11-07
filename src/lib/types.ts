export interface Snippet {
  id: string
  title: string
  content: string
  language: string
  tags: string[]
  created_at: string
}

export interface Crate {
  id: string
  name: string
  icon: string
}

/**
 * Metadata that is not part of the snippets table yet. It lives in local
 * storage, scoped per user, so the redesigned workbench can offer favorites,
 * crates, notes, versions, and copy counters without a database migration.
 */
export interface VaultMeta {
  favorites: string[]
  archived: string[]
  crates: Record<string, string>
  descriptions: Record<string, string>
  versions: Record<string, number>
  updatedAt: Record<string, string>
  copies: Record<string, number>
  copyLog: number[]
  customCrates: Crate[]
}

export type ThemeMode = 'light' | 'dark'
export type ViewMode = 'all' | 'favorites' | 'recent' | 'archive'
export type Density = 'crates' | 'dense'
export type SortMode = 'updated' | 'created' | 'title' | 'language'
export type ToastTone = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: number
  tone: ToastTone
  message: string
}

export interface SnippetDraft {
  title: string
  language: string
  tags: string[]
  content: string
  crateId: string
  description: string
}

export interface ScopeChip {
  key: string
  type: 'search' | 'language' | 'tag' | 'crate' | 'view'
  label: string
  value: string
  onClear: () => void
}
