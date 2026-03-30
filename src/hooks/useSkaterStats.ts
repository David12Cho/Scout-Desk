import { useQuery } from '@tanstack/react-query'
import { fetchSkaterScoringRates, fetchSkaterEdgeDetail } from '@/api/nhle'

export function useSkaterStats(seasonId: number, gameTypeId: 2 | 3) {
  return useQuery({
    queryKey: ['skater-scoring-rates', seasonId, gameTypeId],
    queryFn: () => fetchSkaterScoringRates(seasonId, gameTypeId),
    staleTime: 1000 * 60 * 30, // 30 min — stats don't change mid-day
  })
}

export function useSkaterEdge(playerId: number | null) {
  return useQuery({
    queryKey: ['skater-edge', playerId],
    queryFn: () => fetchSkaterEdgeDetail(playerId!),
    enabled: playerId !== null,
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}
