import {
  CheckCircleFillIcon,
  GitBranchIcon,
  IssueClosedIcon,
  IssueOpenedIcon,
  LinkExternalIcon,
  MilestoneIcon,
  PersonIcon,
} from '@primer/octicons-react'
import { Button, Label, Spinner } from '@primer/react'
import { lazy, Suspense } from 'react'
import type { GraphAnalysis, IssueRecord } from '../domain/types'

const MarkdownBody = lazy(() => import('./MarkdownBody'))

interface IssueInspectorProps {
  analysis: GraphAnalysis
  issue: IssueRecord | null
  bodyLoading: boolean
  onClose: () => void
}

const RelationshipList = ({
  analysis,
  issue,
  direction,
}: {
  analysis: GraphAnalysis
  issue: IssueRecord
  direction: 'incoming' | 'outgoing'
}): React.JSX.Element | null => {
  const keys = [
    ...((direction === 'incoming' ? analysis.incoming : analysis.outgoing).get(issue.key) ?? []),
  ]
  if (keys.length === 0) return null
  return (
    <section className="relationship-section">
      <h3>{direction === 'incoming' ? 'Blocked by' : 'Blocking'}</h3>
      <ul>
        {keys.map((key) => {
          const related = analysis.nodes.get(key)
          return related === undefined ? null : (
            <li key={key}>
              {related.state === 'CLOSED' ? (
                <IssueClosedIcon className="issue-state-closed" size={14} />
              ) : (
                <IssueOpenedIcon className="issue-state-open" size={14} />
              )}
              <a href={related.url} rel="noreferrer" target="_blank">
                #{related.number} {related.title}
              </a>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

const IssueMetadata = ({
  analysis,
  issue,
}: {
  analysis: GraphAnalysis
  issue: IssueRecord
}): React.JSX.Element => (
  <div className="inspector-metadata">
    <span>
      <GitBranchIcon size={14} /> Layer {analysis.depth.get(issue.key) ?? '—'}
    </span>
    {analysis.ready.has(issue.key) ? (
      <span className="metadata-ready">
        <CheckCircleFillIcon size={14} /> Ready
      </span>
    ) : null}
    {issue.author !== null ? (
      <span>
        <PersonIcon size={14} /> {issue.author.login}
      </span>
    ) : null}
    {issue.milestone !== null ? (
      <span>
        <MilestoneIcon size={14} /> {issue.milestone.title}
      </span>
    ) : null}
  </div>
)

export const IssueInspector = ({
  analysis,
  issue,
  bodyLoading,
  onClose,
}: IssueInspectorProps): React.JSX.Element => {
  if (issue === null) {
    return (
      <aside className="inspector inspector-empty">
        <GitBranchIcon size={28} />
        <strong>Select an issue</strong>
        <span>Inspect its dependencies, metadata, and description.</span>
      </aside>
    )
  }

  return (
    <aside className="inspector" aria-label={`Issue #${issue.number} details`}>
      <header className="inspector-header">
        <button
          aria-label="Close issue details"
          className="mobile-panel-close"
          onClick={onClose}
          type="button"
        >
          Close
        </button>
        <div className="inspector-state">
          {issue.state === 'CLOSED' ? (
            <IssueClosedIcon className="issue-state-closed" size={18} />
          ) : (
            <IssueOpenedIcon className="issue-state-open" size={18} />
          )}
          {issue.state === 'CLOSED' ? 'Closed' : 'Open'} · {issue.repository}#{issue.number}
        </div>
        <h2>{issue.title}</h2>
        <IssueMetadata analysis={analysis} issue={issue} />
        <div className="inspector-labels">
          {issue.labels.map(({ name, color }) => (
            <Label key={name} style={{ borderColor: `#${color}` }}>
              {name}
            </Label>
          ))}
        </div>
        <Button
          as="a"
          href={issue.url}
          leadingVisual={LinkExternalIcon}
          rel="noreferrer"
          target="_blank"
        >
          Open on GitHub
        </Button>
      </header>

      <div className="inspector-scroll">
        <RelationshipList analysis={analysis} direction="incoming" issue={issue} />
        <RelationshipList analysis={analysis} direction="outgoing" issue={issue} />
        <section className="issue-body markdown-body">
          <h3>Description</h3>
          {bodyLoading ? (
            <div className="body-loading">
              <Spinner size="small" /> Loading description…
            </div>
          ) : issue.body === null || issue.body.length === 0 ? (
            <p className="muted">No description provided.</p>
          ) : (
            <Suspense
              fallback={
                <div className="body-loading">
                  <Spinner size="small" /> Rendering description…
                </div>
              }
            >
              <MarkdownBody body={issue.body} />
            </Suspense>
          )}
        </section>
      </div>
    </aside>
  )
}
