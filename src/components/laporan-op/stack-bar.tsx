type Segment = { value: number; color: string; label?: string }

type Props = {
  segments: Segment[]
}

export function StackBar({ segments }: Props) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) return null

  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full">
      {segments.map((seg, i) => (
        <div
          key={i}
          style={{
            width: `${(seg.value / total) * 100}%`,
            backgroundColor: seg.color,
          }}
          title={seg.label ? `${seg.label}: ${seg.value}` : undefined}
        />
      ))}
    </div>
  )
}
