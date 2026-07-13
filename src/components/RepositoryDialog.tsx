import { KeyIcon, MarkGithubIcon, RepoIcon } from '@primer/octicons-react'
import { Button, Flash, FormControl, Link, TextInput } from '@primer/react'
import { useEffect, useRef, useState } from 'react'
import type { LoadProgress } from '../domain/types'
import { RepositoryLoadProgress } from './RepositoryLoadProgress'

const TOKEN_TEMPLATE_URL =
  'https://github.com/settings/personal-access-tokens/new?name=Issue%20Atlas&description=Read%20issue%20dependency%20graphs&expires_in=30&issues=read'

interface RepositoryDialogProps {
  open: boolean
  initialRepository: string
  loading: boolean
  progress: LoadProgress | null
  error: string | null
  onClose: () => void
  onConnect: (repository: string, token: string) => void
  onDemo: () => void
}

export const RepositoryDialog = ({
  open,
  initialRepository,
  loading,
  progress,
  error,
  onClose,
  onConnect,
  onDemo,
}: RepositoryDialogProps): React.JSX.Element => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [repository, setRepository] = useState(initialRepository)
  const [token, setToken] = useState('')

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog === null) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
    if (!open) setToken('')
  }, [open])

  const submit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    onConnect(repository, token)
  }

  return (
    <dialog
      aria-labelledby="repository-dialog-title"
      className="repository-dialog"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      ref={dialogRef}
    >
      <form onSubmit={submit}>
        <div className="dialog-mark">
          <MarkGithubIcon size={36} />
        </div>
        <h1 id="repository-dialog-title">Open an issue dependency graph</h1>
        <p>
          Enter any <strong>github.com</strong> repository. Issue Atlas reads native issue
          dependency relationships directly from GitHub GraphQL.
        </p>

        {error === null ? null : <Flash variant="danger">{error}</Flash>}

        <FormControl required>
          <FormControl.Label>Repository</FormControl.Label>
          <TextInput
            autoComplete="off"
            block
            leadingVisual={RepoIcon}
            onChange={(event) => setRepository(event.currentTarget.value)}
            placeholder="https://github.com/owner/repository"
            value={repository}
          />
        </FormControl>

        <FormControl required>
          <FormControl.Label>Read-only GitHub token</FormControl.Label>
          <TextInput
            autoComplete="off"
            block
            leadingVisual={KeyIcon}
            onChange={(event) => setToken(event.currentTarget.value)}
            placeholder="github_pat_… or ghp_…"
            type="password"
            value={token}
          />
          <FormControl.Caption>
            <Link href={TOKEN_TEMPLATE_URL} rel="noopener noreferrer" target="_blank">
              Create a fine-grained read-only token
            </Link>
            , choose repository access, then paste it here. The token stays only in this tab’s
            memory and is sent only to api.github.com.
          </FormControl.Caption>
        </FormControl>

        {loading && progress !== null ? (
          <div aria-live="polite" className="dialog-load-progress" role="status">
            <RepositoryLoadProgress progress={progress} />
          </div>
        ) : null}

        <div className="dialog-actions">
          <Button disabled={loading} onClick={onDemo} type="button" variant="invisible">
            Explore demo
          </Button>
          <Button disabled={loading} type="submit" variant="primary">
            {loading ? 'Loading issues…' : 'Load repository'}
          </Button>
        </div>
      </form>
    </dialog>
  )
}
