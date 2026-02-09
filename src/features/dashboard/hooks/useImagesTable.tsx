import type { ColumnDef, RowSelectionState, SortingState } from '@tanstack/react-table'
import type { AlbumImageListItem } from '@/lib/storage/types'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { MoveRight, Trash2, UserRoundSearch } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatBytes } from '@/lib/storage/format'

interface UseImagesTableOptions {
  images: AlbumImageListItem[]
  onMoveImage: (objectKey: string) => void
  onDeleteImage: (objectKey: string) => void
}

/**
 * Configures TanStack Table state and columns for dashboard image browsing.
 */
export function useImagesTable({
  images,
  onMoveImage,
  onDeleteImage,
}: UseImagesTableOptions) {
  const [search, setSearch] = useState('')
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

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
        if (width === null || height === null) {
          return <span className="text-muted-foreground">Unknown</span>
        }
        return `${width} × ${height}`
      },
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">Actions</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                const url = row.original.publicUrl
                if (url === null) {
                  return
                }
                window.open(url, '_blank', 'noopener,noreferrer')
              }}
              disabled={row.original.publicUrl === null}
            >
              <UserRoundSearch className="mr-2 h-4 w-4" />
              {row.original.publicUrl !== null ? 'View' : 'View (Unavailable)'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMoveImage(row.original.objectKey)}>
              <MoveRight className="mr-2 h-4 w-4" />
              Move
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDeleteImage(row.original.objectKey)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [onDeleteImage, onMoveImage])

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

  return {
    columns,
    flexRender,
    search,
    setSearch,
    table,
  }
}
