import { useState, useRef, useEffect } from 'react'
import type { ScoutingReport, ScoutFlag, Projection } from '@/types'
import { SCOUT_FLAG_LABELS } from '@/types'
import { useSkaterStats } from '@/hooks/useSkaterStats'
import { reportsStore } from '@/lib/reports.store'
import GradeSlider from './GradeSlider'
import SyncBadge from './SyncBadge'

const PROJECTIONS: Projection[] = ['NHL1', 'NHL2', 'AHL', 'ECHL', 'Pass']
const ALL_FLAGS = Object.keys(SCOUT_FLAG_LABELS) as ScoutFlag[]

const GRADE_FIELDS: { key: keyof ScoutingReport['grades']; label: string }[] = [
  { key: 'skating',    label: 'Skating' },
  { key: 'compete',   label: 'Compete' },
  { key: 'hockey_iq', label: 'Hockey IQ' },
  { key: 'hands',     label: 'Hands' },
  { key: 'shot',      label: 'Shot' },
  { key: 'defense',   label: 'Defense' },
]

const EMPTY_GRADES: ScoutingReport['grades'] = {
  skating: 5, compete: 5, hockey_iq: 5, hands: 5, shot: 5, defense: 5,
}

interface Props {
  report?: ScoutingReport   // undefined = new report
  onSave: () => void
  onCancel: () => void
}

