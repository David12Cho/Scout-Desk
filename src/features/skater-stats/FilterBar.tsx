import { NHL_TEAMS, SEASONS } from '@/api/nhle'

export interface SkaterFilters {
  seasonId: number
  gameTypeId: 2 | 3
  position: 'all' | 'F' | 'D' | 'C' | 'L' | 'R'
  team: string // team abbrev or 'all'
  minGP: number
}

interface FilterBarProps {
  filters: SkaterFilters
  totalCount: number
  filteredCount: number
  onChange: (next: SkaterFilters) => void
}

const POSITIONS = [
  { value: 'all', label: 'All' },
  { value: 'F', label: 'F' },
  { value: 'D', label: 'D' },
  { value: 'C', label: 'C' },
  { value: 'L', label: 'LW' },
  { value: 'R', label: 'RW' },
] as const


export default function FilterBar({ filters, totalCount, filteredCount, onChange }: FilterBarProps) {
  function set<K extends keyof SkaterFilters>(key: K, value: SkaterFilters[K]) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900/60">
      {/* Season */}
      <select
        value={filters.seasonId}
        onChange={(e) => set('seasonId', Number(e.target.value) as SkaterFilters['seasonId'])}
        className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {SEASONS.map((s) => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>

      {/* Game type */}
      <div className="flex rounded overflow-hidden border border-slate-700 text-xs">
        {(['Regular Season', 'Playoffs'] as const).map((label, i) => {
          const val = i === 0 ? 2 : 3
          const active = filters.gameTypeId === val
          return (
            <button
              key={val}
              onClick={() => set('gameTypeId', val as 2 | 3)}
              className={[
                'px-3 py-1.5 transition-colors',
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

      {/* Team */}
      <select
        value={filters.team}
        onChange={(e) => set('team', e.target.value)}
        className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="all">All Teams</option>
        {NHL_TEAMS.map((t) => (
          <option key={t.abbrev} value={t.abbrev}>{t.name}</option>
        ))}
      </select>

      {/* Min GP */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 whitespace-nowrap">Min GP</span>
        <input
          type="range"
          min={0}
          max={82}
          step={1}
          value={filters.minGP}
          onChange={(e) => set('minGP', Number(e.target.value))}
          className="w-24 accent-blue-500"
        />
        <span className="text-xs text-slate-300 w-5 text-right">{filters.minGP}</span>
      </div>

      <div className="ml-auto text-xs text-slate-500">
        {filteredCount === totalCount
          ? `${totalCount} players`
          : `${filteredCount} / ${totalCount} players`}
      </div>
    </div>
  )
}
