type Props = {
  data: number[]
  width?: number
  height?: number
  color?: string
  strokeWidth?: number
  showDot?: boolean
}

export function Sparkline({
  data,
  width = 120,
  height = 32,
  color = "currentColor",
  strokeWidth = 1.5,
  showDot = true,
}: Props) {
  if (!data || data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const pad = strokeWidth + 1
  const innerW = width - pad * 2
  const innerH = height - pad * 2

  const points = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * innerW,
    y: pad + (1 - (v - min) / range) * innerH,
  }))

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ")

  // Area path: go down from last point, across bottom, up to first point, follow the line
  const areaPath =
    `M ${points[0].x},${points[0].y} ` +
    points
      .slice(1)
      .map((p) => `L ${p.x},${p.y}`)
      .join(" ") +
    ` L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`

  const last = points[points.length - 1]

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d={areaPath} fill={color} fillOpacity={0.1} />
      <polyline
        points={polyline}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {showDot && (
        <circle cx={last.x} cy={last.y} r={2.5} fill={color} />
      )}
    </svg>
  )
}
