import { ListUnorderedIcon, SidebarExpandIcon } from '@primer/octicons-react'
import { Button } from '@primer/react'
import { type GraphDeliveryMode, MAXIMUM_LAYOUT_LIMIT } from '../domain/graph-delivery'
import type { LoadProgress } from '../domain/types'
import { GraphToolbarNotice } from './GraphToolbarNotice'
import { RepositoryLoadProgress } from './RepositoryLoadProgress'

type GraphGateMode = GraphDeliveryMode | 'loading' | 'repository-loading'

const graphGateCopy = (
  mode: GraphGateMode,
  issueCount: number,
  progress?: LoadProgress,
): { title: string; description: string } => {
  if (mode === 'repository-loading') {
    const total = progress?.total ?? 0
    if (total > MAXIMUM_LAYOUT_LIMIT) {
      return {
        title: `Canvas unavailable for ${total.toLocaleString()} issues`,
        description:
          'Full-canvas layout is unsupported above 5,000 issues. The issue list continues to load for search, filters, details, and JSON export.',
      }
    }
    return {
      title: 'Loading repository issues',
      description:
        'The issue list updates after every GitHub page. Graph layout and exports unlock when the complete repository is ready.',
    }
  }
  if (mode === 'loading') {
    return {
      title: 'Loading graph renderer',
      description: 'The issue list and details are ready while the graph code loads.',
    }
  }
  if (mode === 'opt-in') {
    return {
      title: `Layout paused for ${issueCount.toLocaleString()} issues`,
      description:
        'Dagre may take several seconds. The issue list, filters, details, and JSON export remain available without layout.',
    }
  }
  return {
    title: `Canvas unavailable for ${issueCount.toLocaleString()} issues`,
    description:
      'Full-canvas layout is unsupported above 5,000 issues. Use the issue list, filters, details, and JSON export.',
  }
}

interface GraphGateProps {
  issueCount: number
  mode: GraphGateMode
  progress?: LoadProgress
  selected: boolean
  warning: string
  onOpenInspector: () => void
  onOpenIssues: () => void
  onRender?: () => void
}

export const GraphGate = ({
  issueCount,
  mode,
  progress,
  selected,
  warning,
  onOpenInspector,
  onOpenIssues,
  onRender,
}: GraphGateProps): React.JSX.Element => {
  const { title, description } = graphGateCopy(mode, issueCount, progress)

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
        {mode === 'repository-loading' && progress !== undefined ? (
          <RepositoryLoadProgress progress={progress} />
        ) : null}
        {mode === 'opt-in' && onRender !== undefined ? (
          <Button onClick={onRender}>Render graph</Button>
        ) : null}
      </div>
    </section>
  )
}
