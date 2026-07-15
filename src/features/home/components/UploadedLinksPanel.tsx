import type { ImageCopyFormat } from '@/features/dashboard/lib/copyFormats'
import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { IMAGE_COPY_FORMATS } from '@/features/dashboard/lib/copyFormats'

interface UploadedLinksPanelProps {
  uploadedCount: number
  selectedUploadedCount: number
  isCopyPending: boolean
  onCopySelected: (format: ImageCopyFormat) => Promise<void>
  onCopyAll: (format: ImageCopyFormat) => Promise<void>
}

/**
 * Copy actions for uploaded home-page items using dashboard formatting utilities.
 */
export function UploadedLinksPanel({
  uploadedCount,
  selectedUploadedCount,
  isCopyPending,
  onCopySelected,
  onCopyAll,
}: UploadedLinksPanelProps) {
  if (uploadedCount === 0) {
    return null
  }

  const disabled = isCopyPending

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Copy uploaded links</CardTitle>
        <CardDescription>
          {uploadedCount}
          {' '}
          uploaded
          {selectedUploadedCount > 0 && (
            <>
              {' · '}
              {selectedUploadedCount}
              {' '}
              selected uploaded
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" disabled={disabled || selectedUploadedCount === 0}>
              <Copy className="mr-2 h-4 w-4" />
              Copy selected uploaded
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Format</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {IMAGE_COPY_FORMATS.map(({ format, menuLabel }) => (
              <DropdownMenuItem key={format} onSelect={() => { void onCopySelected(format) }}>
                {menuLabel}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" disabled={disabled}>
              <Copy className="mr-2 h-4 w-4" />
              Copy all uploaded
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Format</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {IMAGE_COPY_FORMATS.map(({ format, menuLabel }) => (
              <DropdownMenuItem key={format} onSelect={() => { void onCopyAll(format) }}>
                {menuLabel}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  )
}
