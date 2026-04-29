interface Props {
  compact?: boolean
  subtitle?: string
}

export default function BrandMark({ compact = false, subtitle }: Props) {
  const className = compact ? 'brand-mark brand-mark--compact' : 'brand-mark'

  return (
    <div className={className}>
      <img className="brand-mark__logo" src="/spotify-sort-logo.svg" alt="Spotify Sort logo" />
      <span className="brand-mark__copy">
        <span className="brand-mark__title">Spotify Sort</span>
        {subtitle ? <span className="brand-mark__subtitle">{subtitle}</span> : null}
      </span>
    </div>
  )
}