import { useMemo, useState } from 'react'
import { useDraftRankings } from '@/hooks/useDraftRankings'
import DraftFilterBar, { type DraftFilters } from './DraftFilterBar'
import DraftTable, { type DraftSortState } from './DraftTable'

const DEFAULT_FILTERS: DraftFilters = {
  season: 2026,
  categoryId: 0,
  position: 'all',
  search: '',
}

const DEFAULT_SORT: DraftSortState = {
  key: 'midtermRank',
  dir: 'asc',
}

export default function DraftRankings() {
  const [filters, setFilters] = useState<DraftFilters>(DEFAULT_FILTERS)
  const [sort, setSort] = useState<DraftSortState>(DEFAULT_SORT)

  const { data, isLoading, isError } = useDraftRankings(filters.season)

  const filtered = useMemo(() => {
    if (!data) return []
    return data.filter((p) => {
      if (filters.categoryId !== 0 && p.categoryId !== filters.categoryId) return false

      if (filters.position !== 'all') {
        if (filters.position === 'G' && p.positionCode !== 'G') return false
        if (filters.position === 'D' && p.positionCode !== 'D') return false
        if (filters.position === 'F' && (p.positionCode === 'D' || p.positionCode === 'G')) return false
      }

      if (filters.search) {
        const q = filters.search.toLowerCase()
        const fullName = `${p.firstName} ${p.lastName}`.toLowerCase()
        if (!fullName.includes(q)) return false
      }

      return true
    })
  }, [data, filters])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: number
      let bv: number

      if (sort.key === 'age') {
        av = new Date(a.birthDate).getTime()
        bv = new Date(b.birthDate).getTime()
        // older birthDate = younger player, so flip
        return sort.dir === 'asc' ? bv - av : av - bv
      }

      av = a[sort.key] as number
      bv = b[sort.key] as number
      return sort.dir === 'asc' ? av - bv : bv - av
    })
  }, [filtered, sort])

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-800 shrink-0">
        <h1 className="text-base font-semibold text-white">Draft Rankings</h1>
        <p className="text-xs text-slate-500 mt-0.5">NHL Central Scouting midterm rankings</p>
      </div>

      <DraftFilterBar
        filters={filters}
        totalCount={data?.length ?? 0}
        filteredCount={filtered.length}
        onChange={(next) => {
          // reset sort to rank when season changes
          if (next.season !== filters.season) setSort(DEFAULT_SORT)
          setFilters(next)
        }}
      />

      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin" />
            <p className="text-sm text-slate-500">Loading draft rankings…</p>
          </div>
        </div>
      )}

      {isError && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-red-400">Failed to load draft rankings.</p>
            <p className="text-xs text-slate-600 mt-1">Check your connection and try again.</p>
          </div>
        </div>
      )}

      {!isLoading && !isError && sorted.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-slate-500">No prospects match the current filters.</p>
        </div>
      )}

      {!isLoading && !isError && sorted.length > 0 && (
        <DraftTable data={sorted} sort={sort} onSortChange={setSort} />
      )}
    </div>
  )
}
