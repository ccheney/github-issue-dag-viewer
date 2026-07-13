import {
  ColumnsIcon,
  DownloadIcon,
  ListUnorderedIcon,
  ScreenFullIcon,
  SidebarExpandIcon,
  ThreeBarsIcon,
} from '@primer/octicons-react'
import { Button } from '@primer/react'
import cytoscape, { type Core, type ElementDefinition, type StylesheetJson } from 'cytoscape'
import dagre from 'cytoscape-dagre'
import { useEffect, useMemo, useRef } from 'react'
import { relatedNodes } from '../domain/graph'
import type { GraphAnalysis } from '../domain/types'
import type { ColorMode } from '../hooks/use-color-mode'

cytoscape.use(dagre)

export type LayoutDirection = 'LR' | 'TB'

interface GraphCanvasProps {
  analysis: GraphAnalysis
  colorMode: ColorMode
  direction: LayoutDirection
  fitRevision: number
  issueKeys: ReadonlySet<string>
  selectedKey: string | null
  onDirectionChange: (direction: LayoutDirection) => void
  onSelect: (key: string) => void
  onOpenIssues: () => void
  onOpenInspector: () => void
}

const palette = (mode: ColorMode) =>
  mode === 'light'
    ? {
        canvas: '#ffffff',
        node: '#f6f8fa',
        border: '#d0d7de',
        text: '#1f2328',
        edge: '#8c959f',
        open: '#1f883d',
        ready: '#0969da',
        closed: '#8250df',
        attention: '#bf8700',
      }
    : {
        canvas: '#0d1117',
        node: '#161b22',
        border: '#30363d',
        text: '#f0f6fc',
        edge: '#6e7681',
        open: '#3fb950',
        ready: '#58a6ff',
        closed: '#a371f7',
        attention: '#d29922',
      }

const graphStyles = (mode: ColorMode): StylesheetJson => {
  const colors = palette(mode)
  return [
    {
      selector: 'node',
      style: {
        'background-color': colors.node,
        'border-color': colors.border,
        'border-width': 1,
        color: colors.text,
        content: 'data(label)',
        'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        'font-size': '11px',
        height: '46px',
        padding: '10px',
        shape: 'round-rectangle',
        'text-halign': 'center',
        'text-max-width': '150px',
        'text-valign': 'center',
        'text-wrap': 'wrap',
        width: '170px',
      },
    },
    { selector: 'node.open', style: { 'border-color': colors.open, 'border-width': 2 } },
    {
      selector: 'node.ready',
      style: {
        'background-color': mode === 'light' ? '#ddf4ff' : '#121d2f',
        'border-color': colors.ready,
        'border-width': 3,
      },
    },
    {
      selector: 'node.closed',
      style: { 'border-color': colors.closed, opacity: 0.78 },
    },
    { selector: 'node.external', style: { 'border-style': 'dashed' } },
    { selector: 'node.cyclic', style: { 'border-color': colors.attention, 'border-width': 4 } },
    {
      selector: 'node.critical',
      style: {
        'underlay-color': colors.attention,
        'underlay-opacity': 0.12,
        'underlay-padding': 7,
      },
    },
    {
      selector: 'edge',
      style: {
        'curve-style': 'taxi',
        'line-color': colors.edge,
        opacity: 0.62,
        'target-arrow-color': colors.edge,
        'target-arrow-shape': 'triangle',
        'taxi-direction': 'rightward',
        width: 1.5,
      },
    },
    {
      selector: 'node:selected',
      style: {
        'border-color': colors.ready,
        'border-width': 4,
        'overlay-color': colors.ready,
        'overlay-opacity': 0.08,
        'overlay-padding': 8,
      },
    },
    { selector: '.dimmed', style: { opacity: 0.14 } },
    { selector: 'node.upstream', style: { 'border-color': colors.attention, opacity: 1 } },
    { selector: 'node.downstream', style: { 'border-color': colors.ready, opacity: 1 } },
    {
      selector: 'edge.focused',
      style: {
        'line-color': colors.ready,
        opacity: 0.9,
        'target-arrow-color': colors.ready,
        width: 2.5,
      },
    },
  ]
}

const graphElements = (
  analysis: GraphAnalysis,
  issueKeys: ReadonlySet<string>,
): ElementDefinition[] => {
  const cycleKeys = new Set(analysis.cycles.flat())
  const criticalKeys = new Set(analysis.criticalPath)
  const nodes: ElementDefinition[] = [...issueKeys].flatMap((key) => {
    const issue = analysis.nodes.get(key)
    if (issue === undefined) return []
    const classes = [
      issue.state.toLocaleLowerCase(),
      analysis.ready.has(key) ? 'ready' : '',
      issue.isExternal ? 'external' : '',
      cycleKeys.has(key) ? 'cyclic' : '',
      criticalKeys.has(key) ? 'critical' : '',
    ].filter(Boolean)
    return [
      { data: { id: key, label: `#${issue.number}  ${issue.title}` }, classes: classes.join(' ') },
    ]
  })
  const edges: ElementDefinition[] = analysis.edges
    .filter(({ source, target }) => issueKeys.has(source) && issueKeys.has(target))
    .map(({ id, source, target }) => ({ data: { id, source, target } }))
  return [...nodes, ...edges]
}

