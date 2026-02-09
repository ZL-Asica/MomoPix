import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const

interface AlbumImagePaginationProps {
  pageIndex: number
  totalPages: number | null
  totalCount: number | null
  pageSize: number
  hasPreviousPage: boolean
  hasNextPage: boolean
  isLoading: boolean
  onPageSizeChange: (value: number) => void
  onPreviousPage: () => void
  onNextPage: () => void
  onFirstPage: () => void
  onLastPage: () => void
}

function disabledLinkClass(disabled: boolean): string {
  return disabled ? 'pointer-events-none opacity-50' : ''
}

/**
 * Cursor-based pagination control for album image listings.
 */
export function AlbumImagePagination({
  pageIndex,
  totalPages,
  totalCount,
  pageSize,
  hasPreviousPage,
  hasNextPage,
  isLoading,
  onPageSizeChange,
  onPreviousPage,
  onNextPage,
  onFirstPage,
  onLastPage,
}: AlbumImagePaginationProps) {
  const prevDisabled = isLoading || !hasPreviousPage
  const nextDisabled = isLoading || !hasNextPage
  const showBounds = totalPages !== null
  const firstDisabled = isLoading || pageIndex <= 1
  const lastDisabled = isLoading || totalPages === null || pageIndex >= totalPages

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {showBounds
          ? (
              <span>
                Page
                {' '}
                {pageIndex}
                {' '}
                of
                {' '}
                {totalPages}
              </span>
            )
          : (
              <span>
                Page
                {' '}
                {pageIndex}
              </span>
            )}
        {totalCount !== null && (
          <span>
            Total
            {' '}
            {totalCount}
            {' '}
            images
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Page size</span>
          <Select value={String(pageSize)} onValueChange={value => onPageSizeChange(Number(value))}>
            <SelectTrigger size="sm" className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map(option => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Pagination className="justify-end">
          <PaginationContent>
            {showBounds && (
              <PaginationItem>
                <PaginationLink
                  href="#"
                  className={cn('px-2', disabledLinkClass(firstDisabled))}
                  aria-disabled={firstDisabled}
                  onClick={(event_) => {
                    event_.preventDefault()
                    if (!firstDisabled) {
                      onFirstPage()
                    }
                  }}
                >
                  First
                </PaginationLink>
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationPrevious
                href="#"
                className={disabledLinkClass(prevDisabled)}
                aria-disabled={prevDisabled}
                onClick={(event_) => {
                  event_.preventDefault()
                  if (!prevDisabled) {
                    onPreviousPage()
                  }
                }}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink
                href="#"
                isActive
                className={cn('pointer-events-none', isLoading && 'opacity-70')}
                aria-label={`Current page ${pageIndex}`}
              >
                {pageIndex}
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                className={disabledLinkClass(nextDisabled)}
                aria-disabled={nextDisabled}
                onClick={(event_) => {
                  event_.preventDefault()
                  if (!nextDisabled) {
                    onNextPage()
                  }
                }}
              />
            </PaginationItem>
            {showBounds && (
              <PaginationItem>
                <PaginationLink
                  href="#"
                  className={cn('px-2', disabledLinkClass(lastDisabled))}
                  aria-disabled={lastDisabled}
                  onClick={(event_) => {
                    event_.preventDefault()
                    if (!lastDisabled) {
                      onLastPage()
                    }
                  }}
                >
                  Last
                </PaginationLink>
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
