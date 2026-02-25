import { ResponsiveContainer, Treemap, Tooltip } from 'recharts'
import { TreemapNode } from '@/utils/finance'

interface CategoryTreemapProps {
    data: TreemapNode[]
    currency: string
}



// Custom node rendering to add labels and styling
const CustomizedContent = (props: any) => {
    const { x, y, width, height, name } = props

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: props.color || 'var(--primary)',
                    stroke: 'var(--bg-panel)',
                    strokeWidth: 2,
                    strokeOpacity: 0.8,
                }}
                rx={4}
                ry={4}
            />
            {
                width > 40 && height > 24 ? (
                    <text
                        x={x + width / 2}
                        y={y + height / 2 + 4}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={12}
                        fontWeight={600}
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                    >
                        {name}
                    </text>
                ) : null
            }
        </g>
    )
}

export const CategoryTreemap = ({ data, currency }: CategoryTreemapProps) => {
    if (data.length === 0) {
        return <p className="chart-empty">No spending data to map.</p>
    }

    const formatValue = (val: number) => `${currency}${val.toFixed(2)}`

    return (
        <div className="chart-shell" aria-label="Category Treemap" role="img">
            <ResponsiveContainer width="100%" height={300}>
                <Treemap
                    // @ts-expect-error recharts generic prop types mismatch
                    data={data}
                    dataKey="size"
                    aspectRatio={4 / 3}
                    stroke="#fff"
                    content={<CustomizedContent />}
                    animationDuration={1200}
                    style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }}
                >
                    <Tooltip content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                            const nodeData = payload[0].payload
                            return (
                                <div style={{
                                    background: 'var(--bg-elevated)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '0.75rem',
                                    padding: '0.5rem 0.75rem',
                                    color: 'var(--text)',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                                }}>
                                    <strong style={{ display: 'block', marginBottom: '4px' }}>{nodeData.name}</strong>
                                    <span>{formatValue(nodeData.value)}</span>
                                </div>
                            )
                        }
                        return null
                    }} />
                </Treemap>
            </ResponsiveContainer>
        </div>
    )
}
