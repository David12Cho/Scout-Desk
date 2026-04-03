import { CATEGORY_LABELS } from '@/api/nhle'

export interface DraftFilters {
  season: number
  categoryId: 0 | 1 | 2 | 3 | 4 // 0 = all
  position: 'all' | 'F' | 'D' | 'G'
  search: string
}

interface Props {
  filters: DraftFilters
  totalCount: number
  filteredCount: number
  onChange: (next: DraftFilters) => void
}

const DRAFT_YEARS = [2026, 2025, 2024, 2023, 2022, 2021]

const CATEGORIES = [
  { value: 0, label: 'All' },
  { value: 1, label: CATEGORY_LABELS[1] },
  { value: 2, label: CATEGORY_LABELS[2] },
  { value: 3, label: CATEGORY_LABELS[3] },
  { value: 4, label: CATEGORY_LABELS[4] },
] as const

const POSITIONS = [
  { value: 'all', label: 'All' },
  { value: 'F', label: 'F' },
  { value: 'D', label: 'D' },
  { value: 'G', label: 'G' },
] as const

export default function DraftFilterBar({ filters, totalCount, filteredCount, onChange }: Props) {
  function set<K extends keyof DraftFilters>(key: K, value: DraftFilters[K]) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900/60">
      {/* Year */}
      <select
        value={filters.season}
        onChange={(e) => set('season', Number(e.target.value) as DraftFilters['season'])}
        className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {DRAFT_YEARS.map((y) => (
          <option key={y} value={y}>{y} Draft</option>
        ))}
      </select>

      {/* Category */}
      <div className="flex rounded overflow-hidden border border-slate-700 text-xs">
        {CATEGORIES.map(({ value, label }) => {
          const active = filters.categoryId === value
          return (
            <button
              key={value}
              onClick={() => set('categoryId', value)}
              className={[
                'px-2.5 py-1.5 transition-colors whitespace-nowrap',
                active
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200',
              ].join(' ')}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Position */}
      <div className="flex rounded overflow-hidden border border-slate-700 text-xs">
        {POSITIONS.map(({ value, label }) => {
          const active = filters.position === value
          return (
            <button
              key={value}
              onClick={() => set('position', value)}
              className={[
                'px-2.5 py-1.5 transition-colors',
                active
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200',
              ].join(' ')}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search player…"
        value={filters.search}
        onChange={(e) => set('search', e.target.value)}
        className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 w-36 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      <div className="ml-auto text-xs text-slate-500">
        {filteredCount === totalCount
          ? `${totalCount} prospects`
          : `${filteredCount} / ${totalCount} prospects`}
      </div>
    </div>
  )
}
