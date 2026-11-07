import type { ScopeChip } from '../../lib/types'
import { Icon } from '../ui/Icon'

interface ScopeBarProps {
  chips: ScopeChip[]
  onClear: () => void
}

export function ScopeBar({ chips, onClear }: ScopeBarProps) {
  if (chips.length === 0) return null

  return (
    <div className="scope-bar">
      <span className="scope-label">Active scope</span>

      {chips.map((chip) => (
        <span className={`scope-chip is-${chip.type}`} key={chip.key}>
          <b>{chip.label}:</b>
          <span>{chip.value}</span>
          <button type="button" onClick={chip.onClear} aria-label={`Remove ${chip.label} filter`}>
            <Icon name="x" size={11} />
          </button>
        </span>
      ))}

      <button type="button" className="clear-scope" onClick={onClear}>
        Clear scope
      </button>
    </div>
  )
}
