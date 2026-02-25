import { Achievement } from '@/utils/finance'

interface StreakAchievementsProps {
    achievements: Achievement[]
}

export const StreakAchievements = ({ achievements }: StreakAchievementsProps) => {
    const unlocked = achievements.filter((a) => a.unlocked).length
    const total = achievements.length

    return (
        <div className="achievements">
            <div className="achievements__header">
                <span className="achievements__counter">
                    🏅 {unlocked}/{total} unlocked
                </span>
            </div>
            <div className="achievements__grid">
                {achievements.map((a, i) => (
                    <div
                        key={a.id}
                        className={`achievement-card ${a.unlocked ? 'achievement-card--unlocked' : 'achievement-card--locked'}`}
                        style={{ '--stagger': i } as React.CSSProperties}
                    >
                        <div className="achievement-card__icon-wrap">
                            <span className="achievement-card__icon">{a.icon}</span>
                            {a.unlocked && <span className="achievement-card__checkmark">✓</span>}
                        </div>
                        <div className="achievement-card__info">
                            <strong className="achievement-card__title">{a.title}</strong>
                            <p className="achievement-card__desc">{a.description}</p>
                        </div>
                        <div className="achievement-card__progress-track">
                            <div
                                className={`achievement-card__progress-fill ${a.unlocked ? 'achievement-card__progress-fill--done' : ''}`}
                                style={{ width: `${a.progress}%` }}
                            />
                        </div>
                        <span className="achievement-card__pct">{a.progress}%</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
