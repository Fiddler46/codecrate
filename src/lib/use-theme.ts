'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ThemeMode } from './types'

const THEME_KEY = 'codecrate-theme'
const THEME_EVENT = 'codecrate:themechange'

export function readTheme(): ThemeMode {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return

  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme

  try {
    window.localStorage.setItem(THEME_KEY, theme)
  } catch {
    // Storage can be unavailable in private browsing; the theme still applies.
  }

  window.dispatchEvent(new CustomEvent<ThemeMode>(THEME_EVENT, { detail: theme }))
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>('dark')

  useEffect(() => {
    setTheme(readTheme())

    const handleThemeChange = (event: Event) => {
      setTheme((event as CustomEvent<ThemeMode>).detail)
    }

    window.addEventListener(THEME_EVENT, handleThemeChange)
    return () => window.removeEventListener(THEME_EVENT, handleThemeChange)
  }, [])

  const toggle = useCallback(() => {
    applyTheme(readTheme() === 'dark' ? 'light' : 'dark')
  }, [])

  return { theme, toggle }
}
