import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ScoutFlag, TierEntry } from '@/types'
import { SCOUT_FLAG_LABELS } from '@/types'
import type { DraftRankingProspect } from '@/api/nhle'
import { countryFlag } from '@/api/nhle'
import FlagPicker from './FlagPicker'

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

interface Props {
  entry: TierEntry
  prospect: DraftRankingProspect | undefined
  onNotesChange: (entryId: string, notes: string) => void
  onFlagsChange: (entryId: string, flags: ScoutFlag[]) => void
  onRemove: (entryId: string) => void
}

export default function ProspectCard({ entry, prospect, onNotesChange, onFlagsChange, onRemove }: Props) {
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState(entry.notes)
  const [showFlags, setShowFlags] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `entry-${entry.id}`,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const visibleFlags = entry.flags.slice(0, 3)
  const overflowCount = entry.flags.length - 3

  function handleNotesBlur() {
    setEditingNotes(false)
    onNotesChange(entry.id, notesValue)
  }

  if (!prospect) return null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'relative bg-slate-800 border border-slate-700 rounded-lg p-2 w-40 shrink-0 select-none',
        isDragging ? 'opacity-50' : '',
      ].join(' ')}
    >
      {/* Remove button */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onRemove(entry.id)}
        className="absolute top-1 right-1 text-slate-500 hover:text-red-400 text-xs leading-none w-4 h-4 flex items-center justify-center"
        title="Return to pool"
      >
        ×
      </button>

      {/* Drag handle area */}
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        {/* Name + badges */}
        <div className="flex items-center gap-1 mb-1 pr-4">
          <PosBadge pos={prospect.positionCode} />
          <span className="text-xs leading-none">{countryFlag(prospect.birthCountry)}</span>
        </div>
        <p className="text-xs font-medium text-slate-100 leading-tight pr-2 truncate">
          {prospect.firstName} {prospect.lastName}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          {prospect.shootsCatches} · #{prospect.midtermRank}
        </p>
      </div>

      {/* Flag badges */}
      {(entry.flags.length > 0 || true) && (
        <div className="relative flex flex-wrap gap-1 mt-1.5">
          {visibleFlags.map((f) => (
            <span
              key={f}
              className="text-xs bg-slate-700 text-slate-300 px-1 py-0.5 rounded truncate max-w-full"
              title={SCOUT_FLAG_LABELS[f]}
            >
              {SCOUT_FLAG_LABELS[f].split(' ')[0]}
            </span>
          ))}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setShowFlags((v) => !v)}
            className="text-xs bg-blue-900/50 text-blue-400 px-1 py-0.5 rounded hover:bg-blue-800/60 transition-colors"
          >
            {overflowCount > 0 ? `+${overflowCount}` : '✎'}
          </button>
          {showFlags && (
            <FlagPicker
              flags={entry.flags}
              onChange={(f) => onFlagsChange(entry.id, f)}
              onClose={() => setShowFlags(false)}
            />
          )}
        </div>
      )}

      {/* Notes */}
      <div className="mt-1.5">
        {editingNotes ? (
          <textarea
            autoFocus
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value.slice(0, 280))}
            onBlur={handleNotesBlur}
            onPointerDown={(e) => e.stopPropagation()}
            rows={3}
            className="w-full bg-slate-900 border border-slate-600 rounded text-xs text-slate-200 p-1 resize-none focus:outline-none focus:border-blue-500"
            placeholder="Notes..."
          />
        ) : (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setEditingNotes(true)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <span>✎</span>
            <span className="truncate max-w-28">{entry.notes || 'Add notes'}</span>
          </button>
        )}
      </div>
    </div>
  )
}
