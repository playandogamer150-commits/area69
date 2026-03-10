import { Clock3 } from 'lucide-react'

export function VideoGeneration() {
  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl rounded-3xl border bg-background p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Clock3 className="w-7 h-7" />
        </div>
        <div className="mb-3 inline-flex rounded-full border border-border bg-muted px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Em breve
        </div>
        <h1 className="text-3xl font-bold">Gerar Video</h1>
        <p className="mt-3 text-muted-foreground">
          Essa categoria esta reservada para uma futura implementacao e permanece bloqueada por enquanto.
        </p>
      </div>
    </div>
  )
}
