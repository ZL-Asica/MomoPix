import type { ColumnDef, RowSelectionState, SortingState } from '@tanstack/react-table'
import type { AlbumImageRecord } from '@/lib/storage/types'
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
  images: AlbumImageRecord[]
  onMoveImage: (imageId: string) => void
  onDeleteImage: (imageId: string) => void
}

/**
 * Configures TanStack Table state and columns for dashboard image browsing.
 */
export function useImagesTable({ images, onMoveImage, onDeleteImage }: UseImagesTableOptions) {
  const [search, setSearch] = useState('')
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const columns = useMemo<ColumnDef<AlbumImageRecord>[]>(() => [
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
        <img
          src={`/i/${row.original.imageId}`}
          alt={row.original.name}
          className="h-12 w-12 rounded-md border object-cover"
          loading="lazy"
        />
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
              onClick={() => window.open(`/i/${row.original.imageId}`, '_blank', 'noopener,noreferrer')}
            >
              <UserRoundSearch className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMoveImage(row.original.imageId)}>
              <MoveRight className="mr-2 h-4 w-4" />
              Move
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDeleteImage(row.original.imageId)} className="text-destructive">
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
