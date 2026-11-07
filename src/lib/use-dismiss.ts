'use client'

import { useEffect, useRef } from 'react'

/**
 * Returns a ref for a popover. While active, clicking outside or pressing
 * Escape dismisses it. Used by the filter, sort, and account menus.
 */
export function useDismiss<T extends HTMLElement = HTMLDivElement>(active: boolean, onDismiss: () => void) {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!active) return

    const handlePointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onDismiss()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [active, onDismiss])

  return ref
}
