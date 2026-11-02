import type { LucideIcon } from 'lucide-react'

export function PageHeader({
  title,
  description,
  action,
  icon: Icon,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: LucideIcon
}) {
  const heading = (
    <div className="min-w-0 space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight text-balance">
        {title}
      </h1>
      {description ? (
        <p className="text-sm text-muted-foreground text-pretty">
          {description}
        </p>
      ) : null}
    </div>
  )

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      {Icon ? (
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/15 text-primary shadow-sm" aria-hidden="true">
            <Icon className="size-5" />
          </span>
          {heading}
        </div>
      ) : (
        heading
      )}
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