export default function ReportForm({ report, onSave, onCancel }: Props) {
  const isNew = !report
  const [isEditing, setIsEditing] = useState(isNew)

  // Form state
  const [playerId, setPlayerId] = useState<number | null>(report?.playerId ?? null)
  const [playerSearch, setPlayerSearch] = useState('')
  const [showPlayerDrop, setShowPlayerDrop] = useState(false)
  const [gameDate, setGameDate] = useState(report?.gameDate ?? '')
  const [opponent, setOpponent] = useState(report?.opponent ?? '')
  const [venue, setVenue] = useState(report?.venue ?? '')
  const [grades, setGrades] = useState<ScoutingReport['grades']>(report?.grades ?? EMPTY_GRADES)
  const [projection, setProjection] = useState<Projection>(report?.projection ?? 'NHL2')
  const [flags, setFlags] = useState<ScoutFlag[]>(report?.flags ?? [])
  const [summary, setSummary] = useState(report?.summary ?? '')
  const [saving, setSaving] = useState(false)

  const searchRef = useRef<HTMLDivElement>(null)
  const { data: skaters = [] } = useSkaterStats(20242025, 2)

  const playerMap = new Map(skaters.map((s) => [s.playerId, s]))
  const selectedPlayer = playerId ? playerMap.get(playerId) : undefined

  const filteredSkaters = playerSearch.length >= 2
    ? skaters
        .filter((s) => s.skaterFullName.toLowerCase().includes(playerSearch.toLowerCase()))
        .slice(0, 8)
    : []

  // Close player dropdown on outside click
  useEffect(() => {
    function handleDown(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowPlayerDrop(false)
      }
    }
    document.addEventListener('mousedown', handleDown)
    return () => document.removeEventListener('mousedown', handleDown)
  }, [])

  async function handleSave() {
    if (!playerId || !gameDate) return
    setSaving(true)
    const now = new Date().toISOString()
    const saved: ScoutingReport = {
      id: report?.id ?? crypto.randomUUID(),
      playerId,
      authorId: 'local',
      gameDate,
      opponent,
      venue,
      grades,
      projection,
      flags,
      summary,
      syncStatus: 'pending',
      createdAt: report?.createdAt ?? now,
      updatedAt: now,
    }
    await reportsStore.save(saved)
    setSaving(false)
    onSave()
  }

  function setGrade(key: keyof ScoutingReport['grades'], value: number) {
    setGrades((prev) => ({ ...prev, [key]: value }))
  }

  function toggleFlag(flag: ScoutFlag) {
    setFlags((prev) =>
      prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag],
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4 h-14 border-b border-slate-800 bg-slate-950">
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-200 transition-colors text-sm"
        >
          ← Back
        </button>
        <h1 className="text-sm font-semibold text-white">
          {isNew ? 'New Report' : 'Scouting Report'}
        </h1>
        {report && <SyncBadge status={report.syncStatus} />}
        <div className="ml-auto flex items-center gap-2">
          {!isNew && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
            >
              Edit
            </button>
          )}
          {isEditing && (
            <button
              onClick={handleSave}
              disabled={!playerId || !gameDate || saving}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          )}
        </div>
      </div>

      {/* Form body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 max-w-2xl">
        {/* Player search */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Player</label>
          {isEditing ? (
            <div ref={searchRef} className="relative">
              <input
                type="text"
                value={selectedPlayer ? selectedPlayer.skaterFullName : playerSearch}
                onChange={(e) => {
                  setPlayerSearch(e.target.value)
                  setPlayerId(null)
                  setShowPlayerDrop(true)
                }}
                onFocus={() => { if (!selectedPlayer) setShowPlayerDrop(true) }}
                placeholder="Search player…"
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              {showPlayerDrop && filteredSkaters.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
                  {filteredSkaters.map((s) => (
                    <button
                      key={s.playerId}
                      onClick={() => {
                        setPlayerId(s.playerId)
                        setPlayerSearch(s.skaterFullName)
                        setShowPlayerDrop(false)
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-700 transition-colors"
                    >
                      <span className="text-sm text-slate-200">{s.skaterFullName}</span>
                      <span className="text-xs text-slate-500 ml-auto">
                        {s.teamAbbrevs.split(',').at(-1)} · {s.positionCode}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-200">
              {selectedPlayer?.skaterFullName ?? `Player #${report?.playerId}`}
            </p>
          )}
        </div>

        {/* Game info */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Game Date</label>
            {isEditing ? (
              <input
                type="date"
                value={gameDate}
                onChange={(e) => setGameDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
            ) : (
              <p className="text-sm text-slate-200">{gameDate || '—'}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Opponent</label>
            {isEditing ? (
              <input
                type="text"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                placeholder="e.g. Boston Bruins"
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            ) : (
              <p className="text-sm text-slate-200">{opponent || '—'}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Venue</label>
            {isEditing ? (
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. TD Garden"
                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            ) : (
              <p className="text-sm text-slate-200">{venue || '—'}</p>
            )}
          </div>
        </div>

        {/* Grades */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-3">Grades</label>
          <div className="space-y-3">
            {GRADE_FIELDS.map(({ key, label }) => (
              <GradeSlider
                key={key}
                label={label}
                value={grades[key]}
                onChange={isEditing ? (v) => setGrade(key, v) : undefined}
                readOnly={!isEditing}
              />
            ))}
          </div>
        </div>

        {/* Projection */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Projection</label>
          {isEditing ? (
            <div className="flex gap-2 flex-wrap">
              {PROJECTIONS.map((p) => (
                <button
                  key={p}
                  onClick={() => setProjection(p)}
                  className={[
                    'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                    projection === p
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500',
                  ].join(' ')}
                >
                  {p}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-200">{projection}</p>
          )}
        </div>

        {/* Scout flags */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Scout Flags</label>
          <div className="flex flex-wrap gap-2">
            {ALL_FLAGS.map((flag) => {
              const active = flags.includes(flag)
              return isEditing ? (
                <button
                  key={flag}
                  onClick={() => toggleFlag(flag)}
                  className={[
                    'text-xs px-2 py-1 rounded-full border transition-colors',
                    active
                      ? 'bg-blue-900/60 border-blue-600 text-blue-300'
                      : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500',
                  ].join(' ')}
                >
                  {SCOUT_FLAG_LABELS[flag]}
                </button>
              ) : active ? (
                <span
                  key={flag}
                  className="text-xs px-2 py-1 rounded-full bg-blue-900/60 border border-blue-600 text-blue-300"
                >
                  {SCOUT_FLAG_LABELS[flag]}
                </span>
              ) : null
            })}
            {!isEditing && flags.length === 0 && (
              <span className="text-xs text-slate-600">No flags</span>
            )}
          </div>
        </div>

        {/* Summary */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Summary{isEditing && <span className="text-slate-600 ml-1">{summary.length}/500</span>}
          </label>
          {isEditing ? (
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value.slice(0, 500))}
              rows={5}
              placeholder="Write your scouting notes…"
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          ) : (
            <p className="text-sm text-slate-300 whitespace-pre-wrap">
              {summary || <span className="text-slate-600">No summary</span>}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
