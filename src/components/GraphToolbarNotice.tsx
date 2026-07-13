import { AlertIcon } from '@primer/octicons-react'
import { IconButton } from '@primer/react'

export const GraphToolbarNotice = ({ message }: { message: string }): React.JSX.Element => (
  <IconButton
    aria-disabled="true"
    aria-label="Graph warning"
    description={message}
    icon={AlertIcon}
    inactive
    size="small"
    tooltipDirection="sw"
    variant="invisible"
  />
)
