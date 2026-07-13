import { FilterIcon, SearchIcon, TriangleDownIcon, XIcon } from '@primer/octicons-react'
import { ActionList, ActionMenu, Button, Checkbox, FormControl, TextInput } from '@primer/react'
import { useEffect, useState } from 'react'
import { formatFilterQuery, parseFilterQuery } from '../domain/filters'
import type { GraphFilters, IssueStateFilter, ReadinessFilter } from '../domain/types'

interface FilterPanelProps {
  filters: GraphFilters
  labels: readonly string[]
  resultCount: number
  onChange: (filters: GraphFilters) => void
  onClose: () => void
}

const updateSet = (values: ReadonlySet<string>, value: string): Set<string> => {
  const next = new Set(values)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}

const stateOptions: readonly { value: IssueStateFilter; label: string }[] = [
  { value: 'all', label: 'All states' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
]

const readinessOptions: readonly { value: ReadinessFilter; label: string }[] = [
  { value: 'all', label: 'All readiness' },
  { value: 'ready', label: 'Ready' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'cyclic', label: 'In a cycle' },
]

export const FilterPanel = ({
  filters,
  labels,
  resultCount,
  onChange,
  onClose,
}: FilterPanelProps): React.JSX.Element => {
  const [labelsOpen, setLabelsOpen] = useState(false)
  const [labelSearch, setLabelSearch] = useState('')
  const [queryDraft, setQueryDraft] = useState(filters.query)
  const parsedQuery = parseFilterQuery(filters.query)
  const hasFilters =
    parsedQuery.text.length > 0 ||
    filters.state !== 'all' ||
    filters.readiness !== 'all' ||
    filters.labels.size > 0 ||
    !filters.showExternal

  useEffect(() => setQueryDraft(filters.query), [filters.query])

  useEffect(() => {
    if (queryDraft === filters.query) return
    const timeout = window.setTimeout(() => {
      const parsed = parseFilterQuery(queryDraft)
      onChange({
        query: queryDraft,
        state: parsed.state,
        readiness: parsed.readiness,
        labels: parsed.labels,
        showExternal: parsed.showExternal,
      })
    }, 200)
    return () => window.clearTimeout(timeout)
  }, [filters.query, onChange, queryDraft])

  const applyFilters = (next: GraphFilters): void => {
    const query = formatFilterQuery(next)
    setQueryDraft(query)
    onChange({ ...next, query })
  }

  const clear = (): void => {
    const next: GraphFilters = {
      query: 'is:issue',
      state: 'all',
      readiness: 'all',
      labels: new Set(),
      showExternal: true,
    }
    setQueryDraft(next.query)
    onChange(next)
  }

  const visibleLabels = labels.filter((label) =>
    label.toLocaleLowerCase().includes(labelSearch.toLocaleLowerCase()),
  )

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
        className="github-filter-input"
        leadingVisual={SearchIcon}
        onChange={(event) => setQueryDraft(event.currentTarget.value)}
        placeholder="Search or filter issues"
        value={queryDraft}
      />

      <div className="filter-menu-row">
        <ActionMenu>
          <ActionMenu.Button size="small" trailingVisual={TriangleDownIcon}>
            {filters.state === 'all' ? 'State' : `State: ${filters.state}`}
          </ActionMenu.Button>
          <ActionMenu.Overlay align="start" width="small">
            <ActionList selectionVariant="single">
              <ActionList.Group>
                <ActionList.GroupHeading>Filter by state</ActionList.GroupHeading>
                {stateOptions.map((option) => (
                  <ActionList.Item
                    key={option.value}
                    onSelect={() => applyFilters({ ...filters, state: option.value })}
                    selected={filters.state === option.value}
                  >
                    {option.label}
                  </ActionList.Item>
                ))}
              </ActionList.Group>
            </ActionList>
          </ActionMenu.Overlay>
        </ActionMenu>

        <ActionMenu>
          <ActionMenu.Button size="small" trailingVisual={TriangleDownIcon}>
            {filters.readiness === 'all' ? 'Readiness' : `Readiness: ${filters.readiness}`}
          </ActionMenu.Button>
          <ActionMenu.Overlay align="start" width="small">
            <ActionList selectionVariant="single">
              <ActionList.Group>
                <ActionList.GroupHeading>Filter by readiness</ActionList.GroupHeading>
                {readinessOptions.map((option) => (
                  <ActionList.Item
                    key={option.value}
                    onSelect={() => applyFilters({ ...filters, readiness: option.value })}
                    selected={filters.readiness === option.value}
                  >
                    {option.label}
                  </ActionList.Item>
                ))}
              </ActionList.Group>
            </ActionList>
          </ActionMenu.Overlay>
        </ActionMenu>

        <ActionMenu
          onOpenChange={(open) => {
            setLabelsOpen(open)
            if (!open) setLabelSearch('')
          }}
          open={labelsOpen}
        >
          <ActionMenu.Button
            {...(filters.labels.size === 0 ? {} : { count: filters.labels.size })}
            size="small"
            trailingVisual={TriangleDownIcon}
          >
            Labels
          </ActionMenu.Button>
          <ActionMenu.Overlay align="start" width="medium">
            <div className="label-menu">
              <strong>Filter by label</strong>
              <TextInput
                aria-label="Filter labels"
                block
                leadingVisual={SearchIcon}
                onChange={(event) => setLabelSearch(event.currentTarget.value)}
                placeholder="Filter labels"
                value={labelSearch}
              />
              <div className="label-menu-options">
                <ActionList selectionVariant="multiple">
                  {visibleLabels.map((label) => (
                    <ActionList.Item
                      key={label}
                      onSelect={(event) => {
                        event.preventDefault()
                        applyFilters({ ...filters, labels: updateSet(filters.labels, label) })
                      }}
                      selected={filters.labels.has(label)}
                    >
                      {label}
                    </ActionList.Item>
                  ))}
                  {visibleLabels.length === 0 ? (
                    <ActionList.Item disabled>No labels found</ActionList.Item>
                  ) : null}
                </ActionList>
              </div>
            </div>
          </ActionMenu.Overlay>
        </ActionMenu>
      </div>

      <FormControl className="external-toggle">
        <Checkbox
          checked={filters.showExternal}
          onChange={(event) => applyFilters({ ...filters, showExternal: event.target.checked })}
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
