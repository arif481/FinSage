import { VelocityData } from '@/utils/finance'
import { formatCurrency } from '@/utils/format'

interface SpendingVelocityGaugeProps {
    data: VelocityData
    currency: string
}

export const SpendingVelocityGauge = ({ data, currency }: SpendingVelocityGaugeProps) => {
    // SVG Arc calculation for a 180-degree speedometer
    // cx, cy = 100, 100
    // r = 80
    // Length of semi-circle = Math.PI * 80 ≈ 251.2
    const maxDash = 251.2
    // We cap the fill at 100% of the gauge (even if percent > 100 visually it just stays full)
    const drawPercent = Math.min(data.percent, 100)
    const dashOffset = maxDash - (maxDash * drawPercent) / 100

    const color =
        data.status === 'good' ? 'var(--success)' :
            data.status === 'warning' ? 'var(--warning)' : 'var(--danger)'

    return (
        <div className="velocity-gauge">
            <div style={{ position: 'relative', width: '200px', height: '110px', margin: '0 auto' }}>
                <svg viewBox="0 0 200 110" style={{ width: '100%', height: '100%' }}>
                    {/* Background Track */}
                    <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="var(--bg-strong)"
                        strokeWidth="16"
                        strokeLinecap="round"
                    />
                    {/* Warning Zone (75% to 100%) overlay on track */}
                    <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="var(--warning)"
                        strokeWidth="16"
                        strokeOpacity="0.15"
                        strokeDasharray={`${maxDash}`}
                        strokeDashoffset={`${maxDash - (maxDash * 0.25)}`}
                    />
                    {/* Danger Zone (>100%) marker (red dot at end) */}
                    <circle cx="180" cy="100" r="8" fill="var(--danger)" opacity={data.percent > 100 ? 1 : 0.2} />

                    {/* Active Fill */}
                    <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke={color}
                        strokeWidth="16"
                        strokeLinecap="round"
                        strokeDasharray={maxDash}
                        strokeDashoffset={dashOffset}
                        style={{
                            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.5s ease',
                            filter: `drop-shadow(0 0 8px color-mix(in srgb, ${color} 50%, transparent))`
                        }}
                    />
                </svg>

                <div style={{
                    position: 'absolute', bottom: '0', left: '0', right: '0',
                    display: 'flex', flexDirection: 'column', alignItems: 'center'
                }}>
                    <span className="glow-text" style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Space Grotesk, sans-serif', color, lineHeight: 1 }}>
                        {data.percent}%
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Pacing</span>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', padding: '0 1rem' }}>
                <div style={{ textAlign: 'center' }}>
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Spent</small>
                    <strong style={{ display: 'block' }}>{formatCurrency(data.value, currency)}</strong>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Budget</small>
                    <strong style={{ display: 'block' }}>{formatCurrency(data.target, currency)}</strong>
                </div>
            </div>
        </div>
    )
}
