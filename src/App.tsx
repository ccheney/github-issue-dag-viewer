import { SyncIcon } from '@primer/octicons-react'
import { BaseStyles, Spinner, ThemeProvider } from '@primer/react'
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppHeader } from './components/AppHeader'
import { FilterPanel } from './components/FilterPanel'
import { GraphArea } from './components/GraphArea'
import type { LayoutDirection } from './components/GraphCanvas'
import { IssueInspector } from './components/IssueInspector'
import { IssueList } from './components/IssueList'
import { RepositoryDialog } from './components/RepositoryDialog'
import { RepositoryLoadProgress } from './components/RepositoryLoadProgress'
import { StatsBar } from './components/StatsBar'
import { demoSnapshot } from './demo/demo-data'
import { availableLabels, filterIssueKeys } from './domain/filters'
import { analyzeGraph } from './domain/graph'
import type { GraphAnalysis, GraphFilters, LoadProgress, RepositorySnapshot } from './domain/types'
import { fetchIssueBody, fetchRepositorySnapshot } from './github/client'
import { parseRepositoryInput } from './github/parse-repository'
import { useColorMode } from './hooks/use-color-mode'
import './styles/base.css'
import './styles/shell.css'
import './styles/details.css'
import './styles/graph.css'
import './styles/responsive.css'

const initialFilters = (): GraphFilters => ({
  query: 'is:issue',
  state: 'all',
  readiness: 'all',
  labels: new Set(),
  showExternal: true,
})

const repositoryFromUrl = (): string =>
  new URLSearchParams(window.location.search).get('repo') ?? ''

const updateRepositoryUrl = (repository: string | null): void => {
  const url = new URL(window.location.href)
  if (repository === null) url.searchParams.delete('repo')
  else url.searchParams.set('repo', repository)
  window.history.replaceState(null, '', url)
}

const downloadJson = (snapshot: RepositorySnapshot, keys: ReadonlySet<string>): void => {
  const issues = snapshot.issues.filter(({ key }) => keys.has(key))
  const blob = new Blob(
    [
      JSON.stringify(
        { repository: snapshot.repository, fetchedAt: snapshot.fetchedAt, issues },
        null,
        2,
      ),
    ],
    { type: 'application/json' },
  )
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.download = `${snapshot.repository.name}-issue-dependencies.json`
  anchor.href = url
  anchor.click()
  URL.revokeObjectURL(url)
}

const selectInitialIssue = (snapshot: RepositorySnapshot): string | null => {
  const analysis = analyzeGraph(snapshot.issues)
  return (
    [...analysis.ready][0] ?? snapshot.issues.find(({ state }) => state === 'OPEN')?.key ?? null
  )
}

const graphWarningFor = (analysis: GraphAnalysis, snapshot: RepositorySnapshot): string =>
  [
    analysis.cycles.length > 0
      ? `${analysis.cycles.length} dependency cycle${analysis.cycles.length === 1 ? '' : 's'} detected.`
      : null,
    snapshot.issues.some(({ dependencyDataTruncated }) => dependencyDataTruncated)
      ? 'At least one issue has more than 100 dependency relationships; that node is partial.'
      : null,
  ]
    .filter((message): message is string => message !== null)
    .join(' ')

const RepositoryLoadOverlay = ({ progress }: { progress: LoadProgress }): React.JSX.Element => (
  <div className="load-overlay">
    <Spinner size="medium" />
    <div className="load-overlay-content">
      <strong>Reading issue dependencies</strong>
      <RepositoryLoadProgress progress={progress} />
    </div>
  </div>
)

