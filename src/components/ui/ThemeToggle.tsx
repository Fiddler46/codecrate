import { Icon } from './Icon'

interface ThemeToggleProps {
  onToggle: () => void
  className?: string
}

export function ThemeToggle({ onToggle, className = '' }: ThemeToggleProps) {
  return (
    <button
      type="button"
      className={`btn-icon theme-toggle ${className}`.trim()}
      onClick={onToggle}
      aria-label="Toggle light and dark theme"
      title="Toggle light and dark theme"
    >
      <Icon name="sun" size={17} className="theme-icon theme-icon-sun" />
      <Icon name="moon" size={17} className="theme-icon theme-icon-moon" />
    </button>
  )
}
