interface LoadingScreenProps {
  label?: string
}

export const LoadingScreen = ({ label = 'Loading your finance data...' }: LoadingScreenProps) => {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="loading-logo">
        <span className="loading-logo__text">F</span>
        <div className="loading-logo__ring" />
        <div className="loading-logo__ring loading-logo__ring--outer" />
      </div>
      <p className="loading-label">{label}</p>
    </div>
  )
}
