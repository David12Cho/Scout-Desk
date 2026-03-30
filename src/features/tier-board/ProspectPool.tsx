import { useDraggable } from '@dnd-kit/core'
import { useDroppable } from '@dnd-kit/core'
import type { DraftRankingProspect } from '@/api/nhle'
import { countryFlag } from '@/api/nhle'
import { prospectId } from './prospectId'

function PosBadge({ pos }: { pos: string }) {
  const cls =
    pos === 'G'
      ? 'bg-amber-900/50 text-amber-400'
      : pos === 'D'
      ? 'bg-blue-900/50 text-blue-400'
      : 'bg-green-900/50 text-green-400'
  return (
    <span className={`text-xs font-medium px-1 py-0.5 rounded shrink-0 ${cls}`}>{pos}</span>
  )
}

function PoolCard({ prospect }: { prospect: DraftRankingProspect }) {
  const id = prospectId(prospect)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `pool-${id}` })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={[
        'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-grab active:cursor-grabbing select-none transition-colors',
        isDragging ? 'opacity-40 bg-slate-700' : 'hover:bg-slate-800',
      ].join(' ')}
    >
      <PosBadge pos={prospect.positionCode} />
      <span className="text-sm leading-none">{countryFlag(prospect.birthCountry)}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-200 truncate">
          {prospect.firstName} {prospect.lastName}
        </p>
        <p className="text-xs text-slate-500">#{prospect.midtermRank}</p>
      </div>
    </div>
  )
}

interface Props {
  prospects: DraftRankingProspect[]
  search: string
  onSearchChange: (v: string) => void
}

export default function ProspectPool({ prospects, search, onSearchChange }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: 'droppable-pool' })

  const filtered = prospects.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="w-64 shrink-0 flex flex-col border-r border-slate-800 bg-slate-950">
      {/* Pool header */}
      <div className="px-3 pt-3 pb-2 border-b border-slate-800">
        <p className="text-xs font-medium text-slate-400 mb-2">
          Prospect Pool{' '}
          <span className="text-slate-600">
            {filtered.length}/{prospects.length}
          </span>
        </p>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search prospects…"
          className="w-full bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Pool list */}
      <div ref={setNodeRef} className={['flex-1 overflow-y-auto px-2 py-1', isOver ? 'bg-slate-900/40' : ''].join(' ')}>
        {filtered.length === 0 ? (
          <p className="text-xs text-slate-600 text-center mt-4">No prospects found</p>
        ) : (
          filtered.map((p) => <PoolCard key={prospectId(p)} prospect={p} />)
        )}
      </div>
    </div>
  )
}
