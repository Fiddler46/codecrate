'use client'

import { useEffect, useRef } from 'react'
import type { Density, SortMode } from '../../lib/types'
import { Icon } from '../ui/Icon'

interface CopyStats {
  counts: number[]
  week: number
  delta: number
}

interface ToolbarProps {
  density: Density
  sortMode: SortMode
  selectedCount: number
  allSelected: boolean
  someSelected: boolean
  totalCount: number
  activeViewIsArchive: boolean
  copyStats: CopyStats
  onDensityChange: (density: Density) => void
  onSortChange: (sort: SortMode) => void
  onToggleSelectAll: () => void
  onExport: () => void
  onBulkArchive: () => void
  onBulkDelete: () => void
  onClearSelection: () => void
}

function Sparkline({ counts }: { counts: number[] }) {
  const width = 76
  const height = 22
  const max = Math.max(1, ...counts)
  const step = counts.length > 1 ? width / (counts.length - 1) : width
  const points = counts
    .map((count, index) => `${index * step},${height - 2 - (count / max) * (height - 5)}`)
    .join(' ')

  return (
    <svg className="sparkline" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Toolbar({
  density,
  sortMode,
  selectedCount,
  allSelected,
  someSelected,
  totalCount,
  activeViewIsArchive,
  copyStats,
  onDensityChange,
  onSortChange,
  onToggleSelectAll,
  onExport,
  onBulkArchive,
  onBulkDelete,
  onClearSelection,
}: ToolbarProps) {
  const selectAllRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected && !allSelected
    }
  }, [someSelected, allSelected])

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-group">
          <div className="segmented" role="group" aria-label="Snippet density">
            <button
              type="button"
              className={density === 'crates' ? 'is-active' : ''}
              onClick={() => onDensityChange('crates')}
              aria-pressed={density === 'crates'}
            >
              <Icon name="grid" size={13} />
              Crates
            </button>
            <button
              type="button"
              className={density === 'dense' ? 'is-active' : ''}
              onClick={() => onDensityChange('dense')}
              aria-pressed={density === 'dense'}
            >
              <Icon name="list" size={13} />
              Dense
            </button>
          </div>

          <label className="sort-wrap" title="Sort snippets">
            <Icon name="sort" size={13} className="sort-leading-icon" />
            <select
              className="sort-select"
              value={sortMode}
              onChange={(event) => onSortChange(event.target.value as SortMode)}
              aria-label="Sort snippets"
            >
              <option value="updated">Recently modified</option>
              <option value="created">Recently created</option>
              <option value="title">Title A–Z</option>
              <option value="language">Language A–Z</option>
            </select>
            <Icon name="chevronDown" size={11} className="sort-icon" />
          </label>
        </div>

        <div className="toolbar-group toolbar-group-end">
          <label className="select-all">
            <input
              ref={selectAllRef}
              type="checkbox"
              className="checkbox"
              checked={allSelected}
              onChange={onToggleSelectAll}
              disabled={totalCount === 0}
            />
            <span>Select all</span>
          </label>

          <span className="toolbar-divider" aria-hidden="true" />

          <button type="button" className="btn btn-ghost btn-sm" onClick={onExport} disabled={totalCount === 0}>
            <Icon name="download" size={13} />
            Export
          </button>

          <span className="toolbar-divider copy-rate-divider" aria-hidden="true" />

          {/* <div className="copy-rate" title={`${copyStats.week} copies in the last 7 days`}>
            <div className="copy-rate-copy">
              <span className="copy-rate-label">Weekly copy rate</span>
              <span className="copy-rate-value">
                {copyStats.week} {copyStats.week === 1 ? 'copy' : 'copies'}
                {copyStats.week > 0 && (
                  <em className={copyStats.delta < 0 ? 'is-down' : ''}>
                    {copyStats.delta >= 0 ? '+' : ''}
                    {copyStats.delta}%
                  </em>
                )}
              </span>
            </div>
            <Sparkline counts={copyStats.counts} />
          </div> */}
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="bulk-bar">
          <Icon name="check" size={13} />
          <span><strong>{selectedCount}</strong> {selectedCount === 1 ? 'snippet' : 'snippets'} selected</span>
          <div className="bulk-actions">
            <button type="button" className="bulk-btn" onClick={onBulkArchive}>
              <Icon name={activeViewIsArchive ? 'restore' : 'archive'} size={13} />
              {activeViewIsArchive ? 'Restore' : 'Archive'}
            </button>
            <button type="button" className="bulk-btn is-danger" onClick={onBulkDelete}>
              <Icon name="trash" size={13} />
              Delete
            </button>
            <button type="button" className="bulk-btn" onClick={onClearSelection}>
              <Icon name="x" size={13} />
              Clear
            </button>
          </div>
        </div>
      )}
    </>
  )
}
