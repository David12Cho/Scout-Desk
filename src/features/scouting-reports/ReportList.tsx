import type { ScoutingReport, Projection } from '@/types'
import { useSkaterStats } from '@/hooks/useSkaterStats'
import SyncBadge from './SyncBadge'

const PROJECTION_COLORS: Record<Projection, string> = {
  NHL1: 'bg-blue-900/50 text-blue-400',
  NHL2: 'bg-purple-900/50 text-purple-400',
  AHL:  'bg-green-900/50 text-green-400',
  ECHL: 'bg-amber-900/50 text-amber-400',
  Pass: 'bg-red-900/50 text-red-400',
}

function avgGrade(grades: ScoutingReport['grades']): string {
  const values = Object.values(grades)
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  return avg.toFixed(1)
}

interface Props {
  reports: ScoutingReport[]
  onSelect: (id: string) => void
  onNew: () => void
}

export default function ReportList({ reports, onSelect, onNew }: Props) {
  const { data: skaters = [] } = useSkaterStats(20242025, 2)
  const playerMap = new Map(skaters.map((s) => [s.playerId, s.skaterFullName]))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-4 px-4 h-14 border-b border-slate-800 bg-slate-950">
        <div>
          <h1 className="text-sm font-semibold text-white">Scouting Reports</h1>
          <p className="text-xs text-slate-500">{reports.length} report{reports.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={onNew}
          className="ml-auto bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
        >
          + New Report
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
            <p className="text-slate-400 text-sm font-medium">No reports yet</p>
            <p className="text-slate-600 text-xs">Write your first scouting report to get started.</p>
            <button
              onClick={onNew}
              className="mt-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-md transition-colors"
            >
              Write First Report
            </button>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div className="flex items-center px-4 py-2 border-b border-slate-800 text-xs font-medium text-slate-500 select-none">
              <span className="flex-1 min-w-40">Player</span>
              <span className="w-24 shrink-0">Date</span>
              <span className="w-28 shrink-0">Opponent</span>
              <span className="w-14 shrink-0 text-right">Avg</span>
              <span className="w-16 shrink-0 text-center">Proj</span>
              <span className="w-20 shrink-0 text-right">Sync</span>
            </div>
            {reports.map((report, i) => (
              <button
                key={report.id}
                onClick={() => onSelect(report.id)}
                className={[
                  'w-full flex items-center px-4 text-left transition-colors hover:bg-slate-800/60',
                  i % 2 === 0 ? 'bg-slate-950' : 'bg-slate-900/40',
                ].join(' ')}
                style={{ height: 44 }}
              >
                <span className="flex-1 min-w-40 text-sm text-slate-200 truncate">
                  {playerMap.get(report.playerId) ?? `Player #${report.playerId}`}
                </span>
                <span className="w-24 shrink-0 text-xs text-slate-400">
                  {report.gameDate}
                </span>
                <span className="w-28 shrink-0 text-xs text-slate-400 truncate">
                  {report.opponent}
                </span>
                <span className="w-14 shrink-0 text-right text-sm font-medium text-slate-200">
                  {avgGrade(report.grades)}
                </span>
                <span className="w-16 shrink-0 text-center">
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${PROJECTION_COLORS[report.projection]}`}>
                    {report.projection}
                  </span>
                </span>
                <span className="w-20 shrink-0 flex justify-end">
                  <SyncBadge status={report.syncStatus} />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