const focusSelection = (cy: Core, analysis: GraphAnalysis, selectedKey: string | null): void => {
  cy.elements().removeClass('dimmed upstream downstream focused')
  if (selectedKey === null || cy.getElementById(selectedKey).empty()) return
  const upstream = relatedNodes(selectedKey, analysis.incoming)
  const downstream = relatedNodes(selectedKey, analysis.outgoing)
  const related = new Set([selectedKey, ...upstream, ...downstream])
  cy.nodes().forEach((node) => {
    if (!related.has(node.id())) node.addClass('dimmed')
    else if (upstream.has(node.id())) node.addClass('upstream')
    else if (downstream.has(node.id())) node.addClass('downstream')
  })
  cy.edges().forEach((edge) => {
    if (related.has(edge.source().id()) && related.has(edge.target().id())) edge.addClass('focused')
    else edge.addClass('dimmed')
  })
  cy.getElementById(selectedKey).select()
}

const downloadPng = (cy: Core): void => {
  const anchor = document.createElement('a')
  anchor.download = 'issue-dependency-graph.png'
  anchor.href = cy.png({
    bg: palette('light').canvas,
    full: true,
    maxWidth: 6000,
    maxHeight: 6000,
  })
  anchor.click()
}

export const GraphCanvas = ({
  analysis,
  colorMode,
  direction,
  fitRevision,
  issueKeys,
  selectedKey,
  onDirectionChange,
  onSelect,
  onOpenIssues,
  onOpenInspector,
}: GraphCanvasProps): React.JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<Core | null>(null)
  const fitRevisionRef = useRef(fitRevision)
  const onSelectRef = useRef(onSelect)
  const selectedKeyRef = useRef(selectedKey)
  onSelectRef.current = onSelect
  selectedKeyRef.current = selectedKey
  const elements = useMemo(() => graphElements(analysis, issueKeys), [analysis, issueKeys])

  useEffect(() => {
    if (containerRef.current === null) return
    const shouldFit = fitRevisionRef.current !== fitRevision
    fitRevisionRef.current = fitRevision
    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: graphStyles(colorMode),
      minZoom: 0.08,
      maxZoom: 2.5,
    })
    cyRef.current = cy
    cy.on('tap', 'node', (event) => onSelectRef.current(event.target.id()))
    const layout = cy.layout({
      name: 'dagre',
      rankDir: direction,
      rankSep: 90,
      nodeSep: 28,
      edgeSep: 14,
      padding: 48,
      animate: elements.length < 500,
      animationDuration: 380,
      fit: false,
    } as dagre.DagreLayoutOptions)
    if (shouldFit) {
      cy.one('layoutstop', () => {
        if (!cy.destroyed() && cy.nodes().length > 0) cy.fit(cy.elements(), 48)
      })
    }
    layout.run()
    const initialNode =
      selectedKeyRef.current === null
        ? cy.nodes().first()
        : cy.getElementById(selectedKeyRef.current)
    if (!shouldFit) {
      cy.zoom(0.72)
      if (!initialNode.empty()) cy.center(initialNode)
    }
    return () => {
      cy.destroy()
      cyRef.current = null
    }
  }, [colorMode, direction, elements, fitRevision])

  useEffect(() => {
    const cy = cyRef.current
    if (cy !== null) focusSelection(cy, analysis, selectedKey)
  }, [analysis, selectedKey])

  return (
    <section className="graph-workspace" aria-label="Issue dependency graph">
      <div className="graph-toolbar">
        <div className="graph-legend">
          <span>
            <i className="legend-dot legend-ready" />
            Ready
          </span>
          <span>
            <i className="legend-dot legend-open" />
            Open
          </span>
          <span>
            <i className="legend-dot legend-closed" />
            Closed
          </span>
          <span>
            <i className="legend-line" />
            Blocks
          </span>
        </div>
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
            disabled={selectedKey === null}
            leadingVisual={SidebarExpandIcon}
            onClick={onOpenInspector}
            size="small"
          >
            Details
          </Button>
          <Button
            aria-label="Use left-to-right layout"
            aria-pressed={direction === 'LR'}
            leadingVisual={ColumnsIcon}
            onClick={() => onDirectionChange('LR')}
            size="small"
            variant={direction === 'LR' ? 'default' : 'invisible'}
          >
            Horizontal
          </Button>
          <Button
            aria-label="Use top-to-bottom layout"
            aria-pressed={direction === 'TB'}
            leadingVisual={ThreeBarsIcon}
            onClick={() => onDirectionChange('TB')}
            size="small"
            variant={direction === 'TB' ? 'default' : 'invisible'}
          >
            Vertical
          </Button>
          <Button
            aria-label="Fit graph to viewport"
            leadingVisual={ScreenFullIcon}
            onClick={() => cyRef.current?.fit(undefined, 48)}
            size="small"
            variant="invisible"
          >
            Fit
          </Button>
          <Button
            aria-label="Download graph as PNG"
            leadingVisual={DownloadIcon}
            onClick={() => {
              const cy = cyRef.current
              if (cy !== null) downloadPng(cy)
            }}
            size="small"
            variant="invisible"
          >
            PNG
          </Button>
        </div>
      </div>
      <div
        aria-label={`Dependency graph showing ${issueKeys.size} issues. Select issues from the list for accessible details.`}
        className="graph-canvas"
        ref={containerRef}
        role="img"
      />
      <div aria-live="polite" className="sr-only">
        {selectedKey === null
          ? 'No issue selected.'
          : `Selected ${analysis.nodes.get(selectedKey)?.title ?? 'issue'}.`}
      </div>
    </section>
  )
}
