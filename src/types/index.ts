// Shared TypeScript types across the app

export type ScoutFlag =
  | 'elite_skater'
  | 'elite_shot'
  | 'elite_iq'
  | 'playmaker'
  | 'goal_scorer'
  | 'two_way'
  | 'power_forward'
  | 'high_compete'
  | 'pro_ready'
  | 'late_bloomer'
  | 'slow_developer'
  | 'injury_risk'
  | 'size_concern'
  | 'character_concern'
  | 'sandbagging'
  | 'overager'

export const SCOUT_FLAG_LABELS: Record<ScoutFlag, string> = {
  elite_skater: 'Elite Skater',
  elite_shot: 'Elite Shot',
  elite_iq: 'Elite IQ',
  playmaker: 'Playmaker',
  goal_scorer: 'Goal Scorer',
  two_way: 'Two-Way',
  power_forward: 'Power Forward',
  high_compete: 'High Compete',
  pro_ready: 'Pro-Ready',
  late_bloomer: 'Late Bloomer',
  slow_developer: 'Slow Developer',
  injury_risk: 'Injury Risk',
  size_concern: 'Size Concern',
  character_concern: 'Character Concern',
  sandbagging: 'Sandbagging',
  overager: 'Overager',
}

export type Projection = 'NHL1' | 'NHL2' | 'AHL' | 'ECHL' | 'Pass'

export type SyncStatus = 'pending' | 'synced' | 'failed'

export interface ScoutingReport {
  id: string
  playerId: number
  authorId: string
  gameDate: string
  opponent: string
  venue: string
  grades: {
    skating: number
    compete: number
    hockey_iq: number
    hands: number
    shot: number
    defense: number
  }
  projection: Projection
  summary: string
  flags: ScoutFlag[]
  syncStatus: SyncStatus
  createdAt: string
  updatedAt: string
}

export interface Tier {
  id: string
  boardId: string
  name: string
  color: string
  orderIndex: number
}

export interface TierEntry {
  id: string
  tierId: string
  playerId: number
  orderIndex: number
  flags: ScoutFlag[]
  notes: string
  updatedAt: string
}

export interface TierBoard {
  id: string
  ownerId: string
  season: number
}
