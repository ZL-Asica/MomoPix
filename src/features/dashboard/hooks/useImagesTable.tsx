import type { ColumnDef, RowSelectionState, SortingState } from '@tanstack/react-table'
import type { AlbumImageListItem } from '@/lib/storage/types'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useCallback, useMemo, useState } from 'react'
import { ImageActionsDropdownMenu } from '@/features/dashboard/components/ImageActionsMenu'
import { formatBytes } from '@/lib/storage/format'

interface UseImagesTableOptions {
  images: AlbumImageListItem[]
  onRenameImage: (objectKey: string) => void
  onMoveImage: (objectKey: string) => void
  onDeleteImage: (objectKey: string) => void
}

export interface ImagesTableMeta {
  onRenameImage: (objectKey: string) => void
  onMoveImage: (objectKey: string) => void
  onDeleteImage: (objectKey: string) => void
}

/**
 * Configures TanStack Table state and columns for dashboard image browsing.
 */
export function useImagesTable({
  images,
  onRenameImage,
  onMoveImage,
  onDeleteImage,
}: UseImagesTableOptions) {
  const [search, setSearch] = useState('')
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const clearSelection = useCallback(() => {
    setRowSelection({})
  }, [])

  const columns = useMemo<ColumnDef<AlbumImageListItem>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          aria-label="Select all rows"
          checked={table.getIsAllPageRowsSelected()}
          onChange={event_ => table.toggleAllPageRowsSelected(event_.target.checked)}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          aria-label={`Select ${row.original.name}`}
          checked={row.getIsSelected()}
          onChange={event_ => row.toggleSelected(event_.target.checked)}
        />
      ),
      enableSorting: false,
      enableGlobalFilter: false,
    },
    {
      id: 'preview',
      header: 'Preview',
      cell: ({ row }) => (
        row.original.publicUrl !== null
          ? (
              <img
                src={row.original.publicUrl}
                alt={row.original.name}
                className="h-12 w-12 rounded-md border object-cover"
                loading="lazy"
              />
            )
          : (
              <div className="flex h-12 w-12 items-center justify-center rounded-md border text-[10px] text-muted-foreground">
                URL ERR
              </div>
            )
      ),
      enableSorting: false,
      enableGlobalFilter: false,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="max-w-60 truncate font-medium">{row.original.name}</div>
      ),
    },
    {
      accessorKey: 'sizeBytes',
      header: 'Size',
      cell: ({ row }) => formatBytes(row.original.sizeBytes),
    },
    {
      id: 'dimensions',
      header: 'Dimensions',
      cell: ({ row }) => {
        const { width, height } = row.original
        if (typeof width !== 'number' || typeof height !== 'number') {
          return <span className="text-muted-foreground">Unknown</span>
        }
        return `${width} × ${height}`
      },
      enableSorting: false,
      enableGlobalFilter: false,
    },
    {
      id: 'type',
      header: 'Type',
      cell: ({ row }) =>
        row.original.publicUrl?.split('.').pop()?.toUpperCase()
        ?? row.original.mime.split('/').pop()?.toUpperCase()
        ?? 'Unknown',
      enableSorting: false,
      enableGlobalFilter: false,
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      enableGlobalFilter: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <ImageActionsDropdownMenu
            image={row.original}
            onRenameImage={onRenameImage}
            onMoveImage={onMoveImage}
            onDeleteImage={onDeleteImage}
          />
        </div>
      ),
    },
  ], [onDeleteImage, onMoveImage, onRenameImage])

  const table = useReactTable({
    data: images,
    columns,
    state: {
      globalFilter: search,
      rowSelection,
      sorting,
    },
    onGlobalFilterChange: setSearch,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    meta: {
      onRenameImage,
      onMoveImage,
      onDeleteImage,
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, _columnId, value) => {
      const needle = String(value ?? '').toLowerCase().trim()
      if (!needle) {
        return true
      }
      return row.original.nameLower.includes(needle)
    },
  })

  const selectedImagesOrdered = useMemo(
    () => table.getRowModel().rows.filter(row => row.getIsSelected()).map(row => row.original),
    [table],
  )

  return {
    columns,
    clearSelection,
    flexRender,
    selectedImagesOrdered,
    search,
    setSearch,
    table,
  }
}
