import { FilterIcon, SearchIcon, XIcon } from '@primer/octicons-react'
import { Button, Checkbox, FormControl, TextInput } from '@primer/react'
import type { GraphFilters, IssueStateFilter, ReadinessFilter } from '../domain/types'

interface FilterPanelProps {
  filters: GraphFilters
  labels: readonly string[]
  resultCount: number
  onChange: (filters: GraphFilters) => void
  onClose: () => void
}

const updateSet = (labels: ReadonlySet<string>, label: string, selected: boolean): Set<string> => {
  const next = new Set(labels)
  if (selected) next.add(label)
  else next.delete(label)
  return next
}

export const FilterPanel = ({
  filters,
  labels,
  resultCount,
  onChange,
  onClose,
}: FilterPanelProps): React.JSX.Element => {
  const hasFilters =
    filters.query.length > 0 ||
    filters.state !== 'all' ||
    filters.readiness !== 'all' ||
    filters.labels.size > 0 ||
    !filters.showExternal

  const clear = (): void =>
    onChange({ query: '', state: 'all', readiness: 'all', labels: new Set(), showExternal: true })

  return (
    <section className="filter-panel" aria-labelledby="filter-heading">
      <div className="panel-heading-row">
        <h2 id="filter-heading">
          <FilterIcon size={16} /> Issues
        </h2>
        <span className="result-count">{resultCount.toLocaleString()}</span>
        <button
          aria-label="Close issue list"
          className="mobile-panel-close"
          onClick={onClose}
          type="button"
        >
          <XIcon size={16} />
        </button>
      </div>

      <TextInput
        aria-label="Search issues"
        block
        leadingVisual={SearchIcon}
        onChange={(event) => onChange({ ...filters, query: event.currentTarget.value })}
        placeholder="Search issues"
        value={filters.query}
      />

      <div className="filter-grid">
        <FormControl>
          <FormControl.Label>State</FormControl.Label>
          <select
            aria-label="State"
            className="primer-select"
            onChange={(event) =>
              onChange({ ...filters, state: event.currentTarget.value as IssueStateFilter })
            }
            value={filters.state}
          >
            <option value="all">All states</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </FormControl>
        <FormControl>
          <FormControl.Label>Readiness</FormControl.Label>
          <select
            aria-label="Readiness"
            className="primer-select"
            onChange={(event) =>
              onChange({ ...filters, readiness: event.currentTarget.value as ReadinessFilter })
            }
            value={filters.readiness}
          >
            <option value="all">All issues</option>
            <option value="ready">Ready</option>
            <option value="blocked">Blocked</option>
            <option value="cyclic">In a cycle</option>
          </select>
        </FormControl>
      </div>

      <details className="label-filter">
        <summary>Labels {filters.labels.size > 0 ? `(${filters.labels.size})` : ''}</summary>
        <div className="label-options">
          {labels.map((label) => (
            <FormControl key={label} className="label-option">
              <Checkbox
                checked={filters.labels.has(label)}
                onChange={(event) =>
                  onChange({
                    ...filters,
                    labels: updateSet(filters.labels, label, event.target.checked),
                  })
                }
              />
              <FormControl.Label>{label}</FormControl.Label>
            </FormControl>
          ))}
          {labels.length === 0 ? <span className="muted">No labels</span> : null}
        </div>
      </details>

      <FormControl className="external-toggle">
        <Checkbox
          checked={filters.showExternal}
          onChange={(event) => onChange({ ...filters, showExternal: event.target.checked })}
        />
        <FormControl.Label>Show cross-repository issues</FormControl.Label>
      </FormControl>

      {hasFilters ? (
        <Button block leadingVisual={XIcon} onClick={clear} size="small" variant="invisible">
          Clear filters
        </Button>
      ) : null}
    </section>
  )
}
