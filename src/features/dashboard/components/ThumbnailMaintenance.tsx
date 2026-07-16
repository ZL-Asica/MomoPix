import { ImageDown, LoaderCircle, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useThumbnailMaintenance } from '@/features/dashboard/hooks/useThumbnailMaintenance'

interface ThumbnailMaintenanceProps {
  onUpdated: () => void
}

/** Presents the opt-in, resumable migration for legacy album previews. */
export function ThumbnailMaintenance({ onUpdated }: ThumbnailMaintenanceProps) {
  const maintenance = useThumbnailMaintenance(onUpdated)

  if (maintenance.state === 'loading' || (maintenance.missingCount === 0 && maintenance.error === null)) {
    return null
  }

  if (maintenance.error !== null && maintenance.missingCount === 0) {
    return (
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <p role="alert" className="text-sm text-destructive">
            Thumbnail maintenance is unavailable:
            {' '}
            {maintenance.error}
          </p>
          <Button type="button" size="sm" variant="outline" onClick={() => void maintenance.refresh()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const isRunning = maintenance.state === 'running'
  const isPausing = maintenance.state === 'pausing'
  const progressValue = maintenance.progress === null || maintenance.progress.total === 0
    ? 0
    : (maintenance.progress.processed / maintenance.progress.total) * 100

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <ImageDown className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Generate faster album previews</p>
              <p className="text-sm text-muted-foreground">
                {maintenance.missingCount}
                {' '}
                legacy image(s) still use the full hosted file in albums. This runs locally and can be resumed.
              </p>
            </div>
          </div>
          {isRunning
            ? (
                <Button type="button" size="sm" variant="outline" onClick={maintenance.cancel}>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </Button>
              )
            : isPausing
              ? (
                  <Button type="button" size="sm" variant="outline" disabled>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Pausing…
                  </Button>
                )
              : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void maintenance.start()}
                  >
                    {maintenance.progress === null ? 'Start' : 'Resume'}
                  </Button>
                )}
        </div>

        {maintenance.progress !== null && (
          <div role="status" aria-live="polite" className="space-y-1.5">
            <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {maintenance.progress.processed}
                {' / '}
                {maintenance.progress.total}
                {' processed'}
                {maintenance.progress.failed > 0 && ` · ${maintenance.progress.failed} failed`}
              </span>
              <span className="max-w-64 truncate">{maintenance.progress.currentName}</span>
            </div>
            <Progress value={progressValue} />
          </div>
        )}
        {maintenance.error !== null && (
          <p role="alert" className="text-sm text-destructive">{maintenance.error}</p>
        )}
      </CardContent>
    </Card>
  )
}
