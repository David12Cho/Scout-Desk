import { getDB } from './db'
import { gql } from './hasura'
import type { ScoutingReport } from '@/types'

export const reportsStore = {
  async getAll(): Promise<ScoutingReport[]> {
    const db = await getDB()
    return db.getAll('scouting_reports')
  },

  async get(id: string): Promise<ScoutingReport | undefined> {
    const db = await getDB()
    return db.get('scouting_reports', id)
  },

  async save(report: ScoutingReport): Promise<void> {
    const db = await getDB()
    await db.put('scouting_reports', { ...report, syncStatus: 'pending' })
    if (navigator.onLine) {
      await reportsStore.flushPending()
    }
  },

  async delete(id: string): Promise<void> {
    const db = await getDB()
    await db.delete('scouting_reports', id)
  },

  async flushPending(): Promise<void> {
    const db = await getDB()
    const pending = await db.getAllFromIndex('scouting_reports', 'by_sync_status', 'pending')
    if (pending.length === 0) return

    for (const report of pending) {
      try {
        await gql(`
          mutation UpsertReport(
            $id: uuid!, $authorId: String!, $playerId: Int!,
            $gameDate: date!, $opponent: String!, $venue: String!,
            $grades: jsonb!, $projection: String!, $flags: _text!,
            $summary: String!, $createdAt: timestamptz!, $updatedAt: timestamptz!
          ) {
            insert_scouting_reports_one(object: {
              id: $id author_id: $authorId player_id: $playerId
              game_date: $gameDate opponent: $opponent venue: $venue
              grades: $grades projection: $projection flags: $flags
              summary: $summary sync_status: "synced"
              created_at: $createdAt updated_at: $updatedAt
            } on_conflict: {
              constraint: scouting_reports_pkey
              update_columns: [player_id, game_date, opponent, venue, grades, projection, flags, summary, sync_status, updated_at]
            }) { id }
          }
        `, {
          id: report.id,
          authorId: report.authorId,
          playerId: report.playerId,
          gameDate: report.gameDate,
          opponent: report.opponent,
          venue: report.venue,
          grades: report.grades,
          projection: report.projection,
          flags: `{${report.flags.join(',')}}`,
          summary: report.summary,
          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
        })
        await db.put('scouting_reports', { ...report, syncStatus: 'synced' })
      } catch {
        await db.put('scouting_reports', { ...report, syncStatus: 'failed' })
      }
    }
  },
}
