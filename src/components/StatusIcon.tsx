import { Check, X, AlertTriangle, Minus } from 'lucide-react'

export function StatusIcon({
  status,
}: {
  status: 'pass' | 'fail' | 'warn' | 'info'
}) {
  if (status === 'pass') {
    return (
      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ok text-white">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    )
  }
  if (status === 'fail') {
    return (
      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose text-white">
        <X className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    )
  }
  if (status === 'warn') {
    return (
      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber text-ink">
        <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
    )
  }
  return (
    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mist text-slate">
      <Minus className="h-3.5 w-3.5" strokeWidth={3} />
    </span>
  )
}