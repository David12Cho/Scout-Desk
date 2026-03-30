import type { DraftRankingProspect } from '@/api/nhle'
import { CATEGORY_LABELS, formatHeight, countryFlag } from '@/api/nhle'

function ProspectAvatar({ firstName, lastName, positionCode }: {
  firstName: string
  lastName: string
  positionCode: string
}) {
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
  const colors: Record<string, string> = {
    D: 'bg-blue-900/70 text-blue-300',
    G: 'bg-amber-900/70 text-amber-300',
  }
  const colorClass = colors[positionCode] ?? 'bg-green-900/70 text-green-300'
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${colorClass}`}>
      {initials}
    </div>
  )
}

export type DraftSortKey = 'midtermRank' | 'heightInInches' | 'weightInPounds' | 'age'

export interface DraftSortState {
  key: DraftSortKey
  dir: 'asc' | 'desc'
}

interface Column {
  key: string
  label: string
  sortKey?: DraftSortKey
  className: string
}

const COLUMNS: Column[] = [
  { key: 'rank',     label: 'Rank',     sortKey: 'midtermRank',    className: 'w-14 text-right' },
  { key: 'player',   label: 'Player',                               className: 'flex-1 min-w-48 text-left' },
  { key: 'pos',      label: 'Pos',                                  className: 'w-12 text-center' },
  { key: 'shoots',   label: 'Sh',                                   className: 'w-10 text-center' },
  { key: 'age',      label: 'Age',      sortKey: 'age',             className: 'w-12 text-right' },
  { key: 'ht',       label: 'Ht',       sortKey: 'heightInInches',  className: 'w-14 text-right' },
  { key: 'wt',       label: 'Wt',       sortKey: 'weightInPounds',  className: 'w-14 text-right' },
  { key: 'league',   label: 'League',                               className: 'w-16 text-left' },
  { key: 'club',     label: 'Club',                                 className: 'w-32 text-left' },
  { key: 'category', label: 'Category',                             className: 'w-28 text-left' },
]

function calcAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

interface Props {
  data: DraftRankingProspect[]
  sort: DraftSortState
  onSortChange: (next: DraftSortState) => void
}

export default function DraftTable({ data, sort, onSortChange }: Props) {
  function handleSort(col: Column) {
    if (!col.sortKey) return
    if (sort.key === col.sortKey) {
      onSortChange({ key: col.sortKey, dir: sort.dir === 'asc' ? 'desc' : 'asc' })
    } else {
      const defaultDir = col.sortKey === 'midtermRank' ? 'asc' : 'desc'
      onSortChange({ key: col.sortKey, dir: defaultDir })
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-4 py-2 border-b border-slate-800 bg-slate-900 text-xs font-medium text-slate-400 select-none shrink-0">
        {COLUMNS.map((col) => (
          <div
            key={col.key}
            className={[
              col.className,
              'shrink-0',
              col.sortKey ? 'cursor-pointer hover:text-slate-200 transition-colors' : '',
            ].join(' ')}
            onClick={() => handleSort(col)}
          >
            {col.label}
            {col.sortKey && sort.key === col.sortKey && (
              <span className="ml-1 text-blue-400">
                {sort.dir === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-auto">
        {data.map((prospect, index) => {
          const isEven = index % 2 === 0
          const age = calcAge(prospect.birthDate)
          const isGoalie = prospect.positionCode === 'G'

          return (
            <div
              key={`${prospect.firstName}-${prospect.lastName}-${prospect.midtermRank}-${prospect.categoryId}`}
              className={[
                'flex items-center px-4 transition-colors hover:bg-slate-800/60',
                isEven ? 'bg-slate-950' : 'bg-slate-900/40',
              ].join(' ')}
              style={{ height: 44 }}
            >
              {/* Rank */}
              <div className="w-14 shrink-0 text-right">
                <span className="text-sm font-medium text-slate-200">
                  {prospect.midtermRank}
                </span>
                {prospect.finalRank && prospect.finalRank !== prospect.midtermRank && (
                  <span className={[
                    'ml-1 text-xs',
                    prospect.finalRank < prospect.midtermRank ? 'text-green-400' : 'text-red-400',
                  ].join(' ')}>
                    →{prospect.finalRank}
                  </span>
                )}
              </div>

              {/* Player */}
              <div className="flex-1 min-w-48 shrink-0 flex items-center gap-2 min-w-0 pl-4">
                <ProspectAvatar
                  firstName={prospect.firstName}
                  lastName={prospect.lastName}
                  positionCode={prospect.positionCode}
                />
                <span className="text-base leading-none" title={prospect.birthCountry}>
                  {countryFlag(prospect.birthCountry)}
                </span>
                <div className="min-w-0">
                  <span className="text-sm text-slate-100 truncate block">
                    {prospect.firstName} {prospect.lastName}
                  </span>
                  <span className="text-xs text-slate-500 truncate block">
                    {prospect.birthCity}{prospect.birthStateProvince ? `, ${prospect.birthStateProvince}` : ''}
                  </span>
                </div>
              </div>

              {/* Pos */}
              <div className="w-12 shrink-0 text-center">
                <span className={[
                  'text-xs font-medium px-1.5 py-0.5 rounded',
                  isGoalie
                    ? 'bg-amber-900/50 text-amber-400'
                    : prospect.positionCode === 'D'
                    ? 'bg-blue-900/50 text-blue-400'
                    : 'bg-green-900/50 text-green-400',
                ].join(' ')}>
                  {prospect.positionCode}
                </span>
              </div>

              {/* Shoots */}
              <div className="w-10 shrink-0 text-center text-xs text-slate-400">
                {prospect.shootsCatches}
              </div>

              {/* Age */}
              <div className="w-12 shrink-0 text-right text-sm text-slate-300">
                {age}
              </div>

              {/* Height */}
              <div className="w-14 shrink-0 text-right text-sm text-slate-300">
                {formatHeight(prospect.heightInInches)}
              </div>

              {/* Weight */}
              <div className="w-14 shrink-0 text-right text-sm text-slate-300">
                {prospect.weightInPounds}
              </div>

              {/* League */}
              <div className="w-16 shrink-0 text-left text-xs text-slate-400 truncate pl-2">
                {prospect.lastAmateurLeague}
              </div>

              {/* Club */}
              <div className="w-32 shrink-0 text-left text-xs text-slate-400 truncate pl-2">
                {prospect.lastAmateurClub}
              </div>

              {/* Category */}
              <div className="w-28 shrink-0 text-left text-xs text-slate-500 pl-2">
                {CATEGORY_LABELS[prospect.categoryId]}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
