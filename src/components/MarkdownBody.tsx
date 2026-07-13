import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const MarkdownTaskInput = (props: React.ComponentProps<'input'>): React.JSX.Element => (
  <input {...props} aria-label={props.checked ? 'Completed task' : 'Incomplete task'} />
)

const markdownComponents = { input: MarkdownTaskInput }

const MarkdownBody = ({ body }: { body: string }): React.JSX.Element => (
  <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
    {body}
  </ReactMarkdown>
)

export default MarkdownBody