export default function App(): React.JSX.Element {
  const initialRepository = repositoryFromUrl()
  const colorMode = useColorMode()
  const [snapshot, setSnapshot] = useState<RepositorySnapshot>(demoSnapshot)
  const [source, setSource] = useState<'demo' | 'github'>('demo')
  const [filters, setFilters] = useState<GraphFilters>(initialFilters)
  const [selectedKey, setSelectedKey] = useState<string | null>(() =>
    selectInitialIssue(demoSnapshot),
  )
  const [direction, setDirection] = useState<LayoutDirection>('LR')
  const [dialogOpen, setDialogOpen] = useState(initialRepository.length > 0)
  const [loading, setLoading] = useState(false)
  const [bodyLoading, setBodyLoading] = useState(false)
  const [issuesOpen, setIssuesOpen] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [progress, setProgress] = useState<LoadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const tokenRef = useRef('')
  const loadAbortRef = useRef<AbortController | null>(null)

  const analysis = useMemo(() => analyzeGraph(snapshot.issues), [snapshot.issues])
  const visibleKeys = useMemo(() => filterIssueKeys(analysis, filters), [analysis, filters])
  const labels = useMemo(() => availableLabels(analysis), [analysis])
  const selectedIssue = selectedKey === null ? null : (analysis.nodes.get(selectedKey) ?? null)
  const selectIssue = (key: string): void => {
    setSelectedKey(key)
    setInspectorOpen(true)
  }

  useEffect(() => {
    if (selectedKey !== null && visibleKeys.has(selectedKey)) return
    setSelectedKey([...visibleKeys][0] ?? null)
  }, [selectedKey, visibleKeys])

  useEffect(() => {
    if (
      source !== 'github' ||
      loading ||
      selectedIssue === null ||
      selectedIssue.isExternal ||
      selectedIssue.body !== null ||
      tokenRef.current.length === 0
    ) {
      return
    }

    const controller = new AbortController()
    setBodyLoading(true)
    fetchIssueBody(snapshot.repository, selectedIssue.number, tokenRef.current, controller.signal)
      .then((body) =>
        setSnapshot((current) => ({
          ...current,
          issues: current.issues.map((issue) =>
            issue.key === selectedIssue.key ? { ...issue, body } : issue,
          ),
        })),
      )
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setError(reason instanceof Error ? reason.message : 'Unable to load issue.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setBodyLoading(false)
      })
    return () => controller.abort()
  }, [loading, selectedIssue, snapshot.repository, source])

  const loadRepository = useCallback(async (input: string, token: string): Promise<void> => {
    let controller: AbortController | null = null
    try {
      const repository = parseRepositoryInput(input)
      const normalizedToken = token.trim()
      if (normalizedToken.length === 0) throw new Error('A GitHub token is required for GraphQL.')
      loadAbortRef.current?.abort()
      controller = new AbortController()
      loadAbortRef.current = controller
      tokenRef.current = normalizedToken
      setLoading(true)
      setError(null)
      setProgress({ loaded: 0, total: 0 })
      let published = false
      const loaded = await fetchRepositorySnapshot(
        repository,
        normalizedToken,
        ({ progress: nextProgress, snapshot: partialSnapshot }) => {
          setProgress(nextProgress)
          if (published) {
            startTransition(() => setSnapshot(partialSnapshot))
            return
          }

          published = true
          setSnapshot(partialSnapshot)
          setSource('github')
          setFilters(initialFilters())
          setSelectedKey(selectInitialIssue(partialSnapshot))
          setDialogOpen(false)
          updateRepositoryUrl(partialSnapshot.repository.nameWithOwner)
        },
        controller.signal,
      )
      if (controller.signal.aborted) return
      setSnapshot(loaded)
    } catch (reason) {
      if (controller?.signal.aborted) return
      tokenRef.current = ''
      setError(reason instanceof Error ? reason.message : 'Unable to load repository.')
      setDialogOpen(true)
    } finally {
      if (controller === null || loadAbortRef.current === controller) {
        loadAbortRef.current = null
        setLoading(false)
        setProgress(null)
      }
    }
  }, [])

  const loadDemo = (): void => {
    loadAbortRef.current?.abort()
    tokenRef.current = ''
    setSnapshot({ ...demoSnapshot, fetchedAt: new Date().toISOString() })
    setSource('demo')
    setFilters(initialFilters())
    setSelectedKey(selectInitialIssue(demoSnapshot))
    setDialogOpen(false)
    setError(null)
    updateRepositoryUrl(null)
  }

  const graphWarning = loading ? '' : graphWarningFor(analysis, snapshot)

  return (
    <ThemeProvider colorMode="auto" dayScheme="light" nightScheme="dark">
      <BaseStyles className="app-root">
        <AppHeader
          loading={loading}
          onChangeRepository={() => setDialogOpen(true)}
          onExport={() => downloadJson(snapshot, visibleKeys)}
          repository={snapshot.repository.nameWithOwner}
          source={source}
        />
        <StatsBar stats={analysis.stats} />

        <main className="workspace">
          <aside className={`issue-rail ${issuesOpen ? 'mobile-panel-open' : ''}`}>
            <FilterPanel
              filters={filters}
              labels={labels}
              onChange={setFilters}
              onClose={() => setIssuesOpen(false)}
              resultCount={visibleKeys.size}
            />
            <IssueList
              analysis={analysis}
              issueKeys={visibleKeys}
              onSelect={selectIssue}
              selectedKey={selectedKey}
            />
          </aside>
          <GraphArea
            analysis={analysis}
            colorMode={colorMode}
            direction={direction}
            issueKeys={visibleKeys}
            key={snapshot.fetchedAt}
            loadProgress={progress}
            onDirectionChange={setDirection}
            onOpenInspector={() => setInspectorOpen(true)}
            onOpenIssues={() => setIssuesOpen(true)}
            onSelect={selectIssue}
            selectedKey={selectedKey}
            warning={graphWarning}
          />
          <div
            className={
              inspectorOpen ? 'inspector-container mobile-panel-open' : 'inspector-container'
            }
          >
            <IssueInspector
              analysis={analysis}
              bodyLoading={bodyLoading}
              issue={selectedIssue}
              onClose={() => setInspectorOpen(false)}
            />
          </div>
        </main>

        {loading && progress !== null ? <RepositoryLoadOverlay progress={progress} /> : null}

        <RepositoryDialog
          error={error}
          initialRepository={initialRepository || snapshot.repository.url}
          loading={loading}
          onClose={() => setDialogOpen(false)}
          onConnect={(repository, token) => void loadRepository(repository, token)}
          onDemo={loadDemo}
          open={dialogOpen}
          progress={progress}
        />
        <div aria-live="polite" className="sr-only">
          {loading ? (
            <>
              <SyncIcon /> Loading repository
            </>
          ) : null}
        </div>
      </BaseStyles>
    </ThemeProvider>
  )
}
