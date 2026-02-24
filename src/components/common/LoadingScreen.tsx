interface LoadingScreenProps {
  label?: string
}

export const LoadingScreen = ({ label = 'Loading your finance data...' }: LoadingScreenProps) => {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="spinner" />
      <p>{label}</p>
    </div>
  )
}
