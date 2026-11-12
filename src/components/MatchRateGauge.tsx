import type { CSSProperties } from 'react'

export function MatchRateGauge({ rate }: { rate: number }) {
  const size = 168
  const stroke = 14
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (rate / 100) * c
  const color =
    rate >= 75 ? '#059669' : rate >= 55 ? '#f59e0b' : '#e11d48'

  return (
    <div className="relative mx-auto flex h-[168px] w-[168px] items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e8eef2"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="gauge-ring transition-[stroke-dashoffset] duration-700"
          style={
            {
              '--gauge-circumference': c,
            } as CSSProperties
          }
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-extrabold tracking-tight text-ink">
          {rate}%
        </span>
        <span className="text-xs font-medium uppercase tracking-wider text-slate">
          Match rate
        </span>
      </div>
    </div>
  )
}