import type { RowSelectionState } from '@tanstack/react-table'

interface ShiftRangeSelectionInput {
  rowIds: string[]
  rowSelection: RowSelectionState
  anchorIndex: number
  targetIndex: number
  nextSelected: boolean
}

/**
 * Applies contiguous range selection using the current row-model order.
 *
 * Rows outside the computed range keep their previous selection state.
 */
export function applyShiftRangeSelection(input: ShiftRangeSelectionInput): RowSelectionState {
  const { rowIds, rowSelection, anchorIndex, targetIndex, nextSelected } = input
  const start = Math.min(anchorIndex, targetIndex)
  const end = Math.max(anchorIndex, targetIndex)
  const next = { ...rowSelection }

  for (let index = start; index <= end; index += 1) {
    const rowId = rowIds[index]
    if (rowId === undefined) {
      continue
    }

    if (nextSelected) {
      next[rowId] = true
    }
    else {
      delete next[rowId]
    }
  }

  return next
}
