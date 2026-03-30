import { useSkaterEdge } from '@/hooks/useSkaterStats'

interface Props {
  playerId: number
  playerName: string
}

function StatTile({ label, value, unit, percentile }: {
  label: string
  value: string | number
  unit?: string
  percentile?: number
}) {
  const pct = percentile !== undefined ? Math.round(percentile) : undefined
  const pctColor =
    pct === undefined ? '' :
    pct >= 75 ? 'text-green-500' :
    pct >= 40 ? 'text-slate-500' :
    'text-red-500'

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-200">
        {value}
        {unit && <span className="text-xs text-slate-500 ml-0.5">{unit}</span>}
      </span>
      {pct !== undefined && (
        <span className={`text-xs ${pctColor}`}>p{pct}</span>
      )}
    </div>
  )
}

export default function EdgePanel({ playerId }: Props) {
  const { data, isLoading, isError } = useSkaterEdge(playerId)

  return (
    <div className="px-14 py-3 bg-slate-900/80 border-t border-slate-800">
      <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-medium">NHL Edge</p>

      {isLoading && (
        <div className="flex gap-2 items-center text-xs text-slate-500">
          <div className="w-3 h-3 rounded-full border border-slate-600 border-t-blue-500 animate-spin" />
          Loading Edge data…
        </div>
      )}

      {isError && (
        <p className="text-xs text-slate-600">Edge data unavailable for this player.</p>
      )}

      {data && (
        <div className="grid grid-cols-4 gap-x-8 gap-y-4 sm:grid-cols-7">
          <StatTile
            label="Max Speed"
            value={data.maxSkatingSpeed.toFixed(1)}
            unit="mph"
            percentile={data.speedPercentile}
          />
          <StatTile
            label="20+ mph Bursts"
            value={data.burstsAbove20Mph}
            percentile={data.burstsPercentile}
          />
          <StatTile
            label="Total Distance"
            value={data.totalDistanceMiles.toFixed(0)}
            unit="mi"
            percentile={data.distancePercentile}
          />
          <StatTile
            label="Max Shot"
            value={data.maxShotSpeed.toFixed(1)}
            unit="mph"
            percentile={data.shotSpeedPercentile}
          />
          <StatTile
            label="Off Zone %"
            value={`${data.offZoneTimePercent.toFixed(1)}%`}
            percentile={data.offZonePercentile}
          />
          <StatTile
            label="Neut Zone %"
            value={`${data.neutralZoneTimePercent.toFixed(1)}%`}
            percentile={data.neutralZonePercentile}
          />
          <StatTile
            label="Def Zone %"
            value={`${data.defZoneTimePercent.toFixed(1)}%`}
            percentile={data.defZonePercentile}
          />
        </div>
      )}

      {!isLoading && !isError && !data && (
        <p className="text-xs text-slate-600">No Edge data available.</p>
      )}
    </div>
  )
}
