import {
  DownloadIcon,
  KeyIcon,
  MarkGithubIcon,
  MoonIcon,
  RepoIcon,
  SunIcon,
} from '@primer/octicons-react'
import { Button, Text } from '@primer/react'
import type { ColorMode } from '../hooks/use-color-mode'

interface AppHeaderProps {
  colorMode: ColorMode
  repository: string
  source: 'demo' | 'github'
  onChangeRepository: () => void
  onExport: () => void
  onToggleColorMode: () => void
}

export const AppHeader = ({
  colorMode,
  repository,
  source,
  onChangeRepository,
  onExport,
  onToggleColorMode,
}: AppHeaderProps): React.JSX.Element => (
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
      <span>{repository}</span>
      <span className={`source-badge source-${source}`}>{source === 'demo' ? 'Demo' : 'Live'}</span>
    </div>

    <nav className="header-actions" aria-label="Application controls">
      <Button leadingVisual={DownloadIcon} onClick={onExport} variant="invisible">
        Export
      </Button>
      <Button
        aria-label={`Use ${colorMode === 'day' ? 'dark' : 'light'} mode`}
        leadingVisual={colorMode === 'day' ? MoonIcon : SunIcon}
        onClick={onToggleColorMode}
        variant="invisible"
      >
        Theme
      </Button>
      <Button leadingVisual={KeyIcon} onClick={onChangeRepository}>
        Open repository
      </Button>
    </nav>
  </header>
)
