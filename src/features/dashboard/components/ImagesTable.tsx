import type { Table as TableInstance } from '@tanstack/react-table'
import type { ImagesTableMeta } from '@/features/dashboard/hooks/useImagesTable'
import type { AlbumImageListItem } from '@/lib/storage/types'
import { flexRender } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ImageActionsContextMenu } from '@/features/dashboard/components/ImageActionsMenu'

interface ImagesTableProps {
  table: TableInstance<AlbumImageListItem>
  isInitialLoading: boolean
  hasLoadedOnce: boolean
}

const LOADING_ROW_COUNT = 6
const LOADING_ROW_KEYS = Array.from({ length: LOADING_ROW_COUNT }, (_, index) => `loading-row-${index + 1}`)

export function ImagesTable({ table, isInitialLoading, hasLoadedOnce }: ImagesTableProps) {
  const meta = table.options.meta as ImagesTableMeta | undefined
  const rowCount = Math.max(1, table.getVisibleLeafColumns().length)

  if (!isInitialLoading && hasLoadedOnce && table.getRowModel().rows.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ImageIcon />
          </EmptyMedia>
          <EmptyTitle>No images</EmptyTitle>
          <EmptyDescription>
            Upload images to this album from the top bar.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map(headerGroup => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <TableHead key={header.id}>
                {header.isPlaceholder
                  ? null
                  : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={header.column.getCanSort() ? 'h-auto px-0 font-medium' : 'h-auto px-0 font-medium'}
                        onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                        disabled={!header.column.getCanSort()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <>
                            {header.column.getIsSorted() === 'asc' && <ArrowUp className="h-3 w-3 text-muted-foreground" />}
                            {header.column.getIsSorted() === 'desc' && <ArrowDown className="h-3 w-3 text-muted-foreground" />}
                            {header.column.getIsSorted() === false && <ArrowUpDown className="h-3 w-3 text-muted-foreground" />}
                          </>
                        )}
                      </Button>
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {isInitialLoading && table.getRowModel().rows.length === 0 && LOADING_ROW_KEYS.map(key => (
          <TableRow key={key}>
            <TableCell colSpan={rowCount}>
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded-sm" />
                <Skeleton className="h-12 w-12 rounded-md" />
                <Skeleton className="h-4 w-48" />
              </div>
            </TableCell>
          </TableRow>
        ))}
        {table.getRowModel().rows.map((row) => {
          const cells = row.getVisibleCells().map(cell => (
            <TableCell key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))

          if (meta === undefined) {
            return <TableRow key={row.id}>{cells}</TableRow>
          }

          return (
            <ImageActionsContextMenu
              key={row.id}
              image={row.original}
              onRenameImage={meta.onRenameImage}
              onMoveImage={meta.onMoveImage}
              onDeleteImage={meta.onDeleteImage}
            >
              <TableRow>{cells}</TableRow>
            </ImageActionsContextMenu>
          )
        })}
      </TableBody>
    </Table>
  )
}
