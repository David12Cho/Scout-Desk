import { useMemo, useState } from 'react'
import { useSkaterStats } from '@/hooks/useSkaterStats'
import FilterBar, { type SkaterFilters } from './FilterBar'
import SkaterTable, { type SortState } from './SkaterTable'

const DEFAULT_FILTERS: SkaterFilters = {
  seasonId: 20242025,
  gameTypeId: 2,
  position: 'all',
  team: 'all',
  minGP: 20,
}

const DEFAULT_SORT: SortState = {
  key: 'pointsPer60',
  dir: 'desc',
}

export default function SkaterStats() {
  const [filters, setFilters] = useState<SkaterFilters>(DEFAULT_FILTERS)
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT)

  const { data, isLoading, isError } = useSkaterStats(filters.seasonId, filters.gameTypeId)

  const filtered = useMemo(() => {
    if (!data) return []

    return data.filter((s) => {
      if (s.gamesPlayed < filters.minGP) return false

      if (filters.position !== 'all') {
        if (filters.position === 'F') {
          if (!['C', 'L', 'R'].includes(s.positionCode)) return false
        } else if (filters.position === 'D') {
          if (s.positionCode !== 'D') return false
        } else {
          if (s.positionCode !== filters.position) return false
        }
      }

      if (filters.team !== 'all') {
        // teamAbbrevs can be "EDM" or "EDM,VGK" — check if it includes selected team
        if (!s.teamAbbrevs.split(',').includes(filters.team)) return false
      }

      return true
    })
  }, [data, filters])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sort.key] as number
      const bv = b[sort.key] as number
      return sort.dir === 'desc' ? bv - av : av - bv
    })
  }, [filtered, sort])

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-4 py-3 border-b border-slate-800 shrink-0">
        <h1 className="text-base font-semibold text-white">Skater Stats</h1>
        <p className="text-xs text-slate-500 mt-0.5">Per-60 rate stats — default sorted by PTS/60</p>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        totalCount={data?.length ?? 0}
        filteredCount={sorted.length}
        onChange={setFilters}
      />

      {/* States */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin" />
            <p className="text-sm text-slate-500">Loading skater stats…</p>
          </div>
        </div>
      )}

      {isError && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-red-400">Failed to load skater data.</p>
            <p className="text-xs text-slate-600 mt-1">Check your connection and try again.</p>
          </div>
        </div>
      )}

      {!isLoading && !isError && sorted.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-slate-500">No players match the current filters.</p>
        </div>
      )}

      {/* Table */}
      {!isLoading && !isError && sorted.length > 0 && (
        <SkaterTable data={sorted} sort={sort} seasonId={filters.seasonId} onSortChange={setSort} />
      )}
    </div>
  )
}
