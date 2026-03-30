import { useQuery } from '@tanstack/react-query'
import { fetchDraftRankings } from '@/api/nhle'

export function useDraftRankings(season: number) {
  return useQuery({
    queryKey: ['draft-rankings', season],
    queryFn: () => fetchDraftRankings(season),
    staleTime: 1000 * 60 * 60, // 1 hour — rankings don't change often
  })
}
