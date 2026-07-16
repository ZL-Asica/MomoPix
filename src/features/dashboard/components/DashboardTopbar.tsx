import type { ReactNode } from 'react'
import type { UploadProgress } from '@/features/dashboard/hooks/useUpload'
import { Search, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingButton } from '@/components/ui/loading-button'
import { Progress } from '@/components/ui/progress'

interface DashboardTopbarProps {
  search: string
  onSearchChange: (value: string) => void
  onUploadClick: () => void
  onUploadChange: (files: FileList | null) => void
  uploadDisabled: boolean
  uploadLoading: boolean
  uploadProgress: UploadProgress | null
  failedUploadCount: number
  onRetryFailedUploads: () => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  bulkOptions: ReactNode
}

export function DashboardTopbar({
  search,
  onSearchChange,
  onUploadClick,
  onUploadChange,
  uploadDisabled,
  uploadLoading,
  uploadProgress,
  failedUploadCount,
  onRetryFailedUploads,
  fileInputRef,
  bulkOptions,
}: DashboardTopbarProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            aria-label="Search images"
            placeholder="Search images..."
            value={search}
            onChange={event_ => onSearchChange(event_.target.value)}
          />
        </div>
        <LoadingButton
          onClick={onUploadClick}
          disabled={uploadDisabled}
          loading={uploadLoading}
          loadingText="Uploading..."
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload
        </LoadingButton>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          aria-label="Upload image files"
          className="hidden"
          onChange={event_ => onUploadChange(event_.target.files)}
        />
        {bulkOptions}
      </div>
      {uploadProgress !== null && (
        <div className="rounded-md border bg-muted/40 px-3 py-2" role="status" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>
              {uploadLoading
                ? `Uploading ${uploadProgress.completed} of ${uploadProgress.total}`
                : `Uploaded ${uploadProgress.succeeded} of ${uploadProgress.total}`}
              {uploadProgress.failed > 0 && ` · ${uploadProgress.failed} failed`}
            </span>
            {failedUploadCount > 0 && !uploadLoading && (
              <Button type="button" size="sm" variant="outline" onClick={onRetryFailedUploads}>
                Retry failed (
                {failedUploadCount}
                )
              </Button>
            )}
          </div>
          <Progress className="mt-2" value={(uploadProgress.completed / uploadProgress.total) * 100} />
        </div>
      )}
    </div>
  )
}
