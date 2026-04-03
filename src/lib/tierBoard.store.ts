/**
 * Tier board data layer — Hasura/GraphQL implementation.
 * userId is hardcoded "local" until Cognito auth is wired in.
 */
import { gql } from './hasura'
import type { Tier, TierEntry, TierBoard } from '@/types'

const DEFAULT_TIERS = [
  { name: 'Round 1 Lock', color: '#3b82f6' },
  { name: 'Round 1',      color: '#8b5cf6' },
  { name: 'Round 2',      color: '#10b981' },
  { name: 'Round 3',      color: '#f59e0b' },
  { name: 'Later Rounds', color: '#6b7280' },
  { name: 'Pass',         color: '#ef4444' },
]

export const tierBoardStore = {
  async getOrCreateBoard(ownerId: string, season: number): Promise<TierBoard> {
    // Ensure user row exists
    await gql(`
      mutation EnsureUser($id: String!) {
        insert_users_one(object: { id: $id }
          on_conflict: { constraint: users_pkey, update_columns: [] }) { id }
      }
    `, { id: ownerId })

    // Try to find existing board
    const existing = await gql<{ tier_boards: TierBoard[] }>(`
      query GetBoard($ownerId: String!, $season: Int!) {
        tier_boards(where: { owner_id: { _eq: $ownerId }, season: { _eq: $season } }) {
          id owner_id season
        }
      }
    `, { ownerId, season })

    if (existing.tier_boards.length > 0) return existing.tier_boards[0]

    // Create board + seed tiers in one mutation
    const result = await gql<{ insert_tier_boards_one: { id: string } }>(`
      mutation CreateBoard($ownerId: String!, $season: Int!, $tiers: [tiers_insert_input!]!) {
        insert_tier_boards_one(object: {
          owner_id: $ownerId
          season: $season
          tiers: { data: $tiers }
        }) { id }
      }
    `, {
      ownerId,
      season,
      tiers: DEFAULT_TIERS.map((t, i) => ({
        name: t.name,
        color: t.color,
        order_index: i,
      })),
    })

    return { id: result.insert_tier_boards_one.id, ownerId, season }
  },

  async getTiers(boardId: string): Promise<Tier[]> {
    const data = await gql<{ tiers: { id: string; board_id: string; name: string; color: string; order_index: number }[] }>(`
      query GetTiers($boardId: uuid!) {
        tiers(where: { board_id: { _eq: $boardId } }, order_by: { order_index: asc }) {
          id board_id name color order_index
        }
      }
    `, { boardId })
    return data.tiers.map((t) => ({
      id: t.id,
      boardId: t.board_id,
      name: t.name,
      color: t.color,
      orderIndex: t.order_index,
    }))
  },

  async upsertTier(tier: Tier): Promise<void> {
    await gql(`
      mutation UpsertTier($id: uuid!, $boardId: uuid!, $name: String!, $color: String!, $orderIndex: Int!) {
        insert_tiers_one(object: {
          id: $id board_id: $boardId name: $name color: $color order_index: $orderIndex
        } on_conflict: { constraint: tiers_pkey, update_columns: [name, color, order_index] }) { id }
      }
    `, {
      id: tier.id,
      boardId: tier.boardId,
      name: tier.name,
      color: tier.color,
      orderIndex: tier.orderIndex,
    })
  },

  async deleteTier(tierId: string): Promise<void> {
    await gql(`
      mutation DeleteTier($id: uuid!) {
        delete_tiers_by_pk(id: $id) { id }
      }
    `, { id: tierId })
  },

  async getEntries(boardId: string): Promise<TierEntry[]> {
    const data = await gql<{ tier_entries: { id: string; tier_id: string; player_id: number; order_index: number; flags: string[]; notes: string; updated_at: string }[] }>(`
      query GetEntries($boardId: uuid!) {
        tier_entries(
          where: { tier: { board_id: { _eq: $boardId } } }
          order_by: { order_index: asc }
        ) {
          id tier_id player_id order_index flags notes updated_at
        }
      }
    `, { boardId })
    return data.tier_entries.map((e) => ({
      id: e.id,
      tierId: e.tier_id,
      playerId: e.player_id,
      orderIndex: e.order_index,
      flags: e.flags as import('@/types').ScoutFlag[],
      notes: e.notes,
      updatedAt: e.updated_at,
    }))
  },

  async upsertEntry(entry: TierEntry): Promise<void> {
    await gql(`
      mutation UpsertEntry($id: uuid!, $tierId: uuid!, $playerId: Int!, $orderIndex: Int!, $flags: _text!, $notes: String!, $updatedAt: timestamptz!) {
        insert_tier_entries_one(object: {
          id: $id tier_id: $tierId player_id: $playerId order_index: $orderIndex flags: $flags notes: $notes updated_at: $updatedAt
        } on_conflict: { constraint: tier_entries_pkey, update_columns: [tier_id, order_index, flags, notes, updated_at] }) { id }
      }
    `, {
      id: entry.id,
      tierId: entry.tierId,
      playerId: entry.playerId,
      orderIndex: entry.orderIndex,
      flags: `{${entry.flags.join(',')}}`,
      notes: entry.notes,
      updatedAt: entry.updatedAt,
    })
  },

  async moveEntry(entryId: string, toTierId: string, toIndex: number): Promise<void> {
    await gql(`
      mutation MoveEntry($id: uuid!, $tierId: uuid!, $orderIndex: Int!, $updatedAt: timestamptz!) {
        update_tier_entries_by_pk(
          pk_columns: { id: $id }
          _set: { tier_id: $tierId, order_index: $orderIndex, updated_at: $updatedAt }
        ) { id }
      }
    `, {
      id: entryId,
      tierId: toTierId,
      orderIndex: toIndex,
      updatedAt: new Date().toISOString(),
    })
  },

  async deleteEntry(entryId: string): Promise<void> {
    await gql(`
      mutation DeleteEntry($id: uuid!) {
        delete_tier_entries_by_pk(id: $id) { id }
      }
    `, { id: entryId })
  },
}
