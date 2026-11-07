'use client'

import { useEffect } from 'react'
import type { ToastMessage, ToastTone } from '../../lib/types'
import { Icon } from './Icon'
import type { IconName } from './Icon'

interface ToastsProps {
  toasts: ToastMessage[]
  onDismiss: (id: number) => void
}

const icons: Record<ToastTone, IconName> = {
  success: 'circleCheck',
  error: 'alert',
  info: 'info',
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timeout = window.setTimeout(() => onDismiss(toast.id), 3400)
    return () => window.clearTimeout(timeout)
  }, [toast.id, onDismiss])

  return (
    <div className={`toast is-${toast.tone}`} role="status">
      <Icon name={icons[toast.tone]} size={16} className="toast-icon" />
      <span>{toast.message}</span>
      <button type="button" className="toast-close" onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification">
        <Icon name="x" size={13} />
      </button>
    </div>
  )
}

export function Toasts({ toasts, onDismiss }: ToastsProps) {
  if (toasts.length === 0) return null

  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
