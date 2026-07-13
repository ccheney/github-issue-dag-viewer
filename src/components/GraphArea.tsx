import { Flash } from '@primer/react'
import { lazy, Suspense, useState } from 'react'
import { graphDeliveryMode } from '../domain/graph-delivery'
import type { GraphAnalysis } from '../domain/types'
import type { ColorMode } from '../hooks/use-color-mode'
import type { LayoutDirection } from './GraphCanvas'
import { GraphGate } from './GraphGate'

const GraphCanvas = lazy(async () => {
  const module = await import('./GraphCanvas')
  return { default: module.GraphCanvas }
})

interface GraphAreaProps {
  analysis: GraphAnalysis
  colorMode: ColorMode
  direction: LayoutDirection
  issueKeys: ReadonlySet<string>
  selectedKey: string | null
  onDirectionChange: (direction: LayoutDirection) => void
  onOpenInspector: () => void
  onOpenIssues: () => void
  onSelect: (key: string) => void
}

export const GraphArea = ({
  analysis,
  colorMode,
  direction,
  issueKeys,
  selectedKey,
  onDirectionChange,
  onOpenInspector,
  onOpenIssues,
  onSelect,
}: GraphAreaProps): React.JSX.Element => {
  const [largeGraphEnabled, setLargeGraphEnabled] = useState(false)
  const [layoutError, setLayoutError] = useState<string | null>(null)
  const mode = graphDeliveryMode(analysis.nodes.size)
  const shouldRender = mode === 'automatic' || largeGraphEnabled

  return (
    <>
      {layoutError === null ? null : (
        <Flash className="graph-warning" variant="warning">
          Graph layout failed: {layoutError}. Use the issue list, filters, and JSON export.
        </Flash>
      )}
      {shouldRender ? (
        <Suspense
          fallback={
            <GraphGate
              issueCount={analysis.nodes.size}
              mode="loading"
              onOpenInspector={onOpenInspector}
              onOpenIssues={onOpenIssues}
              selected={selectedKey !== null}
            />
          }
        >
          <GraphCanvas
            analysis={analysis}
            colorMode={colorMode}
            direction={direction}
            issueKeys={issueKeys}
            onDirectionChange={(nextDirection) => {
              setLayoutError(null)
              onDirectionChange(nextDirection)
            }}
            onLayoutError={setLayoutError}
            onOpenInspector={onOpenInspector}
            onOpenIssues={onOpenIssues}
            onSelect={onSelect}
            selectedKey={selectedKey}
          />
        </Suspense>
      ) : (
        <GraphGate
          issueCount={analysis.nodes.size}
          mode={mode}
          onOpenInspector={onOpenInspector}
          onOpenIssues={onOpenIssues}
          selected={selectedKey !== null}
          {...(mode === 'opt-in'
            ? {
                onRender: () => {
                  setLayoutError(null)
                  setLargeGraphEnabled(true)
                },
              }
            : {})}
        />
      )}
    </>
  )
}
