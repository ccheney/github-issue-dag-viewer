import {
  CheckCircleFillIcon,
  GitBranchIcon,
  IssueClosedIcon,
  IssueOpenedIcon,
  RepoIcon,
} from '@primer/octicons-react'
import { Label } from '@primer/react'
import type { GraphAnalysis, IssueRecord } from '../domain/types'

interface IssueListProps {
  analysis: GraphAnalysis
  issueKeys: ReadonlySet<string>
  selectedKey: string | null
  onSelect: (key: string) => void
}

const StateIcon = ({ issue, ready }: { issue: IssueRecord; ready: boolean }): React.JSX.Element => {
  if (issue.state === 'CLOSED') {
    return <IssueClosedIcon className="issue-state-closed" size={16} />
  }
  if (ready) return <CheckCircleFillIcon className="issue-state-ready" size={16} />
  return <IssueOpenedIcon className="issue-state-open" size={16} />
}

const IssueRow = ({
  issue,
  ready,
  selected,
  onSelect,
}: {
  issue: IssueRecord
  ready: boolean
  selected: boolean
  onSelect: () => void
}): React.JSX.Element => (
  <li>
    <button
      aria-current={selected ? 'true' : undefined}
      className={`issue-row ${selected ? 'issue-row-selected' : ''}`}
      onClick={onSelect}
      type="button"
    >
      <StateIcon issue={issue} ready={ready} />
      <span className="issue-row-content">
        <span className="issue-row-title">{issue.title}</span>
        <span className="issue-row-meta">
          {issue.isExternal ? <RepoIcon size={12} /> : null}
          {issue.isExternal ? `${issue.repository} · ` : ''}#{issue.number}
          {issue.blockedBy.length > 0 ? (
            <span className="dependency-count">
              <GitBranchIcon size={12} /> {issue.blockedBy.length}
            </span>
          ) : null}
        </span>
        {issue.labels.length > 0 ? (
          <span className="issue-row-labels">
            {issue.labels.slice(0, 2).map(({ name, color }) => (
              <Label key={name} size="small" style={{ borderColor: `#${color}` }}>
                {name}
              </Label>
            ))}
          </span>
        ) : null}
      </span>
    </button>
  </li>
)

export const IssueList = ({
  analysis,
  issueKeys,
  selectedKey,
  onSelect,
}: IssueListProps): React.JSX.Element => {
  const issues = [...issueKeys]
    .map((key) => analysis.nodes.get(key))
    .filter((issue) => issue !== undefined)
    .toSorted((left, right) => {
      const readiness = Number(analysis.ready.has(right.key)) - Number(analysis.ready.has(left.key))
      return (
        readiness || left.number - right.number || left.repository.localeCompare(right.repository)
      )
    })

  return (
    <div className="issue-list-scroll">
      {issues.length > 0 ? (
        <ul className="issue-list" aria-label="Filtered issues">
          {issues.map((issue) => (
            <IssueRow
              issue={issue}
              key={issue.key}
              onSelect={() => onSelect(issue.key)}
              ready={analysis.ready.has(issue.key)}
              selected={selectedKey === issue.key}
            />
          ))}
        </ul>
      ) : (
        <div className="empty-list">
          <IssueOpenedIcon size={24} />
          <strong>No matching issues</strong>
          <span>Try clearing one or more filters.</span>
        </div>
      )}
    </div>
  )
}
