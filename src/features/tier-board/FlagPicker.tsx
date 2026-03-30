import { useEffect, useRef } from 'react'
import type { ScoutFlag } from '@/types'
import { SCOUT_FLAG_LABELS } from '@/types'

const ALL_FLAGS = Object.keys(SCOUT_FLAG_LABELS) as ScoutFlag[]

interface Props {
  flags: ScoutFlag[]
  onChange: (flags: ScoutFlag[]) => void
  onClose: () => void
}

export default function FlagPicker({ flags, onChange, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleDown)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleDown)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  function toggle(flag: ScoutFlag) {
    if (flags.includes(flag)) {
      onChange(flags.filter((f) => f !== flag))
    } else {
      onChange([...flags, flag])
    }
  }

  return (
    <div
      ref={ref}
      className="absolute z-50 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-3 w-52"
      style={{ top: '100%', left: 0 }}
    >
      <p className="text-xs font-medium text-slate-400 mb-2">Scout Flags</p>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {ALL_FLAGS.map((flag) => (
          <label
            key={flag}
            className="flex items-center gap-2 cursor-pointer hover:bg-slate-700/50 rounded px-1 py-0.5"
          >
            <input
              type="checkbox"
              checked={flags.includes(flag)}
              onChange={() => toggle(flag)}
              className="accent-blue-500 shrink-0"
            />
            <span className="text-xs text-slate-200">{SCOUT_FLAG_LABELS[flag]}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
