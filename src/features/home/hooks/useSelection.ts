import type { HomeProcessedItem } from '@/features/home/types'
import { useCallback, useMemo, useState } from 'react'

function isSelectable(item: HomeProcessedItem): boolean {
  return item.status === 'compressed' && item.compressedFile !== null
}

function isSameSelection(previous: Set<string>, nextIds: readonly string[]): boolean {
  if (previous.size !== nextIds.length) {
    return false
  }

  for (const id of nextIds) {
    if (!previous.has(id)) {
      return false
    }
  }

  return true
}

/**
 * Tracks row selection for the home page result list.
 *
 * @param items Current home page rows.
 * @param enabled Whether selection interactions are allowed.
 * @returns Selection state and mutators scoped to selectable compressed rows.
 */
export function useSelection(items: readonly HomeProcessedItem[], enabled: boolean) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())

  const selectableIds = useMemo(() => {
    return items.filter(isSelectable).map(item => item.id)
  }, [items])

  const selectableSet = useMemo(() => new Set(selectableIds), [selectableIds])

  const visibleSelectedIds = useMemo(() => {
    if (!enabled) {
      return new Set<string>()
    }

    // Avoid syncing derived selection back into state via useEffect.
    // That caused a setState-in-effect feedback loop while compress updates were rendering.
    for (const id of selectedIds) {
      if (!selectableSet.has(id)) {
        const next = new Set<string>()
        for (const candidate of selectedIds) {
          if (selectableSet.has(candidate)) {
            next.add(candidate)
          }
        }
        return next
      }
    }

    return selectedIds
  }, [enabled, selectableSet, selectedIds])

  const selectedCount = visibleSelectedIds.size
  const selectableCount = selectableIds.length
  const isAllSelected = selectableCount > 0 && selectedCount === selectableCount
  const isIndeterminate = selectedCount > 0 && selectedCount < selectableCount

  const toggleOne = useCallback((id: string, selected?: boolean) => {
    if (!enabled || !selectableSet.has(id)) {
      return
    }

    setSelectedIds((previous) => {
      const shouldSelect = selected ?? !previous.has(id)
      if (shouldSelect === previous.has(id)) {
        return previous
      }

      const next = new Set(previous)
      if (shouldSelect) {
        next.add(id)
      }
      else {
        next.delete(id)
      }
      return next
    })
  }, [enabled, selectableSet])

  const toggleAll = useCallback((selected: boolean) => {
    if (!enabled) {
      return
    }

    if (!selected) {
      setSelectedIds(previous => (previous.size === 0 ? previous : new Set()))
      return
    }

    setSelectedIds((previous) => {
      if (isSameSelection(previous, selectableIds)) {
        return previous
      }
      return new Set(selectableIds)
    })
  }, [enabled, selectableIds])

  const clearSelection = useCallback(() => {
    setSelectedIds(previous => (previous.size === 0 ? previous : new Set()))
  }, [])

  return {
    selectedIds: visibleSelectedIds,
    selectedCount,
    selectableCount,
    isAllSelected,
    isIndeterminate,
    toggleOne,
    toggleAll,
    clearSelection,
  }
}
