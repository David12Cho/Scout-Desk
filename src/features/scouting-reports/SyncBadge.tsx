import type { SyncStatus } from '@/types'

const CONFIG: Record<SyncStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-900/50 text-amber-400' },
  synced:  { label: 'Synced',  className: 'bg-green-900/50 text-green-400' },
  failed:  { label: 'Failed',  className: 'bg-red-900/50 text-red-400' },
}

export default function SyncBadge({ status }: { status: SyncStatus }) {
  const { label, className } = CONFIG[status]
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${className}`}>
      {label}
    </span>
  )
}
