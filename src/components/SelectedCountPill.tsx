
export default function SelectedCountPill({ selected, total }: { selected: number; total: number }) {
  return (
    <span className="pill source-select__selected-pill">
      {selected}/{total} selected
    </span>
  )
}
