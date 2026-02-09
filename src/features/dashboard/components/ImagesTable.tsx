import type { Table as TableInstance } from '@tanstack/react-table'
import type { ImagesTableMeta } from '@/features/dashboard/hooks/useImagesTable'
import type { AlbumImageListItem } from '@/lib/storage/types'
import { flexRender } from '@tanstack/react-table'
import { ImageIcon } from 'lucide-react'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ImageActionsContextMenu } from '@/features/dashboard/components/ImageActionsMenu'

interface ImagesTableProps {
  table: TableInstance<AlbumImageListItem>
}

export function ImagesTable({ table }: ImagesTableProps) {
  const meta = table.options.meta as ImagesTableMeta | undefined

  if (table.getRowModel().rows.length === 0) {
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
                      <button
                        type="button"
                        className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </button>
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
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
