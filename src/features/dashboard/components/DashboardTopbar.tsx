import type { ReactNode } from 'react'
import { Search, Upload } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { LoadingButton } from '@/components/ui/loading-button'

interface DashboardTopbarProps {
  search: string
  onSearchChange: (value: string) => void
  onUploadClick: () => void
  onUploadChange: (files: FileList | null) => void
  uploadDisabled: boolean
  uploadLoading: boolean
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
  fileInputRef,
  bulkOptions,
}: DashboardTopbarProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-8"
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
        className="hidden"
        onChange={event_ => onUploadChange(event_.target.files)}
      />
      {bulkOptions}
    </div>
  )
}
