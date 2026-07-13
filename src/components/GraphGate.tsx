import { ListUnorderedIcon, SidebarExpandIcon } from '@primer/octicons-react'
import { Button } from '@primer/react'
import type { GraphDeliveryMode } from '../domain/graph-delivery'
import { GraphToolbarNotice } from './GraphToolbarNotice'

interface GraphGateProps {
  issueCount: number
  mode: GraphDeliveryMode | 'loading'
  selected: boolean
  warning: string
  onOpenInspector: () => void
  onOpenIssues: () => void
  onRender?: () => void
}

export const GraphGate = ({
  issueCount,
  mode,
  selected,
  warning,
  onOpenInspector,
  onOpenIssues,
  onRender,
}: GraphGateProps): React.JSX.Element => {
  const title =
    mode === 'loading'
      ? 'Loading graph renderer'
      : mode === 'opt-in'
        ? `Layout paused for ${issueCount.toLocaleString()} issues`
        : `Canvas unavailable for ${issueCount.toLocaleString()} issues`
  const description =
    mode === 'loading'
      ? 'The issue list and details are ready while the graph code loads.'
      : mode === 'opt-in'
        ? 'Dagre may take several seconds. The issue list, filters, details, and JSON export remain available without layout.'
        : 'Full-canvas layout is unsupported above 5,000 issues. Use the issue list, filters, details, and JSON export.'

  return (
    <section className="graph-workspace" aria-label="Issue dependency graph">
      <div className="graph-toolbar">
        <div className="graph-legend">Graph</div>
        <div className="graph-actions">
          <Button
            aria-label="Issues"
            className="mobile-pane-action"
            leadingVisual={ListUnorderedIcon}
            onClick={onOpenIssues}
            size="small"
          >
            Issues
          </Button>
          <Button
            aria-label="Details"
            className="mobile-pane-action"
            disabled={!selected}
            leadingVisual={SidebarExpandIcon}
            onClick={onOpenInspector}
            size="small"
          >
            Details
          </Button>
          {warning.length > 0 ? <GraphToolbarNotice message={warning} /> : null}
        </div>
      </div>
      <div aria-live="polite" className="graph-gate" role="status">
        <strong>{title}</strong>
        <span>{description}</span>
        {mode === 'opt-in' && onRender !== undefined ? (
          <Button onClick={onRender}>Render graph</Button>
        ) : null}
      </div>
    </section>
  )
}
