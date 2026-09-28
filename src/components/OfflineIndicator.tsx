interface OfflineIndicatorProps {
  online: boolean
  usingFallback: boolean
}

export function OfflineIndicator({ online, usingFallback }: OfflineIndicatorProps) {
  const offline = !online || usingFallback
  return (
    <div className={`connection-indicator${offline ? ' connection-indicator--offline' : ''}`} role="status" aria-live="polite">
      <span className="connection-indicator__dot" aria-hidden="true" />
      {offline ? 'OFFLINE / FALLBACK MODE' : 'SYSTEMS ONLINE'}
    </div>
  )
}