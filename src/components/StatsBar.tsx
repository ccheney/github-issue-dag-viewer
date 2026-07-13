import {
  CheckCircleFillIcon,
  GitBranchIcon,
  IssueOpenedIcon,
  PulseIcon,
} from '@primer/octicons-react'
import type { GraphStats } from '../domain/types'

interface StatProps {
  icon: typeof IssueOpenedIcon
  label: string
  value: number
  tone?: 'default' | 'success' | 'attention'
}

const Stat = ({ icon: Icon, label, value, tone = 'default' }: StatProps): React.JSX.Element => (
  <div className={`stat stat-${tone}`}>
    <Icon size={14} />
    <span className="stat-value">{value.toLocaleString()}</span>
    <span className="stat-label">{label}</span>
  </div>
)

export const StatsBar = ({ stats }: { stats: GraphStats }): React.JSX.Element => (
  <section className="stats-bar" aria-label="Graph summary">
    <Stat icon={IssueOpenedIcon} label="open" value={stats.open} />
    <Stat icon={CheckCircleFillIcon} label="ready" tone="success" value={stats.ready} />
    <Stat icon={GitBranchIcon} label="blocked" value={stats.blocked} />
    <Stat icon={PulseIcon} label="layers" value={stats.maxDepth + 1} />
    {stats.cycles > 0 ? (
      <Stat icon={GitBranchIcon} label="cycles" tone="attention" value={stats.cycles} />
    ) : null}
  </section>
)
