import type { ReactNode } from 'react'
import type { UploadProgress } from '@/features/dashboard/hooks/useUpload'
import type { DashboardImageScope } from '@/features/dashboard/lib/urlState'
import type { ImageDateFilter, ImageFormatFilter, ImageListSort, ImageOrientationFilter, ImageResolutionFilter } from '@/lib/storage/types'
import { Search, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingButton } from '@/components/ui/loading-button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
  sort: ImageListSort
  format: ImageFormatFilter
  orientation: ImageOrientationFilter
  date: ImageDateFilter
  resolution: ImageResolutionFilter
  scope: DashboardImageScope
  onSortChange: (value: ImageListSort) => void
  onFormatChange: (value: ImageFormatFilter) => void
  onOrientationChange: (value: ImageOrientationFilter) => void
  onDateChange: (value: ImageDateFilter) => void
  onResolutionChange: (value: ImageResolutionFilter) => void
  onScopeChange: (value: DashboardImageScope) => void
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
  sort,
  format,
  orientation,
  date,
  resolution,
  scope,
  onSortChange,
  onFormatChange,
  onOrientationChange,
  onDateChange,
  onResolutionChange,
  onScopeChange,
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
      <div className="flex flex-wrap gap-2">
        <Select value={scope} onValueChange={value => onScopeChange(value as DashboardImageScope)}>
          <SelectTrigger size="sm" className="min-w-36" aria-label="Choose image scope">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="album">Current album</SelectItem>
            <SelectItem value="all">All albums</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={value => onSortChange(value as ImageListSort)}>
          <SelectTrigger size="sm" className="min-w-42" aria-label="Sort images">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt-desc">Newest first</SelectItem>
            <SelectItem value="createdAt-asc">Oldest first</SelectItem>
            <SelectItem value="name-asc">Name A–Z</SelectItem>
            <SelectItem value="name-desc">Name Z–A</SelectItem>
            <SelectItem value="sizeBytes-desc">Largest first</SelectItem>
            <SelectItem value="sizeBytes-asc">Smallest first</SelectItem>
            <SelectItem value="type-asc">Type A–Z</SelectItem>
            <SelectItem value="type-desc">Type Z–A</SelectItem>
          </SelectContent>
        </Select>
        <Select value={format} onValueChange={value => onFormatChange(value as ImageFormatFilter)}>
          <SelectTrigger size="sm" className="min-w-30" aria-label="Filter by format">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All formats</SelectItem>
            <SelectItem value="avif">AVIF</SelectItem>
            <SelectItem value="bmp">BMP</SelectItem>
            <SelectItem value="gif">GIF</SelectItem>
            <SelectItem value="jpeg">JPEG</SelectItem>
            <SelectItem value="png">PNG</SelectItem>
            <SelectItem value="webp">WebP</SelectItem>
          </SelectContent>
        </Select>
        <Select value={orientation} onValueChange={value => onOrientationChange(value as ImageOrientationFilter)}>
          <SelectTrigger size="sm" className="min-w-32" aria-label="Filter by orientation">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All shapes</SelectItem>
            <SelectItem value="landscape">Landscape</SelectItem>
            <SelectItem value="portrait">Portrait</SelectItem>
            <SelectItem value="square">Square</SelectItem>
          </SelectContent>
        </Select>
        <Select value={date} onValueChange={value => onDateChange(value as ImageDateFilter)}>
          <SelectTrigger size="sm" className="min-w-32" aria-label="Filter by upload date">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any date</SelectItem>
            <SelectItem value="today">Past day</SelectItem>
            <SelectItem value="7d">Past 7 days</SelectItem>
            <SelectItem value="30d">Past 30 days</SelectItem>
            <SelectItem value="1y">Past year</SelectItem>
          </SelectContent>
        </Select>
        <Select value={resolution} onValueChange={value => onResolutionChange(value as ImageResolutionFilter)}>
          <SelectTrigger size="sm" className="min-w-36" aria-label="Filter by resolution">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All resolutions</SelectItem>
            <SelectItem value="under-2mp">Under 2 MP</SelectItem>
            <SelectItem value="2-12mp">2–12 MP</SelectItem>
            <SelectItem value="12-24mp">12–24 MP</SelectItem>
            <SelectItem value="over-24mp">Over 24 MP</SelectItem>
          </SelectContent>
        </Select>
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
