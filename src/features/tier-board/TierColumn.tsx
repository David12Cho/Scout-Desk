import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import type { ScoutFlag, Tier, TierEntry } from '@/types'
import type { DraftRankingProspect } from '@/api/nhle'
import ProspectCard from './ProspectCard'

const COLOR_OPTIONS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#6b7280', '#ef4444']

interface Props {
  tier: Tier
  entries: TierEntry[]
  prospectMap: Map<number, DraftRankingProspect>
  onRename: (tierId: string, name: string) => void
  onColorChange: (tierId: string, color: string) => void
  onDelete: (tierId: string) => void
  onNotesChange: (entryId: string, notes: string) => void
  onFlagsChange: (entryId: string, flags: ScoutFlag[]) => void
  onRemoveEntry: (entryId: string) => void
}

export default function TierColumn({
  tier,
  entries,
  prospectMap,
  onRename,
  onColorChange,
  onDelete,
  onNotesChange,
  onFlagsChange,
  onRemoveEntry,
}: Props) {
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(tier.name)
  const [showColorPicker, setShowColorPicker] = useState(false)

  const { setNodeRef, isOver } = useDroppable({ id: `tier-${tier.id}` })

  const sortedEntries = [...entries].sort((a, b) => a.orderIndex - b.orderIndex)
  const entryIds = sortedEntries.map((e) => `entry-${e.id}`)

  function handleNameBlur() {
    setEditingName(false)
    const trimmed = nameValue.trim() || tier.name
    setNameValue(trimmed)
    onRename(tier.id, trimmed)
  }

  function handleDelete() {
    if (entries.length > 0) {
      if (!window.confirm(`Delete "${tier.name}"? This will remove all ${entries.length} prospect(s) from this tier.`)) return
    }
    onDelete(tier.id)
  }

  return (
    <div className="mb-2 bg-slate-900 rounded-lg border border-slate-800">
      {/* Tier header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800">
        {/* Color dot */}
        <div className="relative">
          <button
            onClick={() => setShowColorPicker((v) => !v)}
            className="w-3.5 h-3.5 rounded-full shrink-0 ring-1 ring-slate-600 hover:ring-slate-400 transition-all"
            style={{ backgroundColor: tier.color }}
            title="Change color"
          />
          {showColorPicker && (
            <div className="absolute z-50 top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2 flex gap-1.5 shadow-xl">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => { onColorChange(tier.id, c); setShowColorPicker(false) }}
                  className="w-5 h-5 rounded-full ring-1 ring-slate-600 hover:ring-white transition-all"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Tier name */}
        {editingName ? (
          <input
            autoFocus
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => { if (e.key === 'Enter') handleNameBlur() }}
            className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-0.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
          />
        ) : (
          <button
            onClick={() => { setEditingName(true); setNameValue(tier.name) }}
            className="flex-1 text-left text-sm font-medium text-slate-200 hover:text-white transition-colors truncate"
          >
            {tier.name}
          </button>
        )}

        <span className="text-xs text-slate-500 shrink-0">{entries.length}</span>

        <button
          onClick={handleDelete}
          className="text-slate-600 hover:text-red-400 transition-colors text-sm leading-none shrink-0"
          title="Delete tier"
        >
          ×
        </button>
      </div>

      {/* Drop zone */}
      <SortableContext items={entryIds} strategy={horizontalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={[
            'flex items-start gap-2 p-3 min-h-[80px] overflow-x-auto',
            isOver ? 'bg-slate-800/50' : '',
          ].join(' ')}
        >
          {sortedEntries.length === 0 ? (
            <div className="flex-1 flex items-center justify-center min-h-[56px] border border-dashed border-slate-700 rounded-lg">
              <span className="text-xs text-slate-600">Drop prospects here</span>
            </div>
          ) : (
            sortedEntries.map((entry) => (
              <ProspectCard
                key={entry.id}
                entry={entry}
                prospect={prospectMap.get(entry.playerId)}
                onNotesChange={onNotesChange}
                onFlagsChange={onFlagsChange}
                onRemove={onRemoveEntry}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}
