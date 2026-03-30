import { useState, useEffect, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import type { ScoutFlag, Tier, TierEntry } from '@/types'
import type { DraftRankingProspect } from '@/api/nhle'
import { countryFlag } from '@/api/nhle'
import { useDraftRankings } from '@/hooks/useDraftRankings'
import { tierBoardStore } from '@/lib/tierBoard.store'
import { prospectId } from './prospectId'
import TierColumn from './TierColumn'
import ProspectPool from './ProspectPool'
import AddTierButton from './AddTierButton'

const DRAFT_SEASONS = [2025, 2024, 2023]

// Minimal floating card shown in DragOverlay
function OverlayCard({ prospect }: { prospect: DraftRankingProspect | undefined }) {
  if (!prospect) return null
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-2 w-40 shadow-xl opacity-90">
      <p className="text-xs font-medium text-slate-100 truncate">
        {prospect.firstName} {prospect.lastName}
      </p>
      <p className="text-xs text-slate-400 mt-0.5">
        {prospect.positionCode} · {countryFlag(prospect.birthCountry)}
      </p>
    </div>
  )
}

export default function TierBoard() {
  const [season, setSeason] = useState(2025)
  const [tiers, setTiers] = useState<Tier[]>([])
  const [entries, setEntries] = useState<TierEntry[]>([])
  const [search, setSearch] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)

  const { data: prospects = [], isLoading, isError } = useDraftRankings(season)

  // Board init / season switch
  useEffect(() => {
    const board = tierBoardStore.getOrCreateBoard('local', season)
    setTiers(tierBoardStore.getTiers(board.id))
    setEntries(tierBoardStore.getEntries(board.id))
  }, [season])

  // Map playerId → prospect for fast lookup
  const prospectMap = useMemo(() => {
    const map = new Map<number, DraftRankingProspect>()
    for (const p of prospects) map.set(prospectId(p), p)
    return map
  }, [prospects])

  // Prospects not yet placed
  const placedIds = useMemo(() => new Set(entries.map((e) => e.playerId)), [entries])
  const poolProspects = useMemo(
    () => prospects.filter((p) => !placedIds.has(prospectId(p))),
    [prospects, placedIds],
  )

  // Active prospect for overlay
  const activeProspect = useMemo(() => {
    if (!activeId) return undefined
    if (activeId.startsWith('pool-')) {
      return prospectMap.get(Number(activeId.slice(5)))
    }
    if (activeId.startsWith('entry-')) {
      const entryId = activeId.slice(6)
      const entry = entries.find((e) => e.id === entryId)
      return entry ? prospectMap.get(entry.playerId) : undefined
    }
    return undefined
  }, [activeId, entries, prospectMap])

  // Sensors — require 5px movement before drag starts (avoids accidental drags on clicks)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const activeStr = String(active.id)
    const overStr = String(over.id)

    // Resolve target tier ID
    let toTierId: string | null = null
    if (overStr.startsWith('tier-')) {
      toTierId = overStr.slice(5)
    } else if (overStr.startsWith('entry-')) {
      const overEntryId = overStr.slice(6)
      const overEntry = entries.find((e) => e.id === overEntryId)
      if (overEntry) toTierId = overEntry.tierId
    } else if (overStr === 'droppable-pool') {
      // Dropping back on pool — handled below for entry cards
    }

    // ── From pool → tier ──
    if (activeStr.startsWith('pool-')) {
      if (!toTierId) return
      const pid = Number(activeStr.slice(5))
      const tierEntries = entries.filter((e) => e.tierId === toTierId)
      const newEntry: TierEntry = {
        id: crypto.randomUUID(),
        tierId: toTierId,
        playerId: pid,
        orderIndex: tierEntries.length,
        flags: [],
        notes: '',
        updatedAt: new Date().toISOString(),
      }
      tierBoardStore.upsertEntry(newEntry)
      setEntries((prev) => [...prev, newEntry])
      return
    }

    // ── From entry ──
    if (activeStr.startsWith('entry-')) {
      const entryId = activeStr.slice(6)
      const entry = entries.find((e) => e.id === entryId)
      if (!entry) return

      // Dropped back on pool — remove from board
      if (overStr === 'droppable-pool' || !toTierId) {
        tierBoardStore.deleteEntry(entryId)
        setEntries((prev) => prev.filter((e) => e.id !== entryId))
        return
      }

      const tierEntries = entries
        .filter((e) => e.tierId === toTierId)
        .sort((a, b) => a.orderIndex - b.orderIndex)

      if (entry.tierId === toTierId) {
        // Reorder within same tier
        const oldIndex = tierEntries.findIndex((e) => e.id === entryId)
        let newIndex = tierEntries.length - 1
        if (overStr.startsWith('entry-')) {
          const overEntryId = overStr.slice(6)
          const idx = tierEntries.findIndex((e) => e.id === overEntryId)
          if (idx >= 0) newIndex = idx
        }
        if (oldIndex === newIndex) return
        const reordered = arrayMove(tierEntries, oldIndex, newIndex)
        const updated = entries.map((e) => {
          const pos = reordered.findIndex((r) => r.id === e.id)
          if (pos >= 0) return { ...e, orderIndex: pos }
          return e
        })
        // Persist
        reordered.forEach((e, i) => tierBoardStore.moveEntry(e.id, toTierId!, i))
        setEntries(updated)
      } else {
        // Move to different tier
        const newIndex = tierEntries.length
        tierBoardStore.moveEntry(entryId, toTierId, newIndex)
        setEntries((prev) =>
          prev.map((e) => (e.id === entryId ? { ...e, tierId: toTierId!, orderIndex: newIndex } : e)),
        )
      }
    }
  }

  // ── Tier mutations ──
  function handleAddTier() {
    const board = tierBoardStore.getOrCreateBoard('local', season)
    const newTier: Tier = {
      id: crypto.randomUUID(),
      boardId: board.id,
      name: 'New Tier',
      color: '#6b7280',
      orderIndex: tiers.length,
    }
    tierBoardStore.upsertTier(newTier)
    setTiers((prev) => [...prev, newTier])
  }

  function handleRename(tierId: string, name: string) {
    const tier = tiers.find((t) => t.id === tierId)
    if (!tier) return
    const updated = { ...tier, name }
    tierBoardStore.upsertTier(updated)
    setTiers((prev) => prev.map((t) => (t.id === tierId ? updated : t)))
  }

  function handleColorChange(tierId: string, color: string) {
    const tier = tiers.find((t) => t.id === tierId)
    if (!tier) return
    const updated = { ...tier, color }
    tierBoardStore.upsertTier(updated)
    setTiers((prev) => prev.map((t) => (t.id === tierId ? updated : t)))
  }

  function handleDeleteTier(tierId: string) {
    tierBoardStore.deleteTier(tierId)
    setTiers((prev) => prev.filter((t) => t.id !== tierId))
    setEntries((prev) => prev.filter((e) => e.tierId !== tierId))
  }

  // ── Entry mutations ──
  function handleNotesChange(entryId: string, notes: string) {
    const entry = entries.find((e) => e.id === entryId)
    if (!entry) return
    const updated = { ...entry, notes, updatedAt: new Date().toISOString() }
    tierBoardStore.upsertEntry(updated)
    setEntries((prev) => prev.map((e) => (e.id === entryId ? updated : e)))
  }

  function handleFlagsChange(entryId: string, flags: ScoutFlag[]) {
    const entry = entries.find((e) => e.id === entryId)
    if (!entry) return
    const updated = { ...entry, flags, updatedAt: new Date().toISOString() }
    tierBoardStore.upsertEntry(updated)
    setEntries((prev) => prev.map((e) => (e.id === entryId ? updated : e)))
  }

  function handleRemoveEntry(entryId: string) {
    tierBoardStore.deleteEntry(entryId)
    setEntries((prev) => prev.filter((e) => e.id !== entryId))
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Page header */}
      <div className="shrink-0 flex items-center gap-4 px-4 h-14 border-b border-slate-800 bg-slate-950">
        <div>
          <h1 className="text-sm font-semibold text-white">Tier Board</h1>
          <p className="text-xs text-slate-500">
            {isLoading ? 'Loading…' : isError ? 'Failed to load prospects' : `${prospects.length} prospects`}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <label className="text-xs text-slate-400 flex items-center gap-2">
            Draft
            <select
              value={season}
              onChange={(e) => setSeason(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {DRAFT_SEASONS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Two-panel body */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Prospect Pool */}
          <ProspectPool
            prospects={poolProspects}
            search={search}
            onSearchChange={setSearch}
          />

          {/* Right: Tier rows */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading && (
              <div className="text-slate-500 text-sm text-center mt-16">Loading prospects…</div>
            )}
            {isError && (
              <div className="text-red-400 text-sm text-center mt-16">Failed to load draft rankings.</div>
            )}
            {!isLoading && !isError && (
              <>
                {tiers.map((tier) => (
                  <TierColumn
                    key={tier.id}
                    tier={tier}
                    entries={entries.filter((e) => e.tierId === tier.id)}
                    prospectMap={prospectMap}
                    onRename={handleRename}
                    onColorChange={handleColorChange}
                    onDelete={handleDeleteTier}
                    onNotesChange={handleNotesChange}
                    onFlagsChange={handleFlagsChange}
                    onRemoveEntry={handleRemoveEntry}
                  />
                ))}
                <AddTierButton onAdd={handleAddTier} />
              </>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeId ? <OverlayCard prospect={activeProspect} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
