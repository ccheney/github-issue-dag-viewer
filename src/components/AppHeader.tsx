import {
  DeviceDesktopIcon,
  DownloadIcon,
  KeyIcon,
  MarkGithubIcon,
  MoonIcon,
  RepoIcon,
  SunIcon,
} from '@primer/octicons-react'
import { Button, Link, Text } from '@primer/react'
import type { ColorModePreference } from '../hooks/use-color-mode'

interface AppHeaderProps {
  colorMode: ColorModePreference
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
}: AppHeaderProps): React.JSX.Element => {
  const [owner, name] = repository.split('/')
  const nextMode = colorMode === 'auto' ? 'light' : colorMode === 'light' ? 'dark' : 'system'
  const ThemeIcon =
    colorMode === 'auto' ? DeviceDesktopIcon : colorMode === 'light' ? SunIcon : MoonIcon

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
        <Button leadingVisual={DownloadIcon} onClick={onExport} variant="invisible">
          Export
        </Button>
        <Button
          aria-label={`Theme: ${colorMode === 'auto' ? 'system' : colorMode}. Switch to ${nextMode} mode`}
          leadingVisual={ThemeIcon}
          onClick={onToggleColorMode}
          variant="invisible"
        >
          {colorMode === 'auto' ? 'System' : colorMode === 'light' ? 'Light' : 'Dark'}
        </Button>
        <Button leadingVisual={KeyIcon} onClick={onChangeRepository}>
          Open repository
        </Button>
      </nav>
    </header>
  )
}
