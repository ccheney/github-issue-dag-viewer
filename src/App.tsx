import { AlertIcon, SyncIcon } from '@primer/octicons-react'
import { BaseStyles, Flash, Spinner, ThemeProvider } from '@primer/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppHeader } from './components/AppHeader'
import { FilterPanel } from './components/FilterPanel'
import { GraphCanvas, type LayoutDirection } from './components/GraphCanvas'
import { IssueInspector } from './components/IssueInspector'
import { IssueList } from './components/IssueList'
import { RepositoryDialog } from './components/RepositoryDialog'
import { StatsBar } from './components/StatsBar'
import { demoSnapshot } from './demo/demo-data'
import { availableLabels, filterIssueKeys } from './domain/filters'
import { analyzeGraph } from './domain/graph'
import type { GraphFilters, LoadProgress, RepositorySnapshot } from './domain/types'
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

export default function App(): React.JSX.Element {
  const initialRepository = repositoryFromUrl()
  const [colorMode, resolvedColorMode, toggleColorMode] = useColorMode()
  const [snapshot, setSnapshot] = useState<RepositorySnapshot>(demoSnapshot)
  const [source, setSource] = useState<'demo' | 'github'>('demo')
  const [filters, setFilters] = useState<GraphFilters>(initialFilters)
  const [filterRevision, setFilterRevision] = useState(0)
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
  const updateFilters = (nextFilters: GraphFilters): void => {
    setFilters(nextFilters)
    setFilterRevision((revision) => revision + 1)
  }

  useEffect(() => {
    if (selectedKey !== null && visibleKeys.has(selectedKey)) return
    setSelectedKey([...visibleKeys][0] ?? null)
  }, [selectedKey, visibleKeys])

  useEffect(() => {
    if (
      source !== 'github' ||
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
  }, [selectedIssue, snapshot.repository, source])

  const loadRepository = useCallback(async (input: string, token: string): Promise<void> => {
    try {
      const repository = parseRepositoryInput(input)
      if (token.trim().length === 0) throw new Error('A GitHub token is required for GraphQL.')
      loadAbortRef.current?.abort()
      const controller = new AbortController()
      loadAbortRef.current = controller
      setLoading(true)
      setError(null)
      setProgress({ loaded: 0, total: 0 })
      const loaded = await fetchRepositorySnapshot(
        repository,
        token.trim(),
        setProgress,
        controller.signal,
      )
      tokenRef.current = token.trim()
      setSnapshot(loaded)
      setSource('github')
      setFilters(initialFilters())
      setSelectedKey(selectInitialIssue(loaded))
      setDialogOpen(false)
      const url = new URL(window.location.href)
      url.searchParams.set('repo', loaded.repository.nameWithOwner)
      window.history.replaceState(null, '', url)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to load repository.')
    } finally {
      setLoading(false)
      setProgress(null)
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
    const url = new URL(window.location.href)
    url.searchParams.delete('repo')
    window.history.replaceState(null, '', url)
  }

  const hasTruncatedDependencies = snapshot.issues.some(
    ({ dependencyDataTruncated }) => dependencyDataTruncated,
  )

  return (
    <ThemeProvider colorMode={colorMode} dayScheme="light" nightScheme="dark">
      <BaseStyles className="app-root">
        <AppHeader
          colorMode={colorMode}
          onChangeRepository={() => setDialogOpen(true)}
          onExport={() => downloadJson(snapshot, visibleKeys)}
          onToggleColorMode={toggleColorMode}
          repository={snapshot.repository.nameWithOwner}
          source={source}
        />
        <StatsBar stats={analysis.stats} />

        {analysis.cycles.length > 0 || hasTruncatedDependencies ? (
          <Flash className="graph-warning" variant="warning">
            <AlertIcon size={16} />{' '}
            {analysis.cycles.length > 0
              ? `${analysis.cycles.length} dependency cycle${analysis.cycles.length === 1 ? '' : 's'} detected. `
              : ''}
            {hasTruncatedDependencies
              ? 'At least one issue has more than 100 dependency relationships; that node is partial.'
              : ''}
          </Flash>
        ) : null}

        <main className="workspace">
          <aside className={`issue-rail ${issuesOpen ? 'mobile-panel-open' : ''}`}>
            <FilterPanel
              filters={filters}
              labels={labels}
              onChange={updateFilters}
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
          <GraphCanvas
            analysis={analysis}
            colorMode={resolvedColorMode}
            direction={direction}
            fitRevision={filterRevision}
            issueKeys={visibleKeys}
            onDirectionChange={setDirection}
            onOpenInspector={() => setInspectorOpen(true)}
            onOpenIssues={() => setIssuesOpen(true)}
            onSelect={selectIssue}
            selectedKey={selectedKey}
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

        {loading ? (
          <div aria-live="polite" className="load-overlay">
            <Spinner size="medium" />
            <strong>Reading issue dependencies</strong>
            <span>
              {progress === null || progress.total === 0
                ? 'Connecting to GitHub…'
                : `${progress.loaded.toLocaleString()} of ${progress.total.toLocaleString()} issues`}
            </span>
          </div>
        ) : null}

        <RepositoryDialog
          error={error}
          initialRepository={initialRepository || snapshot.repository.url}
          loading={loading}
          onClose={() => setDialogOpen(false)}
          onConnect={(repository, token) => void loadRepository(repository, token)}
          onDemo={loadDemo}
          open={dialogOpen}
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
