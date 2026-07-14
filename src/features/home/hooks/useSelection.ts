import type { HomeProcessedItem } from '@/features/home/types'
import { useCallback, useEffect, useMemo, useState } from 'react'

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

function addManyToSet(previous: Set<string>, ids: readonly string[]): Set<string> {
  let changed = false
  const next = new Set(previous)

  for (const id of ids) {
    if (!next.has(id)) {
      next.add(id)
      changed = true
    }
  }

  return changed ? next : previous
}

function removeManyFromSet(previous: Set<string>, ids: readonly string[]): Set<string> {
  let changed = false
  const next = new Set(previous)

  for (const id of ids) {
    if (next.delete(id)) {
      changed = true
    }
  }

  return changed ? next : previous
}

/**
 * Tracks row selection for the home page result list.
 *
 * @param items Current home page rows.
 * @param enabled Whether selection interactions are allowed.
 * @returns Selection state and mutators scoped to selectable compressed rows.
 *
 * Invariant:
 * - Newly converted rows auto-select once for logged-in users.
 * - Rows explicitly deselected by the user are never auto-reselected.
 */
export function useSelection(items: readonly HomeProcessedItem[], enabled: boolean) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [manuallyDeselectedIds, setManuallyDeselectedIds] = useState<Set<string>>(() => new Set())
  const [autoSelectedOnceIds, setAutoSelectedOnceIds] = useState<Set<string>>(() => new Set())

  const selectableIds = useMemo(() => {
    return items.filter(isSelectable).map(item => item.id)
  }, [items])

  const selectableSet = useMemo(() => new Set(selectableIds), [selectableIds])

  const autoSelectableIds = useMemo(() => {
    if (!enabled) {
      return []
    }

    return selectableIds.filter(id => !manuallyDeselectedIds.has(id) && !autoSelectedOnceIds.has(id))
  }, [autoSelectedOnceIds, enabled, manuallyDeselectedIds, selectableIds])

  useEffect(() => {
    if (!enabled || autoSelectableIds.length === 0) {
      return
    }

    // Auto-select is guarded and one-time per row to avoid setState feedback loops.
    // eslint-disable-next-line react/set-state-in-effect
    setSelectedIds(previous => addManyToSet(previous, autoSelectableIds))
    // eslint-disable-next-line react/set-state-in-effect
    setAutoSelectedOnceIds(previous => addManyToSet(previous, autoSelectableIds))
  }, [autoSelectableIds, enabled])

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

    const shouldSelect = selected ?? !visibleSelectedIds.has(id)

    setSelectedIds((previous) => {
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

    setManuallyDeselectedIds((previous) => {
      if (shouldSelect) {
        if (!previous.has(id)) {
          return previous
        }
        const next = new Set(previous)
        next.delete(id)
        return next
      }

      if (previous.has(id)) {
        return previous
      }
      const next = new Set(previous)
      next.add(id)
      return next
    })
  }, [enabled, selectableSet, visibleSelectedIds])

  const toggleAll = useCallback((selected: boolean) => {
    if (!enabled) {
      return
    }

    if (!selected) {
      setSelectedIds(previous => (previous.size === 0 ? previous : new Set()))
      setManuallyDeselectedIds(previous => addManyToSet(previous, selectableIds))
      return
    }

    setSelectedIds((previous) => {
      if (isSameSelection(previous, selectableIds)) {
        return previous
      }
      return new Set(selectableIds)
    })
    setManuallyDeselectedIds(previous => removeManyFromSet(previous, selectableIds))
  }, [enabled, selectableIds])

  const clearSelection = useCallback(() => {
    setSelectedIds(previous => (previous.size === 0 ? previous : new Set()))
    setManuallyDeselectedIds(previous => addManyToSet(previous, selectableIds))
  }, [selectableIds])

  const removeSelection = useCallback((ids: readonly string[]) => {
    setSelectedIds(previous => removeManyFromSet(previous, ids))
    setManuallyDeselectedIds(previous => addManyToSet(previous, ids))
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
    removeSelection,
  }
}
