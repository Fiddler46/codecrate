import { formatTime } from '../../lib/format'
import { Icon } from '../ui/Icon'

interface StatusBarProps {
  page: number
  totalPages: number
  rendered: number
  total: number
  storageLabel: string
  lastSyncedAt: Date | null
  onPageChange: (page: number) => void
}

export function StatusBar({
  page,
  totalPages,
  rendered,
  total,
  storageLabel,
  lastSyncedAt,
  onPageChange,
}: StatusBarProps) {
  return (
    <div className="status-bar">
      <div className="status-group">
      </div>

      {/* <div className="status-group status-group-center">
        <span>{rendered} of {total} {total === 1 ? 'crate' : 'crates'} rendered in view</span>
        <span className="meta-sep">·</span>
        <span>Cache: <strong>{storageLabel}</strong></span>
        <span className="meta-sep">·</span>
        <span>Index synced {lastSyncedAt ? formatTime(lastSyncedAt) : '—'}</span>
      </div> */}

      <div className="pager">
        <button
          type="button"
          className="pager-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <Icon name="chevronLeft" size={11} />
          Previous
        </button>

        <span className="pager-page">{page} / {totalPages}</span>

        <button
          type="button"
          className="pager-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
          <Icon name="chevronRight" size={11} />
        </button>
      </div>
    </div>
  )
}
