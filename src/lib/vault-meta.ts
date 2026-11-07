'use client'

import { useCallback, useEffect, useState } from 'react'
import { slugify } from './format'
import type { Crate, VaultMeta } from './types'

const STORAGE_PREFIX = 'codecrate:vault:'

export function createEmptyMeta(): VaultMeta {
  return {
    favorites: [],
    archived: [],
    crates: {},
    descriptions: {},
    versions: {},
    updatedAt: {},
    copies: {},
    copyLog: [],
    customCrates: [],
  }
}

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function toNumberRecord(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {}

  const result: Record<string, number> = {}
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'number' && Number.isFinite(entry)) result[key] = entry
  }
  return result
}

function toStringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {}

  const result: Record<string, string> = {}
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'string') result[key] = entry
  }
  return result
}

function toCrates(value: unknown): Crate[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    if (!isRecord(item)) return []
    if (typeof item.id !== 'string' || typeof item.name !== 'string') return []
    return [{ id: item.id, name: item.name, icon: typeof item.icon === 'string' ? item.icon : 'folder' }]
  })
}

function sanitizeMeta(value: unknown): VaultMeta {
  const empty = createEmptyMeta()
  if (!isRecord(value)) return empty

  return {
    favorites: toStringArray(value.favorites),
    archived: toStringArray(value.archived),
    crates: toStringRecord(value.crates),
    descriptions: toStringRecord(value.descriptions),
    versions: toNumberRecord(value.versions),
    updatedAt: toStringRecord(value.updatedAt),
    copies: toNumberRecord(value.copies),
    copyLog: Array.isArray(value.copyLog)
      ? value.copyLog.filter((entry): entry is number => typeof entry === 'number')
      : [],
    customCrates: toCrates(value.customCrates),
  }
}

function loadMeta(userId: string): VaultMeta {
  try {
    const raw = window.localStorage.getItem(storageKey(userId))
    return raw ? sanitizeMeta(JSON.parse(raw)) : createEmptyMeta()
  } catch {
    return createEmptyMeta()
  }
}

function withoutKeys<T>(record: Record<string, T>, keys: Set<string>): Record<string, T> {
  const next = { ...record }
  for (const key of keys) delete next[key]
  return next
}

export function useVaultMeta(userId: string | null) {
  const [meta, setMeta] = useState<VaultMeta>(createEmptyMeta)
  const [loadedFor, setLoadedFor] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setMeta(createEmptyMeta())
      setLoadedFor(null)
      return
    }

    setMeta(loadMeta(userId))
    setLoadedFor(userId)
  }, [userId])

  useEffect(() => {
    if (!userId || loadedFor !== userId) return

    try {
      window.localStorage.setItem(storageKey(userId), JSON.stringify(meta))
    } catch {
      // A full or unavailable local store should not break the workbench.
    }
  }, [meta, loadedFor, userId])

  const toggleFavorite = useCallback((id: string) => {
    setMeta((current) => {
      const isFavorite = current.favorites.includes(id)
      return {
        ...current,
        favorites: isFavorite
          ? current.favorites.filter((favorite) => favorite !== id)
          : [...current.favorites, id],
      }
    })
  }, [])

  const archive = useCallback((ids: string[]) => {
    setMeta((current) => ({
      ...current,
      archived: Array.from(new Set([...current.archived, ...ids])),
    }))
  }, [])

  const restore = useCallback((ids: string[]) => {
    const idSet = new Set(ids)
    setMeta((current) => ({
      ...current,
      archived: current.archived.filter((id) => !idSet.has(id)),
    }))
  }, [])

  const toggleArchived = useCallback((id: string) => {
    setMeta((current) => ({
      ...current,
      archived: current.archived.includes(id)
        ? current.archived.filter((archivedId) => archivedId !== id)
        : [...current.archived, id],
    }))
  }, [])

  const setCrate = useCallback((id: string, crateId: string) => {
    setMeta((current) => ({
      ...current,
      crates: { ...current.crates, [id]: crateId },
    }))
  }, [])

  const setDescription = useCallback((id: string, description: string) => {
    setMeta((current) => {
      const descriptions = { ...current.descriptions }
      if (description.trim()) descriptions[id] = description.trim()
      else delete descriptions[id]
      return { ...current, descriptions }
    })
  }, [])

  const recordCopy = useCallback((id: string) => {
    const now = Date.now()
    setMeta((current) => ({
      ...current,
      copies: { ...current.copies, [id]: (current.copies[id] ?? 0) + 1 },
      copyLog: [...current.copyLog, now].slice(-500),
    }))
  }, [])

  const markCreated = useCallback((id: string, crateId: string, description: string) => {
    const now = new Date().toISOString()
    setMeta((current) => ({
      ...current,
      crates: { ...current.crates, [id]: crateId },
      descriptions: description.trim()
        ? { ...current.descriptions, [id]: description.trim() }
        : current.descriptions,
      versions: { ...current.versions, [id]: 1 },
      updatedAt: { ...current.updatedAt, [id]: now },
    }))
  }, [])

  const markSaved = useCallback((id: string, crateId: string, description: string) => {
    const now = new Date().toISOString()
    setMeta((current) => ({
      ...current,
      crates: { ...current.crates, [id]: crateId },
      descriptions: description.trim()
        ? { ...current.descriptions, [id]: description.trim() }
        : withoutKeys(current.descriptions, new Set([id])),
      versions: { ...current.versions, [id]: (current.versions[id] ?? 1) + 1 },
      updatedAt: { ...current.updatedAt, [id]: now },
    }))
  }, [])

  const forget = useCallback((ids: string[]) => {
    const idSet = new Set(ids)
    setMeta((current) => ({
      ...current,
      favorites: current.favorites.filter((id) => !idSet.has(id)),
      archived: current.archived.filter((id) => !idSet.has(id)),
      crates: withoutKeys(current.crates, idSet),
      descriptions: withoutKeys(current.descriptions, idSet),
      versions: withoutKeys(current.versions, idSet),
      updatedAt: withoutKeys(current.updatedAt, idSet),
      copies: withoutKeys(current.copies, idSet),
    }))
  }, [])

  const addCrate = useCallback(
    (name: string): Crate | null => {
      const trimmed = name.trim()
      if (!trimmed) return null

      const id = slugify(trimmed)
      const exists = meta.customCrates.some((crate) => crate.id === id) ||
        ['personal-vault', 'frontend-ui', 'node-backend', 'devops-scripts'].includes(id)

      if (exists) return null

      const crate: Crate = { id, name: trimmed, icon: 'folder' }
      setMeta((current) => ({ ...current, customCrates: [...current.customCrates, crate] }))
      return crate
    },
    [meta.customCrates]
  )

  return {
    meta,
    toggleFavorite,
    archive,
    restore,
    toggleArchived,
    setCrate,
    setDescription,
    recordCopy,
    markCreated,
    markSaved,
    forget,
    addCrate,
  }
}
