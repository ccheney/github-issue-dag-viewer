import {
  ColumnsIcon,
  DownloadIcon,
  FileCodeIcon,
  ListUnorderedIcon,
  ScreenFullIcon,
  SidebarExpandIcon,
  ThreeBarsIcon,
} from '@primer/octicons-react'
import { Button, Tooltip } from '@primer/react'
import cytoscape, { type Core } from 'cytoscape'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { GraphAnalysis } from '../domain/types'
import type { ColorMode } from '../hooks/use-color-mode'
import { GraphToolbarNotice } from './GraphToolbarNotice'
import {
  centerGraph,
  downloadPng,
  fitGraph,
  focusSelection,
  graphElements,
  graphStyles,
  type LayoutDirection,
  pngExportAvailable,
  runLayout,
  setGraphVisibility,
} from './graph-renderer'
import { downloadSvg } from './graph-svg'

export type { LayoutDirection } from './graph-renderer'

interface GraphCanvasProps {
  analysis: GraphAnalysis
  colorMode: ColorMode
  direction: LayoutDirection
  issueKeys: ReadonlySet<string>
  selectedKey: string | null
  warning: string
  onDirectionChange: (direction: LayoutDirection) => void
  onLayoutError: (message: string) => void
  onSelect: (key: string) => void
  onOpenIssues: () => void
  onOpenInspector: () => void
}

export const GraphCanvas = ({
  analysis,
  colorMode,
  direction,
  issueKeys,
  selectedKey,
  warning,
  onDirectionChange,
  onLayoutError,
  onSelect,
  onOpenIssues,
  onOpenInspector,
}: GraphCanvasProps): React.JSX.Element => {
  const [pngAvailable, setPngAvailable] = useState<boolean | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<Core | null>(null)
  const directionRef = useRef(direction)
  const elementsSignatureRef = useRef('')
  const onSelectRef = useRef(onSelect)
  const onLayoutErrorRef = useRef(onLayoutError)
  const selectedKeyRef = useRef(selectedKey)
  const issueKeysRef = useRef(issueKeys)
  onSelectRef.current = onSelect
  onLayoutErrorRef.current = onLayoutError
  selectedKeyRef.current = selectedKey
  issueKeysRef.current = issueKeys
  const elements = useMemo(() => graphElements(analysis), [analysis])
  const elementsSignature = useMemo(() => JSON.stringify(elements), [elements])
  const visibleKeysSignature = useMemo(() => [...issueKeys].toSorted().join('\u0000'), [issueKeys])
  const visibleKeysSignatureRef = useRef(visibleKeysSignature)
  const initialGraphRef = useRef({
    colorMode,
    direction,
    elements,
    elementsSignature,
    issueKeys,
  })

  useEffect(() => {
    if (containerRef.current === null) return
    const initial = initialGraphRef.current
    elementsSignatureRef.current = initial.elementsSignature
    directionRef.current = initial.direction
    const cy = cytoscape({
      container: containerRef.current,
      elements: initial.elements,
      style: graphStyles(initial.colorMode),
      minZoom: 0.08,
      maxZoom: 2.5,
    })
    cyRef.current = cy
    setGraphVisibility(cy, initial.issueKeys)
    cy.on('tap', 'node', (event) => onSelectRef.current(event.target.id()))
    runLayout(
      cy,
      initial.direction,
      false,
      (graph) => {
        centerGraph(graph, selectedKeyRef.current)
        setPngAvailable(pngExportAvailable(graph))
      },
      onLayoutErrorRef.current,
    )
    return () => {
      cy.destroy()
      cyRef.current = null
    }
  }, [])

  useEffect(() => {
    cyRef.current?.style(graphStyles(colorMode))
  }, [colorMode])

  useEffect(() => {
    const cy = cyRef.current
    if (cy === null) return
    const elementsChanged = elementsSignatureRef.current !== elementsSignature
    const directionChanged = directionRef.current !== direction
    elementsSignatureRef.current = elementsSignature
    directionRef.current = direction

    if (!elementsChanged && !directionChanged) {
      return
    }

    setPngAvailable(null)
    cy.stop(true)
    if (elementsChanged) {
      cy.elements().remove()
      cy.add(elements)
      setGraphVisibility(cy, issueKeysRef.current)
    }
    runLayout(
      cy,
      direction,
      true,
      (graph) => {
        if (directionChanged) fitGraph(graph)
        else centerGraph(graph, selectedKeyRef.current)
        setPngAvailable(pngExportAvailable(graph))
      },
      onLayoutErrorRef.current,
    )
  }, [direction, elements, elementsSignature])

  useEffect(() => {
    if (visibleKeysSignatureRef.current === visibleKeysSignature) return
    visibleKeysSignatureRef.current = visibleKeysSignature
    const cy = cyRef.current
    if (cy === null) return
    setGraphVisibility(cy, issueKeysRef.current)
    fitGraph(cy)
    setPngAvailable(pngExportAvailable(cy))
  }, [visibleKeysSignature])

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
          {warning.length > 0 ? <GraphToolbarNotice message={warning} /> : null}
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
            onClick={() => {
              const cy = cyRef.current
              if (cy !== null) fitGraph(cy)
            }}
            size="small"
            variant="invisible"
          >
            Fit
          </Button>
          <Button
            aria-label="Download graph as SVG"
            leadingVisual={FileCodeIcon}
            onClick={() => {
              const cy = cyRef.current
              if (cy !== null) downloadSvg(cy, direction, colorMode)
            }}
            size="small"
            variant="invisible"
          >
            SVG
          </Button>
          <Tooltip
            direction="sw"
            text={
              pngAvailable === null
                ? 'PNG availability is being measured.'
                : pngAvailable
                  ? 'Download the visible graph as PNG.'
                  : 'PNG is limited to 6,000 pixels per dimension. Download SVG for the complete graph.'
            }
            type="description"
          >
            <Button
              aria-disabled={pngAvailable !== true}
              aria-label="Download graph as PNG"
              inactive={pngAvailable !== true}
              leadingVisual={DownloadIcon}
              onClick={() => {
                const cy = cyRef.current
                if (cy !== null && pngAvailable === true) downloadPng(cy)
              }}
              size="small"
              variant="invisible"
            >
              PNG
            </Button>
          </Tooltip>
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
