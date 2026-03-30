import type { DraftRankingProspect } from '@/api/nhle'

/** Stable synthetic numeric ID for a draft prospect.
 *  Prospects have no real playerId until they're drafted.
 *  Formula: categoryId * 10000 + midtermRank — unique per prospect per season.
 */
export function prospectId(p: DraftRankingProspect): number {
  return p.categoryId * 10000 + p.midtermRank
}
