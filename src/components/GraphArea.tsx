import { lazy, Suspense, useState } from 'react'
import { graphDeliveryMode } from '../domain/graph-delivery'
import type { GraphAnalysis, LoadProgress } from '../domain/types'
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
  loadProgress: LoadProgress | null
  selectedKey: string | null
  warning: string
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
  loadProgress,
  selectedKey,
  warning,
  onDirectionChange,
  onOpenInspector,
  onOpenIssues,
  onSelect,
}: GraphAreaProps): React.JSX.Element => {
  const [largeGraphEnabled, setLargeGraphEnabled] = useState(false)
  const [layoutError, setLayoutError] = useState<string | null>(null)
  const mode = graphDeliveryMode(analysis.nodes.size)
  const shouldRender = mode === 'automatic' || largeGraphEnabled
  const graphWarning = [
    warning,
    layoutError === null
      ? ''
      : `Graph layout failed: ${layoutError}. Use the issue list, filters, and JSON export.`,
  ]
    .filter((message) => message.length > 0)
    .join(' ')

  if (loadProgress !== null) {
    return (
      <GraphGate
        issueCount={analysis.nodes.size}
        mode="repository-loading"
        onOpenInspector={onOpenInspector}
        onOpenIssues={onOpenIssues}
        progress={loadProgress}
        selected={selectedKey !== null}
        warning=""
      />
    )
  }

  return (
    <>
      {shouldRender ? (
        <Suspense
          fallback={
            <GraphGate
              issueCount={analysis.nodes.size}
              mode="loading"
              onOpenInspector={onOpenInspector}
              onOpenIssues={onOpenIssues}
              selected={selectedKey !== null}
              warning={graphWarning}
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
            warning={graphWarning}
          />
        </Suspense>
      ) : (
        <GraphGate
          issueCount={analysis.nodes.size}
          mode={mode}
          onOpenInspector={onOpenInspector}
          onOpenIssues={onOpenIssues}
          selected={selectedKey !== null}
          warning={graphWarning}
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
