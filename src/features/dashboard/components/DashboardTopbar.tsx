import { Search, Settings, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface DashboardTopbarProps {
  search: string
  onSearchChange: (value: string) => void
  onUploadClick: () => void
  onUploadChange: (files: FileList | null) => void
  onSetDefault: () => void
  uploadDisabled: boolean
  setDefaultDisabled: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
}

export function DashboardTopbar({
  search,
  onSearchChange,
  onUploadClick,
  onUploadChange,
  onSetDefault,
  uploadDisabled,
  setDefaultDisabled,
  fileInputRef,
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
      <Button onClick={onUploadClick} disabled={uploadDisabled}>
        <Upload className="mr-2 h-4 w-4" />
        Upload
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={event_ => onUploadChange(event_.target.files)}
      />
      <Button variant="outline" onClick={onSetDefault} disabled={setDefaultDisabled}>
        <Settings className="mr-2 h-4 w-4" />
        Set Default
      </Button>
    </div>
  )
}
