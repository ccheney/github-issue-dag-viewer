import { DownloadIcon, KeyIcon, MarkGithubIcon, RepoIcon } from '@primer/octicons-react'
import { Button, Link, Text } from '@primer/react'

interface AppHeaderProps {
  repository: string
  source: 'demo' | 'github'
  onChangeRepository: () => void
  onExport: () => void
}

export const AppHeader = ({
  repository,
  source,
  onChangeRepository,
  onExport,
}: AppHeaderProps): React.JSX.Element => {
  const [owner, name] = repository.split('/')

  return (
    <header className="app-header">
      <div className="brand-lockup">
        <MarkGithubIcon aria-label="GitHub" size={32} />
        <div>
          <Text as="div" className="brand-name">
            Issue Atlas
          </Text>
          <Text as="div" className="brand-description">
            Dependency explorer
          </Text>
        </div>
      </div>

      <div className="repository-crumb" title={repository}>
        <RepoIcon size={16} />
        <span className="repository-links">
          <Link href={`https://github.com/${owner}`}>{owner}</Link>
          <span aria-hidden="true">/</span>
          <Link href={`https://github.com/${repository}`}>{name}</Link>
        </span>
        <span className={`source-badge source-${source}`}>
          {source === 'demo' ? 'Demo' : 'Live'}
        </span>
      </div>

      <nav className="header-actions" aria-label="Application controls">
        <Button
          aria-label="Export"
          leadingVisual={DownloadIcon}
          onClick={onExport}
          variant="invisible"
        >
          Export
        </Button>
        <Button leadingVisual={KeyIcon} onClick={onChangeRepository}>
          Open repository
        </Button>
      </nav>
    </header>
  )
}
