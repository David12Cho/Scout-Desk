/**
 * Tier board data layer — localStorage implementation.
 * Swap this module for a Hasura/GraphQL implementation without touching any UI code.
 */
import type { Tier, TierEntry, TierBoard } from '@/types'

const BOARDS_KEY = 'scoutdesk:tier_boards'
const TIERS_KEY = 'scoutdesk:tiers'
const ENTRIES_KEY = 'scoutdesk:tier_entries'

const DEFAULT_TIERS = [
  { name: 'Round 1 Lock', color: '#3b82f6' },
  { name: 'Round 1', color: '#8b5cf6' },
  { name: 'Round 2', color: '#10b981' },
  { name: 'Round 3', color: '#f59e0b' },
  { name: 'Later Rounds', color: '#6b7280' },
  { name: 'Pass', color: '#ef4444' },
]

function read<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]')
  } catch {
    return []
  }
}

function write<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

function uuid(): string {
  return crypto.randomUUID()
}

export const tierBoardStore = {
  getOrCreateBoard(ownerId: string, season: number): TierBoard {
    const boards = read<TierBoard>(BOARDS_KEY)
    const existing = boards.find((b) => b.ownerId === ownerId && b.season === season)
    if (existing) return existing

    const board: TierBoard = { id: uuid(), ownerId, season }
    write(BOARDS_KEY, [...boards, board])

    // Seed default tiers
    const tiers = read<Tier>(TIERS_KEY)
    const seeded = DEFAULT_TIERS.map((t, i) => ({
      id: uuid(),
      boardId: board.id,
      name: t.name,
      color: t.color,
      orderIndex: i,
    }))
    write(TIERS_KEY, [...tiers, ...seeded])

    return board
  },

  getTiers(boardId: string): Tier[] {
    return read<Tier>(TIERS_KEY)
      .filter((t) => t.boardId === boardId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
  },

  upsertTier(tier: Tier): void {
    const tiers = read<Tier>(TIERS_KEY)
    const idx = tiers.findIndex((t) => t.id === tier.id)
    if (idx >= 0) tiers[idx] = tier
    else tiers.push(tier)
    write(TIERS_KEY, tiers)
  },

  deleteTier(tierId: string): void {
    write(TIERS_KEY, read<Tier>(TIERS_KEY).filter((t) => t.id !== tierId))
    write(ENTRIES_KEY, read<TierEntry>(ENTRIES_KEY).filter((e) => e.tierId !== tierId))
  },

  getEntries(boardId: string): TierEntry[] {
    const tierIds = new Set(
      read<Tier>(TIERS_KEY)
        .filter((t) => t.boardId === boardId)
        .map((t) => t.id),
    )
    return read<TierEntry>(ENTRIES_KEY).filter((e) => tierIds.has(e.tierId))
  },

  upsertEntry(entry: TierEntry): void {
    const entries = read<TierEntry>(ENTRIES_KEY)
    const idx = entries.findIndex((e) => e.id === entry.id)
    if (idx >= 0) entries[idx] = entry
    else entries.push(entry)
    write(ENTRIES_KEY, entries)
  },

  moveEntry(entryId: string, toTierId: string, toIndex: number): void {
    const entries = read<TierEntry>(ENTRIES_KEY)
    const entry = entries.find((e) => e.id === entryId)
    if (!entry) return
    entry.tierId = toTierId
    entry.orderIndex = toIndex
    entry.updatedAt = new Date().toISOString()
    write(ENTRIES_KEY, entries)
  },

  deleteEntry(entryId: string): void {
    write(ENTRIES_KEY, read<TierEntry>(ENTRIES_KEY).filter((e) => e.id !== entryId))
  },
}
