interface Props {
  label: string
  value: number
  onChange?: (v: number) => void
  readOnly?: boolean
}

function gradeColor(v: number): string {
  if (v <= 3) return 'accent-red-500'
  if (v <= 6) return 'accent-amber-500'
  return 'accent-green-500'
}

function gradeBg(v: number): string {
  if (v <= 3) return 'text-red-400'
  if (v <= 6) return 'text-amber-400'
  return 'text-green-400'
}

export default function GradeSlider({ label, value, onChange, readOnly = false }: Props) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-sm text-slate-300">{label}</span>
      <input
        type="range"
        min={1}
        max={9}
        step={1}
        value={value}
        onChange={(e) => onChange?.(Number(e.target.value))}
        disabled={readOnly}
        className={`flex-1 h-1.5 rounded-full appearance-none bg-slate-700 ${gradeColor(value)} disabled:opacity-60`}
      />
      <span className={`w-4 text-sm font-semibold text-right shrink-0 ${gradeBg(value)}`}>
        {value}
      </span>
    </div>
  )
}
