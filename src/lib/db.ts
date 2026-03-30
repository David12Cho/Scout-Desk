import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { ScoutingReport } from '@/types'

interface ScoutDeskDB extends DBSchema {
  scouting_reports: {
    key: string
    value: ScoutingReport
    indexes: { by_player: number; by_sync_status: string }
  }
}

let dbPromise: Promise<IDBPDatabase<ScoutDeskDB>> | null = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ScoutDeskDB>('scoutdesk', 1, {
      upgrade(db) {
        const store = db.createObjectStore('scouting_reports', { keyPath: 'id' })
        store.createIndex('by_player', 'playerId')
        store.createIndex('by_sync_status', 'syncStatus')
      },
    })
  }
  return dbPromise
}
