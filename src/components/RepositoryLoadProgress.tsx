import type { LoadProgress } from '../domain/types'

export const loadProgressText = ({ loaded, total }: LoadProgress): string =>
  total === 0
    ? 'Connecting to GitHub…'
    : `${loaded.toLocaleString()} of ${total.toLocaleString()} issues`

export const RepositoryLoadProgress = ({
  progress,
}: {
  progress: LoadProgress
}): React.JSX.Element => (
  <div className="repository-load-progress">
    <span>{loadProgressText(progress)}</span>
    {progress.total === 0 ? (
      <progress aria-label="Repository load progress" />
    ) : (
      <progress
        aria-label="Repository load progress"
        max={progress.total}
        value={progress.loaded}
      />
    )}
  </div>
)
