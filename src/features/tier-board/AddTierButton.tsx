interface Props {
  onAdd: () => void
}

export default function AddTierButton({ onAdd }: Props) {
  return (
    <button
      onClick={onAdd}
      className="w-full mt-3 py-2 border border-dashed border-slate-700 rounded-lg text-sm text-slate-500 hover:text-slate-300 hover:border-slate-500 transition-colors"
    >
      + Add Tier
    </button>
  )
}
