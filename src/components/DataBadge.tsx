interface DataBadgeProps {
  type: 'real' | 'simulated'
  compact?: boolean
}

export function DataBadge({ type, compact = false }: DataBadgeProps) {
  const isReal = type === 'real'
  return (
    <span
      className={`data-badge ${isReal ? 'data-badge--real' : 'data-badge--simulated'}${compact ? ' data-badge--compact' : ''}`}
      aria-label={isReal ? 'Real NASA data' : 'Game-simulated value'}
      title={isReal ? 'Sourced NASA information; open its citation for details.' : 'Gameplay value for learning and balance, not a real spacecraft specification.'}
    >
      <span className="data-badge__dot" aria-hidden="true" />
      {compact ? (isReal ? 'NASA DATA' : 'SIMULATED') : (isReal ? 'REAL NASA DATA' : 'GAME-SIMULATED')}
    </span>
  )
}