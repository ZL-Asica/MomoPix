import type { ColumnDef, RowSelectionState, Table as TableInstance } from '@tanstack/react-table'
import type { AlbumImageListItem } from '@/lib/storage/types'
import {
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useCallback, useMemo, useRef, useState } from 'react'
import { ImageActionsDropdownMenu } from '@/features/dashboard/components/ImageActionsMenu'
import { LazyImage } from '@/features/dashboard/components/LazyImage'
import { applyShiftRangeSelection } from '@/features/dashboard/lib/shiftRangeSelection'
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
 * Configures TanStack Table state and columns for paged dashboard image browsing.
 */
export function useImagesTable({
  images,
  onRenameImage,
  onMoveImage,
  onDeleteImage,
}: UseImagesTableOptions) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const lastAnchorRowIdRef = useRef<string | null>(null)
  const clearSelection = useCallback(() => {
    setRowSelection({})
    lastAnchorRowIdRef.current = null
  }, [])

  const setSelectionToObjectKeys = useCallback((objectKeys: string[]) => {
    const uniqueKeys = [...new Set(objectKeys)]
    const nextSelection: RowSelectionState = {}
    for (const objectKey of uniqueKeys) {
      nextSelection[objectKey] = true
    }
    setRowSelection(nextSelection)
    lastAnchorRowIdRef.current = uniqueKeys.at(-1) ?? null
  }, [])

  const toggleRowSelection = useCallback((input: {
    rowId: string
    shiftKey: boolean
    table: TableInstance<AlbumImageListItem>
  }) => {
    const rows = input.table.getRowModel().rows
    const rowIds = rows.map(row => row.id)
    const targetIndex = rowIds.findIndex(rowId => rowId === input.rowId)
    if (targetIndex < 0) {
      return
    }

    const anchorRowId = lastAnchorRowIdRef.current
    const anchorIndex = anchorRowId !== null
      ? rowIds.findIndex(rowId => rowId === anchorRowId)
      : -1
    const nextSelected = !rows[targetIndex]?.getIsSelected()

    setRowSelection((previousSelection) => {
      if (input.shiftKey && anchorIndex >= 0) {
        return applyShiftRangeSelection({
          rowIds,
          rowSelection: previousSelection,
          anchorIndex,
          targetIndex,
          nextSelected,
        })
      }

      const nextSelection = { ...previousSelection }
      if (nextSelected) {
        nextSelection[input.rowId] = true
      }
      else {
        delete nextSelection[input.rowId]
      }
      return nextSelection
    })

    lastAnchorRowIdRef.current = input.rowId
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
      cell: ({ row, table }) => (
        <input
          type="checkbox"
          aria-label={`Select ${row.original.name}`}
          checked={row.getIsSelected()}
          readOnly
          onClick={(event_) => {
            toggleRowSelection({
              rowId: row.id,
              shiftKey: event_.shiftKey,
              table,
            })
          }}
        />
      ),
      enableSorting: false,
    },
    {
      id: 'preview',
      header: 'Preview',
      cell: ({ row }) => (
        row.original.publicUrl !== null
          ? (
              <LazyImage
                src={row.original.publicUrl}
                alt={row.original.name}
                className="h-12 w-12 rounded-md border object-cover"
              />
            )
          : (
              <div className="flex h-12 w-12 items-center justify-center rounded-md border text-[10px] text-muted-foreground">
                URL ERR
              </div>
            )
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="max-w-60 truncate font-medium">{row.original.name}</div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'sizeBytes',
      header: 'Size',
      cell: ({ row }) => formatBytes(row.original.sizeBytes),
      enableSorting: false,
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
    },
    {
      id: 'type',
      header: 'Type',
      cell: ({ row }) =>
        row.original.publicUrl?.split('.').pop()?.toUpperCase()
        ?? row.original.mime.split('/').pop()?.toUpperCase()
        ?? 'Unknown',
      enableSorting: false,
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
      enableSorting: false,
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
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
  ], [onDeleteImage, onMoveImage, onRenameImage, toggleRowSelection])

  const table = useReactTable({
    data: images,
    columns,
    state: {
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    meta: {
      onRenameImage,
      onMoveImage,
      onDeleteImage,
    },
    getCoreRowModel: getCoreRowModel(),
    getRowId: row => row.objectKey,
  })

  const selectedImagesOrdered = table.getRowModel().rows.filter(row => row.getIsSelected()).map(row => row.original)

  return {
    clearSelection,
    setSelectionToObjectKeys,
    selectedImagesOrdered,
    table,
  }
}
