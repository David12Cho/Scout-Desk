import { getDB } from './db'
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
    console.log(`[ScoutDesk] Syncing ${pending.length} pending report(s)…`, pending)
    // TODO: replace with Hasura GraphQL mutation once wired
    for (const report of pending) {
      await db.put('scouting_reports', { ...report, syncStatus: 'synced' })
    }
    console.log('[ScoutDesk] Sync complete.')
  },
}
