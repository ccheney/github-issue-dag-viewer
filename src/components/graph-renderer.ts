import cytoscape, { type Core, type ElementDefinition, type StylesheetJson } from 'cytoscape'
import dagre from 'cytoscape-dagre'
import { relatedNodes } from '../domain/graph'
import { canExportPng } from '../domain/graph-delivery'
import type { GraphAnalysis } from '../domain/types'
import type { ColorMode } from '../hooks/use-color-mode'

cytoscape.use(dagre)

export type LayoutDirection = 'LR' | 'TB'

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

export const graphStyles = (mode: ColorMode): StylesheetJson => {
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

export const graphElements = (analysis: GraphAnalysis): ElementDefinition[] => {
  const cycleKeys = new Set(analysis.cycles.flat())
  const criticalKeys = new Set(analysis.criticalPath)
  const nodes: ElementDefinition[] = [...analysis.nodes.values()].map((issue) => {
    const key = issue.key
    const classes = [
      issue.state.toLocaleLowerCase(),
      analysis.ready.has(key) ? 'ready' : '',
      issue.isExternal ? 'external' : '',
      cycleKeys.has(key) ? 'cyclic' : '',
      criticalKeys.has(key) ? 'critical' : '',
    ].filter(Boolean)
    return {
      data: { id: key, label: `#${issue.number}  ${issue.title}` },
      classes: classes.join(' '),
    }
  })
  const edges: ElementDefinition[] = analysis.edges.map(({ id, source, target }) => ({
    data: { id, source, target },
  }))
  return [...nodes, ...edges]
}

export const setGraphVisibility = (cy: Core, issueKeys: ReadonlySet<string>): void => {
  cy.batch(() => {
    cy.nodes().forEach((node) => {
      node.style('display', issueKeys.has(node.id()) ? 'element' : 'none')
    })
    cy.edges().forEach((edge) => {
      const visible = issueKeys.has(edge.source().id()) && issueKeys.has(edge.target().id())
      edge.style('display', visible ? 'element' : 'none')
    })
  })
}

export const focusSelection = (
  cy: Core,
  analysis: GraphAnalysis,
  selectedKey: string | null,
): void => {
  cy.elements().removeClass('dimmed upstream downstream focused')
  cy.nodes().unselect()
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

export const downloadPng = (cy: Core): void => {
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

export const fitGraph = (cy: Core): void => {
  const visible = cy.elements(':visible')
  if (visible.nodes().length > 0) cy.fit(visible, 48)
}

export const centerGraph = (cy: Core, selectedKey: string | null): void => {
  const initialNode = selectedKey === null ? cy.nodes().first() : cy.getElementById(selectedKey)
  cy.zoom(0.72)
  if (!initialNode.empty()) cy.center(initialNode)
}

export const pngExportAvailable = (cy: Core): boolean => {
  const bounds = cy.elements(':visible').boundingBox()
  return canExportPng(bounds.w, bounds.h)
}

export const runLayout = (
  cy: Core,
  direction: LayoutDirection,
  animate: boolean,
  onStop: (cy: Core) => void,
  onError: (message: string) => void,
): void => {
  const handleStop = (): void => {
    if (!cy.destroyed()) onStop(cy)
  }
  cy.one('layoutstop', handleStop)
  try {
    cy.layout({
      name: 'dagre',
      rankDir: direction,
      rankSep: 90,
      nodeSep: 28,
      edgeSep: 14,
      padding: 48,
      animate: animate && cy.elements().length < 500,
      animationDuration: 380,
      fit: false,
    } as dagre.DagreLayoutOptions).run()
  } catch (error) {
    cy.off('layoutstop', handleStop)
    onError(error instanceof Error ? error.message : 'Unknown layout error')
  }
}
