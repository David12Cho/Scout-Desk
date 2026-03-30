import { useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { SkaterScoringRate } from '@/api/nhle'
import { formatTOI, headshotUrl, teamLogoUrl } from '@/api/nhle'
import EdgePanel from './EdgePanel'

export type SortKey = keyof Pick<
  SkaterScoringRate,
  | 'gamesPlayed'
  | 'goals'
  | 'assists'
  | 'points'
  | 'plusMinus'
  | 'goalsPer60'
  | 'assistsPer60'
  | 'pointsPer60'
  | 'timeOnIcePerGame'
  | 'penaltyMinutes'
>

export interface SortState {
  key: SortKey
  dir: 'asc' | 'desc'
}

interface Column {
  key: SortKey | '_player' | '_team'
  label: string
  sortKey?: SortKey
  width: string
  align: 'left' | 'right'
}

const COLUMNS: Column[] = [
  { key: '_player', label: 'Player', width: 'flex-1 min-w-48', align: 'left' },
  { key: '_team',   label: 'Team',   width: 'w-16', align: 'left' },
  { key: 'gamesPlayed',      label: 'GP',     sortKey: 'gamesPlayed',     width: 'w-12', align: 'right' },
  { key: 'goals',            label: 'G',      sortKey: 'goals',           width: 'w-12', align: 'right' },
  { key: 'assists',          label: 'A',      sortKey: 'assists',         width: 'w-12', align: 'right' },
  { key: 'points',           label: 'PTS',    sortKey: 'points',          width: 'w-14', align: 'right' },
  { key: 'plusMinus',        label: '+/-',    sortKey: 'plusMinus',       width: 'w-12', align: 'right' },
  { key: 'timeOnIcePerGame', label: 'TOI/G',  sortKey: 'timeOnIcePerGame', width: 'w-16', align: 'right' },
  { key: 'goalsPer60',       label: 'G/60',   sortKey: 'goalsPer60',      width: 'w-14', align: 'right' },
  { key: 'assistsPer60',     label: 'A/60',   sortKey: 'assistsPer60',    width: 'w-14', align: 'right' },
  { key: 'pointsPer60',      label: 'PTS/60', sortKey: 'pointsPer60',     width: 'w-16', align: 'right' },
]

const ROW_HEIGHT = 48

interface Props {
  data: SkaterScoringRate[]
  sort: SortState
  seasonId: number
  onSortChange: (next: SortState) => void
}

export default function SkaterTable({ data, sort, seasonId, onSortChange }: Props) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const row = data[index]
      return row && expandedId === row.playerId ? ROW_HEIGHT + 140 : ROW_HEIGHT
    },
    overscan: 8,
  })

  function handleSort(col: Column) {
    if (!col.sortKey) return
    if (sort.key === col.sortKey) {
      onSortChange({ key: col.sortKey, dir: sort.dir === 'desc' ? 'asc' : 'desc' })
    } else {
      onSortChange({ key: col.sortKey, dir: 'desc' })
    }
  }

  function toggleExpand(playerId: number) {
    setExpandedId((prev) => (prev === playerId ? null : playerId))
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-4 py-2 border-b border-slate-800 bg-slate-900 text-xs font-medium text-slate-400 select-none shrink-0">
        <div className="w-8 shrink-0" /> {/* rank */}
        {COLUMNS.map((col) => (
          <div
            key={col.key}
            className={[
              col.width,
              'shrink-0',
              col.align === 'right' ? 'text-right' : 'text-left',
              col.sortKey ? 'cursor-pointer hover:text-slate-200 transition-colors' : '',
            ].join(' ')}
            onClick={() => handleSort(col)}
          >
            {col.label}
            {col.sortKey && sort.key === col.sortKey && (
              <span className="ml-1 text-blue-400">
                {sort.dir === 'desc' ? '↓' : '↑'}
              </span>
            )}
          </div>
        ))}
        <div className="w-8 shrink-0" /> {/* expand chevron */}
      </div>

      {/* Virtualized rows */}
      <div ref={parentRef} className="flex-1 overflow-auto">
        <div
          style={{ height: rowVirtualizer.getTotalSize() }}
          className="relative"
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const skater = data[virtualRow.index]
            const rank = virtualRow.index + 1
            const isExpanded = expandedId === skater.playerId
            const isEven = virtualRow.index % 2 === 0

            return (
              <div
                key={skater.playerId}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                style={{ transform: `translateY(${virtualRow.start}px)` }}
                className="absolute top-0 left-0 right-0"
              >
                {/* Main row */}
                <div
                  className={[
                    'flex items-center px-4 cursor-pointer transition-colors group',
                    isEven ? 'bg-slate-950' : 'bg-slate-900/40',
                    'hover:bg-slate-800/60',
                  ].join(' ')}
                  style={{ height: ROW_HEIGHT }}
                  onClick={() => toggleExpand(skater.playerId)}
                >
                  {/* Rank */}
                  <div className="w-8 shrink-0 text-xs text-slate-500 text-right pr-2">
                    {rank}
                  </div>

                  {/* Player */}
                  <div className="flex-1 min-w-48 shrink-0 flex items-center gap-2 min-w-0">
                    <img
                      src={headshotUrl(skater.playerId, seasonId, skater.teamAbbrevs)}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover bg-slate-700 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.visibility = 'hidden'
                      }}
                    />
                    <span className="text-sm text-slate-100 truncate leading-tight">
                      {skater.skaterFullName}
                    </span>
                  </div>

                  {/* Team */}
                  <div className="w-16 shrink-0 flex items-center gap-1.5">
                    <img
                      src={teamLogoUrl(skater.teamAbbrevs.split(',')[0])}
                      alt={skater.teamAbbrevs}
                      className="w-5 h-5 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                    <span className="text-xs text-slate-400">
                      {skater.teamAbbrevs.split(',')[0]}
                    </span>
                  </div>

                  {/* Stats */}
                  {(
                    [
                      ['gamesPlayed', 'w-12'],
                      ['goals', 'w-12'],
                      ['assists', 'w-12'],
                      ['points', 'w-14'],
                      ['plusMinus', 'w-12'],
                    ] as [keyof SkaterScoringRate, string][]
                  ).map(([key, w]) => (
                    <div key={key} className={`${w} shrink-0 text-right text-sm text-slate-300`}>
                      {key === 'plusMinus' && (skater[key] as number) > 0 ? '+' : ''}
                      {skater[key] as number}
                    </div>
                  ))}

                  {/* TOI/G */}
                  <div className="w-16 shrink-0 text-right text-sm text-slate-300">
                    {formatTOI(skater.timeOnIcePerGame)}
                  </div>

                  {/* Per-60 — highlighted */}
                  <div className="w-14 shrink-0 text-right text-sm text-slate-200">
                    {skater.goalsPer60.toFixed(2)}
                  </div>
                  <div className="w-14 shrink-0 text-right text-sm text-slate-200">
                    {skater.assistsPer60.toFixed(2)}
                  </div>
                  <div className={[
                    'w-16 shrink-0 text-right text-sm font-medium',
                    sort.key === 'pointsPer60' ? 'text-blue-400' : 'text-slate-200',
                  ].join(' ')}>
                    {skater.pointsPer60.toFixed(2)}
                  </div>

                  {/* Expand chevron */}
                  <div className="w-8 shrink-0 flex justify-end">
                    <svg
                      className={[
                        'w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-all',
                        isExpanded ? 'rotate-90' : '',
                      ].join(' ')}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
                    </svg>
                  </div>
                </div>

                {/* Edge data panel */}
                {isExpanded && (
                  <EdgePanel playerId={skater.playerId} playerName={skater.skaterFullName} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
